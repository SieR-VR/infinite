import { Module, TokenizeRule } from "./module";

export interface TokenizerInput {
    input: string;
    fileName: string;
}

export interface TokenizerOptions {
    modules?: Module<any, any, any>[];
}

export interface Token {
    tokenType: string;
    innerString: string;
}

export function tokenize(input: TokenizerInput, options: TokenizerOptions = {}): Token[] {
    const { input: inputString, fileName } = input;
    const { modules = [] } = options;
    const tokenizeRules = modules.reduce((acc, module) => acc.concat(module.tokenizeRules), [] as TokenizeRule[]);
    const tokens: Token[] = [];
    
    let index = 0;
    const whitespaceRegex = /^\s+/;

    while (index < inputString.length) {
        let matched = false;
        const whitespaceMatch = whitespaceRegex.exec(inputString.slice(index));
        if (whitespaceMatch && whitespaceMatch.index === 0) {
            const [innerString] = whitespaceMatch;
            index += innerString.length;
        }

        for (const rule of tokenizeRules) {
            const { tokenType, regex } = rule;
            const match = regex.exec(inputString.slice(index));
            if (match && match.index === 0) {
                const [innerString] = match;
                tokens.push({ tokenType, innerString });
                index += innerString.length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            throw new Error(`Unexpected token at ${fileName}:${index}`);
        }
    }

    return tokens;
}