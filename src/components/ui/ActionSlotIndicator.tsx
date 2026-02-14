import { motion } from 'framer-motion';
import type { ActionType } from '../../types';

interface ActionSlotIndicatorProps {
  actionType: ActionType;
  currentOccupancy: number;
  maxSlots?: number;
  playerColors?: string[];
  isAvailableToCurrentPlayer: boolean;
}

export function ActionSlotIndicator({
  currentOccupancy,
  maxSlots,
  playerColors = [],
  isAvailableToCurrentPlayer,
}: ActionSlotIndicatorProps) {
  // Unlimited slots
  if (maxSlots === undefined) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <span className="text-green-400">Unlimited</span>
      </div>
    );
  }

  const isFull = currentOccupancy >= maxSlots;
  const isExclusive = maxSlots === 1;

  return (
    <div className="flex items-center gap-2">
      {/* Slot visualization */}
      <div className="flex gap-1">
        {Array.from({ length: maxSlots }).map((_, i) => {
          const isOccupied = i < currentOccupancy;
          const playerColor = playerColors[i];

          return (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`w-4 h-4 rounded-sm border ${
                isOccupied
                  ? 'border-transparent'
                  : isAvailableToCurrentPlayer
                    ? 'border-green-500/50 border-dashed'
                    : 'border-gray-600 border-dashed'
              }`}
              style={{
                backgroundColor: isOccupied ? (playerColor || '#666') : 'transparent',
              }}
            />
          );
        })}
      </div>

      {/* Status text */}
      <span className={`text-xs ${
        isFull
          ? 'text-red-400'
          : isAvailableToCurrentPlayer
            ? 'text-green-400'
            : 'text-gray-500'
      }`}>
        {isFull ? (
          isExclusive ? 'TAKEN' : 'FULL'
        ) : (
          `${maxSlots - currentOccupancy}/${maxSlots}`
        )}
      </span>

      {/* Exclusive badge */}
      {isExclusive && !isFull && (
        <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1 rounded">
          EXCLUSIVE
        </span>
      )}
    </div>
  );
}
