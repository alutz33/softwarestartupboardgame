import type { StartupCard, StartupAbility, StartupAbilityType } from '../types';

// ============================================
// STARTUP ABILITIES
// ============================================

export const STARTUP_ABILITIES: Record<StartupAbilityType, StartupAbility> = {
  pivot: {
    type: 'pivot',
    value: 1,
    description: 'Change your product type once per game',
  },
  'lean-team': {
    type: 'lean-team',
    value: 20,
    description: 'Engineers cost 20% less to hire',
  },
  'insider-info': {
    type: 'insider-info',
    value: 2,
    description: 'See 2 extra engineers in each draft',
  },
  'marketing-discount': {
    type: 'marketing-discount',
    value: 50,
    description: 'Marketing action costs 50% less ($10 instead of $20)',
  },
  'extra-forecasting': {
    type: 'extra-forecasting',
    value: 2,
    description: 'See events 2 quarters ahead instead of 1',
  },
  'passive-income': {
    type: 'passive-income',
    value: 5,
    description: '+$5 income at the end of each quarter',
  },
  'revenue-boost': {
    type: 'revenue-boost',
    value: 20,
    description: '+20% revenue from all Monetization actions',
  },
  'viral-boost': {
    type: 'viral-boost',
    value: 50,
    description: '+50% MAU from Go Viral action (4500 on success)',
  },
  'debt-immunity': {
    type: 'debt-immunity',
    value: 1,
    description: 'Events cannot add tech debt to your startup',
  },
};

// ============================================
// STARTUP CARD DECK (18 Cards)
// ============================================

