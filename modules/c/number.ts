import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";
import { CContext, LLVMContext } from ".";

export interface NumberNode {
    nodeType: 'number';
    children: [];
    value: number;
}

const NumberModule: Module<CContext, LLVMContext, NumberNode> = {
    role: 'expression',
    priority: 100,
    name: 'number',
    tokenizeRules: [{
        regex: /^\d+/,
        tokenType: 'number'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType, innerString } = tokens[index];
        if (tokenType !== 'number') {
            return Err(`Unexpected token ${tokenType}`);
        }

        return Ok({
            node: {
                nodeType: 'number',
                children: [],
                value: parseInt(innerString)
            },
            index: index + 1
        });
    },
    evaluate(node, getEvaluate, context) {
        return context.builder.getInt32(node.value);
    }
}

export default NumberModule;