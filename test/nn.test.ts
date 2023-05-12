import * as fs from "fs";
import * as path from "path";

import { tokenize, TokenizerInput } from "core/tokenizer";
import { parse, ParserInput } from "core/parser";

describe("tokenizer function", () => {
    const success_files = fs.readdirSync(path.join(__dirname, 'nn', 'tokenize'));
    const fail_files = fs.readdirSync(path.join(__dirname, 'nn', 'tokenize_fail'));

    function makeTokenizerInput(file: string): TokenizerInput {
        return {
            fileName: file,
            input: fs.readFileSync(path.join(__dirname, 'nn', file), 'utf8')
        };
    }
    
    success_files.forEach((file) => {
        it(`should tokenize ${file}`, async () => {
            const input = makeTokenizerInput(`tokenize/${file}`);

            const { default: tokenizers } = await import("infinite-lang/modules/tokens/nn");
            const tokens = tokenize(input, tokenizers);
        });
    });

    fail_files.forEach((file) => {
        it(`should fail to tokenize ${file}`, async () => {
            const input = makeTokenizerInput(`tokenize_fail/${file}`);

            const { default: tokenizers } = await import("infinite-lang/modules/tokens/nn");
            const tokens = tokenize(input, tokenizers);

            expect(tokens.is_err()).toBe(true);
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
                const { default: parser } = await import(`infinite-lang/modules/parsers/nn/${file}`);
                return parser;
            }));

            const input = makeTokenizerInput(file);
            const { default: tokenizers } = await import("infinite-lang/modules/tokens/nn");
            const tokens = tokenize(input, tokenizers);

            const parserInput: ParserInput = {
                fileName: file,
                tokens: tokens.unwrap(),
            };

            const ast = parse(parserInput, parsers, () => {});
            fs.writeFileSync(path.join(__dirname, 'nn', 'passed', file + '.json'), JSON.stringify(ast, null, 4));
        });
    });
});
