import * as fs from "fs";
import * as path from "path";

import { tokenize, TokenizerInput, TokenizerOptions } from "core/tokenizer";
import { parse, ParserInput, ParserOptions } from "core/parser";
import { interpret, InterpreterInput, InterpreterOptions } from "core/interpreter";

import { BFContext, BFModules, makeInitialContext } from "@/modules/bf";

const modules = BFModules;

const input: TokenizerInput = {
    fileName: 'test',
    input: fs.readFileSync(path.join(__dirname, 'test.bf'), 'utf8')
};
const tokenizerOptions: TokenizerOptions = { modules };
const tokens = tokenize(input, tokenizerOptions);

const parserInput: ParserInput = {
    fileName: 'test',
    tokens
};
const parserOptions: ParserOptions = { modules };
const parseResult = parse(parserInput, parserOptions);

const interpreterInput: InterpreterInput = {
    fileName: 'test',
    nodes: parseResult
};
const interpreterOptions: InterpreterOptions<BFContext> = {
    modules,
    startContext: makeInitialContext(256)
};
interpret(interpreterInput, interpreterOptions);

console.log(interpreterOptions.startContext.buffer);
