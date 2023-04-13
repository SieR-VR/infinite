import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

import { BFContext } from ".";

const DotSignModule: Module<BFContext> = {
    role: 'statement',
    priority: 0,
    name: 'dotSign',
    tokenizeRules: [{
        regex: /^\./,
        tokenType: 'dotSign'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType } = tokens[index];
        if (tokenType !== 'dotSign') {
            return Err(`Unexpected token ${tokenType}`);
        }

        return Ok({
            node: {
                nodeType: 'dotSign',
                children: []
            },
            index: index + 1
        });
    },
    evaluate(node, getEvaluate, startContext) {
        startContext.buffer += String.fromCharCode(startContext.memory[startContext.pointer]);
    }
}

export default DotSignModule;