import { makeParseRuleModule } from "../rule/parser";

export const ArrayModule = makeParseRuleModule({
    nodeType: "array",
    priority: 0,
    role: "expression",
    isTopLevel: true
}, [
    {
        tokenType: "LBracket"  
    },
    {
        key: "expressions",
        composition: [
            {
                role: "expression",
                key: "expression"
            },
            {
                tokenType: "Comma"
            }
        ],
        isRepeatable: true
    },
    {
        role: "expression",
        key: "lastExpression"
    },
    {
        tokenType: "RBracket"
    }
] as const);

export const KeyValuePairModule = makeParseRuleModule({
    nodeType: "keyValuePair",
    priority: 0,
    role: "keyValuePair",
    isTopLevel: false
}, [
    {
        nodeType: "string",
        key: "key"
    },
    {
        tokenType: "Colon"
    },
    {
        role: "expression",
        key: "value"
    }
] as const);

export const NumberModule = makeParseRuleModule({
    nodeType: "number",
    priority: 0,
    role: "expression",
    isTopLevel: true
}, [
    {
        tokenType: "Number"
    }
] as const);

export const ObjectModule = makeParseRuleModule({
    nodeType: "object",
    priority: 0,
    role: "expression",
    isTopLevel: true
}, [
    {
        tokenType: "LBrace"
    },
    {
        key: "pairs",
        composition: [
            {
                nodeType: "keyValuePair",
                key: "pair"
            },
            {
                tokenType: "Comma"
            }
        ],
        isRepeatable: true
    },
    {
        nodeType: "keyValuePair",
        key: "lastPair"
    },
    {
        tokenType: "RBrace"
    }
] as const);

export const StringModule = makeParseRuleModule({
    nodeType: "string",
    priority: 0,
    role: "expression",
    isTopLevel: true
}, [
    {
        tokenType: "String"
    }
] as const);

export const JsonModules = [
    ArrayModule,
    KeyValuePairModule,
    NumberModule,
    ObjectModule,
    StringModule
] as const;
    