import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "pointerIncrement", priority: 0 }, [
    {
        tokenType: "biggerThan",
    }
])