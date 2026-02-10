import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('Upgrade Servers - Grid Expansion', () => {
  it('expands grid from 4x4 to 4x5', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = [...state.players];
    const player = { ...players[0] };
    player.resources = { ...player.resources, money: 20 };
    player.engineers = [{
      id: 'test-eng', name: 'Test', level: 'senior', power: 4,
      baseSalary: 5, playerId: player.id, salaryPaid: 5,
      assignedAction: 'upgrade-servers', hasAiAugmentation: false, roundsRetained: 1,
    } as any];
    player.plannedActions = [{
      actionType: 'upgrade-servers', engineerId: 'test-eng', useAiAugmentation: false,
    }];
    players[0] = player;
    useGameStore.setState({ players });

    useGameStore.getState().resolveActions();
    const updatedPlayer = useGameStore.getState().players[0];
    expect(updatedPlayer.codeGrid.expansionLevel).toBe(1);
    expect(updatedPlayer.codeGrid.cells).toHaveLength(4);
    expect(updatedPlayer.codeGrid.cells[0]).toHaveLength(5);
  });
});
