import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  cleanText, unwrapParagraphs, computeDiff, computeTokenDiff,
} from "../src/transforms.js";

describe("cleanText (full pipeline)", () => {
  it("produces the expected output from the README example", () => {
    const input = `
  go  build  -ldflags \\
    "-s  -w" \\
    ./cmd/server

  \u2605 Build Report \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
  Build  completed  with
  3  optimizations  applied:

  - stripped  debug  symbols
    and  DWARF  info
  - dead  code  elimination
    across  all  packages
  - static  linking  for
    single  binary  output
  \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

`;

    const expected = `go build -ldflags "-s -w" ./cmd/server

\u2605 Build Report
Build completed with 3 optimizations applied:

- stripped debug symbols and DWARF info
- dead code elimination across all packages
- static linking for single binary output`;

    assert.equal(cleanText(input), expected);
  });

  it("returns empty string for empty input", () => {
    assert.equal(cleanText(""), "");
  });

  it("returns empty string for whitespace-only input", () => {
    assert.equal(cleanText("   \n\n  "), "");
  });
});

describe("cleanText passthrough", () => {
  it("returns input unchanged when all options are disabled", () => {
    const input = "  hello   world  \n  line two  \n";
    const opts = { stripRules: false, stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false };
    assert.equal(cleanText(input, opts), input);
  });
});

