import { motion } from 'framer-motion';
import type { TechDebtBuffer, TokenColor } from '../../types';

const TOKEN_COLORS_MAP: Record<TokenColor, string> = {
  green: 'bg-green-500',
  orange: 'bg-orange-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
};

interface TechDebtBufferViewProps {
  buffer: TechDebtBuffer;
  onRemoveToken?: (index: number) => void;
}

export function TechDebtBufferView({
  buffer,
  onRemoveToken,
}: TechDebtBufferViewProps) {
  const slots = Array.from({ length: buffer.maxSize }, (_, i) =>
    i < buffer.tokens.length ? buffer.tokens[i] : null
  );

  const fillRatio = buffer.tokens.length / buffer.maxSize;
  const dangerClass =
    fillRatio >= 0.75 ? 'border-red-500' : fillRatio >= 0.5 ? 'border-yellow-500' : 'border-gray-600';

  return (
    <div className={`inline-flex gap-1 p-2 rounded border-2 ${dangerClass} bg-gray-900`}>
      <span className="text-xs text-gray-400 mr-1 self-center">Debt:</span>
      {slots.map((token, i) => (
        <motion.button
          key={i}
          className={`
            w-8 h-8 rounded flex items-center justify-center text-xs font-bold
            ${token ? TOKEN_COLORS_MAP[token] + ' text-white' : 'bg-gray-800 border border-dashed border-gray-600'}
            ${onRemoveToken && token ? 'cursor-pointer hover:ring-2 hover:ring-red-400' : 'cursor-default'}
          `}
          onClick={() => token && onRemoveToken?.(i)}
          whileHover={token && onRemoveToken ? { scale: 1.1 } : undefined}
        >
          {token ? token[0].toUpperCase() : ''}
        </motion.button>
      ))}
      {fillRatio >= 0.75 && (
        <span className="text-xs text-red-400 self-center ml-1">CASCADE!</span>
      )}
    </div>
  );
}
