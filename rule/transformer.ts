import { Result, Ok, Err } from "ts-features";
import { Node } from "../core/parser";
import { ParseRuleModule } from "./parser";

export interface TransformerOptions {
    nodeType: string;
}

export type NodeType<Module> =
    Module extends ParseRuleModule<any, infer NT> ? NT : never;

export type Transformer<From extends Node, Target extends Node> = (node: From) => Target;

export type TransformerModule<From extends Node, Target extends Node> = {
    nodeType: string;
    transform: Transformer<From, Target>;
}

export function makeTransformerModule<From extends Node, Target extends Node>(
    options: TransformerOptions, 
    transform: (node: From) => Target
): TransformerModule<From, Target> {
    return {
        ...options,
        transform
    };
}