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
      "rootDir": "src",
      "include": "**/*.(j|t)s",
      "exclude": [
        "node_modules",
        "dist",
        "examples",
        "test-react",
        "**/*.(config|test|spec).(j|t)sx?"
      ],
    })
  ],
  "output": [
    {
      "name": "ESM",
      "file": "dist/yjs.mjs",
      "format": "es",
    },
    {
      "name": "CommonJs",
      "file": "dist/yjs.cjs",
      "format": "cjs",
      "exports": "default",
    }
  ],
  "external": [
    "yjs"
  ],
});