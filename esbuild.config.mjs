import { build } from "esbuild";

const isProduction = process.argv.includes("production");

await build({
  entryPoints: ["main.ts"],
  bundle: true,
  external: ["obsidian"],
  format: "cjs",
  platform: "browser",
  target: "es2020",
  outfile: "main.js",
  sourcemap: isProduction ? false : "inline",
  minify: isProduction,
});
