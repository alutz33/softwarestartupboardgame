import { describe, it, expect } from 'vitest';
import { APP_CARDS, createAppCardDeck, getStarRating } from '../appCards';

describe('APP_CARDS', () => {
  it('has exactly 10 starter app cards', () => {
    expect(APP_CARDS).toHaveLength(10);
  });

  it('has 3 small, 4 medium, 3 large apps', () => {
    const small = APP_CARDS.filter(c => c.tier === 'small');
    const medium = APP_CARDS.filter(c => c.tier === 'medium');
    const large = APP_CARDS.filter(c => c.tier === 'large');
    expect(small).toHaveLength(3);
    expect(medium).toHaveLength(4);
    expect(large).toHaveLength(3);
  });

  it('each card has a valid pattern matching its footprint', () => {
    for (const card of APP_CARDS) {
      expect(card.pattern).toHaveLength(card.footprint.rows);
      for (const row of card.pattern) {
        expect(row).toHaveLength(card.footprint.cols);
      }
    }
  });

  it('each card token count matches pattern non-null cells', () => {
    for (const card of APP_CARDS) {
      const tokenCount = card.pattern.flat().filter(c => c !== null).length;
      expect(tokenCount).toBe(card.tokenCount);
    }
  });

  it('each card has star thresholds from 1 to 5', () => {
    for (const card of APP_CARDS) {
      expect(card.starThresholds).toHaveLength(5);
      for (let i = 1; i < 5; i++) {
        expect(card.starThresholds[i]).toBeGreaterThanOrEqual(
          card.starThresholds[i - 1]
        );
      }
    }
  });
});

describe('getStarRating', () => {
  it('returns 5 stars for perfect match', () => {
    const card = APP_CARDS[0]; // WeatherNow: 4 tokens
    expect(getStarRating(card, card.tokenCount)).toBe(5);
  });

  it('returns 1 star for minimum match', () => {
    const card = APP_CARDS[0]; // WeatherNow
    expect(getStarRating(card, card.starThresholds[0])).toBe(1);
  });

  it('returns 0 stars below minimum threshold', () => {
    const card = APP_CARDS[0]; // WeatherNow
    expect(getStarRating(card, 0)).toBe(0);
  });
});

describe('createAppCardDeck', () => {
  it('returns a shuffled copy of all cards', () => {
    const deck = createAppCardDeck();
    expect(deck).toHaveLength(APP_CARDS.length);
    const deckIds = deck.map(c => c.id).sort();
    const sourceIds = APP_CARDS.map(c => c.id).sort();
    expect(deckIds).toEqual(sourceIds);
  });
});
