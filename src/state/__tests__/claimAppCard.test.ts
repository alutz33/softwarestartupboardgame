import { describe, it, expect } from 'vitest';
import { useGameStore } from '../gameStore';
import { APP_CARDS } from '../../data/appCards';

describe('claimAppCard', () => {
  it('moves card from market to player hand', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const playerId = state.players[0].id;

    useGameStore.setState({
      roundState: {
        ...state.roundState,
        appMarket: [APP_CARDS[0], APP_CARDS[1], APP_CARDS[2]],
      },
      appCardDeck: [APP_CARDS[3], APP_CARDS[4]],
    });

    useGameStore.getState().claimAppCard(playerId, APP_CARDS[0].id);

    const newState = useGameStore.getState();
    const player = newState.players[0];
    expect(player.heldAppCards).toHaveLength(1);
    expect(player.heldAppCards[0].id).toBe(APP_CARDS[0].id);
    expect(newState.roundState.appMarket).toHaveLength(3);
  });

  it('respects hand limit of 3', () => {
    useGameStore.getState().initGame(2, 'sequential');

    const state = useGameStore.getState();
    const playerId = state.players[0].id;

    const players = state.players.map((p, i) => {
      if (i !== 0) return p;
      return { ...p, heldAppCards: [APP_CARDS[0], APP_CARDS[1], APP_CARDS[2]] };
    });
    useGameStore.setState({
      players,
      roundState: {
        ...state.roundState,
        appMarket: [APP_CARDS[3], APP_CARDS[4], APP_CARDS[5]],
      },
    });

    useGameStore.getState().claimAppCard(playerId, APP_CARDS[3].id);

    const player = useGameStore.getState().players[0];
    expect(player.heldAppCards).toHaveLength(3);
  });
});
