import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('Pay Down Debt - Buffer System', () => {
  it('removes tokens from tech debt buffer', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = [...state.players];
    const player = { ...players[0] };
    player.techDebtBuffer = { ...player.techDebtBuffer, tokens: ['green', 'orange', 'blue'] };
    player.engineers = [{
      id: 'test-eng', name: 'Test', level: 'junior', power: 2,
      baseSalary: 5, playerId: player.id, salaryPaid: 5,
      assignedAction: 'pay-down-debt', hasAiAugmentation: false, roundsRetained: 1,
    } as any];
    player.plannedActions = [{
      actionType: 'pay-down-debt', engineerId: 'test-eng', useAiAugmentation: false,
    }];
    players[0] = player;
    useGameStore.setState({ players });

    useGameStore.getState().resolveActions();
    const updatedPlayer = useGameStore.getState().players[0];
    expect(updatedPlayer.techDebtBuffer.tokens.length).toBeLessThanOrEqual(1);
  });
});
