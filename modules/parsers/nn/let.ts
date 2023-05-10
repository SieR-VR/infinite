import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "let", priority: 0, isTopLevel: true }, [
    {
        tokenType: "Let",
    },
    {
        role: "variableWithType",
        condition: () => true,
        key: "variable"
    },
    {
        tokenType: "Equals"
    },
    {
        role: "expression",
        condition: () => true,
        key: "expression"
    },
    {
        tokenType: "Semicolon"
    }
]);