# clinup

A single-file vanilla HTML/JS tool for cleaning up text copied from CLI output.

Paste in messy terminal text and get clean readable output.

No dependencies, no build step. Everything runs in your browser; no data is sent to any server.*

**[Try it live](https://chndler.github.io/clinup/)** or open `index.html` locally.  

**[View source on GitHub](https://github.com/chndler/clinup)** 

## Transforms

- **strip-trailing** - removes trailing spaces from each line
- **join-continuations** - joins `\`-wrapped commands into a single line
- **unwrap-paragraphs** - rejoins soft-wrapped text while preserving paragraph breaks, list items, and headings
- **collapse-spaces** - collapses runs of multiple spaces
- **trim-outer** - trims leading/trailing whitespace

All transforms are toggleable and run in sequence.

### Example

```

  go  build  -ldflags \
    "-s  -w" \
    ./cmd/server   

  Build  completed  with
  3  optimizations  applied:

  - stripped  debug  symbols
    and  DWARF  info   
  - dead  code  elimination
    across  all  packages
  - static  linking  for
    single  binary  output

```
becomes
```
go build -ldflags "-s -w" ./cmd/server

Build completed with 3 optimizations applied:

- stripped debug symbols and DWARF info
- dead code elimination across all packages
- static linking for single binary output
```

## Output controls

- **lines** - line number gutter (input and output)
- **ws** - whitespace visualization (spaces as `·`, tabs as `→`)
- **wrap** - soft line wrapping (input and output)
- **diff** - [LCS](https://en.wikipedia.org/wiki/Longest_common_subsequence)-based diff view with dual gutters, +/- indicators, and colored summary

## Copying

The Copy button copies clean text. Cmd/Ctrl+C from the output preserves real characters — whitespace visualization symbols are swapped back to actual spaces/tabs.

---

*At least from this page’s code. Your browser or extensions could still do their own thing.
