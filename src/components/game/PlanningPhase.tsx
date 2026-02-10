import { useState } from 'react';
import { Button, Card, CardContent, Badge, Modal, Tooltip } from '../ui';
import { QuickTip } from '../ui/HelpCard';
import { PhaseGuide } from '../ui/PhaseGuide';
import { MilestoneTracker } from '../ui/MilestoneTracker';
import { TechDebtWarning, MiniDebtIndicator } from '../ui/TechDebtWarning';
import { ActionSpaceCard } from '../ui/ActionSpaceCard';
import { EngineerToken } from '../ui/EngineerToken';
import { AiAugmentationModal } from '../ui/AiAugmentationModal';
import { ProductionTracksPanel } from '../ui/ProductionTrackVisual';
import { QuarterlyThemeTracker } from '../ui/QuarterlyThemeTracker';
import { ActionPreview, PlayerStatsComparison, ActionTips } from '../ui/NoobHelpers';
import { SequentialDraftUI } from './SequentialDraftUI';
import { useGameStore } from '../../state/gameStore';
import { getAvailableActions } from '../../data/actions';
import { PRODUCT_OPTIONS } from '../../data/corporations';
import type { ActionType, ProductType } from '../../types';
import { getTechDebtLevel } from '../../types';

export function PlanningPhase() {
  const planningMode = useGameStore((s) => s.planningMode);

  if (planningMode === 'sequential') {
    return <SequentialDraftUI />;
  }

  return <SimultaneousPlanningUI />;
}

