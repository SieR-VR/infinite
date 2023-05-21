import { Ok, Err, Result } from "ts-features";

import type { ParseRule, Node, ParseRuleGetter, ParseError, ParserInput } from "../core/parser";
import type { Token } from "../core/tokenizer"

import type { HighlightTokenType } from "./tokenizer";
import { Equals } from "./util";

interface ParseRuleToken {
    tokenType: string;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenType;

    key?: never;
    role?: never;
    condition?: never;
    parseRule?: never;
    composition?: never;
}

interface ParseRuleCondition<RoleString extends string = string, NodeTypeString extends string = string>{
    key: string;
    role: RoleString;
    nodeType: NodeTypeString;
    condition: (p: ParseRuleOptions<RoleString, NodeTypeString>) => boolean;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenType;

    tokenType?: never;
    parseRule?: never;
    composition?: never;
}

interface ParseRuleFunction {
    key: string;
    parseRule: ParseRule<any, Node>;

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenType;

    role?: never;
    tokenType?: never;
    condition?: never;
    composition?: never;
}

interface ParseRuleComposite {
    key: string;
    composition: readonly ParseRuleElement[];

    isRepeatable?: boolean;
    isOptional?: boolean;
    determinedBy?: boolean;
    semanticHighlight?: HighlightTokenType;

    role?: never;
    tokenType?: never;
    condition?: never;
    parseRule?: never;
}

type ParseRuleElement = ParseRuleToken | ParseRuleCondition | ParseRuleFunction | ParseRuleComposite;

export interface ParseRuleOptions<RoleString extends string, NodeTypeString extends string> {
    role: RoleString;
    nodeType: NodeTypeString;
    priority: number;
    isTopLevel?: boolean;
}

export interface ParseRuleModule<ParserContext, NodeType extends Node, RoleString extends string, NodeTypeString extends string> {
    role: RoleString;
    nodeType: NodeTypeString;
    priority: number;
    isTopLevel: boolean;
    parseRule: ParseRule<ParserContext, NodeType>;
}

type AssembleElements<Modules extends readonly ParseRuleModule<any, any, any, any>[], CurrentKey extends string, TargetNode, RestElements extends ParseRuleElement[]> =
    {
        [key in (CurrentKey | keyof BaseNodeFromElements<Modules, RestElements>)]: 
            key extends CurrentKey ?
                TargetNode :
            key extends keyof BaseNodeFromElements<Modules, RestElements> ?
                BaseNodeFromElements<Modules, RestElements>[key] :
                never;
    };

type BaseNodeFromElements<Modules extends readonly ParseRuleModule<any, any, any, any>[], Elements extends readonly ParseRuleElement[]> = 
    Elements extends readonly [infer First, ...infer Rest] ?
        Rest extends ParseRuleElement[] ?
            First extends ParseRuleToken ?
                BaseNodeFromElements<Modules, Rest> :
            First extends ParseRuleCondition ?
                First["isRepeatable"] extends true ?
                    AssembleElements<Modules, First["key"], SearchNodeWith<Modules, First["role"], First["nodeType"]>[], Rest> :
                    AssembleElements<Modules, First["key"], SearchNodeWith<Modules, First["role"], First["nodeType"]>, Rest> :
            First extends ParseRuleFunction ?
                First["isRepeatable"] extends true ?
                    AssembleElements<Modules, First["key"], Node[], Rest> :
                    AssembleElements<Modules, First["key"], Node, Rest> :
            First extends ParseRuleComposite ?
                First["isRepeatable"] extends true ?    
                    AssembleElements<Modules, First["key"], BaseNodeFromElements<Modules, First["composition"]>[], Rest> :
                    AssembleElements<Modules, First["key"], BaseNodeFromElements<Modules, First["composition"]>, Rest> :
            never :
        never :
    {};

type SerachNodeWithNodeType<Modules extends readonly ParseRuleModule<any, any, any, any>[], NodeTypeString extends string> =
    Modules extends readonly [infer First, ...infer Rest] ?
        First extends ParseRuleModule<any, infer NodeType, any, NodeTypeString> ?
            NodeType :
        Rest extends readonly ParseRuleModule<any, any, any, any>[] ?
            SerachNodeWithNodeType<Rest, NodeTypeString> :
        never :
    never;

type SearchNodeWithRole<Modules extends readonly ParseRuleModule<any, any, any, any>[], RoleString extends string> =
    Modules extends readonly [infer First, ...infer Rest] ?
        First extends ParseRuleModule<any, infer NodeType, infer Role, any> ?
            Role extends RoleString ?
                Rest extends readonly ParseRuleModule<any, any, any, any>[] ?
                NodeType | SearchNodeWithRole<Rest, RoleString> :
                never :
            never :
        never :
    never;

type SearchNodeWith<Modules extends readonly ParseRuleModule<any, any, any, any>[], RoleString extends string, NodeTypeString extends string = string> =
    Equals<string, NodeTypeString> extends false ?
        SerachNodeWithNodeType<Modules, NodeTypeString> :   
    RoleString extends string ?
        SearchNodeWithRole<Modules, RoleString> :
    never;

export type NodeFromElements<Modules extends readonly ParseRuleModule<any, any, any, any>[], Elements extends readonly ParseRuleElement[]> =
    {
        [key in (keyof Node | keyof BaseNodeFromElements<Modules, Elements>)]:
            key extends keyof BaseNodeFromElements<Modules, Elements> ?
                BaseNodeFromElements<Modules, Elements>[key] :
            key extends keyof Node ?
                Node[key] :
                never;
    }


