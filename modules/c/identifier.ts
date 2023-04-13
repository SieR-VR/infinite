import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { CContext, CVariable, LLVMContext } from ".";

export interface IdentifierNode {
    nodeType: 'identifier';
    name: string;
    children: [];
}

const IdentifierModule: Module<CContext, LLVMContext, IdentifierNode> = {
    role: 'identifier',
    priority: 100,
    name: 'identifier',
    tokenizeRules: [{
        tokenType: 'identifier',
        regex: /^[a-zA-Z_][a-zA-Z0-9_]*/,
    }],
    parseRule(tokens, index, getRule, context) {
        const token = tokens[index];
        if (token.tokenType !== 'identifier') {
            return Err(`Expected identifier at ${index}`);
        }
        return Ok({
            node: {
                nodeType: 'identifier',
                name: token.innerString,
                children: [],
            },
            index: index + 1,
        });
    },
    evaluate(node, context) { 
        return node.name;
    }
}

export default IdentifierModule;