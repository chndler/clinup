// test/cli.test.js
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseArgs } from "../bin/clinup.js";
import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

describe("parseArgs", () => {
  it("returns defaults with no args", () => {
    const opts = parseArgs([]);
    assert.equal(opts.input, null);
    assert.equal(opts.output, null);
    assert.equal(opts.clipboard, null);
    assert.deepEqual(opts.disable, []);
    assert.equal(opts.quiet, false);
    assert.equal(opts.help, false);
    assert.equal(opts.version, false);
  });

  it("parses --quiet and -q", () => {
    assert.equal(parseArgs(["--quiet"]).quiet, true);
    assert.equal(parseArgs(["-q"]).quiet, true);
  });

  it("parses -i and -o flags", () => {
    const opts = parseArgs(["-i", "in.txt", "-o", "out.txt"]);
    assert.equal(opts.input, "in.txt");
    assert.equal(opts.output, "out.txt");
  });

  it("parses long form --input and --output", () => {
    const opts = parseArgs(["--input", "in.txt", "--output", "out.txt"]);
    assert.equal(opts.input, "in.txt");
    assert.equal(opts.output, "out.txt");
  });

  it("parses --disable with comma-separated values", () => {
    const opts = parseArgs(["--disable", "strip-rules,unwrap-paragraphs"]);
    assert.deepEqual(opts.disable, ["strip-rules", "unwrap-paragraphs"]);
  });

  it("parses -d shorthand", () => {
    const opts = parseArgs(["-d", "trim-outer"]);
    assert.deepEqual(opts.disable, ["trim-outer"]);
  });

  it("parses --clipboard flag", () => {
    const opts = parseArgs(["--clipboard"]);
    assert.equal(opts.clipboard, true);
  });

  it("parses --no-clipboard flag", () => {
    const opts = parseArgs(["--no-clipboard"]);
    assert.equal(opts.clipboard, false);
  });

  it("parses --help and -h", () => {
    assert.equal(parseArgs(["--help"]).help, true);
    assert.equal(parseArgs(["-h"]).help, true);
  });

  it("parses --version and -v", () => {
    assert.equal(parseArgs(["--version"]).version, true);
    assert.equal(parseArgs(["-v"]).version, true);
  });

  it("throws on unknown --disable value", () => {
    assert.throws(() => parseArgs(["--disable", "bogus"]), /Unknown transform/);
  });

  it("throws on unknown flag", () => {
    assert.throws(() => parseArgs(["--bogus"]), /Unknown flag/);
  });

  it("throws when -i has no path", () => {
    assert.throws(() => parseArgs(["-i"]), /requires a path/);
  });

  it("throws when -o has no path", () => {
    assert.throws(() => parseArgs(["-o"]), /requires a path/);
  });

  it("throws when -d has no value", () => {
    assert.throws(() => parseArgs(["-d"]), /requires a list/);
  });
});

describe("CLI integration", () => {
  const cli = join(import.meta.dirname, "..", "bin", "clinup.js");

  it("cleans piped input", () => {
    const result = execFileSync("node", [cli], {
      input: "hello    world",
      encoding: "utf-8",
    });
    assert.equal(result.trim(), "hello world");
  });

  it("cleans input from file via -i", () => {
    const dir = mkdtempSync(join(tmpdir(), "clinup-"));
    const inFile = join(dir, "in.txt");
    writeFileSync(inFile, "hello    world");
    try {
      const result = execFileSync("node", [cli, "-i", inFile], { encoding: "utf-8" });
      assert.equal(result.trim(), "hello world");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("writes output to file via -o", () => {
    const dir = mkdtempSync(join(tmpdir(), "clinup-"));
    const inFile = join(dir, "in.txt");
    const outFile = join(dir, "out.txt");
    writeFileSync(inFile, "hello    world");
    try {
      execFileSync("node", [cli, "-i", inFile, "-o", outFile], { encoding: "utf-8" });
      const result = readFileSync(outFile, "utf-8");
      assert.equal(result.trim(), "hello world");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("-o suppresses stdout", () => {
    const dir = mkdtempSync(join(tmpdir(), "clinup-"));
    const inFile = join(dir, "in.txt");
    const outFile = join(dir, "out.txt");
    writeFileSync(inFile, "hello    world");
    try {
      const stdout = execFileSync("node", [cli, "-i", inFile, "-o", outFile], { encoding: "utf-8" });
      assert.equal(stdout, "");
      assert.equal(readFileSync(outFile, "utf-8").trim(), "hello world");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("respects --disable flag", () => {
    const result = execFileSync("node", [cli, "--disable", "collapse-spaces"], {
      input: "hello    world",
      encoding: "utf-8",
    });
    assert.equal(result.trim(), "hello    world");
  });

  it("suppresses stdout with --quiet", () => {
    const result = execFileSync("node", [cli, "-q"], {
      input: "hello    world",
      encoding: "utf-8",
    });
    assert.equal(result, "");
  });

  it("prints help with --help", () => {
    const result = execFileSync("node", [cli, "--help"], { encoding: "utf-8" });
    assert.ok(result.includes("Usage: clinup"));
  });

  it("prints version with --version", () => {
    const result = execFileSync("node", [cli, "--version"], { encoding: "utf-8" });
    assert.match(result.trim(), /^\d+\.\d+\.\d+$/);
  });

  it("exits silently on empty input", () => {
    const result = execFileSync("node", [cli], { input: "", encoding: "utf-8" });
    assert.equal(result, "");
  });

  it("fails on unknown --disable value", () => {
    assert.throws(() => {
      execFileSync("node", [cli, "--disable", "bogus"], { input: "test", encoding: "utf-8" });
    });
  });
});
