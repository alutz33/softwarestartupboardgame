import type { PersonaCard } from '../types';

// ============================================
// PERSONA CARD DECK (18 Dual-Sided Cards)
// ============================================
// Each card has a Leader side (used during setup) and an Engineer side
// (shuffled into the draft pool as premium hires).
// All persona engineers are Senior (4 power) with a unique named trait.

export const PERSONA_CARDS: PersonaCard[] = [
  // ---- Card 1: William Doors ----
  {
    id: 'william-doors',
    name: 'William Doors',
    leaderSide: {
      title: 'Founder & Chairman',
      flavor: '640K ought to be enough for anybody... right?',
      startingBonus: { money: 20, revenueProduction: 1, rating: 7 },
      productLock: ['b2b', 'platform'],
      power: {
        id: 'blue-screen-protocol',
        name: 'Blue Screen Protocol',
        description: 'Force all opponents to skip Optimize Code this round',
      },
      passive: {
        id: 'enterprise-culture',
        name: 'Enterprise Culture',
        description: 'All engineers get +1 power on Develop Features',
      },
    },
    engineerSide: {
      title: 'Senior Software Architect',
      flavor: 'Has opinions about operating systems',
      level: 'senior',
      power: 4,
      specialty: 'backend',
      trait: {
        name: 'Philanthropist',
        description: 'Costs +$10 to hire, but your company gets +$5 income/round while employed',
      },
    },
  },

  // ---- Card 2: Steeve Careers ----
  {
    id: 'steeve-careers',
    name: 'Steeve Careers',
    leaderSide: {
      title: 'Chief Visionary Officer',
      flavor: 'People don\'t know what they want until you show it to them',
      startingBonus: { money: 10, rating: 8 },
      productLock: ['consumer'],
      power: {
        id: 'reality-distortion-field',
        name: 'Reality Distortion Field',
        description: 'Double the output of ALL your engineers this round',
      },
      passive: {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: '+1 rating on even rounds (Q2, Q4)',
      },
    },
    engineerSide: {
      title: 'Senior UX Designer',
      flavor: 'Will reject your mockup 47 times',
      level: 'senior',
      power: 4,
      specialty: 'frontend',
      trait: {
        name: 'Perfectionist',
        description: 'Develop Features gives +1 rating but -200 MAU',
      },
    },
  },

  // ---- Card 3: Elom Tusk ----
  {
    id: 'elom-tusk',
    name: 'Elom Tusk',
    leaderSide: {
      title: 'Technoking',
      flavor: 'I\'m going to put software on Mars',
      startingBonus: { aiCapacity: 3, mauProduction: 2 },
      productLock: ['b2b', 'consumer', 'platform'], // No lock (claims to do everything)
      power: {
        id: 'meme-power',
        name: 'Meme Power',
        description: 'Go Viral succeeds automatically (no 50/50)',
      },
      passive: {
        id: 'hype-machine',
        name: 'Hype Machine',
        description: '+500 MAU from any action, but ±200 random variance each round',
      },
    },
    engineerSide: {
      title: 'Senior AI/Fullstack Engineer',
      flavor: 'Sleeps at the office. Literally.',
      level: 'senior',
      power: 4,
      specialty: 'ai',
      trait: {
        name: 'Volatile',
        description: '+2 power on Research AI, but AI augmentation adds +1 extra debt',
      },
    },
  },

  // ---- Card 4: Jess Bezos ----
  {
    id: 'jess-bezos',
    name: 'Jess Bezos',
    leaderSide: {
      title: 'CEO & Optimization Overlord',
      flavor: 'Your margin is my opportunity',
      startingBonus: { serverCapacity: 10, revenueProduction: 1, rating: 4 },
      productLock: ['platform', 'b2b'],
      power: {
        id: 'prime-day',
        name: 'Prime Day',
        description: 'Monetization gives 3x revenue this round',
      },
      passive: {
        id: 'infrastructure-empire',
        name: 'Infrastructure Empire',
        description: '+2 free server capacity each round',
      },
    },
    engineerSide: {
      title: 'Senior DevOps Engineer',
      flavor: 'Will automate your job. And their own.',
      level: 'senior',
      power: 4,
      specialty: 'devops',
      trait: {
        name: 'Optimizer',
        description: 'Pay Down Debt removes 1 extra debt when this engineer is assigned',
      },
    },
  },

  // ---- Card 5: Mark Zucker ----
  {
    id: 'mark-zucker',
    name: 'Mark Zucker',
    leaderSide: {
      title: 'Chief Connectivity Officer',
      flavor: 'Move fast and break things... especially privacy',
      startingBonus: { mauProduction: 3, rating: 4 },
      productLock: ['consumer', 'platform'],
      power: {
        id: 'data-harvest',
        name: 'Data Harvest',
        description: 'Steal 2 MAU Production from the leading player',
      },
      passive: {
        id: 'network-effects',
        name: 'Network Effects',
        description: '+500 MAU whenever any player uses Marketing',
      },
    },
    engineerSide: {
      title: 'Senior Growth Engineer',
      flavor: 'Knows exactly how many friends you have',
      level: 'senior',
      power: 4,
      specialty: 'fullstack',
      trait: {
        name: 'Growth Hacker',
        description: 'When assigned to Marketing, also gives +1 MAU Production',
      },
    },
  },

  // ---- Card 6: Lora Page ----
  {
    id: 'lora-page',
    name: 'Lora Page',
    leaderSide: {
      title: 'Co-Founder & Chief Scientist',
      flavor: 'Don\'t be evil. Be ambitious.',
      startingBonus: { aiCapacity: 3, mauProduction: 1 },
      productLock: ['platform'],
      power: {
        id: 'moonshot-lab',
        name: 'Moonshot Lab',
        description: 'Research AI gives 3x output AND no debt this round',
      },
      passive: {
        id: 'efficient-ai',
        name: 'Efficient AI',
        description: 'AI augmentation generates 50% less debt',
      },
    },
    engineerSide: {
      title: 'Senior AI Researcher',
      flavor: 'Published 3 papers this sprint instead of writing code',
      level: 'senior',
      power: 4,
      specialty: 'ai',
      trait: {
        name: 'Researcher',
        description: 'No specialty bonus on non-AI actions, but double bonus on AI actions',
      },
    },
  },

  // ---- Card 7: Susan Fry ----
  {
    id: 'susan-fry',
    name: 'Susan Fry',
    leaderSide: {
      title: 'Chief Operating Officer',
      flavor: 'Revenue isn\'t a vanity metric if it\'s recurring',
      startingBonus: { revenueProduction: 2, rating: 6 },
      productLock: ['b2b'],
      power: {
        id: 'ipo-fast-track',
        name: 'IPO Fast-Track',
        description: 'Immediately score your current Revenue Production x 5 as bonus points',
      },
      passive: {
        id: 'ad-network',
        name: 'Ad Network',
        description: '+$5 income per round',
      },
    },
    engineerSide: {
      title: 'Senior Business Analyst',
      flavor: 'Has a spreadsheet for her spreadsheets',
      level: 'senior',
      power: 4,
      specialty: 'backend',
      trait: {
        name: 'Monetizer',
        description: 'Each Monetization action gives +1 Rev Production instead of the usual amount',
      },
    },
  },

  // ---- Card 8: Satoshi Nakamaybe ----
  {
    id: 'satoshi-nakamaybe',
    name: 'Satoshi Nakamaybe',
    leaderSide: {
      title: 'Anonymous Founder',
      flavor: 'Trust the protocol, not the corporation',
      startingBonus: { techDebt: 0, mauProduction: 1, revenueProduction: 1 },
      productLock: ['platform'],
      power: {
        id: 'decentralize',
        name: 'Decentralize',
        description: 'All opponents gain +2 tech debt',
      },
      passive: {
        id: 'immutable-ledger',
        name: 'Immutable Ledger',
        description: 'Cannot use Marketing action. Immune to Data Breach events.',
      },
    },
    engineerSide: {
      title: 'Senior Cryptography Engineer',
      flavor: 'Nobody knows their real name either',
      level: 'senior',
      power: 4,
      specialty: 'backend',
      trait: {
        name: 'Decentralist',
        description: 'Tech debt from AI augmentation is halved (round down) for this engineer',
      },
    },
  },

  // ---- Card 9: Jensen Wattson ----
  {
    id: 'jensen-wattson',
    name: 'Jensen Wattson',
    leaderSide: {
      title: 'Supreme Leather Jacket Officer',
      flavor: 'The more GPUs you buy, the more money you save. Trust me.',
      startingBonus: { aiCapacity: 2, revenueProduction: 1, money: 20 },
      productLock: ['platform', 'b2b'],
      power: {
        id: 'gpu-tax',
        name: 'GPU Tax',
        description: 'All opponents who use AI augmentation this round must pay you $5 each',
      },
      passive: {
        id: 'gpu-royalties',
        name: 'GPU Royalties',
        description: 'Research AI gives +1 extra AI Capacity',
      },
    },
    engineerSide: {
      title: 'Senior GPU Infrastructure Engineer',
      flavor: 'Will solve any problem by throwing more parallel cores at it',
      level: 'senior',
      power: 4,
      specialty: 'ai',
      trait: {
        name: 'Parallel Processor',
        description: 'When assigned to Research AI, also gives +1 server capacity',
      },
    },
  },

  // ---- Card 10: Sam Chatman ----
  {
    id: 'sam-chatman',
    name: 'Sam Chatman',
    leaderSide: {
      title: 'Chief Alignment Officer',
      flavor: 'This could end humanity. Anyway, that\'ll be $20/month.',
      startingBonus: { aiCapacity: 3, rating: 6 },
      productLock: ['platform'],
      power: {
        id: 'safety-pause',
        name: 'Safety Pause',
        description: 'All opponents cannot use AI augmentation this round (you still can)',
      },
      passive: {
        id: 'alignment-tax',
        name: 'Alignment Tax',
        description: 'AI augmentation generates zero debt, BUT -1 Rating every round you use AI',
      },
    },
    engineerSide: {
      title: 'Senior AI Safety Researcher',
      flavor: 'Writes safety papers during standup meetings',
      level: 'senior',
      power: 4,
      specialty: 'ai',
      trait: {
        name: 'Alignment Researcher',
        description: '+2 power on Research AI, but if AI Capacity > 6, -1 power on all other actions',
      },
    },
  },

  // ---- Card 11: Silica Su ----
  {
    id: 'silica-su',
    name: 'Silica Su',
    leaderSide: {
      title: 'CEO & Chief Engineer',
      flavor: 'Our roadmap said we\'d ship it. So we shipped it. Revolutionary concept.',
      startingBonus: { mauProduction: 1 },
      productLock: ['b2b'],
      power: {
        id: 'roadmap-execution',
        name: 'Roadmap Execution',
        description: 'Double the output of all Develop Features actions this round',
      },
      passive: {
        id: 'lean-efficiency',
        name: 'Lean Efficiency',
        description: 'All engineer hiring costs -$5',
      },
    },
    engineerSide: {
      title: 'Senior Chip Architect',
      flavor: 'Optimizes everything. Including the office coffee schedule.',
      level: 'senior',
      power: 4,
      specialty: 'fullstack',
      trait: {
        name: 'Process Optimizer',
        description: 'When assigned to Develop Features, also gives +1 Rev Production',
      },
    },
  },

  // ---- Card 12: Binge Hastings ----
  {
    id: 'binge-hastings',
    name: 'Binge Hastings',
    leaderSide: {
      title: 'Chief Content Officer',
      flavor: 'Sleep is our greatest competitor. And we are winning.',
      startingBonus: { mauProduction: 1, revenueProduction: 1 },
      productLock: ['consumer'],
      power: {
        id: 'binge-drop',
        name: 'Binge Drop',
        description: 'All Develop Features output this round is doubled',
      },
      passive: {
        id: 'subscriber-loyalty',
        name: 'Subscriber Loyalty',
        description: '+1 Revenue Production at end of every round where Rating is 6+',
      },
    },
    engineerSide: {
      title: 'Senior Recommendation Algorithm Engineer',
      flavor: 'The algorithm knows what you want before you do',
      level: 'senior',
      power: 4,
      specialty: 'backend',
      trait: {
        name: 'Content Algorithm',
        description: 'When assigned to Marketing, also gives +1 MAU Production',
      },
    },
  },

  // ---- Card 13: Whitney Buzz Herd ----
  {
    id: 'whitney-buzz-herd',
    name: 'Whitney Buzz Herd',
    leaderSide: {
      title: 'Founder & Chief Impact Officer',
      flavor: 'We didn\'t disrupt dating. We made it civilized. You\'re welcome.',
      startingBonus: { rating: 7, mauProduction: 1 },
      productLock: ['consumer'],
      power: {
        id: 'first-move',
        name: 'First Move',
        description: 'Claim any one action slot before the normal draft order this round',
      },
      passive: {
        id: 'trust-safety',
        name: 'Trust & Safety',
        description: 'Rating can never drop below 4 from events; Marketing gives +1 Rating bonus',
      },
    },
    engineerSide: {
      title: 'Senior Community Safety Engineer',
      flavor: 'Has banned more trolls than you\'ve had hot dinners',
      level: 'senior',
      power: 4,
      specialty: 'frontend',
      trait: {
        name: 'Community Manager',
        description: 'When assigned to any action, your Rating cannot decrease this round from that action',
      },
    },
  },

  // ---- Card 14: Marc Cloudoff ----
  {
    id: 'marc-cloudoff',
    name: 'Marc Cloudoff',
    leaderSide: {
      title: 'Founder & Chief Hawaiian Shirt Officer',
      flavor: 'Why would anyone install software when they could pay me monthly? Forever?',
      startingBonus: { revenueProduction: 2, money: 20 },
      productLock: ['b2b'],
      power: {
        id: 'acquisition-spree',
        name: 'Acquisition Spree',
        description: 'Steal one hired engineer from any opponent by paying their salary + $10',
      },
      passive: {
        id: 'saas-compounding',
        name: 'SaaS Compounding',
        description: 'Monetization gives +1 Revenue Production (instead of flat revenue)',
      },
    },
    engineerSide: {
      title: 'Senior Enterprise Sales Engineer',
      flavor: 'Can close a six-figure deal over a lunch meeting',
      level: 'senior',
      power: 4,
      specialty: 'backend',
      trait: {
        name: 'Enterprise Sales',
        description: 'When assigned to Monetization, also gives +$5 flat bonus',
      },
    },
  },

  // ---- Card 15: Gabe Newdeal ----
  {
    id: 'gabe-newdeal',
    name: 'Gabe Newdeal',
    leaderSide: {
      title: 'President & Flat Hierarchy Philosopher',
      flavor: 'We will absolutely make a third version. Just not in your lifetime.',
      startingBonus: { money: 30, mauProduction: 1, revenueProduction: 1 },
      productLock: ['platform'],
      power: {
        id: 'steam-sale',
        name: 'Steam Sale',
        description: 'All opponents lose $10. You gain $5 per opponent.',
      },
      passive: {
        id: 'marketplace-tax',
        name: 'Marketplace Tax',
        description: 'Earn +$3 for every other player who uses Develop Features each round',
      },
    },
    engineerSide: {
      title: 'Senior Platform Architect',
      flavor: 'Works on whatever they want. Currently: hats.',
      level: 'senior',
      power: 4,
      specialty: 'fullstack',
      trait: {
        name: 'Flat Hierarchy',
        description: 'When this engineer is your only engineer on an action, +2 power bonus',
      },
    },
  },

  // ---- Card 16: Jack Blocksey ----
  {
    id: 'jack-blocksey',
    name: 'Jack Blocksey',
    leaderSide: {
      title: 'CEO x 2',
      flavor: 'I simplified my life to one meal, one social network, and 280 characters.',
      startingBonus: { mauProduction: 1, revenueProduction: 1 },
      productLock: ['consumer', 'platform'],
      power: {
        id: 'dual-pivot',
        name: 'Dual Pivot',
        description: 'Change your product type AND immediately take one extra action this round',
      },
      passive: {
        id: 'dual-focus',
        name: 'Dual Focus',
        description: 'May assign engineers to TWO different exclusive (1-slot) actions in the same round',
      },
    },
    engineerSide: {
      title: 'Senior Protocol Engineer',
      flavor: 'Fasts on Tuesdays. Deploys on Fridays.',
      level: 'senior',
      power: 4,
      specialty: 'fullstack',
      trait: {
        name: 'Protocol Purist',
        description: '+1 power on Pay Down Debt; immune to tech debt from events',
      },
    },
  },

  // ---- Card 17: Grace Debugger ----
  {
    id: 'grace-debugger',
    name: 'Grace Debugger',
    leaderSide: {
      title: 'Rear Admiral & Chief Compiler',
      flavor: 'The most dangerous phrase is: "We\'ve always done it this way."',
      startingBonus: { techDebt: 0, rating: 6 },
      productLock: ['b2b', 'platform'],
      power: {
        id: 'compiler-overhaul',
        name: 'Compiler Overhaul',
        description: 'Immediately reduce your tech debt to zero, regardless of current level',
      },
      passive: {
        id: 'double-optimize',
        name: 'Double Optimize',
        description: 'Optimize Code gives double output (+2 rating instead of +1)',
      },
    },
    engineerSide: {
      title: 'Senior Systems Architect',
      flavor: 'Wrote the first compiler. What did you do today?',
      level: 'senior',
      power: 4,
      specialty: 'backend',
      trait: {
        name: "Admiral's Discipline",
        description: 'When assigned to any action, that action generates 0 tech debt (even with AI)',
      },
    },
  },

  // ---- Card 18: Brian Spare-key ----
  {
    id: 'brian-spare-key',
    name: 'Brian Spare-key',
    leaderSide: {
      title: 'Co-Founder & Chief Belonging Officer',
      flavor: 'We sold cereal boxes to fund our startup. Your Series A pitch is adorable.',
      startingBonus: { mauProduction: 2, money: 10 },
      productLock: ['platform'],
      power: {
        id: 'surge-pricing',
        name: 'Surge Pricing',
        description: 'Monetization gives 3x revenue this round AND +1 Rating',
      },
      passive: {
        id: 'crisis-resilience',
        name: 'Crisis Resilience',
        description: 'Every time any opponent gains MAU from Marketing or Go Viral, you also gain +200 MAU',
      },
    },
    engineerSide: {
      title: 'Senior Marketplace Engineer',
      flavor: 'Can turn any spare room into a revenue stream',
      level: 'senior',
      power: 4,
      specialty: 'devops',
      trait: {
        name: 'Resilience Architect',
        description: '+1 power on Upgrade Servers; when a negative event occurs, gain +1 server capacity',
      },
    },
  },
];

