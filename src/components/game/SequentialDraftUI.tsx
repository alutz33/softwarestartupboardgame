import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../ui';
import { MilestoneTracker } from '../ui/MilestoneTracker';
import { MiniDebtIndicator } from '../ui/TechDebtWarning';
import { ActionSpaceCard } from '../ui/ActionSpaceCard';
import { EngineerToken } from '../ui/EngineerToken';
import { AiAugmentationModal } from '../ui/AiAugmentationModal';
import { ProductionTracksPanel } from '../ui/ProductionTrackVisual';
import { QuarterlyThemeTracker } from '../ui/QuarterlyThemeTracker';
import { HelpIcon } from '../ui/HelpIcon';
import { ActionPreviewPopover } from '../ui/ActionPreviewPopover';
import { SuggestedActionsBanner } from '../ui/SuggestedActionsBanner';
import {
  PlayerStatsComparison,
  ActionPreviewContent,
  calculateActionChanges,
  getRecommendedActions,
} from '../ui/NoobHelpers';
import { GameRulesHeader } from '../GameRulesHeader';
import { useTutorialMode } from '../../hooks/useTutorialMode';
import { useGameStore } from '../../state/gameStore';
import { getAvailableActions, ACTION_SPACES } from '../../data/actions';
import type { ActionType } from '../../types';
import { getTechDebtLevel } from '../../types';