describe("strip-rules", () => {
  it("removes lines made entirely of box-drawing characters", () => {
    const input = "hello\n\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nworld";
    const result = cleanText(input, { stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, "hello\nworld");
  });

  it("strips trailing rules from mixed lines", () => {
    const input = "Title \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
    const result = cleanText(input, { stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, "Title");
  });

  it("handles box-drawing chars at range boundaries (U+2500, U+257F)", () => {
    const input = "hello\n\u2500\u2500\u2500\nworld\n\u257F\u257F\u257F\nmiddle";
    const result = cleanText(input, { stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, "hello\nworld\nmiddle");
  });

  it("preserves content when disabled", () => {
    const input = "Title \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500";
    const result = cleanText(input, { stripRules: false, stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, input);
  });
});

describe("strip-trailing", () => {
  it("removes trailing spaces", () => {
    const input = "hello   \nworld  ";
    const result = cleanText(input, { stripRules: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, "hello\nworld");
  });

  it("preserves leading spaces", () => {
    const input = "  indented";
    const result = cleanText(input, { stripRules: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, "  indented");
  });
});

describe("join-continuations", () => {
  it("joins backslash-wrapped lines", () => {
    const input = "go build \\\n  -ldflags \\\n  \"-s -w\"";
    const result = cleanText(input, { stripRules: false, stripTrailing: false, unwrapParagraphs: false, collapseSpaces: false, trimOuter: false });
    // double spaces are expected here — collapse-spaces handles them downstream
    assert.equal(result, "go build  -ldflags  \"-s -w\"");
  });
});

describe("unwrap-paragraphs", () => {
  it("joins soft-wrapped lines within a paragraph", () => {
    const input = "this is a\nlong paragraph\nthat wraps";
    assert.equal(unwrapParagraphs(input, true), "this is a long paragraph that wraps");
  });

  it("preserves paragraph breaks (double newlines)", () => {
    const input = "first paragraph\nline two\n\nsecond paragraph\nline two";
    assert.equal(unwrapParagraphs(input, true), "first paragraph line two\n\nsecond paragraph line two");
  });

  it("preserves line breaks before list items with -", () => {
    const input = "items:\n- first\n- second\n- third";
    assert.equal(unwrapParagraphs(input, true), "items:\n- first\n- second\n- third");
  });

  it("preserves line breaks before list items with *", () => {
    const input = "items:\n* first\n* second";
    assert.equal(unwrapParagraphs(input, true), "items:\n* first\n* second");
  });

  it("preserves line breaks before numbered list items", () => {
    const input = "steps:\n1. first\n2. second";
    assert.equal(unwrapParagraphs(input, true), "steps:\n1. first\n2. second");
  });

  it("joins list item continuation lines", () => {
    const input = "- first item\n  continues here\n- second item";
    assert.equal(unwrapParagraphs(input, true), "- first item continues here\n- second item");
  });

  it("preserves line breaks after markdown headings", () => {
    const input = "## Section Title\nSome text that wraps";
    assert.equal(unwrapParagraphs(input, true), "## Section Title\nSome text that wraps");
  });

  it("preserves line breaks after \u2605 heading", () => {
    const input = "\u2605 Build Report\nBuild completed with";
    assert.equal(unwrapParagraphs(input, true), "\u2605 Build Report\nBuild completed with");
  });

  it("preserves line breaks after \u26A0 heading", () => {
    const input = "\u26A0 Warning\nSomething went wrong";
    assert.equal(unwrapParagraphs(input, true), "\u26A0 Warning\nSomething went wrong");
  });

  it("preserves line breaks after \u25B6 heading", () => {
    const input = "\u25B6 Running tests\nAll tests passed";
    assert.equal(unwrapParagraphs(input, true), "\u25B6 Running tests\nAll tests passed");
  });

  it("preserves line breaks before \u2605 heading lines", () => {
    const input = "some text\n\u2605 New Section\nmore text";
    assert.equal(unwrapParagraphs(input, true), "some text\n\u2605 New Section\nmore text");
  });

  it("preserves line breaks after bullet-prefixed markdown heading", () => {
    const input = "\u2022 ## Sub-heading\nsome text";
    assert.equal(unwrapParagraphs(input, true), "\u2022 ## Sub-heading\nsome text");
  });
});

describe("transform interactions", () => {
  it("strip-rules + unwrap: heading line preserved after trailing rule is stripped", () => {
    const input = "\u2605 Title \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\nBody text here";
    const result = cleanText(input, { stripTrailing: false, joinContinuations: false, collapseSpaces: false, trimOuter: false });
    assert.equal(result, "\u2605 Title\nBody text here");
  });

  it("join-continuations + collapse-spaces: double spaces from joins get collapsed", () => {
    const input = "cmd \\\n  --flag \\\n  --other";
    const result = cleanText(input, { stripRules: false, stripTrailing: false, unwrapParagraphs: false, trimOuter: false });
    assert.equal(result, "cmd --flag --other");
  });
});

describe("collapse-spaces", () => {
  it("collapses multiple spaces to one", () => {
    const input = "hello    world   foo";
    const result = cleanText(input, { stripRules: false, stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, trimOuter: false });
    assert.equal(result, "hello world foo");
  });

  it("leaves single spaces alone", () => {
    const input = "hello world";
    const result = cleanText(input, { stripRules: false, stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, trimOuter: false });
    assert.equal(result, "hello world");
  });
});

describe("trim-outer", () => {
  it("trims leading and trailing whitespace", () => {
    const input = "\n\n  hello world  \n\n";
    const result = cleanText(input, { stripRules: false, stripTrailing: false, joinContinuations: false, unwrapParagraphs: false, collapseSpaces: false });
    assert.equal(result, "hello world");
  });
});

describe("computeDiff", () => {
  it("returns all unchanged for identical inputs", () => {
    const lines = ["a", "b", "c"];
    const result = computeDiff(lines, lines);
    assert.deepEqual(result, [
      { type: "unchanged", text: "a" },
      { type: "unchanged", text: "b" },
      { type: "unchanged", text: "c" },
    ]);
  });

  it("detects added lines", () => {
    const result = computeDiff(["a"], ["a", "b"]);
    assert.deepEqual(result, [
      { type: "unchanged", text: "a" },
      { type: "added", text: "b" },
    ]);
  });

  it("detects removed lines", () => {
    const result = computeDiff(["a", "b"], ["a"]);
    assert.deepEqual(result, [
      { type: "unchanged", text: "a" },
      { type: "removed", text: "b" },
    ]);
  });

  it("handles completely different inputs", () => {
    const result = computeDiff(["a", "b"], ["c", "d"]);
    const types = result.map(e => e.type);
    assert.ok(types.includes("removed"));
    assert.ok(types.includes("added"));
    assert.ok(!types.includes("unchanged"));
  });

  it("handles empty inputs", () => {
    assert.deepEqual(computeDiff([], []), []);
    assert.deepEqual(computeDiff(["a"], []), [{ type: "removed", text: "a" }]);
    assert.deepEqual(computeDiff([], ["a"]), [{ type: "added", text: "a" }]);
  });
});

describe("computeTokenDiff", () => {
  it("returns null for identical strings", () => {
    assert.equal(computeTokenDiff("hello world", "hello world"), null);
  });

  it("detects changed tokens", () => {
    const result = computeTokenDiff("hello world", "hello there");
    assert.ok(result);
    const types = result.map(e => e.type);
    assert.ok(types.includes("same"));
    assert.ok(types.includes("del") || types.includes("ins"));
  });

  it("handles empty strings", () => {
    assert.equal(computeTokenDiff("", ""), null);
  });

  it("detects whitespace-only differences", () => {
    const result = computeTokenDiff("a b", "a  b");
    assert.ok(result);
    assert.ok(result.some(e => e.type === "del" || e.type === "ins"));
  });
});
