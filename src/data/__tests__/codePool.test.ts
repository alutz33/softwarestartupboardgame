import { describe, it, expect } from 'vitest';
import { generateCodePool, POOL_DISTRIBUTION, TOKENS_PER_PLAYER } from '../codePool';
import type { TokenColor } from '../../types';

describe('POOL_DISTRIBUTION', () => {
  it('sums to 100%', () => {
    const total = Object.values(POOL_DISTRIBUTION).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });
});

describe('generateCodePool', () => {
  it('generates correct number of tokens for 2 players', () => {
    const pool = generateCodePool(2);
    expect(pool).toHaveLength(2 * TOKENS_PER_PLAYER);
  });

  it('generates correct number for 4 players', () => {
    const pool = generateCodePool(4);
    expect(pool).toHaveLength(4 * TOKENS_PER_PLAYER);
  });

  it('only contains valid token colors', () => {
    const pool = generateCodePool(3);
    const validColors: TokenColor[] = ['green', 'orange', 'blue', 'purple'];
    for (const token of pool) {
      expect(validColors).toContain(token);
    }
  });

  it('has roughly correct distribution over many samples', () => {
    // Generate a large pool to check distribution
    const pool = generateCodePool(20); // 100 tokens
    const counts: Record<TokenColor, number> = { green: 0, orange: 0, blue: 0, purple: 0 };
    for (const token of pool) {
      counts[token]++;
    }
    // Green should be most common (~30%), blue least (~20%)
    expect(counts.green).toBeGreaterThan(counts.blue);
  });
});
