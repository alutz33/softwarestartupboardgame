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
    if (techDebt <= 7) return { label: 'WARNING', color: 'yellow', emoji: 'WARNING' };
    if (techDebt <= 11) return { label: 'DANGER', color: 'orange', emoji: 'DANGER' };
    return { label: 'CRITICAL', color: 'red', emoji: 'CRITICAL' };
  };

  const levelInfo = getLevelInfo();
  const powerPenalty = currentLevel.powerPenalty;

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
          animate={{ width: `${Math.min(techDebt * 7, 100)}%` }}
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
        <span className="text-orange-500">8</span>
        <span className="text-red-500">12+</span>
      </div>

      {/* Current penalties */}
      {(powerPenalty < 0 || currentLevel.ratingPenalty !== 0 || currentLevel.blocksDevelopment) && (
        <div className="bg-gray-900/50 rounded p-2 text-xs">
          <div className="text-gray-400 font-medium mb-1">Current Penalties:</div>
          <ul className="space-y-1">
            {powerPenalty < 0 && (
              <li className="text-yellow-400">
                • All engineers: <span className="font-bold">{powerPenalty} power</span>
              </li>
            )}
            {currentLevel.mauProductionPenalty < 0 && (
              <li className="text-orange-400">
                • MAU production: {currentLevel.mauProductionPenalty} per round
              </li>
            )}
            {currentLevel.revenueProductionPenalty < 0 && (
              <li className="text-orange-400">
                • Revenue production: {currentLevel.revenueProductionPenalty} per round
              </li>
            )}
            {currentLevel.ratingPenalty !== 0 && (
              <li className="text-red-400">
                • Rating penalty: {currentLevel.ratingPenalty} per quarter
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
            <div className="text-green-400">0-3: No penalty</div>
            <div className="text-yellow-400">4-7: -1 power, -1 MAU prod</div>
            <div className="text-orange-400">8-11: -2 power, -1 each prod</div>
            <div className="text-red-400">12+: -3 power + BLOCKED</div>
          </div>
        </div>
      )}

      {/* Next threshold warning */}
      {techDebt < 12 && (
        <div className="mt-2 text-[10px] text-gray-500">
          {techDebt < 4 ? (
            <span>Next threshold at 4 debt (-1 power, -1 MAU production)</span>
          ) : techDebt < 8 ? (
            <span>Next threshold at 8 debt (-2 power, -1 each production)</span>
          ) : (
            <span className="text-red-400">CRITICAL threshold at 12 debt (-3 power, actions BLOCKED!)</span>
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

  const getColor = () => {
    if (techDebt <= 3) return 'text-green-400 bg-green-500/20';
    if (techDebt <= 7) return 'text-yellow-400 bg-yellow-500/20';
    if (techDebt <= 11) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div className="flex flex-col items-end">
      <span className={`text-xs px-2 py-0.5 rounded ${getColor()}`}>
        Debt: {techDebt}
      </span>
      {showEfficiency && debtLevel.powerPenalty < 0 && (
        <span className="text-[10px] text-yellow-400 mt-0.5">
          {debtLevel.powerPenalty} power
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
