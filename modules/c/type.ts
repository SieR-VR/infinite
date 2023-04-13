import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { CContext, CVariable, LLVMContext } from ".";
import { IdentifierNode } from "./identifier";

export interface TypeNode {
    nodeType: 'type';
    name: IdentifierNode;
    children: [IdentifierNode];
}

const TypeModule: Module<CContext, LLVMContext, TypeNode> = {
    role: 'type',
    priority: 0,
    name: 'type',
    tokenizeRules: [],
    parseRule(tokens, index, getRule, context) {
        const name = getRule('identifier')(tokens, index, getRule, context);
        if (name.is_err()) {
            return Err(name.unwrap_err());
        }
        const nameChecked = name.unwrap().node as IdentifierNode;

        return Ok({
            node: {
                nodeType: 'type',
                name: nameChecked,
                children: [nameChecked],
            },
            index: index + 1,
        });
    },
    evaluate(node, getEvaluate, context) {
        return context.builder.getInt32Ty();
    }
}

export default TypeModule;