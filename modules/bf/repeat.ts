import { Module } from "../../core/module";
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
    parseRuleList: [{
        role: 'LBracket',
        isToken: true,
    }, {
        role: 'statement',
        key: 'children',
        isRepeatable: true,
    }, {
        role: 'RBracket',
        isToken: true,
    }],
    evaluate(node, getEvaluate, startContext) {
        while (startContext.memory[startContext.pointer] !== 0) {
            for (const child of node.children) {
                getEvaluate(child.nodeType)(child, getEvaluate, startContext);
            }
        }
    }
}

export default RepeatModule;