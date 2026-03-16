import { Grid, Position } from "./board";

export function isPlacementValid(grid: Grid, row: number, col: number, value: number): boolean {
  for (let index = 0; index < 9; index += 1) {
    if (grid[row][index] === value || grid[index][col] === value) {
      return false;
    }
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let currentRow = boxRow; currentRow < boxRow + 3; currentRow += 1) {
    for (let currentCol = boxCol; currentCol < boxCol + 3; currentCol += 1) {
      if (grid[currentRow][currentCol] === value) {
        return false;
      }
    }
  }

  return true;
}

export function getIncorrectPositions(board: Grid, solution: Grid): Position[] {
  const incorrect: Position[] = [];

  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const value = board[row][col];
      if (value !== 0 && value !== solution[row][col]) {
        incorrect.push({ row, col });
      }
    }
  }

  return incorrect;
}

export function isSolved(board: Grid, solution: Grid): boolean {
  return board.every((row, rowIndex) =>
    row.every((value, colIndex) => value !== 0 && value === solution[rowIndex][colIndex])
  );
}

