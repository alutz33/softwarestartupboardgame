import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('commitCode - Agency Style', () => {
  it('removes 1 token of choice from grid', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const playerId = state.players[0].id;

    const players = state.players.map((p, i) => {
      if (i !== 0) return p;
      const newCells = p.codeGrid.cells.map(r => [...r]);
      newCells[2][2] = 'orange';
      return {
        ...p,
        corporationStyle: 'agency' as const,
        commitCodeUsedThisRound: false,
        codeGrid: { ...p.codeGrid, cells: newCells },
      };
    });
    useGameStore.setState({ players });

    useGameStore.getState().commitCode(playerId, 2, 2);

    const player = useGameStore.getState().players[0];
    expect(player.codeGrid.cells[2][2]).toBeNull();
    expect(player.commitCodeUsedThisRound).toBe(true);
  });

  it('cannot commit twice in same round', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const playerId = state.players[0].id;

    const players = state.players.map((p, i) => {
      if (i !== 0) return p;
      const newCells = p.codeGrid.cells.map(r => [...r]);
      newCells[0][0] = 'green';
      return {
        ...p,
        corporationStyle: 'agency' as const,
        commitCodeUsedThisRound: true,
        codeGrid: { ...p.codeGrid, cells: newCells },
      };
    });
    useGameStore.setState({ players });

    useGameStore.getState().commitCode(playerId, 0, 0);

    const player = useGameStore.getState().players[0];
    expect(player.codeGrid.cells[0][0]).toBe('green');
  });
});

describe('commitCode - Product Style', () => {
  it('clears 3 same-color tokens in a row and gives $1', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const playerId = state.players[0].id;

    const players = state.players.map((p, i) => {
      if (i !== 0) return p;
      const newCells = p.codeGrid.cells.map(r => [...r]);
      newCells[1][0] = 'green';
      newCells[1][1] = 'green';
      newCells[1][2] = 'green';
      return {
        ...p,
        corporationStyle: 'product' as const,
        commitCodeUsedThisRound: false,
        resources: { ...p.resources, money: 0 },
        codeGrid: { ...p.codeGrid, cells: newCells },
      };
    });
    useGameStore.setState({ players });

    useGameStore.getState().commitCode(playerId, 1, 0, 'row', 3);

    const player = useGameStore.getState().players[0];
    expect(player.codeGrid.cells[1][0]).toBeNull();
    expect(player.codeGrid.cells[1][1]).toBeNull();
    expect(player.codeGrid.cells[1][2]).toBeNull();
    expect(player.resources.money).toBe(1);
    expect(player.commitCodeUsedThisRound).toBe(true);
  });
});
