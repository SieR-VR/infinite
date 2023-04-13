import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

const NumberModule: Module = {
    role: 'expression',
    priority: 0,
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
    evaluate(node, evaluate, startContext) {
        return node.value;
    }
}

export default NumberModule;