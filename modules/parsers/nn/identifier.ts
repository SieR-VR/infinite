import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "identifier", nodeType: "identifier", priority: 0 }, [
    {
        tokenType: "Identifier",
    }
]);