// ============================================
// DECK UTILITIES
// ============================================

/** Shuffle an array in-place (Fisher-Yates) and return it */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Create a shuffled persona deck */
export function createPersonaDeck(): PersonaCard[] {
  return shuffle([...PERSONA_CARDS]);
}

/**
 * Deal leader cards to players (3 per player for pick-1-of-3).
 * Returns dealt cards per player and the remaining deck (to be shuffled
 * into engineer pool as persona engineers).
 */
export function dealLeaderCards(
  deck: PersonaCard[],
  playerCount: number,
  cardsPerPlayer: number = 3
): { dealtCards: Map<string, PersonaCard[]>; remainingDeck: PersonaCard[] } {
  const dealtCards = new Map<string, PersonaCard[]>();
  const remainingDeck = [...deck];

  for (let i = 0; i < playerCount; i++) {
    const playerId = `player-${i + 1}`;
    const playerCards: PersonaCard[] = [];

    for (let j = 0; j < cardsPerPlayer; j++) {
      if (remainingDeck.length > 0) {
        playerCards.push(remainingDeck.pop()!);
      }
    }

    dealtCards.set(playerId, playerCards);
  }

  return { dealtCards, remainingDeck };
}

/**
 * Convert a PersonaCard to an Engineer (for use in the draft pool).
 * Uses the engineer side of the card.
 */
