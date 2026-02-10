import { motion } from 'framer-motion';
import type { AppCard } from '../../types';
import { getStarRating } from '../../data/appCards';
import { TOKEN_COLORS_MAP } from './tokenConstants';

const TIER_COLORS: Record<string, string> = {
  small: 'border-green-600',
  medium: 'border-yellow-600',
  large: 'border-red-600',
};

interface AppCardViewProps {
  card: AppCard;
  onClick?: () => void;
  isSelected?: boolean;
  compact?: boolean;
  matchedTokens?: number;
}

export function AppCardView({
  card,
  onClick,
  isSelected = false,
  compact = false,
  matchedTokens,
}: AppCardViewProps) {
  const stars = matchedTokens !== undefined
    ? getStarRating(card, matchedTokens)
    : null;

  return (
    <motion.div
      className={`
        rounded-lg border-2 p-2 bg-gray-800
        ${TIER_COLORS[card.tier]}
        ${isSelected ? 'ring-2 ring-yellow-400' : ''}
        ${onClick ? 'cursor-pointer hover:bg-gray-750' : ''}
      `}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.02 } : undefined}
    >
      <div className="text-sm font-bold text-white">{card.name}</div>
      <div className="text-xs text-gray-400">{card.client}</div>
      <div className="text-xs text-gray-500 capitalize">{card.tier} | {card.tokenCount} tokens</div>

      {!compact && (
        <div className="mt-2 inline-block">
          {card.pattern.map((row, r) => (
            <div key={r} className="flex">
              {row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`w-5 h-5 m-px rounded-sm ${
                    cell ? TOKEN_COLORS_MAP[cell] : 'bg-gray-700'
                  }`}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-1 flex justify-between text-xs">
        <span className="text-yellow-400">{'★'.repeat(5)} = {card.maxVP} VP</span>
        <span className="text-green-400">${card.maxMoney}</span>
      </div>

      {stars !== null && (
        <div className="mt-1 text-xs">
          <span className="text-yellow-400">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
          <span className="text-gray-400 ml-1">({matchedTokens}/{card.tokenCount})</span>
        </div>
      )}
    </motion.div>
  );
}
