import { create } from 'zustand';
import type {
  GameState,
  GamePhase,
  GameEvent,
  Player,
  CorporationStrategy,
  CorporationStyle,
  ActionType,
  Bid,
  CodeBlock,
  Milestone,
  ProductType,
  StartupCard,
  PersonaCard,
  PersonaAuctionState,
  HiredEngineer,
  SprintPlayerState,
  DraftPhase,
  PlanningMode,
  SequentialDraftState,
  AIResearchLevel,
} from '../types';
import {
  TOTAL_QUARTERS,
  ROUNDS_PER_QUARTER,
  MILESTONE_DEFINITIONS,
  PRODUCTION_CONSTANTS,
  AI_POWER_BONUS,
  getTechDebtLevel,
  getAiDebt,
  createEmptyGrid,
  createEmptyBuffer,
  MAU_MILESTONES,
  SPECIALTY_TO_COLOR,
  randomTokenColor,
  TECH_DEBT_BUFFER_SIZE,
} from '../types';
import type { TokenPickState } from '../types';
import {
  FUNDING_OPTIONS,
  TECH_OPTIONS,
  PRODUCT_OPTIONS,
  getStartingResources,
  getStartingMetrics,
  getStartingProductionTracks,
} from '../data/corporations';
import { generateEngineerPool, getSpecialtyBonus, generateIntern } from '../data/engineers';
import { createEventDeck, checkMitigation } from '../data/events';
import { getActionSpace, canAffordAction, getAvailableActions } from '../data/actions';
import { generatePuzzle, executePuzzleSolution, countBlocks } from '../data/puzzles';
import { createStartupDeck, dealStartupCards, hasAbility } from '../data/startups';
import {
  createPersonaDeck,
  dealLeaderCards,
  personaToEngineer,
  drawPersonasForRound,
} from '../data/personaCards';
import { shuffleThemes, getThemeForRound } from '../data/quarters';
import { createSprintBag, getMaxDraws, getSprintDebtReduction, getSprintRatingBonus } from '../data/sprintTokens';
import { generateCodePool } from '../data/codePool';
import { createAppCardDeck } from '../data/appCards';
import { expandGrid, matchPatternAtPosition, clearPatternFromGrid } from './gridHelpers';
import { getStarRating } from '../data/appCards';

const PLAYER_COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b'];

// Build snake draft pick order: lowest MAU picks first, then reverses
// e.g., for 3 players sorted by MAU: [P1, P2, P3, P3, P2, P1, P1, P2, P3, ...]
function buildSnakePickOrder(players: Player[]): string[] {
  const sorted = [...players].sort((a, b) => a.metrics.mau - b.metrics.mau);
  const ids = sorted.map(p => p.id);
  const reversed = [...ids].reverse();
  // Build enough rounds to cover max possible picks (players * max engineers each)
  const maxPicks = players.reduce((sum, p) => sum + p.engineers.length, 0);
  const rounds = Math.ceil(maxPicks / ids.length) + 1;
  const order: string[] = [];
  for (let i = 0; i < rounds; i++) {
    order.push(...(i % 2 === 0 ? ids : reversed));
  }
  return order;
}

function buildSequentialDraft(players: Player[]): SequentialDraftState {
  const totalPicks = players.reduce((sum, p) => sum + p.engineers.length, 0);
  return {
    pickOrder: buildSnakePickOrder(players),
    currentPickerIndex: 0,
    picksPerRound: totalPicks,
    picksCompleted: 0,
    isComplete: false,
    timeoutSeconds: 0,
  };
}

// Compute a player's running VP total (for snake draft ordering).
// Lowest VP picks first, giving trailing players catch-up opportunities.
function getPlayerVP(player: Player): number {
  let vp = 0;
  // VP from published apps
  for (const app of player.publishedApps) {
    vp += app.vpEarned;
  }
  // VP from IPO / acquisition actions
  vp += player.ipoBonusScore || 0;
  // VP from production tracks
  vp += player.productionTracks.mauProduction;
  vp += player.productionTracks.revenueProduction * 2;
  return vp;
}

// Build snake draft pick order sorted by VP (lowest first).
// Same algorithm as buildSnakePickOrder but using VP instead of MAU.
function buildSnakePickOrderByVP(players: Player[]): string[] {
  // Stable sort: tiebreak by player ID so UI and store always produce the same order
  const sorted = [...players].sort((a, b) => {
    const vpDiff = getPlayerVP(a) - getPlayerVP(b);
    if (vpDiff !== 0) return vpDiff;
    return a.id.localeCompare(b.id);
  });
  const ids = sorted.map(p => p.id);
  const reversed = [...ids].reverse();
  const maxPicks = players.reduce((sum, p) => sum + p.engineers.length, 0);
  const rounds = Math.ceil(maxPicks / ids.length) + 1;
  const order: string[] = [];
  for (let i = 0; i < rounds; i++) {
    order.push(...(i % 2 === 0 ? ids : reversed));
  }
  return order;
}

// Interactive actions that require UI interaction (mini-game or token placement).
// All other actions resolve immediately when an engineer is placed.
const INTERACTIVE_ACTIONS: ActionType[] = [
  'develop-features',
  'optimize-code',
];

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
        case 'first-9-rating':
          achieved = player.metrics.rating >= 9; // 5-star = rating 9+ on 1-10 scale
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

// Helper function to find the next active sprint player
function findNextSprintPlayer(
  playerStates: SprintPlayerState[],
  currentIndex: number
): { index: number; allDone: boolean } {
  const total = playerStates.length;
  for (let i = 1; i <= total; i++) {
    const nextIndex = (currentIndex + i) % total;
    const ps = playerStates[nextIndex];
    if (!ps.hasStopped && !ps.hasCrashed && ps.drawnTokens.length < ps.maxDraws) {
      return { index: nextIndex, allDone: false };
    }
  }
  return { index: currentIndex, allDone: true };
}

interface GameStore extends GameState {
  // Setup actions
  initGame: (playerCount: number, planningMode?: PlanningMode) => void;
  setPlayerName: (playerId: string, name: string) => void;
  selectStrategy: (playerId: string, strategy: CorporationStrategy) => void;
  playerReady: (playerId: string) => void;

  // Phase 2: Leader draft & funding selection
  selectLeader: (playerId: string, personaId: string) => void;
  selectFunding: (playerId: string, style: CorporationStyle) => void;
  getDealtLeaderCards: (playerId: string) => PersonaCard[];

  // Phase 2: App card selection (agency players)
  confirmAppCards: (playerId: string, keptCardIds: string[]) => void;

  // Phase 2: Persona auction actions
  startPersonaAuction: (personaCardId: string) => void;
  placeBid: (playerId: string, amount: number) => void;
  passAuction: (playerId: string) => void;

  // Startup card draft actions
  selectStartupCard: (playerId: string, cardId: string) => void;
  getDealtCards: (playerId: string) => StartupCard[];
  isActionBlockedByDebt: (playerId: string, action: ActionType) => boolean;

  // Bidding actions
  submitBid: (playerId: string, engineerId: string, amount: number) => void;
  resolveBids: () => void;

  // Phase 4: Hybrid auction draft
  draftPickEngineer: (playerId: string, engineerId: string) => void;

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

  // Sprint mini-game actions
  startSprint: () => void;
  drawSprintToken: (playerId: string) => void;
  stopSprint: (playerId: string) => void;
  endSprint: () => void;

  // Resolution actions
  resolveActions: () => void;
  applyEvent: () => void;
  endRound: () => void;

  // End game
  calculateWinner: () => void;

  // Corporation powers
  usePivotPower: (playerId: string, newProductType: 'b2b' | 'consumer' | 'platform') => boolean;

  // Sequential action draft
  claimActionSlot: (playerId: string, engineerId: string, actionType: ActionType, useAi: boolean) => void;
  advanceSequentialDraft: () => void;

  // Action Draft (immediate resolution)
  startActionDraft: () => void;
  endTurn: () => void;
  completeInteractiveAction: () => void;
  placeTokenOnGrid: (playerId: string, tokenIndex: number, row: number, col: number) => void;

  // Token pick specialty choice
  resolveSpecialtyChoice: (playerId: string, useSpecialty: boolean) => void;

