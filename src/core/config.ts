export type SudokuDifficulty = "easy" | "medium" | "hard";
export type SudokuTheme = "github-dark" | "github-light";

export interface SudokuLabels {
  title: string;
  subtitle: string;
  difficulty: string;
  timer: string;
  mistakes: string;
  liveValidation: string;
  notesOn: string;
  notesOff: string;
  erase: string;
  hint: string;
  restart: string;
  newGame: string;
  currentPuzzle: string;
  bestTimePrefix: string;
  completion: string;
  bestEasy: string;
  bestMedium: string;
  bestHard: string;
  instructions: string;
  winEyebrow: string;
  winTitle: string;
  playAgain: string;
}

export interface SudokuColorOverrides {
  bg?: string;
  panel?: string;
  panelStrong?: string;
  panelSubtle?: string;
  text?: string;
  textStrong?: string;
  muted?: string;
  border?: string;
  borderStrong?: string;
  accent?: string;
  accentHover?: string;
  selection?: string;
  selectionStrong?: string;
  matching?: string;
  danger?: string;
  cell?: string;
  cellUser?: string;
  cellFixed?: string;
  notes?: string;
}

export interface SudokuCallbacks {
  onWin?: (state: SudokuPublicState) => void;
  onChange?: (state: SudokuPublicState) => void;
  onMistake?: (state: SudokuPublicState) => void;
  onGameStart?: (state: SudokuPublicState) => void;
}

export interface SudokuConfig {
  target: string | HTMLElement;
  theme?: SudokuTheme;
  difficulty?: SudokuDifficulty;
  showTimer?: boolean;
  showMistakes?: boolean;
  showHints?: boolean;
  allowNotes?: boolean;
  allowKeyboardInput?: boolean;
  liveValidation?: boolean;
  labels?: Partial<SudokuLabels>;
  colors?: SudokuColorOverrides;
  callbacks?: SudokuCallbacks;
}

export interface ResolvedSudokuConfig {
  target: string | HTMLElement;
  theme: SudokuTheme;
  difficulty: SudokuDifficulty;
  showTimer: boolean;
  showMistakes: boolean;
  showHints: boolean;
  allowNotes: boolean;
  allowKeyboardInput: boolean;
  liveValidation: boolean;
  labels: SudokuLabels;
  colors: SudokuColorOverrides;
  callbacks: SudokuCallbacks;
}

export interface SudokuPublicState {
  difficulty: SudokuDifficulty;
  theme: SudokuTheme;
  timer: number;
  mistakes: number;
  notesMode: boolean;
  status: "idle" | "playing" | "won";
  completion: number;
  selected: { row: number; col: number } | null;
  bestTimes: Record<SudokuDifficulty, number | null>;
  board: number[][];
  initialBoard: number[][];
  solution: number[][];
  fixed: boolean[][];
  hintedCells: string[];
  invalidCells: string[];
}

export const DIFFICULTY_SETTINGS: Record<SudokuDifficulty, { clues: number; label: string }> = {
  easy: { clues: 40, label: "Easy" },
  medium: { clues: 32, label: "Medium" },
  hard: { clues: 26, label: "Hard" },
};

const defaultLabels: SudokuLabels = {
  title: "Sudoku",
  subtitle: "A clean browser-based logic board with GitHub-inspired contrast, spacing, and calm focus states.",
  difficulty: "Difficulty",
  timer: "Time",
  mistakes: "Mistakes",
  liveValidation: "Live validation",
  notesOn: "Notes On",
  notesOff: "Notes Off",
  erase: "Erase",
  hint: "Hint",
  restart: "Restart",
  newGame: "New Game",
  currentPuzzle: "Current puzzle",
  bestTimePrefix: "Best",
  completion: "Completion",
  bestEasy: "Best Easy",
  bestMedium: "Best Medium",
  bestHard: "Best Hard",
  instructions: "Click a cell or use arrow keys to move. Press 1-9 to fill, 0 or Backspace to clear, and N to toggle notes.",
  winEyebrow: "Puzzle complete",
  winTitle: "Beautiful solve.",
  playAgain: "Play Again",
};

export function resolveConfig(config: SudokuConfig): ResolvedSudokuConfig {
  return {
    target: config.target,
    theme: config.theme ?? "github-dark",
    difficulty: config.difficulty ?? "medium",
    showTimer: config.showTimer ?? true,
    showMistakes: config.showMistakes ?? true,
    showHints: config.showHints ?? true,
    allowNotes: config.allowNotes ?? true,
    allowKeyboardInput: config.allowKeyboardInput ?? true,
    liveValidation: config.liveValidation ?? true,
    labels: { ...defaultLabels, ...config.labels },
    colors: config.colors ?? {},
    callbacks: config.callbacks ?? {},
  };
}

