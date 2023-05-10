import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "variableWithType", nodeType: "variableWithType", priority: 0 }, [
    {
        role: "identifier",
        condition: () => true,
        key: "identifier"
    },
    {
        tokenType: "Colon"
    },
    {
        role: "type",
        condition: () => true,
        key: "variableType"
    }
]);