import { Result, Ok, Err } from "ts-features";
import type { Token, TokenizerInput } from "../core/tokenizer";

export type HighlightTokenType =
    | 'namespace'
    | 'class'
    | 'enum'
    | 'interface'
    | 'struct'
    | 'typeParameter'
    | 'type'
    | 'parameter'
    | 'variable'
    | 'property'
    | 'enumMember'
    | 'decorator'
    | 'event'
    | 'function'
    | 'method'
    | 'macro'
    | 'label'
    | 'comment'
    | 'string'
    | 'keyword'
    | 'number'
    | 'regexp'
    | 'operator';

interface TokenizeRuleRegex {
    tokenType: string;
    regex: RegExp;
    priority: number;

    highlight?: HighlightTokenType;

    string?: never;
    function?: never;
}

interface TokenizeRuleString {
    tokenType: string;
    string: string;
    priority: number;

    highlight?: HighlightTokenType;

    regex?: never;
    function?: never;
}

interface TokenizeRuleFunction {
    tokenType: string;
    function: Tokenizer;
    priority: number;

    highlight?: HighlightTokenType;

    regex?: never;
    string?: never;
}

export type TokenizeRule = TokenizeRuleRegex | TokenizeRuleString | TokenizeRuleFunction;

export type Tokenizer = (input: TokenizerInput, index: number) => Result<Token, string>;

export interface TokenizeRuleModule {
    priority: number;
    tokenType: string;

    highlight?: HighlightTokenType;
    tokenizer: Tokenizer;
}

export function makeTokenizeRule(rules: TokenizeRule[]): TokenizeRuleModule[] {
    function isTokenizeRuleRegex(rule: TokenizeRule): rule is TokenizeRuleRegex {
        return "regex" in rule;
    }

    function isTokenizeRuleString(rule: TokenizeRule): rule is TokenizeRuleString {
        return "string" in rule;
    }

    function isTokenizeRuleFunction(rule: TokenizeRule): rule is TokenizeRuleFunction {
        return "function" in rule;
    }

    const modules: TokenizeRuleModule[] = [];

    for (const rule of rules) {
        const { tokenType, priority, highlight } = rule;

        if (isTokenizeRuleRegex(rule)) {
            const { regex } = rule;
            modules.push({
                priority,
                tokenType,
                tokenizer: (input: TokenizerInput, index: number) => {
                    const { input: inputString } = input;
                    const match = regex.exec(inputString.slice(index));

                    if (match && match.index === 0) {
                        const [innerString] = match;
                        return Ok({
                            tokenType,
                            innerString,
                            highlight,
                            startPos: index,
                            endPos: index + innerString.length,
                        });
                    } else {
                        return Err(`Unexpected character at ${index}:${input.fileName}`);
                    }
                }
            });
        } else if (isTokenizeRuleString(rule)) {
            const { string } = rule;
            modules.push({
                priority,
                tokenType,
                tokenizer: (input: TokenizerInput, index: number) => {
                    const { input: inputString } = input;
                    if (inputString.startsWith(string, index)) {
                        return Ok({
                            tokenType,
                            innerString: string,
                            highlight,
                            startPos: index,
                            endPos: index + string.length,
                        });
                    } else {
                        return Err(`Unexpected character at ${index}:${input.fileName}`);
                    }
                }
            });
        } else if (isTokenizeRuleFunction(rule)) {
            const { function: fn } = rule;
            modules.push({
                priority,
                tokenType,
                tokenizer: fn
            });
        }
    }

    return modules.sort((a, b) => b.priority - a.priority);
}