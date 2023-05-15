import { Result, Ok, Err } from "ts-features";
import { Token } from "../core/tokenizer";

export type HighlightTokenTypes = [
    'namespace',
    'class',
    'enum',
    'interface',
    'struct',
    'typeParameter',
    'type',
    'parameter',
    'variable',
    'property',
    'enumMember',
    'decorator',
    'event',
    'function',
    'method',
    'macro',
    'label',
    'comment',
    'string',
    'keyword',
    'number',
    'regexp',
    'operator'
][number];

interface TokenizeRuleRegex {
    tokenType: string;
    regex: RegExp;
    priority: number;

    highlight?: HighlightTokenTypes;

    string?: never;
    function?: never;
}

interface TokenizeRuleString {
    tokenType: string;
    string: string;
    priority: number;

    highlight?: HighlightTokenTypes;

    regex?: never;
    function?: never;
}

interface TokenizeRuleFunction {
    tokenType: string;
    function: (input: string, index: number) => Result<Token, string>;
    priority: number;

    highlight?: HighlightTokenTypes;

    regex?: never;
    string?: never;
}

export type TokenizeRule = TokenizeRuleRegex | TokenizeRuleString | TokenizeRuleFunction;

export interface TokenizeRuleModule {
    priority: number;
    tokenType: string;
    highlight?: HighlightTokenTypes;

    tokenizer: (input: string, index: number) => Result<Token, string>;
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
                tokenizer: (input: string, index: number) => {
                    const match = regex.exec(input.slice(index));
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
                        return Err(`Unexpected token at ${index}`);
                    }
                }
            });
        } else if (isTokenizeRuleString(rule)) {
            const { string } = rule;
            modules.push({
                priority,
                tokenType,
                tokenizer: (input: string, index: number) => {
                    if (input.startsWith(string, index)) {
                        return Ok({
                            tokenType,
                            innerString: string,
                            highlight,
                            startPos: index,
                            endPos: index + string.length,
                        });
                    } else {
                        return Err(`Unexpected token at ${index}`);
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