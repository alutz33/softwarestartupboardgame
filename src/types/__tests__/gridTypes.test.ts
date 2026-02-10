import { describe, it, expect } from 'vitest';
import {
  TOKEN_COLORS,
  GRID_SIZES,
  createEmptyGrid,
  createEmptyBuffer,
  TECH_DEBT_BUFFER_SIZE,
} from '../../types';

describe('Token Colors', () => {
  it('has exactly 4 colors', () => {
    expect(TOKEN_COLORS).toHaveLength(4);
    expect(TOKEN_COLORS).toContain('green');
    expect(TOKEN_COLORS).toContain('orange');
    expect(TOKEN_COLORS).toContain('blue');
    expect(TOKEN_COLORS).toContain('purple');
  });
});

describe('Grid Sizes', () => {
  it('defines 3 expansion levels', () => {
    expect(GRID_SIZES).toEqual([
      { rows: 4, cols: 4 },
      { rows: 4, cols: 5 },
      { rows: 5, cols: 5 },
    ]);
  });
});

describe('createEmptyGrid', () => {
  it('creates a 4x4 grid of nulls', () => {
    const grid = createEmptyGrid(0);
    expect(grid.cells).toHaveLength(4);
    expect(grid.cells[0]).toHaveLength(4);
    expect(grid.cells[0][0]).toBeNull();
    expect(grid.expansionLevel).toBe(0);
  });

  it('creates a 4x5 grid at level 1', () => {
    const grid = createEmptyGrid(1);
    expect(grid.cells).toHaveLength(4);
    expect(grid.cells[0]).toHaveLength(5);
  });

  it('creates a 5x5 grid at level 2', () => {
    const grid = createEmptyGrid(2);
    expect(grid.cells).toHaveLength(5);
    expect(grid.cells[0]).toHaveLength(5);
  });
});

describe('TechDebtBuffer', () => {
  it('creates an empty buffer with 4 slots', () => {
    const buffer = createEmptyBuffer();
    expect(buffer.tokens).toEqual([]);
    expect(buffer.maxSize).toBe(TECH_DEBT_BUFFER_SIZE);
  });
});
