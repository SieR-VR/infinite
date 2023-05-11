import { Result, Ok, Err } from "ts-features";

import { Token } from "core/tokenizer";
import { ParseRuleModule } from "rule/parser";

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
) => Result<[NodeType, number], [ParseError, number]>;

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
                const failResults: [ParseError, number][] = [];

                if (filteredModules.length === 0) {
                    throw new Error(`No rule for role ${role} found`);
                }

                for (const module of filteredModules) {
                    const result = module.parseRule(tokens, index, getRule, context);
                    if (result.is_ok()) {
                        return result;
                    }

                    failResults.push(result.unwrap_err());
                }

                return Err([{
                    level: "error",
                    tried: filteredModules.map(m => m.nodeType),
                    startPos: tokens[index].startPos,
                    endPos: tokens[index].endPos,
                }, index + 1]);
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
                
                if (error.level === "critical")
                    return Err([error]);

                index = nextIndex;
                errors.push(error);

                matched = true;
                break;
            }
        }

        if (!matched) {
            return Err([{
                level: "critical",
                startPos: tokens[index].startPos,
                endPos: tokens[index].endPos,
            }]);
        }
    }

    return Ok(nodes);
}

