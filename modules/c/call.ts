import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { CContext, CVariable, LLVMContext } from ".";
import { IdentifierNode } from "./identifier";

export interface CallNode {
    nodeType: 'call';
    name: IdentifierNode;
    args: Node[];
    children: Node[];
}

const CallModule: Module<CContext, LLVMContext, CallNode> = {
    role: 'expression',
    priority: 1,
    name: 'call',
    tokenizeRules: [{
        tokenType: 'openParen',
        regex: /^\(/,
    }, {
        tokenType: 'closeParen',
        regex: /^\)/,
    }, {
        tokenType: 'comma',
        regex: /^,/,
    }],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;
        const name = getRule('identifier')(tokens, currentIndex, getRule, context);
        if (name.is_err()) {
            return Err(name.unwrap_err());
        }
        const nameChecked = name.unwrap();
        currentIndex = nameChecked.index;

        if (tokens[currentIndex].tokenType !== 'openParen') {
            return Err('Expected open paren');
        }
        currentIndex++;

        const args: Node[] = [];
        while (tokens[currentIndex].tokenType !== 'closeParen') {
            const argument = getRule('expression')(tokens, currentIndex, getRule, context);
            if (argument.is_err()) {
                return Err(argument.unwrap_err());
            }
            const argumentChecked = argument.unwrap();
            args.push(argumentChecked.node);
            currentIndex = argumentChecked.index;

            if (tokens[currentIndex].tokenType === 'comma') {
                currentIndex++;
            }
        }

        return Ok({
            node: {
                nodeType: 'call',
                name: nameChecked.node as IdentifierNode,
                args,
                children: [nameChecked.node, ...args], 
            },
            index: currentIndex + 1
        });
    },
    evaluate(node, context) {}
}

export default CallModule;