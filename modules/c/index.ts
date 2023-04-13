import llvm from "llvm-bindings";
import { Node } from "../../core/parser";

import BinaryModule from "./binary";
import BlockModule from "./block";
import CallModule from "./call";
import DefinitionModule from "./definition";
import FunctionModule from "./function";
import IdentifierModule from "./identifier";
import NumberModule from "./number";
import TypeModule from "./type";

export interface LLVMContext {
    context: llvm.LLVMContext;
    module: llvm.Module;
    builder: llvm.IRBuilder;
}

export interface CContext {
    usableTypes: CType[][];
    usableVariables: CVariable[][];
    expressionStack: Node[];
}

export interface CType {
    name: Node;
}

export interface CVariable {
    name: Node;
    type: Node;
    initialValue?: Node;
}

export const CModules = [
    ...BinaryModule,
    BlockModule,
    CallModule,
    DefinitionModule,
    FunctionModule,
    IdentifierModule,
    NumberModule,
    TypeModule,
];