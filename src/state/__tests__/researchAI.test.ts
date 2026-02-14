import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('Research AI - Graduated Levels', () => {
  it('advances AI research level from 0 to 1', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = [...state.players];
    const player = { ...players[0] };
    player.resources = { ...player.resources, money: 20 };
    player.aiResearchLevel = 0;
    player.engineers = [{
      id: 'test-eng', name: 'Test', level: 'senior', power: 4,
      baseSalary: 5, playerId: player.id, salaryPaid: 5,
      assignedAction: 'research-ai', hasAiAugmentation: false, roundsRetained: 1,
    } as any];
    player.plannedActions = [{
      actionType: 'research-ai', engineerId: 'test-eng', useAiAugmentation: false,
    }];
    players[0] = player;
    useGameStore.setState({ players });

    useGameStore.getState().resolveActions();
    const updatedPlayer = useGameStore.getState().players[0];
    expect(updatedPlayer.aiResearchLevel).toBe(1);
  });

  it('does not exceed level 2', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = [...state.players];
    const player = { ...players[0] };
    player.resources = { ...player.resources, money: 20 };
    player.aiResearchLevel = 2;
    player.engineers = [{
      id: 'test-eng', name: 'Test', level: 'senior', power: 4,
      baseSalary: 5, playerId: player.id, salaryPaid: 5,
      assignedAction: 'research-ai', hasAiAugmentation: false, roundsRetained: 1,
    } as any];
    player.plannedActions = [{
      actionType: 'research-ai', engineerId: 'test-eng', useAiAugmentation: false,
    }];
    players[0] = player;
    useGameStore.setState({ players });

    useGameStore.getState().resolveActions();
    const updatedPlayer = useGameStore.getState().players[0];
    expect(updatedPlayer.aiResearchLevel).toBe(2);
  });
});
