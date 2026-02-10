import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';
import { TOKENS_PER_PLAYER } from '../../data/codePool';

describe('Round state grid initialization', () => {
  it('initializes shared code pool based on player count', () => {
    const store = useGameStore.getState();
    store.initGame(3, 'sequential');
    const state = useGameStore.getState();
    expect(state.roundState.codePool).toBeDefined();
    expect(state.roundState.codePool).toHaveLength(3 * TOKENS_PER_PLAYER);
  });

  it('initializes app market with 3 face-up cards', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    expect(state.roundState.appMarket).toBeDefined();
    expect(state.roundState.appMarket).toHaveLength(3);
  });

  it('initializes app card deck', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    expect(state.appCardDeck).toBeDefined();
    expect(state.appCardDeck.length).toBeGreaterThan(0);
  });
});
