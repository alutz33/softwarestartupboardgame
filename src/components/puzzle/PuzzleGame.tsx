import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent } from '../ui';
import { useGameStore } from '../../state/gameStore';
import type { CodeBlock, BlockType, Puzzle, Direction } from '../../types';
import { executePuzzleSolution, countBlocks } from '../../data/puzzles';

const BLOCK_COLORS: Record<BlockType, string> = {
  move: 'bg-blue-600',
  loop: 'bg-purple-600',
  if: 'bg-yellow-600',
  while: 'bg-orange-600',
  function: 'bg-pink-600',
  collect: 'bg-green-600',
  'turn-left': 'bg-cyan-600',
  'turn-right': 'bg-teal-600',
};

const BLOCK_LABELS: Record<BlockType, string> = {
  move: 'MOVE',
  loop: 'LOOP',
  if: 'IF',
  while: 'WHILE',
  function: 'FUNC',
  collect: 'COLLECT',
  'turn-left': 'LEFT',
  'turn-right': 'RIGHT',
};

let blockIdCounter = 0;
function createBlock(type: BlockType, value?: number): CodeBlock {
  return {
    id: `block-${++blockIdCounter}`,
    type,
    value: type === 'loop' ? (value || 2) : undefined,
    children: ['loop', 'if', 'while', 'function'].includes(type) ? [] : undefined,
  };
}

