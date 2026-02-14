import { describe, it, expect } from 'vitest';
import {
  placeToken,
  placeTokens,
  removeToken,
  expandGrid,
  getEmptyCells,
  cascadeBufferToGrid,
  canFitPattern,
  matchPatternAtPosition,
  findBestPatternMatch,
  clearPatternFromGrid,
} from '../gridHelpers';
import { createEmptyGrid } from '../../types';
import type { TokenColor, GridCell, TechDebtBuffer } from '../../types';

describe('placeToken', () => {
  it('places a token in an empty cell', () => {
    const grid = createEmptyGrid(0);
    const result = placeToken(grid, 0, 0, 'green');
    expect(result).not.toBeNull();
    expect(result!.cells[0][0]).toBe('green');
  });

  it('returns null if cell is occupied', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    const result = placeToken(grid, 0, 0, 'blue');
    expect(result).toBeNull();
  });

  it('returns null if out of bounds', () => {
    const grid = createEmptyGrid(0);
    const result = placeToken(grid, 5, 5, 'green');
    expect(result).toBeNull();
  });
});

describe('placeTokens', () => {
  it('places multiple tokens at specified positions', () => {
    const grid = createEmptyGrid(0);
    const placements: Array<{ row: number; col: number; color: TokenColor }> = [
      { row: 0, col: 0, color: 'green' },
      { row: 0, col: 1, color: 'blue' },
    ];
    const result = placeTokens(grid, placements);
    expect(result).not.toBeNull();
    expect(result!.cells[0][0]).toBe('green');
    expect(result!.cells[0][1]).toBe('blue');
  });

  it('validates adjacency for 2+ tokens', () => {
    const grid = createEmptyGrid(0);
    const placements: Array<{ row: number; col: number; color: TokenColor }> = [
      { row: 0, col: 0, color: 'green' },
      { row: 2, col: 2, color: 'blue' },
    ];
    const result = placeTokens(grid, placements);
    expect(result).toBeNull();
  });

  it('allows single token without adjacency check', () => {
    const grid = createEmptyGrid(0);
    const placements: Array<{ row: number; col: number; color: TokenColor }> = [
      { row: 3, col: 3, color: 'green' },
    ];
    const result = placeTokens(grid, placements);
    expect(result).not.toBeNull();
    expect(result!.cells[3][3]).toBe('green');
  });
});

describe('removeToken', () => {
  it('removes a token and returns the color', () => {
    const grid = createEmptyGrid(0);
    grid.cells[1][1] = 'orange';
    const [newGrid, color] = removeToken(grid, 1, 1);
    expect(newGrid.cells[1][1]).toBeNull();
    expect(color).toBe('orange');
  });

  it('returns null color if cell is empty', () => {
    const grid = createEmptyGrid(0);
    const [, color] = removeToken(grid, 0, 0);
    expect(color).toBeNull();
  });
});

describe('expandGrid', () => {
  it('expands 4x4 to 4x5', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    const expanded = expandGrid(grid);
    expect(expanded).not.toBeNull();
    expect(expanded!.expansionLevel).toBe(1);
    expect(expanded!.cells).toHaveLength(4);
    expect(expanded!.cells[0]).toHaveLength(5);
    expect(expanded!.cells[0][0]).toBe('green');
  });

  it('expands 4x5 to 5x5', () => {
    const grid = createEmptyGrid(1);
    const expanded = expandGrid(grid);
    expect(expanded).not.toBeNull();
    expect(expanded!.expansionLevel).toBe(2);
    expect(expanded!.cells).toHaveLength(5);
    expect(expanded!.cells[0]).toHaveLength(5);
  });

  it('returns null if already max', () => {
    const grid = createEmptyGrid(2);
    const expanded = expandGrid(grid);
    expect(expanded).toBeNull();
  });
});

describe('getEmptyCells', () => {
  it('returns all cells for empty grid', () => {
    const grid = createEmptyGrid(0);
    const empty = getEmptyCells(grid);
    expect(empty).toHaveLength(16);
  });

  it('excludes filled cells', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    grid.cells[1][1] = 'blue';
    const empty = getEmptyCells(grid);
    expect(empty).toHaveLength(14);
  });
});

