import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';
import { APP_CARDS } from '../../data/appCards';

describe('publishApp', () => {
  it('scores VP and money based on star rating', () => {
    useGameStore.getState().initGame(2, 'sequential');

    // Set up player with a held card and matching grid pattern
    const state = useGameStore.getState();
    const playerId = state.players[0].id;
    const weatherNow = APP_CARDS.find(c => c.id === 'weather-now')!;

    // Manually set state
    const players = state.players.map((p, i) => {
      if (i !== 0) return p;
      return {
        ...p,
        heldAppCards: [weatherNow],
        codeGrid: {
          ...p.codeGrid,
          cells: p.codeGrid.cells.map((row, r) =>
            row.map((cell, c) => {
              if (r === 0 && c === 0) return 'green' as const;
              if (r === 0 && c === 1) return 'green' as const;
              if (r === 1 && c === 0) return 'orange' as const;
              if (r === 1 && c === 1) return 'purple' as const;
              return cell;
            })
          ),
        },
      };
    });
    useGameStore.setState({ players });

    useGameStore.getState().publishApp(playerId, 'weather-now', 0, 0);

    const player = useGameStore.getState().players[0];
    expect(player.publishedApps).toHaveLength(1);
    expect(player.publishedApps[0].stars).toBe(5);
    expect(player.publishedApps[0].vpEarned).toBe(2);
    expect(player.publishedApps[0].moneyEarned).toBe(1);
    expect(player.codeGrid.cells[0][0]).toBeNull();
    expect(player.codeGrid.cells[0][1]).toBeNull();
    expect(player.heldAppCards).toHaveLength(0);
  });

  it('scores partial stars for incomplete pattern', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const playerId = state.players[0].id;
    const weatherNow = APP_CARDS.find(c => c.id === 'weather-now')!;

    const players = state.players.map((p, i) => {
      if (i !== 0) return p;
      return {
        ...p,
        heldAppCards: [weatherNow],
        codeGrid: {
          ...p.codeGrid,
          cells: p.codeGrid.cells.map((row, r) =>
            row.map((cell, c) => {
              if (r === 0 && c === 0) return 'green' as const;
              if (r === 0 && c === 1) return 'green' as const;
              if (r === 1 && c === 0) return 'blue' as const;
              if (r === 1 && c === 1) return 'blue' as const;
              return cell;
            })
          ),
        },
      };
    });
    useGameStore.setState({ players });

    useGameStore.getState().publishApp(playerId, 'weather-now', 0, 0);

    const player = useGameStore.getState().players[0];
    // 2 of 4 tokens matched (green, green). Thresholds [1,2,3,3,4] -> 2 stars
    expect(player.publishedApps[0].stars).toBe(2);
    expect(player.codeGrid.cells[1][0]).toBe('blue');
    expect(player.codeGrid.cells[1][1]).toBe('blue');
  });
});
