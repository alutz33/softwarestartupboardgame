import type { FundingOption, TechOption, ProductOption, CorporationPower, ProductionTracks } from '../types';

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
    bonusEffect: '+2 Marketing power. Can pivot once/game. 40% equity.',
    power: CORPORATION_POWERS.pivot,
  },
  {
    id: 'bootstrapped',
    name: 'Bootstrapped',
    description: 'Self-funded. Limited cash, but you own everything.',
    startingMoney: 40,
    equityRetained: 100,
    bonusEffect: 'Revenue scores 2x at end. -20% hiring costs. 100% equity.',
    power: CORPORATION_POWERS['lean-team'],
  },
  {
    id: 'angel-backed',
    name: 'Angel-Backed',
    description: 'Strategic angels provide moderate funding and connections.',
    startingMoney: 70,
    equityRetained: 70,
    bonusEffect: '+1 engineer capacity. See +2 extra engineers in draft. 70% equity.',
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
    bonusEffect: 'AI augmentation generates 50% less debt',
  },
  {
    id: 'quality-focused',
    name: 'Quality-Focused',
    description: 'Clean code, thorough testing. Slower but stable.',
    startingAiCapacity: 1,
    startingTechDebt: 0,
    bonusEffect: '+1 rating at end of each round',
  },
  {
    id: 'move-fast',
    name: 'Move Fast',
    description: 'Ship first, fix later. Rapid iteration.',
    startingAiCapacity: 2,
    startingTechDebt: 3,
    bonusEffect: '+1 MAU production at start, but debt accumulates faster',
  },
];

export const PRODUCT_OPTIONS: ProductOption[] = [
  {
    id: 'b2b',
    name: 'B2B SaaS',
    description: 'Enterprise customers. Higher revenue, slower MAU growth.',
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

// ============================================
// STARTING PRODUCTION POSITIONS (by product type)
// ============================================
// Instead of complex multipliers, each product type gives different
// starting positions on the production tracks.

export function getStartingProductionTracks(
  product: ProductOption,
  tech: TechOption
): ProductionTracks {
  // Base production by product type
  const baseProduction: Record<string, ProductionTracks> = {
    b2b: { mauProduction: 1, revenueProduction: 2 },       // B2B: slow users, strong revenue
    consumer: { mauProduction: 3, revenueProduction: 0 },   // Consumer: fast users, no revenue
    platform: { mauProduction: 2, revenueProduction: 1 },   // Platform: balanced
  };

  const base = baseProduction[product.id] || { mauProduction: 2, revenueProduction: 1 };

  // Move-fast tech gives +1 MAU production at start
  const mauBonus = tech.id === 'move-fast' ? 1 : 0;

  return {
    mauProduction: base.mauProduction + mauBonus,
    revenueProduction: base.revenueProduction,
  };
}

// ============================================
// STARTING RATING (by product type, 1-10 integer)
// ============================================

export function getStartingRating(product: ProductOption): number {
  const ratings: Record<string, number> = {
    b2b: 5,        // Average — business users are forgiving
    consumer: 6,   // Slightly above average — consumer polish expected
    platform: 5,   // Balanced
  };
  return ratings[product.id] || 5;
}

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
    rating: getStartingRating(product),
  };
}
