import { defineConfig, } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  "input": "src/index.ts",
  "plugins": [
    resolve(),
    commonjs(),
    typescript({
      "tsconfig": "./tsconfig.json",
      "include": "**/*.(j|t)s",
      "exclude": [
        "node_modules",
        "dist",
        "examples",
        "**/*.(config|test|spec).(j|t)sx?"
      ],
    })
  ],
  "output":
  {
    "name": "yjs",
    "file": "dist/yjs.js",
    "format": "es",
  },
});