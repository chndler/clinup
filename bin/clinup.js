#!/usr/bin/env node
import { cleanText } from "../src/transforms.js";
import { readClipboard, writeClipboard } from "../src/clipboard.js";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { version: VERSION } = require("../package.json");

const TRANSFORM_MAP = {
  "strip-gutters": "stripGutters",
  "strip-rules": "stripRules",
  "strip-trailing": "stripTrailing",
  "join-continuations": "joinContinuations",
  "unwrap-paragraphs": "unwrapParagraphs",
  "collapse-spaces": "collapseSpaces",
  "trim-outer": "trimOuter",
};

export function parseArgs(argv) {
  const opts = { input: null, output: null, clipboard: null, quiet: false, disable: [], help: false, version: false };
  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    switch (arg) {
      case "-i": case "--input":
        if (++i >= argv.length) throw new Error("--input requires a path");
        opts.input = argv[i]; break;
      case "-o": case "--output":
        if (++i >= argv.length) throw new Error("--output requires a path");
        opts.output = argv[i]; break;
      case "-d": case "--disable":
        if (++i >= argv.length) throw new Error("--disable requires a list of transforms");
        opts.disable = argv[i].split(",").map(s => s.trim());
        for (const name of opts.disable) {
          if (!(name in TRANSFORM_MAP)) {
            throw new Error(`Unknown transform: "${name}". Valid: ${Object.keys(TRANSFORM_MAP).join(", ")}`);
          }
        }
        break;
      case "--clipboard":
        opts.clipboard = true; break;
      case "--no-clipboard":
        opts.clipboard = false; break;
      case "-q": case "--quiet":
        opts.quiet = true; break;
      case "-h": case "--help":
        opts.help = true; break;
      case "-v": case "--version":
        opts.version = true; break;
      default:
        throw new Error(`Unknown flag: ${arg}. Run clinup --help for usage.`);
    }
    i++;
  }
  return opts;
}

function buildOptions(disable) {
  const opts = {};
  for (const name of disable) {
    opts[TRANSFORM_MAP[name]] = false;
  }
  return opts;
}

const HELP = `Usage: clinup [flags]

Clean messy terminal text. Reads from clipboard by default.

Input:
  -i, --input <path>     Read from file
  (pipe)                 Read from stdin when piped
  (default)              Read from clipboard

Output:
  -o, --output <path>    Write to file
  -q, --quiet            Suppress stdout output
  (default)              Write to stdout

Clipboard:
  --clipboard            Force write result to clipboard
  --no-clipboard         Skip clipboard write

Transforms (all enabled by default):
  -d, --disable <list>   Comma-separated transforms to disable:
                         strip-rules, strip-trailing, join-continuations,
                         unwrap-paragraphs, collapse-spaces, trim-outer

Other:
  -h, --help             Show this help
  -v, --version          Show version
`;

function main() {
  try {
    const opts = parseArgs(process.argv.slice(2));

    if (opts.help) { process.stdout.write(HELP); return; }
    if (opts.version) { process.stdout.write(VERSION + "\n"); return; }

    // Resolve input
    let text;
    const isTTY = process.stdin.isTTY;
    const isClipboardMode = !opts.input && isTTY;

    if (opts.input) {
      text = readFileSync(opts.input, "utf-8");
    } else if (!isTTY) {
      text = readFileSync(0, "utf-8");
    } else {
      text = readClipboard();
    }

    if (!text || !text.trim()) return;

    // Clean
    const result = cleanText(text, buildOptions(opts.disable));

    // Resolve output
    if (opts.output) writeFileSync(opts.output, result + "\n");
    if (!opts.quiet && !opts.output) process.stdout.write(result + "\n");

    // Clipboard write
    const shouldWriteClipboard =
      opts.clipboard === true ||
      (opts.clipboard === null && isClipboardMode);

    if (shouldWriteClipboard) {
      writeClipboard(result);
    }
  } catch (e) {
    process.stderr.write(`Error: ${e.message}\n`);
    process.exit(1);
  }
}

const isMain = typeof Bun !== "undefined"
  ? import.meta.main
  : process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) main();
