import { Result, Err } from "ts-features";

import { Module } from "./module";
import { Token } from "./tokenizer";

export interface ParserInput {
    tokens: Token[];
    fileName: string;
}

export interface ParserOptions<ParserContext = any> {
    modules?: Module[];
    context: ParserContext;
}

export interface Node {
    nodeType: string;
    value?: any;

    children: Node[];
}

export type ParseRule<ParserContext> = (
    tokens: Token[],
    index: number,
    getRule: ParseRuleGetter<ParserContext>,
    context: ParserContext
) => Result<ParseRuleResult, string>;
export type ParseRuleGetter<ParserContext> = (role: string, priorityCondition?: (p: Module) => boolean) => ParseRule<ParserContext>;

export interface ParseRuleResult {
    node: Node;
    index: number;
}

export function parse<ParserContext = any>(input: ParserInput, options: ParserOptions<ParserContext>): Node[] {
    const { tokens, fileName } = input;
    const { modules = [], context } = options;

    const topLevelParseRules = modules.filter(module => module.role === "statement").map(module => module.parseRule);
    const nodes: Node[] = [];

    const modulesSortedByPriority = modules.sort((a, b) => b.priority - a.priority);
    const getRuleMap = (() => {
        const rawMap = new Map<string, Module[]>();

        for (const module of modulesSortedByPriority) {
            const { role } = module;
            const rules = rawMap.get(role) || [];
            rules.push(module);
            rawMap.set(role, rules);
        }

        const map = new Map<string, (condition: (module: Module) => boolean) => ParseRule<ParserContext>>();
        for (const [role, modules] of rawMap) {
            map.set(role, (condition: (module: Module) => boolean) => (tokens, index, getRule) => {
                const filteredModules = modules.filter(condition);
                for (const module of filteredModules) {
                    const result = module.parseRule(tokens, index, getRule, options.context);
                    if (result.is_ok()) {
                        return result;
                    }
                }
                return Err(`Unexpected token at ${fileName}:${index}`);
            });
        }

        return map;
    })();


    const getRule = (role: string, condition?: (module: Module) => boolean): ParseRule<ParserContext> => {
        const rule = getRuleMap.get(role);
        if (!rule) {
            throw new Error(`Rule for role ${role} not found`);
        }
        return rule(condition || (() => true));
    }

    let index = 0;
    while (index < tokens.length) {
        let matched = false;
        let error = "";

        for (const rule of topLevelParseRules) {
            const result = rule(tokens, index, getRule, context);
            if (result.is_ok()) {
                const { node, index: nextIndex } = result.unwrap();
                nodes.push(node);
                index = nextIndex;
                matched = true;
                break;
            }

            console.log(result.unwrap_err());
        }
        if (!matched) {
            throw new Error(`Unexpected token ${tokens[index].innerString} at ${fileName}:${index}`);
        }
    }

    return nodes;
}