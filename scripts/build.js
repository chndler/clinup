import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const transforms = readFileSync(join(root, "src", "transforms.js"), "utf-8");
const template = readFileSync(join(root, "src", "template.html"), "utf-8");

const MARKER = "/* __TRANSFORMS__ */";
if (!template.includes(MARKER)) {
  console.error(`Marker ${MARKER} not found in src/template.html`);
  process.exit(1);
}

const inlineJS = transforms
  .replace(/^export\s*\{[^}]*\};\s*$/m, "")
  .trimEnd()
  .split("\n")
  .map(line => line ? "  " + line : line)
  .join("\n");

const output = template.replace(/^[ \t]*\/\* __TRANSFORMS__ \*\/$/m, inlineJS);
if (output.includes(MARKER)) {
  console.error("Marker replacement failed — check template.html formatting");
  process.exit(1);
}
writeFileSync(join(root, "index.html"), output);
console.log("Built index.html");
