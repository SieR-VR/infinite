import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { Node } from "../../core/parser";

import { CContext, CVariable, LLVMContext } from ".";

export interface DefinitionNode {
    nodeType: 'definition';
    variables: CVariable[];
    children: Node[];
}

const DefinitionModule: Module<CContext, LLVMContext, DefinitionNode> = {
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
            return Err(type.unwrap_err());
        }
        const typeChecked = type.unwrap();
        currentIndex = typeChecked.index;

        const variables: CVariable[] = [];
        while (tokens[currentIndex].tokenType === 'identifier') {
            const name = getRule('identifier')(tokens, currentIndex, getRule, context);
            if (name.is_err()) {
                return Err(name.unwrap_err());
            }
            const nameChecked = name.unwrap();
            currentIndex = nameChecked.index;

            let initialValue: Node | undefined;
            if (tokens[currentIndex].tokenType === 'equals') {
                currentIndex = currentIndex + 1;

                const valueNode = getRule('expression')(tokens, currentIndex, getRule, context);
                if (valueNode.is_err()) {
                    return Err(valueNode.unwrap_err());
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
    evaluate(node, getEvaluate, context) {
        for (const variable of node.variables) {
            const type = getEvaluate(variable.type.nodeType)(variable.type, getEvaluate, context);
            const name = getEvaluate(variable.name.nodeType)(variable.name, getEvaluate, context);

            const alloca = context.builder.CreateAlloca(type, null, name);
            const initialValue = variable.initialValue && getEvaluate(variable.initialValue.nodeType)(variable.initialValue, getEvaluate, context);

            context.builder.CreateStore(initialValue || context.builder.getInt32(0), alloca);
        }
    }
}

export default DefinitionModule;