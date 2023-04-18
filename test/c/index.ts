import * as fs from "fs";
import llvm from "llvm-bindings";

import { tokenize, TokenizerInput, TokenizerOptions } from "core/tokenizer";
import { parse, ParserInput, ParserOptions } from "core/parser";
import { interpret, InterpreterInput, InterpreterOptions } from "core/interpreter";

import { CModules, CContext, LLVMContext } from "@/modules/c";

const modules = CModules;

const input: TokenizerInput = {
    fileName: 'test',
    input: fs.readFileSync('./test/test.c', 'utf8')
};
const tokenizerOptions: TokenizerOptions = { modules };
const tokens = tokenize(input, tokenizerOptions);

const parserInput: ParserInput = {
    fileName: 'test',
    tokens
};
const parserOptions: ParserOptions<CContext> = { modules, context: { usableTypes: [], usableVariables: [], expressionStack: [] } };
const parseResult = parse(parserInput, parserOptions);

const interpreterInput: InterpreterInput = {
    fileName: 'test',
    nodes: parseResult
};
const interpreterOptions: InterpreterOptions<LLVMContext> = {
    modules, 
    startContext: {
        context: new llvm.LLVMContext(),
        module: new llvm.Module('test', new llvm.LLVMContext()),
        builder: new llvm.IRBuilder(new llvm.LLVMContext())
    }
};
interpret(interpreterInput, interpreterOptions);

console.log(interpreterOptions.startContext.module.print());