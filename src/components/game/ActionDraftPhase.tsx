import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../state/gameStore';
import { getAvailableActions } from '../../data/actions';
import { matchPatternAtPosition } from '../../state/gridHelpers';
import { getStarRating } from '../../data/appCards';
import { CodeGridView } from '../ui/CodeGridView';
import { TechDebtBufferView } from '../ui/TechDebtBufferView';
import { CodePoolView } from '../ui/CodePoolView';
import { AppCardView } from '../ui/AppCardView';
import { ActionSpaceCard } from '../ui/ActionSpaceCard';
import { EngineerToken } from '../ui/EngineerToken';
import { AiAugmentationModal } from '../ui/AiAugmentationModal';
import { Badge, Tooltip } from '../ui';
import { TOKEN_COLORS_MAP, TOKEN_LABELS } from '../ui/tokenConstants';
import type { ActionType, AppCard } from '../../types';
import { getTechDebtLevel } from '../../types';

// ---- Free action mode types ----
type FreeActionMode =
  | null
  | { type: 'publish-select-card' }
  | { type: 'publish-place'; card: AppCard }
  | { type: 'publish-result'; card: AppCard; stars: number; vp: number; money: number }
  | { type: 'commit-agency' }
  | { type: 'commit-product-start' }
  | { type: 'commit-product-direction'; row: number; col: number };

// ---- Optimize-Code Mini-Game Types ----

type OptimizeToken = '+1 Swap' | '+2 Swap' | 'Bug!' | 'Critical Bug!';

const OPTIMIZE_BAG: OptimizeToken[] = [
  '+1 Swap', '+1 Swap', '+1 Swap', '+2 Swap',
  'Bug!', 'Bug!', 'Critical Bug!',
];

interface OptimizeMiniGameState {
  phase: 'drawing' | 'swapping' | 'done';
  bag: OptimizeToken[];
  drawnTokens: OptimizeToken[];
  swapsEarned: number;
  bugCount: number;
  busted: boolean;
  swapsRemaining: number;
  selectedSwapCell: { row: number; col: number } | null;
}

function createOptimizeMiniGame(): OptimizeMiniGameState {
  // Shuffle the bag
  const bag = [...OPTIMIZE_BAG];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return {
    phase: 'drawing',
    bag,
    drawnTokens: [],
    swapsEarned: 0,
    bugCount: 0,
    busted: false,
    swapsRemaining: 0,
    selectedSwapCell: null,
  };
}

/**
 * ActionDraftPhase — the main game screen that replaces the old
 * PlanningPhase + RevealPhase + ResolutionPhase pipeline.
 *
 * 3-panel always-visible board:
 *   Left:   Current player's board (grid, buffer, held app cards, leader)
 *   Center: Action spaces + shared code pool + app market
 *   Right:  Opponent boards (compact)
 *   Top:    Quarter indicator, current turn, VP scoreboard
 *   Bottom: Engineer bar, money, free actions, end turn
 */
