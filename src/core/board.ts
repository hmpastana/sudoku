export type Grid = number[][];

export interface Position {
  row: number;
  col: number;
}

export type NotesGrid = Set<number>[][];

export function createEmptyGrid(): Grid {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function createEmptyBooleanGrid(): boolean[][] {
  return Array.from({ length: 9 }, () => Array(9).fill(false));
}

export function createEmptyNotes(): NotesGrid {
  return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));
}

export function cloneGrid(grid: Grid): Grid {
  return grid.map((row) => [...row]);
}

export function cloneNotes(notes: NotesGrid): NotesGrid {
  return notes.map((row) => row.map((cell) => new Set(cell)));
}

export function shuffle<T>(values: T[]): T[] {
  const array = [...values];
  for (let index = array.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
  }
  return array;
}

export function sameBox(a: Position, b: Position): boolean {
  return Math.floor(a.row / 3) === Math.floor(b.row / 3) && Math.floor(a.col / 3) === Math.floor(b.col / 3);
}

export function findEmptyCell(grid: Grid): Position | null {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (grid[row][col] === 0) {
        return { row, col };
      }
    }
  }
  return null;
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatTimeOrPlaceholder(value: number | null): string {
  return value === null ? "--:--" : formatTime(value);
}

export function positionKey(position: Position): string {
  return `${position.row}-${position.col}`;
}

