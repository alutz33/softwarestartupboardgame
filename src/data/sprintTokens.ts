import type { SprintToken, SprintTokenType } from '../types';

// Token distribution for the sprint bag
// Total: 15 tokens per bag
// 8x Clean Code +1, 3x Clean Code +2, 3x Bug, 1x Critical Bug
const TOKEN_DEFINITIONS: { type: SprintTokenType; count: number; name: string; value: number; isBug: boolean; isCritical: boolean }[] = [
  { type: 'clean-code-1', count: 8, name: 'Clean Code', value: 1, isBug: false, isCritical: false },
  { type: 'clean-code-2', count: 3, name: 'Great Code', value: 2, isBug: false, isCritical: false },
  { type: 'bug', count: 3, name: 'Bug!', value: 0, isBug: true, isCritical: false },
  { type: 'critical-bug', count: 1, name: 'Critical Bug!', value: 0, isBug: true, isCritical: true },
];

// Create a fresh token bag (shuffled)
export function createSprintBag(): SprintToken[] {
  const tokens: SprintToken[] = [];
  let id = 0;

  for (const def of TOKEN_DEFINITIONS) {
    for (let i = 0; i < def.count; i++) {
      tokens.push({
        id: `sprint-token-${id++}`,
        type: def.type,
        name: def.name,
        value: def.value,
        isBug: def.isBug,
        isCritical: def.isCritical,
      });
    }
  }

  // Fisher-Yates shuffle
  for (let i = tokens.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tokens[i], tokens[j]] = [tokens[j], tokens[i]];
  }

  return tokens;
}

// Calculate max draws based on number of engineers assigned to Optimize Code
export function getMaxDraws(engineerCount: number): number {
  if (engineerCount <= 0) return 1; // Non-participants get 1 free draw
  if (engineerCount === 1) return 5;
  if (engineerCount === 2) return 7;
  return 9; // 3+ engineers
}

// Calculate debt reduction from clean code total
// Each clean code point = 1 tech debt reduction
export function getSprintDebtReduction(cleanCodeTotal: number): number {
  return cleanCodeTotal;
}

// Calculate rating bonus from sprint performance
// Best performer gets +1 rating bonus
export function getSprintRatingBonus(cleanCodeTotal: number, bestTotal: number): number {
  if (cleanCodeTotal > 0 && cleanCodeTotal === bestTotal) return 1;
  return 0;
}
