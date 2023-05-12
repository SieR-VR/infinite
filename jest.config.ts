import { pathsToModuleNameMapper, JestConfigWithTsJest } from "ts-jest";
import { compilerOptions } from "./tsconfig.json";

const config: JestConfigWithTsJest = {
    roots: ['<rootDir>'],
    modulePaths: [compilerOptions.baseUrl],
    preset: "ts-jest",
}

export default config;