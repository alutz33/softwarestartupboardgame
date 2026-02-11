import { Card, CardContent } from './Card';
import { Badge } from './Badge';
import { ActionSlotIndicator } from './ActionSlotIndicator';
import { Tooltip } from './Tooltip';
import type { HiredEngineer } from '../../types';
import { ACTION_SPACES } from '../../data/actions';

interface AllPlayerEngineer {
  playerId: string;
  playerColor: string;
  playerName: string;
  engineer: HiredEngineer;
}

interface ActionSpaceCardProps {
  action: (typeof ACTION_SPACES)[0];
  assignedEngineers: HiredEngineer[];
  isSelected: boolean;
  onClick: () => void;
  canAfford: boolean;
  slotInfo: { current: number; max: number | undefined; players: string[] };
  isAvailable: boolean;
  isBlockedByDebt: boolean;
  allPlayerEngineers?: AllPlayerEngineer[];
  playerColors?: string[];
  isRecommended?: boolean;
  compact?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragOver?: boolean;
}

export function ActionSpaceCard({
  action,
  assignedEngineers,
  isSelected,
  onClick,
  canAfford,
  slotInfo,
  isAvailable,
  isBlockedByDebt,
  allPlayerEngineers,
  playerColors = [],
  isRecommended,
  compact = false,
  onDragOver,
  onDrop,
  isDragOver = false,
}: ActionSpaceCardProps) {
  const isFull = slotInfo.max !== undefined && slotInfo.current >= slotInfo.max && !isAvailable;
  const isDisabled = isFull || isBlockedByDebt;

  // ---- Compact mode: small horizontal card for bottom strip ----
  if (compact) {
    return (
      <Tooltip
        content={
          <div className="max-w-xs">
            <div className="font-semibold text-white mb-1">{action.name}</div>
            <div className="text-xs text-gray-300">{action.description}</div>
            {action.requiredResources?.money && (
              <div className="text-xs text-yellow-400 mt-1">Cost: ${action.requiredResources.money}</div>
            )}
          </div>
        }
        position="top"
      >
        <div
          onClick={isDisabled ? undefined : onClick}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={`
            flex flex-col gap-0.5 px-2.5 py-1.5 rounded-lg border transition-all shrink-0
            ${isDragOver && !isDisabled ? 'border-blue-400 bg-blue-900/40 ring-1 ring-blue-400/50' : ''}
            ${isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800/80'}
            ${!canAfford || isDisabled ? 'opacity-40' : ''}
            ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-gray-500 hover:bg-gray-700/80'}
            ${isRecommended && !isDisabled ? 'ring-1 ring-yellow-500/40' : ''}
          `}
        >
          {/* Row 1: Name + cost */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-white whitespace-nowrap">{action.name}</span>
            {action.requiredResources?.money && (
              <Badge variant="warning" size="sm">${action.requiredResources.money}</Badge>
            )}
            {action.effect.triggersMinigame && (
              <span className="text-[10px] text-indigo-400" title="Triggers Puzzle">P</span>
            )}
          </div>
          {/* Row 2: Slots + assigned engineers */}
          <div className="flex items-center gap-1.5">
            <ActionSlotIndicator
              actionType={action.id}
              currentOccupancy={slotInfo.current}
              maxSlots={slotInfo.max}
              playerColors={playerColors}
              isAvailableToCurrentPlayer={isAvailable && !isBlockedByDebt}
            />
            {allPlayerEngineers && allPlayerEngineers.length > 0 && (
              <div className="flex gap-0.5">
                {allPlayerEngineers.map((entry) => (
                  <div
                    key={entry.engineer.id}
                    className="w-3.5 h-3.5 rounded-full border"
                    style={{
                      backgroundColor: `${entry.playerColor}40`,
                      borderColor: entry.playerColor,
                    }}
                    title={`${entry.playerName}: ${entry.engineer.name}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </Tooltip>
    );
  }

  // ---- Full mode: standard card ----
  return (
    <Card
      hoverable={!isDisabled}
      selected={isSelected}
      onClick={isDisabled ? undefined : onClick}
      className={`${!canAfford || isDisabled ? 'opacity-50' : ''} ${isDisabled ? 'cursor-not-allowed' : ''} ${isRecommended && !isDisabled ? 'ring-1 ring-yellow-500/40' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-white">{action.name}</h3>
          <div className="flex gap-1">
            {action.requiredResources?.money && (
              <Badge variant="warning">${action.requiredResources.money}</Badge>
            )}
          </div>
        </div>

        {/* Slot indicator */}
        <div className="mb-2">
          <ActionSlotIndicator
            actionType={action.id}
            currentOccupancy={slotInfo.current}
            maxSlots={slotInfo.max}
            playerColors={playerColors}
            isAvailableToCurrentPlayer={isAvailable && !isBlockedByDebt}
          />
        </div>

        <p className="text-sm text-gray-400 mb-3">{action.description}</p>

        {action.effect.triggersMinigame && (
          <Badge variant="info" className="mb-3">
            Triggers Puzzle!
          </Badge>
        )}

        {/* Debt blocking warning */}
        {isBlockedByDebt && (
          <div className="bg-red-500/20 text-red-400 text-xs p-2 rounded mb-2 border border-red-500/50">
            BLOCKED BY TECH DEBT - Reduce debt below 10 to unlock!
          </div>
        )}

        {/* Full warning */}
        {isFull && !isBlockedByDebt && (
          <div className="bg-red-500/20 text-red-400 text-xs p-2 rounded mb-2">
            BLOCKED - Another player claimed this slot!
          </div>
        )}

        {/* Multi-player engineers display (sequential mode) */}
        {allPlayerEngineers && allPlayerEngineers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-2">Assigned Engineers:</div>
            <div className="flex flex-wrap gap-1">
              {allPlayerEngineers.map((entry) => (
                <span
                  key={entry.engineer.id}
                  className="px-2 py-1 rounded text-xs"
                  style={{
                    backgroundColor: `${entry.playerColor}20`,
                    color: entry.playerColor,
                    border: `1px solid ${entry.playerColor}40`,
                  }}
                >
                  {entry.engineer.name}
                  {entry.engineer.hasAiAugmentation && ' +AI'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Single-player engineers display (simultaneous mode) */}
        {!allPlayerEngineers && assignedEngineers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-2">Your Engineers:</div>
            <div className="flex flex-wrap gap-1">
              {assignedEngineers.map((eng) => (
                <span
                  key={eng.id}
                  className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs"
                >
                  {eng.name}
                  {eng.hasAiAugmentation && ' +AI'}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
