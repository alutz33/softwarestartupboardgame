import type { QuarterlyTheme } from '../types';

export const QUARTERLY_THEMES: QuarterlyTheme[] = [
  {
    id: 'startup-boom',
    name: 'The Startup Boom',
    description: 'VCs are throwing money at anything that moves. Feature development is turbocharged, but nobody cares about monetization yet.',
    flavor: '"Move fast and break things — we\'ll figure out revenue later."',
    modifiers: {
      actionOutputMultiplier: {
        'develop-features': 1.5,
      },
      globalEffects: {
        salaryChange: -5,
      },
      restrictedActions: ['monetization'],
    },
  },
  {
    id: 'market-expansion',
    name: 'Market Expansion',
    description: 'New markets are opening up worldwide. Marketing is cheap and every action generates bonus user growth.',
    flavor: '"The total addressable market just doubled overnight."',
    modifiers: {
      actionCostMultiplier: {
        'marketing': 0.5,
      },
      globalEffects: {
        incomeBonus: 0, // +200 MAU flat bonus handled by game logic via bonusActions
      },
      bonusActions: [
        'develop-features', 'optimize-code', 'pay-down-debt',
        'upgrade-servers', 'research-ai', 'marketing',
        'monetization', 'hire-recruiter', 'go-viral',
        'ipo-prep', 'acquisition-target',
      ],
    },
  },
  {
    id: 'the-reckoning',
    name: 'The Reckoning',
    description: 'Infrastructure costs are spiraling and technical debt is catching up. But desperate companies are paying top dollar for revenue.',
    flavor: '"We should have written those tests six months ago..."',
    modifiers: {
      actionCostMultiplier: {
        'upgrade-servers': 2,
      },
      actionOutputMultiplier: {
        'monetization': 1.5,
      },
      globalEffects: {
        debtPenaltyMultiplier: 2,
      },
    },
  },
  {
    id: 'ipo-window',
    name: 'IPO Window',
    description: 'The public markets are hot. Rating counts double for final scoring and steady income flows in.',
    flavor: '"Ring the bell! The IPO window is wide open!"',
    modifiers: {
      globalEffects: {
        incomeBonus: 10,
      },
    },
  },
  {
    id: 'ai-gold-rush',
    name: 'AI Gold Rush',
    description: 'Everyone wants AI. Research is cheap and AI output is boosted, but the technical debt piles up faster.',
    flavor: '"Just slap an LLM on it and call it AI-powered."',
    modifiers: {
      actionCostMultiplier: {
        'research-ai': 0.5,
      },
      actionOutputMultiplier: {
        'research-ai': 1.5,
      },
      globalEffects: {
        debtPenaltyMultiplier: 1.5,
      },
    },
  },
  {
    id: 'talent-war',
    name: 'Talent War',
    description: 'Every company is hiring aggressively. Salaries are up, but there are more engineers available in the draft.',
    flavor: '"Counter-offer? That\'s the third one this week."',
    modifiers: {
      globalEffects: {
        salaryChange: 5,
        extraDraftEngineers: 2,
      },
    },
  },
  {
    id: 'regulatory-crackdown',
    name: 'Regulatory Crackdown',
    description: 'Regulators are scrutinizing tech companies. Technical debt is punished harshly, but clean code is rewarded.',
    flavor: '"The FTC would like a word about your data practices."',
    modifiers: {
      actionOutputMultiplier: {
        'optimize-code': 2,
      },
      globalEffects: {
        debtPenaltyMultiplier: 2,
      },
    },
  },
  {
    id: 'bubble-market',
    name: 'Bubble Market',
    description: 'Irrational exuberance is everywhere. Revenue is flowing and marketing reach is doubled. Enjoy it while it lasts.',
    flavor: '"Valuations have never been higher — what could go wrong?"',
    modifiers: {
      actionOutputMultiplier: {
        'marketing': 2,
      },
      globalEffects: {
        incomeBonus: 10,
      },
    },
  },
];

/** Shuffle and deal 4 themes for a game */
export function shuffleThemes(): QuarterlyTheme[] {
  const shuffled = [...QUARTERLY_THEMES];
  // Fisher-Yates shuffle
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 4); // Deal 4 themes for 4 rounds
}

/** Get theme for a specific round (1-indexed) */
export function getThemeForRound(themes: QuarterlyTheme[], round: number): QuarterlyTheme | undefined {
  return themes[round - 1];
}