function CodeBlockComponent({
  block,
  onRemove,
  onUpdateValue,
  depth = 0,
}: {
  block: CodeBlock;
  onRemove: () => void;
  onUpdateValue?: (value: number) => void;
  depth?: number;
}) {
  const hasChildren = ['loop', 'if', 'while', 'function'].includes(block.type);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`${BLOCK_COLORS[block.type]} rounded-lg p-2 mb-1`}
      style={{ marginLeft: depth * 16 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-white font-mono text-sm font-bold">
          {BLOCK_LABELS[block.type]}
        </span>

        {block.type === 'loop' && (
          <input
            type="number"
            min={1}
            max={10}
            value={block.value || 2}
            onChange={(e) => onUpdateValue?.(Number(e.target.value))}
            className="w-12 px-2 py-0.5 bg-white/20 rounded text-white text-sm text-center"
          />
        )}

        <button
          onClick={onRemove}
          className="ml-auto text-white/60 hover:text-white text-sm"
        >
          ×
        </button>
      </div>

      {hasChildren && (
        <div className="mt-2 ml-2 p-2 bg-black/20 rounded min-h-[40px]">
          {block.children?.map((child) => (
            <CodeBlockComponent
              key={child.id}
              block={child}
              onRemove={() => {
                // Remove child logic would go here
              }}
              depth={0}
            />
          ))}
          {block.children?.length === 0 && (
            <div className="text-white/40 text-xs text-center py-2">
              Drop blocks here
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

function PuzzleGrid({
  puzzle,
  playerPosition,
  playerDirection,
  collectedCoins,
}: {
  puzzle: Puzzle;
  playerPosition: { x: number; y: number };
  playerDirection: Direction;
  collectedCoins: Set<string>;
}) {
  const { grid } = puzzle;

  const directionArrows: Record<Direction, string> = {
    up: '↑',
    down: '↓',
    left: '←',
    right: '→',
  };

  return (
    <div
      className="grid gap-1 bg-gray-900 p-2 rounded-lg"
      style={{
        gridTemplateColumns: `repeat(${grid.width}, 40px)`,
      }}
    >
      {Array.from({ length: grid.height }).map((_, y) =>
        Array.from({ length: grid.width }).map((_, x) => {
          const isPlayer = playerPosition.x === x && playerPosition.y === y;
          const hasCoin = grid.coins.some((c) => c.x === x && c.y === y);
          const isCollected = collectedCoins.has(`${x},${y}`);
          const isWall = grid.walls.some((w) => w.x === x && w.y === y);

          return (
            <div
              key={`${x}-${y}`}
              className={`
                w-10 h-10 rounded flex items-center justify-center text-lg
                ${isWall ? 'bg-gray-700' : 'bg-gray-800'}
                ${isPlayer ? 'ring-2 ring-blue-400' : ''}
              `}
            >
              {isPlayer ? (
                <span className="text-blue-400 font-bold">
                  {directionArrows[playerDirection]}
                </span>
              ) : hasCoin && !isCollected ? (
                <span className="text-yellow-400">●</span>
              ) : isWall ? (
                <span className="text-gray-600">█</span>
              ) : null}
            </div>
          );
        })
      )}
    </div>
  );
}

export function PuzzleGame() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const startPuzzle = useGameStore((state) => state.startPuzzle);
  const submitPuzzleSolution = useGameStore((state) => state.submitPuzzleSolution);
  const endPuzzle = useGameStore((state) => state.endPuzzle);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [blocks, setBlocks] = useState<CodeBlock[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    coinsCollected: number;
  } | null>(null);

  // Animation state
  const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 });
  const [playerDir, setPlayerDir] = useState<Direction>('right');
  const [collectedCoins, setCollectedCoins] = useState<Set<string>>(new Set());

  const puzzle = roundState.currentPuzzle;
  const currentPlayer = players[currentPlayerIndex];

  // Initialize puzzle
  useEffect(() => {
    if (!puzzle) {
      startPuzzle();
    }
  }, [puzzle, startPuzzle]);

  // Reset position when puzzle changes
  useEffect(() => {
    if (puzzle) {
      setPlayerPos({ x: puzzle.grid.playerStart.x, y: puzzle.grid.playerStart.y });
      setPlayerDir(puzzle.grid.playerStart.direction);
      setCollectedCoins(new Set());
      setTimeLeft(puzzle.timeLimit);
      setStartTime(Date.now());
    }
  }, [puzzle]);

  // Timer
  useEffect(() => {
    if (!puzzle || isRunning) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, puzzle.timeLimit - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        // Time's up - auto submit
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [puzzle, startTime, isRunning]);

  const addBlock = (type: BlockType) => {
    setBlocks([...blocks, createBlock(type)]);
  };

  const removeBlock = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  const updateBlockValue = (index: number, value: number) => {
    setBlocks(
      blocks.map((b, i) => (i === index ? { ...b, value } : b))
    );
  };

  const handleRun = () => {
    if (!puzzle) return;

    setIsRunning(true);
    const result = executePuzzleSolution(puzzle, blocks);
    setRunResult(result);

    // Reset for animation
    setPlayerPos({ x: puzzle.grid.playerStart.x, y: puzzle.grid.playerStart.y });
    setPlayerDir(puzzle.grid.playerStart.direction);
    setCollectedCoins(new Set());

    // Simple animation - just show final state after delay
    setTimeout(() => {
      setIsRunning(false);
    }, 1000);
  };

  const handleSubmit = () => {
    if (!puzzle) return;

    const solveTime = Date.now() - startTime;
    submitPuzzleSolution(currentPlayer.id, blocks, solveTime);

    if (currentPlayerIndex < players.length - 1) {
      // Next player
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setBlocks([]);
      setRunResult(null);
      setStartTime(Date.now());
      setPlayerPos({ x: puzzle.grid.playerStart.x, y: puzzle.grid.playerStart.y });
      setPlayerDir(puzzle.grid.playerStart.direction);
      setCollectedCoins(new Set());
    } else {
      // All done
      endPuzzle();
    }
  };

  const handleSkip = () => {
    // Submit empty solution
    submitPuzzleSolution(currentPlayer.id, [], Date.now() - startTime);

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setBlocks([]);
      setRunResult(null);
      setStartTime(Date.now());
    } else {
      endPuzzle();
    }
  };

  if (!puzzle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading puzzle...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Code Challenge!
            </h1>
            <p className="text-gray-400">
              <span style={{ color: currentPlayer.color }} className="font-semibold">
                {currentPlayer.name}
              </span>
              : Collect all coins with minimum code
            </p>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-400">Time Left</div>
              <div
                className={`text-2xl font-bold ${
                  timeLeft < 10 ? 'text-red-400' : 'text-white'
                }`}
              >
                {timeLeft}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Blocks Used</div>
              <div className="text-2xl font-bold text-blue-400">
                {countBlocks(blocks)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Optimal</div>
              <div className="text-2xl font-bold text-green-400">
                {puzzle.optimalBlocks}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Block palette */}
          <div className="col-span-2">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">BLOCKS</h2>
            <div className="space-y-2">
              {puzzle.availableBlocks.map((type) => (
                <button
                  key={type}
                  onClick={() => addBlock(type)}
                  className={`w-full ${BLOCK_COLORS[type]} text-white text-sm font-mono font-bold py-2 px-3 rounded-lg hover:opacity-80 transition-opacity`}
                >
                  {BLOCK_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Code area */}
          <div className="col-span-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">YOUR CODE</h2>
            <Card>
              <CardContent className="p-4 min-h-[300px]">
                <AnimatePresence mode="popLayout">
                  {blocks.map((block, i) => (
                    <CodeBlockComponent
                      key={block.id}
                      block={block}
                      onRemove={() => removeBlock(i)}
                      onUpdateValue={(v) => updateBlockValue(i, v)}
                    />
                  ))}
                </AnimatePresence>
                {blocks.length === 0 && (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Click blocks on the left to add them
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                onClick={() => setBlocks([])}
                disabled={blocks.length === 0}
              >
                Clear
              </Button>
              <Button
                onClick={handleRun}
                disabled={blocks.length === 0 || isRunning}
              >
                Run Code
              </Button>
            </div>
          </div>

          {/* Puzzle grid */}
          <div className="col-span-5">
            <h2 className="text-sm font-semibold text-gray-400 mb-3">PUZZLE</h2>
            <div className="flex justify-center">
              <PuzzleGrid
                puzzle={puzzle}
                playerPosition={playerPos}
                playerDirection={playerDir}
                collectedCoins={collectedCoins}
              />
            </div>

            {runResult && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-lg ${
                  runResult.success
                    ? 'bg-green-900/30 border border-green-700'
                    : 'bg-red-900/30 border border-red-700'
                }`}
              >
                <div className="font-semibold text-white">
                  {runResult.success ? 'Success!' : 'Not quite...'}
                </div>
                <div className="text-sm text-gray-300">
                  Collected {runResult.coinsCollected} of {puzzle.grid.coins.length} coins
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 mt-4 justify-center">
              <Button variant="ghost" onClick={handleSkip}>
                Skip Puzzle
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!runResult?.success}
              >
                Submit Solution
              </Button>
            </div>
          </div>
        </div>

        {/* Player progress */}
        <div className="flex justify-center gap-2 mt-8">
          {players.map((player, i) => (
            <div
              key={player.id}
              className={`px-4 py-2 rounded-lg text-sm ${
                i < currentPlayerIndex
                  ? 'bg-green-900/30 text-green-400'
                  : i === currentPlayerIndex
                  ? 'bg-gray-700 text-white ring-2'
                  : 'bg-gray-800 text-gray-500'
              }`}
              style={{
                borderColor: i === currentPlayerIndex ? player.color : undefined,
              }}
            >
              {player.name}
              {i < currentPlayerIndex && ' ✓'}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
