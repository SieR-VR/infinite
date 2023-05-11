import { Result, Ok, Err } from "ts-features";
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

export interface Position {
    startPos: number;
    endPos: number;
}

export function tokenize(input: TokenizerInput, tokenizers: TokenizeRuleModule[], ignoreRegex: RegExp = /^\s+/): Result<Token[], Position[]> {
    const { input: inputString, fileName } = input;
    
    const tokens: Token[] = [];
    const errorPositions: Position[] = [];
    
    let index = 0;
    while (index < inputString.length) {
        let matched = false;

        const ignoreMatch = ignoreRegex.exec(inputString.slice(index));
        if (ignoreMatch && ignoreMatch.index === 0) {
            const [innerString] = ignoreMatch;
            index += innerString.length;
        }

        if (index >= inputString.length) {
            break;
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
            errorPositions.push({
                startPos: index,
                endPos: index + 1,
            });
            index += 1;
        }
    }

    if (errorPositions.length) {
        return Err(errorPositions);
    }

    return Ok(tokens);
}