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
    parseRuleList: [{
        role: 'plusSign',
        isToken: true,
    }],
    evaluate(node, getEvaluate, startContext) {
        startContext.memory[startContext.pointer]++;
    }
}

export default PlusSignModule;