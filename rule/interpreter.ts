import type { Node } from "../core/parser";
import type { Evaluate } from "../core/interpreter";

export interface InterpretRuleModule<Context, NodeType extends Node> {
    nodeType: string;
    evaluate: Evaluate<Context, NodeType>;
}

export function makeInterpretRule<Context, NodeType extends Node>(module: InterpretRuleModule<Context, NodeType>): InterpretRuleModule<Context, NodeType> {
    return module;
}