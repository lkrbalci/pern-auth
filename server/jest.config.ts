import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/**/*.test.ts"],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  restoreMocks: true,
  moduleFileExtensions: ["ts", "js", "json", "node"],
};

export default config;
