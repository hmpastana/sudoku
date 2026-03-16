import { cloneGrid, createEmptyGrid, Grid, shuffle } from "./board";
import { DIFFICULTY_SETTINGS, SudokuDifficulty } from "./config";
import { countSolutions } from "./solver";
import { isPlacementValid } from "./validation";

export interface GeneratedPuzzle {
  puzzle: Grid;
  solution: Grid;
}

export function createSolvedBoard(): Grid {
  const grid = createEmptyGrid();
  fillBoard(grid);
  return grid;
}

export function generatePuzzle(difficulty: SudokuDifficulty): GeneratedPuzzle {
  const solution = createSolvedBoard();
  const puzzle = carvePuzzle(solution, DIFFICULTY_SETTINGS[difficulty].clues);
  return { puzzle, solution };
}

function fillBoard(grid: Grid): boolean {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (grid[row][col] !== 0) {
        continue;
      }

      for (const value of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (!isPlacementValid(grid, row, col, value)) {
          continue;
        }

        grid[row][col] = value;
        if (fillBoard(grid)) {
          return true;
        }
        grid[row][col] = 0;
      }

      return false;
    }
  }

  return true;
}

function carvePuzzle(solution: Grid, targetClues: number): Grid {
  const puzzle = cloneGrid(solution);
  const positions = shuffle(Array.from({ length: 81 }, (_, index) => index));
  let filledCount = 81;

  for (const position of positions) {
    if (filledCount <= targetClues) {
      break;
    }

    const row = Math.floor(position / 9);
    const col = position % 9;
    const previous = puzzle[row][col];
    puzzle[row][col] = 0;

    if (countSolutions(cloneGrid(puzzle), 2) !== 1) {
      puzzle[row][col] = previous;
      continue;
    }

    filledCount -= 1;
  }

  return puzzle;
}

