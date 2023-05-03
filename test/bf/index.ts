import * as fs from "fs";
import * as path from "path";

import { tokenize, TokenizerInput } from "core/tokenizer";
import { parse, ParserInput } from "core/parser";

(async() => {
    const input: TokenizerInput = {
        fileName: 'test',
        input: fs.readFileSync(path.join(__dirname, 'test.bf'), 'utf8')
    };
    
    const { default: tokenizers }  = await import("@/modules/tokens/bf");
    const tokens = tokenize(input, tokenizers);

    const parserInput: ParserInput = {
        fileName: 'test',
        tokens,
    };

    const parsers = await Promise.all(fs.readdirSync('modules/parsers/bf').map(async (file) => {
        const { default: parser } = await import(`@/modules/parsers/bf/${file}`);
        return parser;
    }));
    const ast = parse(parserInput, parsers, () => {});
})();

