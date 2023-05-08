import { Ok, Err, Result } from "ts-features";
import { ParseRule, Node, ParseRuleGetter } from "core/parser";
import { Token } from "core/tokenizer";
import { convertToObject } from "typescript";

interface ParseRuleToken {
    tokenType: string;

    isRepeatable?: boolean;
    isOptional?: boolean;

    key?: never;
    role?: never;
    condition?: never;
    parseRule?: never;
}

interface ParseRuleCondition {
    key: string;
    role: string;
    condition: (p: ParseRuleOptions) => boolean;

    isRepeatable?: boolean;
    isOptional?: boolean;

    tokenType?: never;
    parseRule?: never;
}

interface ParseRuleFunction {
    key: string;
    parseRule: ParseRule<any, Node>;

    isRepeatable?: boolean;
    isOptional?: boolean;

    role?: never;
    tokenType?: never;
    condition?: never;
}

type ParseRuleElement = ParseRuleToken | ParseRuleCondition | ParseRuleFunction;

export interface ParseRuleOptions {
    role: string;
    nodeType: string;
    priority: number;
    isTopLevel?: boolean;
}

export interface ParseRuleModule<ParserContext> {
    role: string;
    nodeType: string;
    priority: number;
    isTopLevel: boolean;
    parseRule: ParseRule<ParserContext, Node>;
}

export function makeParseRuleModule(options: ParseRuleOptions, rules: ParseRuleElement[]): ParseRuleModule<any> {
    const module: ParseRule<any, Node> = (tokens, index, getRule) => {
        const node: Node = {
            nodeType: options.nodeType,
            innerText: "",

            startPos: tokens[index].startPos,
            endPos: tokens[index].endPos,

            children: [],
        };
        let nextIndex = index;

        for (const rule of rules) {
            if (isParseRuleToken(rule)) {
                if (rule.tokenType === tokens[nextIndex].tokenType) {
                    node.innerText += tokens[nextIndex].innerString;
                    nextIndex++;
                    continue;
                }

                return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
            }

            if (isParseRuleCondition(rule)) {
                const result = parseWith(tokens, nextIndex, getRule, parseWithCondition, rule);
                if (result.is_ok()) {
                    const [childNode, childIndex] = result.unwrap();

                    if (!childNode)
                        continue;

                    node.children.push(childNode as Node);
                    node.innerText += (childNode as Node).innerText;
                    node.endPos = (childNode as Node).endPos;
                    node[rule.key] = childNode as any;
                    
                    nextIndex = childIndex;
                    continue;
                }
                else if (rule.isRepeatable) {
                    continue;
                }

                return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
            }

            if (isParseRule(rule)) {
                const result = parseWith(tokens, nextIndex, getRule, parseWithParseRule, rule);
                if (result.is_ok()) {
                    const [childNode, childIndex] = result.unwrap();

                    if (!childNode)
                        continue;

                    node.children.push(childNode as Node);
                    node.innerText += (childNode as Node).innerText;
                    node.endPos = (childNode as Node).endPos;
                    node[rule.key] = childNode as any;
                    
                    nextIndex = childIndex;
                    continue;
                }
                else if (rule.isRepeatable) {
                    continue;
                }

                return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
            }

            return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
        }

        return Ok([node, nextIndex]);
    }

    return {
        ...options,
        isTopLevel: options.isTopLevel ?? false,
        parseRule: module,
    };
}

function isParseRuleToken(rule: ParseRuleElement): rule is ParseRuleToken {
    return "tokenType" in rule;
}

function isParseRuleCondition(rule: ParseRuleElement): rule is ParseRuleCondition {
    return "condition" in rule;
}

function isParseRule(rule: ParseRuleElement): rule is ParseRuleFunction {
    return "parseRule" in rule;
}

function parseWith<T extends ParseRuleElement>(
    tokens: Token[],
    nextIndex: number,
    getRule: ParseRuleGetter<any>,
    parseWithFunc: (
        tokens: Token[],
        nextIndex: number,
        getRule: ParseRuleGetter<any>,
        rule: T
    ) => Result<[Node, number], string>,
    rule: T
): Result<[Node | Node[], number], string> {
    const child: Node[] = [];

    do {
        const result = parseWithFunc(tokens, nextIndex, getRule, rule);
        if (result.is_ok()) {
            const [childNode, childIndex] = result.unwrap();
            if (childNode) {
                child.push(childNode);
                nextIndex = childIndex;

                continue;
            }
            else {
                break;
            }
        }

        if (rule.isRepeatable) {
            break;
        }

        return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
    }
    while (rule.isRepeatable);

    if (child.length === 0 && rule.isOptional) {
        return Ok([null, nextIndex]);
    }

    if (child.length === 1 && !rule.isRepeatable) {
        return Ok([child[0], nextIndex]);
    }

    return Ok([child, nextIndex]);
}

function parseWithCondition(tokens: Token[], nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleCondition): Result<[Node, number], string> {
    const result = getRule(rule.role, rule.condition)(tokens, nextIndex, getRule);
    
    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }
    else if (rule.isOptional) {
        return Ok([null, nextIndex])
    }

    return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
}

function parseWithParseRule(tokens: Token[], nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleFunction): Result<[Node, number], string> {
    const result = rule.parseRule(tokens, nextIndex, getRule);
    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }
    else if (rule.isOptional) {
        return Ok([null, nextIndex])
    }

    return Err(`Unexpected token ${JSON.stringify(tokens[nextIndex])} at ${tokens[nextIndex].startPos}-${tokens[nextIndex].endPos}`);
}