import { Module, TokenizeRule } from "./module";

export interface TokenizerInput {
    input: string;
    fileName: string;
}

export interface TokenizerOptions {
    modules?: Module[];
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
    while (index < inputString.length) {
        let matched = false;
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