import type { TokenColor } from '../types';

export const TOKENS_PER_PLAYER = 5;

// Distribution weights (must sum to 100)
export const POOL_DISTRIBUTION: Record<TokenColor, number> = {
  green: 30,  // Frontend — most common
  orange: 25, // Backend
  purple: 25, // DevOps
  blue: 20,   // Full Stack — rarest
};

export function generateCodePool(playerCount: number): TokenColor[] {
  const totalTokens = playerCount * TOKENS_PER_PLAYER;
  const pool: TokenColor[] = [];

  // Generate tokens weighted by distribution
  const colors: TokenColor[] = ['green', 'orange', 'blue', 'purple'];
  for (let i = 0; i < totalTokens; i++) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    let chosen: TokenColor = 'green';
    for (const color of colors) {
      cumulative += POOL_DISTRIBUTION[color];
      if (roll < cumulative) {
        chosen = color;
        break;
      }
    }
    pool.push(chosen);
  }

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool;
}
