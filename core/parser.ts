import { Result, Ok, Err } from "ts-features";

import { Token } from "../core/tokenizer";
import { ParseRuleModule } from "../rule/parser";

export interface ParserInput {
    tokens: Token[];
    fileName: string;
}

export interface Node {
    nodeType: string;
    innerText: string;

    startPos: number;
    endPos: number;

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
    tokens: Token[],
    index: number,
    getRule: ParseRuleGetter<ParserContext>,
    context?: ParserContext
) => Result<[NodeType, number], [ParseError[], number]>;

export type ParseRuleGetter<ParserContext> = (role: string, condition?: (p: ParseRuleModule<ParserContext>) => boolean) => ParseRule<ParserContext, Node>;

export function parse<ParserContext = any>(input: ParserInput, parsers: ParseRuleModule<ParserContext>[], makeContext: () => ParserContext): Result<Node[], ParseError[]> {
    const { tokens, fileName } = input;
    const nodes: Node[] = [];
    const errors: ParseError[] = [];

    const context = makeContext();

    const modulesSortedByPriority = parsers.sort((a, b) => a.priority - b.priority);
    const modulesCanAppearInTopLevel = modulesSortedByPriority.filter(m => m.isTopLevel);

    const getRuleMap = (() => {
        const rawMap = new Map<string, ParseRuleModule<ParserContext>[]>();

        for (const module of modulesSortedByPriority) {
            const { role } = module;
            const rules = rawMap.get(role) || [];
            rules.push(module);
            rawMap.set(role, rules);
        }

        const map = new Map<string, (condition: (module: ParseRuleModule<ParserContext>) => boolean) => ParseRule<ParserContext, Node>>();

        for (const [role, modules] of rawMap) {
            map.set(role, (condition: (module: ParseRuleModule<ParserContext>) => boolean) => (tokens, index, getRule) => {
                const filteredModules = modules.filter(condition);
                const failResults: ParseError[] = [];

                if (filteredModules.length === 0) {
                    throw new Error(`No rule for role ${role} found`);
                }

                for (const module of filteredModules) {
                    const result = module.parseRule(tokens, index, getRule, context);
                    if (result.is_ok()) {
                        return result;
                    }

                    const [failResultsScope] = result.unwrap_err();
                    failResults.push(...(failResultsScope.map(failResult => ({
                        ...failResult,
                        tried: failResult.tried ? failResult.tried.map((s) => `${s}/${module.nodeType}`) : [module.nodeType],
                    }))));
                }

                return Err([failResults, index]);
            });
        }

        return map;
    })();


    const getRule = (role: string, condition?: (module: ParseRuleModule<ParserContext>) => boolean): ParseRule<ParserContext, Node> => {
        const rule = getRuleMap.get(role);
        if (!rule) {
            throw new Error(`Rule for role ${role} not found`);
        }
        return rule(condition || (() => true));
    }

    let index = 0;
    while (index < tokens.length) {
        let matched = false;
        const scopeErrors: ParseError[] = [];

        for (const module of modulesCanAppearInTopLevel) {
            const result = module.parseRule(tokens, index, getRule, context);
            if (result.is_ok()) {
                const [node, nextIndex] = result.unwrap();
                nodes.push(node);
                index = nextIndex;
                matched = true;
                break;
            }
            else {
                const [error, nextIndex] = result.unwrap_err();
                
                if (error[error.length - 1].level === "critical")
                    return Err(error);

                index = nextIndex;
                scopeErrors.push(...error);

                continue;
            }
        }

        if (!matched) {
            if (scopeErrors.length) {
                errors.push(...scopeErrors);
            }

            return Err(errors);
        }
    }

    if (errors.length) {
        return Err(errors);
    }

    return Ok(nodes);
}

