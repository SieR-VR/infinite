import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { CContext, CVariable } from ".";

const DefinitionModule: Module<CContext> = {
    role: 'statement',
    priority: 10,
    name: 'definition',
    tokenizeRules: [{
        tokenType: 'semicolon',
        regex: /^;/,
    }, {
        tokenType: 'equals',
        regex: /^=/,
    }],
    parseRule(tokens, index, getRule, context) {
        let currentIndex = index;
        const type = getRule('type')(tokens, currentIndex, getRule, context);
        if (type.is_err()) {
            return type;
        }
        const typeChecked = type.unwrap();
        currentIndex = typeChecked.index;

        const variables: CVariable[] = [];
        while (tokens[currentIndex].tokenType === 'identifier') {
            const name = getRule('identifier')(tokens, currentIndex, getRule, context);
            if (name.is_err()) {
                return name;
            }
            const nameChecked = name.unwrap();
            currentIndex = nameChecked.index;

            let initialValue: Node | undefined;
            if (tokens[currentIndex].tokenType === 'equals') {
                currentIndex = currentIndex + 1;

                const valueNode = getRule('expression')(tokens, currentIndex, getRule, context);
                if (valueNode.is_err()) {
                    return valueNode;
                }
                const valueNodeChecked = valueNode.unwrap();
                currentIndex = valueNodeChecked.index;

                initialValue = valueNodeChecked.node;
            }

            variables.push({
                name: nameChecked.node,
                type: typeChecked.node,
                initialValue,
            });

            if (tokens[currentIndex].tokenType === 'comma') {
                currentIndex++;
            }
        }
        
        if (tokens[currentIndex].tokenType !== 'semicolon') {
            return Err('Expected semicolon');
        }
        const nextIndex = currentIndex + 1;

        return Ok({
            node: {
                nodeType: 'definition',
                variables,
                children: variables.map(
                    variable => [variable.name, variable.type, variable.initialValue].filter(Boolean) as Node[]
                ).flat(),
            },
            index: nextIndex
        });
    },
    evaluate(node, context) {}
}

export default DefinitionModule;