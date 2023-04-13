import { Ok, Err } from "ts-features";
import { Module } from "../../core/module";

import { CContext } from ".";

const FunctionModule: Module<CContext> = {
    role: 'statement',
    priority: 10,
    name: 'function',
    tokenizeRules: [],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;

        const returnType = getRule('type')(tokens, index, getRule, context);
        if (returnType.is_err()) {
            return returnType;
        }
        const returnTypeChecked = returnType.unwrap();
        currentIndex = returnTypeChecked.index;
        
        const name = getRule('identifier')(tokens, currentIndex, getRule, context);
        if (name.is_err()) {
            return name;
        }
        const nameChecked = name.unwrap();
        currentIndex = nameChecked.index;
        
        if (tokens[currentIndex].tokenType !== 'openParen') {
            return Err('Expected open parenthesis');
        }
        currentIndex = nameChecked.index + 1;

        // const parameters = getRule('parameters')(tokens, nextIndex, getRule, context);
        // if (parameters.is_err()) {
        //     return parameters;
        // }
        // const parametersChecked = parameters.unwrap();

        if (tokens[currentIndex].tokenType !== 'closeParen') {
            return Err('Expected close parenthesis');
        }
        currentIndex = currentIndex + 1;

        const body = getRule('statement', m => m.name === "block")(tokens, currentIndex, getRule, context);
        if (body.is_err()) {
            return body;
        }
        const bodyChecked = body.unwrap();

        return Ok({
            node: {
                nodeType: 'function',
                returnType: returnTypeChecked.node,
                name: nameChecked.node,
                // parameters: parametersChecked.node,
                body: bodyChecked.node,
                children: [
                    returnTypeChecked.node,
                    nameChecked.node,
                    // parametersChecked.node,
                    bodyChecked.node,
                ],
            },
            index: bodyChecked.index
        });
    },
    evaluate(node, getEvaluate, context) {
    },
}

export default FunctionModule;