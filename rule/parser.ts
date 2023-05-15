import { Ok, Err, Result } from "ts-features";
import { ParseRule, Node, ParseRuleGetter, ParseError } from "../core/parser";
import { Token } from "../core/tokenizer"

import { HighlightTokenTypes } from "./tokenizer";

interface ParseRuleToken {
    tokenType: string;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenTypes;

    key?: never;
    role?: never;
    condition?: never;
    parseRule?: never;
}

interface ParseRuleCondition {
    key: string;
    role: string;
    condition: (p: ParseRuleOptions<string>) => boolean;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenTypes;

    tokenType?: never;
    parseRule?: never;
}

interface ParseRuleFunction {
    key: string;
    parseRule: ParseRule<any, Node>;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenTypes;

    role?: never;
    tokenType?: never;
    condition?: never;
}


type ParseRuleElement = ParseRuleToken | ParseRuleCondition | ParseRuleFunction;

export interface ParseRuleOptions<NodeTypeString extends string> {
    role: string;
    nodeType: NodeTypeString;
    priority: number;
    isTopLevel?: boolean;
}

export interface ParseRuleModule<ParserContext, NodeType extends Node, NodeTypeString extends string> {
    role: string;
    nodeType: NodeTypeString;
    priority: number;
    isTopLevel: boolean;
    parseRule: ParseRule<ParserContext, NodeType>;
}

type AssembleElements<CurrentKey extends string, TargetNode, RestElements extends ParseRuleElement[]> =
    {
        [key in (CurrentKey | keyof BaseNodeFromElements<RestElements>)]: 
            key extends CurrentKey ?
                TargetNode :
            key extends keyof BaseNodeFromElements<RestElements> ?
                BaseNodeFromElements<RestElements>[key] :
                never;
    }

type BaseNodeFromElements<Elements extends readonly ParseRuleElement[]> = 
    Elements extends readonly [infer First, ...infer Rest] ?
        Rest extends ParseRuleElement[] ?
            First extends ParseRuleToken ?
                BaseNodeFromElements<Rest> :
            First extends ParseRuleCondition ?
                First["isRepeatable"] extends true ?
                    AssembleElements<First["key"], Node[], Rest> :
                    AssembleElements<First["key"], Node, Rest> :
            First extends ParseRuleFunction ?
                First["isRepeatable"] extends true ?
                    AssembleElements<First["key"], Node[], Rest> :
                    AssembleElements<First["key"], Node, Rest> :
            never :
        never :
    {};

export type NodeFromElements<Elements extends readonly ParseRuleElement[]> =
    {
        [key in (keyof Node | keyof BaseNodeFromElements<Elements>)]:
            key extends keyof BaseNodeFromElements<Elements> ?
                BaseNodeFromElements<Elements>[key] :
            key extends keyof Node ?
                Node[key] :
                never;
    }

export function makeParseRuleModule<Elements extends readonly ParseRuleElement[], ParserContext = any, NodeTypeString extends string = string>(options: ParseRuleOptions<NodeTypeString>, rules: Elements)
    : NodeFromElements<Elements> extends Node ? 
        ParseRuleModule<ParserContext, NodeFromElements<Elements>, NodeTypeString> :
        never
{
    const module: ParseRule<ParserContext, Node> = (tokens, index, getRule, semanticHighlight) => {
        const node: Node = {
            nodeType: options.nodeType,
            innerText: "",
            
            startPos: tokens[index].startPos,
            endPos: tokens[index].endPos,
            
            semanticHighlight,
            children: [],
        };
        const errors: ParseError[] = [];
        
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

                return Err([[{
                    level: determined ? "error" : "warning",
                    expected: rule.tokenType,
                    actual: tokens[nextIndex].tokenType,
                    startPos: tokens[nextIndex].startPos,
                    endPos: tokens[nextIndex].endPos,
                }], index]);
            }

            if (isParseRuleCondition(rule) || isParseRule(rule)) {
                const parseWithFunc = isParseRuleCondition(rule) 
                    ? parseWithCondition 
                    : parseWithParseRule;

                if (rule.isRepeatable) {
                    const result = parseRepeatableWith(tokens, nextIndex, getRule, parseWithFunc as any, rule);
                    if (result.is_ok()) {
                        const [childNodes, childIndex] = result.unwrap();

                        node.children.push(childNodes);
                        node.innerText += childNodes.map(node => node.innerText).join("");
                        node.endPos = tokens[childIndex].endPos;
                        (node as any)[rule.key] = childNodes;

                        nextIndex = childIndex;
                        if (rule.determinedBy) {
                            determined = true;
                        }

                        continue;
                    }

                    errors.push(...result.unwrap_err()[0]);
                    continue;
                }
                else {
                    const result = parseWith(tokens, nextIndex, getRule, parseWithFunc as any, rule);
                    if (result.is_ok()) {
                        const [childNode, childIndex] = result.unwrap();

                        node.children.push(childNode);
                        node.innerText += childNode.innerText;
                        node.endPos = childNode.endPos;
                        (node as any)[rule.key] = childNode;

                        nextIndex = childIndex;
                        if (rule.determinedBy) {
                            determined = true;
                        }

                        continue;
                    }
                    else if (rule.isOptional) {
                        continue;
                    }

                    const [error, index] = result.unwrap_err();

                    return Err([[...errors, ...error], index]);
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
    } as any;
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
    ) => Result<[Node, number], [ParseError[], number]>,
    rule: T
): Result<[Node[], number], [ParseError[], number]> {
    const child: Node[] = [];
    const errors: ParseError[] = [];

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

        errors.push(...result.unwrap_err()[0]);
        break;
    }

    if (child.length === 0) {
        return Err([errors, nextIndex]);
    }
    else {
        return Ok([child, nextIndex]);
    }
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
    ) => Result<[Node, number], [ParseError[], number]>,
    rule: T
): Result<[Node, number], [ParseError[], number]> {
    const result = parseWithFunc(tokens, nextIndex, getRule, rule);
    return result;
}

function parseWithCondition(tokens: Token[], nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleCondition): Result<[Node, number], [ParseError[], number]> {
    const result = getRule(rule.role, rule.condition)(tokens, nextIndex, getRule, rule.semanticHighlight);

    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }

    return result;
}

function parseWithParseRule(tokens: Token[], nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleFunction): Result<[Node, number], [ParseError[], number]> {
    const result = rule.parseRule(tokens, nextIndex, getRule, rule.semanticHighlight);

    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }

    return result;
}