export function SequentialDraftUI() {
  const players = useGameStore((s) => s.players);
  const roundState = useGameStore((s) => s.roundState);
  const currentRound = useGameStore((s) => s.currentRound);
  const milestones = useGameStore((s) => s.milestones);
  const quarterlyThemes = useGameStore((s) => s.quarterlyThemes);
  const claimActionSlot = useGameStore((s) => s.claimActionSlot);
  const unassignEngineer = useGameStore((s) => s.unassignEngineer);
  const canAffordAction = useGameStore((s) => s.canAffordAction);
  const isActionAvailable = useGameStore((s) => s.isActionAvailable);
  const getActionOccupancy = useGameStore((s) => s.getActionOccupancy);
  const revealPlans = useGameStore((s) => s.revealPlans);

  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    engineerId: string;
    actionType: ActionType;
  } | null>(null);

  const { isEnabled: tutorialOn, toggle: toggleTutorial } = useTutorialMode();

  const draft = roundState.sequentialDraft;
  const availableActions = getAvailableActions(currentRound);
  const upcomingEvent = roundState.upcomingEvent;

  // Current picker from snake draft
  const currentPickerId = draft?.pickOrder[draft.currentPickerIndex] ?? players[0]?.id;
  const currentPicker = players.find((p) => p.id === currentPickerId);
  const isComplete = draft?.isComplete ?? false;

  // In hotseat mode, the "local" player is whoever's turn it is
  const localPlayer = currentPicker ?? players[0];
  const playerColor = localPlayer?.color ?? '#666';

  // Recommended actions for tutorial mode
  const recommendedActions = useMemo(
    () => (tutorialOn && localPlayer ? getRecommendedActions(localPlayer) : new Set<ActionType>()),
    [tutorialOn, localPlayer]
  );

  // Selected engineer object for preview
  const selectedEng = localPlayer?.engineers.find((e) => e.id === selectedEngineer);

  // Reset selected engineer when player changes
  useEffect(() => {
    setSelectedEngineer(null);
  }, [currentPickerId]);

  // Auto-transition to reveal when draft completes
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => {
        revealPlans();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isComplete, revealPlans]);

  const handleEngineerClick = (engineerId: string) => {
    if (!localPlayer) return;
    const engineer = localPlayer.engineers.find((e) => e.id === engineerId);
    if (engineer?.assignedAction) {
      unassignEngineer(localPlayer.id, engineerId);
      setSelectedEngineer(null);
    } else {
      setSelectedEngineer(engineerId);
    }
  };

  const handleActionClick = (actionType: ActionType) => {
    if (!selectedEngineer || !localPlayer) return;

    const debtLevel = getTechDebtLevel(localPlayer.resources.techDebt);
    if (debtLevel.blocksDevelopment &&
        (actionType === 'develop-features' || actionType === 'optimize-code')) {
      return;
    }

    if (!canAffordAction(localPlayer.id, actionType)) return;
    if (!isActionAvailable(localPlayer.id, actionType)) return;

    if (localPlayer.resources.aiCapacity > 0) {
      setPendingAssignment({ engineerId: selectedEngineer, actionType });
      setShowAiModal(true);
    } else {
      claimActionSlot(localPlayer.id, selectedEngineer, actionType, false);
      setSelectedEngineer(null);
    }
  };

  const handleAiDecision = (useAi: boolean) => {
    if (pendingAssignment && localPlayer) {
      claimActionSlot(
        localPlayer.id,
        pendingAssignment.engineerId,
        pendingAssignment.actionType,
        useAi
      );
      setSelectedEngineer(null);
      setPendingAssignment(null);
      setShowAiModal(false);
    }
  };

  // Build all-player engineer mapping for action cards
  const getEngineersForAction = (actionType: ActionType) => {
    return players.flatMap((p) =>
      p.engineers
        .filter((e) => e.assignedAction === actionType)
        .map((e) => ({
          playerId: p.id,
          playerColor: p.color,
          playerName: p.name,
          engineer: e,
        }))
    );
  };

  // Get player colors for slot indicators
  const getPlayerColorsForAction = (actionType: ActionType) => {
    const occupied = roundState.occupiedActions.get(actionType) || [];
    return occupied.map((pid) => {
      const p = players.find((pl) => pl.id === pid);
      return p?.color ?? '#666';
    });
  };

  const unassignedEngineers = localPlayer?.engineers.filter((e) => !e.assignedAction) ?? [];
  const picksInfo = draft
    ? `Pick ${draft.picksCompleted + 1} of ${draft.picksPerRound}`
    : '';

  return (
    <div className="min-h-screen">
      {/* ===== STICKY TURN BANNER ===== */}
      <div
        className="sticky top-0 z-50 backdrop-blur-sm border-b"
        style={{
          backgroundColor: `${playerColor}15`,
          borderColor: `${playerColor}40`,
        }}
      >
        <AnimatePresence mode="wait">
          {!isComplete ? (
            <motion.div
              key={currentPickerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between px-4 lg:px-8 py-2"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded-full ring-2 ring-white/30"
                  style={{ backgroundColor: playerColor }}
                />
                <div>
                  <span className="font-bold text-white" style={{ color: playerColor }}>
                    {localPlayer?.name}
                  </span>
                  <span className="text-gray-400 ml-2 text-sm">&apos;s Turn</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400">{picksInfo}</span>
                {/* Inline resources with help icons */}
                {localPlayer && (
                  <div className="hidden sm:flex items-center gap-3 text-xs">
                    <span className="text-green-400 font-semibold">
                      ${localPlayer.resources.money}
                      <HelpIcon tip="Cash on hand. Spent on Marketing ($20), Servers ($10), AI ($15), Recruiter ($25)." position="bottom" />
                    </span>
                    <span className="text-cyan-400">
                      {localPlayer.resources.serverCapacity} srv
                      <HelpIcon tip="Server capacity. If MAU exceeds capacity x100, you risk crashes." position="bottom" />
                    </span>
                    <span className="text-purple-400">
                      {localPlayer.resources.aiCapacity} AI
                      <HelpIcon tip="AI augmentation slots. Each use adds +2 power but costs tech debt." position="bottom" />
                    </span>
                    <MiniDebtIndicator techDebt={localPlayer.resources.techDebt} />
                  </div>
                )}
                <button
                  onClick={toggleTutorial}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    tutorialOn
                      ? 'text-yellow-300 bg-yellow-900/40 hover:bg-yellow-900/60'
                      : 'text-gray-400 bg-gray-800/60 hover:text-white hover:bg-gray-700/80'
                  }`}
                >
                  Tips
                </button>
                <button
                  onClick={() => setShowRules(!showRules)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    showRules
                      ? 'text-blue-300 bg-blue-900/40 hover:bg-blue-900/60'
                      : 'text-gray-400 bg-gray-800/60 hover:text-white hover:bg-gray-700/80'
                  }`}
                >
                  Rules
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-4 lg:px-8 py-3 text-center bg-green-900/20 border-green-500"
            >
              <span className="font-bold text-green-400">All Engineers Placed!</span>
              <span className="text-gray-400 text-sm ml-2">Revealing plans...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tutorial suggested actions banner (inside sticky area) */}
        <AnimatePresence>
          {tutorialOn && localPlayer && !isComplete && (
            <SuggestedActionsBanner player={localPlayer} />
          )}
        </AnimatePresence>
      </div>

      {/* ===== RULES OVERLAY ===== */}
      {showRules && (
        <div className="relative z-40">
          <GameRulesHeader defaultExpanded />
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <div className="p-4 lg:px-8 lg:py-4">
        <div className="max-w-[1600px] mx-auto">

          {/* Top info row: Theme + Event side by side */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1">
              <QuarterlyThemeTracker themes={quarterlyThemes} currentRound={currentRound} />
            </div>
            {upcomingEvent && (
              <div className="flex-1 p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-yellow-400 text-xs font-semibold">INCOMING EVENT</span>
                  <Badge variant="warning" size="sm">Next Q</Badge>
                </div>
                <div className="text-white text-sm font-medium">{upcomingEvent.name}</div>
                <div className="text-xs text-gray-400 mt-1">{upcomingEvent.description}</div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* ===== LEFT: Action Board ===== */}
            <div className="col-span-12 lg:col-span-8">
              {/* Late-game actions notification */}
              {currentRound >= 3 && (
                <div className="mb-3 p-2 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                  <div className="text-purple-400 text-xs font-semibold">
                    NEW ACTIONS UNLOCKED
                  </div>
                  <div className="text-xs text-gray-400">
                    {currentRound === 3 ? 'Go Viral is now available!' : 'IPO Prep and Acquisition Target are now available!'}
                  </div>
                </div>
              )}

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableActions.map((action) => {
                  const slotInfo = getActionOccupancy(action.id);
                  const isAvailable = isActionAvailable(localPlayer?.id ?? '', action.id);
                  const debtLevel = getTechDebtLevel(localPlayer?.resources.techDebt ?? 0);
                  const isBlockedByDebt = debtLevel.blocksDevelopment &&
                    (action.id === 'develop-features' || action.id === 'optimize-code');

                  // Compute preview for this action when an engineer is selected
                  const previewChanges = selectedEng && localPlayer
                    ? calculateActionChanges(localPlayer, action.id, selectedEng)
                    : null;
                  const actionDef = ACTION_SPACES.find((a) => a.id === action.id);

                  return (
                    <ActionPreviewPopover
                      key={action.id}
                      enabled={!!selectedEng && !isBlockedByDebt && isAvailable}
                      content={
                        previewChanges && actionDef ? (
                          <ActionPreviewContent changes={previewChanges} actionName={actionDef.name} />
                        ) : null
                      }
                    >
                      <ActionSpaceCard
                        action={action}
                        assignedEngineers={localPlayer?.engineers.filter((e) => e.assignedAction === action.id) ?? []}
                        isSelected={false}
                        onClick={() => handleActionClick(action.id)}
                        canAfford={canAffordAction(localPlayer?.id ?? '', action.id)}
                        slotInfo={slotInfo}
                        isAvailable={isAvailable}
                        isBlockedByDebt={isBlockedByDebt}
                        allPlayerEngineers={getEngineersForAction(action.id)}
                        playerColors={getPlayerColorsForAction(action.id)}
                        isRecommended={tutorialOn && recommendedActions.has(action.id)}
                      />
                    </ActionPreviewPopover>
                  );
                })}
              </div>
            </div>

            {/* ===== RIGHT: Sidebar ===== */}
            <div className="col-span-12 lg:col-span-4 space-y-3">
              {/* Production Tracks */}
              {localPlayer && <ProductionTracksPanel player={localPlayer} />}

              {/* Player Stats Comparison */}
              <PlayerStatsComparison
                players={players}
                currentPlayerId={localPlayer?.id ?? ''}
              />

              {/* Milestones */}
              <MilestoneTracker
                milestones={milestones}
                players={players}
                currentPlayerId={localPlayer?.id ?? ''}
              />
            </div>
          </div>

          {/* ===== BOTTOM: Engineer Bar ===== */}
          {!isComplete && localPlayer && (
            <div
              className="mt-4 rounded-lg p-3 border-2"
              style={{
                borderColor: `${playerColor}50`,
                backgroundColor: `${playerColor}08`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: playerColor }}
                />
                <h3 className="text-sm font-semibold text-white">
                  {localPlayer.name}&apos;s Engineers
                </h3>
                <HelpIcon tip="Select an engineer, then click an action card to place them. Seniors have 4 power, Juniors 2, Interns 1. AI adds +2 power." position="right" />
                <span className="text-xs text-gray-500">
                  {unassignedEngineers.length} unassigned
                </span>
              </div>

              {selectedEngineer ? (
                <div
                  className="mb-2 p-2 rounded text-sm"
                  style={{
                    backgroundColor: `${playerColor}15`,
                    color: playerColor,
                    border: `1px solid ${playerColor}40`,
                  }}
                >
                  Click an action above to place this engineer
                </div>
              ) : unassignedEngineers.length > 0 ? (
                <div className="mb-2 text-xs text-gray-500">
                  Select an engineer, then click an action
                </div>
              ) : null}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
                {localPlayer.engineers.map((engineer) => (
                  <EngineerToken
                    key={engineer.id}
                    engineer={engineer}
                    isAssigned={!!engineer.assignedAction}
                    isSelected={selectedEngineer === engineer.id}
                    onClick={() => handleEngineerClick(engineer.id)}
                    techDebt={localPlayer.resources.techDebt}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Augmentation Modal */}
      {localPlayer && (
        <AiAugmentationModal
          isOpen={showAiModal}
          onClose={() => setShowAiModal(false)}
          onDecision={handleAiDecision}
          player={localPlayer}
          engineer={localPlayer.engineers.find((e) => e.id === pendingAssignment?.engineerId)}
        />
      )}
    </div>
  );
}
