import { TokenizeRuleModule } from "rule/tokenizer";

export interface TokenizerInput {
    input: string;
    fileName: string;
}

export interface Token {
    tokenType: string;
    innerString: string;

    startPos: number;
    endPos: number;
}

export function tokenize(input: TokenizerInput, tokenizers: TokenizeRuleModule[], ignoreRegex: RegExp = /^\s+/): Token[] {
    const { input: inputString, fileName } = input;
    const tokens: Token[] = [];
    
    let index = 0;
    while (index < inputString.length) {
        let matched = false;

        const ignoreMatch = ignoreRegex.exec(inputString.slice(index));
        if (ignoreMatch && ignoreMatch.index === 0) {
            const [innerString] = ignoreMatch;
            index += innerString.length;
        }

        for (const rule of tokenizers) {
            const { tokenType, tokenizer } = rule;
            const match = tokenizer(inputString, index);

            if (match.is_ok()) {
                const innerString = match.unwrap();
                tokens.push({ 
                    tokenType, 
                    innerString,
                    startPos: index,
                    endPos: index + innerString.length,
                });

                index += innerString.length;
                matched = true;
                break;
            }
        }

        if (!matched) {
            throw new Error(`Unexpected character ${input.input[index]} at ${fileName}:${index}`);
        }
    }

    return tokens;
}