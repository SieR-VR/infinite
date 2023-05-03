import { makeInterpretRule } from "rule/interpreter";
import { Node } from "core/parser";

import { BFContext } from ".";

export default makeInterpretRule<BFContext, Node>({
    nodeType: "valueIncrement",
    evaluate: (node, evaluator, context) => {
        context.memory[context.pointer]++;
    }
})