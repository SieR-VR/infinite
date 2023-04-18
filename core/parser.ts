import { Result, Ok,  Err } from "ts-features";

import { Module } from "./module";
import { Token } from "./tokenizer";

export interface ParserInput {
    tokens: Token[];
    fileName: string;
}

export interface ParserOptions<ParserContext = any> {
    modules?: Module<any, any, any>[];
    context?: ParserContext;
}

export interface Node {
    nodeType: string;
    children: Node[];
    value?: any;
}

export interface ParseRuleElement {
    role: string;
    key?: string;
    condition?: (p: Module) => boolean;
    isToken?: boolean;
    isOptional?: boolean;
    isRepeatable?: boolean;
}

export type ParseRule<ParserContext, NodeType extends Node> = (
    tokens: Token[],
    index: number,
    getRule: ParseRuleGetter<ParserContext>,
    context?: ParserContext
) => Result<ParseRuleResult<NodeType>, string>;
export type ParseRuleGetter<ParserContext> = (role: string, priorityCondition?: (p: Module) => boolean) => ParseRule<ParserContext, Node>;

export interface ParseRuleResult<NodeType extends Node> {
    node: NodeType;
    index: number;
}

export function parse<ParserContext = any>(input: ParserInput, options: ParserOptions<ParserContext>): Node[] {
    const { tokens, fileName } = input;
    const { modules: modulesRaw = [], context } = options;

    const modules = modulesRaw.map(module => {
        const { parseRuleList } = module;
        if (parseRuleList) {
            const parseRuleElements = parseRuleList;
            const parseRuleFunction: ParseRule<ParserContext, Node> = (tokens: Token[], index: number, getRule: ParseRuleGetter<ParserContext>, context?: ParserContext) => {
                const node: Node = {
                    nodeType: module.name,
                    children: [],
                };
                let nextIndex = index;

                for (const parseRuleElement of parseRuleElements) {
                    const { role, key, condition, isToken, isOptional, isRepeatable } = parseRuleElement;

                    if (isToken) {
                        if (tokens[nextIndex].tokenType !== role) {
                            if (isOptional) {
                                continue;
                            }
                            return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${fileName}:${nextIndex}`);
                        }
                        else {
                            nextIndex++;
                            continue;
                        }
                    }

                    if (isRepeatable) {
                        const results: Node[] = [];

                        while (true) {
                            const result = getRule(role, condition)(tokens, nextIndex, getRule, context);
                            if (result.is_ok()) {
                                const { node: childNode, index: childIndex } = result.unwrap();
                                node.children.push(childNode);
                                results.push(childNode);
                                nextIndex = childIndex;
                            }
                            else {
                                break;
                            }
                        }

                        if (!isOptional && results.length === 0) {
                            return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${fileName}:${nextIndex}`);
                        }

                        node[key] = results;
                        continue;
                    }

                    const result = getRule(role, condition)(tokens, nextIndex, getRule, context);
                    if (result.is_ok()) {
                        const { node: childNode, index: childIndex } = result.unwrap();
                        node.children.push(childNode);
                        node[key] = childNode;
                        nextIndex = childIndex;
                    }
                    else if (isOptional) {
                        continue;
                    }
                }

                return Ok({ node, index: nextIndex });
            };
            return {
                ...module,
                parseRule: parseRuleFunction,
            };
        }

        return module;
    });

    const topLevelParseRules = modules
        // .filter(module => module.role === "statement")
        .map(module => module.parseRule);
    const nodes: Node[] = [];

    const modulesSortedByPriority = modules.sort((a, b) => a.priority - b.priority);
    const getRuleMap = (() => {
        const rawMap = new Map<string, Module[]>();

        for (const module of modulesSortedByPriority) {
            const { role } = module;
            const rules = rawMap.get(role) || [];
            rules.push(module);
            rawMap.set(role, rules);
        }

        const map = new Map<string, (condition: (module: Module) => boolean) => ParseRule<ParserContext, Node>>();
        for (const [role, modules] of rawMap) {
            map.set(role, (condition: (module: Module) => boolean) => (tokens, index, getRule) => {
                const filteredModules = modules.filter(condition);
                for (const module of filteredModules) {
                    const result = module.parseRule(tokens, index, getRule, options.context);
                    if (result.is_ok()) {
                        return result;
                    }
                }
                return Err(`Unexpected token ${JSON.stringify(tokens[index])} at ${fileName}:${index}`);
            });
        }

        return map;
    })();


    const getRule = (role: string, condition?: (module: Module) => boolean): ParseRule<ParserContext, Node> => {
        const rule = getRuleMap.get(role);
        if (!rule) {
            throw new Error(`Rule for role ${role} not found`);
        }
        return rule(condition || (() => true));
    }

    let index = 0;
    while (index < tokens.length) {
        let matched = false;

        for (const rule of topLevelParseRules) {
            const result = rule(tokens, index, getRule, context);
            if (result.is_ok()) {
                const { node, index: nextIndex } = result.unwrap();
                nodes.push(node);
                index = nextIndex;
                matched = true;
                break;
            }
        }
        if (!matched) {
            throw new Error(`Unexpected token ${tokens[index].innerString} at ${fileName}:${index}`);
        }
    }

    return nodes;
}