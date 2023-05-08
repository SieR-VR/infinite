import * as fs from "fs";
import * as path from "path";

import { tokenize, TokenizerInput } from "core/tokenizer";
import { parse, ParserInput } from "core/parser";

describe("tokenizer function", () => {
    const files = fs.readdirSync(path.join(__dirname, 'nn', 'tokenize'));

    function makeTokenizerInput(file: string): TokenizerInput {
        return {
            fileName: file,
            input: fs.readFileSync(path.join(__dirname, 'nn', 'tokenize', file), 'utf8')
        };
    }
    
    files.forEach((file) => {
        it(`should tokenize ${file}`, async () => {
            const input = makeTokenizerInput(file);

            const { default: tokenizers } = await import("@/modules/tokens/nn");
            const tokens = tokenize(input, tokenizers);
        });
    });
});

describe("parser function", () => {
    const files = fs.readdirSync(path.join(__dirname, 'nn', 'parse'));

    function makeTokenizerInput(file: string): TokenizerInput {
        return {
            fileName: file,
            input: fs.readFileSync(path.join(__dirname, 'nn', 'parse', file), 'utf8')
        };
    }

    files.forEach((file) => {
        it(`should parse ${file}`, async () => {
            const parsers = await Promise.all(fs.readdirSync('modules/parsers/nn').map(async (file) => {
                const { default: parser } = await import(`@/modules/parsers/nn/${file}`);
                return parser;
            }));

            const input = makeTokenizerInput(file);
            const { default: tokenizers } = await import("@/modules/tokens/nn");
            const tokens = tokenize(input, tokenizers);

            const parserInput: ParserInput = {
                fileName: file,
                tokens,
            };

            const ast = parse(parserInput, parsers, () => {});
            fs.writeFileSync(path.join(__dirname, 'nn', 'passed', file + '.json'), JSON.stringify(ast, null, 4));
        });
    });
});
