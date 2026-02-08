import type { ActionSpace, ActionType } from '../types';

export const ACTION_SPACES: ActionSpace[] = [
  {
    id: 'develop-features',
    name: 'Develop Features',
    description: 'Build new features to attract users. More power = more MAU.',
    maxWorkers: 3, // Competitive: only 3 players can develop features per round
    effect: {
      mauChange: 100, // Per power point: +100 MAU
      mauProductionDelta: 1, // Move MAU production marker +1
      special: 'Gain +100 MAU per power. Also advances MAU production track by 1.',
    },
  },
  {
    id: 'optimize-code',
    name: 'Optimize Code',
    description: 'Refactor and improve code quality. Triggers sprint mini-game!',
    // No maxWorkers - sprint handles competition
    effect: {
      ratingChange: 1,
      resourceChanges: { techDebt: -1 },
      triggersMinigame: true,
      special: 'Winner gets bonus debt reduction (scales with engineers assigned)',
    },
  },
  {
    id: 'pay-down-debt',
    name: 'Pay Down Debt',
    description: 'Dedicated debt reduction. No puzzle, just grind.',
    // No maxWorkers - always available
    effect: {
      resourceChanges: { techDebt: -2 },
      special: 'Guaranteed debt reduction',
    },
  },
  {
    id: 'upgrade-servers',
    name: 'Upgrade Servers',
    description: 'Increase server capacity to support more users.',
    maxWorkers: 2, // Limited server upgrade slots
    requiredResources: { money: 10 },
    effect: {
      resourceChanges: { serverCapacity: 5, money: -10 },
      special: 'Prevents crashes from MAU spikes',
    },
  },
  {
    id: 'research-ai',
    name: 'Research AI',
    description: 'Invest in AI capabilities for future productivity gains.',
    maxWorkers: 2, // Limited research capacity
    requiredResources: { money: 15 },
    effect: {
      resourceChanges: { aiCapacity: 2, money: -15 },
      special: 'Unlocks more AI augmentation next round',
    },
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Acquire users through marketing campaigns.',
    maxWorkers: 1, // Only one player can dominate marketing per round!
    requiredResources: { money: 20 },
    effect: {
      mauChange: 200, // Per power point: +200 MAU
      ratingChange: 1,
      resourceChanges: { money: -20 },
      special: 'Gain +200 MAU per power. Effectiveness scales with rating. Exclusive action!',
    },
  },
  {
    id: 'monetization',
    name: 'Monetization',
    description: 'Implement revenue features. May impact user sentiment.',
    maxWorkers: 2, // Limited monetization slots
    effect: {
      revenueChange: 300,
      ratingChange: -1,
      revenueProductionDelta: 1, // Move revenue production marker +1
      special: 'Revenue scales with MAU. Advances revenue production. Aggressive monetization hurts rating.',
    },
  },
  {
    id: 'hire-recruiter',
    name: 'Hire Recruiter',
    description: 'Invest in recruiting for better engineer pool next round.',
    maxWorkers: 1, // Only one recruiter available
    requiredResources: { money: 25 },
    effect: {
      resourceChanges: { money: -25 },
      special: 'See +2 better engineers in next draft. Exclusive action!',
    },
  },
  // ============================================
  // LATE-GAME ACTIONS (Unlock in later rounds)
  // ============================================
  {
    id: 'go-viral',
    name: 'Go Viral',
    description: 'Launch a risky viral campaign. High risk, high reward!',
    maxWorkers: 1, // Only one player can attempt per round
    requiredResources: { money: 15 },
    unlocksAtRound: 3, // Available from Round 3
    effect: {
      resourceChanges: { money: -15 },
      mauProductionDelta: 2, // On success, advance MAU production by 2
      special: '50% chance: +3000 MAU & +2 MAU production, 50% chance: -1000 MAU',
    },
  },
  {
    id: 'ipo-prep',
    name: 'IPO Prep',
    description: 'Prepare for initial public offering. Convert cash to final score.',
    maxWorkers: 1, // Exclusive action
    requiredResources: { money: 50 },
    unlocksAtRound: 4, // Only in final round
    effect: {
      resourceChanges: { money: -50 },
      special: 'Convert $50 into +25 final score bonus',
    },
  },
  {
    id: 'acquisition-target',
    name: 'Acquisition Target',
    description: 'Position for acquisition. Trade MAU for instant score.',
    maxWorkers: 1, // Only one player can be acquired
    unlocksAtRound: 4, // Only in final round
    effect: {
      special: 'Sell company: MAU × 0.002 instant score. Lose 50% MAU.',
    },
  },
];

export function getActionSpace(actionType: ActionType): ActionSpace {
  const space = ACTION_SPACES.find((a) => a.id === actionType);
  if (!space) throw new Error(`Unknown action type: ${actionType}`);
  return space;
}

// Get actions available for a specific round (filters late-game actions)
export function getAvailableActions(roundNumber: number): ActionSpace[] {
  return ACTION_SPACES.filter(action => {
    // If no unlock requirement, always available
    if (!action.unlocksAtRound) return true;
    // Otherwise, check if current round meets requirement
    return roundNumber >= action.unlocksAtRound;
  });
}

export function canAffordAction(
  resources: { money: number },
  actionType: ActionType
): boolean {
  const space = getActionSpace(actionType);
  if (!space.requiredResources) return true;
  return resources.money >= (space.requiredResources.money || 0);
}
