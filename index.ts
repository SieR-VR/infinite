import * as fs from "fs";

import { tokenize, TokenizerInput, TokenizerOptions } from "./core/tokenizer";
import { parse, ParserInput, ParserOptions } from "./core/parser";
import { interpret, InterpreterInput, InterpreterOptions } from "./core/interpreter";

import { CModules, CContext} from "./modules/c";

const modules = CModules;
const input: TokenizerInput = {
    fileName: 'test',
    input: fs.readFileSync('./test/test.c', 'utf8')
};
const tokenizerOptions: TokenizerOptions = { modules };

const tokens = tokenize(input, tokenizerOptions);
console.log(tokens);

const parserInput: ParserInput = {
    fileName: 'test',
    tokens
};
const parserOptions: ParserOptions<CContext> = { modules, context: { usableTypes: [], usableVariables: [], expressionStack: [] } };
const parseResult = parse(parserInput, parserOptions);
console.log(JSON.stringify(parseResult, null, 2));