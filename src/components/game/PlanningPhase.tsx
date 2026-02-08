import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent, Badge, Modal, Tooltip } from '../ui';
import { HelpCard, QuickTip } from '../ui/HelpCard';
import { PhaseGuide } from '../ui/PhaseGuide';
import { MilestoneTracker } from '../ui/MilestoneTracker';
import { TechDebtWarning, MiniDebtIndicator } from '../ui/TechDebtWarning';
import { ActionSlotIndicator, ActionSlotsLegend } from '../ui/ActionSlotIndicator';
import { ActionPreview, PlayerStatsComparison, YourStats, ActionTips } from '../ui/NoobHelpers';
import { useGameStore } from '../../state/gameStore';
import { ACTION_SPACES, getAvailableActions } from '../../data/actions';
import { getSpecialtyBonus } from '../../data/engineers';
import { PRODUCT_OPTIONS } from '../../data/corporations';
import type { ActionType, HiredEngineer, ProductType } from '../../types';
import { ENGINEER_TRAITS, getTechDebtLevel, AI_POWER_BONUS } from '../../types';

interface PowerBreakdownLine {
  label: string;
  value: number;
}

function calculatePowerBreakdown(
  engineer: HiredEngineer,
  techDebt: number,
): PowerBreakdownLine[] {
  const lines: PowerBreakdownLine[] = [];

  // Base power from engineer level
  const levelLabel = engineer.level === 'senior' ? 'Senior' : engineer.level === 'junior' ? 'Junior' : 'Intern';
  lines.push({ label: `Base power (${levelLabel})`, value: engineer.power });

  // AI augmentation bonus
  if (engineer.hasAiAugmentation) {
    lines.push({ label: 'AI augmentation', value: AI_POWER_BONUS });
  }

  // Specialty bonus (if assigned to an action)
  if (engineer.assignedAction && engineer.specialty) {
    const specBonus = getSpecialtyBonus(engineer.specialty, engineer.assignedAction);
    if (specBonus > 0) {
      const actionName = ACTION_SPACES.find(a => a.id === engineer.assignedAction)?.name || engineer.assignedAction;
      lines.push({ label: `Specialty (${engineer.specialty} on ${actionName})`, value: specBonus });
    }
  }

  // Trait bonuses
  if (engineer.trait === 'ai-skeptic') {
    lines.push({ label: 'AI Skeptic (+1 base)', value: 1 });
  }
  if (engineer.trait === 'equity-hungry' && engineer.roundsRetained >= 2) {
    lines.push({ label: 'Equity-Hungry (2+ rounds)', value: 1 });
  }
  if (engineer.trait === 'night-owl') {
    lines.push({ label: 'Night Owl (last action)', value: 1 });
  }

  // Persona trait bonuses
  if (engineer.personaTrait) {
    lines.push({ label: `Trait: ${engineer.personaTrait.name}`, value: 0 });
  }

  // Tech debt penalty
  const debtLevel = getTechDebtLevel(techDebt);
  if (debtLevel.powerPenalty < 0) {
    lines.push({ label: 'Tech debt penalty', value: debtLevel.powerPenalty });
  }

  return lines;
}

function PowerBreakdownTooltipContent({ lines }: { lines: PowerBreakdownLine[] }) {
  const total = lines.reduce((sum, l) => sum + l.value, 0);
  return (
    <div className="text-left space-y-1 min-w-[180px]">
      {lines.map((line, i) => (
        <div key={i} className="flex justify-between gap-4">
          <span className="text-gray-300">{line.label}</span>
          <span className={line.value >= 0 ? 'text-green-400' : 'text-red-400'}>
            {line.value > 0 ? '+' : ''}{line.value}
          </span>
        </div>
      ))}
      <div className="border-t border-gray-500 pt-1 flex justify-between gap-4 font-semibold">
        <span className="text-white">Total</span>
        <span className="text-white">{Math.max(0, total)} power</span>
      </div>
    </div>
  );
}

