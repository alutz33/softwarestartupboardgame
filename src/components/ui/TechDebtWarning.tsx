import { motion } from 'framer-motion';
import { getTechDebtLevel } from '../../types';

interface TechDebtWarningProps {
  techDebt: number;
  showDetails?: boolean;
}

export function TechDebtWarning({ techDebt, showDetails = false }: TechDebtWarningProps) {
  const currentLevel = getTechDebtLevel(techDebt);

  const getLevelInfo = () => {
    if (techDebt <= 3) return { label: 'SAFE', color: 'green', emoji: 'SAFE' };
    if (techDebt <= 6) return { label: 'WARNING', color: 'yellow', emoji: 'WARNING' };
    if (techDebt <= 9) return { label: 'DANGER', color: 'orange', emoji: 'DANGER' };
    return { label: 'CRITICAL', color: 'red', emoji: 'CRITICAL' };
  };

  const levelInfo = getLevelInfo();
  const efficiency = Math.round(currentLevel.efficiencyMultiplier * 100);

  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    green: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400' },
    yellow: { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    orange: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400' },
    red: { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400' },
  };

  const colors = colorClasses[levelInfo.color];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`${colors.bg} ${colors.border} border rounded-lg p-3`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{levelInfo.emoji}</span>
          <div>
            <span className={`text-sm font-bold ${colors.text}`}>Tech Debt: {techDebt}</span>
            <span className={`text-xs ml-2 ${colors.text} opacity-70`}>{levelInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Progress bar showing debt level */}
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden mb-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(techDebt * 10, 100)}%` }}
          className={`h-full ${
            levelInfo.color === 'green' ? 'bg-green-500' :
            levelInfo.color === 'yellow' ? 'bg-yellow-500' :
            levelInfo.color === 'orange' ? 'bg-orange-500' :
            'bg-red-500'
          }`}
        />
      </div>

      {/* Markers */}
      <div className="flex justify-between text-[10px] text-gray-500 mb-2">
        <span>0</span>
        <span className="text-yellow-500">4</span>
        <span className="text-orange-500">7</span>
        <span className="text-red-500">10+</span>
      </div>

      {/* Current penalties */}
      {(efficiency < 100 || currentLevel.ratingPenalty > 0 || currentLevel.blocksDevelopment) && (
        <div className="bg-gray-900/50 rounded p-2 text-xs">
          <div className="text-gray-400 font-medium mb-1">Current Penalties:</div>
          <ul className="space-y-1">
            {efficiency < 100 && (
              <li className="text-yellow-400">
                • Efficiency reduced to <span className="font-bold">{efficiency}%</span> on all actions
              </li>
            )}
            {currentLevel.ratingPenalty > 0 && (
              <li className="text-red-400">
                • Rating penalty: -{currentLevel.ratingPenalty} per quarter
              </li>
            )}
            {currentLevel.blocksDevelopment && (
              <li className="text-red-400 font-semibold">
                • BLOCKED: Develop Features & Optimize Code disabled!
              </li>
            )}
          </ul>
        </div>
      )}

      {showDetails && (
        <div className="mt-2 pt-2 border-t border-gray-700">
          <div className="text-xs text-gray-500">Debt Level Thresholds:</div>
          <div className="grid grid-cols-2 gap-1 mt-1 text-[10px]">
            <div className="text-green-400">0-3: 100% efficiency</div>
            <div className="text-yellow-400">4-6: 85% efficiency</div>
            <div className="text-orange-400">7-9: 70% efficiency</div>
            <div className="text-red-400">10+: 50% + BLOCKED</div>
          </div>
        </div>
      )}

      {/* Next threshold warning */}
      {techDebt < 10 && (
        <div className="mt-2 text-[10px] text-gray-500">
          {techDebt < 4 ? (
            <span>Next threshold at 4 debt (85% efficiency, -0.2 rating)</span>
          ) : techDebt < 7 ? (
            <span>Next threshold at 7 debt (70% efficiency, -0.3 rating)</span>
          ) : (
            <span className="text-red-400">CRITICAL threshold at 10 debt (50% efficiency, actions BLOCKED!)</span>
          )}
        </div>
      )}

      {/* Clean Code Club milestone hint */}
      {techDebt > 0 && techDebt <= 3 && (
        <div className="mt-2 text-[10px] text-purple-400">
          TIP: Reduce to 0 to claim "Clean Code Club" milestone (+10 pts)!
        </div>
      )}
    </motion.div>
  );
}

interface MiniDebtIndicatorProps {
  techDebt: number;
  showEfficiency?: boolean;
}

export function MiniDebtIndicator({ techDebt, showEfficiency = false }: MiniDebtIndicatorProps) {
  const debtLevel = getTechDebtLevel(techDebt);
  const efficiency = Math.round(debtLevel.efficiencyMultiplier * 100);

  const getColor = () => {
    if (techDebt <= 3) return 'text-green-400 bg-green-500/20';
    if (techDebt <= 6) return 'text-yellow-400 bg-yellow-500/20';
    if (techDebt <= 9) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div className="flex flex-col items-end">
      <span className={`text-xs px-2 py-0.5 rounded ${getColor()}`}>
        Debt: {techDebt}
      </span>
      {showEfficiency && efficiency < 100 && (
        <span className="text-[10px] text-yellow-400 mt-0.5">
          {efficiency}% efficiency
        </span>
      )}
      {debtLevel.blocksDevelopment && (
        <span className="text-[10px] text-red-400 mt-0.5 font-bold">
          BLOCKED
        </span>
      )}
    </div>
  );
}
