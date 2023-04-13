import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { CContext, CVariable, LLVMContext } from ".";

export interface BinaryNode {
    nodeType: `binary${string}`;
    operator: string;
    left: Node;
    right: Node;
    children: Node[];
}

const Binary4Module: Module<CContext, LLVMContext, BinaryNode> = {
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
            return Err(left.unwrap_err());
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
            return Err(right.unwrap_err());
        }
        const rightChecked = right.unwrap();

        return Ok({
            node: {
                nodeType: 'binary4',
                operator: operator.tokenType,
                left: leftChecked.node,
                right: rightChecked.node,
                children: [leftChecked.node, rightChecked.node],
            },
            index: rightChecked.index
        });
    },
    evaluate(node, getEvaluate, context) {
        const left = getEvaluate(node.left.nodeType)(node.left, getEvaluate, context);
        const right = getEvaluate(node.right.nodeType)(node.right, getEvaluate, context);

        if (node.operator === 'plusSign') {
            return context.builder.CreateAdd(left, right);
        } else if (node.operator === 'minusSign') {
            return context.builder.CreateSub(left, right);
        } else {
            throw new Error(`Unknown operator ${node.operator}`);
        }
    }
}

const Binary3Module: Module<CContext, LLVMContext, BinaryNode> = {
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
            return Err(left.unwrap_err());
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
            return Err(right.unwrap_err());
        }
        const rightChecked = right.unwrap();

        return Ok({
            node: {
                nodeType: 'binary3',
                operator: operator.tokenType,
                left: leftChecked.node,
                right: rightChecked.node,
                children: [leftChecked.node, rightChecked.node],
            },
            index: rightChecked.index
        });
    },
    evaluate(node, getEvaluate, context) {
        const left = getEvaluate(node.left.nodeType)(node.left, getEvaluate, context);
        const right = getEvaluate(node.right.nodeType)(node.right, getEvaluate, context);

        if (node.operator === 'asterisk') {
            return context.builder.CreateMul(left, right);
        } else if (node.operator === 'forwardSlash') {
            return context.builder.CreateSDiv(left, right);
        } else if (node.operator === 'percentSign') {
            return context.builder.CreateSRem(left, right);
        } else {
            throw new Error(`Unknown operator ${node.operator}`);
        }
    }
}

export default [Binary4Module, Binary3Module];

