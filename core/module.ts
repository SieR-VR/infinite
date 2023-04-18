import { Node, ParseRule, ParseRuleElement } from "./parser";
import { Evaluate } from "./interpreter";

export interface TokenizeRule {
    tokenType: string;
    regex: RegExp;
}

export interface Module<ParserContext = any, EvalContext = any, NodeType extends Node = Node> {
    role: string;
    priority: number;
    name: string;
    tokenizeRules: TokenizeRule[];
    parseRuleList?: ParseRuleElement[];
    parseRule?: ParseRule<ParserContext, NodeType>;
    evaluate: Evaluate<EvalContext, NodeType>;
}