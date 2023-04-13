import { Result, Err } from "ts-features";

import { Module } from "./module";
import { Token } from "./tokenizer";

export interface ParserInput {
    tokens: Token[];
    fileName: string;
}

export interface ParserOptions {
    modules?: Module[];
}

export interface Node {
    nodeType: string;
    value?: any;

    children?: Node[];
}

export type ParseRule = (tokens: Token[], index: number, getRule: ParseRuleGetter) => Result<ParseRuleResult, string>;
export type ParseRuleGetter = (role: string) => ParseRule;

export interface ParseRuleResult {
    node: Node;
    index: number;
}

export function parse(input: ParserInput, options: ParserOptions = {}): Node[] {
    const { tokens, fileName } = input;
    const { modules = [] } = options;

    const parseRules = modules.map(module => module.parseRule);
    const nodes: Node[] = [];

    const modulesSortedByPriority = modules.sort((a, b) => a.priority - b.priority);
    const getRuleMap = (() => {
        const rawMap = new Map<string, ParseRule[]>();

        for (const module of modulesSortedByPriority) {
            const { role } = module;
            const rules = rawMap.get(role) || [];
            rules.push(module.parseRule);
            rawMap.set(role, rules);
        }

        const map = new Map<string, ParseRule>();
        for (const [role, rules] of rawMap) {
            map.set(role, (tokens, index, getRule) => {
                for (const rule of rules) {
                    const result = rule(tokens, index, getRule);
                    if (result.is_ok()) {
                        return result;
                    }
                }
                return Err(`Unexpected token at ${fileName}:${index}`);
            });
        }

        return map;
    })();


    const getRule = (role: string): ParseRule => {
        const rule = getRuleMap.get(role);
        if (!rule) {
            throw new Error(`Rule for role ${role} not found`);
        }
        return rule;
    }

    let index = 0;
    while (index < tokens.length) {
        let matched = false;
        for (const rule of parseRules) {
            const result = rule(tokens, index, getRule);
            if (result.is_ok()) {
                const { node, index: nextIndex } = result.unwrap();
                nodes.push(node);
                index = nextIndex;
                matched = true;
                break;
            }
        }
        if (!matched) {
            throw new Error(`Unexpected token at ${fileName}:${index}`);
        }
    }

    return nodes;
}