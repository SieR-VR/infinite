import { Ok, Err, Result } from "ts-features";

import { Node } from "./parser";
import { Transformer, TransformerModule } from "../rule/transformer";

export interface TransformerInput {
    nodes: Node[];
    fileName: string;
}

export interface TransformError {
    level: "critical" | "error" | "warning";
    
    tried?: string[];
    expected?: string;
    actual?: string;

    startPos: number;
    endPos: number;
}

export function transform(input: TransformerInput, transformers: TransformerModule<Node, Node>[]): Result<Node[], TransformError[]> {
    const { nodes, fileName } = input;

    const transformMap = new Map<string, Transformer<Node, Node>>();
    for (const transformer of transformers) {
        transformMap.set(transformer.nodeType, transformer.transform);
    }

    const getTransform = (nodeType: string) => {
        return transformMap.get(nodeType);
    }

    const transformNode = (node: Node): Node => {
        const transform = getTransform(node.nodeType);
        
        if (!transform) {
            node.children = node.children.map((child) => {
                if (Array.isArray(child)) {
                    return child.map(transformNode);
                }

                return transformNode(child);
            });

            return node;
        }

        return transform(node);
    }

    return Ok(nodes.map(transformNode));
}