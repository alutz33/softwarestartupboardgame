import type { Puzzle, PuzzleGrid, BlockType, CodeBlock, Direction } from '../types';

let puzzleCounter = 0;

// Puzzle templates by difficulty
const PUZZLE_TEMPLATES: Record<number, () => PuzzleGrid> = {
  1: generateEasyPuzzle,
  2: generateMediumPuzzle,
  3: generateHardPuzzle,
  4: generateExpertPuzzle,
};

function generateEasyPuzzle(): PuzzleGrid {
  // Simple line of coins - just need a loop
  const coinCount = 3 + Math.floor(Math.random() * 3); // 3-5 coins
  const coins: { x: number; y: number }[] = [];

  for (let i = 1; i <= coinCount; i++) {
    coins.push({ x: i, y: 2 });
  }

  return {
    width: coinCount + 2,
    height: 5,
    playerStart: { x: 0, y: 2, direction: 'right' },
    coins,
    walls: [],
  };
}

function generateMediumPuzzle(): PuzzleGrid {
  // L-shape or zigzag pattern
  const variant = Math.floor(Math.random() * 2);

  if (variant === 0) {
    // L-shape
    return {
      width: 6,
      height: 6,
      playerStart: { x: 0, y: 0, direction: 'right' },
      coins: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 2 },
        { x: 3, y: 3 },
      ],
      walls: [],
    };
  } else {
    // Zigzag
    return {
      width: 6,
      height: 4,
      playerStart: { x: 0, y: 1, direction: 'right' },
      coins: [
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
      ],
      walls: [],
    };
  }
}

function generateHardPuzzle(): PuzzleGrid {
  // Grid pattern requiring nested loops
  const gridSize = 3;
  const coins: { x: number; y: number }[] = [];

  for (let y = 1; y <= gridSize; y++) {
    for (let x = 1; x <= gridSize; x++) {
      coins.push({ x, y });
    }
  }

  return {
    width: gridSize + 2,
    height: gridSize + 2,
    playerStart: { x: 1, y: 0, direction: 'down' },
    coins,
    walls: [],
  };
}

function generateExpertPuzzle(): PuzzleGrid {
  // Maze-like with walls requiring conditionals
  const variant = Math.floor(Math.random() * 2);

  if (variant === 0) {
    return {
      width: 7,
      height: 5,
      playerStart: { x: 0, y: 2, direction: 'right' },
      coins: [
        { x: 1, y: 2 },
        { x: 2, y: 1 },
        { x: 3, y: 2 },
        { x: 4, y: 3 },
        { x: 5, y: 2 },
        { x: 6, y: 2 },
      ],
      walls: [
        { x: 2, y: 2 },
        { x: 4, y: 2 },
      ],
    };
  } else {
    // Spiral pattern
    return {
      width: 5,
      height: 5,
      playerStart: { x: 0, y: 0, direction: 'right' },
      coins: [
        // Outer ring
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 1 },
        { x: 4, y: 2 },
        { x: 4, y: 3 },
        { x: 4, y: 4 },
        { x: 3, y: 4 },
        { x: 2, y: 4 },
      ],
      walls: [],
    };
  }
}

export function generatePuzzle(difficulty: 1 | 2 | 3 | 4): Puzzle {
  puzzleCounter++;
  const generator = PUZZLE_TEMPLATES[difficulty];
  const grid = generator();

  const optimalBlocks: Record<number, number> = {
    1: 3 + Math.floor(Math.random() * 2), // 3-4 blocks
    2: 5 + Math.floor(Math.random() * 2), // 5-6 blocks
    3: 7 + Math.floor(Math.random() * 2), // 7-8 blocks
    4: 9 + Math.floor(Math.random() * 2), // 9-10 blocks
  };

  const timeLimits: Record<number, number> = {
    1: 30,
    2: 45,
    3: 60,
    4: 90,
  };

  const availableBlocksByDifficulty: Record<number, BlockType[]> = {
    1: ['move', 'loop', 'collect'],
    2: ['move', 'loop', 'collect', 'turn-left', 'turn-right'],
    3: ['move', 'loop', 'collect', 'turn-left', 'turn-right', 'if'],
    4: ['move', 'loop', 'collect', 'turn-left', 'turn-right', 'if', 'while', 'function'],
  };

  return {
    id: `puzzle-${puzzleCounter}`,
    difficulty,
    grid,
    optimalBlocks: optimalBlocks[difficulty],
    availableBlocks: availableBlocksByDifficulty[difficulty],
    timeLimit: timeLimits[difficulty],
  };
}

