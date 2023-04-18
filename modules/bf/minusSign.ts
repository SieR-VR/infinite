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
    parseRuleList: [{
        role: 'minusSign',
        isToken: true,
    }],
    evaluate(node, getEvaluate, startContext) {
        startContext.memory[startContext.pointer]--;
    }
}

export default MinusSignModule;