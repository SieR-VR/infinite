import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "repeat", priority: 0 }, [
    {
        tokenType: "LBracket",
    },
    {
        role: "statement",
        condition: () => true,
        key: "statements",
        isRepeatable: true,
    },
    {
        tokenType: "RBracket",
    }
]);