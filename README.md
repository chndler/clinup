# clinup

A single-file vanilla HTML/JS tool for cleaning up text copied from CLI output.

Paste in messy terminal text and get "clean", readable output. Handles:

- **Trailing whitespace** — strips trailing spaces from each line (normalizes terminal-padded text)
- **Line continuations** — joins `\`-wrapped commands into a single line
- **Paragraph unwrapping** — rejoins soft-wrapped text while preserving paragraph breaks, list items, and headings
- **Extra spaces** — collapses runs of multiple spaces
- **Outer whitespace** — trims leading/trailing whitespace

Open `index.html` in a browser. No dependencies, no build step.
