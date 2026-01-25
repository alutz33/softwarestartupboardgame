import type { FundingOption, TechOption, ProductOption, CorporationPower } from '../types';

// ============================================
// CORPORATION POWERS (Unique Abilities)
// ============================================

export const CORPORATION_POWERS: Record<string, CorporationPower> = {
  pivot: {
    id: 'pivot',
    name: 'Pivot',
    description: 'Once per game, change your product type mid-game',
    usesPerGame: 1,
    triggersOn: 'manual',
  },
  'lean-team': {
    id: 'lean-team',
    name: 'Lean Team',
    description: 'Engineers cost 20% less to hire (applied to bid cost)',
    usesPerGame: -1, // Passive
    triggersOn: 'hire',
  },
  'insider-info': {
    id: 'insider-info',
    name: 'Insider Info',
    description: 'See 2 extra engineers in each draft round',
    usesPerGame: -1, // Passive
    triggersOn: 'draft',
  },
};

export const FUNDING_OPTIONS: FundingOption[] = [
  {
    id: 'vc-heavy',
    name: 'VC-Heavy',
    description: 'Raised a big Series A. Lots of cash, but investors want growth.',
    startingMoney: 100,
    equityRetained: 40,
    bonusEffect: '+50% marketing effectiveness, but must hit MAU targets',
    power: CORPORATION_POWERS.pivot,
  },
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'Self-funded. Limited cash, but you own everything.',
    startingMoney: 40,
    equityRetained: 100,
    bonusEffect: 'Revenue counts 2x for scoring, but slower start',
    power: CORPORATION_POWERS['lean-team'],
  },
  {
    id: 'angel-backed',
    name: 'Angel-Backed',
    description: 'Strategic angels provide moderate funding and connections.',
    startingMoney: 70,
    equityRetained: 70,
    bonusEffect: '+1 engineer capacity per round, flexible strategy',
    power: CORPORATION_POWERS['insider-info'],
  },
];

export const TECH_OPTIONS: TechOption[] = [
  {
    id: 'ai-first',
    name: 'AI-First',
    description: 'Built on AI from day one. Fast output, but dependency risks.',
    startingAiCapacity: 4,
    startingTechDebt: 2,
    bonusEffect: 'AI augmentation costs 50% less debt',
  },
  {
    id: 'quality-focused',
    name: 'Quality-Focused',
    description: 'Clean code, thorough testing. Slower but stable.',
    startingAiCapacity: 1,
    startingTechDebt: 0,
    bonusEffect: 'Tech debt accumulates 50% slower, +0.5 base rating',
  },
  {
    id: 'move-fast',
    name: 'Move Fast',
    description: 'Ship first, fix later. Rapid iteration.',
    startingAiCapacity: 2,
    startingTechDebt: 3,
    bonusEffect: '+1 feature output per round, but debt accumulates 25% faster',
  },
];

export const PRODUCT_OPTIONS: ProductOption[] = [
  {
    id: 'b2b',
    name: 'B2B SaaS',
    description: 'Enterprise customers. Higher revenue per user, slower growth.',
    mauMultiplier: 0.5,
    revenueMultiplier: 2.0,
    ratingMultiplier: 0.8,
  },
  {
    id: 'consumer',
    name: 'Consumer App',
    description: 'Mass market. Viral potential, lower monetization.',
    mauMultiplier: 2.0,
    revenueMultiplier: 0.5,
    ratingMultiplier: 1.2,
  },
  {
    id: 'platform',
    name: 'Platform Play',
    description: 'Build an ecosystem. Balanced growth, network effects.',
    mauMultiplier: 1.0,
    revenueMultiplier: 1.0,
    ratingMultiplier: 1.0,
  },
];

export function getStartingResources(
  funding: FundingOption,
  tech: TechOption
) {
  return {
    money: funding.startingMoney,
    serverCapacity: 10,
    aiCapacity: tech.startingAiCapacity,
    techDebt: tech.startingTechDebt,
  };
}

export function getStartingMetrics(product: ProductOption) {
  return {
    mau: Math.round(1000 * product.mauMultiplier),
    revenue: Math.round(500 * product.revenueMultiplier),
    rating: 3.0 * product.ratingMultiplier,
  };
}
