import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "type", nodeType: "functionType", priority: 0, isTopLevel: true }, [
    {
        role: "sizeTypeParam",
        condition: ({ nodeType }) => nodeType === "sizeTypeParam",
        key: "sizeTypeParam",
    },
    {
        role: "functionParam",
        condition: ({ nodeType }) => nodeType === "functionParam",
        key: "functionParam",
    },
    {
        tokenType: "Colon",
    },
    {
        role: "type",
        condition: () => true,
        key: "returnType",
    }
]);