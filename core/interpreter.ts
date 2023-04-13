import { Node } from "./parser";
import { Module } from "./module";

export interface InterpreterInput {
    node: Node;
    fileName: string;
}

export interface InterpreterOptions {
    modules?: Module[];
}

export type EvaluateGetter = (name: string) => Evaluate;
export type Evaluate = (node: Node, getEvaluate: EvaluateGetter) => any;

export function interpret(input: InterpreterInput, options: InterpreterOptions): any {
    const { node, fileName } = input;
    const { modules = [] } = options;

    const evaluateMap = new Map<string, (node: Node, getEvaluate: EvaluateGetter) => any>();
    for (const module of modules) {
        evaluateMap.set(module.name, module.evaluate);
    }

    const getEvaluate: EvaluateGetter = (name) => {
        const evaluate = evaluateMap.get(name);
        if (!evaluate) {
            throw new Error(`No evaluate function for module ${name}`);
        }
        return evaluate;
    }

    return getEvaluate(node.nodeType)(node, getEvaluate);
}