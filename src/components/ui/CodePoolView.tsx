import { motion } from 'framer-motion';
import type { TokenColor } from '../../types';
import { TOKEN_COLORS_MAP, TOKEN_LABELS } from './tokenConstants';

interface CodePoolViewProps {
  pool: TokenColor[];
  onSelectToken?: (index: number, color: TokenColor) => void;
  selectedIndices?: number[];
  maxSelectable?: number;
  filterColor?: TokenColor;
}

export function CodePoolView({
  pool,
  onSelectToken,
  selectedIndices = [],
  maxSelectable = 1,
  filterColor,
}: CodePoolViewProps) {
  const colorCounts: Record<TokenColor, number> = { green: 0, orange: 0, blue: 0, purple: 0 };
  for (const token of pool) {
    colorCounts[token]++;
  }

  return (
    <div className="bg-gray-800 rounded-lg p-3">
      <div className="text-xs text-gray-400 mb-2">Shared Code Pool ({pool.length} tokens)</div>
      <div className="flex flex-wrap gap-1">
        {pool.map((color, i) => {
          const isSelected = selectedIndices.includes(i);
          const isDisabled = filterColor ? color !== filterColor : false;
          const atMax = selectedIndices.length >= maxSelectable && !isSelected;

          return (
            <motion.button
              key={i}
              className={`
                w-10 h-10 rounded flex items-center justify-center text-xs font-bold
                ${TOKEN_COLORS_MAP[color]} text-white
                ${isSelected ? 'ring-2 ring-yellow-400 scale-110' : ''}
                ${isDisabled || atMax ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:scale-105'}
              `}
              onClick={() => !isDisabled && !atMax && onSelectToken?.(i, color)}
              whileHover={!isDisabled && !atMax ? { scale: 1.1 } : undefined}
              disabled={isDisabled || atMax}
            >
              {TOKEN_LABELS[color]}
            </motion.button>
          );
        })}
      </div>
      <div className="flex gap-3 mt-2 text-xs text-gray-400">
        {(Object.entries(colorCounts) as [TokenColor, number][]).map(([color, count]) => (
          <span key={color} className="flex items-center gap-1">
            <span className={`w-3 h-3 rounded ${TOKEN_COLORS_MAP[color]}`} />
            {TOKEN_LABELS[color]}: {count}
          </span>
        ))}
      </div>
    </div>
  );
}
