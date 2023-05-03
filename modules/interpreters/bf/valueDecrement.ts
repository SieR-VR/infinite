import { makeInterpretRule } from "rule/interpreter";
import { Node } from "core/parser";

import { BFContext } from ".";

export default makeInterpretRule<BFContext, Node>({
    nodeType: "valueDecrement",
    evaluate: (node, evaluator, context) => {
        context.memory[context.pointer]--;
    }
})