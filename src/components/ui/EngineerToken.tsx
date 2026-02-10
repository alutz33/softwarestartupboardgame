import { motion } from 'framer-motion';
import { Badge } from './Badge';
import { Tooltip } from './Tooltip';
import { calculatePowerBreakdown, PowerBreakdownTooltipContent } from './PowerBreakdown';
import type { HiredEngineer } from '../../types';
import { ENGINEER_TRAITS } from '../../types';
import { ACTION_SPACES } from '../../data/actions';

interface EngineerTokenProps {
  engineer: HiredEngineer;
  isAssigned: boolean;
  onClick: () => void;
  isSelected: boolean;
  techDebt: number;
}

export function EngineerToken({
  engineer,
  isAssigned,
  onClick,
  isSelected,
  techDebt,
}: EngineerTokenProps) {
  const trait = engineer.trait ? ENGINEER_TRAITS[engineer.trait] : null;
  const breakdownLines = calculatePowerBreakdown(engineer, techDebt);

  return (
    <Tooltip
      content={<PowerBreakdownTooltipContent lines={breakdownLines} />}
      position="right"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
          p-3 rounded-lg border-2 transition-all text-left w-full
          ${isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800'}
          ${isAssigned ? 'opacity-50' : 'hover:border-gray-500'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="font-medium text-white text-sm">{engineer.name}</div>
          {engineer.specialty && (
            <span className="text-[10px] text-gray-500 uppercase">{engineer.specialty}</span>
          )}
        </div>
        <div className="flex gap-1 mt-1 items-center flex-wrap">
          <Badge
            size="sm"
            variant={
              engineer.level === 'senior'
                ? 'success'
                : engineer.level === 'intern'
                  ? 'warning'
                  : 'default'
            }
          >
            {engineer.level === 'senior'
              ? 'Sr'
              : engineer.level === 'intern'
                ? 'Int'
                : 'Jr'}
          </Badge>
          <span className="text-xs text-gray-400">
            {engineer.power} pwr
          </span>
          {/* Engineer Trait Badge */}
          {trait && (
            <span title={trait.description}>
              <Badge
                size="sm"
                variant={
                  engineer.trait === 'ai-skeptic' ? 'warning' :
                  engineer.trait === 'equity-hungry' ? 'info' :
                  engineer.trait === 'startup-veteran' ? 'success' :
                  'default'
                }
              >
                {trait.name}
              </Badge>
            </span>
          )}
        </div>
        {/* Show rounds retained for equity-hungry */}
        {engineer.trait === 'equity-hungry' && (
          <div className="text-[10px] text-yellow-400 mt-1">
            {engineer.roundsRetained >= 2 ? '+1 power!' : `Retained ${engineer.roundsRetained}/2 quarters`}
          </div>
        )}
        {isAssigned && engineer.assignedAction && (
          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
            <span>→</span>
            <span>{ACTION_SPACES.find((a) => a.id === engineer.assignedAction)?.name}</span>
            {engineer.hasAiAugmentation && (
              <span className="text-purple-400">+AI</span>
            )}
          </div>
        )}
      </motion.button>
    </Tooltip>
  );
}
