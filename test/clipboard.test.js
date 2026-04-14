import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getClipboardCommand } from "../src/clipboard.js";

describe("getClipboardCommand", () => {
  it("returns pbpaste/pbcopy on darwin", () => {
    const { read, write } = getClipboardCommand("darwin");
    assert.deepEqual(read, ["pbpaste"]);
    assert.deepEqual(write, ["pbcopy"]);
  });

  it("returns xclip on linux", () => {
    const { read, write } = getClipboardCommand("linux");
    assert.deepEqual(read, ["xclip", "-selection", "clipboard", "-o"]);
    assert.deepEqual(write, ["xclip", "-selection", "clipboard"]);
  });

  it("throws on unsupported platform", () => {
    assert.throws(() => getClipboardCommand("win32"), /not supported/);
  });
});
