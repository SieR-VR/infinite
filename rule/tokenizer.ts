import { Result, Ok, Err } from "ts-features";

interface TokenizeRuleRegex {
    tokenType: string;
    regex: RegExp;
    priority: number;

    string?: never;
    function?: never;
}

interface TokenizeRuleString {
    tokenType: string;
    string: string;
    priority: number;

    regex?: never;
    function?: never;
}

interface TokenizeRuleFunction {
    tokenType: string;
    function: (input: string) => Result<string, string>;
    priority: number;

    regex?: never;
    string?: never;
}

export type TokenizeRule = TokenizeRuleRegex | TokenizeRuleString | TokenizeRuleFunction;

export interface TokenizeRuleModule {
    priority: number;
    tokenType: string;
    tokenizer: (input: string) => Result<string, string>;
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
        const { tokenType, priority } = rule;

        if (isTokenizeRuleRegex(rule)) {
            const { regex } = rule;
            modules.push({
                priority,
                tokenType,
                tokenizer: (input: string) => {
                    const match = regex.exec(input);
                    if (match && match.index === 0) {
                        const [innerString] = match;
                        return Ok(innerString);
                    } else {
                        return Err(`Unexpected token at ${input}`);
                    }
                }
            });
        } else if (isTokenizeRuleString(rule)) {
            const { string } = rule;
            modules.push({
                priority,
                tokenType,
                tokenizer: (input: string) => {
                    if (input.startsWith(string)) {
                        return Ok(string);
                    } else {
                        return Err(`Unexpected token at ${input}`);
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