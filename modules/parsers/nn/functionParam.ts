import { Ok, Err } from "ts-features";

import { Node } from "core/parser";
import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "functionParam", nodeType: "functionParam", priority: 0 }, [
    {
        tokenType: "LParen",
    },
    {
        key: "params",
        parseRule: (tokens, index, getRule, context) => {
            const parseType = getRule("type");
            const startPos = tokens[index].startPos;

            const nodes = [] as Node[];
            let nextIndex = index;
            let innerText = "";

            while (nextIndex < tokens.length) {
                const numericLiteralNodeUnchecked = parseType(tokens, nextIndex, getRule, context);
                if (numericLiteralNodeUnchecked.is_ok()) {
                    const [node, next] = numericLiteralNodeUnchecked.unwrap();
                    nodes.push(node);
                    innerText += node.innerText;
                    nextIndex = next;

                    if (tokens[nextIndex].tokenType === "Comma") {
                        nextIndex += 1;
                        innerText += ", ";
                        continue;
                    }

                    break;
                }

                break;
            }

            return Ok([{
                nodeType: "functionParams",
                role: "functionParams",
                children: nodes,
                innerText,
                startPos,
                endPos: tokens[nextIndex].endPos,
            }, nextIndex])
        }
    },
    {
        tokenType: "RParen",
    }
]);