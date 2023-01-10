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
  testPathIgnorePatterns: [
    // "./__tests__/setup/*.ts",
    // "./__tests__/mocks/*.ts",
    // "./__tests__/helper/*.ts"
  ],
  transform: {
    "^.+\\.m?[tj]sx?$": [
      "ts-jest",
      {
        useESM: true // this tells `ts-jest` ready to transform files to ESM syntax
      }
    ]
  },
  roots: ["<rootDir>"],
  modulePaths: ["<rootDir>/src"],
  moduleDirectories: ["node_modules"],
  moduleNameMapper: {
    "@/(.*)": ["<rootDir>/src/$1"],
    "~/(.*)": ["<rootDir>/src/$1"]
    // "@gdknot/frontend_common": '<rootDir>/node_modules/@gdknot/frontend_common/dist/index.js'
  },
  globals: {},
  //globalSetup: "<rootDir>/__tests__/setup/globalSetup/index.ts",
  setupFilesAfterEnv: ["jest-expect-message"]
};

export default jestConfig;