export const STARTUP_CARDS: StartupCard[] = [
  // Card 1: Move Fast, Break Things
  {
    id: 'startup-1',
    name: '"Move Fast, Break Things"',
    tagline: 'Speed over stability. Ship it!',
    funding: 'vc-heavy',
    tech: 'move-fast',
    product: 'consumer',
    startingMoney: 120, // +20 bonus
    startingTechDebt: 5, // +2 starting debt
    // No ability - offset by money/debt combo
  },

  // Card 2: The Bootstrapper
  {
    id: 'startup-2',
    name: 'The Bootstrapper',
    tagline: 'Every dollar counts. Hire smart.',
    funding: 'bootstrapped',
    tech: 'quality-focused',
    product: 'b2b',
    ability: STARTUP_ABILITIES['lean-team'],
  },

  // Card 3: AI Disruptor
  {
    id: 'startup-3',
    name: 'AI Disruptor',
    tagline: 'The future is automated.',
    funding: 'angel-backed',
    tech: 'ai-first',
    product: 'platform',
    startingAiCapacity: 6, // +2 AI capacity bonus
  },

  // Card 4: Enterprise Sales
  {
    id: 'startup-4',
    name: 'Enterprise Sales',
    tagline: 'Big contracts, big customers.',
    funding: 'vc-heavy',
    tech: 'quality-focused',
    product: 'b2b',
    startingMoney: 60, // Lower than default VC
    startingAiCapacity: 0, // No starting AI
    // Trade-off: less money but quality B2B setup
  },

  // Card 5: Social Viral
  {
    id: 'startup-5',
    name: 'Social Viral',
    tagline: 'Make it shareable. Make it stick.',
    funding: 'angel-backed',
    tech: 'move-fast',
    product: 'consumer',
    ability: STARTUP_ABILITIES['viral-boost'],
  },

  // Card 6: Dev Tools Co
  {
    id: 'startup-6',
    name: 'Dev Tools Co',
    tagline: 'By developers, for developers.',
    funding: 'bootstrapped',
    tech: 'ai-first',
    product: 'platform',
    ability: STARTUP_ABILITIES['lean-team'],
  },

  // Card 7: Stealth Mode
  {
    id: 'startup-7',
    name: 'Stealth Mode',
    tagline: 'Fly under the radar. Plan ahead.',
    funding: 'angel-backed',
    tech: 'quality-focused',
    product: 'b2b',
    ability: STARTUP_ABILITIES['extra-forecasting'],
  },

  // Card 8: Hypergrowth
  {
    id: 'startup-8',
    name: 'Hypergrowth',
    tagline: 'Growth at any cost.',
    funding: 'vc-heavy',
    tech: 'move-fast',
    product: 'consumer',
    ability: STARTUP_ABILITIES['marketing-discount'],
  },

  // Card 9: Pivot Masters
  {
    id: 'startup-9',
    name: 'Pivot Masters',
    tagline: 'Adaptability is everything.',
    funding: 'vc-heavy',
    tech: 'ai-first',
    product: 'consumer',
    ability: STARTUP_ABILITIES.pivot,
  },

  // Card 10: Sustainable SaaS
  {
    id: 'startup-10',
    name: 'Sustainable SaaS',
    tagline: 'Slow and steady wins the race.',
    funding: 'bootstrapped',
    tech: 'quality-focused',
    product: 'consumer',
    ability: STARTUP_ABILITIES['passive-income'],
  },

  // Card 11: API Economy
  {
    id: 'startup-11',
    name: 'API Economy',
    tagline: 'Build the infrastructure others need.',
    funding: 'angel-backed',
    tech: 'ai-first',
    product: 'platform',
    ability: STARTUP_ABILITIES['revenue-boost'],
  },

  // Card 12: Unicorn Hunter
  {
    id: 'startup-12',
    name: 'Unicorn Hunter',
    tagline: 'Go big or go home.',
    funding: 'vc-heavy',
    tech: 'ai-first',
    product: 'platform',
    startingMoney: 110, // +10 bonus
    ability: STARTUP_ABILITIES.pivot,
  },

  // Card 13: Indie Hackers
  {
    id: 'startup-13',
    name: 'Indie Hackers',
    tagline: 'Build in public. Ship fast.',
    funding: 'bootstrapped',
    tech: 'move-fast',
    product: 'consumer',
    startingMau: 500, // +500 MAU starting bonus (adjusted for consumer 2x)
    ability: STARTUP_ABILITIES['passive-income'],
  },

  // Card 14: The Acqui-hire
  {
    id: 'startup-14',
    name: 'The Acqui-hire',
    tagline: 'Talent is the real product.',
    funding: 'angel-backed',
    tech: 'quality-focused',
    product: 'platform',
    ability: STARTUP_ABILITIES['insider-info'],
  },

  // Card 15: Blitzscaling
  {
    id: 'startup-15',
    name: 'Blitzscaling',
    tagline: 'Speed is the ultimate weapon.',
    funding: 'vc-heavy',
    tech: 'move-fast',
    product: 'platform',
    startingMoney: 115, // +15 bonus
    ability: STARTUP_ABILITIES['viral-boost'],
  },

  // Card 16: Technical Founders
  {
    id: 'startup-16',
    name: 'Technical Founders',
    tagline: 'Engineers who know business.',
    funding: 'bootstrapped',
    tech: 'ai-first',
    product: 'b2b',
    startingAiCapacity: 5, // +1 AI bonus
    ability: STARTUP_ABILITIES['debt-immunity'],
  },

  // Card 17: Growth Hackers
  {
    id: 'startup-17',
    name: 'Growth Hackers',
    tagline: 'Find the loops. Exploit them.',
    funding: 'angel-backed',
    tech: 'move-fast',
    product: 'platform',
    ability: STARTUP_ABILITIES['marketing-discount'],
  },

  // Card 18: Enterprise AI
  {
    id: 'startup-18',
    name: 'Enterprise AI',
    tagline: 'AI solutions for big business.',
    funding: 'vc-heavy',
    tech: 'ai-first',
    product: 'b2b',
    startingAiCapacity: 7, // +3 AI bonus
    startingTechDebt: 3, // +1 debt (normally ai-first has 2)
    // No ability - offset by strong AI capacity
  },
];

// ============================================
// DECK UTILITIES
// ============================================

export function createStartupDeck(): StartupCard[] {
  // Shuffle and return a copy
  const deck = [...STARTUP_CARDS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function dealStartupCards(
  deck: StartupCard[],
  playerCount: number,
  cardsPerPlayer: number = 2
): { dealtCards: Map<string, StartupCard[]>; remainingDeck: StartupCard[] } {
  const dealtCards = new Map<string, StartupCard[]>();
  const remainingDeck = [...deck];

  for (let i = 0; i < playerCount; i++) {
    const playerId = `player-${i + 1}`;
    const playerCards: StartupCard[] = [];

    for (let j = 0; j < cardsPerPlayer; j++) {
      if (remainingDeck.length > 0) {
        playerCards.push(remainingDeck.pop()!);
      }
    }

    dealtCards.set(playerId, playerCards);
  }

  return { dealtCards, remainingDeck };
}

// Get the ability description for display
export function getAbilityDescription(ability: StartupAbility | undefined): string {
  if (!ability) return 'No special ability';
  return ability.description;
}

// Check if a player has a specific ability
export function hasAbility(player: { startupCard?: StartupCard }, abilityType: StartupAbilityType): boolean {
  return player.startupCard?.ability?.type === abilityType;
}

// Get ability value (percentage or flat amount)
export function getAbilityValue(player: { startupCard?: StartupCard }, abilityType: StartupAbilityType): number {
  if (player.startupCard?.ability?.type === abilityType) {
    return player.startupCard.ability.value;
  }
  return 0;
}