// Puzzle execution engine
export interface ExecutionState {
  x: number;
  y: number;
  direction: Direction;
  coinsCollected: number;
  steps: number;
  maxSteps: number;
}

const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

const TURN_LEFT: Record<Direction, Direction> = {
  up: 'left',
  left: 'down',
  down: 'right',
  right: 'up',
};

const TURN_RIGHT: Record<Direction, Direction> = {
  up: 'right',
  right: 'down',
  down: 'left',
  left: 'up',
};

export function executePuzzleSolution(
  puzzle: Puzzle,
  blocks: CodeBlock[]
): { success: boolean; coinsCollected: number; steps: number } {
  const grid = puzzle.grid;
  const coins = new Set(grid.coins.map((c) => `${c.x},${c.y}`));

  const state: ExecutionState = {
    x: grid.playerStart.x,
    y: grid.playerStart.y,
    direction: grid.playerStart.direction,
    coinsCollected: 0,
    steps: 0,
    maxSteps: 1000, // Prevent infinite loops
  };

  try {
    executeBlocks(blocks, state, grid, coins);
  } catch {
    // Execution error (out of bounds, max steps, etc.)
  }

  return {
    success: state.coinsCollected === grid.coins.length,
    coinsCollected: state.coinsCollected,
    steps: state.steps,
  };
}

function executeBlocks(
  blocks: CodeBlock[],
  state: ExecutionState,
  grid: PuzzleGrid,
  coins: Set<string>
): void {
  for (const block of blocks) {
    if (state.steps > state.maxSteps) {
      throw new Error('Max steps exceeded');
    }
    executeBlock(block, state, grid, coins);
  }
}

function executeBlock(
  block: CodeBlock,
  state: ExecutionState,
  grid: PuzzleGrid,
  coins: Set<string>
): void {
  state.steps++;

  switch (block.type) {
    case 'move': {
      const { dx, dy } = DIRECTION_VECTORS[state.direction];
      const newX = state.x + dx;
      const newY = state.y + dy;

      // Check bounds
      if (newX < 0 || newX >= grid.width || newY < 0 || newY >= grid.height) {
        throw new Error('Out of bounds');
      }

      // Check walls
      if (grid.walls.some((w) => w.x === newX && w.y === newY)) {
        throw new Error('Hit wall');
      }

      state.x = newX;
      state.y = newY;
      break;
    }

    case 'collect': {
      const key = `${state.x},${state.y}`;
      if (coins.has(key)) {
        coins.delete(key);
        state.coinsCollected++;
      }
      break;
    }

    case 'turn-left':
      state.direction = TURN_LEFT[state.direction];
      break;

    case 'turn-right':
      state.direction = TURN_RIGHT[state.direction];
      break;

    case 'loop': {
      const iterations = block.value || 1;
      for (let i = 0; i < iterations; i++) {
        if (block.children) {
          executeBlocks(block.children, state, grid, coins);
        }
      }
      break;
    }

    case 'if': {
      if (evaluateCondition(block.condition, state, grid, coins)) {
        if (block.children) {
          executeBlocks(block.children, state, grid, coins);
        }
      }
      break;
    }

    case 'while': {
      let iterations = 0;
      while (
        evaluateCondition(block.condition, state, grid, coins) &&
        iterations < 100
      ) {
        if (block.children) {
          executeBlocks(block.children, state, grid, coins);
        }
        iterations++;
      }
      break;
    }

    case 'function':
      // Function blocks just execute their children
      if (block.children) {
        executeBlocks(block.children, state, grid, coins);
      }
      break;
  }
}

function evaluateCondition(
  condition: CodeBlock['condition'],
  state: ExecutionState,
  grid: PuzzleGrid,
  coins: Set<string>
): boolean {
  switch (condition) {
    case 'has-coin':
      return coins.has(`${state.x},${state.y}`);

    case 'path-clear': {
      const { dx, dy } = DIRECTION_VECTORS[state.direction];
      const nextX = state.x + dx;
      const nextY = state.y + dy;
      if (nextX < 0 || nextX >= grid.width || nextY < 0 || nextY >= grid.height) {
        return false;
      }
      return !grid.walls.some((w) => w.x === nextX && w.y === nextY);
    }

    case 'at-edge': {
      const { dx, dy } = DIRECTION_VECTORS[state.direction];
      const nextX = state.x + dx;
      const nextY = state.y + dy;
      return nextX < 0 || nextX >= grid.width || nextY < 0 || nextY >= grid.height;
    }

    default:
      return false;
  }
}

export function countBlocks(blocks: CodeBlock[]): number {
  let count = 0;
  for (const block of blocks) {
    count++;
    if (block.children) {
      count += countBlocks(block.children);
    }
  }
  return count;
}
