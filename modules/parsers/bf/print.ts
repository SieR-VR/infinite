import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "statement", nodeType: "print", priority: 0 }, [
    {
        tokenType: "dot",
    }
])