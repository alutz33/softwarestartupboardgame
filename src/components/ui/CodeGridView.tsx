import { motion } from 'framer-motion';
import type { CodeGrid } from '../../types';
import { TOKEN_COLORS_MAP, TOKEN_LABELS } from './tokenConstants';

interface CodeGridViewProps {
  grid: CodeGrid;
  onCellClick?: (row: number, col: number) => void;
  highlightCells?: Array<{ row: number; col: number }>;
  compact?: boolean;
}

export function CodeGridView({
  grid,
  onCellClick,
  highlightCells = [],
  compact = false,
}: CodeGridViewProps) {
  const cellSize = compact ? 'w-8 h-8 text-xs' : 'w-12 h-12 text-sm';

  return (
    <div className="inline-block">
      {grid.cells.map((row, r) => (
        <div key={r} className="flex">
          {row.map((cell, c) => {
            const isHighlighted = highlightCells.some(
              h => h.row === r && h.col === c
            );
            return (
              <motion.button
                key={`${r}-${c}`}
                className={`
                  ${cellSize} m-0.5 rounded border-2 flex items-center justify-center
                  font-bold transition-colors
                  ${cell ? TOKEN_COLORS_MAP[cell] + ' text-white border-transparent' : 'bg-gray-800 border-gray-600 border-dashed'}
                  ${isHighlighted ? 'ring-2 ring-yellow-400' : ''}
                  ${onCellClick ? 'cursor-pointer hover:ring-2 hover:ring-white' : 'cursor-default'}
                `}
                onClick={() => onCellClick?.(r, c)}
                whileHover={onCellClick ? { scale: 1.1 } : undefined}
                whileTap={onCellClick ? { scale: 0.95 } : undefined}
              >
                {cell ? TOKEN_LABELS[cell] : ''}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
