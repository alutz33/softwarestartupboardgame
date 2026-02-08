import { motion } from 'framer-motion';
import type { Player } from '../../types';

function getDebtPenalty(techDebt: number): number {
  if (techDebt >= 12) return -20;
  if (techDebt >= 8) return -10;
  if (techDebt >= 4) return -5;
  return 0;
}

function getEquityMultiplier(funding?: string): number {
  if (funding === 'vc-heavy') return 0.4;
  if (funding === 'angel-backed') return 0.7;
  return 1;
}

function estimateScore(player: Player): number {
  let score = 0;
  score += player.metrics.mau / 1000;
  const revenueMultiplier = player.strategy?.funding === 'bootstrapped' ? 2 : 1;
  score += (player.metrics.revenue / 500) * revenueMultiplier;
  score += player.metrics.rating * 5;
  score += getDebtPenalty(player.resources.techDebt);
  score += player.productionTracks.mauProduction * 1;
  score += player.productionTracks.revenueProduction * 2;
  const equityMultiplier = getEquityMultiplier(player.strategy?.funding);
  score = Math.round(score * equityMultiplier);
  return score;
}

interface WinConditionProps {
  players: Player[];
  currentRound: number;
  totalRounds?: number;
}

export function WinCondition({ players, currentRound, totalRounds = 4 }: WinConditionProps) {
  // Calculate estimated scores for each player
  const estimatedScores = players.map(player => ({
    player,
    score: estimateScore(player),
  })).sort((a, b) => b.score - a.score);

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
          <div>+ <span className="text-yellow-400">Rating</span> x 5</div>
          <div>+ <span className="text-purple-400">Milestones</span></div>
          <div>+ <span className="text-cyan-400">MAU Prod</span> x 1 + <span className="text-cyan-400">Rev Prod</span> x 2</div>
          <div>- <span className="text-red-400">Debt Penalty</span> <span className="text-gray-500">(4+: -5, 8+: -10, 12+: -20)</span></div>
          <div>x <span className="text-orange-400">Equity %</span> <span className="text-gray-500">(VC 40%, Angel 70%, Boot 100%)</span></div>
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
  const ratingPoints = player.metrics.rating * 5;
  const debtPenalty = getDebtPenalty(player.resources.techDebt);
  const mauProdBonus = player.productionTracks.mauProduction * 1;
  const revProdBonus = player.productionTracks.revenueProduction * 2;
  const equityMultiplier = getEquityMultiplier(player.strategy?.funding);
  const subtotal = mauPoints + revenuePoints + ratingPoints + milestonePoints + debtPenalty + mauProdBonus + revProdBonus;
  const total = Math.round(subtotal * equityMultiplier);

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

        <span className="text-cyan-400">MAU Prod ({player.productionTracks.mauProduction}):</span>
        <span className="text-right">+{mauProdBonus}</span>

        <span className="text-cyan-400">Rev Prod ({player.productionTracks.revenueProduction}):</span>
        <span className="text-right">+{revProdBonus}</span>

        {debtPenalty < 0 && (
          <>
            <span className="text-red-400">Debt Penalty ({player.resources.techDebt}):</span>
            <span className="text-right text-red-400">{debtPenalty}</span>
          </>
        )}

        {equityMultiplier < 1 && (
          <>
            <span className="text-orange-400">Equity ({Math.round(equityMultiplier * 100)}%):</span>
            <span className="text-right text-orange-400">x{equityMultiplier}</span>
          </>
        )}

        <span className="text-white font-bold border-t border-gray-700 pt-1">Total:</span>
        <span className="text-right text-white font-bold border-t border-gray-700 pt-1">{total}</span>
      </div>
    </div>
  );
}
