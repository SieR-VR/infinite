#!/usr/bin/env node
import * as fs from "fs";
import * as path from "path";

import { Token, tokenize, TokenizerInput } from "core/tokenizer";
import { TokenizeRuleModule } from "rule/tokenizer";

import { parse, ParserInput } from "core/parser";
import { ParseRuleModule } from "rule/parser";

const args = process.argv.slice(2);
const infconfig: { token: string, parser: string[] } = JSON.parse(fs.readFileSync('./infconfig.json', 'utf8'));

infconfig.parser = infconfig.parser.flatMap((parser) => {
    if (!parser.endsWith("/*"))
        return parser;

    const dir = parser.slice(0, -2);
    return fs.readdirSync(path.join("./", dir)).map((file) => path.join(dir, file));
});

if (args.length < 1) {
    console.error("Error: No input file specified");
    process.exit(1);
}

const tokenizeModules: TokenizeRuleModule[] = require(path.join('./', infconfig.token)).default;
const parseModules: ParseRuleModule<any>[] = infconfig.parser.flatMap((parser) => require(path.join('./', parser)).default);

const tokenizerInput = makeTokenizerInput(args[0]);
const tokens = tokenize(tokenizerInput, tokenizeModules);

if (tokens.is_err()) {
    console.error("Lex error:", tokens.unwrap_err());
    process.exit(1);
}

const parserInput = makeParserInput(args[0], tokens.unwrap());
const ast = parse(parserInput, parseModules, () => {});

if (ast.is_err()) {
    console.error("Parse Error:", ast.unwrap_err());
    process.exit(1);
}

console.log(JSON.stringify(ast.unwrap(), null, 4));

function makeTokenizerInput(file: string): TokenizerInput {
    return {
        fileName: file,
        input: fs.readFileSync(file, 'utf8')
    };
}

function makeParserInput(file: string, tokens: Token[]): ParserInput {
    return {
        fileName: file,
        tokens: tokens
    };
}