  // Grid redesign: App and code actions
  publishApp: (playerId: string, cardId: string, row: number, col: number) => void;
  claimAppCard: (playerId: string, cardId: string) => void;
  commitCode: (playerId: string, row: number, col: number, direction?: 'row' | 'col', count?: number) => void;
  performGridSwap: (playerId: string, r1: number, c1: number, r2: number, c2: number) => void;

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
    metrics: { mau: 0, revenue: 0, rating: 5 }, // Integer 1-10 scale
    productionTracks: { mauProduction: 0, revenueProduction: 0 },
    engineers: [],
    plannedActions: [],
    hasRecruiterBonus: false,
    synergiesUnlocked: [],
    // Leader/Corporation power tracking
    leaderPowerUsed: false,
    powerUsesRemaining: 1, // For powers like Pivot (1 use per game)
    hasPivoted: false,
    ipoBonusScore: 0,
    // Grid redesign fields
    codeGrid: createEmptyGrid(0),
    techDebtBuffer: createEmptyBuffer(),
    aiResearchLevel: 0 as AIResearchLevel,
    publishedApps: [],
    heldAppCards: [],
    commitCodeUsedThisRound: false,
    // Action Draft redesign fields
    marketingStarBonus: 0,
    committedCodeCount: 0,
    recurringRevenue: 0,
    mauMilestonesClaimed: [],
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
      personaPool: [],
      currentBids: new Map(),
      bidResults: [],
      occupiedActions: new Map(),
      draftOrder: [],
      codePool: [],
      appMarket: [],
    },
    eventDeck: createEventDeck(),
    usedEvents: [],
    milestones: createInitialMilestones(),
    quarterlyThemes: [],
    planningMode: 'simultaneous',
    // Startup card draft (legacy)
    startupDeck: [],
    dealtStartupCards: new Map(),
    // Phase 2: Persona card system
    personaDeck: [],
    dealtLeaderCards: new Map(),
    // Grid redesign: app card deck
    appCardDeck: [],
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),

  initGame: (playerCount: number, planningMode?: PlanningMode) => {
    const players = Array.from({ length: playerCount }, (_, i) =>
      createInitialPlayer(i)
    );

    // Phase 2: Create persona deck and deal 3 leader cards per player
    const personaDeck = createPersonaDeck();
    const { dealtCards: dealtLeaderCards, remainingDeck: remainingPersonaDeck } =
      dealLeaderCards(personaDeck, playerCount, 3);

    // Shuffle quarterly themes (deal 4 for 4 rounds)
    const quarterlyThemes = shuffleThemes();

    // Still create startup deck for legacy support
    const startupDeck = createStartupDeck();
    const { dealtCards: dealtStartupCards, remainingDeck: remainingStartupDeck } =
      dealStartupCards(startupDeck, playerCount, 2);

    // Grid redesign: Create app card deck and deal initial market
    const appCardDeck = createAppCardDeck();
    const appMarket = appCardDeck.splice(0, 3);

    const initialState = createInitialState();
    set({
      ...initialState,
      players,
      phase: 'leader-draft', // Phase 2: Start with leader-draft instead of startup-draft
      startupDeck: remainingStartupDeck,
      dealtStartupCards,
      personaDeck: remainingPersonaDeck,
      dealtLeaderCards,
      quarterlyThemes,
      planningMode: planningMode || 'simultaneous',
      appCardDeck,
      roundState: {
        ...initialState.roundState,
        codePool: generateCodePool(playerCount),
        appMarket,
      },
    });
  },

  setPlayerName: (playerId: string, name: string) => {
    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId ? { ...p, name } : p
      ),
    }));
  },

  // ============================================
  // PHASE 2: Leader Draft & Funding Selection
  // ============================================

  selectLeader: (playerId: string, personaId: string) => {
    set((state) => {
      const dealtCards = state.dealtLeaderCards.get(playerId) || [];
      const selectedCard = dealtCards.find(c => c.id === personaId);
      if (!selectedCard) return state;

      // Return unchosen cards to the persona deck
      const unchosenCards = dealtCards.filter(c => c.id !== personaId);
      const updatedPersonaDeck = [...state.personaDeck, ...unchosenCards];

      // Update player with selected leader
      const updatedPlayers = state.players.map(p => {
        if (p.id !== playerId) return p;
        return { ...p, leader: selectedCard, isReady: true };
      });

      // Check if all players have selected leaders
      const allSelected = updatedPlayers.every(p => p.leader);

      if (allSelected) {
        // Transition to funding-selection phase
        return {
          players: updatedPlayers.map(p => ({ ...p, isReady: false })),
          personaDeck: updatedPersonaDeck,
          phase: 'funding-selection' as GamePhase,
        };
      }

      return {
        players: updatedPlayers,
        personaDeck: updatedPersonaDeck,
      };
    });
  },

  selectFunding: (playerId: string, style: CorporationStyle) => {
    set((state) => {
      const player = state.players.find(p => p.id === playerId);
      if (!player || !player.leader) return state;

      // Use angel-backed as the balanced default funding for all players
      const funding = FUNDING_OPTIONS.find(f => f.id === 'angel-backed')!;
      const leaderBonus = player.leader.leaderSide.startingBonus;

      // Product type comes from leader's productLock - use first option
      const productType = player.leader.leaderSide.productLock[0];
      const product = PRODUCT_OPTIONS.find(p => p.id === productType)!;

      // Default tech approach based on leader (simplified - use ai-first if leader has AI bonuses)
      const techType = leaderBonus.aiCapacity && leaderBonus.aiCapacity >= 3 ? 'ai-first' : 'quality-focused';
      const tech = TECH_OPTIONS.find(t => t.id === techType)!;

      // Calculate starting resources from funding + tech
      const baseResources = getStartingResources(funding, tech);
      const baseMetrics = getStartingMetrics(product);
      const baseProduction = getStartingProductionTracks(product, tech);

      // Apply leader starting bonuses on top
      const resources = {
        money: baseResources.money + (leaderBonus.money || 0),
        serverCapacity: baseResources.serverCapacity + (leaderBonus.serverCapacity || 0),
        aiCapacity: leaderBonus.aiCapacity !== undefined
          ? leaderBonus.aiCapacity + baseResources.aiCapacity
          : baseResources.aiCapacity,
        techDebt: leaderBonus.techDebt !== undefined
          ? leaderBonus.techDebt
          : baseResources.techDebt,
      };

      const metrics = {
        mau: baseMetrics.mau,
        revenue: baseMetrics.revenue,
        rating: leaderBonus.rating !== undefined ? leaderBonus.rating : baseMetrics.rating,
      };

      const productionTracks = {
        mauProduction: baseProduction.mauProduction + (leaderBonus.mauProduction || 0),
        revenueProduction: baseProduction.revenueProduction + (leaderBonus.revenueProduction || 0),
      };

      // Clamp production tracks
      productionTracks.mauProduction = Math.min(
        PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
        Math.max(0, productionTracks.mauProduction)
      );
      productionTracks.revenueProduction = Math.min(
        PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
        Math.max(0, productionTracks.revenueProduction)
      );

      // Create strategy (funding is now standardized; the key choice is corporation style)
      const strategy: CorporationStrategy = {
        funding: 'angel-backed',
        tech: techType as CorporationStrategy['tech'],
        product: productType,
      };

      // Deal 3 app cards from deck to agency players (held temporarily until confirmed)
      let dealtCards: typeof state.appCardDeck = [];
      let newAppCardDeck = state.appCardDeck;
      if (style === 'agency' && state.appCardDeck.length >= 3) {
        newAppCardDeck = [...state.appCardDeck];
        dealtCards = newAppCardDeck.splice(0, 3);
      }

      const updatedPlayers = state.players.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          strategy,
          corporationStyle: style,
          resources,
          metrics,
          productionTracks,
          // Agency players must confirm app cards before being ready
          isReady: style !== 'agency',
          powerUsesRemaining: 1, // Leader power once per game
          ...(dealtCards.length > 0 ? { dealtAppCards: dealtCards } : {}),
        };
      });

      // Check if all players have selected funding
      const allSelected = updatedPlayers.every(p => p.strategy);

      if (allSelected) {
        // Generate first engineer pool
        let engineerPool = generateEngineerPool(
          1,
          updatedPlayers.length,
          updatedPlayers.map(p => p.hasRecruiterBonus)
        );

        // Draw 2 persona cards for the round's persona pool
        const { drawn: personaPool, remainingDeck: newPersonaDeck } =
          drawPersonasForRound(state.personaDeck, 2);

        // EVENT FORECASTING: Peek at first quarter's event
        const eventDeck = [...state.eventDeck];
        const upcomingEvent = eventDeck.length > 0 ? eventDeck[eventDeck.length - 1] : undefined;

        // Initial draft order is random
        const draftOrder = updatedPlayers.map(p => p.id);

        return {
          players: updatedPlayers,
          personaDeck: newPersonaDeck,
          appCardDeck: newAppCardDeck,
          phase: 'engineer-draft' as GamePhase,
          currentRound: 1,
          currentQuarter: 1,
          roundState: {
            roundNumber: 1,
            phase: 'engineer-draft' as GamePhase,
            engineerPool,
            personaPool,
            currentBids: new Map(),
            bidResults: [],
            occupiedActions: new Map(),
            draftOrder,
            upcomingEvent,
            activeTheme: getThemeForRound(state.quarterlyThemes, 1),
            // Phase 4: Hybrid auction draft initialization
            draftPhase: 'generic-draft' as DraftPhase,
            currentDraftPickerIndex: 0,
            codePool: generateCodePool(updatedPlayers.length),
            appMarket: state.roundState.appMarket,
          },
        };
      }

      return { players: updatedPlayers, appCardDeck: newAppCardDeck };
    });
  },

  getDealtLeaderCards: (playerId: string) => {
    return get().dealtLeaderCards.get(playerId) || [];
  },

  confirmAppCards: (playerId: string, keptCardIds: string[]) => {
    set((state) => {
      const player = state.players.find(p => p.id === playerId);
      if (!player || !player.dealtAppCards || keptCardIds.length < 1) return state;

      const keptCards = player.dealtAppCards.filter(c => keptCardIds.includes(c.id));
      const returnedCards = player.dealtAppCards.filter(c => !keptCardIds.includes(c.id));

      // Return unkept cards to the bottom of the deck
      const newDeck = [...state.appCardDeck, ...returnedCards];

      const updatedPlayers = state.players.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          heldAppCards: keptCards,
          dealtAppCards: undefined,
          isReady: true,
        };
      });

      // Check if all players have selected (same logic as selectFunding's allSelected)
      const allSelected = updatedPlayers.every(p => p.strategy && p.isReady);

      if (allSelected) {
        // Generate first engineer pool
        let engineerPool = generateEngineerPool(
          1,
          updatedPlayers.length,
          updatedPlayers.map(p => p.hasRecruiterBonus)
        );

        // Draw 2 persona cards for the round's persona pool
        const { drawn: personaPool, remainingDeck: newPersonaDeck } =
          drawPersonasForRound(state.personaDeck, 2);

        // EVENT FORECASTING: Peek at first quarter's event
        const eventDeck = [...state.eventDeck];
        const upcomingEvent = eventDeck.length > 0 ? eventDeck[eventDeck.length - 1] : undefined;

        // Initial draft order is random
        const draftOrder = updatedPlayers.map(p => p.id);

        return {
          players: updatedPlayers,
          personaDeck: newPersonaDeck,
          appCardDeck: newDeck,
          phase: 'engineer-draft' as GamePhase,
          currentRound: 1,
          currentQuarter: 1,
          roundState: {
            roundNumber: 1,
            phase: 'engineer-draft' as GamePhase,
            engineerPool,
            personaPool,
            currentBids: new Map(),
            bidResults: [],
            occupiedActions: new Map(),
            draftOrder,
            upcomingEvent,
            activeTheme: getThemeForRound(state.quarterlyThemes, 1),
            draftPhase: 'generic-draft' as DraftPhase,
            currentDraftPickerIndex: 0,
            codePool: generateCodePool(updatedPlayers.length),
            appMarket: state.roundState.appMarket,
          },
        };
      }

      return { players: updatedPlayers, appCardDeck: newDeck };
    });
  },

  // ============================================
  // PHASE 2: Persona Auction Actions
  // ============================================

  startPersonaAuction: (personaCardId: string) => {
    set((state) => {
      const personaCard = state.roundState.personaPool.find(
        c => c.id === personaCardId
      );
      if (!personaCard) return state;

      // Bidding order: lowest MAU first
      const biddingOrder = [...state.players]
        .sort((a, b) => a.metrics.mau - b.metrics.mau)
        .map(p => p.id);

      const auctionState: PersonaAuctionState = {
        personaCard,
        currentBid: 10, // Starting bid (minimum $15 to actually bid)
        currentBidderId: undefined,
        passedPlayers: [],
        biddingOrder,
        currentBidderIndex: 0,
        isComplete: false,
      };

      return {
        roundState: {
          ...state.roundState,
          personaAuction: auctionState,
        },
      };
    });
  },

  placeBid: (playerId: string, amount: number) => {
    set((state) => {
      const auction = state.roundState.personaAuction;
      if (!auction || auction.isComplete) return state;

      // Bid must be at least $5 more than current bid (minimum $15)
      const minBid = Math.max(15, auction.currentBid + 5);
      if (amount < minBid) return state;

      // Check player can afford it
      const player = state.players.find(p => p.id === playerId);
      if (!player || player.resources.money < amount) return state;

      // Advance to next bidder who hasn't passed
      let nextIndex = (auction.currentBidderIndex + 1) % auction.biddingOrder.length;
      const passedSet = new Set(auction.passedPlayers);
      while (passedSet.has(auction.biddingOrder[nextIndex]) && nextIndex !== auction.currentBidderIndex) {
        nextIndex = (nextIndex + 1) % auction.biddingOrder.length;
      }

      // Check if only the current bidder is left (everyone else passed)
      const activeBidders = auction.biddingOrder.filter(id => !passedSet.has(id));
      const isComplete = activeBidders.length <= 1;

      // If auto-complete in hybrid mode: resolve the winner immediately
      if (isComplete && state.roundState.draftPhase === 'persona-auction') {
        const engineerData = personaToEngineer(auction.personaCard);

        let hireCost = amount;
        if (player.leader?.leaderSide.passive.id === 'lean-efficiency') {
          hireCost = Math.max(0, hireCost - 5);
        }
        if (player.strategy?.funding === 'bootstrapped') {
          hireCost = Math.round(hireCost * 0.8);
        }

        const hiredEngineer: HiredEngineer = {
          ...engineerData,
          playerId,
          salaryPaid: hireCost,
          hasAiAugmentation: false,
          roundsRetained: 1,
        };

        const updatedPersonaPool = state.roundState.personaPool.filter(
          c => c.id !== auction.personaCard.id
        );

        const updatedPlayers = state.players.map(p => {
          if (p.id !== playerId) return p;
          return {
            ...p,
            resources: { ...p.resources, money: p.resources.money - hireCost },
            engineers: [...p.engineers, hiredEngineer],
          };
        });

        // Check for more personas to auction
        if (updatedPersonaPool.length > 0) {
          const nextPersona = updatedPersonaPool[0];
          const biddingOrder = [...updatedPlayers]
            .sort((a, b) => a.metrics.mau - b.metrics.mau)
            .map(p => p.id);

          const nextAuction: PersonaAuctionState = {
            personaCard: nextPersona,
            currentBid: 10,
            currentBidderId: undefined,
            passedPlayers: [],
            biddingOrder,
            currentBidderIndex: 0,
            isComplete: false,
          };

          return {
            players: updatedPlayers,
            roundState: {
              ...state.roundState,
              personaPool: updatedPersonaPool,
              personaAuction: nextAuction,
            },
          };
        }

        // No more personas - transition to planning
        const finalPlayers = updatedPlayers.map(p => {
          if (p.engineers.length > 0) return { ...p, isReady: false };
          const intern = generateIntern();
          let internCost = Math.min(5, p.resources.money);
          if (p.strategy?.funding === 'bootstrapped') {
            internCost = Math.round(internCost * 0.8);
          }
          return {
            ...p,
            isReady: false,
            resources: { ...p.resources, money: p.resources.money - internCost },
            engineers: [{
              ...intern,
              playerId: p.id,
              salaryPaid: internCost,
              hasAiAugmentation: false,
              roundsRetained: 1,
            }],
          };
        });

        return {
          players: finalPlayers,
          phase: 'action-draft' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'action-draft' as GamePhase,
            personaPool: updatedPersonaPool,
            personaAuction: undefined,
            draftPhase: 'complete' as DraftPhase,
            currentBids: new Map(),
            occupiedActions: new Map(),
            ...(state.planningMode === 'sequential' ? { sequentialDraft: buildSequentialDraft(finalPlayers) } : {}),
          },
        };
      }

      return {
        roundState: {
          ...state.roundState,
          personaAuction: {
            ...auction,
            currentBid: amount,
            currentBidderId: playerId,
            currentBidderIndex: nextIndex,
            isComplete,
          },
        },
      };
    });
  },

  passAuction: (playerId: string) => {
    set((state) => {
      const auction = state.roundState.personaAuction;
      if (!auction || auction.isComplete) return state;

      const newPassedPlayers = [...auction.passedPlayers, playerId];
      const activeBidders = auction.biddingOrder.filter(
        id => !newPassedPlayers.includes(id)
      );

      // Auction completes when: nobody remains, OR exactly one remains who already bid (they win)
      // If one player remains but nobody has bid yet, they still get a chance to bid at base cost
      const isComplete = activeBidders.length === 0 ||
        (activeBidders.length === 1 && !!auction.currentBidderId);

      // Helper: transition to next persona auction or to planning phase
      const finishAuction = (
        updatedPlayers: Player[],
        updatedPersonaPool: PersonaCard[],
      ): Partial<GameState> & { roundState: typeof state.roundState } => {
        // Check if more persona cards remain to auction
        if (updatedPersonaPool.length > 0 && state.roundState.draftPhase === 'persona-auction') {
          const nextPersona = updatedPersonaPool[0];
          const biddingOrder = [...updatedPlayers]
            .sort((a, b) => a.metrics.mau - b.metrics.mau)
            .map(p => p.id);

          const nextAuction: PersonaAuctionState = {
            personaCard: nextPersona,
            currentBid: 10,
            currentBidderId: undefined,
            passedPlayers: [],
            biddingOrder,
            currentBidderIndex: 0,
            isComplete: false,
          };

          return {
            players: updatedPlayers,
            roundState: {
              ...state.roundState,
              personaPool: updatedPersonaPool,
              personaAuction: nextAuction,
            },
          };
        }

        // No more personas - draft is complete, transition to planning
        // CS Intern Safety Net: Ensure every player has at least one engineer
        const finalPlayers = updatedPlayers.map(p => {
          if (p.engineers.length > 0) return { ...p, isReady: false };
          const intern = generateIntern();
          let internCost = Math.min(5, p.resources.money);
          if (p.strategy?.funding === 'bootstrapped') {
            internCost = Math.round(internCost * 0.8);
          }
          return {
            ...p,
            isReady: false,
            resources: { ...p.resources, money: p.resources.money - internCost },
            engineers: [{
              ...intern,
              playerId: p.id,
              salaryPaid: internCost,
              hasAiAugmentation: false,
              roundsRetained: 1,
            }],
          };
        });

        return {
          players: finalPlayers,
          phase: 'action-draft' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'action-draft' as GamePhase,
            personaPool: updatedPersonaPool,
            personaAuction: undefined,
            draftPhase: 'complete' as DraftPhase,
            currentBids: new Map(),
            occupiedActions: new Map(),
            ...(state.planningMode === 'sequential' ? { sequentialDraft: buildSequentialDraft(finalPlayers) } : {}),
          },
        };
      };

      if (isComplete && auction.currentBidderId) {
        // Winner! Convert persona to hired engineer and add to winner's team
        const winner = state.players.find(p => p.id === auction.currentBidderId);
        if (!winner) return state;

        const engineerData = personaToEngineer(auction.personaCard);

        // Apply lean-efficiency leader passive: hiring costs -$5
        let hireCost = auction.currentBid;
        if (winner.leader?.leaderSide.passive.id === 'lean-efficiency') {
          hireCost = Math.max(0, hireCost - 5);
        }
        // Apply Bootstrapped "Lean Team" power: 20% discount
        if (winner.strategy?.funding === 'bootstrapped') {
          hireCost = Math.round(hireCost * 0.8);
        }

        const hiredEngineer: HiredEngineer = {
          ...engineerData,
          playerId: auction.currentBidderId,
          salaryPaid: hireCost,
          hasAiAugmentation: false,
          roundsRetained: 1,
        };

        // Remove from persona pool
        const updatedPersonaPool = state.roundState.personaPool.filter(
          c => c.id !== auction.personaCard.id
        );

        const updatedPlayers = state.players.map(p => {
          if (p.id !== auction.currentBidderId) return p;
          return {
            ...p,
            resources: {
              ...p.resources,
              money: p.resources.money - hireCost,
            },
            engineers: [...p.engineers, hiredEngineer],
          };
        });

        // In hybrid draft mode, auto-advance to next auction or planning
        if (state.roundState.draftPhase === 'persona-auction') {
          return finishAuction(updatedPlayers, updatedPersonaPool);
        }

        // Legacy: just clear the auction
        return {
          players: updatedPlayers,
          roundState: {
            ...state.roundState,
            personaPool: updatedPersonaPool,
            personaAuction: undefined,
          },
        };
      }

      if (isComplete && !auction.currentBidderId) {
        // No one bid - remove card from pool (nobody wanted it)
        const updatedPersonaPool = state.roundState.personaPool.filter(
          c => c.id !== auction.personaCard.id
        );

        // In hybrid draft mode, auto-advance to next auction or planning
        if (state.roundState.draftPhase === 'persona-auction') {
          return finishAuction([...state.players], updatedPersonaPool);
        }

        // Legacy: just clear the auction
        return {
          roundState: {
            ...state.roundState,
            personaAuction: undefined,
          },
        };
      }

      // Advance to next active bidder
      let nextIndex = (auction.currentBidderIndex + 1) % auction.biddingOrder.length;
      while (newPassedPlayers.includes(auction.biddingOrder[nextIndex])) {
        nextIndex = (nextIndex + 1) % auction.biddingOrder.length;
      }

      return {
        roundState: {
          ...state.roundState,
          personaAuction: {
            ...auction,
            passedPlayers: newPassedPlayers,
            currentBidderIndex: nextIndex,
            isComplete,
          },
        },
      };
    });
  },

  selectStrategy: (playerId: string, strategy: CorporationStrategy) => {
    const funding = FUNDING_OPTIONS.find((f) => f.id === strategy.funding)!;
    const tech = TECH_OPTIONS.find((t) => t.id === strategy.tech)!;
    const product = PRODUCT_OPTIONS.find((p) => p.id === strategy.product)!;

    const resources = getStartingResources(funding, tech);
    const metrics = getStartingMetrics(product);
    const productionTracks = getStartingProductionTracks(product, tech);

    set((state) => ({
      players: state.players.map((p) =>
        p.id === playerId
          ? { ...p, strategy, resources, metrics, productionTracks }
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
      const productionTracks = getStartingProductionTracks(product, tech);

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
          productionTracks,
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
            personaPool: [],
            currentBids: new Map(),
            bidResults: [],
            occupiedActions: new Map(),
            draftOrder,
            upcomingEvent,
            activeTheme: getThemeForRound(state.quarterlyThemes, 1),
            // Phase 4: Hybrid auction draft initialization
            draftPhase: 'generic-draft' as DraftPhase,
            currentDraftPickerIndex: 0,
            codePool: generateCodePool(updatedPlayers.length),
            appMarket: state.roundState.appMarket,
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
            personaPool: [],
            currentBids: new Map(),
            bidResults: [],
            occupiedActions: new Map(),
            draftOrder,
            upcomingEvent,
            activeTheme: getThemeForRound(state.quarterlyThemes, 1),
            // Phase 4: Hybrid auction draft initialization
            draftPhase: 'generic-draft' as DraftPhase,
            currentDraftPickerIndex: 0,
            codePool: generateCodePool(players.length),
            appMarket: state.roundState.appMarket,
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
      // Phase 4: If hybrid draft is complete, just transition to planning
      if (state.roundState.draftPhase === 'complete') {
        const playersReady = state.players.map(p => ({ ...p, isReady: false }));
        return {
          players: playersReady,
          phase: 'action-draft' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'action-draft' as GamePhase,
            currentBids: new Map(),
            occupiedActions: new Map(),
            ...(state.planningMode === 'sequential' ? { sequentialDraft: buildSequentialDraft(playersReady) } : {}),
          },
        };
      }

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
              // LEADER PASSIVE: lean-efficiency (Silica Su) - hiring costs -$5
              if (player.leader?.leaderSide.passive.id === 'lean-efficiency') {
                actualCost = Math.max(0, actualCost - 5);
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
        phase: 'action-draft' as GamePhase,
        roundState: {
          ...state.roundState,
          phase: 'action-draft' as GamePhase,
          bidResults,
          currentBids: new Map(),
          occupiedActions: new Map(), // Reset for new planning phase
          ...(state.planningMode === 'sequential' ? { sequentialDraft: buildSequentialDraft(playersWithReadyReset) } : {}),
        },
      };
    });
  },

  // ============================================
  // PHASE 4: Hybrid Auction Draft
  // ============================================

  draftPickEngineer: (playerId: string, engineerId: string) => {
    set((state) => {
      const { draftOrder, draftPhase, currentDraftPickerIndex, engineerPool, personaPool } = state.roundState;

      // Verify it's the generic-draft sub-phase
      if (draftPhase !== 'generic-draft') return state;

      // Verify it's this player's turn
      const pickerIndex = currentDraftPickerIndex ?? 0;
      if (draftOrder[pickerIndex] !== playerId) return state;

      // Find the engineer in the pool
      const engineer = engineerPool.find(e => e.id === engineerId);
      if (!engineer) return state;

      // Find the player
      const player = state.players.find(p => p.id === playerId);
      if (!player) return state;

      // Calculate hire cost (base salary with discounts)
      let hireCost = engineer.baseSalary;

      // LEADER PASSIVE: lean-efficiency (Silica Su) - hiring costs -$5
      if (player.leader?.leaderSide.passive.id === 'lean-efficiency') {
        hireCost = Math.max(0, hireCost - 5);
      }

      // Apply Bootstrapped "Lean Team" power: 20% discount on hire costs
      if (player.strategy?.funding === 'bootstrapped') {
        hireCost = Math.round(hireCost * 0.8);
      }

      // Check if player can afford
      if (player.resources.money < hireCost) return state;

      // Create hired engineer
      const hiredEngineer: HiredEngineer = {
        ...engineer,
        playerId,
        salaryPaid: hireCost,
        hasAiAugmentation: false,
        roundsRetained: 1,
      };

      // Remove engineer from pool
      const updatedPool = engineerPool.filter(e => e.id !== engineerId);

      // Update player
      const updatedPlayers = state.players.map(p => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          resources: {
            ...p.resources,
            money: p.resources.money - hireCost,
          },
          engineers: [...p.engineers, hiredEngineer],
        };
      });

      // Advance to the next player in draft order
      const nextPickerIndex = pickerIndex + 1;

      // Check if all players have picked (one pick per player per cycle, single cycle)
      const allPicked = nextPickerIndex >= draftOrder.length;
      // Also check if no generic engineers remain
      const noEngineersLeft = updatedPool.length === 0;

      if (allPicked || noEngineersLeft) {
        // Generic draft is done - check for persona cards to auction
        if (personaPool.length > 0) {
          // Transition to persona auction sub-phase
          // Auto-start auction for first persona card
          const firstPersona = personaPool[0];
          const biddingOrder = [...updatedPlayers]
            .sort((a, b) => a.metrics.mau - b.metrics.mau)
            .map(p => p.id);

          const auctionState: PersonaAuctionState = {
            personaCard: firstPersona,
            currentBid: 10,
            currentBidderId: undefined,
            passedPlayers: [],
            biddingOrder,
            currentBidderIndex: 0,
            isComplete: false,
          };

          return {
            players: updatedPlayers,
            roundState: {
              ...state.roundState,
              engineerPool: updatedPool,
              draftPhase: 'persona-auction' as DraftPhase,
              currentDraftPickerIndex: nextPickerIndex,
              personaAuction: auctionState,
            },
          };
        }

        // No personas either - draft is complete, transition to planning
        const playersWithReadyReset = updatedPlayers.map(p => ({
          ...p,
          isReady: false,
        }));

        // CS Intern Safety Net: Ensure every player has at least one engineer
        for (let i = 0; i < playersWithReadyReset.length; i++) {
          const p = playersWithReadyReset[i];
          if (p.engineers.length === 0) {
            const intern = generateIntern();
            let internCost = Math.min(5, p.resources.money);
            if (p.strategy?.funding === 'bootstrapped') {
              internCost = Math.round(internCost * 0.8);
            }
            playersWithReadyReset[i] = {
              ...p,
              resources: { ...p.resources, money: p.resources.money - internCost },
              engineers: [{
                ...intern,
                playerId: p.id,
                salaryPaid: internCost,
                hasAiAugmentation: false,
                roundsRetained: 1,
              }],
            };
          }
        }

        return {
          players: playersWithReadyReset,
          phase: 'action-draft' as GamePhase,
          roundState: {
            ...state.roundState,
            engineerPool: updatedPool,
            draftPhase: 'complete' as DraftPhase,
            currentDraftPickerIndex: nextPickerIndex,
            phase: 'action-draft' as GamePhase,
            currentBids: new Map(),
            occupiedActions: new Map(),
            ...(state.planningMode === 'sequential' ? { sequentialDraft: buildSequentialDraft(playersWithReadyReset) } : {}),
          },
        };
      }

      // Draft continues - next player picks
      return {
        players: updatedPlayers,
        roundState: {
          ...state.roundState,
          engineerPool: updatedPool,
          currentDraftPickerIndex: nextPickerIndex,
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
        // Cap to player count since slots track unique players
        const effectiveMax = Math.min(actionSpace.maxWorkers, state.players.length);

        // If this player isn't already on this action, check if there's room
        if (!playersOnAction.has(playerId) && playersOnAction.size >= effectiveMax) {
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
    // Check if any player has optimize action - if so, go to sprint mini-game
    const state = get();
    const hasOptimize = state.players.some((p) =>
      p.plannedActions.some((a) => a.actionType === 'optimize-code')
    );

    set({
      phase: hasOptimize ? 'sprint' : 'resolution',
      roundState: {
        ...state.roundState,
        phase: hasOptimize ? 'sprint' : 'resolution',
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

  // ============================================
  // SPRINT MINI-GAME (Push-Your-Luck)
  // ============================================

  startSprint: () => {
    const state = get();
    const tokenBag = createSprintBag();
    const drawOrder = state.players.map(p => p.id);

    const playerStates: SprintPlayerState[] = state.players.map(player => {
      const optimizeCount = player.plannedActions.filter(
        a => a.actionType === 'optimize-code'
      ).length;
      const isParticipant = optimizeCount > 0;

      // Check if player has any backend specialty engineers
      const hasBackendRevert = player.engineers.some(
        e => e.specialty === 'backend'
      );

      return {
        playerId: player.id,
        drawnTokens: [],
        cleanCodeTotal: 0,
        bugCount: 0,
        hasCrashed: false,
        hasStopped: false,
        maxDraws: isParticipant ? getMaxDraws(optimizeCount) : 1,
        hasBackendRevert,
        usedBackendRevert: false,
        isParticipant,
      };
    });

    set({
      phase: 'sprint' as GamePhase,
      roundState: {
        ...state.roundState,
        phase: 'sprint' as GamePhase,
        sprintState: {
          tokenBag,
          playerStates,
          currentPlayerIndex: 0,
          isComplete: false,
          drawOrder,
        },
      },
    });
  },

  drawSprintToken: (playerId: string) => {
    set((state) => {
      const sprintState = state.roundState.sprintState;
      if (!sprintState || sprintState.isComplete) return state;

      const playerIndex = sprintState.playerStates.findIndex(
        ps => ps.playerId === playerId
      );
      if (playerIndex === -1) return state;

      const playerState = sprintState.playerStates[playerIndex];

      // Can't draw if done
      if (playerState.hasStopped || playerState.hasCrashed ||
          playerState.drawnTokens.length >= playerState.maxDraws) {
        return state;
      }

      // Can't draw if bag is empty
      if (sprintState.tokenBag.length === 0) return state;

      // Pop a token from the bag
      const newBag = [...sprintState.tokenBag];
      const token = newBag.pop()!;

      // Update player state
      const newPlayerState = { ...playerState };
      newPlayerState.drawnTokens = [...playerState.drawnTokens, token];

      if (token.isBug) {
        // Check for backend revert
        if (newPlayerState.hasBackendRevert && !newPlayerState.usedBackendRevert) {
          newPlayerState.usedBackendRevert = true;
          // Don't count the bug - reverted
        } else {
          newPlayerState.bugCount += token.isCritical ? 2 : 1;
        }

        if (newPlayerState.bugCount >= 3) {
          newPlayerState.hasCrashed = true;
        }
      } else {
        newPlayerState.cleanCodeTotal += token.value;
      }

      // Update player states array
      const newPlayerStates = sprintState.playerStates.map((ps, i) =>
        i === playerIndex ? newPlayerState : ps
      );

      // Check if current player is done and advance
      const isDone = newPlayerState.hasCrashed ||
                     newPlayerState.hasStopped ||
                     newPlayerState.drawnTokens.length >= newPlayerState.maxDraws;

      let newCurrentIndex = sprintState.currentPlayerIndex;
      let isComplete: boolean = sprintState.isComplete;

      if (isDone) {
        const result = findNextSprintPlayer(newPlayerStates, sprintState.currentPlayerIndex);
        newCurrentIndex = result.index;
        isComplete = result.allDone;
      }

      return {
        roundState: {
          ...state.roundState,
          sprintState: {
            ...sprintState,
            tokenBag: newBag,
            playerStates: newPlayerStates,
            currentPlayerIndex: newCurrentIndex,
            isComplete,
          },
        },
      };
    });
  },

  stopSprint: (playerId: string) => {
    set((state) => {
      const sprintState = state.roundState.sprintState;
      if (!sprintState || sprintState.isComplete) return state;

      const playerIndex = sprintState.playerStates.findIndex(
        ps => ps.playerId === playerId
      );
      if (playerIndex === -1) return state;

      const newPlayerStates = sprintState.playerStates.map((ps, i) =>
        i === playerIndex ? { ...ps, hasStopped: true } : ps
      );

      // Advance to next non-done player
      const result = findNextSprintPlayer(newPlayerStates, sprintState.currentPlayerIndex);

      return {
        roundState: {
          ...state.roundState,
          sprintState: {
            ...sprintState,
            playerStates: newPlayerStates,
            currentPlayerIndex: result.index,
            isComplete: result.allDone,
          },
        },
      };
    });
  },

  endSprint: () => {
    set((state) => {
      const sprintState = state.roundState.sprintState;
      if (!sprintState) return state;

      // Find best non-crashed total
      const nonCrashedTotals = sprintState.playerStates
        .filter(ps => !ps.hasCrashed)
        .map(ps => ps.cleanCodeTotal);
      const bestTotal = nonCrashedTotals.length > 0 ? Math.max(...nonCrashedTotals) : 0;

      // Apply effects to each player
      const updatedPlayers = state.players.map(player => {
        const ps = sprintState.playerStates.find(s => s.playerId === player.id);
        if (!ps) return player;

        const effectiveTotal = ps.hasCrashed ? 0 : ps.cleanCodeTotal;
        const debtReduction = getSprintDebtReduction(effectiveTotal);
        const ratingBonus = getSprintRatingBonus(effectiveTotal, bestTotal);

        return {
          ...player,
          resources: {
            ...player.resources,
            techDebt: Math.max(0, player.resources.techDebt - debtReduction),
          },
          metrics: {
            ...player.metrics,
            rating: Math.min(10, player.metrics.rating + ratingBonus),
          },
        };
      });

      return {
        players: updatedPlayers,
        phase: 'resolution' as GamePhase,
        roundState: {
          ...state.roundState,
          phase: 'resolution' as GamePhase,
        },
      };
    });
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
              money: p.resources.money + (bonus.extraRevenue || 0),
            },
          };
        });
      }

      // Resolve each player's actions using INTEGER POWER SYSTEM
      for (let i = 0; i < updatedPlayers.length; i++) {
        const player = updatedPlayers[i];
        let newResources = { ...player.resources };
        let newMetrics = { ...player.metrics };
        let newProduction = { ...player.productionTracks };
        let hasRecruiterBonus = player.hasRecruiterBonus;
        let ipoBonusScore = player.ipoBonusScore || 0;
        let newMarketingStarBonus = player.marketingStarBonus;
        let newRecurringRevenue = player.recurringRevenue;
        let newBuffer = { ...player.techDebtBuffer, tokens: [...player.techDebtBuffer.tokens] };

        // Determine the last action for "night-owl" trait bonus
        const lastActionIndex = player.plannedActions.length - 1;

        // Track if costs have already been paid for each action type this resolution
        const costsPaid = new Set<string>();

        for (let actionIndex = 0; actionIndex < player.plannedActions.length; actionIndex++) {
          const action = player.plannedActions[actionIndex];
          const engineer = player.engineers.find(
            (e) => e.id === action.engineerId
          );
          if (!engineer) continue;

          const actionSpace = getActionSpace(action.actionType);

          // ============================================
          // CALCULATE TOTAL POWER (integer sum)
          // ============================================

          // Check for AI Skeptic trait - cannot use AI augmentation
          let useAi = action.useAiAugmentation;
          if (engineer.trait === 'ai-skeptic') {
            useAi = false;
          }

          // Start with base power (integer: intern=1, junior=2, senior=4)
          let totalPower = engineer.power;

          // AI augmentation: flat +2 power
          if (useAi) {
            totalPower += AI_POWER_BONUS;
          }

          // Specialty bonus: flat +1 power if matching
          const specialtyBonus = getSpecialtyBonus(
            engineer.specialty,
            action.actionType
          );
          totalPower += specialtyBonus;

          // ENGINEER TRAIT BONUSES (flat +1 power each)
          // Equity-Hungry: +1 power if retained 2+ rounds
          if (engineer.trait === 'equity-hungry' && engineer.roundsRetained >= 2) {
            totalPower += 1;
          }

          // Night-Owl: +1 power on last action assigned each round
          if (engineer.trait === 'night-owl' && actionIndex === lastActionIndex) {
            totalPower += 1;
          }

          // LEADER PASSIVE: enterprise-culture (William Doors) - +1 power on Develop Features
          if (player.leader?.leaderSide.passive.id === 'enterprise-culture' &&
              action.actionType === 'develop-features') {
            totalPower += 1;
          }

          // PERSONA ENGINEER TRAIT: Flat Hierarchy - +2 power if only engineer on action
          if (engineer.isPersona && engineer.personaTrait?.name === 'Flat Hierarchy') {
            const engineersOnSameAction = player.plannedActions.filter(
              a => a.actionType === action.actionType
            ).length;
            if (engineersOnSameAction === 1) {
              totalPower += 2;
            }
          }

          // PERSONA TRAIT: Volatile (Elom eng) - +2 power on Research AI, AI +1 extra debt
          if (engineer.isPersona && engineer.personaTrait?.name === 'Volatile') {
            if (action.actionType === 'research-ai') {
              totalPower += 2;
            }
            if (useAi) {
              newBuffer.tokens.push(randomTokenColor()); // Extra debt token from volatile AI usage
            }
          }

          // PERSONA TRAIT: Researcher (Lora eng) - no specialty bonus on non-AI, double on AI
          if (engineer.isPersona && engineer.personaTrait?.name === 'Researcher') {
            if (action.actionType === 'research-ai') {
              totalPower += specialtyBonus; // Double the specialty bonus (already added once above)
            } else {
              totalPower -= specialtyBonus; // Remove the specialty bonus for non-AI actions
            }
          }

          // PERSONA TRAIT: Parallel Processor (Jensen eng) - Research AI gives +1 server capacity
          if (engineer.isPersona && engineer.personaTrait?.name === 'Parallel Processor') {
            if (action.actionType === 'research-ai') {
              newResources.serverCapacity += 1;
            }
          }

          // PERSONA TRAIT: Alignment Researcher (Sam eng) - +2 power Research AI, -1 if AI Capacity > 6
          if (engineer.isPersona && engineer.personaTrait?.name === 'Alignment Researcher') {
            if (action.actionType === 'research-ai') {
              totalPower += 2;
            }
            if (newResources.aiCapacity > 6) {
              totalPower = Math.max(0, totalPower - 1);
            }
          }

          // PERSONA TRAIT: Protocol Purist (Jack eng) - +1 power on Pay Down Debt
          if (engineer.isPersona && engineer.personaTrait?.name === 'Protocol Purist') {
            if (action.actionType === 'pay-down-debt') {
              totalPower += 1;
            }
          }

          // PERSONA TRAIT: Resilience Architect (Brian eng) - +1 power on Upgrade Servers
          if (engineer.isPersona && engineer.personaTrait?.name === 'Resilience Architect') {
            if (action.actionType === 'upgrade-servers') {
              totalPower += 1;
            }
          }

          // TECH DEBT POWER PENALTY (integer: -1 per 4 debt)
          const currentDebtLevel = getTechDebtLevel(newResources.techDebt);
          if (action.actionType !== 'pay-down-debt') {
            totalPower = Math.max(0, totalPower + currentDebtLevel.powerPenalty);
          }

          // Generate tech debt from AI usage
          if (useAi) {
            let aiDebt = getAiDebt(engineer.level);
            // AI-first strategy: 50% less debt (round up)
            if (player.strategy?.tech === 'ai-first') {
              aiDebt = Math.ceil(aiDebt * 0.5);
            }
            // LEADER PASSIVE: efficient-ai (Lora Page) - AI generates 50% less debt (ceil)
            if (player.leader?.leaderSide.passive.id === 'efficient-ai') {
              aiDebt = Math.ceil(aiDebt * 0.5);
            }
            // LEADER PASSIVE: alignment-tax (Sam Chatman) - AI generates NO debt, but -1 rating
            if (player.leader?.leaderSide.passive.id === 'alignment-tax') {
              aiDebt = 0;
              newMetrics.rating = Math.max(1, newMetrics.rating - 1);
            }
            // PERSONA TRAIT: Decentralist (Satoshi eng) - AI debt halved for this engineer
            if (engineer.isPersona && engineer.personaTrait?.name === 'Decentralist') {
              aiDebt = Math.ceil(aiDebt * 0.5);
            }
            // PERSONA TRAIT: Admiral's Discipline (Grace eng) - assigned action generates 0 tech debt
            if (engineer.isPersona && engineer.personaTrait?.name === "Admiral's Discipline") {
              aiDebt = 0;
            }
            // Route AI debt through buffer as colored tokens
            for (let d = 0; d < aiDebt; d++) {
              newBuffer.tokens.push(randomTokenColor());
            }
            // Flush buffer when full: cascade adds to techDebt integer
            while (newBuffer.tokens.length >= newBuffer.maxSize) {
              newBuffer.tokens.splice(0, newBuffer.maxSize);
              newResources.techDebt += TECH_DEBT_BUFFER_SIZE;
            }
          }

          // ============================================
          // APPLY ACTION EFFECTS (using integer power)
          // ============================================

          // PERSONA TRAIT: Community Manager (Whitney eng) - track rating before action
          const ratingBeforeAction = newMetrics.rating;
          const hasCommunityManager = engineer.isPersona && engineer.personaTrait?.name === 'Community Manager';

          // PERSONA TRAIT: Admiral's Discipline (Grace eng) - track debt before action
          const debtBeforeAction = newResources.techDebt;
          const hasAdmiralsDiscipline = engineer.isPersona && engineer.personaTrait?.name === "Admiral's Discipline";

          switch (action.actionType) {
            case 'develop-features': {
              // +100 MAU per power point
              const mauGain = (actionSpace.effect.mauChange || 100) * totalPower;
              newMetrics.mau += mauGain;
              // Move MAU production track +1 (once per action, not per engineer)
              if (!costsPaid.has('develop-features-production')) {
                newProduction.mauProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
                  newProduction.mauProduction + (actionSpace.effect.mauProductionDelta || 0)
                );
                costsPaid.add('develop-features-production');
              }
              // PERSONA TRAIT: Process Optimizer - Develop Features gives +1 Rev Production
              if (engineer.isPersona && engineer.personaTrait?.name === 'Process Optimizer') {
                newProduction.revenueProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
                  newProduction.revenueProduction + 1
                );
              }
              // PERSONA TRAIT: Perfectionist (Steeve eng) - Develop Features +1 rating, -200 MAU
              if (engineer.isPersona && engineer.personaTrait?.name === 'Perfectionist') {
                newMetrics.rating = Math.min(10, newMetrics.rating + 1);
                newMetrics.mau = Math.max(0, newMetrics.mau - 200);
              }
              break;
            }

            case 'optimize-code': {
              // GRID REDESIGN STUB: Each power point = 1 swap on the grid
              // (swap 2 adjacent tokens' positions to rearrange patterns).
              // TODO: Add interactive swap UI — player picks pairs of adjacent
              //       cells to swap, up to `totalPower` swaps per action.
              //       Requires a modal/overlay showing the grid with swap targets.

              // Keep existing tech debt reduction — still useful in grid system
              newResources.techDebt = Math.max(0, newResources.techDebt - 1);
              // +1 rating (integer), or +2 with double-optimize leader passive (Grace Debugger)
              let optimizeRating = actionSpace.effect.ratingChange || 0;
              if (player.leader?.leaderSide.passive.id === 'double-optimize') {
                optimizeRating = 2; // +2 rating instead of +1
              }
              newMetrics.rating = Math.min(10, newMetrics.rating + optimizeRating);
              break;
            }

            case 'pay-down-debt': {
              // Guaranteed -2 debt per engineer
              let debtReduction = 2;
              // PERSONA TRAIT: Optimizer - Pay Down Debt removes 1 extra debt
              if (engineer.isPersona && engineer.personaTrait?.name === 'Optimizer') {
                debtReduction += 1;
              }
              // Clear from buffer first, then from techDebt integer
              for (let r = 0; r < debtReduction; r++) {
                if (newBuffer.tokens.length > 0) {
                  newBuffer.tokens.pop();
                } else {
                  newResources.techDebt = Math.max(0, newResources.techDebt - 1);
                }
              }
              break;
            }

            case 'upgrade-servers':
              // Pay cost once per action type
              if (!costsPaid.has('upgrade-servers')) {
                if (newResources.money >= 10) {
                  newResources.money -= 10;
                  costsPaid.add('upgrade-servers');
                } else {
                  break; // Can't afford
                }
              }
              // +5 server capacity (flat, not scaled by power for infrastructure)
              newResources.serverCapacity += 5;
              // Grid redesign: also expand the code grid
              if (player.codeGrid.expansionLevel < 2) {
                const expanded = expandGrid(player.codeGrid);
                if (expanded) {
                  player.codeGrid = expanded;
                }
              }
              break;

            case 'research-ai': {
              // Pay cost once per action type
              if (!costsPaid.has('research-ai')) {
                if (newResources.money >= 15) {
                  newResources.money -= 15;
                  costsPaid.add('research-ai');
                } else {
                  break; // Can't afford
                }
              }
              // +2 AI capacity (flat)
              newResources.aiCapacity += 2;
              // LEADER PASSIVE: gpu-royalties (Jensen Wattson) - Research AI gives +1 AI capacity
              if (player.leader?.leaderSide.passive.id === 'gpu-royalties') {
                newResources.aiCapacity += 1;
              }
              // Grid redesign: advance AI research level (0 → 1 → 2)
              if (player.aiResearchLevel < 2) {
                player.aiResearchLevel = (player.aiResearchLevel + 1) as AIResearchLevel;
              }
              break;
            }

            case 'marketing': {
              // GRID REDESIGN STUB: Marketing action redesign
              // TODO: New cost: $2-3 (down from $10-20)
              // TODO: New effect: +1 star bonus on next published app
              //       (store as player.marketingStarBonus or similar field)
              // TODO: Remove MAU-based logic below once grid system is complete

              // Pay cost once per action type
              const marketingCost = hasAbility(player, 'marketing-discount') ? 10 : 20;
              if (!costsPaid.has('marketing')) {
                if (newResources.money >= marketingCost) {
                  newResources.money -= marketingCost;
                  costsPaid.add('marketing');
                } else {
                  break; // Can't afford
                }
              }
              // +200 MAU per power, scaled by rating
              let mauGain = (actionSpace.effect.mauChange || 200) * totalPower;
              // VC-Heavy funding: +2 power bonus for marketing
              if (player.strategy?.funding === 'vc-heavy') {
                mauGain += (actionSpace.effect.mauChange || 200) * 2;
              }
              // Scale with rating (rating/5 as a simple integer-friendly scaling)
              mauGain = Math.round(mauGain * newMetrics.rating / 5);
              newMetrics.mau += mauGain;
              // +1 rating from marketing
              newMetrics.rating = Math.min(
                10,
                newMetrics.rating + (actionSpace.effect.ratingChange || 0)
              );
              // LEADER PASSIVE: trust-safety (Whitney Buzz Herd) - Marketing gives +1 extra rating
              if (player.leader?.leaderSide.passive.id === 'trust-safety') {
                newMetrics.rating = Math.min(10, newMetrics.rating + 1);
              }
              // PERSONA TRAIT: Growth Hacker or Content Algorithm - Marketing gives +1 MAU Production
              if (engineer.isPersona &&
                  (engineer.personaTrait?.name === 'Growth Hacker' ||
                   engineer.personaTrait?.name === 'Content Algorithm')) {
                newProduction.mauProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
                  newProduction.mauProduction + 1
                );
              }

              // GRID REDESIGN: Corporation-type marketing effects
              if (player.corporationStyle === 'agency' || !player.corporationStyle) {
                // Agency: +1 star bonus (consumed when publishing an app)
                newMarketingStarBonus += 1;
              } else if (player.corporationStyle === 'product') {
                // Product: advance MAU production track by 1
                newProduction.mauProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
                  newProduction.mauProduction + 1
                );
              }

              break;
            }

            case 'monetization': {
              // GRID REDESIGN STUB: Monetization action redesign
              // TODO: New effect: Gain $1 per total star across all published apps
              //       e.g. const totalStars = player.publishedApps.reduce((s, a) => s + a.stars, 0);
              //       newResources.money += totalStars;
              // TODO: Remove MAU/revenue-based logic below once grid system is complete

              // Revenue scales with MAU and power
              let revenue = Math.round(
                (actionSpace.effect.revenueChange || 300) * totalPower * (newMetrics.mau / 1000)
              );
              // Apply revenue-boost ability (+20%)
              if (hasAbility(player, 'revenue-boost')) {
                revenue = Math.round(revenue * 1.2);
              }
              // PERSONA TRAIT: Enterprise Sales - Monetization gives +$5 flat bonus
              if (engineer.isPersona && engineer.personaTrait?.name === 'Enterprise Sales') {
                revenue += 5;
              }
              newMetrics.revenue += revenue;
              // -1 rating from monetization (integer)
              newMetrics.rating = Math.max(
                1,
                newMetrics.rating + (actionSpace.effect.ratingChange || 0)
              );
              // Move revenue production track +1
              if (!costsPaid.has('monetization-production')) {
                newProduction.revenueProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
                  newProduction.revenueProduction + (actionSpace.effect.revenueProductionDelta || 0)
                );
                costsPaid.add('monetization-production');
              }
              // LEADER PASSIVE: saas-compounding (Marc Cloudoff) - Monetization gives +1 Rev Production
              if (player.leader?.leaderSide.passive.id === 'saas-compounding') {
                newProduction.revenueProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
                  newProduction.revenueProduction + 1
                );
              }
              // PERSONA TRAIT: Monetizer (Susan eng) - Monetization gives +1 Rev Production
              if (engineer.isPersona && engineer.personaTrait?.name === 'Monetizer') {
                newProduction.revenueProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
                  newProduction.revenueProduction + 1
                );
              }

              // GRID REDESIGN: Corporation-type monetization effects
              if (player.corporationStyle === 'agency' || !player.corporationStyle) {
                // Agency: earn $1 per star across all published apps
                const totalStars = player.publishedApps.reduce((sum, app) => sum + app.stars, 0);
                newResources.money += totalStars;
              } else if (player.corporationStyle === 'product') {
                // Product: +1 recurring revenue ($1 more per round from now on)
                newRecurringRevenue += 1;
              }

              break;
            }

            case 'hire-recruiter':
              if (!costsPaid.has('hire-recruiter')) {
                if (newResources.money >= 25) {
                  newResources.money -= 25;
                  hasRecruiterBonus = true;
                  costsPaid.add('hire-recruiter');
                }
              }
              break;

            // ============================================
            // LATE-GAME ACTIONS (Round 3-4)
            // ============================================
            case 'go-viral':
              if (!costsPaid.has('go-viral') && newResources.money >= 15 && state.currentRound >= 3) {
                newResources.money -= 15;
                costsPaid.add('go-viral');
                // 50% chance of success
                if (Math.random() < 0.5) {
                  let viralGain = 3000;
                  if (hasAbility(player, 'viral-boost')) {
                    viralGain = Math.round(viralGain * 1.5);
                  }
                  newMetrics.mau += viralGain;
                  // +2 MAU production on success
                  newProduction.mauProduction = Math.min(
                    PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
                    newProduction.mauProduction + (actionSpace.effect.mauProductionDelta || 0)
                  );
                } else {
                  newMetrics.mau = Math.max(0, newMetrics.mau - 1000);
                }
              }
              break;

            case 'ipo-prep':
              if (!costsPaid.has('ipo-prep') && newResources.money >= 50 && state.currentRound >= 4) {
                newResources.money -= 50;
                ipoBonusScore = 25;
                costsPaid.add('ipo-prep');
              }
              break;

            case 'acquisition-target':
              if (!costsPaid.has('acquisition-target') && state.currentRound >= 4) {
                const acquisitionScore = Math.round(newMetrics.mau * 0.002);
                ipoBonusScore += acquisitionScore;
                newMetrics.mau = Math.round(newMetrics.mau * 0.5);
                costsPaid.add('acquisition-target');
              }
              break;
          }

          // PERSONA TRAIT: Community Manager (Whitney eng) - rating cannot decrease from assigned action
          if (hasCommunityManager && newMetrics.rating < ratingBeforeAction) {
            newMetrics.rating = ratingBeforeAction;
          }

          // PERSONA TRAIT: Admiral's Discipline (Grace eng) - action generates 0 tech debt
          if (hasAdmiralsDiscipline && newResources.techDebt > debtBeforeAction) {
            newResources.techDebt = debtBeforeAction;
          }

          // LEADER PASSIVE: hype-machine (Elom Tusk) - +500 MAU any action, ±200 variance
          if (player.leader?.leaderSide.passive.id === 'hype-machine') {
            const variance = Math.floor(Math.random() * 401) - 200; // -200 to +200
            newMetrics.mau = Math.max(0, newMetrics.mau + 500 + variance);
          }
        }

        // Apply tech debt production penalties
        const finalDebtLevel = getTechDebtLevel(newResources.techDebt);
        if (finalDebtLevel.ratingPenalty !== 0) {
          newMetrics.rating = Math.max(1, Math.min(10,
            newMetrics.rating + finalDebtLevel.ratingPenalty
          ));
        }

        // Apply passive-income ability (+$5 per quarter)
        if (hasAbility(player, 'passive-income')) {
          newResources.money += 5;
        }

        // Quality-focused strategy bonus: +1 rating at end of each round
        if (player.strategy?.tech === 'quality-focused') {
          newMetrics.rating = Math.min(10, newMetrics.rating + 1);
        }

        // ============================================
        // LEADER PASSIVE EFFECTS (applied per round)
        // ============================================

        // perfectionist (Steeve Careers): +1 rating on even rounds (Q2, Q4)
        if (player.leader?.leaderSide.passive.id === 'perfectionist' && state.currentRound % 2 === 0) {
          newMetrics.rating = Math.min(10, newMetrics.rating + 1);
        }

        // ad-network (Susan Fry): +$5 income per round
        if (player.leader?.leaderSide.passive.id === 'ad-network') {
          newResources.money += 5;
        }

        // infrastructure-empire (Jess Bezos): +2 server capacity per round
        if (player.leader?.leaderSide.passive.id === 'infrastructure-empire') {
          newResources.serverCapacity += 2;
        }

        // subscriber-loyalty (Binge Hastings): +1 Rev Production if rating >= 6 at end of round
        if (player.leader?.leaderSide.passive.id === 'subscriber-loyalty' && newMetrics.rating >= 6) {
          newProduction.revenueProduction = Math.min(
            PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
            newProduction.revenueProduction + 1
          );
        }

        // PERSONA TRAIT: Philanthropist (William Doors eng) - +$5 income/round while employed
        for (const eng of player.engineers) {
          if (eng.isPersona && eng.personaTrait?.name === 'Philanthropist') {
            newResources.money += 5;
          }
        }

        // trust-safety (Whitney Buzz Herd): rating floor of 4
        if (player.leader?.leaderSide.passive.id === 'trust-safety') {
          newMetrics.rating = Math.max(4, newMetrics.rating);
        }

        // network-effects (Mark Zucker): +500 MAU when ANY player used Marketing this round
        if (player.leader?.leaderSide.passive.id === 'network-effects') {
          const anyoneUsedMarketing = updatedPlayers.some(p =>
            p.plannedActions.some(a => a.actionType === 'marketing')
          );
          if (anyoneUsedMarketing) {
            newMetrics.mau += 500;
          }
        }

        // marketplace-tax (Gabe Newdeal): +$3 per opponent who used Develop Features
        if (player.leader?.leaderSide.passive.id === 'marketplace-tax') {
          const opponentsDeveloping = updatedPlayers.filter(p =>
            p.id !== player.id && p.plannedActions.some(a => a.actionType === 'develop-features')
          ).length;
          newResources.money += opponentsDeveloping * 3;
        }

        // crisis-resilience (Brian Spare-Key): +200 MAU when opponents used Marketing or Go Viral
        if (player.leader?.leaderSide.passive.id === 'crisis-resilience') {
          const opponentsMarketed = updatedPlayers.some(p =>
            p.id !== player.id && p.plannedActions.some(a =>
              a.actionType === 'marketing' || a.actionType === 'go-viral'
            )
          );
          if (opponentsMarketed) {
            newMetrics.mau += 200;
          }
        }

        // Clamp production tracks to valid ranges
        newProduction.mauProduction = Math.max(0, Math.min(
          PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION, newProduction.mauProduction
        ));
        newProduction.revenueProduction = Math.max(0, Math.min(
          PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION, newProduction.revenueProduction
        ));

        // Clamp rating to 1-10 integer
        newMetrics.rating = Math.max(1, Math.min(10, Math.round(newMetrics.rating)));

        // Income from MAU with catch-up mechanics
        const rawIncome = Math.round(newMetrics.mau / 100);
        const incomeCap = 30 + (state.currentRound * 10);
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
          productionTracks: newProduction,
          hasRecruiterBonus,
          isReady: false,
          plannedActions: [],
          ipoBonusScore,
          marketingStarBonus: newMarketingStarBonus,
          recurringRevenue: newRecurringRevenue,
          techDebtBuffer: newBuffer,
          engineers: player.engineers.map((e) => ({
            ...e,
            assignedAction: undefined,
            hasAiAugmentation: false,
            roundsRetained: e.roundsRetained + 1,
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

        // PERSONA TRAIT: Protocol Purist (Jack eng) - immune to event debt
        const hasProtocolPurist = player.engineers.some(
          e => e.isPersona && e.personaTrait?.name === 'Protocol Purist'
        );

        // LEADER PASSIVE: immutable-ledger (Satoshi) - immune to security-breach/data-breach events
        const hasImmutableLedger = player.leader?.leaderSide.passive.id === 'immutable-ledger';
        const isDataBreach = event.type === 'security-breach';

        const isMitigated = checkMitigation(
          event,
          player.resources,
          player.metrics
        );

        // If player has a startup veteran, treat as mitigated for negative effects
        // Immutable-ledger makes data breaches fully mitigated
        const effect = (isMitigated || hasVeteran || (hasImmutableLedger && isDataBreach))
          ? event.mitigation.reducedEffect : event.effect;

        let newResources = { ...player.resources };
        let newMetrics = { ...player.metrics };
        const newBuffer = { ...player.techDebtBuffer, tokens: [...player.techDebtBuffer.tokens] };

        // Apply resource changes
        if (effect.resourceChanges) {
          // Calculate tech debt change (blocked if player has debt-immunity or Protocol Purist)
          let techDebtChange = effect.resourceChanges.techDebt || 0;
          if ((hasDebtImmunity || hasProtocolPurist) && techDebtChange > 0) {
            techDebtChange = 0; // Block positive (damaging) debt changes
          }

          // Route positive debt through buffer; negative debt reduces techDebt directly
          if (techDebtChange > 0) {
            for (let d = 0; d < techDebtChange; d++) {
              newBuffer.tokens.push(randomTokenColor());
            }
            // Flush buffer when full
            while (newBuffer.tokens.length >= newBuffer.maxSize) {
              newBuffer.tokens.splice(0, newBuffer.maxSize);
              newResources.techDebt += TECH_DEBT_BUFFER_SIZE;
            }
          } else if (techDebtChange < 0) {
            newResources.techDebt = Math.max(0, newResources.techDebt + techDebtChange);
          }

          newResources = {
            money: newResources.money + (effect.resourceChanges.money || 0),
            serverCapacity:
              newResources.serverCapacity +
              (effect.resourceChanges.serverCapacity || 0),
            aiCapacity:
              newResources.aiCapacity + (effect.resourceChanges.aiCapacity || 0),
            techDebt: newResources.techDebt,
          };
        }

        // Apply metric changes (integer rating, 1-10 scale)
        newMetrics = {
          mau: Math.max(0, newMetrics.mau + (effect.mauChange || 0)),
          revenue: Math.max(0, newMetrics.revenue + (effect.revenueChange || 0)),
          rating: Math.max(
            1,
            Math.min(10, newMetrics.rating + (effect.ratingChange || 0))
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
          newMetrics.rating = Math.max(1, newMetrics.rating - 2); // -2 rating for crash
        }

        // PERSONA TRAIT: Resilience Architect (Brian eng) - +1 server capacity on negative event
        const hasResilienceArchitect = player.engineers.some(
          e => e.isPersona && e.personaTrait?.name === 'Resilience Architect'
        );
        if (hasResilienceArchitect && !isMitigated) {
          newResources.serverCapacity += 1;
        }

        return {
          ...player,
          resources: newResources,
          metrics: newMetrics,
          techDebtBuffer: newBuffer,
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
    const currentQuarter = Math.ceil(state.currentRound / ROUNDS_PER_QUARTER);
    const nextQuarter = currentQuarter + 1;
    const nextRound = (nextQuarter - 1) * ROUNDS_PER_QUARTER + 1; // First round of next quarter

    if (nextQuarter > TOTAL_QUARTERS) {
      set({ phase: 'game-end' });
      get().calculateWinner();
      return;
    }

    // Generate new engineer pool for the new quarter
    let engineerPool = generateEngineerPool(
      nextQuarter,
      state.players.length,
      state.players.map((p) => p.hasRecruiterBonus)
    );

    // INSIDER INFO ability: Add 2 extra engineers for players with this ability
    const insiderInfoCount = state.players.filter(p => hasAbility(p, 'insider-info')).length;
    if (insiderInfoCount > 0) {
      const extraEngineers = generateEngineerPool(nextQuarter, insiderInfoCount, []);
      engineerPool = [...engineerPool, ...extraEngineers.slice(0, insiderInfoCount * 2)];
    }

    // EVENT FORECASTING: Peek at next quarter's event
    const eventDeck = [...state.eventDeck];
    const upcomingEvent = eventDeck.length > 0 ? eventDeck[eventDeck.length - 1] : undefined;

    // MARS-STYLE PRODUCTION: Produce resources based on production track positions
    // This happens at the start of each new quarter (before the draft)
    const playersAfterProduction = state.players.map((p) => {
      const debtLevel = getTechDebtLevel(p.resources.techDebt);

      // Effective production = marker position + debt penalties
      const effectiveMauProd = Math.max(0, p.productionTracks.mauProduction + debtLevel.mauProductionPenalty);
      const effectiveRevProd = Math.max(0, p.productionTracks.revenueProduction + debtLevel.revenueProductionPenalty);

      const mauGain = effectiveMauProd * PRODUCTION_CONSTANTS.MAU_PER_PRODUCTION;
      const moneyGain = effectiveRevProd * PRODUCTION_CONSTANTS.MONEY_PER_PRODUCTION;

      // Product corporation recurring revenue from committed code
      const recurringIncome = p.corporationStyle === 'product' ? p.recurringRevenue : 0;

      return {
        ...p,
        // Unassign all engineers so they're available for next quarter
        engineers: p.engineers.map(e => ({ ...e, assignedAction: undefined })),
        metrics: {
          ...p.metrics,
          mau: p.metrics.mau + mauGain,
        },
        resources: {
          ...p.resources,
          money: p.resources.money + moneyGain + recurringIncome,
        },
        hasRecruiterBonus: false, // Reset recruiter bonus
        commitCodeUsedThisRound: false, // Reset commit code flag
      };
    });

    // CATCH-UP MECHANIC: Sort players by MAU for draft order
    // Lowest MAU picks first (advantage to trailing players)
    const draftOrder = [...playersAfterProduction]
      .sort((a, b) => a.metrics.mau - b.metrics.mau)
      .map(p => p.id);

    // Phase 2: Draw persona cards for the quarter's persona pool
    const personaDrawCount = nextQuarter >= 3 ? 3 : 2; // More persona engineers in later quarters
    const { drawn: personaPool, remainingDeck: newPersonaDeck } =
      drawPersonasForRound(state.personaDeck, personaDrawCount);

    set({
      players: playersAfterProduction,
      personaDeck: newPersonaDeck,
      currentRound: nextRound,
      currentQuarter: nextQuarter,
      phase: 'engineer-draft',
      roundState: {
        roundNumber: nextRound,
        phase: 'engineer-draft',
        engineerPool,
        personaPool,
        currentBids: new Map(),
        bidResults: [],
        occupiedActions: new Map(),
        draftOrder,
        upcomingEvent, // Show next quarter's event during planning
        activeTheme: getThemeForRound(state.quarterlyThemes, nextQuarter),
        // Phase 4: Hybrid auction draft initialization
        draftPhase: 'generic-draft',
        currentDraftPickerIndex: 0,
        // Refill code pool and app market for new quarter
        codePool: generateCodePool(state.players.length),
        appMarket: state.roundState.appMarket,
      },
    });
  },

  calculateWinner: () => {
    const state = get();
    const scores = new Map<string, number>();

    for (const player of state.players) {
      let score = 0;

      if (player.corporationStyle === 'agency') {
        // Agency scoring: VP from published app stars
        for (const app of player.publishedApps) {
          score += app.vpEarned;
        }
      } else {
        // Product scoring: VP from MAU milestones (unclaimed only)
        for (const ms of MAU_MILESTONES) {
          if (
            player.metrics.mau >= ms.threshold &&
            !player.mauMilestonesClaimed.includes(ms.id)
          ) {
            score += ms.vp;
          }
        }

        // VP from committed code count: 1 VP per 2 committed codes
        score += Math.floor(player.committedCodeCount / 2);
      }

      // Both types: money conversion (1 VP per $10 remaining)
      score += Math.floor(player.resources.money / 10);

      // MILESTONE BONUSES - Add points for claimed milestones
      for (const milestone of state.milestones) {
        if (milestone.claimedBy === player.id) {
          score += milestone.bonus;
        }
      }

      // IPO / Acquisition bonus
      score += player.ipoBonusScore || 0;

      scores.set(player.id, score);
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
    const player = state.players.find(p => p.id === playerId);
    const actionSpace = getActionSpace(action);

    // Check if action is unlocked for this round
    if (actionSpace.unlocksAtRound && state.currentRound < actionSpace.unlocksAtRound) {
      return false;
    }

    // LEADER PASSIVE: immutable-ledger (Satoshi) - cannot use Marketing
    if (player?.leader?.leaderSide.passive.id === 'immutable-ledger' && action === 'marketing') {
      return false;
    }

    // If no max workers, always available
    if (actionSpace.maxWorkers === undefined) return true;

    // LEADER PASSIVE: dual-focus (Jack Blocksey) - can use two exclusive actions per round
    // Treat maxWorkers slots as +1 for this player
    const occupied = state.roundState.occupiedActions.get(action) || [];
    const hasDualFocus = player?.leader?.leaderSide.passive.id === 'dual-focus';

    // If player already has an engineer on this action, they can add more
    if (occupied.includes(playerId)) return true;

    // Dual-focus allows claiming an extra slot on exclusive actions
    // Cap to player count since slots track unique players
    const baseMax = Math.min(actionSpace.maxWorkers, state.players.length);
    const effectiveMax = hasDualFocus ? (baseMax + 1) : baseMax;

    // Otherwise check if there's room
    return occupied.length < effectiveMax;
  },

  getActionOccupancy: (action: ActionType) => {
    const state = get();
    const actionSpace = getActionSpace(action);
    const occupied = state.roundState.occupiedActions.get(action) || [];

    // Cap maxWorkers to player count (slots represent unique players, not engineers)
    const effectiveMax = actionSpace.maxWorkers !== undefined
      ? Math.min(actionSpace.maxWorkers, state.players.length)
      : undefined;

    return {
      current: occupied.length,
      max: effectiveMax,
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
  // SEQUENTIAL ACTION DRAFT (legacy — kept for backwards compatibility)
  // ============================================

  claimActionSlot: (playerId: string, engineerId: string, actionType: ActionType, useAi: boolean) => {
    const state = get();

    // -------------------------------------------------------
    // NEW: Action-Draft mode (immediate resolution)
    // -------------------------------------------------------
    if (state.phase === 'action-draft') {
      const turnState = state.roundState.turnState;
      if (!turnState) return;

      // Use the stored snake order from turnState
      const snakeOrder = turnState.snakeOrder;

      // Validate it's this player's turn
      const currentPickerId = snakeOrder[turnState.currentPlayerIndex];
      if (currentPickerId !== playerId) return;

      // Delegate to the existing assignEngineer logic (place the engineer)
      get().assignEngineer(playerId, engineerId, actionType, useAi);

      // After placing, resolve the action or start a mini-game
      if (INTERACTIVE_ACTIONS.includes(actionType)) {
        // Interactive: set turnState to mini-game and let the UI drive completion
        set((s) => {
          // For develop-features, compute token pick allowance based on specialty + AI
          let tokenPickState: TokenPickState | undefined;
          if (actionType === 'develop-features') {
            const player = s.players.find(p => p.id === playerId);
            const eng = player?.engineers.find(e => e.id === engineerId);
            const specialtyColor = eng?.specialty ? SPECIALTY_TO_COLOR[eng.specialty] : undefined;
            // Specialty match: does this engineer's specialty match develop-features?
            const hasSpecialtyMatch = !!specialtyColor && !!eng?.specialty && getSpecialtyBonus(eng.specialty, actionType) > 0;

            // Token allowance rules:
            // Base (no specialty match): 1 token of any color
            // Specialty match: CHOICE → 1 any-color OR 2 specialty-color
            // AI (no specialty match): 2 tokens of any color
            // AI + specialty match: CHOICE → 2 any-color OR 3 specialty-color
            if (hasSpecialtyMatch) {
              // Player must choose: generic (fewer, any color) vs specialty (more, locked color)
              const genericPicks = useAi ? 2 : 1;
              const specialtyPicks = useAi ? 3 : 2;
              tokenPickState = {
                maxPicks: 0,          // will be set after choice
                picksRemaining: 0,
                specialtyColor: undefined,
                useAi,
                engineerId,
                awaitingSpecialtyChoice: true,
                specialtyOption: { maxPicks: specialtyPicks, color: specialtyColor! },
                genericOption: { maxPicks: genericPicks },
              };
            } else {
              const maxPicks = useAi ? 2 : 1;
              tokenPickState = {
                maxPicks,
                picksRemaining: maxPicks,
                specialtyColor: undefined, // any color
                useAi,
                engineerId,
              };
            }
          }

          return {
            roundState: {
              ...s.roundState,
              turnState: {
                ...s.roundState.turnState!,
                phase: 'mini-game' as const,
                pendingAction: actionType,
                tokenPickState,
              },
            },
          };
        });
      } else {
        // Non-interactive: resolve the action inline immediately
        set((s) => ({
          roundState: {
            ...s.roundState,
            turnState: {
              ...s.roundState.turnState!,
              phase: 'resolving' as const,
              pendingAction: actionType,
            },
          },
        }));

        // Resolve the non-interactive action for this single engineer
        set((s) => {
          const player = s.players.find(p => p.id === playerId);
          if (!player) return s;

          const engineer = player.engineers.find(e => e.id === engineerId);
          if (!engineer) return s;

          const actionSpace = getActionSpace(actionType);

          // ---- CALCULATE TOTAL POWER (same logic as resolveActions) ----
          let effectiveUseAi = useAi;
          if (engineer.trait === 'ai-skeptic') {
            effectiveUseAi = false;
          }

          let totalPower = engineer.power;

          if (effectiveUseAi) {
            totalPower += AI_POWER_BONUS;
          }

          const specialtyBonus = getSpecialtyBonus(engineer.specialty, actionType);
          totalPower += specialtyBonus;

          // Equity-Hungry trait
          if (engineer.trait === 'equity-hungry' && engineer.roundsRetained >= 2) {
            totalPower += 1;
          }

          // Leader passive: enterprise-culture
          if (player.leader?.leaderSide.passive.id === 'enterprise-culture' &&
              actionType === 'develop-features') {
            totalPower += 1;
          }

          // Persona engineer traits affecting power
          if (engineer.isPersona && engineer.personaTrait?.name === 'Flat Hierarchy') {
            const engineersOnSameAction = player.plannedActions.filter(
              a => a.actionType === actionType
            ).length;
            if (engineersOnSameAction === 1) {
              totalPower += 2;
            }
          }
          if (engineer.isPersona && engineer.personaTrait?.name === 'Volatile') {
            if (actionType === 'research-ai') totalPower += 2;
          }
          if (engineer.isPersona && engineer.personaTrait?.name === 'Researcher') {
            if (actionType === 'research-ai') {
              totalPower += specialtyBonus; // double specialty
            } else {
              totalPower -= specialtyBonus; // remove specialty for non-AI
            }
          }
          if (engineer.isPersona && engineer.personaTrait?.name === 'Alignment Researcher') {
            if (actionType === 'research-ai') totalPower += 2;
            if (player.resources.aiCapacity > 6) totalPower = Math.max(0, totalPower - 1);
          }
          if (engineer.isPersona && engineer.personaTrait?.name === 'Protocol Purist') {
            if (actionType === 'pay-down-debt') totalPower += 1;
          }
          if (engineer.isPersona && engineer.personaTrait?.name === 'Resilience Architect') {
            if (actionType === 'upgrade-servers') totalPower += 1;
          }

          // Tech debt power penalty
          const currentDebtLevel = getTechDebtLevel(player.resources.techDebt);
          if (actionType !== 'pay-down-debt') {
            totalPower = Math.max(0, totalPower + currentDebtLevel.powerPenalty);
          }

          // ---- BUILD UPDATED PLAYER STATE ----
          let newResources = { ...player.resources };
          let newMetrics = { ...player.metrics };
          let newProduction = { ...player.productionTracks };
          let newMarketingStarBonus = player.marketingStarBonus;
          let newRecurringRevenue = player.recurringRevenue;
          let newTechDebtBuffer = { ...player.techDebtBuffer, tokens: [...player.techDebtBuffer.tokens] };

          // Generate tech debt from AI usage
          if (effectiveUseAi) {
            let aiDebt = getAiDebt(engineer.level);
            if (player.strategy?.tech === 'ai-first') {
              aiDebt = Math.ceil(aiDebt * 0.5);
            }
            if (player.leader?.leaderSide.passive.id === 'efficient-ai') {
              aiDebt = Math.ceil(aiDebt * 0.5);
            }
            if (player.leader?.leaderSide.passive.id === 'alignment-tax') {
              aiDebt = 0;
              newMetrics.rating = Math.max(1, newMetrics.rating - 1);
            }
            if (engineer.isPersona && engineer.personaTrait?.name === 'Decentralist') {
              aiDebt = Math.ceil(aiDebt * 0.5);
            }
            if (engineer.isPersona && engineer.personaTrait?.name === "Admiral's Discipline") {
              aiDebt = 0;
            }
            // Volatile trait: AI usage adds +1 extra debt token
            if (engineer.isPersona && engineer.personaTrait?.name === 'Volatile' && effectiveUseAi) {
              newTechDebtBuffer.tokens.push(randomTokenColor());
            }
            // Route AI debt through buffer as colored tokens
            for (let d = 0; d < aiDebt; d++) {
              newTechDebtBuffer.tokens.push(randomTokenColor());
            }
            // Flush buffer when full: cascade adds to techDebt integer
            while (newTechDebtBuffer.tokens.length >= newTechDebtBuffer.maxSize) {
              newTechDebtBuffer.tokens.splice(0, newTechDebtBuffer.maxSize);
              newResources.techDebt += TECH_DEBT_BUFFER_SIZE;
            }
          }

          // Parallel Processor: Research AI gives +1 server capacity
          if (engineer.isPersona && engineer.personaTrait?.name === 'Parallel Processor') {
            if (actionType === 'research-ai') newResources.serverCapacity += 1;
          }

          // Track for Community Manager / Admiral's Discipline
          const ratingBeforeAction = newMetrics.rating;
          const hasCommunityManager = engineer.isPersona && engineer.personaTrait?.name === 'Community Manager';
          const debtBeforeAction = newResources.techDebt;
          const hasAdmiralsDiscipline = engineer.isPersona && engineer.personaTrait?.name === "Admiral's Discipline";

          // ---- APPLY ACTION EFFECTS ----
          switch (actionType) {
            case 'pay-down-debt': {
              let debtReduction = 2;
              if (engineer.isPersona && engineer.personaTrait?.name === 'Optimizer') {
                debtReduction += 1;
              }
              // Clear from buffer first, then from techDebt integer
              for (let r = 0; r < debtReduction; r++) {
                if (newTechDebtBuffer.tokens.length > 0) {
                  newTechDebtBuffer.tokens.pop();
                } else {
                  newResources.techDebt = Math.max(0, newResources.techDebt - 1);
                }
              }
              break;
            }

            case 'upgrade-servers': {
              if (newResources.money >= 10) {
                newResources.money -= 10;
                newResources.serverCapacity += 5;
              }
              break;
            }

            case 'research-ai': {
              if (newResources.money >= 15) {
                newResources.money -= 15;
                newResources.aiCapacity += 2;
                if (player.leader?.leaderSide.passive.id === 'gpu-royalties') {
                  newResources.aiCapacity += 1;
                }
              }
              break;
            }

            case 'marketing': {
              const marketingCost = hasAbility(player, 'marketing-discount') ? 10 : 20;
              if (newResources.money >= marketingCost) {
                newResources.money -= marketingCost;
                let mauGain = (actionSpace.effect.mauChange || 200) * totalPower;
                if (player.strategy?.funding === 'vc-heavy') {
                  mauGain += (actionSpace.effect.mauChange || 200) * 2;
                }
                mauGain = Math.round(mauGain * newMetrics.rating / 5);
                newMetrics.mau += mauGain;
                newMetrics.rating = Math.min(10, newMetrics.rating + (actionSpace.effect.ratingChange || 0));
                if (player.leader?.leaderSide.passive.id === 'trust-safety') {
                  newMetrics.rating = Math.min(10, newMetrics.rating + 1);
                }
                if (engineer.isPersona &&
                    (engineer.personaTrait?.name === 'Growth Hacker' ||
                     engineer.personaTrait?.name === 'Content Algorithm')) {
                  newProduction.mauProduction = Math.min(
                    PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION, newProduction.mauProduction + 1
                  );
                }

                // GRID REDESIGN: Corporation-type marketing effects
                if (player.corporationStyle === 'agency' || !player.corporationStyle) {
                  // Agency: +1 star bonus (consumed when publishing an app)
                  newMarketingStarBonus += 1;
                } else if (player.corporationStyle === 'product') {
                  // Product: advance MAU production track by 1
                  newProduction.mauProduction = Math.min(
                    PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
                    newProduction.mauProduction + 1
                  );
                }
              }
              break;
            }

            case 'monetization': {
              let revenue = Math.round(
                (actionSpace.effect.revenueChange || 300) * totalPower * (newMetrics.mau / 1000)
              );
              if (hasAbility(player, 'revenue-boost')) {
                revenue = Math.round(revenue * 1.2);
              }
              if (engineer.isPersona && engineer.personaTrait?.name === 'Enterprise Sales') {
                revenue += 5;
              }
              newMetrics.revenue += revenue;
              newMetrics.rating = Math.max(1, newMetrics.rating + (actionSpace.effect.ratingChange || 0));
              newProduction.revenueProduction = Math.min(
                PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION,
                newProduction.revenueProduction + (actionSpace.effect.revenueProductionDelta || 0)
              );
              if (player.leader?.leaderSide.passive.id === 'saas-compounding') {
                newProduction.revenueProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION, newProduction.revenueProduction + 1
                );
              }
              if (engineer.isPersona && engineer.personaTrait?.name === 'Monetizer') {
                newProduction.revenueProduction = Math.min(
                  PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION, newProduction.revenueProduction + 1
                );
              }

              // GRID REDESIGN: Corporation-type monetization effects
              if (player.corporationStyle === 'agency' || !player.corporationStyle) {
                // Agency: earn $1 per star across all published apps
                const totalStars = player.publishedApps.reduce((sum, app) => sum + app.stars, 0);
                newResources.money += totalStars;
              } else if (player.corporationStyle === 'product') {
                // Product: +1 recurring revenue ($1 more per round from now on)
                newRecurringRevenue += 1;
              }

              break;
            }

            default:
              break;
          }

          // Post-action trait guards
          if (hasCommunityManager && newMetrics.rating < ratingBeforeAction) {
            newMetrics.rating = ratingBeforeAction;
          }
          if (hasAdmiralsDiscipline && newResources.techDebt > debtBeforeAction) {
            newResources.techDebt = debtBeforeAction;
          }

          // Leader passive: hype-machine
          if (player.leader?.leaderSide.passive.id === 'hype-machine') {
            const variance = Math.floor(Math.random() * 401) - 200;
            newMetrics.mau = Math.max(0, newMetrics.mau + 500 + variance);
          }

          // Clamp
          newProduction.mauProduction = Math.max(0, Math.min(
            PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION, newProduction.mauProduction
          ));
          newProduction.revenueProduction = Math.max(0, Math.min(
            PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION, newProduction.revenueProduction
          ));
          newMetrics.rating = Math.max(1, Math.min(10, Math.round(newMetrics.rating)));

          // Update the player in the players array
          const updatedPlayers = s.players.map(p => {
            if (p.id !== playerId) return p;
            return {
              ...p,
              resources: newResources,
              metrics: newMetrics,
              productionTracks: newProduction,
              marketingStarBonus: newMarketingStarBonus,
              recurringRevenue: newRecurringRevenue,
              techDebtBuffer: newTechDebtBuffer,
            };
          });

          return {
            players: updatedPlayers,
            roundState: {
              ...s.roundState,
              turnState: {
                ...s.roundState.turnState!,
                phase: 'free-actions' as const,
                pendingAction: undefined,
              },
            },
          };
        });

        // Auto-advance: call endTurn after immediate resolution
        get().endTurn();
      }

      return;
    }

    // -------------------------------------------------------
    // LEGACY: Sequential planning mode (kept for backwards compatibility)
    // -------------------------------------------------------
    if (state.planningMode !== 'sequential') return;

    const draft = state.roundState.sequentialDraft;
    if (!draft || draft.isComplete) return;

    // Verify it's this player's turn
    const currentPickerId = draft.pickOrder[draft.currentPickerIndex];
    if (currentPickerId !== playerId) return;

    // Delegate to the existing assignEngineer logic
    get().assignEngineer(playerId, engineerId, actionType, useAi);

    // After assigning, increment picksCompleted and advance the draft
    set((state) => {
      const currentDraft = state.roundState.sequentialDraft;
      if (!currentDraft) return state;

      return {
        roundState: {
          ...state.roundState,
          sequentialDraft: {
            ...currentDraft,
            picksCompleted: currentDraft.picksCompleted + 1,
          },
        },
      };
    });

    // Advance to the next picker
    get().advanceSequentialDraft();
  },

  advanceSequentialDraft: () => {
    set((state) => {
      const draft = state.roundState.sequentialDraft;
      if (!draft || draft.isComplete) return state;

      // Check if all engineers have been assigned across all players
      const totalUnassignedEngineers = state.players.reduce(
        (count, player) => count + player.engineers.filter(e => !e.assignedAction).length,
        0
      );

      // If no more unassigned engineers or we've hit the picks limit, complete the draft
      if (totalUnassignedEngineers === 0 || draft.picksCompleted >= draft.picksPerRound) {
        // Auto-lock all plans and move to reveal
        const playersLocked = state.players.map(p => ({
          ...p,
          isReady: true,
        }));

        return {
          players: playersLocked,
          phase: 'reveal' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'reveal' as GamePhase,
            sequentialDraft: {
              ...draft,
              isComplete: true,
            },
          },
        };
      }

      // Snake draft order: for N players, goes 0,1,...,N-1,N-1,...,1,0,0,1,...
      // The pick order array already has the full snake sequence pre-built
      // We just advance currentPickerIndex through it
      let nextIndex = draft.currentPickerIndex + 1;

      // Wrap around if we've gone past the end of the pick order
      if (nextIndex >= draft.pickOrder.length) {
        nextIndex = 0;
      }

      // Skip players who have no unassigned engineers
      let attempts = 0;
      const maxAttempts = draft.pickOrder.length;
      while (attempts < maxAttempts) {
        const nextPlayerId = draft.pickOrder[nextIndex];
        const nextPlayer = state.players.find(p => p.id === nextPlayerId);
        const hasUnassigned = nextPlayer?.engineers.some(e => !e.assignedAction);

        if (hasUnassigned) break;

        nextIndex = (nextIndex + 1) % draft.pickOrder.length;
        attempts++;
      }

      // If we couldn't find anyone with unassigned engineers, complete the draft
      if (attempts >= maxAttempts) {
        const playersLocked = state.players.map(p => ({
          ...p,
          isReady: true,
        }));

        return {
          players: playersLocked,
          phase: 'reveal' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'reveal' as GamePhase,
            sequentialDraft: {
              ...draft,
              isComplete: true,
            },
          },
        };
      }

      return {
        roundState: {
          ...state.roundState,
          sequentialDraft: {
            ...draft,
            currentPickerIndex: nextIndex,
          },
        },
      };
    });
  },

  // ============================================
  // ACTION DRAFT: Immediate Resolution Mode
  // ============================================

  startActionDraft: () => {
    set((state) => {
      const snakeOrder = buildSnakePickOrderByVP(state.players);
      return {
        phase: 'action-draft' as GamePhase,
        roundState: {
          ...state.roundState,
          phase: 'action-draft' as GamePhase,
          turnState: {
            currentPlayerIndex: 0,
            phase: 'free-actions' as const,
            snakeOrder,
          },
        },
      };
    });
  },

  endTurn: () => {
    set((state) => {
      const turnState = state.roundState.turnState;
      if (!turnState) return state;

      // Use the stored snake order from turnState (computed once per round)
      const snakeOrder = turnState.snakeOrder;

      // Count total engineers and total placed engineers
      const totalEngineers = state.players.reduce(
        (sum, p) => sum + p.engineers.length, 0
      );
      const placedEngineers = state.players.reduce(
        (sum, p) => sum + p.engineers.filter(e => e.assignedAction).length, 0
      );

      // Check if all engineers have been placed (round is complete)
      const allPlaced = placedEngineers >= totalEngineers;

      if (!allPlaced) {
        // Advance to the next player in snake order
        let nextIndex = turnState.currentPlayerIndex + 1;

        // Wrap around
        if (nextIndex >= snakeOrder.length) {
          nextIndex = 0;
        }

        // Skip players who have no unassigned engineers
        let attempts = 0;
        const maxAttempts = snakeOrder.length;
        while (attempts < maxAttempts) {
          const nextPlayerId = snakeOrder[nextIndex];
          const nextPlayer = state.players.find(p => p.id === nextPlayerId);
          const hasUnassigned = nextPlayer?.engineers.some(e => !e.assignedAction);

          if (hasUnassigned) break;

          nextIndex = (nextIndex + 1) % snakeOrder.length;
          attempts++;
        }

        // If nobody has unassigned engineers, treat as all placed
        if (attempts < maxAttempts) {
          return {
            roundState: {
              ...state.roundState,
              turnState: {
                ...turnState,
                currentPlayerIndex: nextIndex,
                phase: 'free-actions' as const,
              },
            },
          };
        }
      }

      // All engineers placed — this round of the action draft is complete.
      // Check if this is the last round of the quarter OR if code pool is depleted.
      const roundInQuarter = ((state.currentRound - 1) % ROUNDS_PER_QUARTER) + 1;
      const isLastRoundOfQuarter = roundInQuarter >= ROUNDS_PER_QUARTER;
      const isCodePoolEmpty = state.roundState.codePool.length === 0;

      if (isLastRoundOfQuarter || isCodePoolEmpty) {
        // End of quarter: go to event phase for quarterly cleanup
        return {
          phase: 'event' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'event' as GamePhase,
            turnState: undefined,
          },
        };
      } else {
        // Mid-quarter: unassign engineers, reset per-round flags, start next round
        const nextRound = state.currentRound + 1;
        const newPlayers = state.players.map(p => ({
          ...p,
          engineers: p.engineers.map(e => ({ ...e, assignedAction: undefined })),
          commitCodeUsedThisRound: false,
        }));
        const newSnakeOrder = buildSnakePickOrderByVP(newPlayers);
        return {
          currentRound: nextRound,
          players: newPlayers,
          phase: 'action-draft' as GamePhase,
          roundState: {
            ...state.roundState,
            phase: 'action-draft' as GamePhase,
            occupiedActions: new Map(),
            turnState: {
              currentPlayerIndex: 0,
              phase: 'free-actions' as const,
              snakeOrder: newSnakeOrder,
            },
          },
        };
      }
    });
  },

  completeInteractiveAction: () => {
    set((state) => {
      const turnState = state.roundState.turnState;
      if (!turnState || turnState.phase !== 'mini-game') return state;

      return {
        roundState: {
          ...state.roundState,
          turnState: {
            ...turnState,
            phase: 'free-actions' as const,
            pendingAction: undefined,
          },
        },
      };
    });
    // Auto-advance to next player after interactive action resolves
    get().endTurn();
  },

  resolveSpecialtyChoice: (_playerId: string, useSpecialty: boolean) => {
    set((state) => {
      const turnState = state.roundState.turnState;
      if (!turnState || turnState.phase !== 'mini-game') return state;
      const pickState = turnState.tokenPickState;
      if (!pickState?.awaitingSpecialtyChoice) return state;

      let maxPicks: number;
      let specialtyColor: typeof pickState.specialtyColor;
      if (useSpecialty && pickState.specialtyOption) {
        maxPicks = pickState.specialtyOption.maxPicks;
        specialtyColor = pickState.specialtyOption.color;
      } else {
        maxPicks = pickState.genericOption?.maxPicks ?? 1;
        specialtyColor = undefined;
      }

      return {
        roundState: {
          ...state.roundState,
          turnState: {
            ...turnState,
            tokenPickState: {
              ...pickState,
              maxPicks,
              picksRemaining: maxPicks,
              specialtyColor,
              awaitingSpecialtyChoice: false,
              specialtyOption: undefined,
              genericOption: undefined,
            },
          },
        },
      };
    });
  },

  placeTokenOnGrid: (playerId: string, tokenIndex: number, row: number, col: number) => {
    let finished = false;
    set((state) => {
      const turnState = state.roundState.turnState;
      if (!turnState || turnState.phase !== 'mini-game' || turnState.pendingAction !== 'develop-features') {
        return state;
      }

      const pool = state.roundState.codePool;
      if (tokenIndex < 0 || tokenIndex >= pool.length) return state;

      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return state;

      const player = state.players[playerIndex];
      const grid = player.codeGrid;
      if (row < 0 || row >= grid.cells.length || col < 0 || col >= grid.cells[0].length) return state;
      if (grid.cells[row][col] !== null) return state; // cell must be empty

      const tokenColor = pool[tokenIndex];

      // Validate color restriction from tokenPickState
      const pickState = turnState.tokenPickState;
      if (pickState?.specialtyColor && tokenColor !== pickState.specialtyColor) {
        return state; // wrong color for specialty pick
      }

      // Build updated pool (remove the token at tokenIndex)
      const newPool = [...pool];
      newPool.splice(tokenIndex, 1);

      // Build updated grid (place the token)
      const newCells = grid.cells.map(r => [...r]);
      newCells[row][col] = tokenColor;

      const updatedPlayers = state.players.map((p, i) => {
        if (i !== playerIndex) return p;
        return {
          ...p,
          codeGrid: { ...p.codeGrid, cells: newCells },
        };
      });

      // Check if more picks remain
      const newPicksRemaining = pickState ? pickState.picksRemaining - 1 : 0;
      const isDone = newPicksRemaining <= 0 || newPool.length === 0;

      if (isDone) {
        finished = true;
        // All picks used or pool empty — return to free-actions
        return {
          players: updatedPlayers,
          roundState: {
            ...state.roundState,
            codePool: newPool,
            turnState: {
              ...turnState,
              phase: 'free-actions' as const,
              pendingAction: undefined,
              tokenPickState: undefined,
            },
          },
        };
      } else {
        // More picks remaining — stay in mini-game
        return {
          players: updatedPlayers,
          roundState: {
            ...state.roundState,
            codePool: newPool,
            turnState: {
              ...turnState,
              tokenPickState: pickState ? {
                ...pickState,
                picksRemaining: newPicksRemaining,
              } : undefined,
            },
          },
        };
      }
    });
    // Auto-advance to next player after all tokens placed
    if (finished) {
      get().endTurn();
    }
  },

  // ============================================
  // GRID REDESIGN: APP & CODE ACTIONS
  // ============================================

  publishApp: (playerId: string, cardId: string, row: number, col: number) => {
    const state = get();
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    const player = state.players[playerIndex];

    // Find the card in player's hand
    const cardIndex = player.heldAppCards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;
    const card = player.heldAppCards[cardIndex];

    // Count matched tokens at the given position, plus marketing star bonus
    const baseMatched = matchPatternAtPosition(player.codeGrid, card.pattern, row, col);
    const matched = baseMatched + (player.marketingStarBonus || 0);
    const stars = getStarRating(card, matched);

    // Calculate VP and money based on star fraction
    const vpEarned = Math.max(1, Math.floor(card.maxVP * (stars / 5)));
    const moneyEarned = Math.floor(card.maxMoney * (stars / 5));

    // Clear matched pattern cells from grid
    const newGrid = clearPatternFromGrid(player.codeGrid, card.pattern, row, col);

    // Remove card from hand
    const newHeldCards = [...player.heldAppCards];
    newHeldCards.splice(cardIndex, 1);

    const publishedApp = {
      cardId: card.id,
      name: card.name,
      stars,
      vpEarned,
      moneyEarned,
    };

    set((state) => ({
      players: state.players.map((p, i) => {
        if (i !== playerIndex) return p;
        return {
          ...p,
          publishedApps: [...p.publishedApps, publishedApp],
          resources: { ...p.resources, money: p.resources.money + moneyEarned },
          codeGrid: newGrid,
          heldAppCards: newHeldCards,
          marketingStarBonus: 0, // Consumed on publish
        };
      }),
    }));
  },

  claimAppCard: (playerId: string, cardId: string) => {
    const state = get();
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    const player = state.players[playerIndex];

    // Enforce hand limit of 3
    if (player.heldAppCards.length >= 3) return;

    // Find card in market
    const marketIndex = state.roundState.appMarket.findIndex(c => c.id === cardId);
    if (marketIndex === -1) return;
    const card = state.roundState.appMarket[marketIndex];

    // Remove card from market
    const newMarket = [...state.roundState.appMarket];
    newMarket.splice(marketIndex, 1);

    // Refill market from deck
    const newDeck = [...state.appCardDeck];
    if (newDeck.length > 0) {
      newMarket.push(newDeck.shift()!);
    }

    set((state) => ({
      players: state.players.map((p, i) => {
        if (i !== playerIndex) return p;
        return {
          ...p,
          heldAppCards: [...p.heldAppCards, card],
        };
      }),
      roundState: {
        ...state.roundState,
        appMarket: newMarket,
      },
      appCardDeck: newDeck,
    }));
  },

  commitCode: (playerId: string, row: number, col: number, direction?: 'row' | 'col', count?: number) => {
    const state = get();
    const playerIndex = state.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;
    const player = state.players[playerIndex];

    // Cannot commit twice in same round
    if (player.commitCodeUsedThisRound) return;

    const style = player.corporationStyle;
    const cells = player.codeGrid.cells;

    // ---- Commit Scoring Table ----
    // Blocks | Agency VP / $ | Product VP / MAU Prod / $
    // 1      | 1 VP / $0     | 0 VP / +0 / $1
    // 3      | 3 VP / $1     | 2 VP / +1 / $2
    // 4      | 5 VP / $2     | 3 VP / +1 / $3
    // 5      | 7 VP / $3     | 5 VP / +2 / $5

    if (style === 'agency' && !direction) {
      // Agency single-token commit: remove 1 token at (row, col), earn 1 VP
      const cell = cells[row]?.[col];
      if (cell === null || cell === undefined) return;

      const newCells = cells.map(r => [...r]);
      newCells[row][col] = null;

      set((state) => ({
        players: state.players.map((p, i) => {
          if (i !== playerIndex) return p;
          // 1 block = 1 VP
          const vpEarned = 1;
          return {
            ...p,
            commitCodeUsedThisRound: true,
            codeGrid: { ...p.codeGrid, cells: newCells },
            publishedApps: [
              ...p.publishedApps,
              { cardId: `commit-${Date.now()}`, name: 'Code Commit', stars: 1, vpEarned, moneyEarned: 0, pattern: [] },
            ],
          };
        }),
      }));
    } else if (direction && count) {
      // Multi-token commit: validate line pattern and clear tokens
      const requiredCount = count;
      const startColor = cells[row]?.[col];
      if (startColor === null || startColor === undefined) return;

      // Collect tokens in the line
      const tokens: Array<{ r: number; c: number; color: string }> = [];
      for (let i = 0; i < requiredCount; i++) {
        const r = direction === 'col' ? row + i : row;
        const c = direction === 'row' ? col + i : col;
        if (r >= cells.length || c >= cells[0].length) return;
        const cellColor = cells[r][c];
        if (cellColor === null || cellColor === undefined) return;
        tokens.push({ r, c, color: cellColor });
      }

      // Validate: all same color (count=3) or all different (count=4+)
      const colors = new Set(tokens.map(t => t.color));
      let valid = false;
      if (requiredCount === 3 && colors.size === 1) valid = true;
      if (requiredCount === 4 && colors.size === 4) valid = true;
      if (requiredCount === 5 && colors.size === 1) valid = true; // 5 same-color for max combo
      if (!valid) return;

      const newCells = cells.map(r => [...r]);
      for (const t of tokens) {
        newCells[t.r][t.c] = null;
      }

      // Scale rewards by block count
      let vpEarned: number;
      let moneyEarned: number;
      let mauProdGain: number;

      if (style === 'agency' || !style) {
        // Agency scoring: VP + $ based on blocks
        if (requiredCount >= 5) { vpEarned = 7; moneyEarned = 3; mauProdGain = 0; }
        else if (requiredCount === 4) { vpEarned = 5; moneyEarned = 2; mauProdGain = 0; }
        else { vpEarned = 3; moneyEarned = 1; mauProdGain = 0; }
      } else {
        // Product scoring: VP + MAU production + $
        if (requiredCount >= 5) { vpEarned = 5; moneyEarned = 5; mauProdGain = 2; }
        else if (requiredCount === 4) { vpEarned = 3; moneyEarned = 3; mauProdGain = 1; }
        else { vpEarned = 2; moneyEarned = 2; mauProdGain = 1; }
      }

      set((state) => ({
        players: state.players.map((p, i) => {
          if (i !== playerIndex) return p;
          return {
            ...p,
            commitCodeUsedThisRound: true,
            resources: { ...p.resources, money: p.resources.money + moneyEarned },
            codeGrid: { ...p.codeGrid, cells: newCells },
            productionTracks: {
              ...p.productionTracks,
              mauProduction: Math.min(
                p.productionTracks.mauProduction + mauProdGain,
                PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION,
              ),
            },
            publishedApps: [
              ...p.publishedApps,
              { cardId: `commit-${Date.now()}`, name: `Code Commit (${requiredCount})`, stars: Math.min(5, requiredCount), vpEarned, moneyEarned, pattern: [] },
            ],
          };
        }),
      }));
    } else if (style === 'product' && !direction) {
      // Product single-token commit: remove 1 token for $1, no VP
      const cell = cells[row]?.[col];
      if (cell === null || cell === undefined) return;

      const newCells = cells.map(r => [...r]);
      newCells[row][col] = null;

      set((state) => ({
        players: state.players.map((p, i) => {
          if (i !== playerIndex) return p;
          return {
            ...p,
            commitCodeUsedThisRound: true,
            resources: { ...p.resources, money: p.resources.money + 1 },
            codeGrid: { ...p.codeGrid, cells: newCells },
          };
        }),
      }));
    }
  },

  performGridSwap: (playerId: string, r1: number, c1: number, r2: number, c2: number) => {
    set((state) => {
      const playerIndex = state.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) return state;
      const player = state.players[playerIndex];
      const cells = player.codeGrid.cells;

      // Both cells must be occupied (non-null)
      if (cells[r1]?.[c1] == null || cells[r2]?.[c2] == null) return state;

      // Cells must be adjacent (differ by 1 in exactly one dimension)
      const dr = Math.abs(r1 - r2);
      const dc = Math.abs(c1 - c2);
      if (!((dr === 1 && dc === 0) || (dr === 0 && dc === 1))) return state;

      // Perform the swap
      const newCells = cells.map(row => [...row]);
      const tmp = newCells[r1][c1];
      newCells[r1][c1] = newCells[r2][c2];
      newCells[r2][c2] = tmp;

      return {
        players: state.players.map((p, i) => {
          if (i !== playerIndex) return p;
          return {
            ...p,
            codeGrid: { ...p.codeGrid, cells: newCells },
          };
        }),
      };
    });
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
