import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "repeat", priority: 0 }, [
    {
        tokenType: "LBracket",
    },
    {
        role: "statement",
        condition: ({ role }) => role === "statement",
        key: "statements",
        isRepeatable: true,
    },
    {
        tokenType: "RBracket",
    }
])