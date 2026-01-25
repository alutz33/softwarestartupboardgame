import { create } from 'zustand';
import type {
  GameState,
  GamePhase,
  GameEvent,
  Player,
  CorporationStrategy,
  ActionType,
  Bid,
  CodeBlock,
  Milestone,
  ProductType,
  StartupCard,
} from '../types';
import {
  TOTAL_QUARTERS,
  AI_AUGMENTATION_TABLE,
  TECH_DEBT_LEVELS,
  MILESTONE_DEFINITIONS,
  getTechDebtLevel,
} from '../types';
import {
  FUNDING_OPTIONS,
  TECH_OPTIONS,
  PRODUCT_OPTIONS,
  getStartingResources,
  getStartingMetrics,
} from '../data/corporations';
import { generateEngineerPool, getSpecialtyBonus, generateIntern } from '../data/engineers';
import { createEventDeck, checkMitigation } from '../data/events';
import { getActionSpace, canAffordAction, getAvailableActions } from '../data/actions';
import { generatePuzzle, executePuzzleSolution, countBlocks } from '../data/puzzles';
import { createStartupDeck, dealStartupCards, hasAbility } from '../data/startups';

const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

// Helper function to check and claim milestones
function checkMilestones(
  milestones: Milestone[],
  players: Player[],
  currentRound: number
): Milestone[] {
  return milestones.map(milestone => {
    // Already claimed - don't change
    if (milestone.claimedBy) return milestone;

    // Check each player for milestone conditions
    for (const player of players) {
      let achieved = false;

      switch (milestone.id) {
        case 'first-5k-mau':
          achieved = player.metrics.mau >= 5000;
          break;
        case 'first-10k-mau':
          achieved = player.metrics.mau >= 10000;
          break;
        case 'first-5-rating':
          achieved = player.metrics.rating >= 5.0;
          break;
        case 'first-debt-free':
          // Must have had debt at some point (checked by having > 0 engineers or past round 1)
          achieved = player.resources.techDebt === 0 && currentRound > 1;
          break;
        case 'revenue-leader':
          achieved = player.metrics.revenue >= 1000;
          break;
      }

      if (achieved) {
        return {
          ...milestone,
          claimedBy: player.id,
          claimedRound: currentRound,
        };
      }
    }

    return milestone;
  });
}

interface GameStore extends GameState {
  // Setup actions
  initGame: (playerCount: number) => void;
  setPlayerName: (playerId: string, name: string) => void;
  selectStrategy: (playerId: string, strategy: CorporationStrategy) => void;
  playerReady: (playerId: string) => void;

  // Startup card draft actions
  selectStartupCard: (playerId: string, cardId: string) => void;
  getDealtCards: (playerId: string) => StartupCard[];
  isActionBlockedByDebt: (playerId: string, action: ActionType) => boolean;

  // Bidding actions
  submitBid: (playerId: string, engineerId: string, amount: number) => void;
  resolveBids: () => void;

  // Planning actions
  assignEngineer: (
    playerId: string,
    engineerId: string,
    action: ActionType,
    useAi: boolean
  ) => void;
  unassignEngineer: (playerId: string, engineerId: string) => void;
  lockPlan: (playerId: string) => void;
  revealPlans: () => void;

  // Puzzle actions
  startPuzzle: () => void;
  submitPuzzleSolution: (playerId: string, blocks: CodeBlock[], solveTime: number) => void;
  endPuzzle: () => void;

  // Resolution actions
  resolveActions: () => void;
  applyEvent: () => void;
  endRound: () => void;

  // End game
  calculateWinner: () => void;

  // Corporation powers
  usePivotPower: (playerId: string, newProductType: 'b2b' | 'consumer' | 'platform') => boolean;

  // Utility
  getCurrentPlayer: () => Player | undefined;
  getPlayer: (playerId: string) => Player | undefined;
  canAffordAction: (playerId: string, action: ActionType) => boolean;
  isActionAvailable: (playerId: string, action: ActionType) => boolean;
  getActionOccupancy: (action: ActionType) => { current: number; max: number | undefined; players: string[] };
  getMilestones: () => Milestone[];
  getDraftOrder: () => string[];
  getAvailableActionsForRound: () => ActionType[];
  getUpcomingEvent: () => GameEvent | undefined;
}

function createInitialPlayer(index: number): Player {
  return {
    id: `player-${index + 1}`,
    name: `Player ${index + 1}`,
    color: PLAYER_COLORS[index],
    isReady: false,
    resources: { money: 0, serverCapacity: 0, aiCapacity: 0, techDebt: 0 },
    metrics: { mau: 0, revenue: 0, rating: 3.0 },
    engineers: [],
    plannedActions: [],
    hasRecruiterBonus: false,
    synergiesUnlocked: [],
    // Corporation power tracking
    powerUsesRemaining: 1, // For powers like Pivot (1 use per game)
    hasPivoted: false,
    ipoBonusScore: 0,
  };
}

function createInitialMilestones(): Milestone[] {
  return MILESTONE_DEFINITIONS.map(def => ({
    id: def.id,
    name: def.name,
    description: def.description,
    bonus: def.bonus,
  }));
}

