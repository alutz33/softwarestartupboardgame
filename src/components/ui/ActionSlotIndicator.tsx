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

interface ActionSlotsLegendProps {
  actions: Array<{
    id: ActionType;
    name: string;
    maxSlots?: number;
  }>;
}

export function ActionSlotsLegend({ actions }: ActionSlotsLegendProps) {
  const limitedActions = actions.filter(a => a.maxSlots !== undefined);
  const unlimitedActions = actions.filter(a => a.maxSlots === undefined);

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <h4 className="text-xs font-semibold text-orange-400 mb-2">ACTION SLOT LIMITS</h4>

      <div className="space-y-2">
        {/* Exclusive (1 slot) */}
        <div>
          <div className="text-[10px] text-red-400 font-medium mb-1">EXCLUSIVE (1 SLOT)</div>
          <div className="flex flex-wrap gap-1">
            {limitedActions
              .filter(a => a.maxSlots === 1)
              .map(a => (
                <span key={a.id} className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">
                  {a.name}
                </span>
              ))}
          </div>
        </div>

        {/* Limited (2-3 slots) */}
        <div>
          <div className="text-[10px] text-yellow-400 font-medium mb-1">LIMITED (2-3 SLOTS)</div>
          <div className="flex flex-wrap gap-1">
            {limitedActions
              .filter(a => a.maxSlots && a.maxSlots > 1)
              .map(a => (
                <span key={a.id} className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-0.5 rounded">
                  {a.name} ({a.maxSlots})
                </span>
              ))}
          </div>
        </div>

        {/* Unlimited */}
        <div>
          <div className="text-[10px] text-green-400 font-medium mb-1">UNLIMITED</div>
          <div className="flex flex-wrap gap-1">
            {unlimitedActions.map(a => (
              <span key={a.id} className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded">
                {a.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-gray-500 mt-2">
        First player to claim a slot blocks others. Plan strategically!
      </p>
    </div>
  );
}
