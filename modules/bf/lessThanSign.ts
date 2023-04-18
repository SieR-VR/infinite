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
    parseRuleList: [{
        role: 'lessThanSign',
        isToken: true,
    }],
    evaluate(node, getEvaluate, startContext) {
        startContext.pointer--;
    }
}

export default LessThanSignModule;