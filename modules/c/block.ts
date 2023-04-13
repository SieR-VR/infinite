import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { CContext, LLVMContext } from ".";

export interface BlockNode {
    nodeType: 'block';
    children: Node[];
}

const BlockModule: Module<CContext, LLVMContext, BlockNode> = {
    role: 'statement',
    priority: 0,
    name: 'block',
    tokenizeRules: [
        {
            tokenType: 'openBrace',
            regex: /^\{/
        },
        {
            tokenType: 'closeBrace',
            regex: /^\}/
        }
    ],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;
        if (tokens[currentIndex].tokenType !== 'openBrace') {
            return Err(`Expected open brace at ${currentIndex}`);
        }
        currentIndex++;

        const statements: Node[] = [];
        while (tokens[currentIndex].tokenType !== 'closeBrace') {
            const statement = getRule('statement')(tokens, currentIndex, getRule, context);
            if (statement.is_err()) {
                return Err(statement.unwrap_err());
            }
            const statementChecked = statement.unwrap();
            statements.push(statementChecked.node);
            currentIndex = statementChecked.index;
        }

        return Ok({
            node: {
                nodeType: 'block',
                children: statements,
            },
            index: currentIndex + 1
        });
    },
    evaluate(node, getEvaluate, context) {
        for (const child of node.children) {
            const result = getEvaluate(child.nodeType)(child, getEvaluate, context);
        }
    }
}

export default BlockModule;