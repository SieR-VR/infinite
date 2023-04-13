import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

import { BFContext } from ".";

const PlusSignModule: Module<BFContext> = {
    role: 'statement',
    priority: 0,
    name: 'plusSign',
    tokenizeRules: [{
        regex: /^\+/,
        tokenType: 'plusSign'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType } = tokens[index];
        if (tokenType !== 'plusSign') {
            return Err(`Unexpected token ${tokenType}`);
        }

        return Ok({
            node: {
                nodeType: 'plusSign',
                children: []
            },
            index: index + 1
        });
    },
    evaluate(node, getEvaluate, startContext) {
        startContext.memory[startContext.pointer]++;
    }
}

export default PlusSignModule;