function SimultaneousPlanningUI() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const currentRound = useGameStore((state) => state.currentRound);
  const milestones = useGameStore((state) => state.milestones);
  const assignEngineer = useGameStore((state) => state.assignEngineer);
  const unassignEngineer = useGameStore((state) => state.unassignEngineer);
  const lockPlan = useGameStore((state) => state.lockPlan);
  const canAffordAction = useGameStore((state) => state.canAffordAction);
  const isActionAvailable = useGameStore((state) => state.isActionAvailable);
  const getActionOccupancy = useGameStore((state) => state.getActionOccupancy);
  const usePivotPower = useGameStore((state) => state.usePivotPower);
  const quarterlyThemes = useGameStore((s) => s.quarterlyThemes);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPivotModal, setShowPivotModal] = useState(false);
  const [showPhaseGuide, setShowPhaseGuide] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    engineerId: string;
    actionType: ActionType;
  } | null>(null);

  const availableActions = getAvailableActions(currentRound);
  const upcomingEvent = roundState.upcomingEvent;

  const currentPlayer = players[currentPlayerIndex];
  const hasLockedPlan = currentPlayer.isReady;

  const handleEngineerClick = (engineerId: string) => {
    const engineer = currentPlayer.engineers.find((e) => e.id === engineerId);
    if (engineer?.assignedAction) {
      unassignEngineer(currentPlayer.id, engineerId);
      setSelectedEngineer(null);
    } else {
      setSelectedEngineer(engineerId);
    }
  };

  const handleActionClick = (actionType: ActionType) => {
    if (!selectedEngineer) {
      setSelectedAction(actionType === selectedAction ? null : actionType);
      return;
    }

    const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
    if (debtLevel.blocksDevelopment &&
        (actionType === 'develop-features' || actionType === 'optimize-code')) {
      return;
    }

    if (!canAffordAction(currentPlayer.id, actionType)) return;
    if (!isActionAvailable(currentPlayer.id, actionType)) return;

    if (currentPlayer.resources.aiCapacity > 0) {
      setPendingAssignment({ engineerId: selectedEngineer, actionType });
      setShowAiModal(true);
    } else {
      assignEngineer(currentPlayer.id, selectedEngineer, actionType, false);
      setSelectedEngineer(null);
    }
  };

  const handleAiDecision = (useAi: boolean) => {
    if (pendingAssignment) {
      assignEngineer(
        currentPlayer.id,
        pendingAssignment.engineerId,
        pendingAssignment.actionType,
        useAi
      );
      setSelectedEngineer(null);
      setPendingAssignment(null);
      setShowAiModal(false);
    }
  };

  const handleLockPlan = () => {
    lockPlan(currentPlayer.id);
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setSelectedEngineer(null);
      setSelectedAction(null);
    }
  };

  const getAssignedEngineers = (actionType: ActionType) => {
    return currentPlayer.engineers.filter((e) => e.assignedAction === actionType);
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                Planning Phase - Q{roundState.roundNumber}
              </h1>
              <p className="text-gray-400">
                <span style={{ color: currentPlayer.color }} className="font-semibold">
                  {currentPlayer.name}
                </span>
                : Assign engineers to actions
              </p>
            </div>
            <Tooltip content="Show phase guide" position="bottom">
              <button
                onClick={() => setShowPhaseGuide(!showPhaseGuide)}
                className="text-gray-500 hover:text-gray-300 text-lg"
              >
                ?
              </button>
            </Tooltip>
          </div>
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-xs text-gray-400">Money</div>
              <div className="text-xl font-bold text-green-400">
                ${currentPlayer.resources.money}
              </div>
            </div>
            <div>
              <Tooltip content="Monthly Active Users - your player base" position="bottom">
                <span className="text-xs text-gray-400 border-b border-dotted border-gray-600 cursor-help">MAU</span>
              </Tooltip>
              <div className="text-xl font-bold text-blue-400">
                {currentPlayer.metrics.mau.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">AI Cap</div>
              <div className="text-xl font-bold text-purple-400">
                {currentPlayer.resources.aiCapacity}
              </div>
            </div>
            <div>
              <Tooltip content="Accumulated code issues. -1 power per 4 debt" position="bottom">
                <span className="text-xs text-gray-400 border-b border-dotted border-gray-600 cursor-help">Tech Debt</span>
              </Tooltip>
              <MiniDebtIndicator techDebt={currentPlayer.resources.techDebt} />
            </div>
          </div>
        </div>

        {/* Phase Guide (collapsible) */}
        {showPhaseGuide && (
          <div className="mb-4">
            <PhaseGuide phase="planning" currentRound={currentRound} />
          </div>
        )}

        {/* Player tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {players.map((player, i) => (
            <button
              key={player.id}
              disabled={i !== currentPlayerIndex}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                i === currentPlayerIndex
                  ? 'bg-gray-700 text-white ring-2'
                  : player.isReady
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-gray-800 text-gray-500'
              }`}
              style={{
                borderColor: i === currentPlayerIndex ? player.color : undefined,
              }}
            >
              {player.name}
              {player.isReady && ' Done'}
            </button>
          ))}
        </div>

        {/* Tech Debt Power Penalty Warning Banner */}
        {(() => {
          const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
          if (debtLevel.powerPenalty < 0) {
            return (
              <div className={`mb-6 p-4 rounded-lg border ${
                debtLevel.blocksDevelopment
                  ? 'bg-red-900/40 border-red-500'
                  : 'bg-orange-900/30 border-orange-500/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-bold ${debtLevel.blocksDevelopment ? 'text-red-400' : 'text-orange-400'}`}>
                      {debtLevel.blocksDevelopment ? 'CRITICAL: Tech Debt Crisis!' : 'Tech Debt Warning'}
                    </div>
                    <p className="text-sm text-gray-300">
                      All engineers suffer <span className="font-bold text-yellow-400">
                        {debtLevel.powerPenalty} power
                      </span> penalty
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">{currentPlayer.resources.techDebt}</div>
                    <div className="text-xs text-gray-400">Tech Debt</div>
                  </div>
                </div>
                {debtLevel.blocksDevelopment && (
                  <div className="mt-3 pt-3 border-t border-red-500/30">
                    <p className="text-red-300 text-sm font-semibold">
                      Develop Features and Optimize Code are BLOCKED until debt is below 12!
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Use &quot;Pay Down Debt&quot; action (unaffected by power penalty) to reduce debt.
                    </p>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Left sidebar - Production & Engineers */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Production Tracks */}
            <ProductionTracksPanel player={currentPlayer} />

            {/* Suggested Actions */}
            <ActionTips player={currentPlayer} />

            {/* Your Engineers */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                YOUR ENGINEERS
                <span className="text-xs text-gray-500 font-normal">
                  ({currentPlayer.engineers.length})
                </span>
                <Tooltip content="Engineer output contribution per action. AI adds +2 power but generates tech debt." position="right">
                  <span className="text-[10px] text-gray-500 border-b border-dotted border-gray-600 cursor-help">Power?</span>
                </Tooltip>
              </h2>
              <div className="space-y-2">
                {currentPlayer.engineers.map((engineer) => (
                  <EngineerToken
                    key={engineer.id}
                    engineer={engineer}
                    isAssigned={!!engineer.assignedAction}
                    isSelected={selectedEngineer === engineer.id}
                    onClick={() => handleEngineerClick(engineer.id)}
                    techDebt={currentPlayer.resources.techDebt}
                  />
                ))}
                {currentPlayer.engineers.length === 0 && (
                  <p className="text-gray-500 text-sm">No engineers hired yet</p>
                )}
              </div>

              {selectedEngineer && (
                <div className="mt-4 p-3 bg-blue-900/20 rounded-lg border border-blue-700">
                  <div className="text-sm text-blue-400">
                    Now click an action to assign this engineer!
                  </div>
                </div>
              )}

              {!selectedEngineer && currentPlayer.engineers.some(e => !e.assignedAction) && (
                <QuickTip>Click an unassigned engineer to select them</QuickTip>
              )}
            </div>

            {/* Tech Debt Warning */}
            <TechDebtWarning
              techDebt={currentPlayer.resources.techDebt}
              showDetails={true}
            />
          </div>

          {/* Main content - Action Board */}
          <div className="col-span-12 lg:col-span-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Action Board</h2>
              <div className="text-xs text-gray-500">
                Some actions have limited slots!
              </div>
            </div>

            {/* Quarterly Theme Tracker (replaces inline banner + sidebar) */}
            <div className="mb-4">
              <QuarterlyThemeTracker themes={quarterlyThemes} currentRound={currentRound} />
            </div>

            {/* Event Forecasting - Show upcoming event */}
            {upcomingEvent && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-sm font-semibold">INCOMING EVENT</span>
                  <Badge variant="warning" size="sm">Next Quarter</Badge>
                </div>
                <div className="text-white font-medium">{upcomingEvent.name}</div>
                <div className="text-xs text-gray-400 mt-1">{upcomingEvent.description}</div>
                <div className="text-xs text-green-400 mt-1">
                  Mitigate: {upcomingEvent.mitigation.condition}
                </div>
              </div>
            )}

            {/* Late-game actions notification */}
            {currentRound >= 3 && (
              <div className="mb-4 p-2 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <div className="text-purple-400 text-xs font-semibold">
                  NEW ACTIONS UNLOCKED
                </div>
                <div className="text-xs text-gray-400">
                  {currentRound === 3 ? 'Go Viral is now available!' : 'IPO Prep and Acquisition Target are now available!'}
                </div>
              </div>
            )}

            {/* Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableActions.map((action) => {
                const slotInfo = getActionOccupancy(action.id);
                const isAvailable = isActionAvailable(currentPlayer.id, action.id);
                const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
                const isBlockedByDebt = debtLevel.blocksDevelopment &&
                  (action.id === 'develop-features' || action.id === 'optimize-code');

                return (
                  <ActionSpaceCard
                    key={action.id}
                    action={action}
                    assignedEngineers={getAssignedEngineers(action.id)}
                    isSelected={selectedAction === action.id}
                    onClick={() => handleActionClick(action.id)}
                    canAfford={canAffordAction(currentPlayer.id, action.id)}
                    slotInfo={slotInfo}
                    isAvailable={isAvailable}
                    isBlockedByDebt={isBlockedByDebt}
                  />
                );
              })}
            </div>

            {/* Lock Plan button */}
            <div className="flex flex-col items-center mt-8 gap-2">
              <Button
                size="lg"
                onClick={handleLockPlan}
                disabled={hasLockedPlan || currentPlayer.plannedActions.length === 0}
              >
                {hasLockedPlan
                  ? 'Plan Locked'
                  : currentPlayerIndex < players.length - 1
                    ? 'Lock Plan & Next Player'
                    : 'Lock Plan & Reveal All'}
              </Button>

              {currentPlayer.plannedActions.length === 0 && (
                <p className="text-gray-500 text-sm">
                  Assign at least one engineer to an action to continue
                </p>
              )}

              {currentPlayer.plannedActions.length > 0 && !hasLockedPlan && (
                <p className="text-green-400 text-sm">
                  {currentPlayer.plannedActions.length} action(s) planned - Ready to lock!
                </p>
              )}
            </div>
          </div>

          {/* Right sidebar - Info panels */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* All Players Comparison */}
            <PlayerStatsComparison
              players={players}
              currentPlayerId={currentPlayer.id}
            />

            {/* Action Preview - shows when engineer AND action selected */}
            {selectedEngineer && selectedAction && (
              <ActionPreview
                player={currentPlayer}
                actionType={selectedAction}
                engineer={currentPlayer.engineers.find(e => e.id === selectedEngineer)}
              />
            )}

            {/* Milestones */}
            <MilestoneTracker
              milestones={milestones}
              players={players}
              currentPlayerId={currentPlayer.id}
            />

            {/* VC-Heavy Pivot Power */}
            {currentPlayer.strategy?.funding === 'vc-heavy' && !currentPlayer.hasPivoted && (
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowPivotModal(true)}
                  className="w-full"
                >
                  Use Pivot Power
                </Button>
                <div className="text-[10px] text-purple-400 mt-1 text-center">
                  Change product type (once per game)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Augmentation Modal */}
      <AiAugmentationModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        onDecision={handleAiDecision}
        player={currentPlayer}
        engineer={currentPlayer.engineers.find(e => e.id === pendingAssignment?.engineerId)}
      />

      {/* Pivot Power Modal (VC-Heavy) */}
      <Modal
        isOpen={showPivotModal}
        onClose={() => setShowPivotModal(false)}
        title="Pivot Your Product"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            As a VC-backed startup, you can pivot your product type once per game.
            This changes your MAU, Revenue, and Rating multipliers.
          </p>

          <div className="text-sm text-yellow-400">
            Current: {PRODUCT_OPTIONS.find(p => p.id === currentPlayer.strategy?.product)?.name}
          </div>

          <div className="grid gap-3">
            {PRODUCT_OPTIONS.filter(p => p.id !== currentPlayer.strategy?.product).map((product) => (
              <Card
                key={product.id}
                hoverable
                onClick={() => {
                  usePivotPower(currentPlayer.id, product.id as ProductType);
                  setShowPivotModal(false);
                }}
                className="cursor-pointer"
              >
                <CardContent className="p-3">
                  <div className="font-semibold text-white">{product.name}</div>
                  <div className="text-xs text-gray-400">{product.description}</div>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-blue-400">MAU: {product.mauMultiplier}x</span>
                    <span className="text-green-400">Rev: {product.revenueMultiplier}x</span>
                    <span className="text-yellow-400">Rating: {product.ratingMultiplier}x</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <QuickTip>
            Pivoting affects future growth, not existing metrics.
          </QuickTip>
        </div>
      </Modal>
    </div>
  );
}
