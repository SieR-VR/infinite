import { Result, Ok, Err } from "ts-features";

import type { Token } from "../core/tokenizer";
import type { ParseRuleModule } from "../rule/parser";

export interface ParserInput {
    tokens: Token[];
    fileName: string;
}

export interface Node {
    nodeType: string;
    innerText: string;
    
    startPos: number;
    endPos: number;
    
    semanticHighlight?: HighlightTokenTypes;
    children: (Node | Node[])[];
}

export interface ParseError {
    level: "critical" | "error" | "warning";

    tried?: string[];
    expected?: string;
    actual?: string;

    startPos: number;
    endPos: number;
}

export type ParseRule<ParserContext, NodeType extends Node> = (
    input: ParserInput,
    index: number,
    getRule: ParseRuleGetter<ParserContext>,
    semanticHighlight?: HighlightTokenTypes,
    context?: ParserContext
) => Result<[NodeType, number], [ParseError[], number]>;

export type ParseRuleGetter<ParserContext> = (
    condition: ParseRuleCondition<ParserContext>
) => ParseRule<ParserContext, Node>;

export type ParseRuleCondition<ParserContext> = (
    module: ParseRuleModule<ParserContext, Node, string>
) => boolean;

export function parse<ParserContext = any>(input: ParserInput, parsers: ParseRuleModule<ParserContext, Node, string>[], makeContext: () => ParserContext): Result<Node[], ParseError[]> {
    const topLevelNodes: Node[] = [];
    const topLevelErrors: ParseError[] = [];

    const modulesSortedByPriority = parsers.sort((a, b) => a.priority - b.priority);
    const modulesCanAppearInTopLevel = modulesSortedByPriority.filter(m => m.isTopLevel);

    const getRule: ParseRuleGetter<ParserContext> = (condition) => {
        const modules = modulesSortedByPriority.filter(m => condition(m));

        if (!modules.length) {
            throw new Error(`No module matches the condition. Maybe it is parser issue.`);
        }

        return applyModuleMatches(modules);
    }

    const context = makeContext();

    let index = 0;
    while (index < input.tokens.length) {
        let matched = false;
        const scopeErrors: ParseError[] = [];

        for (const module of modulesCanAppearInTopLevel) {
            const result = module.parseRule(input, index, getRule, context);
            if (result.is_ok()) {
                const [node, nextIndex] = result.unwrap();
                topLevelNodes.push(node);
                index = nextIndex;
                matched = true;
                break;
            }
            else {
                const [error, nextIndex] = result.unwrap_err();

                index = nextIndex;
                scopeErrors.push(...error);

                continue;
            }
        }

        if (!matched) {
            if (scopeErrors.length) {
                topLevelErrors.push(...scopeErrors);
            }

            return Err(topLevelErrors);
        }
    }

    if (topLevelErrors.length) {
        return Err(topLevelErrors);
    }

    return Ok(topLevelNodes);
}

function applyModuleMatches<ParserContext>(
    modules: ParseRuleModule<ParserContext, Node, string>[],
): ParseRule<ParserContext, Node> {
    return (
        input: ParserInput,
        index: number,
        getRule: ParseRuleGetter<ParserContext>, 
        context?: ParserContext
    ) => {
        const failResults: ParseError[] = [];

        for (const module of modules) {
            const result = module.parseRule(input, index, getRule, context);
            if (result.is_ok()) {
                return result;
            }

            const [scopeFailResults] = result.unwrap_err();

            failResults.push(...(scopeFailResults.map(failResult => ({
                ...failResult,
                tried: failResult.tried ? triedPaths(module.nodeType)(failResult.tried) : [module.nodeType],
            }))));
        }

        return Err([failResults, index]);
    }

    function triedPaths(current: string): (detail: string[]) => string[] {
        return (paths: string[]) => paths.map(path => `${current}/${path}`);
    }
}