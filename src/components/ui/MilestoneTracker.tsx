import { motion } from 'framer-motion';
import type { Milestone, Player } from '../../types';

interface MilestoneTrackerProps {
  milestones: Milestone[];
  players: Player[];
  currentPlayerId?: string;
  compact?: boolean;
}

const milestoneIcons: Record<string, string> = {
  'first-5k-mau': '5K',
  'first-10k-mau': '10K',
  'first-5-rating': '5',
  'first-debt-free': '0',
  'revenue-leader': '$1K',
};

export function MilestoneTracker({ milestones, players, currentPlayerId, compact = false }: MilestoneTrackerProps) {
  const getPlayerColor = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.color || '#666';
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.name || 'Unknown';
  };

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              milestone.claimedBy
                ? 'bg-gray-700'
                : 'bg-gray-800 border border-dashed border-gray-600'
            }`}
            title={`${milestone.name}: ${milestone.description} (+${milestone.bonus} pts)`}
          >
            <span className={`font-mono font-bold ${milestone.claimedBy ? 'text-gray-500' : 'text-yellow-400'}`}>
              {milestoneIcons[milestone.id]}
            </span>
            {milestone.claimedBy && (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: getPlayerColor(milestone.claimedBy) }}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-yellow-400 flex items-center gap-2">
          <span>MILESTONES</span>
          <span className="text-xs text-gray-500 font-normal">First to claim wins!</span>
        </h3>
      </div>

      <div className="space-y-2">
        {milestones.map((milestone) => {
          const isClaimed = !!milestone.claimedBy;
          const isClaimedByMe = milestone.claimedBy === currentPlayerId;

          return (
            <div
              key={milestone.id}
              className={`flex items-center gap-3 p-2 rounded ${
                isClaimed
                  ? isClaimedByMe
                    ? 'bg-green-900/30 border border-green-500/30'
                    : 'bg-gray-700/50'
                  : 'bg-gray-800 border border-dashed border-gray-600 hover:border-yellow-500/50'
              }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                isClaimed
                  ? 'bg-gray-600 text-gray-400'
                  : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
              }`}>
                {milestoneIcons[milestone.id]}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-medium text-sm ${isClaimed ? 'text-gray-400' : 'text-gray-200'}`}>
                    {milestone.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    isClaimed ? 'bg-gray-600 text-gray-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    +{milestone.bonus}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{milestone.description}</p>
              </div>

              {/* Status */}
              {isClaimed ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getPlayerColor(milestone.claimedBy!) }}
                  />
                  <span className="text-xs text-gray-400">{getPlayerName(milestone.claimedBy!)}</span>
                </div>
              ) : (
                <span className="text-xs text-yellow-400/70">Available!</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
