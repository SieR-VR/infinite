import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

import { BFContext } from ".";

const BiggerThanSignModule: Module<BFContext> = {
    role: 'statement',
    priority: 0,
    name: 'biggerThanSign',
    tokenizeRules: [{
        regex: /^>/,
        tokenType: 'biggerThanSign'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType } = tokens[index];
        if (tokenType !== 'biggerThanSign') {
            return Err(`Unexpected token ${tokenType}`);
        }

        return Ok({
            node: {
                nodeType: 'biggerThanSign',
                children: []
            },
            index: index + 1
        });
    },
    evaluate(node, getEvaluate, startContext) {
        startContext.pointer++;
    }
}

export default BiggerThanSignModule;