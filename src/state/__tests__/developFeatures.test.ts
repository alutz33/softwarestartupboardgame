import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('Develop Features - Grid System', () => {
  it('pool exists and has tokens after game init', () => {
    useGameStore.getState().initGame(2, 'sequential');
    const state = useGameStore.getState();
    expect(state.roundState.codePool.length).toBeGreaterThan(0);
  });
});
