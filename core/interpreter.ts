import { Node } from "./parser";
import { Module } from "./module";

export interface InterpreterInput {
    nodes: Node[];
    fileName: string;
}

export interface InterpreterOptions<InterpreterContext = undefined> {
    modules?: Module<any, InterpreterContext, any>[];
    startContext: InterpreterContext;
}

export type EvaluateGetter<Context, NodeType extends Node = Node> = (name: string) => Evaluate<Context, NodeType>;
export type Evaluate<Context, NodeType extends Node = Node> = (node: NodeType, getEvaluate: EvaluateGetter<Context, Node>, context: Context) => any;

export function interpret<Context = undefined>(input: InterpreterInput, options: InterpreterOptions<Context>): any {
    const { nodes, fileName } = input;
    const { modules = [], startContext } = options;

    const evaluateMap = new Map<string, Evaluate<Context>>();
    for (const module of modules) {
        evaluateMap.set(module.name, module.evaluate);
    }

    const getEvaluate: EvaluateGetter<Context> = (name) => {
        const evaluate = evaluateMap.get(name);
        if (!evaluate) {
            throw new Error(`No evaluate function for module ${name}`);
        }
        return evaluate;
    }

    return nodes.map(node => {
        return getEvaluate(node.nodeType)(node, getEvaluate, startContext);
    });
}