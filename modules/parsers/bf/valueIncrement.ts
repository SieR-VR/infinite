import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "valueIncrement", priority: 0 }, [
    {
        tokenType: "plus",
    }
])