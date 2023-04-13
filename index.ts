import { tokenize, TokenizerInput, TokenizerOptions } from "./core/tokenizer";
import { parse, ParserInput, ParserOptions } from "./core/parser";
import { interpret, InterpreterInput, InterpreterOptions } from "./core/interpreter";

import Addition from "./modules/addition";
import NumberModule from "./modules/number";

const modules = [Addition, NumberModule];

const input: TokenizerInput = {
    fileName: 'test',
    input: '1+2'
};
const tokenizerOptions: TokenizerOptions = { modules };

const tokens = tokenize(input, tokenizerOptions);
console.log(tokens);

const parserInput: ParserInput = {
    fileName: 'test',
    tokens
};

const parserOptions: ParserOptions = { modules };

const nodes = parse(parserInput, parserOptions);
console.log(JSON.stringify(nodes, null, 2));

const interpreterInput: InterpreterInput = {
    fileName: 'test',
    node: nodes[0]
};

const interpreterOptions: InterpreterOptions = { modules };

const result = interpret(interpreterInput, interpreterOptions);
console.log(result);