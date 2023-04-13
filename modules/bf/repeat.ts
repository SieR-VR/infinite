import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { BFContext } from ".";

const RepeatModule: Module<BFContext> = {
    role: 'statement',
    priority: -10,
    name: 'repeat',
    tokenizeRules: [{
        regex: /^\[/,
        tokenType: 'LBracket'
    }, {
        regex: /^\]/,
        tokenType: 'RBracket'
    }],
    parseRule(tokens, index, getRule) {
        const { tokenType } = tokens[index];
        const children = [] as Node[];

        if (tokenType !== 'LBracket') {
            return Err(`Unexpected token ${tokenType}`);
        }

        let blockStartIndex = index + 1;
        while (true) {
            const { tokenType } = tokens[blockStartIndex];
            if (tokenType === 'RBracket') {
                break;
            }

            const child = getRule('statement')(tokens, blockStartIndex, getRule);
            if (child.is_err()) {
                return child;
            }

            const childUnwrapped = child.unwrap();

            children.push(childUnwrapped.node);
            blockStartIndex = childUnwrapped.index;
        }

        const blockEndIndex = blockStartIndex + 1;

        return Ok({
            node: {
                nodeType: 'repeat',
                children
            },
            index: blockEndIndex
        });
    },
    evaluate(node, getEvaluate, startContext) {
        while (startContext.memory[startContext.pointer] !== 0) {
            for (const child of node.children) {
                getEvaluate(child.nodeType)(child, getEvaluate, startContext);
            }
        }
    }
}

export default RepeatModule;