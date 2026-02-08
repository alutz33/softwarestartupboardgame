import { motion } from 'framer-motion';
import type { Player } from '../../types';

interface WinConditionProps {
  players: Player[];
  currentRound: number;
  totalRounds?: number;
}

export function WinCondition({ players, currentRound, totalRounds = 4 }: WinConditionProps) {
  // Calculate estimated scores for each player
  const estimatedScores = players.map(player => {
    let score = 0;
    score += player.metrics.mau / 1000;
    const revenueMultiplier = player.strategy?.funding === 'bootstrapped' ? 2 : 1;
    score += (player.metrics.revenue / 500) * revenueMultiplier;
    score += player.metrics.rating * 5;
    if (player.resources.techDebt >= 7) score -= 10;
    return { player, score: Math.round(score * 10) / 10 };
  }).sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-gray-800/50 rounded-lg p-4 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-blue-400">HOW TO WIN</h3>
        <span className="text-xs text-gray-500">Round {currentRound}/{totalRounds}</span>
      </div>

      {/* Scoring Formula */}
      <div className="bg-gray-900/50 rounded p-3 mb-3 text-xs font-mono">
        <div className="text-gray-400 mb-1">Final Score =</div>
        <div className="space-y-1 text-gray-300">
          <div><span className="text-blue-400">MAU</span>/1000</div>
          <div>+ <span className="text-green-400">Revenue</span>/500 <span className="text-gray-500">(x2 if Bootstrapped)</span></div>
          <div>+ <span className="text-yellow-400">Rating</span> x 10</div>
          <div>+ <span className="text-purple-400">Milestones</span></div>
          <div>- <span className="text-red-400">Debt Penalty</span> <span className="text-gray-500">(if debt &ge;7)</span></div>
        </div>
      </div>

      {/* Current Standings */}
      <div className="space-y-1">
        <div className="text-xs text-gray-500 mb-2">Current Estimated Scores:</div>
        {estimatedScores.map(({ player, score }, index) => (
          <div
            key={player.id}
            className={`flex items-center gap-2 text-sm ${index === 0 ? 'text-yellow-400' : 'text-gray-400'}`}
          >
            <span className="w-4 text-center">{index + 1}.</span>
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: player.color }}
            />
            <span className="flex-1 truncate">{player.name}</span>
            <span className="font-mono">{score}</span>
          </div>
        ))}
      </div>

      {/* Tips based on round */}
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          {currentRound <= 2 ? (
            <span>Early game: Focus on growth and claiming milestones!</span>
          ) : currentRound === 3 ? (
            <span>Mid game: Balance growth with debt management</span>
          ) : (
            <span>Final round: Optimize for maximum points!</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

interface ScoreBreakdownProps {
  player: Player;
  milestonePoints?: number;
}

export function ScoreBreakdown({ player, milestonePoints = 0 }: ScoreBreakdownProps) {
  const mauPoints = Math.round((player.metrics.mau / 1000) * 10) / 10;
  const revenueMultiplier = player.strategy?.funding === 'bootstrapped' ? 2 : 1;
  const revenuePoints = Math.round((player.metrics.revenue / 500) * revenueMultiplier * 10) / 10;
  const ratingPoints = Math.round(player.metrics.rating * 5 * 10) / 10;
  const debtPenalty = player.resources.techDebt >= 7 ? -10 : 0;
  const total = mauPoints + revenuePoints + ratingPoints + milestonePoints + debtPenalty;

  return (
    <div className="bg-gray-800/50 rounded p-3 text-xs">
      <div className="grid grid-cols-2 gap-1">
        <span className="text-blue-400">MAU ({player.metrics.mau.toLocaleString()}):</span>
        <span className="text-right">+{mauPoints}</span>

        <span className="text-green-400">
          Revenue (${player.metrics.revenue})
          {revenueMultiplier > 1 && <span className="text-gray-500"> x2</span>}:
        </span>
        <span className="text-right">+{revenuePoints}</span>

        <span className="text-yellow-400">Rating ({player.metrics.rating}/10):</span>
        <span className="text-right">+{ratingPoints}</span>

        {milestonePoints > 0 && (
          <>
            <span className="text-purple-400">Milestones:</span>
            <span className="text-right">+{milestonePoints}</span>
          </>
        )}

        {debtPenalty < 0 && (
          <>
            <span className="text-red-400">Debt Penalty:</span>
            <span className="text-right text-red-400">{debtPenalty}</span>
          </>
        )}

        <span className="text-white font-bold border-t border-gray-700 pt-1">Total:</span>
        <span className="text-right text-white font-bold border-t border-gray-700 pt-1">{Math.round(total * 10) / 10}</span>
      </div>
    </div>
  );
}
