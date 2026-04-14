import { execFileSync } from "node:child_process";

const COMMANDS = {
  darwin: { read: ["pbpaste"], write: ["pbcopy"] },
  linux: { read: ["xclip", "-selection", "clipboard", "-o"], write: ["xclip", "-selection", "clipboard"] },
};

function clipboardError(platform, e) {
  const tool = platform === "darwin" ? "pbpaste/pbcopy" : "xclip";
  if (e && e.code === "ENOENT") {
    const hint = platform === "linux" ? " Install with: sudo apt install xclip" : "";
    return `${tool} not found.${hint}`;
  }
  return `Clipboard error: ${e && e.message || "unknown"}`;
}

export function getClipboardCommand(platform) {
  const cmds = COMMANDS[platform];
  if (!cmds) throw new Error(`Clipboard not supported on ${platform}. Supported: macOS, Linux.`);
  return cmds;
}

export function readClipboard(platform = process.platform) {
  const { read } = getClipboardCommand(platform);
  try {
    return execFileSync(read[0], read.slice(1), { encoding: "utf-8" });
  } catch (e) {
    throw new Error(clipboardError(platform, e), { cause: e });
  }
}

export function writeClipboard(text, platform = process.platform) {
  const { write } = getClipboardCommand(platform);
  try {
    execFileSync(write[0], write.slice(1), { input: text, encoding: "utf-8" });
  } catch (e) {
    throw new Error(clipboardError(platform, e), { cause: e });
  }
}
