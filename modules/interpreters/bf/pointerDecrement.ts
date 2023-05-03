import { makeInterpretRule } from "rule/interpreter";
import { Node } from "core/parser";

import { BFContext } from ".";

export default makeInterpretRule<BFContext, Node>({
    nodeType: "pointerDecrement",
    evaluate: (node, evaluator, context) => {
        context.pointer--;
    }
})