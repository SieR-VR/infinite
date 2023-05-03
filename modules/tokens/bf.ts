import { makeTokenizeRule } from "rule/tokenizer"

export default makeTokenizeRule([
    {
        tokenType: "biggerThan",
        string: ">",
        priority: 0
    },
    {
        tokenType: "lessThan",
        string: "<",
        priority: 0
    },
    {
        tokenType: "plus",
        string: "+",
        priority: 0
    },
    {
        tokenType: "minus",
        string: "-",
        priority: 0
    },
    {
        tokenType: "dot",
        string: ".",
        priority: 0
    },
    {
        tokenType: "LBracket",
        string: "[",
        priority: 0
    },
    {
        tokenType: "RBracket",
        string: "]",
        priority: 0
    }
])