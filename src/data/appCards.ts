import type { AppCard, TokenColor } from '../types';

// Shorthand for pattern building
const G: TokenColor = 'green';
const O: TokenColor = 'orange';
const B: TokenColor = 'blue';
const P: TokenColor = 'purple';
const _: null = null;

export const APP_CARDS: AppCard[] = [
  // === SMALL APPS ===
  {
    id: 'weather-now',
    name: 'WeatherNow',
    client: 'Weather App',
    tier: 'small',
    footprint: { rows: 2, cols: 2 },
    pattern: [
      [G, G],
      [O, P],
    ],
    tokenCount: 4,
    maxVP: 2,
    maxMoney: 1,
    starThresholds: [1, 2, 3, 3, 4],
  },
  {
    id: 'fittrack-health',
    name: 'FitTrack Health',
    client: 'Fitness Tracking App',
    tier: 'small',
    footprint: { rows: 2, cols: 3 },
    pattern: [
      [G, _, G],
      [O, B, P],
    ],
    tokenCount: 5,
    maxVP: 2,
    maxMoney: 1,
    starThresholds: [1, 2, 3, 4, 5],
  },
  {
    id: 'travel-buddy',
    name: 'TravelBuddy',
    client: 'Travel Booking App',
    tier: 'small',
    footprint: { rows: 2, cols: 3 },
    pattern: [
      [G, G, G],
      [O, B, P],
    ],
    tokenCount: 6,
    maxVP: 3,
    maxMoney: 2,
    starThresholds: [2, 3, 4, 5, 6],
  },

  // === MEDIUM APPS ===
  {
    id: 'mcburger-mobile',
    name: 'McBurger Mobile',
    client: 'Fast Food Ordering App',
    tier: 'medium',
    footprint: { rows: 3, cols: 4 },
    pattern: [
      [G, _, _, G],
      [G, G, G, G],
      [_, O, _, P],
    ],
    tokenCount: 8,
    maxVP: 5,
    maxMoney: 4,
    starThresholds: [2, 4, 6, 7, 8],
  },
  {
    id: 'snapshare-social',
    name: 'SnapShare Social',
    client: 'Social Media App',
    tier: 'medium',
    footprint: { rows: 3, cols: 3 },
    pattern: [
      [G, G, G],
      [O, B, O],
      [G, G, P],
    ],
    tokenCount: 9,
    maxVP: 5,
    maxMoney: 4,
    starThresholds: [3, 5, 7, 8, 9],
  },
  {
    id: 'edulearn-platform',
    name: 'EduLearn Platform',
    client: 'Educational App',
    tier: 'medium',
    footprint: { rows: 3, cols: 3 },
    pattern: [
      [G, O, G],
      [B, _, B],
      [G, O, P],
    ],
    tokenCount: 8,
    maxVP: 4,
    maxMoney: 3,
    starThresholds: [2, 4, 6, 7, 8],
  },
  {
    id: 'delivernow-logistics',
    name: 'DeliverNow Logistics',
    client: 'Delivery App',
    tier: 'medium',
    footprint: { rows: 3, cols: 3 },
    pattern: [
      [P, O, P],
      [B, G, B],
      [P, O, G],
    ],
    tokenCount: 9,
    maxVP: 5,
    maxMoney: 4,
    starThresholds: [3, 5, 7, 8, 9],
  },

  // === LARGE APPS ===
  {
    id: 'securevault-banking',
    name: 'SecureVault Banking',
    client: 'Banking App',
    tier: 'large',
    footprint: { rows: 4, cols: 4 },
    pattern: [
      [_, O, O, _],
      [P, B, B, P],
      [O, G, G, O],
      [_, P, O, _],
    ],
    tokenCount: 12,
    maxVP: 8,
    maxMoney: 7,
    starThresholds: [4, 7, 9, 11, 12],
  },
  {
    id: 'gameforge-arena',
    name: 'GameForge Arena',
    client: 'Mobile Game',
    tier: 'large',
    footprint: { rows: 4, cols: 4 },
    pattern: [
      [_, G, O, G],
      [B, B, B, O],
      [B, G, B, O],
      [P, P, G, _],
    ],
    tokenCount: 14,
    maxVP: 9,
    maxMoney: 7,
    starThresholds: [5, 8, 11, 13, 14],
  },
  {
    id: 'cloudsync-enterprise',
    name: 'CloudSync Enterprise',
    client: 'Enterprise SaaS',
    tier: 'large',
    footprint: { rows: 4, cols: 5 },
    pattern: [
      [_, O, B, O, _],
      [P, B, O, B, P],
      [P, O, B, O, P],
      [_, G, P, G, _],
    ],
    tokenCount: 16,
    maxVP: 9,
    maxMoney: 8,
    starThresholds: [5, 9, 12, 14, 16],
  },
];

export function getStarRating(card: AppCard, matchedTokens: number): number {
  for (let stars = 4; stars >= 0; stars--) {
    if (matchedTokens >= card.starThresholds[stars]) {
      return stars + 1;
    }
  }
  return 0;
}

export function createAppCardDeck(): AppCard[] {
  const deck = [...APP_CARDS];
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
