import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('AI Debt Generation - Buffer System', () => {
  it('has buffer and grid on player', () => {
    useGameStore.getState().initGame(2, 'sequential');
    const player = useGameStore.getState().players[0];
    expect(player.techDebtBuffer).toBeDefined();
    expect(player.codeGrid).toBeDefined();
  });
});
