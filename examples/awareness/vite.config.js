import { defineConfig, } from "vite";
import commonjs from "@rollup/plugin-commonjs";

export default defineConfig({
  "root": "./src",
  "plugins": [
    commonjs()
  ],
});