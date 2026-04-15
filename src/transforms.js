const RE_PARA_BREAK = /\n\s*\n/;
const RE_NEWLINE_WS = /\n\s*/g;
const RE_LIST_OR_HEADING = /^[-*+•⏺★✦◆▶►■●⚡⚠⚙➤→✓✗] |^\d+[.)] |^#{1,6} /;
const RE_HEADING_LINE = /^\s*(?:(?:[⏺•]\s*)?#{1,6} |[★✦◆▶►■●⚡⚠⚙➤→✓✗]\s)/;
const RE_GUTTER = /^\s*[\u2502\u2503\u2551\u2588-\u258F]\s?/gm;
const RE_BOX_RULES = /(?:^\s*[\u2500-\u257F]{3,}\s*$\n?|\s+[\u2500-\u257F]{3,}\s*$)/gm;
const RE_TRAILING_WS = /[^\S\n]+$/gm;
const RE_CONTINUATION = /\\\s*\n\s*/g;
const RE_MULTI_SPACE = / {2,}/g;
const RE_TOKENIZE = /(\S+|\s+)/g;

function unwrapParagraphs(text, trim) {
  return text.split(RE_PARA_BREAK).map(para => {
    const unwrapped = para.replace(RE_NEWLINE_WS, (match, offset) => {
      const rest = para.slice(offset + match.length);
      if (RE_LIST_OR_HEADING.test(rest)) return "\n";
      const before = para.slice(0, offset);
      const lastLine = before.substring(before.lastIndexOf("\n") + 1);
      if (RE_HEADING_LINE.test(lastLine)) return "\n";
      return " ";
    });
    return trim ? unwrapped.trim() : unwrapped;
  }).join("\n\n");
}

function cleanText(text, options = {}) {
  const {
    stripGutters = true,
    stripRules = true,
    stripTrailing = true,
    joinContinuations = true,
    unwrapParagraphs: doUnwrap = true,
    collapseSpaces = true,
    trimOuter = true,
  } = options;

  let result = text;
  if (stripGutters)      result = result.replace(RE_GUTTER, "");
  if (stripRules)        result = result.replace(RE_BOX_RULES, "");
  if (stripTrailing)     result = result.replace(RE_TRAILING_WS, "");
  if (joinContinuations) result = result.replace(RE_CONTINUATION, " ");
  if (doUnwrap)          result = unwrapParagraphs(result, trimOuter);
  if (collapseSpaces)    result = result.replace(RE_MULTI_SPACE, " ");
  if (trimOuter)         result = result.trim();
  return result;
}

function computeDiff(oldLines, newLines) {
  const m = oldLines.length;
  const n = newLines.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = oldLines[i - 1] === newLines[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const entries = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      entries.push({ type: "unchanged", text: newLines[j - 1] });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      entries.push({ type: "added", text: newLines[j - 1] });
      j--;
    } else {
      entries.push({ type: "removed", text: oldLines[i - 1] });
      i--;
    }
  }

  return entries.reverse();
}

function computeTokenDiff(oldStr, newStr) {
  if (oldStr === newStr) return null;
  const oldToks = oldStr.match(RE_TOKENIZE) || [];
  const newToks = newStr.match(RE_TOKENIZE) || [];
  return computeDiff(oldToks, newToks).map(e => ({
    type: e.type === "unchanged" ? "same" : e.type === "removed" ? "del" : "ins",
    text: e.text
  }));
}

export {
  RE_PARA_BREAK, RE_NEWLINE_WS, RE_LIST_OR_HEADING, RE_HEADING_LINE,
  RE_GUTTER, RE_BOX_RULES, RE_TRAILING_WS, RE_CONTINUATION, RE_MULTI_SPACE, RE_TOKENIZE,
  unwrapParagraphs, cleanText, computeDiff, computeTokenDiff,
};
