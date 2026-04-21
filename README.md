# clinup

A single-file vanilla HTML/JS tool for cleaning up text copied from CLI output.

Paste in messy terminal text and get clean readable output.

Zero runtime dependencies. Everything runs in your browser; no data is sent to any server.*

**[Try it live](https://chndler.github.io/clinup/)** or open `index.html` locally.  

**[View source on GitHub](https://github.com/chndler/clinup)** 

## Transforms

- **strip-rules** - removes lines made of box-drawing characters (`─`, `═`, etc.) and strips trailing rules from mixed lines
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

  ★ Build Report ─────────────────────────
  Build  completed  with
  3  optimizations  applied:

  - stripped  debug  symbols
    and  DWARF  info   
  - dead  code  elimination
    across  all  packages
  - static  linking  for
    single  binary  output
  ─────────────────────────────────────────

```
becomes
```
go build -ldflags "-s -w" ./cmd/server

★ Build Report
Build completed with 3 optimizations applied:

- stripped debug symbols and DWARF info
- dead code elimination across all packages
- static linking for single binary output
```

## Display controls

- **lines** - line number gutter
- **wrap** - soft line wrapping
- **ws** - whitespace visualization (spaces as `·`, tabs as `→`) - output only
- **diff** - [LCS](https://en.wikipedia.org/wiki/Longest_common_subsequence)-based diff view with dual gutters, +/- indicators, and colored summary - output only

## Copying Output

The Copy button copies clean text. Cmd/Ctrl+C from the output preserves real characters - whitespace visualization symbols are swapped back to actual spaces/tabs.

## CLI

Run directly with Node or compile to a standalone binary with Bun:

```sh
node bin/clinup.js              # run directly
bun build bin/clinup.js --compile --outfile clinup  # compile
```

### Usage

```sh
clinup                                    # clipboard → stdout + clipboard
clinup -i messy.txt                       # file → stdout
clinup -i messy.txt -o clean.txt          # file → file
cat messy.txt | clinup                    # stdin → stdout
clinup --disable join-lines                # skip specific transforms
clinup --no-clipboard                     # don't update clipboard
clinup --help                             # show all options
```

## Development

The transform logic lives in `src/transforms.js` and is inlined into `index.html` at build time.

```sh
npm run build   # rebuild index.html from src/
npm test        # run unit tests
```

CI runs tests and checks that `index.html` is up-to-date with the source.

---

*At least from this page’s code. Your browser or extensions could still do their own thing.
