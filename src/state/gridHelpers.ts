import type {
  TokenColor,
  GridCell,
  CodeGrid,
  GridSize,
  TechDebtBuffer,
} from '../types';
import { GRID_SIZES } from '../types';

/** Place a single token. Returns new grid or null if invalid. */
export function placeToken(
  grid: CodeGrid,
  row: number,
  col: number,
  color: TokenColor
): CodeGrid | null {
  const size = GRID_SIZES[grid.expansionLevel];
  if (row < 0 || row >= size.rows || col < 0 || col >= size.cols) return null;
  if (grid.cells[row][col] !== null) return null;

  const newCells = grid.cells.map(r => [...r]);
  newCells[row][col] = color;
  return { ...grid, cells: newCells };
}

/** Place multiple tokens with adjacency validation for 2+. Returns new grid or null. */
export function placeTokens(
  grid: CodeGrid,
  placements: Array<{ row: number; col: number; color: TokenColor }>
): CodeGrid | null {
  if (placements.length === 0) return grid;

  // Validate adjacency for 2+ tokens
  if (placements.length >= 2) {
    if (!areAdjacent(placements)) return null;
  }

  let current = grid;
  for (const { row, col, color } of placements) {
    const result = placeToken(current, row, col, color);
    if (result === null) return null;
    current = result;
  }
  return current;
}

function areAdjacent(
  positions: Array<{ row: number; col: number }>
): boolean {
  if (positions.length <= 1) return true;

  const visited = new Set<string>();
  const queue = [positions[0]];
  visited.add(`${positions[0].row},${positions[0].col}`);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = [
      { row: current.row - 1, col: current.col },
      { row: current.row + 1, col: current.col },
      { row: current.row, col: current.col - 1 },
      { row: current.row, col: current.col + 1 },
    ];
    for (const neighbor of neighbors) {
      const key = `${neighbor.row},${neighbor.col}`;
      if (visited.has(key)) continue;
      if (positions.some(p => p.row === neighbor.row && p.col === neighbor.col)) {
        visited.add(key);
        queue.push(neighbor);
      }
    }
  }

  return visited.size === positions.length;
}

/** Remove a token from a cell. Returns [newGrid, removedColor]. */
export function removeToken(
  grid: CodeGrid,
  row: number,
  col: number
): [CodeGrid, TokenColor | null] {
  const color = grid.cells[row]?.[col] ?? null;
  const newCells = grid.cells.map(r => [...r]);
  if (color !== null) {
    newCells[row][col] = null;
  }
  return [{ ...grid, cells: newCells }, color];
}

/** Expand grid one level. Returns new grid or null if already max. */
export function expandGrid(grid: CodeGrid): CodeGrid | null {
  if (grid.expansionLevel >= 2) return null;

  const newLevel = grid.expansionLevel + 1;
  const newSize = GRID_SIZES[newLevel];
  const newCells: GridCell[][] = Array.from({ length: newSize.rows }, (_, r) =>
    Array.from({ length: newSize.cols }, (_, c) =>
      r < grid.cells.length && c < grid.cells[0].length
        ? grid.cells[r][c]
        : null
    )
  );

  return { cells: newCells, expansionLevel: newLevel };
}

/** Get list of empty cell coordinates in reading order. */
export function getEmptyCells(
  grid: CodeGrid
): Array<{ row: number; col: number }> {
  const empty: Array<{ row: number; col: number }> = [];
  for (let r = 0; r < grid.cells.length; r++) {
    for (let c = 0; c < grid.cells[r].length; c++) {
      if (grid.cells[r][c] === null) {
        empty.push({ row: r, col: c });
      }
    }
  }
  return empty;
}

/** Cascade: if buffer is full, flush tokens into grid at first empty cells. */
export function cascadeBufferToGrid(
  grid: CodeGrid,
  buffer: TechDebtBuffer
): [CodeGrid, TechDebtBuffer] {
  if (buffer.tokens.length < buffer.maxSize) {
    return [grid, buffer];
  }

  const emptyCells = getEmptyCells(grid);
  const newCells = grid.cells.map(r => [...r]);
  const tokensToPlace = Math.min(buffer.tokens.length, emptyCells.length);

  for (let i = 0; i < tokensToPlace; i++) {
    const { row, col } = emptyCells[i];
    newCells[row][col] = buffer.tokens[i];
  }

  return [
    { ...grid, cells: newCells },
    { ...buffer, tokens: buffer.tokens.slice(tokensToPlace) },
  ];
}

/** Check if a pattern footprint fits on the grid. */
export function canFitPattern(
  grid: CodeGrid,
  footprint: GridSize
): boolean {
  const size = GRID_SIZES[grid.expansionLevel];
  return footprint.rows <= size.rows && footprint.cols <= size.cols;
}

/** Count how many tokens match the pattern at a given top-left position. */
export function matchPatternAtPosition(
  grid: CodeGrid,
  pattern: GridCell[][],
  startRow: number,
  startCol: number
): number {
  let matched = 0;
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      const patternCell = pattern[r][c];
      if (patternCell === null) continue;
      const gridRow = startRow + r;
      const gridCol = startCol + c;
      if (
        gridRow < grid.cells.length &&
        gridCol < grid.cells[0].length &&
        grid.cells[gridRow][gridCol] === patternCell
      ) {
        matched++;
      }
    }
  }
  return matched;
}

/** Find the position where the pattern matches best. */
export function findBestPatternMatch(
  grid: CodeGrid,
  pattern: GridCell[][]
): { row: number; col: number; matched: number } | null {
  const size = GRID_SIZES[grid.expansionLevel];
  const patternRows = pattern.length;
  const patternCols = pattern[0].length;

  if (patternRows > size.rows || patternCols > size.cols) return null;

  let best: { row: number; col: number; matched: number } | null = null;

  for (let r = 0; r <= size.rows - patternRows; r++) {
    for (let c = 0; c <= size.cols - patternCols; c++) {
      const matched = matchPatternAtPosition(grid, pattern, r, c);
      if (best === null || matched > best.matched) {
        best = { row: r, col: c, matched };
      }
    }
  }

  return best;
}

/** Clear tokens from grid that match the pattern at a position. Only removes correct-color cells. */
export function clearPatternFromGrid(
  grid: CodeGrid,
  pattern: GridCell[][],
  startRow: number,
  startCol: number
): CodeGrid {
  const newCells = grid.cells.map(r => [...r]);
  for (let r = 0; r < pattern.length; r++) {
    for (let c = 0; c < pattern[r].length; c++) {
      const patternCell = pattern[r][c];
      if (patternCell === null) continue;
      const gridRow = startRow + r;
      const gridCol = startCol + c;
      if (
        gridRow < newCells.length &&
        gridCol < newCells[0].length &&
        newCells[gridRow][gridCol] === patternCell
      ) {
        newCells[gridRow][gridCol] = null;
      }
    }
  }
  return { ...grid, cells: newCells };
}
