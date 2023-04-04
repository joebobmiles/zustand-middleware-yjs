import type { Config, } from "@jest/types";

const config: Config.InitialOptions =
{
  "transform": {
    ".tsx?": "ts-jest",
  },
  "rootDir": "./src",
};

export default config;