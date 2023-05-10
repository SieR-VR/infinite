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

export type ParseRule<ParserContext, NodeType extends Node> = (
    tokens: Token[],
    index: number,
    getRule: ParseRuleGetter<ParserContext>,
    context?: ParserContext
) => Result<[NodeType, number], string>;

export type ParseRuleGetter<ParserContext> = (role: string, condition?: (p: ParseRuleModule<ParserContext>) => boolean) => ParseRule<ParserContext, Node>;

export function parse<ParserContext = any>(input: ParserInput, parsers: ParseRuleModule<ParserContext>[], makeContext: () => ParserContext): Node[] {
    const { tokens, fileName } = input;
    const nodes: Node[] = [];
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
                for (const module of filteredModules) {
                    const result = module.parseRule(tokens, index, getRule, context);
                    if (result.is_ok()) {
                        return result;
                    }
                }

                return Err(`Unexpected token ${JSON.stringify(tokens[index])} at ${fileName}:${tokens[index].startPos}-${tokens[index].endPos}`);
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
        }

        if (!matched) {
            throw new Error(`Unexpected token ${tokens[index].tokenType} at ${fileName}:${tokens[index].startPos}-${tokens[index].endPos}`);
        }
    }

    return nodes;
}