export function personaToEngineer(card: PersonaCard): {
  id: string;
  name: string;
  level: 'senior';
  specialty: typeof card.engineerSide.specialty;
  baseSalary: number;
  power: number;
  trait: undefined; // Persona engineers use personaTrait, not generic traits
  isPersona: true;
  personaId: typeof card.id;
  personaTrait: typeof card.engineerSide.trait;
} {
  return {
    id: `persona-${card.id}`,
    name: card.name,
    level: 'senior',
    specialty: card.engineerSide.specialty,
    baseSalary: 15, // Base Senior salary (auction determines actual price)
    power: card.engineerSide.power,
    trait: undefined, // Persona cards don't use generic trait system
    isPersona: true,
    personaId: card.id,
    personaTrait: card.engineerSide.trait,
  };
}

/**
 * Draw persona cards for a round's engineer pool.
 * Draws 2-3 persona cards from the remaining deck.
 */
export function drawPersonasForRound(
  deck: PersonaCard[],
  count: number = 2
): { drawn: PersonaCard[]; remainingDeck: PersonaCard[] } {
  const remaining = [...deck];
  const drawn: PersonaCard[] = [];

  const drawCount = Math.min(count, remaining.length);
  for (let i = 0; i < drawCount; i++) {
    drawn.push(remaining.pop()!);
  }

  return { drawn, remainingDeck: remaining };
}