export function ActionDraftPhase() {
  const players = useGameStore((s) => s.players);
  const roundState = useGameStore((s) => s.roundState);
  const currentRound = useGameStore((s) => s.currentRound);
  const currentQuarter = useGameStore((s) => s.currentQuarter);
  // Store actions
  const claimActionSlot = useGameStore((s) => s.claimActionSlot);
  const canAffordAction = useGameStore((s) => s.canAffordAction);
  const isActionAvailable = useGameStore((s) => s.isActionAvailable);
  const getActionOccupancy = useGameStore((s) => s.getActionOccupancy);
  const endTurn = useGameStore((s) => s.endTurn);
  const claimAppCard = useGameStore((s) => s.claimAppCard);
  const startActionDraft = useGameStore((s) => s.startActionDraft);
  const placeTokenOnGrid = useGameStore((s) => s.placeTokenOnGrid);
  const performGridSwap = useGameStore((s) => s.performGridSwap);
  const completeInteractiveAction = useGameStore((s) => s.completeInteractiveAction);
  const publishApp = useGameStore((s) => s.publishApp);
  const commitCode = useGameStore((s) => s.commitCode);

  // Initialize turn state when entering the action-draft phase
  useEffect(() => {
    if (!roundState.turnState) {
      startActionDraft();
    }
  }, [roundState.turnState, startActionDraft]);

  // Local UI state
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [pendingClaim, setPendingClaim] = useState<{
    engineerId: string;
    actionType: ActionType;
  } | null>(null);
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number | null>(null);

  // Free action mode state
  const [freeActionMode, setFreeActionMode] = useState<FreeActionMode>(null);

  // Optimize-code mini-game state
  const [optimizeGame, setOptimizeGame] = useState<OptimizeMiniGameState | null>(null);

  // Derive current player from turnState
  const turnState = roundState.turnState;

  // Initialize optimize mini-game when entering mini-game phase for optimize-code
  useEffect(() => {
    if (
      turnState?.phase === 'mini-game' &&
      turnState?.pendingAction === 'optimize-code' &&
      !optimizeGame
    ) {
      setOptimizeGame(createOptimizeMiniGame());
    }
    // Reset when leaving mini-game
    if (turnState?.phase !== 'mini-game' || turnState?.pendingAction !== 'optimize-code') {
      if (optimizeGame) setOptimizeGame(null);
    }
  }, [turnState?.phase, turnState?.pendingAction, optimizeGame]);
  const turnIndex = turnState?.currentPlayerIndex ?? 0;

  // Use the stored snake order from turnState (computed once per round in the store)
  const snakeOrder = turnState?.snakeOrder ?? players.map(p => p.id);
  const currentPlayerId = snakeOrder[turnIndex] ?? players[0]?.id;
  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? players[0];
  const opponents = players.filter((p) => p.id !== currentPlayer.id);

  const availableActions = getAvailableActions(currentQuarter);

  // ---- VP helper (mirrors store's getPlayerVP) ----
  function getPlayerVP(player: (typeof players)[number]): number {
    let vp = 0;
    for (const app of player.publishedApps) {
      vp += app.vpEarned;
    }
    vp += player.ipoBonusScore || 0;
    vp += player.productionTracks.mauProduction;
    vp += player.productionTracks.revenueProduction * 2;
    return vp;
  }

  // ---- Handlers ----

  const handleEngineerClick = (engineerId: string) => {
    const eng = currentPlayer.engineers.find((e) => e.id === engineerId);
    if (!eng || eng.assignedAction) return; // already placed
    setSelectedEngineerId(engineerId === selectedEngineerId ? null : engineerId);
  };

  const handleActionClick = (actionType: ActionType) => {
    if (!selectedEngineerId) return;

    // Check debt blocking
    const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
    if (
      debtLevel.blocksDevelopment &&
      (actionType === 'develop-features' || actionType === 'optimize-code')
    ) {
      return;
    }

    if (!canAffordAction(currentPlayer.id, actionType)) return;
    if (!isActionAvailable(currentPlayer.id, actionType)) return;

    // If player has AI capacity, show the modal
    if (currentPlayer.resources.aiCapacity > 0) {
      setPendingClaim({ engineerId: selectedEngineerId, actionType });
      setShowAiModal(true);
    } else {
      claimActionSlot(currentPlayer.id, selectedEngineerId, actionType, false);
      setSelectedEngineerId(null);
    }
  };

  const handleAiDecision = (useAi: boolean) => {
    if (pendingClaim) {
      claimActionSlot(
        currentPlayer.id,
        pendingClaim.engineerId,
        pendingClaim.actionType,
        useAi,
      );
      setSelectedEngineerId(null);
      setPendingClaim(null);
      setShowAiModal(false);
    }
  };

  const handleEndTurn = () => {
    setSelectedEngineerId(null);
    setFreeActionMode(null);
    endTurn();
  };

  // ---- Free Action Handlers ----

  const handlePublishAppClick = useCallback(() => {
    if (currentPlayer.corporationStyle !== 'agency') return;
    if (currentPlayer.heldAppCards.length === 0) return;
    setFreeActionMode({ type: 'publish-select-card' });
  }, [currentPlayer.corporationStyle, currentPlayer.heldAppCards.length]);

  const handlePublishSelectCard = useCallback((card: AppCard) => {
    setFreeActionMode({ type: 'publish-place', card });
  }, []);

  const handlePublishPlaceOnGrid = useCallback((row: number, col: number) => {
    if (freeActionMode?.type !== 'publish-place') return;
    const card = freeActionMode.card;

    // Preview the match count before calling the store
    const baseMatched = matchPatternAtPosition(currentPlayer.codeGrid, card.pattern, row, col);
    const matched = baseMatched + (currentPlayer.marketingStarBonus || 0);
    const stars = getStarRating(card, matched);
    const vpEarned = Math.max(1, Math.floor(card.maxVP * (stars / 5)));
    const moneyEarned = Math.floor(card.maxMoney * (stars / 5));

    // Call the store action
    publishApp(currentPlayer.id, card.id, row, col);

    // Show result
    setFreeActionMode({
      type: 'publish-result',
      card,
      stars,
      vp: vpEarned,
      money: moneyEarned,
    });
  }, [freeActionMode, currentPlayer.codeGrid, currentPlayer.id, currentPlayer.marketingStarBonus, publishApp]);

  const handleCommitCodeClick = useCallback(() => {
    if (currentPlayer.commitCodeUsedThisRound) return;
    // Both styles: first select 1 token (single commit) or pick a starting cell for line commit
    if (currentPlayer.corporationStyle === 'agency') {
      setFreeActionMode({ type: 'commit-agency' });
    } else {
      setFreeActionMode({ type: 'commit-product-start' });
    }
  }, [currentPlayer.commitCodeUsedThisRound, currentPlayer.corporationStyle]);

  const handleCommitAgencyGridClick = useCallback((row: number, col: number) => {
    if (freeActionMode?.type !== 'commit-agency') return;
    const cell = currentPlayer.codeGrid.cells[row]?.[col];
    if (cell === null || cell === undefined) return;
    // Agency: pick a starting token, then decide single or line commit
    setFreeActionMode({ type: 'commit-product-direction', row, col });
  }, [freeActionMode, currentPlayer.codeGrid.cells]);

  const handleCommitProductStartClick = useCallback((row: number, col: number) => {
    if (freeActionMode?.type !== 'commit-product-start') return;
    const cell = currentPlayer.codeGrid.cells[row]?.[col];
    if (cell === null || cell === undefined) return;
    setFreeActionMode({ type: 'commit-product-direction', row, col });
  }, [freeActionMode, currentPlayer.codeGrid.cells]);

  const handleCommitSingle = useCallback(() => {
    if (freeActionMode?.type !== 'commit-product-direction') return;
    // Single token commit (no direction/count)
    commitCode(currentPlayer.id, freeActionMode.row, freeActionMode.col);
    setFreeActionMode(null);
  }, [freeActionMode, currentPlayer.id, commitCode]);

  const handleCommitProductDirection = useCallback((direction: 'row' | 'col', count: 3 | 4 | 5) => {
    if (freeActionMode?.type !== 'commit-product-direction') return;
    commitCode(currentPlayer.id, freeActionMode.row, freeActionMode.col, direction, count);
    setFreeActionMode(null);
  }, [freeActionMode, currentPlayer.id, commitCode]);

  const handleLeaderPowerClick = useCallback(() => {
    if (currentPlayer.leaderPowerUsed) return;
    alert(
      `Leader power "${currentPlayer.leader?.leaderSide.power?.name ?? 'Unknown'}" activated! (Store action not yet implemented — this is a placeholder.)`
    );
  }, [currentPlayer.leaderPowerUsed, currentPlayer.leader]);

  const cancelFreeAction = useCallback(() => {
    setFreeActionMode(null);
  }, []);

  // ---- Optimize-Code Mini-Game Handlers ----

  const handleOptimizeDraw = useCallback(() => {
    setOptimizeGame((prev) => {
      if (!prev || prev.phase !== 'drawing' || prev.bag.length === 0) return prev;

      const newBag = [...prev.bag];
      const drawn = newBag.pop()!;
      const newDrawn = [...prev.drawnTokens, drawn];

      let newSwaps = prev.swapsEarned;
      let newBugs = prev.bugCount;

      if (drawn === '+1 Swap') {
        newSwaps += 1;
      } else if (drawn === '+2 Swap') {
        newSwaps += 2;
      } else if (drawn === 'Bug!') {
        newBugs += 1;
      } else if (drawn === 'Critical Bug!') {
        newBugs += 2; // Critical bug counts as 2 bugs
      }

      // Check for bust: 2+ bugs = bust
      if (newBugs >= 2) {
        return {
          ...prev,
          bag: newBag,
          drawnTokens: newDrawn,
          swapsEarned: 0,
          bugCount: newBugs,
          busted: true,
          phase: 'done' as const,
          swapsRemaining: 0,
          selectedSwapCell: null,
        };
      }

      // If bag is empty, auto-stop with swaps
      if (newBag.length === 0) {
        return {
          ...prev,
          bag: newBag,
          drawnTokens: newDrawn,
          swapsEarned: newSwaps,
          bugCount: newBugs,
          busted: false,
          phase: newSwaps > 0 ? 'swapping' as const : 'done' as const,
          swapsRemaining: newSwaps,
          selectedSwapCell: null,
        };
      }

      return {
        ...prev,
        bag: newBag,
        drawnTokens: newDrawn,
        swapsEarned: newSwaps,
        bugCount: newBugs,
      };
    });
  }, []);

  const handleOptimizeStop = useCallback(() => {
    setOptimizeGame((prev) => {
      if (!prev || prev.phase !== 'drawing') return prev;
      return {
        ...prev,
        phase: prev.swapsEarned > 0 ? 'swapping' as const : 'done' as const,
        swapsRemaining: prev.swapsEarned,
        selectedSwapCell: null,
      };
    });
  }, []);

  const handleSwapCellClick = useCallback((row: number, col: number) => {
    if (!optimizeGame || optimizeGame.phase !== 'swapping') return;

    const grid = currentPlayer.codeGrid;
    // Cell must be occupied
    if (grid.cells[row]?.[col] == null) return;

    if (!optimizeGame.selectedSwapCell) {
      // First selection
      setOptimizeGame((prev) => prev ? { ...prev, selectedSwapCell: { row, col } } : prev);
    } else {
      // Second selection — check adjacency and perform swap
      const first = optimizeGame.selectedSwapCell;
      const dr = Math.abs(first.row - row);
      const dc = Math.abs(first.col - col);
      const isAdjacent = (dr === 1 && dc === 0) || (dr === 0 && dc === 1);

      if (isAdjacent && (first.row !== row || first.col !== col)) {
        performGridSwap(currentPlayer.id, first.row, first.col, row, col);
        setOptimizeGame((prev) => {
          if (!prev) return prev;
          const remaining = prev.swapsRemaining - 1;
          return {
            ...prev,
            swapsRemaining: remaining,
            selectedSwapCell: null,
            phase: remaining <= 0 ? 'done' as const : 'swapping' as const,
          };
        });
      } else {
        // Not adjacent or same cell — reselect
        setOptimizeGame((prev) => prev ? { ...prev, selectedSwapCell: { row, col } } : prev);
      }
    }
  }, [optimizeGame, currentPlayer.codeGrid, currentPlayer.id, performGridSwap]);

  const handleOptimizeDone = useCallback(() => {
    setOptimizeGame(null);
    completeInteractiveAction();
  }, [completeInteractiveAction]);

  // Get engineers assigned to a specific action (for displaying on action cards)
  const getAssignedEngineers = (actionType: ActionType) => {
    return currentPlayer.engineers.filter((e) => e.assignedAction === actionType);
  };

  // Build allPlayerEngineers list for action cards so they can show all players' placements
  const buildAllPlayerEngineers = (actionType: ActionType) => {
    const result: Array<{
      playerId: string;
      playerColor: string;
      playerName: string;
      engineer: (typeof players)[number]['engineers'][number];
    }> = [];
    for (const p of players) {
      for (const eng of p.engineers) {
        if (eng.assignedAction === actionType) {
          result.push({
            playerId: p.id,
            playerColor: p.color,
            playerName: p.name,
            engineer: eng,
          });
        }
      }
    }
    return result;
  };

  const isMyTurn = turnState?.phase === 'free-actions' || turnState?.phase === 'place-engineer';

  // Determine which grid click handler to use based on free action mode
  const getGridClickHandler = (): ((row: number, col: number) => void) | undefined => {
    if (!isMyTurn) return undefined;
    if (freeActionMode?.type === 'publish-place') return handlePublishPlaceOnGrid;
    if (freeActionMode?.type === 'commit-agency') return handleCommitAgencyGridClick;
    if (freeActionMode?.type === 'commit-product-start') return handleCommitProductStartClick;
    return undefined;
  };

  const canPublish =
    isMyTurn &&
    currentPlayer.corporationStyle === 'agency' &&
    currentPlayer.heldAppCards.length > 0;

  const canCommit = isMyTurn && !currentPlayer.commitCodeUsedThisRound;

  const canUseLeaderPower =
    isMyTurn &&
    !currentPlayer.leaderPowerUsed &&
    !!currentPlayer.leader?.leaderSide.power;

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* ===== TOP BAR ===== */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          {/* Quarter indicators + round within quarter */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((q) => (
                <div
                  key={q}
                  className={`
                    px-3 py-1 rounded text-sm font-bold
                    ${q === currentQuarter
                      ? 'bg-indigo-600 text-white'
                      : q < currentQuarter
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-700 text-gray-500'}
                  `}
                >
                  Q{q}
                </div>
              ))}
            </div>
            {/* Round within quarter */}
            <div className="flex items-center gap-1 ml-1">
              {[1, 2, 3].map((r) => {
                const roundInQuarter = ((currentRound - 1) % 3) + 1;
                return (
                  <div
                    key={r}
                    className={`w-2 h-2 rounded-full ${
                      r === roundInQuarter
                        ? 'bg-indigo-400'
                        : r < roundInQuarter
                          ? 'bg-gray-500'
                          : 'bg-gray-700'
                    }`}
                    title={`Round ${r} of 3`}
                  />
                );
              })}
              <span className="text-xs text-gray-400 ml-1">
                R{((currentRound - 1) % 3) + 1}/3
              </span>
            </div>
          </div>

          {/* Current turn indicator */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Current Turn:</span>
            <span
              className="font-bold text-lg"
              style={{ color: currentPlayer.color }}
            >
              {currentPlayer.name}
            </span>
            {turnState?.phase === 'mini-game' && (
              <Badge variant="warning" size="sm">Resolving Action</Badge>
            )}
            {turnState?.phase === 'resolving' && (
              <Badge variant="info" size="sm">Resolving...</Badge>
            )}
          </div>

          {/* VP Scoreboard */}
          <div className="flex items-center gap-4">
            {players.map((p) => (
              <div
                key={p.id}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  p.id === currentPlayer.id ? 'bg-gray-700' : ''
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                <span className="text-sm text-gray-300">{p.name}</span>
                <span className="text-sm font-bold text-yellow-400">
                  {getPlayerVP(p)} VP
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ===== FREE ACTION MODE BANNER ===== */}
      <AnimatePresence>
        {freeActionMode && freeActionMode.type !== 'publish-result' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-indigo-900/60 border-b border-indigo-500/50 overflow-hidden"
          >
            <div className="max-w-[1800px] mx-auto px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {freeActionMode.type === 'publish-select-card' && (
                  <>
                    <Badge variant="info" size="sm">Publish App</Badge>
                    <span className="text-sm text-gray-200">
                      Select a held app card to publish
                    </span>
                  </>
                )}
                {freeActionMode.type === 'publish-place' && (
                  <>
                    <Badge variant="info" size="sm">Publish App</Badge>
                    <span className="text-sm text-gray-200">
                      Click a grid cell for the top-left corner of &quot;{freeActionMode.card.name}&quot;
                    </span>
                    <span className="text-xs text-gray-400">
                      ({freeActionMode.card.footprint.rows}x{freeActionMode.card.footprint.cols} pattern)
                    </span>
                  </>
                )}
                {(freeActionMode.type === 'commit-agency' || freeActionMode.type === 'commit-product-start') && (
                  <>
                    <Badge variant="warning" size="sm">Commit Code</Badge>
                    <span className="text-sm text-gray-200">
                      Click a starting token on your grid (single or line commit)
                    </span>
                  </>
                )}
                {freeActionMode.type === 'commit-product-direction' && (
                  <>
                    <Badge variant="warning" size="sm">Commit Code</Badge>
                    <span className="text-sm text-gray-200">
                      Choose commit mode from cell ({freeActionMode.row}, {freeActionMode.col})
                    </span>
                  </>
                )}
              </div>
              <button
                onClick={cancelFreeAction}
                className="px-3 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== COMMIT CODE DIRECTION/MODE PICKER ===== */}
      <AnimatePresence>
        {freeActionMode?.type === 'commit-product-direction' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gray-800/80 border-b border-gray-600 overflow-hidden"
          >
            <div className="max-w-[1800px] mx-auto px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-gray-300">Commit from ({freeActionMode.row}, {freeActionMode.col}):</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* Single token */}
                <button
                  onClick={handleCommitSingle}
                  className="px-3 py-1.5 text-xs rounded bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                >
                  1 Token ({currentPlayer.corporationStyle === 'product' ? '$1' : '1 VP'})
                </button>
                {/* 3 in line */}
                <button
                  onClick={() => handleCommitProductDirection('row', 3)}
                  className="px-3 py-1.5 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                >
                  3 in Row (same color) — {currentPlayer.corporationStyle === 'product' ? '2 VP + $2' : '3 VP + $1'}
                </button>
                <button
                  onClick={() => handleCommitProductDirection('col', 3)}
                  className="px-3 py-1.5 text-xs rounded bg-blue-700 hover:bg-blue-600 text-white transition-colors"
                >
                  3 in Column (same color) — {currentPlayer.corporationStyle === 'product' ? '2 VP + $2' : '3 VP + $1'}
                </button>
                {/* 4 in line */}
                <button
                  onClick={() => handleCommitProductDirection('row', 4)}
                  className="px-3 py-1.5 text-xs rounded bg-purple-700 hover:bg-purple-600 text-white transition-colors"
                >
                  4 in Row (all different) — {currentPlayer.corporationStyle === 'product' ? '3 VP + $3' : '5 VP + $2'}
                </button>
                <button
                  onClick={() => handleCommitProductDirection('col', 4)}
                  className="px-3 py-1.5 text-xs rounded bg-purple-700 hover:bg-purple-600 text-white transition-colors"
                >
                  4 in Column (all different) — {currentPlayer.corporationStyle === 'product' ? '3 VP + $3' : '5 VP + $2'}
                </button>
                {/* 5 in line */}
                <button
                  onClick={() => handleCommitProductDirection('row', 5)}
                  className="px-3 py-1.5 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white transition-colors"
                >
                  5 in Row (same color) — {currentPlayer.corporationStyle === 'product' ? '5 VP + $5' : '7 VP + $3'}
                </button>
                <button
                  onClick={() => handleCommitProductDirection('col', 5)}
                  className="px-3 py-1.5 text-xs rounded bg-yellow-700 hover:bg-yellow-600 text-white transition-colors"
                >
                  5 in Column (same color) — {currentPlayer.corporationStyle === 'product' ? '5 VP + $5' : '7 VP + $3'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MAIN 3-PANEL LAYOUT ===== */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1800px] mx-auto h-full grid grid-cols-12 gap-3 p-3">

          {/* ===== LEFT PANEL: My Board ===== */}
          <div className="col-span-12 lg:col-span-3 space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                My Board
              </h2>
              <span className="text-xs text-gray-500">{currentPlayer.name}</span>
            </div>

            {/* Code Grid */}
            <div className={`bg-gray-800/50 rounded-lg p-3 border ${
              getGridClickHandler() ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-gray-700'
            }`}>
              <div className="text-xs text-gray-400 mb-2">
                Code Grid
                {getGridClickHandler() && (
                  <span className="ml-2 text-indigo-400 font-medium">(click a cell)</span>
                )}
              </div>
              <CodeGridView
                grid={currentPlayer.codeGrid}
                onCellClick={getGridClickHandler()}
              />
            </div>

            {/* Tech Debt Buffer */}
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Tech Debt Buffer</div>
              <TechDebtBufferView buffer={currentPlayer.techDebtBuffer} />
            </div>

            {/* AI Research Level */}
            <div className="bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700 flex items-center justify-between">
              <span className="text-xs text-gray-400">AI Level</span>
              <span className="text-sm font-bold text-purple-400">
                {currentPlayer.aiResearchLevel}/2
              </span>
            </div>

            {/* Held App Cards */}
            <div className={`bg-gray-800/50 rounded-lg p-3 border ${
              freeActionMode?.type === 'publish-select-card' ? 'border-indigo-500 ring-1 ring-indigo-500/30' : 'border-gray-700'
            }`}>
              <div className="text-xs text-gray-400 mb-2">
                Held App Cards ({currentPlayer.heldAppCards.length}/3)
                {freeActionMode?.type === 'publish-select-card' && (
                  <span className="ml-2 text-indigo-400 font-medium">(click to select)</span>
                )}
              </div>
              {currentPlayer.heldAppCards.length === 0 ? (
                <p className="text-gray-600 text-xs">No app cards yet</p>
              ) : (
                <div className="space-y-2">
                  {currentPlayer.heldAppCards.map((card) => (
                    <AppCardView
                      key={card.id}
                      card={card}
                      compact={freeActionMode?.type !== 'publish-select-card'}
                      isSelected={
                        freeActionMode?.type === 'publish-place' && freeActionMode.card.id === card.id
                      }
                      onClick={
                        freeActionMode?.type === 'publish-select-card'
                          ? () => handlePublishSelectCard(card)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Published Apps */}
            {currentPlayer.publishedApps.length > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-2">
                  Published Apps ({currentPlayer.publishedApps.length})
                </div>
                <div className="space-y-1">
                  {currentPlayer.publishedApps.map((app) => (
                    <div key={app.cardId} className="flex items-center justify-between text-xs">
                      <span className="text-white">{app.name}</span>
                      <span className="text-yellow-400">
                        {'★'.repeat(app.stars)}{'☆'.repeat(5 - app.stars)} {app.vpEarned} VP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Leader Card */}
            {currentPlayer.leader && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="text-xs text-gray-400 mb-1">Leader</div>
                <div className="text-sm font-bold text-white">
                  {currentPlayer.leader.name}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {currentPlayer.leader.leaderSide.passive.description}
                </div>
                {currentPlayer.leader.leaderSide.power && (
                  <button
                    onClick={handleLeaderPowerClick}
                    className={`mt-2 w-full text-xs px-2 py-1 rounded font-medium transition-colors ${
                      currentPlayer.leaderPowerUsed
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer'
                    }`}
                    disabled={currentPlayer.leaderPowerUsed}
                  >
                    {currentPlayer.leaderPowerUsed ? 'Power Used' : `Use Power: ${currentPlayer.leader.leaderSide.power.name}`}
                  </button>
                )}
              </div>
            )}

            {/* Corporation Style */}
            {currentPlayer.corporationStyle && (
              <div className="bg-gray-800/50 rounded-lg px-3 py-2 border border-gray-700 flex items-center justify-between">
                <span className="text-xs text-gray-400">Corp Style</span>
                <Badge variant={currentPlayer.corporationStyle === 'agency' ? 'info' : 'success'} size="sm">
                  {currentPlayer.corporationStyle === 'agency' ? 'Agency' : 'Product'}
                </Badge>
              </div>
            )}
          </div>

          {/* ===== CENTER PANEL: Action Spaces + Shared Resources ===== */}
          <div className="col-span-12 lg:col-span-6 space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {/* Tech debt warning banner */}
            {(() => {
              const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
              if (debtLevel.powerPenalty < 0) {
                return (
                  <div
                    className={`p-3 rounded-lg border ${
                      debtLevel.blocksDevelopment
                        ? 'bg-red-900/40 border-red-500'
                        : 'bg-orange-900/30 border-orange-500/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span
                          className={`text-sm font-bold ${
                            debtLevel.blocksDevelopment ? 'text-red-400' : 'text-orange-400'
                          }`}
                        >
                          {debtLevel.blocksDevelopment
                            ? 'CRITICAL: Tech Debt Crisis!'
                            : 'Tech Debt Warning'}
                        </span>
                        <span className="text-xs text-gray-300 ml-2">
                          All engineers {debtLevel.powerPenalty} power
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white">
                        {currentPlayer.resources.techDebt} debt
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            {/* Section: Action Spaces */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  Action Spaces
                </h2>
                {selectedEngineerId && (
                  <motion.span
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-blue-400"
                  >
                    Click an action to place engineer
                  </motion.span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableActions.map((action) => {
                  const slotInfo = getActionOccupancy(action.id);
                  const isAvailable = isActionAvailable(currentPlayer.id, action.id);
                  const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
                  const isBlockedByDebt =
                    debtLevel.blocksDevelopment &&
                    (action.id === 'develop-features' || action.id === 'optimize-code');

                  // Map occupying player IDs to their colors for the slot indicator
                  const occupyingColors = slotInfo.players.map((pid) => {
                    const p = players.find((pl) => pl.id === pid);
                    return p?.color ?? '#666';
                  });

                  return (
                    <ActionSpaceCard
                      key={action.id}
                      action={action}
                      assignedEngineers={getAssignedEngineers(action.id)}
                      isSelected={false}
                      onClick={() => handleActionClick(action.id)}
                      canAfford={canAffordAction(currentPlayer.id, action.id)}
                      slotInfo={slotInfo}
                      isAvailable={isAvailable}
                      isBlockedByDebt={isBlockedByDebt}
                      allPlayerEngineers={buildAllPlayerEngineers(action.id)}
                      playerColors={occupyingColors}
                    />
                  );
                })}
              </div>
            </div>

            {/* Section: Shared Code Pool */}
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                Shared Code Pool
              </h2>
              <CodePoolView pool={roundState.codePool} />
            </div>

            {/* Section: App Market */}
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                App Market
              </h2>
              {roundState.appMarket.length === 0 ? (
                <p className="text-gray-500 text-sm">No app cards available</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roundState.appMarket.map((card) => (
                    <AppCardView
                      key={card.id}
                      card={card}
                      onClick={
                        isMyTurn && currentPlayer.heldAppCards.length < 3
                          ? () => claimAppCard(currentPlayer.id, card.id)
                          : undefined
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ===== RIGHT PANEL: Opponent Boards ===== */}
          <div className="col-span-12 lg:col-span-3 space-y-3 overflow-y-auto max-h-[calc(100vh-8rem)]">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Opponents
            </h2>

            {opponents.map((opp) => (
              <div
                key={opp.id}
                className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
              >
                {/* Opponent header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: opp.color }}
                    />
                    <span className="text-sm font-semibold text-white">{opp.name}</span>
                  </div>
                  <span className="text-xs font-bold text-yellow-400">
                    {getPlayerVP(opp)} VP
                  </span>
                </div>

                {/* Compact grid */}
                <div className="mb-2">
                  <CodeGridView grid={opp.codeGrid} compact />
                </div>

                {/* Stats row */}
                <div className="flex gap-2 text-xs text-gray-400">
                  <span>Apps: {opp.publishedApps.length}</span>
                  <span>${opp.resources.money}</span>
                  <span>Eng: {opp.engineers.length}</span>
                  <Tooltip
                    content={`Tech Debt: ${opp.resources.techDebt}`}
                    position="left"
                  >
                    <span className="border-b border-dotted border-gray-600 cursor-help">
                      Debt: {opp.resources.techDebt}
                    </span>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== BOTTOM BAR ===== */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-3">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
          {/* Left: Engineers */}
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <span className="text-xs text-gray-400 whitespace-nowrap mr-1">
              Engineers:
            </span>
            {currentPlayer.engineers.map((eng) => (
              <EngineerToken
                key={eng.id}
                engineer={eng}
                isAssigned={!!eng.assignedAction}
                isSelected={selectedEngineerId === eng.id}
                onClick={() => handleEngineerClick(eng.id)}
                techDebt={currentPlayer.resources.techDebt}
              />
            ))}
            {currentPlayer.engineers.length === 0 && (
              <span className="text-xs text-gray-600">No engineers</span>
            )}
          </div>

          {/* Center: Resources */}
          <div className="flex items-center gap-4 shrink-0">
            <div className="text-center">
              <div className="text-xs text-gray-400">Money</div>
              <div className="text-lg font-bold text-green-400">
                ${currentPlayer.resources.money}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">MAU</div>
              <div className="text-lg font-bold text-blue-400">
                {currentPlayer.metrics.mau.toLocaleString()}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-400">Rating</div>
              <div className="text-lg font-bold text-yellow-400">
                {currentPlayer.metrics.rating}/10
              </div>
            </div>
          </div>

          {/* Right: Free actions + End Turn */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Publish App — agency only */}
            <Tooltip
              content={
                currentPlayer.corporationStyle !== 'agency'
                  ? 'Agency corporations only'
                  : currentPlayer.heldAppCards.length === 0
                    ? 'No held app cards'
                    : 'Publish an app from your held cards'
              }
              position="top"
            >
              <button
                onClick={handlePublishAppClick}
                className={`px-3 py-2 text-xs rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  freeActionMode?.type === 'publish-select-card' || freeActionMode?.type === 'publish-place'
                    ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                disabled={!canPublish}
              >
                Publish App
              </button>
            </Tooltip>

            {/* Commit Code — both corp types */}
            <Tooltip
              content={
                currentPlayer.commitCodeUsedThisRound
                  ? 'Already used this round'
                  : currentPlayer.corporationStyle === 'agency'
                    ? 'Remove a token from your grid'
                    : 'Clear a line of matching tokens for $1 + MAU'
              }
              position="top"
            >
              <button
                onClick={handleCommitCodeClick}
                className={`px-3 py-2 text-xs rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  freeActionMode?.type === 'commit-agency' || freeActionMode?.type === 'commit-product-start' || freeActionMode?.type === 'commit-product-direction'
                    ? 'bg-orange-600 text-white ring-2 ring-orange-400'
                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
                disabled={!canCommit}
              >
                Commit Code
              </button>
            </Tooltip>

            {/* Leader Power — once per game */}
            {currentPlayer.leader?.leaderSide.power && (
              <Tooltip
                content={
                  currentPlayer.leaderPowerUsed
                    ? 'Already used (once per game)'
                    : `${currentPlayer.leader.leaderSide.power.name}: ${currentPlayer.leader.leaderSide.power.description}`
                }
                position="top"
              >
                <button
                  onClick={handleLeaderPowerClick}
                  className={`px-3 py-2 text-xs rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                    currentPlayer.leaderPowerUsed
                      ? 'bg-gray-700 text-gray-500'
                      : 'bg-yellow-700 hover:bg-yellow-600 text-yellow-100'
                  }`}
                  disabled={!canUseLeaderPower}
                >
                  Leader Power
                </button>
              </Tooltip>
            )}

            {/* End Turn */}
            <button
              onClick={handleEndTurn}
              disabled={!isMyTurn}
              className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
                isMyTurn
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              End Turn
            </button>
          </div>
        </div>
      </footer>

      {/* ===== MODALS ===== */}
      <AiAugmentationModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onDecision={handleAiDecision}
        player={currentPlayer}
        engineer={currentPlayer.engineers.find(
          (e) => e.id === pendingClaim?.engineerId,
        )}
      />

      {/* ===== PUBLISH RESULT OVERLAY ===== */}
      <AnimatePresence>
        {freeActionMode?.type === 'publish-result' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
            onClick={cancelFreeAction}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gray-800 border border-gray-600 rounded-xl p-6 text-center max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-2xl mb-2">
                {'★'.repeat(freeActionMode.stars)}{'☆'.repeat(5 - freeActionMode.stars)}
              </div>
              <div className="text-lg font-bold text-white mb-1">
                {freeActionMode.card.name} Published!
              </div>
              <div className="text-sm text-gray-300 mb-4">
                <span className="text-yellow-400 font-bold">{freeActionMode.vp} VP</span>
                {' + '}
                <span className="text-green-400 font-bold">${freeActionMode.money}</span>
              </div>
              <button
                onClick={cancelFreeAction}
                className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                OK
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== DEVELOP FEATURES TOKEN PICKER ===== */}
      <AnimatePresence>
        {turnState?.phase === 'mini-game' && turnState?.pendingAction === 'develop-features' && (() => {
          const pickState = turnState.tokenPickState;
          const picksRemaining = pickState?.picksRemaining ?? 1;
          const maxPicks = pickState?.maxPicks ?? 1;
          const specialtyColor = pickState?.specialtyColor;
          const filterColor = specialtyColor; // only show tokens of this color if set

          return (
          <motion.div
            key="develop-features-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Title */}
              <h2 className="text-lg font-bold text-white mb-1">
                Develop Features — Pick {maxPicks > 1 ? `${maxPicks} Tokens` : 'a Token'}
              </h2>
              <p className="text-sm text-gray-400 mb-2">
                {specialtyColor
                  ? `Specialty match! Pick ${maxPicks} ${specialtyColor} tokens from the pool.`
                  : `Pick ${maxPicks > 1 ? `up to ${maxPicks} tokens` : 'a token'} of any color from the pool.`}
              </p>

              {/* Picks remaining indicator */}
              {maxPicks > 1 && (
                <div className="mb-4 flex items-center gap-3 bg-gray-700/50 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-300">Picks remaining:</span>
                  <div className="flex gap-1">
                    {Array.from({ length: maxPicks }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 rounded-full ${
                          i < picksRemaining ? 'bg-indigo-500' : 'bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-indigo-400">
                    {picksRemaining}/{maxPicks}
                  </span>
                  {pickState?.useAi && (
                    <Badge variant="warning" size="sm">AI Active</Badge>
                  )}
                </div>
              )}

              {/* Selected token indicator */}
              {selectedTokenIndex !== null && roundState.codePool[selectedTokenIndex] && (
                <div className="mb-4 flex items-center gap-3 bg-gray-700/50 rounded-lg px-4 py-2">
                  <span className="text-sm text-gray-300">Selected:</span>
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center text-sm font-bold text-white ring-2 ring-yellow-400 ${
                      TOKEN_COLORS_MAP[roundState.codePool[selectedTokenIndex]]
                    }`}
                  >
                    {TOKEN_LABELS[roundState.codePool[selectedTokenIndex]]}
                  </div>
                  <span className="text-sm text-yellow-400 font-medium">
                    {roundState.codePool[selectedTokenIndex].charAt(0).toUpperCase() +
                      roundState.codePool[selectedTokenIndex].slice(1)}
                  </span>
                </div>
              )}

              {/* Step 1: Code Pool */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-indigo-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    1
                  </span>
                  <span className="text-sm font-semibold text-gray-200">
                    Pick a token from the pool
                    {filterColor && (
                      <span className="ml-1 text-xs text-gray-400">
                        ({filterColor} only)
                      </span>
                    )}
                  </span>
                </div>
                <CodePoolView
                  pool={roundState.codePool}
                  onSelectToken={(index) => setSelectedTokenIndex(index)}
                  selectedIndices={selectedTokenIndex !== null ? [selectedTokenIndex] : []}
                  maxSelectable={1}
                  filterColor={filterColor}
                />
              </div>

              {/* Step 2: Grid */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                    selectedTokenIndex !== null
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-600 text-gray-400'
                  }`}>
                    2
                  </span>
                  <span className={`text-sm font-semibold ${
                    selectedTokenIndex !== null ? 'text-gray-200' : 'text-gray-500'
                  }`}>
                    Place it on an empty cell
                  </span>
                </div>
                <div className="flex justify-center">
                  <CodeGridView
                    grid={currentPlayer.codeGrid}
                    onCellClick={
                      selectedTokenIndex !== null
                        ? (row, col) => {
                            if (currentPlayer.codeGrid.cells[row][col] === null) {
                              placeTokenOnGrid(currentPlayer.id, selectedTokenIndex, row, col);
                              setSelectedTokenIndex(null);
                            }
                          }
                        : undefined
                    }
                    highlightCells={
                      selectedTokenIndex !== null
                        ? currentPlayer.codeGrid.cells.flatMap((row, r) =>
                            row.map((cell, c) => (cell === null ? { row: r, col: c } : null))
                              .filter((v): v is { row: number; col: number } => v !== null)
                          )
                        : []
                    }
                  />
                </div>
              </div>

              {/* Done button for multi-pick (skip remaining picks) */}
              {maxPicks > 1 && picksRemaining < maxPicks && picksRemaining > 0 && (
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => completeInteractiveAction()}
                    className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium transition-colors"
                  >
                    Done (skip remaining {picksRemaining} pick{picksRemaining > 1 ? 's' : ''})
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ===== OPTIMIZE CODE MINI-GAME ===== */}
      <AnimatePresence>
        {turnState?.phase === 'mini-game' && turnState?.pendingAction === 'optimize-code' && optimizeGame && (
          <motion.div
            key="optimize-code-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl border border-gray-600 shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              {/* Drawing Phase */}
              {optimizeGame.phase === 'drawing' && (
                <>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Optimize Code — Push Your Luck!
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    Draw tokens to earn grid swaps. But beware — 2 bugs and you bust!
                  </p>

                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Swaps Earned</div>
                      <div className="text-2xl font-bold text-cyan-400">
                        {optimizeGame.swapsEarned}
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Bugs</div>
                      <div className={`text-2xl font-bold ${
                        optimizeGame.bugCount >= 1 ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {optimizeGame.bugCount}/2
                      </div>
                    </div>
                    <div className="bg-gray-700 rounded p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Tokens Left</div>
                      <div className="text-2xl font-bold text-gray-300">
                        {optimizeGame.bag.length}
                      </div>
                    </div>
                  </div>

                  {/* Drawn tokens */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold text-gray-400 mb-2">Drawn Tokens</div>
                    <div className="flex flex-wrap gap-2 min-h-[56px]">
                      <AnimatePresence>
                        {optimizeGame.drawnTokens.map((token, i) => {
                          const isBug = token === 'Bug!' || token === 'Critical Bug!';
                          const borderColor = isBug
                            ? token === 'Critical Bug!' ? 'border-red-600' : 'border-orange-500'
                            : token === '+2 Swap' ? 'border-teal-500' : 'border-green-500';
                          const bgColor = isBug
                            ? token === 'Critical Bug!' ? 'bg-red-900/40' : 'bg-orange-900/30'
                            : token === '+2 Swap' ? 'bg-teal-900/30' : 'bg-green-900/30';
                          const textColor = isBug
                            ? token === 'Critical Bug!' ? 'text-red-400' : 'text-orange-400'
                            : token === '+2 Swap' ? 'text-teal-400' : 'text-green-400';

                          return (
                            <motion.div
                              key={i}
                              initial={{ scale: 0, rotate: -180 }}
                              animate={{ scale: 1, rotate: 0 }}
                              transition={{ type: 'spring', damping: 15 }}
                              className={`w-16 h-16 rounded-lg border-2 ${borderColor} ${bgColor} flex items-center justify-center`}
                            >
                              <span className={`text-xs font-bold ${textColor} text-center leading-tight`}>
                                {token}
                              </span>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {optimizeGame.drawnTokens.length === 0 && (
                        <div className="text-sm text-gray-500 italic flex items-center">
                          No tokens drawn yet — click Draw Token to begin!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleOptimizeDraw}
                      disabled={optimizeGame.bag.length === 0}
                      className="px-6 py-3 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Draw Token
                    </button>
                    <button
                      onClick={handleOptimizeStop}
                      className="px-6 py-3 rounded-lg font-bold text-sm bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                    >
                      Stop &amp; Swap
                    </button>
                  </div>
                </>
              )}

              {/* Bust result */}
              {optimizeGame.phase === 'done' && optimizeGame.busted && (
                <>
                  <div className="text-center mb-4">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="mb-4 p-4 bg-red-900/50 border-2 border-red-500 rounded-lg"
                    >
                      <div className="text-3xl font-bold text-red-400 mb-1">
                        BUST!
                      </div>
                      <p className="text-red-300 text-sm">
                        Too many bugs! All swaps lost.
                      </p>
                    </motion.div>

                    {/* Show drawn tokens */}
                    <div className="flex flex-wrap gap-2 justify-center mb-4">
                      {optimizeGame.drawnTokens.map((token, i) => {
                        const isBug = token === 'Bug!' || token === 'Critical Bug!';
                        const borderColor = isBug
                          ? token === 'Critical Bug!' ? 'border-red-600' : 'border-orange-500'
                          : token === '+2 Swap' ? 'border-teal-500' : 'border-green-500';
                        const bgColor = isBug
                          ? token === 'Critical Bug!' ? 'bg-red-900/40' : 'bg-orange-900/30'
                          : token === '+2 Swap' ? 'bg-teal-900/30' : 'bg-green-900/30';
                        const textColor = isBug
                          ? token === 'Critical Bug!' ? 'text-red-400' : 'text-orange-400'
                          : token === '+2 Swap' ? 'text-teal-400' : 'text-green-400';

                        return (
                          <div
                            key={i}
                            className={`w-14 h-14 rounded-lg border-2 ${borderColor} ${bgColor} flex items-center justify-center`}
                          >
                            <span className={`text-[10px] font-bold ${textColor} text-center leading-tight`}>
                              {token}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleOptimizeDone}
                      className="px-6 py-3 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}

              {/* Swapping Phase */}
              {optimizeGame.phase === 'swapping' && (
                <>
                  <h2 className="text-lg font-bold text-white mb-1">
                    Optimize Code — Swap Tokens
                  </h2>
                  <p className="text-sm text-gray-400 mb-4">
                    You have {optimizeGame.swapsRemaining} swap{optimizeGame.swapsRemaining !== 1 ? 's' : ''} remaining.
                    Click two adjacent tokens to swap them.
                  </p>

                  {/* Swap counter */}
                  <div className="mb-4 flex items-center justify-center gap-3">
                    <div className="bg-cyan-900/30 border border-cyan-500 rounded-lg px-4 py-2">
                      <span className="text-cyan-400 font-bold text-lg">
                        {optimizeGame.swapsRemaining}
                      </span>
                      <span className="text-cyan-300 text-sm ml-1">
                        swap{optimizeGame.swapsRemaining !== 1 ? 's' : ''} left
                      </span>
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {optimizeGame.selectedSwapCell && (
                    <div className="mb-3 text-center text-sm text-yellow-400">
                      First cell selected at ({optimizeGame.selectedSwapCell.row}, {optimizeGame.selectedSwapCell.col}) — now click an adjacent token to swap.
                    </div>
                  )}

                  {/* Grid with swap interaction */}
                  <div className="flex justify-center mb-4">
                    <CodeGridView
                      grid={currentPlayer.codeGrid}
                      onCellClick={handleSwapCellClick}
                      highlightCells={
                        optimizeGame.selectedSwapCell
                          ? [
                              optimizeGame.selectedSwapCell,
                              // Highlight adjacent occupied cells
                              ...([
                                { row: optimizeGame.selectedSwapCell.row - 1, col: optimizeGame.selectedSwapCell.col },
                                { row: optimizeGame.selectedSwapCell.row + 1, col: optimizeGame.selectedSwapCell.col },
                                { row: optimizeGame.selectedSwapCell.row, col: optimizeGame.selectedSwapCell.col - 1 },
                                { row: optimizeGame.selectedSwapCell.row, col: optimizeGame.selectedSwapCell.col + 1 },
                              ].filter(
                                (c) =>
                                  c.row >= 0 &&
                                  c.col >= 0 &&
                                  c.row < currentPlayer.codeGrid.cells.length &&
                                  c.col < (currentPlayer.codeGrid.cells[0]?.length ?? 0) &&
                                  currentPlayer.codeGrid.cells[c.row][c.col] != null
                              )),
                            ]
                          : []
                      }
                    />
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleOptimizeDone}
                      className="px-6 py-3 rounded-lg font-bold text-sm bg-gray-600 hover:bg-gray-500 text-white transition-colors"
                    >
                      Done (skip remaining swaps)
                    </button>
                  </div>
                </>
              )}

              {/* Done without bust and no swaps to use */}
              {optimizeGame.phase === 'done' && !optimizeGame.busted && (
                <>
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold text-white mb-2">
                      Optimization Complete
                    </h2>
                    <p className="text-sm text-gray-400">
                      {optimizeGame.swapsEarned > 0
                        ? `You earned ${optimizeGame.swapsEarned} swap${optimizeGame.swapsEarned !== 1 ? 's' : ''} and applied them to your grid.`
                        : 'No swaps earned this time.'}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={handleOptimizeDone}
                      className="px-6 py-3 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
