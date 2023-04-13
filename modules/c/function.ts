import llvm from "llvm-bindings";
import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";

import { CContext, LLVMContext } from ".";

import { TypeNode } from "./type";
import { IdentifierNode } from "./identifier";
import { BlockNode } from "./block";

export interface FunctionNode {
    nodeType: 'function';
    returnType: TypeNode;
    name: IdentifierNode;
    // parameters: any;
    body: BlockNode;
    children: any[];
}

const FunctionModule: Module<CContext, LLVMContext, FunctionNode> = {
    role: 'statement',
    priority: 10,
    name: 'function',
    tokenizeRules: [],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;

        const returnType = getRule('type')(tokens, index, getRule, context);
        if (returnType.is_err()) {
            return Err(returnType.unwrap_err());
        }
        const returnTypeChecked = returnType.unwrap();
        currentIndex = returnTypeChecked.index;
        
        const name = getRule('identifier')(tokens, currentIndex, getRule, context);
        if (name.is_err()) {
            return Err(name.unwrap_err());
        }
        const nameChecked = name.unwrap();
        currentIndex = nameChecked.index;
        
        if (tokens[currentIndex].tokenType !== 'openParen') {
            return Err('Expected open parenthesis');
        }
        currentIndex = nameChecked.index + 1;

        // const parameters = getRule('parameters')(tokens, nextIndex, getRule, context);
        // if (parameters.is_err()) {
        //     return parameters;
        // }
        // const parametersChecked = parameters.unwrap();

        if (tokens[currentIndex].tokenType !== 'closeParen') {
            return Err('Expected close parenthesis');
        }
        currentIndex = currentIndex + 1;

        const body = getRule('statement', m => m.name === "block")(tokens, currentIndex, getRule, context);
        if (body.is_err()) {
            return Err(body.unwrap_err());
        }
        const bodyChecked = body.unwrap();

        return Ok({
            node: {
                nodeType: 'function',
                returnType: returnTypeChecked.node as TypeNode,
                name: nameChecked.node as IdentifierNode,
                // parameters: parametersChecked.node,
                body: bodyChecked.node as BlockNode,
                children: [
                    returnTypeChecked.node,
                    nameChecked.node,
                    // parametersChecked.node,
                    bodyChecked.node,
                ],
            },
            index: bodyChecked.index
        });
    },
    evaluate(node, getEvaluate, context) {
        const returnType = getEvaluate(node.returnType.nodeType)(node.returnType, getEvaluate, context);
        const name = getEvaluate(node.name.nodeType)(node.name, getEvaluate, context);
        
        const paramTypes = [] as llvm.Type[];
        const functionType = llvm.FunctionType.get(returnType, paramTypes, false);

        const functionValue = llvm.Function.Create(functionType, llvm.Function.LinkageTypes.ExternalLinkage, name, context.module);
        const functionBlock = llvm.BasicBlock.Create(context.context, 'entry', functionValue);

        context.builder.SetInsertPoint(functionBlock);
        const body = getEvaluate(node.body.nodeType)(node.body, getEvaluate, context);
    },
}

export default FunctionModule;