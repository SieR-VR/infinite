import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";
import { Token } from "../../core/tokenizer";

import { CContext, LLVMContext } from ".";

export interface BinaryNode {
    nodeType: 'binary';
    operator: string;
    left: Node;
    right: Node;
    children: Node[];
}

const binaryOperators = {
    "4": ['plusSign', 'minusSign'],
    "3": ['asterisk', 'slash', 'percent'],
}

const BinaryModule: Module<CContext, LLVMContext, BinaryNode> = {
    role: 'expression',
    priority: 10,
    name: 'binary',
    tokenizeRules: [{
        tokenType: 'plusSign',
        regex: /^\+/,
    }, {
        tokenType: 'minusSign',
        regex: /^\-/,
    }, {
        tokenType: 'asterisk',
        regex: /^\*/,
    }, {
        tokenType: 'slash',
        regex: /^\//,
    }, {
        tokenType: 'percent',
        regex: /^\%/,
    }],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;
        let nodeList: Node[] = [];
        let operatorList: Token[] = [];

        while (currentIndex < tokens.length) {
            const token = tokens[currentIndex];
            
            if (['plusSign', 'minusSign', 'asterisk', 'slash', 'percent'].includes(token.tokenType)) {
                operatorList.push(token);
                currentIndex++;

                continue;
            } else {
                const checked = getRule('expression', (m) => m.name !== 'binary')(tokens, currentIndex, getRule, context);
                if (checked.is_err()) {
                    break;
                }
                const { node, index } = checked.unwrap();
                nodeList.push(node);
                currentIndex = index;

                continue;
            }
        }

        if (nodeList.length === 0) {
            return Err('');
        }

        Object.keys(binaryOperators).sort((a, b) => parseInt(a) - parseInt(b)).forEach((priority) => {
            const operators = binaryOperators[priority as keyof typeof binaryOperators];
            let operatorLength = operatorList.length;

            for (let i = 0; i < operatorLength; i++) {
                const operator = operatorList[i];
                if (operators.includes(operator.tokenType)) {
                    const left = nodeList[i];
                    const right = nodeList[i + 1];
                    nodeList.splice(i, 2, {
                        nodeType: 'binary',
                        operator: operator.tokenType,
                        left,
                        right,
                        children: [left, right],
                    } as Node);

                    operatorList.splice(i, 1);
                    i--;
                    operatorLength--;
                }
            }
        });

        if (nodeList.length !== 1 || operatorList.length !== 0) {
            throw new Error('Invalid binary expression');
        }

        const [binaryNode] = nodeList;

        return Ok({
            node: binaryNode as BinaryNode,
            index: currentIndex
        });
    },
    evaluate(node, getEvaluate, context) {
        const left = getEvaluate(node.left.nodeType)(node.left, getEvaluate, context);
        const right = getEvaluate(node.right.nodeType)(node.right, getEvaluate, context);

        if (node.operator === 'plusSign') {
            return context.builder.CreateAdd(left, right);
        } else if (node.operator === 'minusSign') {
            return context.builder.CreateSub(left, right);
        } else if (node.operator === 'asterisk') {
            return context.builder.CreateMul(left, right);
        } else if (node.operator === 'slash') {
            return context.builder.CreateSDiv(left, right);
        } else if (node.operator === 'percent') {
            return context.builder.CreateSRem(left, right);
        } else {
            throw new Error(`Unknown operator ${node.operator}`);
        }
    }
}

export default BinaryModule;

