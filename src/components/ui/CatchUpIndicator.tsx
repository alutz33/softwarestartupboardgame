import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface CatchUpIndicatorProps {
  players: Player[];
  currentPlayerId?: string;
  currentRound: number;
  draftOrder?: string[];
}

export function CatchUpIndicator({ players, currentPlayerId, currentRound, draftOrder }: CatchUpIndicatorProps) {
  // Sort players by MAU to determine standings
  const sortedByMau = [...players].sort((a, b) => a.metrics.mau - b.metrics.mau);
  const medianMau = sortedByMau[Math.floor(sortedByMau.length / 2)]?.metrics.mau || 0;

  // Calculate income cap for current round
  const incomeCap = 30 + (currentRound * 10);

  // Find current player
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isUnderdog = currentPlayer && currentPlayer.metrics.mau < medianMau;
  const currentPlayerRank = sortedByMau.findIndex(p => p.id === currentPlayerId) + 1;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
    >
      <h3 className="text-sm font-semibold text-cyan-400 mb-3 flex items-center gap-2">
        <span>CATCH-UP MECHANICS</span>
        <span className="text-xs text-gray-500 font-normal">Helps trailing players!</span>
      </h3>

      <div className="space-y-3">
        {/* Draft Order */}
        <div className="bg-gray-900/50 rounded p-3">
          <div className="text-xs text-gray-400 mb-2">Draft Order (Lowest MAU First)</div>
          <div className="flex flex-wrap gap-2">
            {(draftOrder || sortedByMau.map(p => p.id)).map((playerId, index) => {
              const player = players.find(p => p.id === playerId);
              if (!player) return null;
              const isCurrentPlayer = playerId === currentPlayerId;
              return (
                <div
                  key={playerId}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isCurrentPlayer ? 'bg-blue-500/20 border border-blue-500/50' : 'bg-gray-800'
                  }`}
                >
                  <span className="text-gray-500">{index + 1}.</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className={isCurrentPlayer ? 'text-blue-300' : 'text-gray-300'}>
                    {player.name}
                  </span>
                  <span className="text-gray-500 text-[10px]">
                    ({player.metrics.mau.toLocaleString()})
                  </span>
                </div>
              );
            })}
          </div>
          {currentPlayerRank === 1 && currentRound > 1 && (
            <div className="text-xs text-green-400 mt-2">
              You pick first! (Lowest MAU = Best draft position)
            </div>
          )}
        </div>

        {/* Income Cap */}
        <div className="bg-gray-900/50 rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">Income Cap (Round {currentRound})</div>
              <div className="text-lg text-yellow-400 font-bold">${incomeCap}</div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div>Prevents runaway leaders</div>
              <div>Formula: $30 + ($10 x Round)</div>
            </div>
          </div>
        </div>

        {/* Underdog Bonus */}
        <div className={`rounded p-3 ${isUnderdog ? 'bg-green-900/30 border border-green-500/30' : 'bg-gray-900/50'}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400">Underdog Bonus</div>
              <div className={`text-lg font-bold ${isUnderdog ? 'text-green-400' : 'text-gray-500'}`}>
                {isUnderdog ? '+$10' : '$0'}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-right">
              <div>If MAU below median ({medianMau.toLocaleString()})</div>
              {isUnderdog && currentPlayer && (
                <div className="text-green-400">You qualify! ({currentPlayer.metrics.mau.toLocaleString()} MAU)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

interface DraftOrderBadgeProps {
  position: number;
  total: number;
}

export function DraftOrderBadge({ position, total }: DraftOrderBadgeProps) {
  const isFirst = position === 1;
  const isLast = position === total;

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
      isFirst ? 'bg-green-500/20 text-green-400' :
      isLast ? 'bg-red-500/20 text-red-400' :
      'bg-gray-700 text-gray-300'
    }`}>
      <span>Draft #{position}</span>
      {isFirst && <span>(Advantage!)</span>}
      {isLast && <span>(Leader penalty)</span>}
    </div>
  );
}
