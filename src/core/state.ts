import {
  cloneGrid,
  createEmptyBooleanGrid,
  createEmptyNotes,
  createEmptyGrid,
  formatTime,
  NotesGrid,
  Position,
  positionKey,
  sameBox,
} from "./board";
import { ResolvedSudokuConfig, SudokuDifficulty, SudokuPublicState } from "./config";
import { generatePuzzle } from "./generator";
import { getIncorrectPositions, isSolved } from "./validation";

export interface ValidationResult {
  isSolved: boolean;
  incorrectCells: string[];
}

export interface StateSnapshot extends SudokuPublicState {
  notes: number[][][];
}

export class SudokuEngine {
  private config: ResolvedSudokuConfig;
  private board: number[][] = createEmptyGrid();
  private initialBoard: number[][] = createEmptyGrid();
  private solution: number[][] = createEmptyGrid();
  private fixed: boolean[][] = createEmptyBooleanGrid();
  private notes: NotesGrid = createEmptyNotes();
  private selected: Position | null = null;
  private notesMode = false;
  private mistakes = 0;
  private timer = 0;
  private timerId: number | null = null;
  private status: "idle" | "playing" | "won" = "idle";
  private hintCells = new Set<string>();
  private bestTimes: Record<SudokuDifficulty, number | null> = { easy: null, medium: null, hard: null };
  private listeners = new Set<(state: StateSnapshot) => void>();

  constructor(config: ResolvedSudokuConfig) {
    this.config = config;
  }

  subscribe(listener: (state: StateSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getStateSnapshot());
    return () => this.listeners.delete(listener);
  }

  start(): void {
    this.newGame(this.config.difficulty);
  }

  destroy(): void {
    this.stopTimer();
    this.listeners.clear();
  }

  newGame(difficulty = this.config.difficulty): void {
    this.stopTimer();
    this.status = "playing";
    this.config.difficulty = difficulty;
    const { puzzle, solution } = generatePuzzle(difficulty);
    this.board = cloneGrid(puzzle);
    this.initialBoard = cloneGrid(puzzle);
    this.solution = cloneGrid(solution);
    this.fixed = puzzle.map((row) => row.map((value) => value !== 0));
    this.notes = createEmptyNotes();
    this.selected = this.findFirstEditableCell();
    this.notesMode = false;
    this.mistakes = 0;
    this.timer = 0;
    this.hintCells = new Set();
    this.startTimer();
    this.emitChange();
    this.config.callbacks.onGameStart?.(this.getPublicState());
  }

  restart(): void {
    if (!this.initialBoard.length) {
      return;
    }

    this.stopTimer();
    this.board = cloneGrid(this.initialBoard);
    this.notes = createEmptyNotes();
    this.selected = this.findFirstEditableCell();
    this.notesMode = false;
    this.mistakes = 0;
    this.timer = 0;
    this.hintCells = new Set();
    this.status = "playing";
    this.startTimer();
    this.emitChange();
  }

  setTheme(theme: ResolvedSudokuConfig["theme"]): void {
    this.config.theme = theme;
    this.emitChange();
  }

  setDifficulty(difficulty: SudokuDifficulty): void {
    this.config.difficulty = difficulty;
    this.newGame(difficulty);
  }

  toggleNotesMode(): boolean {
    if (!this.config.allowNotes) {
      return this.notesMode;
    }

    this.notesMode = !this.notesMode;
    this.emitChange();
    return this.notesMode;
  }

  selectCell(row: number, col: number): void {
    this.selected = { row, col };
    this.emitChange();
  }

  moveSelection(direction: "up" | "down" | "left" | "right"): void {
    if (!this.selected) {
      this.selected = this.findFirstEditableCell() ?? { row: 0, col: 0 };
      this.emitChange();
      return;
    }

    const delta = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
    } as const;

