# GitHub Friendly Sudoku

An embeddable browser Sudoku library with a GitHub-inspired default theme. The project has been refactored from a standalone page into a reusable TypeScript package with separated core logic, DOM rendering, portable styles, and a demo app for local development.

## Installation

```bash
npm install github-friendly-sudoku
```

Import the library and the default stylesheet:

```ts
import "github-friendly-sudoku/styles/base.css";
import { createSudoku } from "github-friendly-sudoku";
```

## Basic usage

```ts
import "github-friendly-sudoku/styles/base.css";
import { createSudoku } from "github-friendly-sudoku";

const game = createSudoku({
  target: "#sudoku-container",
  theme: "github-dark",
  difficulty: "medium",
  showTimer: true,
  showMistakes: true,
  allowNotes: true,
});

game.start();
```

## Public API

The `createSudoku` factory returns a controller with these methods:

- `start()`
- `newGame(difficulty?)`
- `restart()`
- `destroy()`
- `setTheme(theme)`
- `setDifficulty(difficulty)`
- `getState()`
- `validate()`
- `solve()`
- `toggleNotesMode()`
- `selectCell(row, col)`
- `inputValue(value)`
- `clearSelectedCell()`
- `applyHint()`
- `subscribe(listener)`

## Configuration options

- `target`: CSS selector or `HTMLElement`
- `theme`: `"github-dark"` or `"github-light"`
- `difficulty`: `"easy" | "medium" | "hard"`
- `showTimer`
- `showMistakes`
- `showHints`
- `allowNotes`
- `allowKeyboardInput`
- `liveValidation`
- `labels`: partial label overrides
- `colors`: partial color overrides for theme variables
- `callbacks.onWin`
- `callbacks.onChange`
- `callbacks.onMistake`
- `callbacks.onGameStart`

## Styling

- Default styles live in [`src/styles/base.css`](./src/styles/base.css)
- All classes are namespaced with the `gsudoku-` prefix
- Consumers can import the default stylesheet or override the exposed CSS variables
- Theme changes can be handled through `setTheme("github-dark" | "github-light")`

## Project structure

```text
src/
  core/
  renderers/
  styles/
  index.ts
demo/
  index.html
  main.ts
```

## Local development

```bash
npm install
npm run dev
```

Open the Vite demo and use the toolbar in `demo/` to switch theme, change difficulty, toggle notes, restart, and start new games using only the public API.

## Build

```bash
npm run build
```

The package is configured for ESM output and type definitions through Vite and TypeScript.

## Publishing notes

- Update `name`, `version`, repository metadata, and license in `package.json`
- Run `npm run build`
- Publish the generated `dist/` folder with npm
- Keep the demo separate from published internals
