import type { Node } from "../core/parser";
import type { InterpretRuleModule } from "../rule/interpreter";

export interface InterpreterInput {
    nodes: Node[];
    fileName: string;
}

export type EvaluateGetter<Context, NodeType extends Node = Node> = (name: string) => Evaluate<Context, NodeType>;

export type Evaluate<Context, NodeType extends Node = Node> = (node: NodeType, evaluator: (node: Node) => any, context: Context) => any;

export function interpret<Context = undefined>(input: InterpreterInput, interpreters: InterpretRuleModule<Context, Node>[], makeContext: () => Context): any {
    const { nodes, fileName } = input;
    const startContext = makeContext();

    const evaluateMap = new Map<string, Evaluate<Context>>();
    for (const interpreter of interpreters) {
        evaluateMap.set(interpreter.nodeType, interpreter.evaluate);
    }

    const getEvaluate: EvaluateGetter<Context> = (name) => {
        const evaluate = evaluateMap.get(name);
        if (!evaluate) {
            throw new Error(`${fileName}: No evaluate function for module ${name}`);
        }

        return evaluate;
    }

    const evaluator = (node: Node) => {
        return getEvaluate(node.nodeType)(node, evaluator, startContext);
    }

    return nodes.map(evaluator);
}