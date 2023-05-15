import type { Token, TokenizerInput } from "../core/tokenizer";
import type { TokenizeRuleModule } from "../rule/tokenizer";

import type { ParserInput, Node } from "../core/parser";
import type { ParseRuleModule } from "../rule/parser";

(async () => {
    const fs = await import("fs");
    const path = await import("path");

    const tokenize = (await import("../core/tokenizer")).tokenize;
    const parse = (await import("../core/parser")).parse;

    const args = process.argv.slice(2);
    const infconfig: { token: string, parser: string[] } = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'infconfig.json'), 'utf8'));
    
    infconfig.parser = infconfig
        .parser
        .flatMap((parser) => {
            if (!parser.endsWith("/*"))
            return parser;
            
            const dir = parser.slice(0, -2);
            return fs.readdirSync(path.join("./", dir)).map((file) => path.join(dir, file));
        })
        .filter((parser) => parser.endsWith(".js"));
    
    if (args.length < 1) {
        console.error("Error: No input file specified");
        process.exit(1);
    }
    
    const tokenizeModules: TokenizeRuleModule[] = (await import(path.join(process.cwd(), infconfig.token))).default;
    const parseModules: ParseRuleModule<any, Node>[] = await Promise.all(
        infconfig.parser.flatMap(async (parser) => (await import(path.join(process.cwd(), parser))).default)
    );
    
    const tokenizerInput = makeTokenizerInput(args[0]);
    const tokens = tokenize(tokenizerInput, tokenizeModules);
    
    if (tokens.is_err()) {
        console.error("Lex error:", tokens.unwrap_err());
        process.exit(1);
    }
    
    const parserInput = makeParserInput(args[0], tokens.unwrap());
    const ast = parse(parserInput, parseModules, () => {});
    
    if (ast.is_err()) {
        console.error("Parse Error:", ast.unwrap_err());
        process.exit(1);
    }
    
    console.log(JSON.stringify(ast.unwrap(), null, 4));
    
    function makeTokenizerInput(file: string): TokenizerInput {
        return {
            fileName: file,
            input: fs.readFileSync(file, 'utf8')
        };
    }
    
    function makeParserInput(file: string, tokens: Token[]): ParserInput {
        return {
            fileName: file,
            tokens: tokens
        };
    }    
})();

