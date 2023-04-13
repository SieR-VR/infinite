import { Ok, Err } from "ts-features";

import { Module } from "../../core/module";
import { CContext, CVariable } from ".";

const TypeModule: Module<CContext> = {
    role: 'type',
    priority: 0,
    name: 'type',
    tokenizeRules: [],
    parseRule(tokens, index, getRule, context) {
        const name = getRule('identifier')(tokens, index, getRule, context);
        if (name.is_err()) {
            return name;
        }
        const nameChecked = name.unwrap();

        return Ok({
            node: {
                nodeType: 'type',
                name: nameChecked.node,
                children: [],
            },
            index: index + 1,
        });
    },
    evaluate(node, context) { }
}

export default TypeModule;