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
      "include": "**/*.[jt]s",
    })
  ],
  "output": [
    {
      "name": "CommonJS Bundle",
      "file": "dist/yjs.js",
      "format": "cjs",
      "exports": "default",
    },
    {
      "name": "ECMAScript Bundle",
      "file": "dist/yjs.mjs",
      "format": "es",
    }
  ],
});