/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
import type { JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  // ts-jest typescript 無 vite / vitest / vue 的設定組合似乎和
  // 單純的 ts-jest typescript 不同
  // jsdom
  // https://github.com/kulshekhar/ts-jest/issues/3843
  // https://github.com/kulshekhar/ts-jest/issues/3843#issuecomment-1284309976
  preset: "ts-jest/presets/default-esm", // or other ESM presets
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts"], // this is required in Jest doc https://jestjs.io/docs/next/configuration#extensionstotreatasesm-arraystring
  testRegex: [
    "(/__tests__/tests/.*|(\\.|/)(test|spec))\\.[jt]sx?$"
  ],
  testPathIgnorePatterns: ["/node_modules/", "/__tests__/__mocks__/.*"],
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>/src"],
  moduleDirectories: ["node_modules"],
  moduleNameMapper: {
    "~/(.*)": ["<rootDir>/src/$1"],
    "@/(.*)": ["<rootDir>/src/$1"]
  },
  globals: {},
  setupFilesAfterEnv: ["jest-expect-message"]
};

export default jestConfig;
