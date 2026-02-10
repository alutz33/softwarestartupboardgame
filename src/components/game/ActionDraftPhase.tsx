import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../../state/gameStore';
import { getAvailableActions } from '../../data/actions';
import { CodeGridView } from '../ui/CodeGridView';
import { TechDebtBufferView } from '../ui/TechDebtBufferView';
import { CodePoolView } from '../ui/CodePoolView';
import { AppCardView } from '../ui/AppCardView';
import { ActionSpaceCard } from '../ui/ActionSpaceCard';
import { EngineerToken } from '../ui/EngineerToken';
import { AiAugmentationModal } from '../ui/AiAugmentationModal';
import { Badge, Tooltip } from '../ui';
import { TOKEN_COLORS_MAP, TOKEN_LABELS } from '../ui/tokenConstants';
import type { ActionType } from '../../types';
import { getTechDebtLevel } from '../../types';

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
  // Store actions
  const claimActionSlot = useGameStore((s) => s.claimActionSlot);
  const canAffordAction = useGameStore((s) => s.canAffordAction);
  const isActionAvailable = useGameStore((s) => s.isActionAvailable);
  const getActionOccupancy = useGameStore((s) => s.getActionOccupancy);
  const endTurn = useGameStore((s) => s.endTurn);
  const claimAppCard = useGameStore((s) => s.claimAppCard);
  const startActionDraft = useGameStore((s) => s.startActionDraft);
  const placeTokenOnGrid = useGameStore((s) => s.placeTokenOnGrid);

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

  // Derive current player from turnState
  const turnState = roundState.turnState;
  const turnIndex = turnState?.currentPlayerIndex ?? 0;

  // The snake order is built by VP inside the store; we approximate here by
  // deriving the current player ID from the roundState.draftOrder.  However,
  // draftOrder is the engineer-draft order and the store uses its own
  // buildSnakePickOrderByVP for action-draft.  We need a simpler approach:
  // use draftOrder if it contains the right number of entries, otherwise fall
  // back to finding the player whose turn it is via a helper.
  //
  // The store tracks the snake-order index in turnState.currentPlayerIndex.
  // Since we can't call buildSnakePickOrderByVP from the UI, we rely on the
  // store's endTurn to advance the index.  We need to figure out which player
  // ID corresponds to that index.
  //
  // Simplest correct approach: replicate the VP snake order here.
  const getSnakeOrder = (): string[] => {
    const sorted = [...players].sort((a, b) => getPlayerVP(a) - getPlayerVP(b));
    const ids = sorted.map((p) => p.id);
    const reversed = [...ids].reverse();
    const maxPicks = players.reduce((sum, p) => sum + p.engineers.length, 0);
    const rounds = Math.ceil(maxPicks / ids.length) + 1;
    const order: string[] = [];
    for (let i = 0; i < rounds; i++) {
      order.push(...(i % 2 === 0 ? ids : reversed));
    }
    return order;
  };

  const snakeOrder = getSnakeOrder();
  const currentPlayerId = snakeOrder[turnIndex] ?? players[0]?.id;
  const currentPlayer = players.find((p) => p.id === currentPlayerId) ?? players[0];
  const opponents = players.filter((p) => p.id !== currentPlayer.id);

  const availableActions = getAvailableActions(currentRound);

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
    endTurn();
  };

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

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* ===== TOP BAR ===== */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          {/* Quarter indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((q) => (
              <div
                key={q}
                className={`
                  px-3 py-1 rounded text-sm font-bold
                  ${q === currentRound
                    ? 'bg-indigo-600 text-white'
                    : q < currentRound
                      ? 'bg-gray-600 text-gray-300'
                      : 'bg-gray-700 text-gray-500'}
                `}
              >
                Q{q}
              </div>
            ))}
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
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 mb-2">Code Grid</div>
              <CodeGridView grid={currentPlayer.codeGrid} />
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
            <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-xs text-gray-400 mb-2">
                Held App Cards ({currentPlayer.heldAppCards.length}/3)
              </div>
              {currentPlayer.heldAppCards.length === 0 ? (
                <p className="text-gray-600 text-xs">No app cards yet</p>
              ) : (
                <div className="space-y-2">
                  {currentPlayer.heldAppCards.map((card) => (
                    <AppCardView key={card.id} card={card} compact />
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
                    className={`mt-2 w-full text-xs px-2 py-1 rounded font-medium transition-colors ${
                      currentPlayer.leaderPowerUsed
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-yellow-600 hover:bg-yellow-500 text-white cursor-pointer'
                    }`}
                    disabled={currentPlayer.leaderPowerUsed}
                  >
                    {currentPlayer.leaderPowerUsed ? 'Power Used' : 'Use Power'}
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
                      playerColors={players.map((p) => p.color)}
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
            {/* Stub free action buttons — Task 30 will expand these */}
            <Tooltip content="Publish an app from your held cards" position="top">
              <button
                className="px-3 py-2 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!isMyTurn || currentPlayer.heldAppCards.length === 0}
              >
                Publish App
              </button>
            </Tooltip>

            <Tooltip content="Commit code tokens from the pool to your grid" position="top">
              <button
                className="px-3 py-2 text-xs rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={!isMyTurn || currentPlayer.commitCodeUsedThisRound}
              >
                Commit Code
              </button>
            </Tooltip>

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

      {/* ===== DEVELOP FEATURES TOKEN PICKER ===== */}
      <AnimatePresence>
        {turnState?.phase === 'mini-game' && turnState?.pendingAction === 'develop-features' && (
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
                Develop Features — Pick a Token
              </h2>
              <p className="text-sm text-gray-400 mb-4">
                Select a token from the shared pool, then click an empty cell on your grid to place it.
              </p>

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
                  </span>
                </div>
                <CodePoolView
                  pool={roundState.codePool}
                  onSelectToken={(index) => setSelectedTokenIndex(index)}
                  selectedIndices={selectedTokenIndex !== null ? [selectedTokenIndex] : []}
                  maxSelectable={1}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
