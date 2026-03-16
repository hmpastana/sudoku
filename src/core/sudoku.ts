import { ResolvedSudokuConfig, SudokuDifficulty, SudokuPublicState, SudokuTheme } from "./config";
import { StateSnapshot, SudokuEngine, ValidationResult } from "./state";

export interface SudokuController {
  start(): void;
  newGame(difficulty?: SudokuDifficulty): void;
  restart(): void;
  destroy(): void;
  setTheme(theme: SudokuTheme): void;
  setDifficulty(difficulty: SudokuDifficulty): void;
  getState(): SudokuPublicState;
  validate(): ValidationResult;
  solve(): void;
  toggleNotesMode(): boolean;
  selectCell(row: number, col: number): void;
  inputValue(value: number): void;
  clearSelectedCell(): void;
  applyHint(): void;
  subscribe(listener: (state: StateSnapshot) => void): () => void;
  getSelectionMessage(): string;
  getWinMessage(): string;
}

export function createSudokuController(config: ResolvedSudokuConfig): {
  engine: SudokuEngine;
  controller: SudokuController;
} {
  const engine = new SudokuEngine(config);

  return {
    engine,
    controller: {
      start: () => engine.start(),
      newGame: (difficulty) => engine.newGame(difficulty),
      restart: () => engine.restart(),
      destroy: () => engine.destroy(),
      setTheme: (theme) => engine.setTheme(theme),
      setDifficulty: (difficulty) => engine.setDifficulty(difficulty),
      getState: () => engine.getState(),
      validate: () => engine.validate(),
      solve: () => engine.solve(),
      toggleNotesMode: () => engine.toggleNotesMode(),
      selectCell: (row, col) => engine.selectCell(row, col),
      inputValue: (value) => engine.inputValue(value),
      clearSelectedCell: () => engine.clearSelectedCell(),
      applyHint: () => engine.applyHint(),
      subscribe: (listener) => engine.subscribe(listener),
      getSelectionMessage: () => engine.getSelectionMessage(),
      getWinMessage: () => engine.getWinMessage(),
    },
  };
}

