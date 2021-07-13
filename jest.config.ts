import type { Config, } from "@jest/types";

const config: Config.InitialOptions =
{
  "transform": {
    ".tsx?": "ts-jest",
  },
};

export default config;