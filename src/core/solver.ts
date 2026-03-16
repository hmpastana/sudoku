import { cloneGrid, findEmptyCell, Grid } from "./board";
import { isPlacementValid } from "./validation";

export function solveBoard(grid: Grid): Grid | null {
  const working = cloneGrid(grid);
  return fillBoard(working) ? working : null;
}

export function countSolutions(grid: Grid, limit = 2): number {
  const empty = findEmptyCell(grid);
  if (!empty) {
    return 1;
  }

  let count = 0;
  for (let value = 1; value <= 9; value += 1) {
    if (!isPlacementValid(grid, empty.row, empty.col, value)) {
      continue;
    }

    grid[empty.row][empty.col] = value;
    count += countSolutions(grid, limit - count);
    if (count >= limit) {
      break;
    }
    grid[empty.row][empty.col] = 0;
  }

  grid[empty.row][empty.col] = 0;
  return count;
}

function fillBoard(grid: Grid): boolean {
  const empty = findEmptyCell(grid);
  if (!empty) {
    return true;
  }

  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
  for (const value of values) {
    if (!isPlacementValid(grid, empty.row, empty.col, value)) {
      continue;
    }

    grid[empty.row][empty.col] = value;
    if (fillBoard(grid)) {
      return true;
    }
    grid[empty.row][empty.col] = 0;
  }

  return false;
}

