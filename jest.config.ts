import type { Config, } from "@jest/types";

const config: Config.InitialOptions =
{
  "transform": {
    ".tsx?": "ts-jest",
  },
  "rootDir": "./src",
  "testEnvironment": "jsdom",
};

export default config;