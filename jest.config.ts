import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
    roots: ['<rootDir>'],
    modulePaths: ["."],
    preset: "ts-jest",
}

export default config;