import { motion } from 'framer-motion';
import type { Player, ActionType, HiredEngineer } from '../../types';
import { ENGINEER_TRAITS, getTechDebtLevel } from '../../types';
import { ACTION_SPACES } from '../../data/actions';
import { Badge } from './index';

// ============================================
// ENGINEER TRAITS GUIDE
// ============================================

export function TraitsGuide() {
  const traits = [
    {
      id: 'ai-skeptic',
      color: 'text-orange-400',
      bgColor: 'bg-orange-900/30',
      borderColor: 'border-orange-500/50',
    },
    {
      id: 'equity-hungry',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-900/30',
      borderColor: 'border-yellow-500/50',
    },
    {
      id: 'startup-veteran',
      color: 'text-green-400',
      bgColor: 'bg-green-900/30',
      borderColor: 'border-green-500/50',
    },
    {
      id: 'night-owl',
      color: 'text-blue-400',
      bgColor: 'bg-blue-900/30',
      borderColor: 'border-blue-500/50',
    },
  ] as const;

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
        <span className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs">★</span>
        ENGINEER TRAITS
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        ~35% of engineers have special traits that affect gameplay:
      </p>
      <div className="space-y-2">
        {traits.map(({ id, color, bgColor, borderColor }) => {
          const trait = ENGINEER_TRAITS[id];
          return (
            <div
              key={id}
              className={`${bgColor} ${borderColor} border rounded p-2`}
            >
              <div className={`font-semibold text-xs ${color}`}>
                {trait.name}
              </div>
              <div className="text-[10px] text-gray-300 mt-1">
                {trait.description}
              </div>
              {/* Strategy tip */}
              <div className="text-[10px] text-gray-500 mt-1 italic">
                {id === 'ai-skeptic' && 'Best for: Quality-focused strategies without AI'}
                {id === 'equity-hungry' && 'Best for: Long-term retention, hire early!'}
                {id === 'startup-veteran' && 'Best for: Risky strategies, protects from events'}
                {id === 'night-owl' && 'Best for: Assign to your most important action last'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// ACTION PREVIEW (Shows expected outcome)
// ============================================

interface ActionPreviewProps {
  player: Player;
  actionType: ActionType;
  engineer?: HiredEngineer;
  useAi?: boolean;
}

export function ActionPreview({ player, actionType, engineer, useAi = false }: ActionPreviewProps) {
  const action = ACTION_SPACES.find(a => a.id === actionType);
  if (!action) return null;

  // Calculate expected changes
  const changes = calculateActionChanges(player, actionType, engineer, useAi);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3"
    >
      <div className="text-xs text-blue-400 font-semibold mb-2">
        EXPECTED OUTCOME: {action.name}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        {changes.mau !== 0 && (
          <>
            <span className="text-gray-400">MAU:</span>
            <span className={changes.mau > 0 ? 'text-green-400' : 'text-red-400'}>
              {changes.mau > 0 ? '+' : ''}{changes.mau.toLocaleString()}
            </span>
          </>
        )}
        {changes.revenue !== 0 && (
          <>
            <span className="text-gray-400">Revenue:</span>
            <span className={changes.revenue > 0 ? 'text-green-400' : 'text-red-400'}>
              {changes.revenue > 0 ? '+' : ''}${changes.revenue}
            </span>
          </>
        )}
        {changes.rating !== 0 && (
          <>
            <span className="text-gray-400">Rating:</span>
            <span className={changes.rating > 0 ? 'text-green-400' : 'text-red-400'}>
              {changes.rating > 0 ? '+' : ''}{changes.rating.toFixed(1)}
            </span>
          </>
        )}
        {changes.money !== 0 && (
          <>
            <span className="text-gray-400">Money:</span>
            <span className={changes.money > 0 ? 'text-green-400' : 'text-red-400'}>
              {changes.money > 0 ? '+' : ''}${changes.money}
            </span>
          </>
        )}
        {changes.techDebt !== 0 && (
          <>
            <span className="text-gray-400">Tech Debt:</span>
            <span className={changes.techDebt < 0 ? 'text-green-400' : 'text-red-400'}>
              {changes.techDebt > 0 ? '+' : ''}{changes.techDebt}
            </span>
          </>
        )}
        {changes.serverCapacity !== 0 && (
          <>
            <span className="text-gray-400">Servers:</span>
            <span className="text-green-400">+{changes.serverCapacity}</span>
          </>
        )}
        {changes.aiCapacity !== 0 && (
          <>
            <span className="text-gray-400">AI Capacity:</span>
            <span className="text-green-400">+{changes.aiCapacity}</span>
          </>
        )}
      </div>

      {/* Score impact */}
      <div className="mt-2 pt-2 border-t border-blue-500/30">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Score Impact:</span>
          <span className={changes.scoreImpact > 0 ? 'text-green-400 font-semibold' : changes.scoreImpact < 0 ? 'text-red-400' : 'text-gray-400'}>
            {changes.scoreImpact > 0 ? '+' : ''}{changes.scoreImpact.toFixed(1)} pts
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function calculateActionChanges(
  player: Player,
  actionType: ActionType,
  engineer?: HiredEngineer,
  useAi: boolean = false
) {
  const changes = {
    mau: 0,
    revenue: 0,
    rating: 0,
    money: 0,
    techDebt: 0,
    serverCapacity: 0,
    aiCapacity: 0,
    scoreImpact: 0,
  };

  // Base productivity
  const productivity = engineer?.productivity || 0.5;
  const aiMultiplier = useAi ? (engineer?.level === 'senior' ? 1.5 : 2.0) : 1.0;
  const outputMultiplier = productivity * aiMultiplier;

  // AI debt
  if (useAi && engineer) {
    const baseDebt = engineer.level === 'senior' ? 1 : engineer.level === 'junior' ? 3 : 4;
    const debtMult = player.strategy?.tech === 'ai-first' ? 0.5 : 1;
    changes.techDebt += Math.ceil(baseDebt * debtMult);
  }

  switch (actionType) {
    case 'develop-features':
      changes.mau = Math.round(500 * outputMultiplier);
      if (player.strategy?.tech === 'move-fast') changes.mau += 200;
      if (player.strategy?.product === 'consumer') changes.mau = Math.round(changes.mau * 2);
      else if (player.strategy?.product === 'b2b') changes.mau = Math.round(changes.mau * 0.5);
      break;

    case 'optimize-code':
      changes.techDebt -= 1;
      changes.rating = 0.1;
      break;

    case 'pay-down-debt':
      changes.techDebt -= Math.round(2 * outputMultiplier);
      break;

    case 'upgrade-servers':
      changes.money = -10;
      changes.serverCapacity = Math.round(5 * outputMultiplier);
      break;

    case 'research-ai':
      changes.money = -15;
      changes.aiCapacity = Math.round(2 * outputMultiplier);
      break;

    case 'marketing':
      changes.money = -20;
      let mauGain = Math.round(1000 * outputMultiplier);
      if (player.strategy?.funding === 'vc-heavy') mauGain = Math.round(mauGain * 1.5);
      mauGain = Math.round(mauGain * (player.metrics.rating / 3));
      changes.mau = mauGain;
      changes.rating = 0.1;
      break;

    case 'monetization':
      let rev = Math.round(300 * outputMultiplier);
      rev = Math.round(rev * (player.metrics.mau / 1000));
      if (player.strategy?.product === 'b2b') rev = Math.round(rev * 2);
      else if (player.strategy?.product === 'consumer') rev = Math.round(rev * 0.5);
      changes.revenue = rev;
      changes.rating = -0.1;
      break;

    case 'hire-recruiter':
      changes.money = -25;
      break;

    case 'go-viral':
      changes.money = -15;
      // Show average expected value
      changes.mau = 1000; // (3000 - 1000) / 2 = 1000 expected
      break;

    case 'ipo-prep':
      changes.money = -50;
      changes.scoreImpact = 25; // Direct score bonus
      break;

    case 'acquisition-target':
      changes.mau = -Math.round(player.metrics.mau * 0.5);
      changes.scoreImpact = Math.round(player.metrics.mau * 0.002);
      break;
  }

  // Calculate score impact
  const revenueMultiplier = player.strategy?.funding === 'bootstrapped' ? 2 : 1;
  changes.scoreImpact += changes.mau / 1000;
  changes.scoreImpact += (changes.revenue / 500) * revenueMultiplier;
  changes.scoreImpact += changes.rating * 10;

  return changes;
}

// ============================================
// PLAYER STATS COMPARISON
// ============================================

interface PlayerStatsComparisonProps {
  players: Player[];
  currentPlayerId: string;
  compact?: boolean;
}

export function PlayerStatsComparison({ players, currentPlayerId, compact = false }: PlayerStatsComparisonProps) {
  // Sort by estimated score
  const sortedPlayers = [...players].map(player => {
    const revenueMultiplier = player.strategy?.funding === 'bootstrapped' ? 2 : 1;
    const score =
      player.metrics.mau / 1000 +
      (player.metrics.revenue / 500) * revenueMultiplier +
      player.metrics.rating * 10 +
      (player.ipoBonusScore || 0) -
      (player.resources.techDebt >= 7 ? 10 : 0);
    return { player, score: Math.round(score * 10) / 10 };
  }).sort((a, b) => b.score - a.score);

  if (compact) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
        <h3 className="text-xs font-semibold text-gray-400 mb-2">STANDINGS</h3>
        <div className="space-y-1">
          {sortedPlayers.map(({ player, score }, index) => (
            <div
              key={player.id}
              className={`flex items-center gap-2 text-xs ${
                player.id === currentPlayerId ? 'bg-blue-900/30 rounded px-1 -mx-1' : ''
              }`}
            >
              <span className={`w-4 ${index === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>
                #{index + 1}
              </span>
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: player.color }}
              />
              <span className={`flex-1 truncate ${player.id === currentPlayerId ? 'text-white' : 'text-gray-400'}`}>
                {player.name}
              </span>
              <span className="font-mono text-gray-300">{score}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <span className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs">📊</span>
        ALL PLAYERS
      </h3>

      {/* Header */}
      <div className="grid grid-cols-6 gap-1 text-[10px] text-gray-500 mb-2 px-1">
        <span>Player</span>
        <span className="text-center">MAU</span>
        <span className="text-center">Rev</span>
        <span className="text-center">Rating</span>
        <span className="text-center">Debt</span>
        <span className="text-right">Score</span>
      </div>

      {/* Player rows */}
      <div className="space-y-1">
        {sortedPlayers.map(({ player, score }, index) => {
          const isCurrentPlayer = player.id === currentPlayerId;
          return (
            <div
              key={player.id}
              className={`grid grid-cols-6 gap-1 text-xs items-center rounded px-1 py-1 ${
                isCurrentPlayer ? 'bg-blue-900/40 ring-1 ring-blue-500/50' : ''
              }`}
            >
              <div className="flex items-center gap-1">
                <span className={index === 0 ? 'text-yellow-400' : 'text-gray-500'}>
                  {index + 1}.
                </span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: player.color }}
                />
                <span className={`truncate ${isCurrentPlayer ? 'text-white font-medium' : 'text-gray-400'}`}>
                  {player.name.slice(0, 6)}
                </span>
              </div>
              <span className="text-center text-blue-400">
                {player.metrics.mau >= 1000
                  ? `${(player.metrics.mau / 1000).toFixed(1)}k`
                  : player.metrics.mau}
              </span>
              <span className="text-center text-green-400">${player.metrics.revenue}</span>
              <span className="text-center text-yellow-400">{player.metrics.rating.toFixed(1)}</span>
              <span className={`text-center ${player.resources.techDebt >= 7 ? 'text-red-400' : player.resources.techDebt >= 4 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {player.resources.techDebt}
              </span>
              <span className={`text-right font-mono ${index === 0 ? 'text-yellow-400 font-bold' : 'text-white'}`}>
                {score}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-3 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
        Score = MAU/1000 + Rev/500 + Rating×10 - DebtPenalty
      </div>
    </div>
  );
}

// ============================================
// YOUR STATS PANEL (Current player details)
// ============================================

interface YourStatsProps {
  player: Player;
}

export function YourStats({ player }: YourStatsProps) {
  // Calculate score breakdown
  const revenueMultiplier = player.strategy?.funding === 'bootstrapped' ? 2 : 1;
  const mauPoints = Math.round((player.metrics.mau / 1000) * 10) / 10;
  const revenuePoints = Math.round((player.metrics.revenue / 500) * revenueMultiplier * 10) / 10;
  const ratingPoints = Math.round(player.metrics.rating * 10 * 10) / 10;
  const ipoBonus = player.ipoBonusScore || 0;
  const debtPenalty = player.resources.techDebt >= 7 ? -10 : 0;
  const total = mauPoints + revenuePoints + ratingPoints + ipoBonus + debtPenalty;

  // Get efficiency info
  const debtLevel = getTechDebtLevel(player.resources.techDebt);
  const efficiency = Math.round(debtLevel.efficiencyMultiplier * 100);

  return (
    <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: player.color }}
          />
          YOUR STATS
        </h3>
        <span className="text-lg font-bold text-yellow-400">{Math.round(total * 10) / 10} pts</span>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="bg-blue-900/30 rounded p-2">
          <div className="text-[10px] text-blue-400">MAU</div>
          <div className="text-lg font-bold text-white">{player.metrics.mau.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">+{mauPoints} pts</div>
        </div>
        <div className="bg-green-900/30 rounded p-2">
          <div className="text-[10px] text-green-400">Revenue</div>
          <div className="text-lg font-bold text-white">${player.metrics.revenue}</div>
          <div className="text-[10px] text-gray-500">+{revenuePoints} pts {revenueMultiplier > 1 && '(2x)'}</div>
        </div>
        <div className="bg-yellow-900/30 rounded p-2">
          <div className="text-[10px] text-yellow-400">Rating</div>
          <div className="text-lg font-bold text-white">{player.metrics.rating.toFixed(1)}</div>
          <div className="text-[10px] text-gray-500">+{ratingPoints} pts</div>
        </div>
        <div className={`rounded p-2 ${player.resources.techDebt >= 10 ? 'bg-red-900/40' : player.resources.techDebt >= 7 ? 'bg-red-900/30' : player.resources.techDebt >= 4 ? 'bg-yellow-900/30' : 'bg-gray-900/30'}`}>
          <div className={`text-[10px] ${player.resources.techDebt >= 10 ? 'text-red-400' : player.resources.techDebt >= 7 ? 'text-orange-400' : player.resources.techDebt >= 4 ? 'text-yellow-400' : 'text-gray-400'}`}>Tech Debt</div>
          <div className="text-lg font-bold text-white">{player.resources.techDebt}</div>
          <div className="text-[10px] text-gray-500">
            {efficiency < 100 && <span className="text-yellow-400">{efficiency}% eff</span>}
            {efficiency === 100 && 'No penalty'}
          </div>
          {debtLevel.blocksDevelopment && (
            <div className="text-[10px] text-red-400 font-bold">BLOCKED</div>
          )}
        </div>
      </div>

      {/* Resources */}
      <div className="flex gap-4 text-xs border-t border-gray-700 pt-3">
        <div>
          <span className="text-gray-500">Money: </span>
          <span className="text-green-400 font-semibold">${player.resources.money}</span>
        </div>
        <div>
          <span className="text-gray-500">Servers: </span>
          <span className="text-blue-400 font-semibold">{player.resources.serverCapacity}</span>
        </div>
        <div>
          <span className="text-gray-500">AI Cap: </span>
          <span className="text-purple-400 font-semibold">{player.resources.aiCapacity}</span>
        </div>
      </div>

      {/* Strategy bonuses */}
      {player.strategy && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="text-[10px] text-gray-500 mb-1">YOUR BONUSES</div>
          <div className="flex flex-wrap gap-1">
            {player.strategy.funding === 'vc-heavy' && (
              <Badge size="sm" variant="info">+50% Marketing</Badge>
            )}
            {player.strategy.funding === 'bootstrapped' && (
              <Badge size="sm" variant="success">2x Revenue Score</Badge>
            )}
            {player.strategy.tech === 'ai-first' && (
              <Badge size="sm" variant="info">50% Less AI Debt</Badge>
            )}
            {player.strategy.tech === 'quality-focused' && (
              <Badge size="sm" variant="success">50% Slower Debt</Badge>
            )}
            {player.strategy.tech === 'move-fast' && (
              <Badge size="sm" variant="warning">+200 MAU/Dev</Badge>
            )}
            {player.strategy.product === 'consumer' && (
              <Badge size="sm" variant="info">2x MAU Growth</Badge>
            )}
            {player.strategy.product === 'b2b' && (
              <Badge size="sm" variant="success">2x Revenue</Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// QUICK ACTION TIPS
// ============================================

interface ActionTipsProps {
  player: Player;
}

export function ActionTips({ player }: ActionTipsProps) {
  const tips: string[] = [];
  const debtLevel = getTechDebtLevel(player.resources.techDebt);

  // Generate contextual tips based on debt
  if (debtLevel.blocksDevelopment) {
    tips.push('CRITICAL: Use Pay Down Debt to unlock Develop Features!');
  } else if (player.resources.techDebt >= 7) {
    tips.push(`HIGH DEBT: ${Math.round(debtLevel.efficiencyMultiplier * 100)}% efficiency. Pay down debt!`);
  } else if (player.resources.techDebt >= 4) {
    tips.push(`Rising debt: ${Math.round(debtLevel.efficiencyMultiplier * 100)}% efficiency. Consider cleanup`);
  }
  if (player.metrics.mau > player.resources.serverCapacity * 80) {
    tips.push('Near capacity: Upgrade Servers to handle growth');
  }
  if (player.resources.aiCapacity === 0 && player.resources.money >= 15) {
    tips.push('No AI capacity: Research AI to boost productivity');
  }
  if (player.metrics.rating < 3.0) {
    tips.push('Low rating: Optimize Code or reduce monetization');
  }
  if (player.strategy?.funding === 'vc-heavy' && player.metrics.mau < 3000) {
    tips.push('VC wants growth: Focus on Marketing or Development');
  }
  if (player.strategy?.funding === 'bootstrapped' && player.metrics.revenue < 500) {
    tips.push('Revenue matters 2x: Consider Monetization actions');
  }

  if (tips.length === 0) {
    tips.push('You\'re doing well! Balance growth and stability');
  }

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3">
      <div className="text-xs text-yellow-400 font-semibold mb-2 flex items-center gap-1">
        <span>💡</span> SUGGESTED ACTIONS
      </div>
      <ul className="space-y-1">
        {tips.slice(0, 3).map((tip, i) => (
          <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
            <span className="text-yellow-500">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