function ActionSpaceCard({
  action,
  assignedEngineers,
  isSelected,
  onClick,
  canAfford,
  slotInfo,
  isAvailable,
  isBlockedByDebt,
}: {
  action: (typeof ACTION_SPACES)[0];
  assignedEngineers: HiredEngineer[];
  isSelected: boolean;
  onClick: () => void;
  canAfford: boolean;
  slotInfo: { current: number; max: number | undefined; players: string[] };
  isAvailable: boolean;
  isBlockedByDebt: boolean;
}) {
  const isFull = slotInfo.max !== undefined && slotInfo.current >= slotInfo.max && !isAvailable;
  const isDisabled = isFull || isBlockedByDebt;

  return (
    <Card
      hoverable={!isDisabled}
      selected={isSelected}
      onClick={isDisabled ? undefined : onClick}
      className={`${!canAfford || isDisabled ? 'opacity-50' : ''} ${isDisabled ? 'cursor-not-allowed' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-white">{action.name}</h3>
          <div className="flex gap-1">
            {action.requiredResources?.money && (
              <Badge variant="warning">${action.requiredResources.money}</Badge>
            )}
          </div>
        </div>

        {/* Slot indicator */}
        <div className="mb-2">
          <ActionSlotIndicator
            actionType={action.id}
            currentOccupancy={slotInfo.current}
            maxSlots={slotInfo.max}
            playerColors={[]} // Would need to pass actual player colors
            isAvailableToCurrentPlayer={isAvailable && !isBlockedByDebt}
          />
        </div>

        <p className="text-sm text-gray-400 mb-3">{action.description}</p>

        {action.effect.triggersMinigame && (
          <Badge variant="info" className="mb-3">
            Triggers Puzzle!
          </Badge>
        )}

        {/* Debt blocking warning */}
        {isBlockedByDebt && (
          <div className="bg-red-500/20 text-red-400 text-xs p-2 rounded mb-2 border border-red-500/50">
            BLOCKED BY TECH DEBT - Reduce debt below 10 to unlock!
          </div>
        )}

        {/* Full warning */}
        {isFull && !isBlockedByDebt && (
          <div className="bg-red-500/20 text-red-400 text-xs p-2 rounded mb-2">
            BLOCKED - Another player claimed this slot!
          </div>
        )}

        {assignedEngineers.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-2">Your Engineers:</div>
            <div className="flex flex-wrap gap-1">
              {assignedEngineers.map((eng) => (
                <span
                  key={eng.id}
                  className="px-2 py-1 bg-blue-900/50 text-blue-300 rounded text-xs"
                >
                  {eng.name}
                  {eng.hasAiAugmentation && ' +AI'}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EngineerToken({
  engineer,
  isAssigned,
  onClick,
  isSelected,
  techDebt,
}: {
  engineer: HiredEngineer;
  isAssigned: boolean;
  onClick: () => void;
  isSelected: boolean;
  techDebt: number;
}) {
  const trait = engineer.trait ? ENGINEER_TRAITS[engineer.trait] : null;
  const breakdownLines = calculatePowerBreakdown(engineer, techDebt);

  return (
    <Tooltip
      content={<PowerBreakdownTooltipContent lines={breakdownLines} />}
      position="right"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`
          p-3 rounded-lg border-2 transition-all text-left w-full
          ${isSelected ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800'}
          ${isAssigned ? 'opacity-50' : 'hover:border-gray-500'}
        `}
      >
        <div className="flex justify-between items-start">
          <div className="font-medium text-white text-sm">{engineer.name}</div>
          {engineer.specialty && (
            <span className="text-[10px] text-gray-500 uppercase">{engineer.specialty}</span>
          )}
        </div>
        <div className="flex gap-1 mt-1 items-center flex-wrap">
          <Badge
            size="sm"
            variant={
              engineer.level === 'senior'
                ? 'success'
                : engineer.level === 'intern'
                  ? 'warning'
                  : 'default'
            }
          >
            {engineer.level === 'senior'
              ? 'Sr'
              : engineer.level === 'intern'
                ? 'Int'
                : 'Jr'}
          </Badge>
          <span className="text-xs text-gray-400">
            {engineer.power} pwr
          </span>
          {/* Engineer Trait Badge */}
          {trait && (
            <span title={trait.description}>
              <Badge
                size="sm"
                variant={
                  engineer.trait === 'ai-skeptic' ? 'warning' :
                  engineer.trait === 'equity-hungry' ? 'info' :
                  engineer.trait === 'startup-veteran' ? 'success' :
                  'default'
                }
              >
                {trait.name}
              </Badge>
            </span>
          )}
        </div>
        {/* Show rounds retained for equity-hungry */}
        {engineer.trait === 'equity-hungry' && (
          <div className="text-[10px] text-yellow-400 mt-1">
            {engineer.roundsRetained >= 2 ? '+1 power!' : `Retained ${engineer.roundsRetained}/2 quarters`}
          </div>
        )}
        {isAssigned && engineer.assignedAction && (
          <div className="text-xs text-blue-400 mt-1 flex items-center gap-1">
            <span>→</span>
            <span>{ACTION_SPACES.find((a) => a.id === engineer.assignedAction)?.name}</span>
            {engineer.hasAiAugmentation && (
              <span className="text-purple-400">+AI</span>
            )}
          </div>
        )}
      </motion.button>
    </Tooltip>
  );
}

export function PlanningPhase() {
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

  // Get active quarterly theme for current round
  const activeTheme = roundState.activeTheme;

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [selectedEngineer, setSelectedEngineer] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showPivotModal, setShowPivotModal] = useState(false);
  const [pendingAssignment, setPendingAssignment] = useState<{
    engineerId: string;
    actionType: ActionType;
  } | null>(null);

  // Get available actions for this round (filters late-game actions)
  const availableActions = getAvailableActions(currentRound);

  // Get upcoming event for forecasting
  const upcomingEvent = roundState.upcomingEvent;

  const currentPlayer = players[currentPlayerIndex];
  const hasLockedPlan = currentPlayer.isReady;

  const handleEngineerClick = (engineerId: string) => {
    const engineer = currentPlayer.engineers.find((e) => e.id === engineerId);
    if (engineer?.assignedAction) {
      // Unassign if already assigned
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

    // Check if blocked by tech debt
    const debtLevel = getTechDebtLevel(currentPlayer.resources.techDebt);
    if (debtLevel.blocksDevelopment &&
        (actionType === 'develop-features' || actionType === 'optimize-code')) {
      return; // Blocked by debt
    }

    // Check if can afford
    if (!canAffordAction(currentPlayer.id, actionType)) {
      return;
    }

    // Check if action is available (not blocked)
    if (!isActionAvailable(currentPlayer.id, actionType)) {
      return;
    }

    // Ask about AI augmentation if player has AI capacity
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
              <Tooltip content="User satisfaction, 1-10 scale" position="bottom">
                <span className="text-xs text-gray-400 border-b border-dotted border-gray-600 cursor-help">Rating</span>
              </Tooltip>
              <div className="text-xl font-bold text-yellow-400">
                {currentPlayer.metrics.rating}/10
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-400">AI Capacity</div>
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
                      Use "Pay Down Debt" action (unaffected by power penalty) to reduce debt.
                    </p>
                  </div>
                )}
              </div>
            );
          }
          return null;
        })()}

        <div className="grid grid-cols-12 gap-4 lg:gap-6">
          {/* Left sidebar - Guide & Engineers */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            {/* Phase Guide */}
            <PhaseGuide phase="planning" currentRound={currentRound} />

            {/* Your Stats Panel */}
            <YourStats player={currentPlayer} />

            {/* Suggested Actions */}
            <ActionTips player={currentPlayer} />

            {/* Your Engineers */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                YOUR ENGINEERS
                <span className="text-xs text-gray-500 font-normal">
                  ({currentPlayer.engineers.length})
                </span>
                <Tooltip content="Engineer output contribution per action" position="right">
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

            {/* Quarterly Theme Banner */}
            {activeTheme && (
              <div className="mb-4 p-3 bg-purple-900/20 border border-purple-700/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-purple-400 text-sm font-semibold">QUARTERLY THEME</span>
                  <Badge variant="info" size="sm">{activeTheme.name}</Badge>
                </div>
                <div className="text-xs text-gray-400">{activeTheme.description}</div>
                {activeTheme.modifiers.restrictedActions && activeTheme.modifiers.restrictedActions.length > 0 && (
                  <div className="text-xs text-red-400 mt-1">
                    Restricted: {activeTheme.modifiers.restrictedActions.join(', ')}
                  </div>
                )}
              </div>
            )}

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

            {/* Action Slots Legend */}
            <div className="mb-4">
              <ActionSlotsLegend
                actions={availableActions.map(a => ({ id: a.id, name: a.name, maxSlots: a.maxWorkers }))}
              />
            </div>

            {/* Action Grid - Only show available actions for this round */}
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

            {/* Quarterly Themes Overview */}
            {quarterlyThemes.length > 0 && (
              <HelpCard title="Quarterly Themes" variant="rule" collapsible defaultExpanded={false}>
                <div className="space-y-2 text-xs">
                  {quarterlyThemes.map((theme, index) => {
                    const isCurrent = activeTheme?.id === theme.id;
                    return (
                      <div
                        key={theme.id}
                        className={`rounded p-2 ${
                          isCurrent
                            ? 'bg-purple-900/40 border border-purple-500/50'
                            : 'bg-gray-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isCurrent ? 'text-purple-400' : 'text-gray-400'}`}>
                            Q{index + 1}
                          </span>
                          <span className={isCurrent ? 'text-white font-semibold' : 'text-gray-300'}>
                            {theme.name}
                          </span>
                          {isCurrent && (
                            <Badge variant="info" size="sm">Current</Badge>
                          )}
                        </div>
                        <p className="text-gray-500 text-[10px] mt-1">{theme.description}</p>
                      </div>
                    );
                  })}
                </div>
              </HelpCard>
            )}

            {/* Engineer Traits Guide */}
            <HelpCard title="Engineer Traits" variant="info" collapsible defaultExpanded={false}>
              <div className="space-y-2 text-xs">
                <p className="text-gray-400 mb-2">~35% of engineers have special traits:</p>
                <div className="space-y-2">
                  <div className="bg-orange-900/30 rounded p-2">
                    <span className="text-orange-400 font-semibold">AI Skeptic</span>
                    <p className="text-gray-400 text-[10px]">Can't use AI, but +1 base power</p>
                  </div>
                  <div className="bg-yellow-900/30 rounded p-2">
                    <span className="text-yellow-400 font-semibold">Equity-Hungry</span>
                    <p className="text-gray-400 text-[10px]">+$5 cost, +1 power if kept 2+ rounds</p>
                  </div>
                  <div className="bg-green-900/30 rounded p-2">
                    <span className="text-green-400 font-semibold">Startup Veteran</span>
                    <p className="text-gray-400 text-[10px]">Immune to negative events</p>
                  </div>
                  <div className="bg-blue-900/30 rounded p-2">
                    <span className="text-blue-400 font-semibold">Night Owl</span>
                    <p className="text-gray-400 text-[10px]">+1 power on last action of round</p>
                  </div>
                </div>
              </div>
            </HelpCard>

            {/* AI Augmentation Help */}
            <HelpCard title="AI Augmentation" variant="tip" collapsible defaultExpanded={false}>
              <div className="space-y-2 text-xs">
                <p>AI adds +2 power but creates tech debt:</p>
                <div className="grid grid-cols-3 gap-1 bg-gray-900/50 p-2 rounded">
                  <span className="text-gray-400">Level</span>
                  <span className="text-gray-400">Power</span>
                  <span className="text-gray-400">Debt</span>
                  <span>Intern</span>
                  <span className="text-green-400">+2</span>
                  <span className="text-red-400">+4</span>
                  <span>Junior</span>
                  <span className="text-green-400">+2</span>
                  <span className="text-red-400">+3</span>
                  <span>Senior</span>
                  <span className="text-green-400">+2</span>
                  <span className="text-red-400">+1</span>
                </div>
                {currentPlayer.strategy?.tech === 'ai-first' && (
                  <p className="text-purple-400">Your AI-First strategy reduces debt by 50%!</p>
                )}
              </div>
            </HelpCard>

            {/* Strategy Reminder */}
            <HelpCard title="Your Strategy" variant="rule" collapsible defaultExpanded={false}>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Funding:</span>
                  <span className="text-white capitalize">{currentPlayer.strategy?.funding || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Tech:</span>
                  <span className="text-white capitalize">{currentPlayer.strategy?.tech || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Product:</span>
                  <span className="text-white capitalize">{currentPlayer.strategy?.product || 'Not set'}</span>
                </div>

                {/* VC-Heavy Pivot Power */}
                {currentPlayer.strategy?.funding === 'vc-heavy' && !currentPlayer.hasPivoted && (
                  <div className="mt-3 pt-2 border-t border-gray-700">
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
                {currentPlayer.strategy?.funding === 'vc-heavy' && currentPlayer.hasPivoted && (
                  <div className="mt-2 text-[10px] text-gray-500 text-center">
                    Pivot power used
                  </div>
                )}
              </div>
            </HelpCard>
          </div>
        </div>
      </div>

      {/* AI Augmentation Modal */}
      <Modal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="AI Augmentation"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Do you want to augment this engineer with AI?
          </p>

          {/* Find the engineer to show specific info */}
          {(() => {
            const engineer = currentPlayer.engineers.find(e => e.id === pendingAssignment?.engineerId);
            if (!engineer) return null;

            const debtMultiplier = currentPlayer.strategy?.tech === 'ai-first' ? 0.5 : 1;
            const baseDebt = engineer.level === 'senior' ? 1 : engineer.level === 'junior' ? 3 : 4;
            const actualDebt = Math.ceil(baseDebt * debtMultiplier);

            return (
              <div className="bg-gray-800 rounded p-3 text-sm">
                <div className="text-gray-400 mb-2">For {engineer.name} ({engineer.level}):</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Without AI:</span>
                    <span className="text-white ml-2">{engineer.power} power</span>
                  </div>
                  <div>
                    <span className="text-gray-500">With AI:</span>
                    <span className="text-green-400 ml-2">
                      {engineer.power + 2} power
                    </span>
                  </div>
                </div>
                {currentPlayer.strategy?.tech === 'ai-first' && (
                  <div className="text-purple-400 text-xs mt-2">
                    AI-First bonus: Only +{actualDebt} debt (normally +{baseDebt})
                  </div>
                )}
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-4">
            <Card
              hoverable
              onClick={() => handleAiDecision(false)}
              className="cursor-pointer"
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">Human Only</div>
                <div className="font-semibold text-white">No AI</div>
                <div className="text-xs text-gray-400 mt-1">
                  Standard output
                </div>
                <div className="text-xs text-green-400 mt-1">
                  No extra tech debt
                </div>
              </CardContent>
            </Card>
            <Card
              hoverable
              onClick={() => handleAiDecision(true)}
              className="cursor-pointer border-purple-500/50"
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl mb-2">AI Robot</div>
                <div className="font-semibold text-white">Use AI</div>
                <div className="text-xs text-green-400 mt-1">
                  +2 power!
                </div>
                <div className="text-xs text-red-400 mt-1">
                  Generates tech debt
                </div>
              </CardContent>
            </Card>
          </div>

          <QuickTip>
            Seniors with AI are most efficient (+2 power for only 1 debt)
          </QuickTip>
        </div>
      </Modal>

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
