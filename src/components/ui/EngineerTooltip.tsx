import { Badge } from './Badge';
import { SpecialtyIcon } from './SpecialtyIcon';
import { calculatePowerBreakdown, PowerBreakdownTooltipContent } from './PowerBreakdown';
import { ACTION_SPACES } from '../../data/actions';
import { ENGINEER_TRAITS } from '../../types';
import type { HiredEngineer } from '../../types';

interface EngineerTooltipContentProps {
  engineer: HiredEngineer;
  techDebt: number;
}

export function EngineerTooltipContent({ engineer, techDebt }: EngineerTooltipContentProps) {
  const breakdownLines = calculatePowerBreakdown(engineer, techDebt);
  const genericTrait = engineer.trait ? ENGINEER_TRAITS[engineer.trait] : null;
  const assignedAction = engineer.assignedAction
    ? ACTION_SPACES.find((a) => a.id === engineer.assignedAction)
    : null;

  return (
    <div className="text-left min-w-[220px] max-w-[260px]">
      {/* Header: portrait/icon + name + level */}
      <div className="flex items-center gap-2 mb-2">
        {engineer.isPersona && engineer.personaId ? (
          <img
            src={`/personas/${engineer.personaId}.png`}
            alt={engineer.name}
            className="w-8 h-10 rounded object-cover border border-gray-600"
          />
        ) : engineer.specialty ? (
          <SpecialtyIcon specialty={engineer.specialty} size={24} />
        ) : (
          <div className="w-6 h-6 rounded bg-gray-600" />
        )}
        <div>
          <div className="text-white font-medium text-sm">{engineer.name}</div>
          <div className="flex items-center gap-1">
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
              {engineer.level === 'senior' ? 'Senior' : engineer.level === 'intern' ? 'Intern' : 'Junior'}
            </Badge>
            {engineer.specialty && (
              <span className="text-[10px] text-gray-400 uppercase">{engineer.specialty}</span>
            )}
          </div>
        </div>
      </div>

      {/* Power breakdown */}
      <div className="border-t border-gray-600 pt-2 mb-2">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Power Breakdown</div>
        <PowerBreakdownTooltipContent lines={breakdownLines} />
      </div>

      {/* Trait */}
      {(genericTrait || engineer.personaTrait) && (
        <div className="border-t border-gray-600 pt-2 mb-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Trait</div>
          {engineer.personaTrait && (
            <div>
              <Badge size="sm" variant="info">{engineer.personaTrait.name}</Badge>
              <div className="text-xs text-gray-400 mt-0.5">{engineer.personaTrait.description}</div>
            </div>
          )}
          {genericTrait && (
            <div>
              <Badge
                size="sm"
                variant={
                  engineer.trait === 'ai-skeptic' ? 'warning' :
                  engineer.trait === 'equity-hungry' ? 'info' :
                  engineer.trait === 'startup-veteran' ? 'success' :
                  'default'
                }
              >
                {genericTrait.name}
              </Badge>
              <div className="text-xs text-gray-400 mt-0.5">{genericTrait.description}</div>
            </div>
          )}
        </div>
      )}

      {/* Assignment status */}
      {assignedAction && (
        <div className="border-t border-gray-600 pt-2">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Status</div>
          <div className="text-xs text-blue-400 flex items-center gap-1">
            <span>Assigned: {assignedAction.name}</span>
            {engineer.hasAiAugmentation && (
              <span className="text-purple-400">+AI</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
