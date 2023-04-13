import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

import { BFContext } from ".";

const MinusSignModule: Module<BFContext> = {
    role: 'statement',
    priority: 0,
    name: 'minusSign',
    tokenizeRules: [{
        regex: /^\-/,
        tokenType: 'minusSign'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType } = tokens[index];
        if (tokenType !== 'minusSign') {
            return Err(`Unexpected token ${tokenType}`);
        }

        return Ok({
            node: {
                nodeType: 'minusSign',
                children: []
            },
            index: index + 1
        });
    },
    evaluate(node, getEvaluate, startContext) {
        startContext.memory[startContext.pointer]--;
    }
}

export default MinusSignModule;