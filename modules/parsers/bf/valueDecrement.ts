import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "valueDecrement", priority: 0 }, [
    {
        tokenType: "minus",
    }
])