function createInitialState(): GameState {
  return {
    id: `game-${Date.now()}`,
    phase: 'setup',
    currentRound: 0,
    currentQuarter: 0, // Alias for currentRound
    players: [],
    currentPlayerIndex: 0,
    roundState: {
      roundNumber: 0,
      phase: 'setup',
      engineerPool: [],
      currentBids: new Map(),
      bidResults: [],
      occupiedActions: new Map(),
      draftOrder: [],
    },
    eventDeck: createEventDeck(),
    usedEvents: [],
    milestones: createInitialMilestones(),
    // Startup card draft
    startupDeck: [],
    dealtStartupCards: new Map(),
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  initGame: (playerCount: number) => {
    const players = Array.from({ length: playerCount }, (_, i) =>
      createInitialPlayer(i)
    );

    // Create and deal startup cards
    const startupDeck = createStartupDeck();
    const { dealtCards, remainingDeck } = dealStartupCards(startupDeck, playerCount, 2);

    set({
      ...createInitialState(),
      players,
      phase: 'startup-draft', // New phase instead of corporation-selection
      startupDeck: remainingDeck,
      dealtStartupCards: dealtCards,
    });
  },

  setPlayerName: (playerId: string, name: string) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, name } : p
      ),
    }));
  },

  selectStrategy: (playerId: string, strategy: CorporationStrategy) => {
    const funding = FUNDING_OPTIONS.find((f) => f.id === strategy.funding)!;
    const tech = TECH_OPTIONS.find((t) => t.id === strategy.tech)!;
    const product = PRODUCT_OPTIONS.find((p) => p.id === strategy.product)!;

    const resources = getStartingResources(funding, tech);
    const metrics = getStartingMetrics(product);

    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, strategy, resources, metrics }
          : p
      ),
    }));
  },

  selectStartupCard: (playerId: string, cardId: string) => {
    set((state) => {
      const dealtCards = state.dealtStartupCards.get(playerId) || [];
      const selectedCard = dealtCards.find(c => c.id === cardId);

      if (!selectedCard) return state;

      // Get the funding, tech, and product options for starting resources
      const funding = FUNDING_OPTIONS.find(f => f.id === selectedCard.funding)!;
      const tech = TECH_OPTIONS.find(t => t.id === selectedCard.tech)!;
      const product = PRODUCT_OPTIONS.find(p => p.id === selectedCard.product)!;

      // Calculate starting resources with card overrides
      const baseResources = getStartingResources(funding, tech);
      const baseMetrics = getStartingMetrics(product);

      const resources = {
        money: selectedCard.startingMoney ?? baseResources.money,
        serverCapacity: baseResources.serverCapacity,
        aiCapacity: selectedCard.startingAiCapacity ?? baseResources.aiCapacity,
        techDebt: selectedCard.startingTechDebt ?? baseResources.techDebt,
      };

      const metrics = {
        mau: selectedCard.startingMau ?? baseMetrics.mau,
        revenue: baseMetrics.revenue,
        rating: baseMetrics.rating,
      };

      // Create strategy from card
      const strategy: CorporationStrategy = {
        funding: selectedCard.funding,
        tech: selectedCard.tech,
        product: selectedCard.product,
      };

      // Update player with selection
      const updatedPlayers = state.players.map((p) => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          strategy,
          startupCard: selectedCard,
          resources,
          metrics,
          isReady: true,
          // Set power uses based on ability
          powerUsesRemaining: selectedCard.ability?.type === 'pivot' ? 1 : 0,
        };
      });

      // Check if all players have selected
      const allSelected = updatedPlayers.every(p => p.startupCard);

      if (allSelected) {
        // Transition to engineer draft
        let engineerPool = generateEngineerPool(
          1,
          updatedPlayers.length,
          updatedPlayers.map((p) => p.hasRecruiterBonus)
        );

        // INSIDER INFO ability: Add 2 extra engineers for players with this ability
        const insiderInfoCount = updatedPlayers.filter(p => hasAbility(p, 'insider-info')).length;
        if (insiderInfoCount > 0) {
          const extraEngineers = generateEngineerPool(1, insiderInfoCount, []);
          engineerPool = [...engineerPool, ...extraEngineers.slice(0, insiderInfoCount * 2)];
        }

        // EVENT FORECASTING: Peek at first quarter's event
        const eventDeck = [...state.eventDeck];
        const upcomingEvent = eventDeck.length > 0 ? eventDeck[eventDeck.length - 1] : undefined;

        // Initial draft order is random (all start at similar MAU)
        const draftOrder = updatedPlayers.map(p => p.id);

        return {
          players: updatedPlayers,
          phase: 'engineer-draft' as GamePhase,
          currentRound: 1,
          currentQuarter: 1,
          roundState: {
            roundNumber: 1,
            phase: 'engineer-draft' as GamePhase,
            engineerPool,
            currentBids: new Map(),
            bidResults: [],
            occupiedActions: new Map(),
            draftOrder,
            upcomingEvent,
          },
        };
      }

      return { players: updatedPlayers };
    });
  },

  getDealtCards: (playerId: string) => {
    return get().dealtStartupCards.get(playerId) || [];
  },

  isActionBlockedByDebt: (playerId: string, action: ActionType) => {
    const player = get().players.find(p => p.id === playerId);
    if (!player) return false;

    const debtLevel = getTechDebtLevel(player.resources.techDebt);
    return debtLevel.blocksDevelopment &&
      (action === 'develop-features' || action === 'optimize-code');
  },

  playerReady: (playerId: string) => {
    set((state) => {
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, isReady: true } : p
      );

      // Check if all players are ready
      const allReady = players.every((p) => p.isReady && p.strategy);

      if (allReady) {
        // Start the game (legacy path - used if players skip startup draft)
        let engineerPool = generateEngineerPool(
          1,
          players.length,
          players.map((p) => p.hasRecruiterBonus)
        );

        // INSIDER INFO ability: Add 2 extra engineers for players with this ability
        const insiderInfoCount = players.filter(p => hasAbility(p, 'insider-info')).length;
        if (insiderInfoCount > 0) {
          const extraEngineers = generateEngineerPool(1, insiderInfoCount, []);
          engineerPool = [...engineerPool, ...extraEngineers.slice(0, insiderInfoCount * 2)];
        }

        // EVENT FORECASTING: Peek at first round's event
        const eventDeck = [...state.eventDeck];
        const upcomingEvent = eventDeck.length > 0 ? eventDeck[eventDeck.length - 1] : undefined;

        // Initial draft order is random (all start at 0 MAU)
        const draftOrder = players.map(p => p.id);

        return {
          players,
          phase: 'engineer-draft' as GamePhase,
          currentRound: 1,
          roundState: {
            roundNumber: 1,
            phase: 'engineer-draft' as GamePhase,
            engineerPool,
            currentBids: new Map(),
            bidResults: [],
            occupiedActions: new Map(),
            draftOrder,
            upcomingEvent,
          },
        };
      }

      return { players };
    });
  },

  submitBid: (playerId: string, engineerId: string, amount: number) => {
    set((state) => {
      const newBids = new Map(state.roundState.currentBids);
      newBids.set(`${playerId}-${engineerId}`, {
        playerId,
        amount,
        timestamp: Date.now(),
      });

      return {
        roundState: {
          ...state.roundState,
          currentBids: newBids,
        },
      };
    });
  },

  resolveBids: () => {
    set((state) => {
      const { engineerPool, currentBids } = state.roundState;
      const bidResults: typeof state.roundState.bidResults = [];
      const updatedPlayers = [...state.players];

      // Group bids by engineer
      const bidsByEngineer = new Map<string, Bid[]>();
      currentBids.forEach((bid, key) => {
        // Key format is "playerId-engineerId", e.g., "player-1-eng-3"
        // Engineer IDs start with "eng-" or "intern-", so find that prefix
        const engIndex = key.indexOf('eng-');
        const internIndex = key.indexOf('intern-');
        const engineerId = engIndex !== -1
          ? key.substring(engIndex)
          : internIndex !== -1
            ? key.substring(internIndex)
            : key.split('-').slice(1).join('-'); // fallback
        if (!bidsByEngineer.has(engineerId)) {
          bidsByEngineer.set(engineerId, []);
        }
        bidsByEngineer.get(engineerId)!.push(bid);
      });

      // Track which engineers are taken
      const playerWins = new Map<string, string>(); // playerId -> engineerId

      // Sort engineers by highest bid received
      const sortedEngineers = [...bidsByEngineer.entries()].sort((a, b) => {
        const maxA = Math.max(...a[1].map((bid) => bid.amount));
        const maxB = Math.max(...b[1].map((bid) => bid.amount));
        return maxB - maxA;
      });

      // Resolve bids in order of highest bid
      for (const [engineerId, bids] of sortedEngineers) {
        // Sort bids by amount (desc), then timestamp (asc) for ties
        const sortedBids = [...bids].sort((a, b) => {
          if (b.amount !== a.amount) return b.amount - a.amount;
          return a.timestamp - b.timestamp;
        });

        // Find winner (highest bidder who hasn't won yet)
        for (const bid of sortedBids) {
          if (!playerWins.has(bid.playerId)) {
            const player = updatedPlayers.find((p) => p.id === bid.playerId);
            if (player && player.resources.money >= bid.amount) {
              playerWins.set(bid.playerId, engineerId);

              // Deduct money and add engineer
              const engineer = engineerPool.find((e) => e.id === engineerId)!;
              const playerIndex = updatedPlayers.findIndex(
                (p) => p.id === bid.playerId
              );

              // Apply Bootstrapped "Lean Team" power: 20% discount on hire costs
              let actualCost = bid.amount;
              if (player.strategy?.funding === 'bootstrapped') {
                actualCost = Math.round(bid.amount * 0.8);
              }

              updatedPlayers[playerIndex] = {
                ...player,
                resources: {
                  ...player.resources,
                  money: player.resources.money - actualCost,
                },
                engineers: [
                  ...player.engineers,
                  {
                    ...engineer,
                    playerId: bid.playerId,
                    salaryPaid: actualCost,
                    hasAiAugmentation: false,
                    roundsRetained: 1, // First round with this engineer
                  },
                ],
              };

              bidResults.push({
                engineerId,
                winningBid: bid,
                allBids: sortedBids,
              });

              break;
            }
          }
        }
      }

      // CS Intern Safety Net: Ensure every player has at least one engineer
      for (let i = 0; i < updatedPlayers.length; i++) {
        const player = updatedPlayers[i];

        if (player.engineers.length === 0) {
          const intern = generateIntern();
          let internCost = Math.min(5, player.resources.money); // Free if broke

          // Apply Bootstrapped "Lean Team" power: 20% discount
          if (player.strategy?.funding === 'bootstrapped') {
            internCost = Math.round(internCost * 0.8);
          }

          updatedPlayers[i] = {
            ...player,
            resources: {
              ...player.resources,
              money: player.resources.money - internCost,
            },
            engineers: [
              {
                ...intern,
                playerId: player.id,
                salaryPaid: internCost,
                hasAiAugmentation: false,
                roundsRetained: 1,
              },
            ],
          };
        }
      }

      // Reset isReady for all players before planning phase
      const playersWithReadyReset = updatedPlayers.map((p) => ({
        ...p,
        isReady: false,
      }));

      return {
        players: playersWithReadyReset,
        phase: 'planning' as GamePhase,
        roundState: {
          ...state.roundState,
          phase: 'planning' as GamePhase,
          bidResults,
          currentBids: new Map(),
          occupiedActions: new Map(), // Reset for new planning phase
        },
      };
    });
  },

  assignEngineer: (
    playerId: string,
    engineerId: string,
    action: ActionType,
    useAi: boolean
  ) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      // Check if debt blocks this action
      const debtLevel = getTechDebtLevel(player.resources.techDebt);
      if (debtLevel.blocksDevelopment &&
          (action === 'develop-features' || action === 'optimize-code')) {
        return state; // Block assignment - debt too high
      }

      const actionSpace = getActionSpace(action);
      const occupied = state.roundState.occupiedActions.get(action) || [];

      // Check if we're reassigning the same engineer (allow that)
      const existingAssignment = player.plannedActions.find(
        a => a.engineerId === engineerId
      );
      const isReassigning = existingAssignment?.actionType === action;

      if (!isReassigning && actionSpace.maxWorkers !== undefined) {
        // Count total players occupying this action (not engineers, but players)
        const playersOnAction = new Set(occupied);

        // If this player isn't already on this action, check if there's room
        if (!playersOnAction.has(playerId) && playersOnAction.size >= actionSpace.maxWorkers) {
          // Action space is full - can't assign
          return state;
        }
      }

      // Check if player can afford AI augmentation
      if (useAi && player.resources.aiCapacity <= 0) {
        useAi = false;
      }

      // Update occupied actions map
      const newOccupiedActions = new Map(state.roundState.occupiedActions);
      if (!isReassigning && !occupied.includes(playerId)) {
        newOccupiedActions.set(action, [...occupied, playerId]);
      }

      // If moving from a different action, remove from old action's occupancy
      if (existingAssignment && existingAssignment.actionType !== action) {
        const oldActionOccupied = newOccupiedActions.get(existingAssignment.actionType) || [];
        // Only remove if player has no other engineers on that action
        const otherEngineersOnOldAction = player.plannedActions.filter(
          a => a.actionType === existingAssignment.actionType && a.engineerId !== engineerId
        ).length;
        if (otherEngineersOnOldAction === 0) {
          newOccupiedActions.set(
            existingAssignment.actionType,
            oldActionOccupied.filter(id => id !== playerId)
          );
        }
      }

      const updatedPlayers = state.players.map((p) => {
        if (p.id !== playerId) return p;

        const updatedEngineers = p.engineers.map((e) =>
          e.id === engineerId
            ? { ...e, assignedAction: action, hasAiAugmentation: useAi }
            : e
        );

        const plannedAction = {
          actionType: action,
          engineerId,
          useAiAugmentation: useAi,
        };

        const existingIndex = p.plannedActions.findIndex(
          (a) => a.engineerId === engineerId
        );

        const plannedActions =
          existingIndex >= 0
            ? p.plannedActions.map((a, i) =>
                i === existingIndex ? plannedAction : a
              )
            : [...p.plannedActions, plannedAction];

        return {
          ...p,
          engineers: updatedEngineers,
          plannedActions,
        };
      });

      return {
        players: updatedPlayers,
        roundState: {
          ...state.roundState,
          occupiedActions: newOccupiedActions,
        },
      };
    });
  },

  unassignEngineer: (playerId: string, engineerId: string) => {
    set((state) => {
      const player = state.players.find((p) => p.id === playerId);
      if (!player) return state;

      // Find what action this engineer was on
      const assignment = player.plannedActions.find(a => a.engineerId === engineerId);

      // Update occupied actions - remove player if they have no other engineers on this action
      let newOccupiedActions = state.roundState.occupiedActions;
      if (assignment) {
        const otherEngineersOnAction = player.plannedActions.filter(
          a => a.actionType === assignment.actionType && a.engineerId !== engineerId
        ).length;

        if (otherEngineersOnAction === 0) {
          newOccupiedActions = new Map(state.roundState.occupiedActions);
          const occupied = newOccupiedActions.get(assignment.actionType) || [];
          newOccupiedActions.set(
            assignment.actionType,
            occupied.filter(id => id !== playerId)
          );
        }
      }

      return {
        players: state.players.map((p) => {
          if (p.id !== playerId) return p;

          return {
            ...p,
            engineers: p.engineers.map((e) =>
              e.id === engineerId
                ? { ...e, assignedAction: undefined, hasAiAugmentation: false }
                : e
            ),
            plannedActions: p.plannedActions.filter(
              (a) => a.engineerId !== engineerId
            ),
          };
        }),
        roundState: {
          ...state.roundState,
          occupiedActions: newOccupiedActions,
        },
      };
    });
  },

  lockPlan: (playerId: string) => {
    set((state) => {
      const players = state.players.map((p) =>
        p.id === playerId ? { ...p, isReady: true } : p
      );

      const allLocked = players.every((p) => p.isReady);

      return {
        players,
        phase: allLocked ? ('reveal' as GamePhase) : state.phase,
        roundState: {
          ...state.roundState,
          phase: allLocked ? ('reveal' as GamePhase) : state.roundState.phase,
        },
      };
    });
  },

  revealPlans: () => {
    // Check if any player has optimize action - if so, go to puzzle
    const state = get();
    const hasOptimize = state.players.some((p) =>
      p.plannedActions.some((a) => a.actionType === 'optimize-code')
    );

    set({
      phase: hasOptimize ? 'puzzle' : 'resolution',
      roundState: {
        ...state.roundState,
        phase: hasOptimize ? 'puzzle' : 'resolution',
      },
    });
  },

  startPuzzle: () => {
    const state = get();
    const puzzle = generatePuzzle(state.currentRound as 1 | 2 | 3 | 4);

    set({
      roundState: {
        ...state.roundState,
        currentPuzzle: puzzle,
        puzzleResults: {
          puzzleId: puzzle.id,
          solutions: [],
          bonusAwarded: {},
        },
      },
    });
  },

  submitPuzzleSolution: (playerId: string, blocks: CodeBlock[], solveTime: number) => {
    const state = get();
    const puzzle = state.roundState.currentPuzzle;
    if (!puzzle) return;

    const result = executePuzzleSolution(puzzle, blocks);
    const blockCount = countBlocks(blocks);

    set((state) => ({
      roundState: {
        ...state.roundState,
        puzzleResults: {
          ...state.roundState.puzzleResults!,
          solutions: [
            ...(state.roundState.puzzleResults?.solutions || []),
            {
              playerId,
              blocks,
              blockCount,
              solveTime,
              isCorrect: result.success,
            },
          ],
        },
      },
    }));
  },

  endPuzzle: () => {
    const state = get();
    const results = state.roundState.puzzleResults;
    if (!results) {
      set({ phase: 'resolution', roundState: { ...state.roundState, phase: 'resolution' } });
      return;
    }

    // Find winner - correct solution with fewest blocks, then fastest time
    const correctSolutions = results.solutions.filter((s) => s.isCorrect);
    if (correctSolutions.length > 0) {
      correctSolutions.sort((a, b) => {
        if (a.blockCount !== b.blockCount) return a.blockCount - b.blockCount;
        return a.solveTime - b.solveTime;
      });
      const winner = correctSolutions[0];

      // PUZZLE REWARD SCALING: Calculate bonus based on engineers assigned to optimize-code
      const winnerPlayer = state.players.find(p => p.id === winner.playerId);
      const engineersOnOptimize = winnerPlayer?.plannedActions.filter(
        a => a.actionType === 'optimize-code'
      ).length || 1;

      // Scaling: 1 eng = -1 debt, 2 eng = -2 debt, 3 eng = -3 debt + $10
      const techDebtReduction = Math.min(engineersOnOptimize, 3);
      const moneyBonus = engineersOnOptimize >= 3 ? 10 : 0;

      set((state) => ({
        phase: 'resolution',
        roundState: {
          ...state.roundState,
          phase: 'resolution',
          puzzleResults: {
            ...results,
            winnerId: winner.playerId,
            bonusAwarded: {
              techDebtReduction,
              extraRevenue: moneyBonus, // Use extraRevenue as money bonus
            },
          },
        },
      }));
    } else {
      set({
        phase: 'resolution',
        roundState: { ...state.roundState, phase: 'resolution' },
      });
    }
  },

  resolveActions: () => {
    set((state) => {
      let updatedPlayers = [...state.players];

      // Apply puzzle winner bonus (scaled by engineers assigned to optimize-code)
      const puzzleWinner = state.roundState.puzzleResults?.winnerId;
      if (puzzleWinner) {
        const bonus = state.roundState.puzzleResults!.bonusAwarded;
        updatedPlayers = updatedPlayers.map((p) => {
          if (p.id !== puzzleWinner) return p;
          return {
            ...p,
            resources: {
              ...p.resources,
              techDebt: Math.max(0, p.resources.techDebt - (bonus.techDebtReduction || 0)),
              money: p.resources.money + (bonus.extraRevenue || 0), // Bonus money for 3+ engineers
            },
          };
        });
      }

      // Resolve each player's actions
      for (let i = 0; i < updatedPlayers.length; i++) {
        const player = updatedPlayers[i];
        let newResources = { ...player.resources };
        let newMetrics = { ...player.metrics };
        let hasRecruiterBonus = player.hasRecruiterBonus;
        let ipoBonusScore = player.ipoBonusScore || 0;

        // Determine the last action for "night-owl" trait bonus
        const lastActionIndex = player.plannedActions.length - 1;

        for (let actionIndex = 0; actionIndex < player.plannedActions.length; actionIndex++) {
          const action = player.plannedActions[actionIndex];
          const engineer = player.engineers.find(
            (e) => e.id === action.engineerId
          );
          if (!engineer) continue;

          const actionSpace = getActionSpace(action.actionType);

          // Check for AI Skeptic trait - cannot use AI augmentation
          let useAi = action.useAiAugmentation;
          if (engineer.trait === 'ai-skeptic') {
            useAi = false;
          }

          // Calculate output multiplier
          const aiEntry = AI_AUGMENTATION_TABLE.find(
            (a) =>
              a.engineerLevel === engineer.level &&
              a.hasAi === useAi
          )!;

          const specialtyBonus = getSpecialtyBonus(
            engineer.specialty,
            action.actionType
          );

          // Base output multiplier
          let outputMultiplier =
            engineer.productivity * aiEntry.outputMultiplier * (1 + specialtyBonus);

          // ENGINEER TRAITS BONUSES
          // Equity-Hungry: +20% productivity if retained 2+ rounds
          if (engineer.trait === 'equity-hungry' && engineer.roundsRetained >= 2) {
            outputMultiplier *= 1.2;
          }

          // Night-Owl: +30% on last action assigned each round
          if (engineer.trait === 'night-owl' && actionIndex === lastActionIndex) {
            outputMultiplier *= 1.3;
          }

          // TECH DEBT EFFICIENCY PENALTY
          // Apply efficiency multiplier to output (except for pay-down-debt)
          const currentDebtLevel = getTechDebtLevel(newResources.techDebt);
          if (action.actionType !== 'pay-down-debt') {
            outputMultiplier *= currentDebtLevel.efficiencyMultiplier;
          }

          // Generate tech debt from AI usage
          if (useAi) {
            // Check for ai-first strategy bonus (50% less debt)
            const debtMultiplier = player.strategy?.tech === 'ai-first' ? 0.5 : 1;
            newResources.techDebt += Math.ceil(aiEntry.techDebtGenerated * debtMultiplier);
          }

          // Apply action effects
          switch (action.actionType) {
            case 'develop-features':
              newMetrics.mau += Math.round(
                (actionSpace.effect.mauChange || 0) * outputMultiplier
              );
              // Move-fast strategy bonus
              if (player.strategy?.tech === 'move-fast') {
                newMetrics.mau += 200;
              }
              break;

            case 'optimize-code':
              newResources.techDebt = Math.max(0, newResources.techDebt - 1);
              newMetrics.rating = Math.min(
                5,
                newMetrics.rating + (actionSpace.effect.ratingChange || 0)
              );
              break;

            case 'pay-down-debt':
              newResources.techDebt = Math.max(
                0,
                newResources.techDebt - Math.round(2 * outputMultiplier)
              );
              break;

            case 'upgrade-servers':
              if (newResources.money >= 10) {
                newResources.money -= 10;
                newResources.serverCapacity += Math.round(5 * outputMultiplier);
              }
              break;

            case 'research-ai':
              if (newResources.money >= 15) {
                newResources.money -= 15;
                newResources.aiCapacity += Math.round(2 * outputMultiplier);
              }
              break;

            case 'marketing': {
              // Check for marketing-discount ability (50% off)
              const marketingCost = hasAbility(player, 'marketing-discount') ? 10 : 20;
              if (newResources.money >= marketingCost) {
                newResources.money -= marketingCost;
                let mauGain = Math.round(
                  (actionSpace.effect.mauChange || 0) * outputMultiplier
                );
                // VC-Heavy bonus
                if (player.strategy?.funding === 'vc-heavy') {
                  mauGain = Math.round(mauGain * 1.5);
                }
                // Scale with rating
                mauGain = Math.round(mauGain * (newMetrics.rating / 3));
                newMetrics.mau += mauGain;
                newMetrics.rating = Math.min(
                  5,
                  newMetrics.rating + (actionSpace.effect.ratingChange || 0)
                );
              }
              break;
            }

            case 'monetization': {
              let revenue = Math.round(
                (actionSpace.effect.revenueChange || 0) * outputMultiplier
              );
              // Scale with MAU
              revenue = Math.round(revenue * (newMetrics.mau / 1000));
              // Apply revenue-boost ability (+20%)
              if (hasAbility(player, 'revenue-boost')) {
                revenue = Math.round(revenue * 1.2);
              }
              newMetrics.revenue += revenue;
              newMetrics.rating = Math.max(
                1,
                newMetrics.rating + (actionSpace.effect.ratingChange || 0)
              );
              break;
            }

            case 'hire-recruiter':
              if (newResources.money >= 25) {
                newResources.money -= 25;
                hasRecruiterBonus = true;
              }
              break;

            // ============================================
            // LATE-GAME ACTIONS (Round 3-4)
            // ============================================
            case 'go-viral':
              if (newResources.money >= 15 && state.currentRound >= 3) {
                newResources.money -= 15;
                // 50% chance of success
                if (Math.random() < 0.5) {
                  // Apply viral-boost ability (+50% MAU gain)
                  let viralGain = 3000;
                  if (hasAbility(player, 'viral-boost')) {
                    viralGain = Math.round(viralGain * 1.5); // 4500 MAU
                  }
                  newMetrics.mau += viralGain;
                } else {
                  newMetrics.mau = Math.max(0, newMetrics.mau - 1000);
                }
              }
              break;

            case 'ipo-prep':
              if (newResources.money >= 50 && state.currentRound >= 4) {
                newResources.money -= 50;
                // Store IPO bonus score for final calculation
                // We need to track this per player
                ipoBonusScore = 25;
              }
              break;

            case 'acquisition-target':
              if (state.currentRound >= 4) {
                // Convert MAU to instant score: MAU × 0.002
                // Lose 50% MAU
                const acquisitionScore = Math.round(newMetrics.mau * 0.002);
                ipoBonusScore += acquisitionScore;
                newMetrics.mau = Math.round(newMetrics.mau * 0.5);
              }
              break;
          }
        }

        // Apply tech debt penalties (using new system)
        const finalDebtLevel = getTechDebtLevel(newResources.techDebt);
        if (finalDebtLevel.ratingPenalty > 0) {
          newMetrics.rating = Math.max(
            1,
            newMetrics.rating - finalDebtLevel.ratingPenalty
          );
        }

        // Apply passive-income ability (+$5 per quarter)
        if (hasAbility(player, 'passive-income')) {
          newResources.money += 5;
        }

        // Quality-focused strategy bonus
        if (player.strategy?.tech === 'quality-focused') {
          newMetrics.rating = Math.min(5, newMetrics.rating + 0.1);
        }

        // Apply product type multipliers to final values
        const product = PRODUCT_OPTIONS.find(
          (p) => p.id === player.strategy?.product
        );
        if (product) {
          // These are applied as growth multipliers
          const mauGrowth = newMetrics.mau - player.metrics.mau;
          const revenueGrowth = newMetrics.revenue - player.metrics.revenue;
          newMetrics.mau =
            player.metrics.mau + Math.round(mauGrowth * product.mauMultiplier);
          newMetrics.revenue =
            player.metrics.revenue +
            Math.round(revenueGrowth * product.revenueMultiplier);
        }

        // Income from MAU with catch-up mechanics
        // Base income calculation
        const rawIncome = Math.round(newMetrics.mau / 100);

        // Income cap that grows each round (prevents runaway leader)
        const incomeCap = 30 + (state.currentRound * 10); // Round 1: 40, Round 2: 50, etc.
        const cappedIncome = Math.min(rawIncome, incomeCap);

        // Underdog bonus: players below median MAU get a stipend
        const allMau = updatedPlayers.map(p => p.metrics.mau);
        const sortedMau = [...allMau].sort((a, b) => a - b);
        const medianMau = sortedMau[Math.floor(sortedMau.length / 2)];
        const underdogBonus = newMetrics.mau < medianMau ? 10 : 0;

        newResources.money += cappedIncome + underdogBonus;

        updatedPlayers[i] = {
          ...player,
          resources: newResources,
          metrics: newMetrics,
          hasRecruiterBonus,
          isReady: false,
          plannedActions: [],
          ipoBonusScore, // Track IPO/Acquisition bonus for final scoring
          engineers: player.engineers.map((e) => ({
            ...e,
            assignedAction: undefined,
            hasAiAugmentation: false,
            roundsRetained: e.roundsRetained + 1, // Increment for equity-hungry trait
          })),
        };
      }

      // Check milestones
      const updatedMilestones = checkMilestones(
        state.milestones,
        updatedPlayers,
        state.currentRound
      );

      // Draw event
      const eventDeck = [...state.eventDeck];
      const currentEvent = eventDeck.pop();

      return {
        players: updatedPlayers,
        milestones: updatedMilestones,
        phase: 'event' as GamePhase,
        eventDeck,
        usedEvents: currentEvent
          ? [...state.usedEvents, currentEvent]
          : state.usedEvents,
        roundState: {
          ...state.roundState,
          phase: 'event' as GamePhase,
          currentEvent,
        },
      };
    });
  },

  applyEvent: () => {
    const state = get();
    const event = state.roundState.currentEvent;
    if (!event) {
      set({ phase: 'round-end' });
      return;
    }

    set((state) => ({
      players: state.players.map((player) => {
        // STARTUP VETERAN TRAIT: Check if any engineer has the startup-veteran trait
        const hasVeteran = player.engineers.some(e => e.trait === 'startup-veteran');

        // DEBT-IMMUNITY ABILITY: Check if player has immunity to event debt
        const hasDebtImmunity = hasAbility(player, 'debt-immunity');

        const isMitigated = checkMitigation(
          event,
          player.resources,
          player.metrics
        );

        // If player has a startup veteran, treat as mitigated for negative effects
        const effect = (isMitigated || hasVeteran) ? event.mitigation.reducedEffect : event.effect;

        let newResources = { ...player.resources };
        let newMetrics = { ...player.metrics };

        // Apply resource changes
        if (effect.resourceChanges) {
          // Calculate tech debt change (blocked if player has debt-immunity)
          let techDebtChange = effect.resourceChanges.techDebt || 0;
          if (hasDebtImmunity && techDebtChange > 0) {
            techDebtChange = 0; // Block positive (damaging) debt changes
          }

          newResources = {
            money: newResources.money + (effect.resourceChanges.money || 0),
            serverCapacity:
              newResources.serverCapacity +
              (effect.resourceChanges.serverCapacity || 0),
            aiCapacity:
              newResources.aiCapacity + (effect.resourceChanges.aiCapacity || 0),
            techDebt: Math.max(0, newResources.techDebt + techDebtChange),
          };
        }

        // Apply metric changes
        newMetrics = {
          mau: Math.max(0, newMetrics.mau + (effect.mauChange || 0)),
          revenue: Math.max(0, newMetrics.revenue + (effect.revenueChange || 0)),
          rating: Math.max(
            1,
            Math.min(5, newMetrics.rating + (effect.ratingChange || 0))
          ),
        };

        // Handle viral moment crash
        if (
          event.type === 'viral-moment' &&
          !isMitigated &&
          newMetrics.mau > player.resources.serverCapacity * 100
        ) {
          const overflow = newMetrics.mau - player.resources.serverCapacity * 100;
          newMetrics.mau -= Math.round(overflow / 2);
          newMetrics.rating = Math.max(1, newMetrics.rating - 0.5);
        }

        return {
          ...player,
          resources: newResources,
          metrics: newMetrics,
        };
      }),
      phase: 'round-end' as GamePhase,
      roundState: {
        ...state.roundState,
        phase: 'round-end' as GamePhase,
      },
    }));
  },

  endRound: () => {
    const state = get();
    const nextRound = state.currentRound + 1;

    if (nextRound > TOTAL_QUARTERS) {
      set({ phase: 'game-end' });
      get().calculateWinner();
      return;
    }

    // Generate new engineer pool
    let engineerPool = generateEngineerPool(
      nextRound,
      state.players.length,
      state.players.map((p) => p.hasRecruiterBonus)
    );

    // INSIDER INFO ability: Add 2 extra engineers for players with this ability
    const insiderInfoCount = state.players.filter(p => hasAbility(p, 'insider-info')).length;
    if (insiderInfoCount > 0) {
      const extraEngineers = generateEngineerPool(nextRound, insiderInfoCount, []);
      engineerPool = [...engineerPool, ...extraEngineers.slice(0, insiderInfoCount * 2)];
    }

    // EVENT FORECASTING: Peek at next round's event
    const eventDeck = [...state.eventDeck];
    const upcomingEvent = eventDeck.length > 0 ? eventDeck[eventDeck.length - 1] : undefined;

    // Reset recruiter bonus
    const players = state.players.map((p) => ({
      ...p,
      hasRecruiterBonus: false,
    }));

    // CATCH-UP MECHANIC: Sort players by MAU for draft order
    // Lowest MAU picks first (advantage to trailing players)
    const draftOrder = [...players]
      .sort((a, b) => a.metrics.mau - b.metrics.mau)
      .map(p => p.id);

    set({
      players,
      currentRound: nextRound,
      currentQuarter: nextRound,
      phase: 'engineer-draft',
      roundState: {
        roundNumber: nextRound,
        phase: 'engineer-draft',
        engineerPool,
        currentBids: new Map(),
        bidResults: [],
        occupiedActions: new Map(),
        draftOrder,
        upcomingEvent, // Show next quarter's event during planning
      },
    });
  },

  calculateWinner: () => {
    const state = get();
    const scores = new Map<string, number>();

    for (const player of state.players) {
      // Base score from metrics
      let score = 0;

      // MAU score (1 point per 1000 MAU)
      score += player.metrics.mau / 1000;

      // Revenue score (1 point per 500 revenue)
      let revenueMultiplier = 1;
      if (player.strategy?.funding === 'bootstrapped') {
        revenueMultiplier = 2; // Bootstrapped gets 2x revenue scoring
      }
      score += (player.metrics.revenue / 500) * revenueMultiplier;

      // Rating score (10 points per rating point)
      score += player.metrics.rating * 10;

      // MILESTONE BONUSES - Add points for claimed milestones
      for (const milestone of state.milestones) {
        if (milestone.claimedBy === player.id) {
          score += milestone.bonus;
        }
      }

      // LATE-GAME ACTION BONUSES (IPO Prep, Acquisition Target)
      score += player.ipoBonusScore || 0;

      // Synergy bonuses for specialization
      // MAU specialist: 50+ points if MAU > all others by 50%
      // Revenue specialist: 50+ points if revenue > all others by 50%
      // Rating specialist: 50+ points if rating > all others by 0.5

      // Tech debt penalty
      const debtLevel = TECH_DEBT_LEVELS.find(
        (l) =>
          player.resources.techDebt >= l.min &&
          player.resources.techDebt <= l.max
      );
      if (debtLevel && debtLevel.min >= 7) {
        score -= 10; // Penalty for high debt
      }

      scores.set(player.id, Math.round(score * 10) / 10);
    }

    // Find winner
    let winnerId = '';
    let highScore = -1;
    scores.forEach((score, playerId) => {
      if (score > highScore) {
        highScore = score;
        winnerId = playerId;
      }
    });

    set({
      winner: winnerId,
      finalScores: scores,
    });
  },

  getCurrentPlayer: () => {
    const state = get();
    return state.players[state.currentPlayerIndex];
  },

  getPlayer: (playerId: string) => {
    return get().players.find((p) => p.id === playerId);
  },

  canAffordAction: (playerId: string, action: ActionType) => {
    const player = get().players.find((p) => p.id === playerId);
    if (!player) return false;
    return canAffordAction(player.resources, action);
  },

  isActionAvailable: (playerId: string, action: ActionType) => {
    const state = get();
    const actionSpace = getActionSpace(action);

    // Check if action is unlocked for this round
    if (actionSpace.unlocksAtRound && state.currentRound < actionSpace.unlocksAtRound) {
      return false;
    }

    // If no max workers, always available
    if (actionSpace.maxWorkers === undefined) return true;

    const occupied = state.roundState.occupiedActions.get(action) || [];

    // If player already has an engineer on this action, they can add more
    if (occupied.includes(playerId)) return true;

    // Otherwise check if there's room
    return occupied.length < actionSpace.maxWorkers;
  },

  getActionOccupancy: (action: ActionType) => {
    const state = get();
    const actionSpace = getActionSpace(action);
    const occupied = state.roundState.occupiedActions.get(action) || [];

    return {
      current: occupied.length,
      max: actionSpace.maxWorkers,
      players: occupied,
    };
  },

  getMilestones: () => {
    return get().milestones;
  },

  getDraftOrder: () => {
    return get().roundState.draftOrder;
  },

  // ============================================
  // CORPORATION POWERS
  // ============================================

  usePivotPower: (playerId: string, newProductType: ProductType) => {
    const state = get();
    const player = state.players.find(p => p.id === playerId);

    // Check if player can use pivot power
    if (!player) return false;
    if (player.strategy?.funding !== 'vc-heavy') return false;
    if (player.hasPivoted) return false;
    if (player.powerUsesRemaining <= 0) return false;

    // Apply the pivot
    const product = PRODUCT_OPTIONS.find(p => p.id === newProductType);
    if (!product) return false;

    set((state) => ({
      players: state.players.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          strategy: {
            ...p.strategy!,
            product: newProductType,
          },
          hasPivoted: true,
          powerUsesRemaining: p.powerUsesRemaining - 1,
        };
      }),
    }));

    return true;
  },

  // ============================================
  // UTILITY METHODS FOR NEW FEATURES
  // ============================================

  getAvailableActionsForRound: () => {
    const state = get();
    return getAvailableActions(state.currentRound).map(a => a.id);
  },

  getUpcomingEvent: () => {
    return get().roundState.upcomingEvent;
  },
}));
