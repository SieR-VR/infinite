import { Result, Ok, Err } from "ts-features";

import { TokenizeRule } from "../../core/module";
import * as Tokenizer from "../../core/tokenizer";
import * as Parser from "../../core/parser";
import * as Interpreter from "../../core/interpreter";

namespace Addition {
    export const role: string = 'expression';
    export const priority: number = 10;

    export const name: string = 'addition';

    export const tokenizeRules: TokenizeRule[] = [{
        tokenType: 'addition',
        regex: /^\+/
    }];

    export function parseRule(tokens: Tokenizer.Token[], index: number, getRule: Parser.ParseRuleGetter): Result<Parser.ParseRuleResult, string> {
        const left = getRule('expression')(tokens, index, getRule);
        if (left.is_err()) {
            return left;
        }

        const { index: leftIndex, node: leftNode } = left.unwrap();
        if (leftIndex >= tokens.length) {
            return Err('Unexpected end of input');
        }

        const { tokenType } = tokens[leftIndex];
        if (tokenType !== 'addition') {
            return Err(`Unexpected token ${tokenType}`);
        }

        const right = getRule('expression')(tokens, leftIndex + 1, getRule);
        if (right.is_err()) {
            return right;
        }

        const { index: rightIndex, node: rightNode } = right.unwrap();
        return Ok({
            node: {
                nodeType: 'addition',
                children: [leftNode, rightNode]
            },
            index: rightIndex
        });
    }

    export function evaluate(node: Parser.Node, getEvaluate: Interpreter.EvaluateGetter): number {
        const [leftNode, rightNode] = node.children!;
        const left = getEvaluate(leftNode.nodeType)(leftNode, getEvaluate);
        const right = getEvaluate(rightNode.nodeType)(rightNode, getEvaluate);
        
        return left + right;
    }
}

export default Addition;