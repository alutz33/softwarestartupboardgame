import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('calculateWinner - grid scoring', () => {
  it('includes published app VP in final score', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = state.players.map((p, i) => {
      if (i === 0) {
        return {
          ...p,
          publishedApps: [
            { cardId: 'test1', name: 'Test App 1', stars: 5, vpEarned: 3, moneyEarned: 2 },
            { cardId: 'test2', name: 'Test App 2', stars: 3, vpEarned: 1, moneyEarned: 1 },
          ],
        };
      }
      return {
        ...p,
        publishedApps: [],
      };
    });
    useGameStore.setState({ players });

    useGameStore.getState().calculateWinner();

    const result = useGameStore.getState();
    const p1Score = result.finalScores?.get(result.players[0].id) || 0;
    const p2Score = result.finalScores?.get(result.players[1].id) || 0;
    // Player 1 should have higher score due to published app VP (3 + 1 = 4 extra)
    expect(p1Score).toBeGreaterThan(p2Score);
  });

  it('sums VP from multiple published apps', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = state.players.map((p, i) => {
      if (i === 0) {
        return {
          ...p,
          publishedApps: [
            { cardId: 'a1', name: 'App A', stars: 5, vpEarned: 5, moneyEarned: 3 },
            { cardId: 'a2', name: 'App B', stars: 4, vpEarned: 3, moneyEarned: 2 },
            { cardId: 'a3', name: 'App C', stars: 2, vpEarned: 1, moneyEarned: 0 },
          ],
        };
      }
      if (i === 1) {
        return {
          ...p,
          publishedApps: [
            { cardId: 'b1', name: 'App D', stars: 3, vpEarned: 2, moneyEarned: 1 },
          ],
        };
      }
      return p;
    });
    useGameStore.setState({ players });

    useGameStore.getState().calculateWinner();

    const result = useGameStore.getState();
    const p1Score = result.finalScores?.get(result.players[0].id) || 0;
    const p2Score = result.finalScores?.get(result.players[1].id) || 0;
    // Player 1: 5+3+1 = 9 grid VP, Player 2: 2 grid VP
    // Difference should be at least 7 (the grid VP difference)
    expect(p1Score - p2Score).toBeGreaterThanOrEqual(7);
  });

  it('still works when no apps are published', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const players = state.players.map((p) => ({
      ...p,
      publishedApps: [],
    }));
    useGameStore.setState({ players });

    useGameStore.getState().calculateWinner();

    const result = useGameStore.getState();
    expect(result.finalScores).toBeDefined();
    // Both players should have equal scores (same starting conditions, no apps)
    const p1Score = result.finalScores?.get(result.players[0].id) || 0;
    const p2Score = result.finalScores?.get(result.players[1].id) || 0;
    expect(p1Score).toBe(p2Score);
  });
});