describe('cascadeBufferToGrid', () => {
  it('places buffer tokens into first empty cells reading order', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    const buffer: TechDebtBuffer = {
      tokens: ['orange', 'blue', 'purple', 'green'],
      maxSize: 4,
    };
    const [newGrid, newBuffer] = cascadeBufferToGrid(grid, buffer);
    expect(newGrid.cells[0][1]).toBe('orange');
    expect(newGrid.cells[0][2]).toBe('blue');
    expect(newGrid.cells[0][3]).toBe('purple');
    expect(newGrid.cells[1][0]).toBe('green');
    expect(newBuffer.tokens).toEqual([]);
  });

  it('does not cascade if buffer is not full', () => {
    const grid = createEmptyGrid(0);
    const buffer: TechDebtBuffer = {
      tokens: ['orange', 'blue'],
      maxSize: 4,
    };
    const [newGrid, newBuffer] = cascadeBufferToGrid(grid, buffer);
    expect(newGrid.cells[0][0]).toBeNull();
    expect(newBuffer.tokens).toHaveLength(2);
  });
});

describe('canFitPattern', () => {
  it('returns true for small pattern on 4x4 grid', () => {
    const grid = createEmptyGrid(0);
    expect(canFitPattern(grid, { rows: 2, cols: 2 })).toBe(true);
  });

  it('returns false for 4x5 pattern on 4x4 grid', () => {
    const grid = createEmptyGrid(0);
    expect(canFitPattern(grid, { rows: 4, cols: 5 })).toBe(false);
  });

  it('returns true for 4x5 pattern on 4x5 grid', () => {
    const grid = createEmptyGrid(1);
    expect(canFitPattern(grid, { rows: 4, cols: 5 })).toBe(true);
  });
});

describe('matchPatternAtPosition', () => {
  it('counts matching tokens at a position', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    grid.cells[0][1] = 'green';
    grid.cells[1][0] = 'orange';
    grid.cells[1][1] = 'purple';
    const pattern: GridCell[][] = [
      ['green', 'green'],
      ['orange', 'purple'],
    ];
    const matched = matchPatternAtPosition(grid, pattern, 0, 0);
    expect(matched).toBe(4);
  });

  it('counts partial matches', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    grid.cells[0][1] = 'blue';
    grid.cells[1][0] = 'orange';
    const pattern: GridCell[][] = [
      ['green', 'green'],
      ['orange', 'purple'],
    ];
    const matched = matchPatternAtPosition(grid, pattern, 0, 0);
    expect(matched).toBe(2);
  });
});

describe('findBestPatternMatch', () => {
  it('finds the best position for a pattern', () => {
    const grid = createEmptyGrid(0);
    grid.cells[2][1] = 'green';
    grid.cells[2][2] = 'green';
    grid.cells[3][1] = 'orange';
    grid.cells[3][2] = 'purple';
    const pattern: GridCell[][] = [
      ['green', 'green'],
      ['orange', 'purple'],
    ];
    const result = findBestPatternMatch(grid, pattern);
    expect(result).not.toBeNull();
    expect(result!.row).toBe(2);
    expect(result!.col).toBe(1);
    expect(result!.matched).toBe(4);
  });
});

describe('clearPatternFromGrid', () => {
  it('clears only matching tokens at position', () => {
    const grid = createEmptyGrid(0);
    grid.cells[0][0] = 'green';
    grid.cells[0][1] = 'green';
    grid.cells[1][0] = 'orange';
    grid.cells[1][1] = 'blue';
    const pattern: GridCell[][] = [
      ['green', 'green'],
      ['orange', 'purple'],
    ];
    const cleared = clearPatternFromGrid(grid, pattern, 0, 0);
    expect(cleared.cells[0][0]).toBeNull();
    expect(cleared.cells[0][1]).toBeNull();
    expect(cleared.cells[1][0]).toBeNull();
    expect(cleared.cells[1][1]).toBe('blue');
  });
});
