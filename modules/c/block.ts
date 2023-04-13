import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { CContext } from ".";

const BlockModule: Module<CContext> = {
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
                return statement;
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
    evaluate(node, context) {
    }
}

export default BlockModule;