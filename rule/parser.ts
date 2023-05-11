import { Ok, Err, Result } from "ts-features";
import { ParseRule, Node, ParseRuleGetter, ParseError } from "core/parser";
import { Token } from "core/tokenizer"

interface ParseRuleToken {
    tokenType: string;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;

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
    determinedBy?: boolean;

    tokenType?: never;
    parseRule?: never;
}

interface ParseRuleFunction {
    key: string;
    parseRule: ParseRule<any, Node>;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;

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
        let determined = false;

        for (const rule of rules) {
            if (isParseRuleToken(rule)) {
                if (rule.tokenType === tokens[nextIndex].tokenType) {
                    node.innerText += tokens[nextIndex].innerString;
                    nextIndex++;
                    
                    if (rule.determinedBy) {
                        determined = true;
                    } 

                    continue;
                }

                return Err([{
                    level: determined ? "error" : "warning",
                    expected: rule.tokenType,
                    actual: tokens[nextIndex].tokenType,
                    startPos: tokens[nextIndex].startPos,
                    endPos: tokens[nextIndex].endPos,
                }, determined ? nextIndex : index]);
            }

            if (isParseRuleCondition(rule) || isParseRule(rule)) {
                const parseWithFunc = isParseRuleCondition(rule) ? parseWithCondition : parseWithParseRule;

                if (rule.isRepeatable) {
                    const result = parseRepeatableWith(tokens, nextIndex, getRule, parseWithFunc, rule);
                    if (result.is_ok()) {
                        const [childNodes, childIndex] = result.unwrap();

                        node.children.push(childNodes);
                        node.innerText += childNodes.map(node => node.innerText).join("");
                        node.endPos = tokens[childIndex].endPos;
                        node[rule.key] = childNodes;

                        nextIndex = childIndex;
                        if (rule.determinedBy) {
                            determined = true;
                        }

                        continue;
                    }

                    return Err(result.unwrap_err());
                }
                else {
                    const result = parseWith(tokens, nextIndex, getRule, parseWithFunc, rule);
                    if (result.is_ok()) {
                        const [childNode, childIndex] = result.unwrap();

                        node.children.push(childNode);
                        node.innerText += childNode.innerText;
                        node.endPos = childNode.endPos;
                        node[rule.key] = childNode;

                        nextIndex = childIndex;
                        if (rule.determinedBy) {
                            determined = true;
                        }

                        continue;
                    }
                    else if (rule.isOptional) {
                        continue;
                    }

                    return Err(result.unwrap_err());
                }
            }

            throw new Error(`Invalid parse rule: ${rule}/${options.nodeType}`);
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

function parseRepeatableWith<T extends ParseRuleElement>(
    tokens: Token[],
    nextIndex: number,
    getRule: ParseRuleGetter<any>,
    parseWithFunc: (
        tokens: Token[],
        nextIndex: number,
        getRule: ParseRuleGetter<any>,
        rule: T
    ) => Result<[Node, number], [ParseError, number]>,
    rule: T
): Result<[Node[], number], [ParseError, number]> {
    const child: Node[] = [];

    while (true) {
        const result = parseWithFunc(tokens, nextIndex, getRule, rule);
        if (result.is_ok()) {
            const [childNode, childIndex] = result.unwrap();
            if (childNode) {
                child.push(childNode);
                nextIndex = childIndex;

                continue;
            }
        }

        break;
    }

    return Ok([child, nextIndex]);
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
    ) => Result<[Node, number], [ParseError, number]>,
    rule: T
): Result<[Node, number], [ParseError, number]> {
    const result = parseWithFunc(tokens, nextIndex, getRule, rule);
    return result;
}

function parseWithCondition(tokens: Token[], nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleCondition): Result<[Node, number], [ParseError, number]> {
    const result = getRule(rule.role, rule.condition)(tokens, nextIndex, getRule);

    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }

    return result;
}

function parseWithParseRule(tokens: Token[], nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleFunction): Result<[Node, number], [ParseError, number]> {
    const result = rule.parseRule(tokens, nextIndex, getRule);

    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }

    return result;
}