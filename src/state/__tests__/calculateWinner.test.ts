import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';

describe('calculateWinner - dual scoring', () => {
  it('agency scores VP from published apps', () => {
    useGameStore.getState().initGame(2, 'sequential');
    const state = useGameStore.getState();
    const players = state.players.map((p, i) => {
      if (i === 0) {
        return {
          ...p,
          corporationStyle: 'agency' as const,
          publishedApps: [
            { cardId: 't1', name: 'App1', stars: 5, vpEarned: 3, moneyEarned: 2 },
            { cardId: 't2', name: 'App2', stars: 3, vpEarned: 1, moneyEarned: 1 },
          ],
          resources: { ...p.resources, money: 20 }, // +2 VP from money
        };
      }
      return {
        ...p,
        corporationStyle: 'agency' as const,
        publishedApps: [],
        resources: { ...p.resources, money: 0 },
      };
    });
    useGameStore.setState({ players });
    useGameStore.getState().calculateWinner();
    const result = useGameStore.getState();
    const p1Score = result.finalScores?.get(result.players[0].id) || 0;
    const p2Score = result.finalScores?.get(result.players[1].id) || 0;
    // P1: 3+1 VP from apps + 2 VP from money = 6
    expect(p1Score).toBe(6);
    expect(p2Score).toBe(0);
  });

  it('product scores VP from MAU milestones and committed code', () => {
    useGameStore.getState().initGame(2, 'sequential');
    const state = useGameStore.getState();
    const players = state.players.map((p, i) => {
      if (i === 0) {
        return {
          ...p,
          corporationStyle: 'product' as const,
          metrics: { ...p.metrics, mau: 3000 }, // past 1k (1VP) and 2.5k (2VP) milestones
          committedCodeCount: 5, // floor(5/2) = 2 VP
          resources: { ...p.resources, money: 10 }, // +1 VP from money
        };
      }
      return {
        ...p,
        corporationStyle: 'product' as const,
        metrics: { ...p.metrics, mau: 0 },
        committedCodeCount: 0,
        resources: { ...p.resources, money: 0 },
      };
    });
    useGameStore.setState({ players });
    useGameStore.getState().calculateWinner();
    const result = useGameStore.getState();
    const p1Score = result.finalScores?.get(result.players[0].id) || 0;
    // P1: 1+2 from milestones + 2 from code + 1 from money = 6
    expect(p1Score).toBe(6);
  });
});
