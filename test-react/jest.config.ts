import type { Config, } from "@jest/types";

const config: Config.InitialOptions =
{
  "transform": {
    ".tsx?": "ts-jest",
  },
  "testEnvironment": "jsdom",
};

export default config;