    const nextRow = (this.selected.row + delta[direction][0] + 9) % 9;
    const nextCol = (this.selected.col + delta[direction][1] + 9) % 9;
    this.selected = { row: nextRow, col: nextCol };
    this.emitChange();
  }

  inputValue(value: number): void {
    if (!this.selected) {
      return;
    }

    const { row, col } = this.selected;
    if (this.fixed[row][col]) {
      return;
    }

    if (this.notesMode && this.config.allowNotes) {
      if (this.board[row][col] !== 0) {
        this.board[row][col] = 0;
      }

      const noteSet = this.notes[row][col];
      if (noteSet.has(value)) {
        noteSet.delete(value);
      } else {
        noteSet.add(value);
      }

      this.emitChange();
      return;
    }

    const previous = this.board[row][col];
    this.board[row][col] = value;
    this.notes[row][col].clear();
    this.clearRelatedNotes(row, col, value);
    this.hintCells.delete(positionKey({ row, col }));

    if (value !== previous && value !== this.solution[row][col]) {
      this.mistakes += 1;
      this.config.callbacks.onMistake?.(this.getPublicState());
    }

    this.afterBoardMutation();
  }

  clearSelectedCell(): void {
    if (!this.selected) {
      return;
    }

    const { row, col } = this.selected;
    if (this.fixed[row][col]) {
      return;
    }

    this.board[row][col] = 0;
    this.notes[row][col].clear();
    this.hintCells.delete(positionKey({ row, col }));
    this.afterBoardMutation();
  }

  applyHint(): void {
    const target = this.selected && !this.fixed[this.selected.row][this.selected.col]
      ? this.selected
      : this.findFirstEmptyCell();

    if (!target) {
      return;
    }

    const value = this.solution[target.row][target.col];
    this.board[target.row][target.col] = value;
    this.notes[target.row][target.col].clear();
    this.clearRelatedNotes(target.row, target.col, value);
    this.hintCells.add(positionKey(target));
    this.afterBoardMutation();
  }

  validate(): ValidationResult {
    const incorrectCells = getIncorrectPositions(this.board, this.solution).map(positionKey);
    return {
      isSolved: isSolved(this.board, this.solution),
      incorrectCells,
    };
  }

  solve(): void {
    this.board = cloneGrid(this.solution);
    this.notes = createEmptyNotes();
    this.hintCells = new Set();
    this.handleWin();
  }

  getState(): SudokuPublicState {
    return this.getPublicState();
  }

  getStateSnapshot(): StateSnapshot {
    return {
      ...this.getPublicState(),
      notes: this.notes.map((row) => row.map((cell) => [...cell].sort((a, b) => a - b))),
    };
  }

  getSelectionMessage(): string {
    if (!this.selected) {
      return "Select a cell to begin.";
    }

    const { row, col } = this.selected;
    if (this.fixed[row][col]) {
      return `Row ${row + 1}, column ${col + 1} is a starting clue.`;
    }

    return this.notesMode
      ? `Row ${row + 1}, column ${col + 1}. Notes mode is on.`
      : `Row ${row + 1}, column ${col + 1}. Enter a number from 1 to 9.`;
  }

  getWinMessage(): string {
    return `You solved the ${this.config.difficulty} board in ${formatTime(this.timer)} with ${this.mistakes} mistake${this.mistakes === 1 ? "" : "s"}.`;
  }

  private afterBoardMutation(): void {
    if (isSolved(this.board, this.solution)) {
      this.handleWin();
      return;
    }

    this.emitChange();
  }

  private handleWin(): void {
    this.status = "won";
    this.stopTimer();
    this.updateBestTime();
    this.emitChange();
    this.config.callbacks.onWin?.(this.getPublicState());
  }

  private emitChange(): void {
    const snapshot = this.getStateSnapshot();
    this.listeners.forEach((listener) => listener(snapshot));
    this.config.callbacks.onChange?.(this.getPublicState());
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      this.timer += 1;
      this.emitChange();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateBestTime(): void {
    const currentBest = this.bestTimes[this.config.difficulty];
    if (currentBest === null || this.timer < currentBest) {
      this.bestTimes[this.config.difficulty] = this.timer;
    }
  }

  private findFirstEditableCell(): Position | null {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (!this.fixed[row][col]) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private findFirstEmptyCell(): Position | null {
    for (let row = 0; row < 9; row += 1) {
      for (let col = 0; col < 9; col += 1) {
        if (this.board[row][col] === 0 && !this.fixed[row][col]) {
          return { row, col };
        }
      }
    }
    return null;
  }

  private clearRelatedNotes(row: number, col: number, value: number): void {
    for (let index = 0; index < 9; index += 1) {
      this.notes[row][index].delete(value);
      this.notes[index][col].delete(value);
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let currentRow = boxRow; currentRow < boxRow + 3; currentRow += 1) {
      for (let currentCol = boxCol; currentCol < boxCol + 3; currentCol += 1) {
        this.notes[currentRow][currentCol].delete(value);
      }
    }
  }

  private getCompletion(): number {
    const filled = this.board.flat().filter(Boolean).length;
    return Math.round((filled / 81) * 100);
  }

  private getPublicState(): SudokuPublicState {
    const validation = this.validate();
    return {
      difficulty: this.config.difficulty,
      theme: this.config.theme,
      timer: this.timer,
      mistakes: this.mistakes,
      notesMode: this.notesMode,
      status: this.status,
      completion: this.getCompletion(),
      selected: this.selected ? { ...this.selected } : null,
      bestTimes: { ...this.bestTimes },
      board: cloneGrid(this.board),
      initialBoard: cloneGrid(this.initialBoard),
      solution: cloneGrid(this.solution),
      fixed: this.fixed.map((row) => [...row]),
      hintedCells: [...this.hintCells],
      invalidCells: this.config.liveValidation ? validation.incorrectCells : [],
    };
  }
}

export function isRelatedCell(selected: Position | null, cell: Position): boolean {
  return !!selected && (selected.row === cell.row || selected.col === cell.col || sameBox(selected, cell));
}
