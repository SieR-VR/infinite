import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "pointerDecrement", priority: 0 }, [
    {
        tokenType: "lessThan",
    }
])