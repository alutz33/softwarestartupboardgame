import type { GameEvent, Resources, PlayerMetrics } from '../types';

export const EVENTS: GameEvent[] = [
  {
    id: 'ddos-1',
    type: 'ddos-attack',
    name: 'DDoS Attack',
    description: 'Hackers target your servers with a distributed denial of service attack.',
    effect: {
      mauChange: -500,
      ratingChange: -0.3,
      resourceChanges: { techDebt: 1 }, // Emergency patches add debt
      special: 'Users cant access your app',
    },
    mitigation: {
      condition: 'Server capacity > 20',
      reducedEffect: {
        mauChange: -100,
        ratingChange: -0.1,
        special: 'Your robust infrastructure absorbed most of the attack',
      },
    },
  },
  {
    id: 'supply-chain-1',
    type: 'supply-chain-issues',
    name: 'Cloud Provider Outage',
    description: 'Your cloud provider experiences issues. Emergency workarounds add technical debt.',
    effect: {
      resourceChanges: { techDebt: 2 }, // Workarounds add significant debt
      special: 'Cannot use Upgrade Servers action this round',
    },
    mitigation: {
      condition: 'Server capacity > 15',
      reducedEffect: {
        resourceChanges: { techDebt: 1 }, // Still some workaround debt
        special: 'Your buffer capacity keeps you running smoothly',
      },
    },
  },
  {
    id: 'viral-1',
    type: 'viral-moment',
    name: 'Viral Moment',
    description: 'An influencer posts about your app! Massive traffic incoming.',
    effect: {
      mauChange: 2000,
      special: 'If MAU > Server Capacity * 100, crash: lose half the new users and -0.5 rating',
    },
    mitigation: {
      condition: 'Server capacity sufficient for surge',
      reducedEffect: {
        mauChange: 2000,
        ratingChange: 0.2,
        special: 'Your infrastructure handled the surge beautifully!',
      },
    },
  },
  {
    id: 'security-1',
    type: 'security-breach',
    name: 'Data Breach',
    description: 'Hackers exploited a vulnerability. User data may be compromised.',
    effect: {
      ratingChange: -0.5,
      revenueChange: -200,
      resourceChanges: { techDebt: 2 }, // Emergency security patches
      special: 'Bad press and potential lawsuits',
    },
    mitigation: {
      condition: 'Tech debt < 4',
      reducedEffect: {
        ratingChange: -0.1,
        revenueChange: -50,
        special: 'Clean code meant quick patch and limited exposure',
      },
    },
  },
  {
    id: 'competitor-1',
    type: 'competitor-launch',
    name: 'Competitor Launch',
    description: 'A well-funded competitor enters your market. Rushed feature matching adds debt.',
    effect: {
      mauChange: -300,
      resourceChanges: { techDebt: 1 }, // Rushed competitive features
      special: 'Users checking out the competition',
    },
    mitigation: {
      condition: 'Rating > 4.0',
      reducedEffect: {
        mauChange: -50,
        special: 'Your loyal users stick with you',
      },
    },
  },
  {
    id: 'ddos-2',
    type: 'ddos-attack',
    name: 'Botnet Swarm',
    description: 'A sophisticated botnet targets your API endpoints.',
    effect: {
      mauChange: -400,
      ratingChange: -0.2,
      resourceChanges: { money: -10, techDebt: 1 }, // Emergency patches add debt
      special: 'Emergency mitigation costs extra',
    },
    mitigation: {
      condition: 'Server capacity > 25',
      reducedEffect: {
        mauChange: -50,
        special: 'Rate limiting kicked in automatically',
      },
    },
  },
  {
    id: 'viral-2',
    type: 'viral-moment',
    name: 'Product Hunt Launch',
    description: 'Your app hits #1 on Product Hunt! Prepare for the hug of death.',
    effect: {
      mauChange: 1500,
      revenueChange: 100,
      special: 'Server crash risk if unprepared',
    },
    mitigation: {
      condition: 'Server capacity sufficient',
      reducedEffect: {
        mauChange: 1500,
        revenueChange: 200,
        ratingChange: 0.3,
        special: 'Flawless launch day!',
      },
    },
  },
  {
    id: 'security-2',
    type: 'security-breach',
    name: 'Dependency Vulnerability',
    description: 'Critical CVE discovered in a core dependency.',
    effect: {
      ratingChange: -0.3,
      resourceChanges: { techDebt: 3 }, // Increased from 2 to 3
      special: 'Emergency patching adds significant debt',
    },
    mitigation: {
      condition: 'Tech debt < 3',
      reducedEffect: {
        resourceChanges: { techDebt: 1 },
        special: 'Your clean codebase made patching straightforward',
      },
    },
  },
];

export function createEventDeck(): GameEvent[] {
  // Shuffle and return a copy
  const deck = [...EVENTS];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export function checkMitigation(
  event: GameEvent,
  resources: Resources,
  metrics: PlayerMetrics
): boolean {
  const condition = event.mitigation.condition.toLowerCase();

  if (condition.includes('server capacity >')) {
    const threshold = parseInt(condition.match(/\d+/)?.[0] || '0');
    return resources.serverCapacity > threshold;
  }

  if (condition.includes('tech debt <')) {
    const threshold = parseInt(condition.match(/\d+/)?.[0] || '0');
    return resources.techDebt < threshold;
  }

  if (condition.includes('rating >')) {
    const threshold = parseFloat(condition.match(/[\d.]+/)?.[0] || '0');
    return metrics.rating > threshold;
  }

  if (condition.includes('server capacity sufficient')) {
    // Check if server capacity can handle potential surge
    return resources.serverCapacity * 100 > metrics.mau + 2000;
  }

  return false;
}
