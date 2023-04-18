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
    parseRuleList: [{
        role: 'dotSign',
        isToken: true,
    }],
    evaluate(node, getEvaluate, startContext) {
        startContext.buffer += String.fromCharCode(startContext.memory[startContext.pointer]);
    }
}

export default DotSignModule;