export function makeParseRuleModule<
    Modules extends readonly ParseRuleModule<any, any, any, any>[], 
    Elements extends readonly ParseRuleElement[], 
    ParserContext = any, 
    RoleString extends string = string,
    NodeTypeString extends string = string
>(
    options: ParseRuleOptions<RoleString, NodeTypeString>, 
    rules: Elements
) : NodeFromElements<Modules, Elements> extends Node ? 
        ParseRuleModule<ParserContext, NodeFromElements<Modules, Elements>, RoleString, NodeTypeString> :
        never
{
    const module: ParseRule<ParserContext, Node> = (input, index, getRule, semanticHighlight) => {
        const node: Node = {
            nodeType: options.nodeType,
            innerText: "",
            
            startPos: input.tokens[index].startPos,
            endPos: input.tokens[index].endPos,
            
            semanticHighlight,
            children: [],
        };
        const errors: ParseError[] = [];
        
        let nextIndex = index;
        let determined = false;

        for (const rule of rules) {
            if (isParseRuleToken(rule)) {
                if (rule.tokenType === input.tokens[nextIndex].tokenType) {
                    node.innerText += input.tokens[nextIndex].innerString;
                    nextIndex++;
                    
                    if (rule.determinedBy) {
                        determined = true;
                    }

                    continue;
                }

                return Err([[{
                    level: determined ? "error" : "warning",
                    expected: rule.tokenType,
                    actual: input.tokens[nextIndex].tokenType,
                    startPos: input.tokens[nextIndex].startPos,
                    endPos: input.tokens[nextIndex].endPos,
                }], index]);
            }

            if (isParseRuleCondition(rule) || isParseRule(rule)) {
                const parseWithFunc = isParseRuleCondition(rule) 
                    ? parseWithCondition 
                    : parseWithParseRule;

                if (rule.isRepeatable) {
                    const result = parseRepeatableWith(input, nextIndex, getRule, parseWithFunc as any, rule);
                    if (result.is_ok()) {
                        const [childNodes, childIndex] = result.unwrap();

                        node.children.push(childNodes);
                        node.innerText += childNodes.map(node => node.innerText).join("");
                        node.endPos = input.tokens[childIndex].endPos;
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
                    const result = parseWith(input, nextIndex, getRule, parseWithFunc as any, rule);
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

            if (isParseRuleComposite(rule)) {
                const compositeModule = makeParseRuleModule({ 
                    nodeType: "__Composition", 
                    role: "__Composition",
                    priority: 0,
                    isTopLevel: false,
                }, rule.composition);

                if (rule.isRepeatable) {
                    const result = parseRepeatableWith(
                        input, 
                        nextIndex, 
                        getRule, 
                        (input, nextIndex, getRule, rule) => compositeModule
                        .parseRule(
                            input, 
                            nextIndex, 
                            getRule, 
                            rule.semanticHighlight
                        ), 
                        rule
                    );

                    if (result.is_ok()) {
                        if (result.is_ok()) {
                            const [childNodes, childIndex] = result.unwrap();
    
                            node.children.push(childNodes);
                            node.innerText += childNodes.map(node => node.innerText).join("");
                            node.endPos = input.tokens[childIndex].endPos;
                            (node as any)[rule.key] = childNodes;
    
                            nextIndex = childIndex;
                            if (rule.determinedBy) {
                                determined = true;
                            }
    
                            continue;
                        }
                    }

                    errors.push(...result.unwrap_err()[0]);
                    continue;
                }
                else {
                    const result = compositeModule.parseRule(input, nextIndex, getRule, semanticHighlight);

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

function isParseRuleComposite(rule: ParseRuleElement): rule is ParseRuleComposite {
    return "composition" in rule;
}

function parseRepeatableWith<T extends ParseRuleElement>(
    input: ParserInput,
    nextIndex: number,
    getRule: ParseRuleGetter<any>,
    parseWithFunc: (
        input: ParserInput,
        nextIndex: number,
        getRule: ParseRuleGetter<any>,
        rule: T
    ) => Result<[Node, number], [ParseError[], number]>,
    rule: T
): Result<[Node[], number], [ParseError[], number]> {
    const child: Node[] = [];
    const errors: ParseError[] = [];

    while (true) {
        const result = parseWithFunc(input, nextIndex, getRule, rule);
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
    input: ParserInput,
    nextIndex: number,
    getRule: ParseRuleGetter<any>,
    parseWithFunc: (
        input: ParserInput,
        nextIndex: number,
        getRule: ParseRuleGetter<any>,
        rule: T
    ) => Result<[Node, number], [ParseError[], number]>,
    rule: T
): Result<[Node, number], [ParseError[], number]> {
    const result = parseWithFunc(input, nextIndex, getRule, rule);
    return result;
}

function parseWithCondition(input: ParserInput, nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleCondition): Result<[Node, number], [ParseError[], number]> {
    const result = getRule((p) => (rule.condition(p) && p.role === rule.role))(input, nextIndex, getRule, rule.semanticHighlight);

    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }

    return result;
}

function parseWithParseRule(input: ParserInput, nextIndex: number, getRule: ParseRuleGetter<any>, rule: ParseRuleFunction): Result<[Node, number], [ParseError[], number]> {
    const result = rule.parseRule(input, nextIndex, getRule, rule.semanticHighlight);

    if (result.is_ok()) {
        const [childNode, childIndex] = result.unwrap();
        return Ok([childNode, childIndex]);
    }

    return result;
}