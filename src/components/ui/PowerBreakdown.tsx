import type { HiredEngineer } from '../../types';
import { getTechDebtLevel, AI_POWER_BONUS } from '../../types';
import { ACTION_SPACES } from '../../data/actions';
import { getSpecialtyBonus } from '../../data/engineers';

export interface PowerBreakdownLine {
  label: string;
  value: number;
}

export function calculatePowerBreakdown(
  engineer: HiredEngineer,
  techDebt: number,
): PowerBreakdownLine[] {
  const lines: PowerBreakdownLine[] = [];

  // Base power from engineer level
  const levelLabel = engineer.level === 'senior' ? 'Senior' : engineer.level === 'junior' ? 'Junior' : 'Intern';
  lines.push({ label: `Base power (${levelLabel})`, value: engineer.power });

  // AI augmentation bonus
  if (engineer.hasAiAugmentation) {
    lines.push({ label: 'AI augmentation', value: AI_POWER_BONUS });
  }

  // Specialty bonus (if assigned to an action)
  if (engineer.assignedAction && engineer.specialty) {
    const specBonus = getSpecialtyBonus(engineer.specialty, engineer.assignedAction);
    if (specBonus > 0) {
      const actionName = ACTION_SPACES.find(a => a.id === engineer.assignedAction)?.name || engineer.assignedAction;
      lines.push({ label: `Specialty (${engineer.specialty} on ${actionName})`, value: specBonus });
    }
  }

  // Trait bonuses
  if (engineer.trait === 'ai-skeptic') {
    lines.push({ label: 'AI Skeptic (+1 base)', value: 1 });
  }
  if (engineer.trait === 'equity-hungry' && engineer.roundsRetained >= 2) {
    lines.push({ label: 'Equity-Hungry (2+ rounds)', value: 1 });
  }
  if (engineer.trait === 'night-owl') {
    lines.push({ label: 'Night Owl (last action)', value: 1 });
  }

  // Persona trait bonuses
  if (engineer.personaTrait) {
    lines.push({ label: `Trait: ${engineer.personaTrait.name}`, value: 0 });
  }

  // Tech debt penalty
  const debtLevel = getTechDebtLevel(techDebt);
  if (debtLevel.powerPenalty < 0) {
    lines.push({ label: 'Tech debt penalty', value: debtLevel.powerPenalty });
  }

  return lines;
}

export function PowerBreakdownTooltipContent({ lines }: { lines: PowerBreakdownLine[] }) {
  const total = lines.reduce((sum, l) => sum + l.value, 0);
  return (
    <div className="text-left space-y-1 min-w-[180px]">
      {lines.map((line, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span className="text-gray-300">{line.label}</span>
          <span className={line.value >= 0 ? 'text-green-400' : 'text-red-400'}>
            {line.value > 0 ? '+' : ''}{line.value}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-500 pt-1 flex justify-between gap-4 font-semibold">
        <span className="text-white">Total</span>
        <span className="text-white">{Math.max(0, total)} power</span>
      </div>
    </div>
  );
}
