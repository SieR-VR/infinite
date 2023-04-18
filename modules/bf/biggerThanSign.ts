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
    parseRuleList: [{
        role: 'biggerThanSign',
        isToken: true,
    }],
    evaluate(node, getEvaluate, startContext) {
        startContext.pointer++;
    }
}

export default BiggerThanSignModule;