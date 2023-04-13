import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { CContext, CVariable } from ".";

const Binary4Module: Module<CContext> = {
    role: 'expression',
    priority: 4,
    name: 'binary4',
    tokenizeRules: [{
        tokenType: 'plusSign',
        regex: /^\+/,
    }, {
        tokenType: 'minusSign',
        regex: /^\-/,
    }],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;
        
        const left = getRule('expression', (m) => m.priority < 4)(tokens, currentIndex, getRule, context);
        if (left.is_err()) {
            return left;
        }
        const leftChecked = left.unwrap();
        currentIndex = leftChecked.index;

        const operator = tokens[currentIndex];
        if (['plusSign', 'minusSign'].indexOf(operator.tokenType) === -1) {
            return Err(`Expected plus or minus operator at ${currentIndex}`);
        }
        currentIndex++;

        const right = getRule('expression', (m) => m.priority < 4)(tokens, currentIndex, getRule, context);
        if (right.is_err()) {
            return right;
        }
        const rightChecked = right.unwrap();

        return Ok({
            node: {
                nodeType: 'binary',
                operator: operator.tokenType,
                left: leftChecked.node,
                right: rightChecked.node,
                children: [leftChecked.node, rightChecked.node],
            },
            index: rightChecked.index
        });
    },
    evaluate(node, context) {}
}

const Binary3Module: Module<CContext> = {
    role: 'expression',
    priority: 3,
    name: 'binary3',
    tokenizeRules: [{
        tokenType: 'asterisk',
        regex: /^\*/,
    }, {
        tokenType: 'forwardSlash',
        regex: /^\//,
    },  {
        tokenType: 'percentSign',
        regex: /^\%/,
    }],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;

        const left = getRule('expression', (m) => m.priority < 3)(tokens, currentIndex, getRule, context);
        if (left.is_err()) {
            return left;
        }
        const leftChecked = left.unwrap();
        currentIndex = leftChecked.index;

        const operator = tokens[currentIndex];
        if (['asterisk', 'forwardSlash', 'percentSign'].indexOf(operator.tokenType) === -1) {
            return Err(`Expected multiply, divide, or modulus operator at ${currentIndex}`);
        }
        currentIndex++;

        const right = getRule('expression', (m) => m.priority < 3)(tokens, currentIndex, getRule, context);
        if (right.is_err()) {
            return right;
        }
        const rightChecked = right.unwrap();

        return Ok({
            node: {
                nodeType: 'binary',
                operator: operator.tokenType,
                left: leftChecked.node,
                right: rightChecked.node,
                children: [leftChecked.node, rightChecked.node],
            },
            index: rightChecked.index
        });
    },
    evaluate(node, context) {}
}

export default [Binary4Module, Binary3Module];

