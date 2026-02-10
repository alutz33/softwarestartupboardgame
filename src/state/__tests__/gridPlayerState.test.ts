import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('Player grid state initialization', () => {
  it('initializes player with empty 4x4 grid', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    const player = state.players[0];
    expect(player.codeGrid).toBeDefined();
    expect(player.codeGrid.cells).toHaveLength(4);
    expect(player.codeGrid.cells[0]).toHaveLength(4);
    expect(player.codeGrid.expansionLevel).toBe(0);
  });

  it('initializes player with empty tech debt buffer', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    const player = state.players[0];
    expect(player.techDebtBuffer).toBeDefined();
    expect(player.techDebtBuffer.tokens).toEqual([]);
    expect(player.techDebtBuffer.maxSize).toBe(4);
  });

  it('initializes player with AI research level 0', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    const player = state.players[0];
    expect(player.aiResearchLevel).toBe(0);
  });

  it('initializes player with empty published apps', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    const player = state.players[0];
    expect(player.publishedApps).toEqual([]);
  });

  it('initializes player with empty held app cards', () => {
    const store = useGameStore.getState();
    store.initGame(2, 'sequential');
    const state = useGameStore.getState();
    const player = state.players[0];
    expect(player.heldAppCards).toEqual([]);
  });
});
