import { Node } from "../core/parser";
import { ParseRuleModule } from "./parser";

export interface TransformerOptions<NodeTypeString extends string> {
    nodeType: NodeTypeString;
}

export type NodeType<Module> =
    Module extends ParseRuleModule<any, infer NT, string> ? NT : never;

type GetNodeTypeFromPool<
    Pool extends readonly ParseRuleModule<any, Node, string>[], 
    NodeTypeString extends string
> = Pool extends readonly [infer Head, ...infer Tail] ?
        Head extends ParseRuleModule<any, infer NT, infer ModuleTypeName> 
            ? ModuleTypeName extends NodeTypeString
                ? NT
                : Tail extends readonly ParseRuleModule<any, Node, NodeTypeString>[]
                    ? GetNodeTypeFromPool<Tail, NodeTypeString>
                    : never
                : never
            : never;
        
export type Transformer<From extends Node, Target extends Node> = (node: From) => Target;

export type TransformerModule<From extends Node, Target extends Node> = {
    nodeType: string;
    transform: Transformer<From, Target>;
}

export function makeTransformerModule<
    ParserPool extends readonly ParseRuleModule<any, Node, string>[],
    Target extends Node = Node,
    NodeTypeString extends string = string
>(
    options: TransformerOptions<NodeTypeString>,
    transform: (node: GetNodeTypeFromPool<ParserPool, NodeTypeString>) => Target
): TransformerModule<GetNodeTypeFromPool<ParserPool, NodeTypeString>, Target> {
    return {
        ...options,
        transform
    };
}
