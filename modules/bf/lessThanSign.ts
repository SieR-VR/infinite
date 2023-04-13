import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

import { BFContext } from ".";

const LessThanSignModule: Module<BFContext> = {
    role: 'statement',
    priority: 0,
    name: 'lessThanSign',
    tokenizeRules: [{
        regex: /^</,
        tokenType: 'lessThanSign'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType } = tokens[index];
        if (tokenType !== 'lessThanSign') {
            return Err(`Unexpected token ${tokenType}`);
        }

        return Ok({
            node: {
                nodeType: 'lessThanSign',
                children: []
            },
            index: index + 1
        });
    },
    evaluate(node, getEvaluate, startContext) {
        startContext.pointer--;
    }
}

export default LessThanSignModule;