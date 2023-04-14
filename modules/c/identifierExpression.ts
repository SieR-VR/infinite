import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { CContext, LLVMContext } from ".";

import { IdentifierNode } from "./identifier";

export interface IdentifierExpressionNode {
    nodeType: 'identifierExpression';
    name: IdentifierNode;
    children: [IdentifierNode];
}

const IdentifierExpressionModule: Module<CContext, LLVMContext, IdentifierExpressionNode> = {
    role: 'expression',
    priority: 100,
    name: 'identifierExpression',
    tokenizeRules: [],
    parseRule(tokens, index, getRule, context) {
        const name = getRule('identifier')(tokens, index, getRule, context);
        if (name.is_err()) {
            return Err(name.unwrap_err());
        }
        const nameChecked = name.unwrap().node as IdentifierNode;

        return Ok({
            node: {
                nodeType: 'identifierExpression',
                name: nameChecked,
                children: [nameChecked],
            },
            index: index + 1,
        });
    },
    evaluate(node, context) { }
}

export default IdentifierExpressionModule;