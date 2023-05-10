import { makeParseRuleModule } from "rule/parser";

export default makeParseRuleModule({ role: "expression", nodeType: "identifierExpression", priority: 0 }, [
    {
        role: "identifier",
        condition: () => true,
        key: "identifier"
    },
]);