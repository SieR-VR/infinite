import { ParseRule } from "./parser";
import { Evaluate } from "./interpreter";

export interface TokenizeRule {
    tokenType: string;
    regex: RegExp;
}

export interface Role {
    type: string;
}

export class Token implements Role {
    type: "token";
    constructor(public tokenType: string) {}
}

export class Expression implements Role {
    type: "expression"
    constructor() {}
}

export interface Module<ParserContext = any, EvalContext = any> {
    role: string;
    priority: number;
    name: string;
    tokenizeRules: TokenizeRule[];
    parseRule: ParseRule<ParserContext>;
    evaluate: Evaluate<EvalContext>;
}