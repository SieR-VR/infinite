import { makeInterpretRule } from "rule/interpreter";
import { Node } from "core/parser";

import { BFContext } from ".";

export default makeInterpretRule<BFContext, Node>({
    nodeType: "print",
    evaluate: (node, evaluator, context) => {
        context.buffer += String.fromCharCode(context.memory[context.pointer]);
    }
})