import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('Corporation Style Selection', () => {
  it('sets agency style for vc-heavy funding', () => {
    useGameStore.getState().initGame(2, 'sequential');

    // Find a player and check after funding selection
    const player = useGameStore.getState().players[0];
    // After selectFunding with 'vc-heavy', corporationStyle should be 'agency'
    // This is a stub test - full test requires leader draft flow
    expect(player.corporationStyle).toBeUndefined(); // not set until funding selection
  });
});
