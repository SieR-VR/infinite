import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "type", nodeType: "tensorType", priority: 0, isTopLevel: true }, [
    {
        tokenType: "Tensor",
    },
    {
        role: "sizeTypeParam",
        condition: ({ nodeType }) => nodeType === "sizeTypeParam",
        key: "sizeTypeParam",
        // isOptional: true,
    },
    {
        role: "primitiveTypeParam",
        condition: ({ nodeType }) => nodeType === "primitiveTypeParam",
        key: "primitiveTypeParam",
    }
]);