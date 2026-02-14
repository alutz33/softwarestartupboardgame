import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent, Badge } from '../ui';
import { PhaseGuide } from '../ui/PhaseGuide';
import { useGameStore } from '../../state/gameStore';
import type { SprintPlayerState, SprintToken } from '../../types';

function getTokenTextColor(token: SprintToken): string {
  switch (token.type) {
    case 'clean-code-1': return 'text-green-400';
    case 'clean-code-2': return 'text-teal-400';
    case 'bug': return 'text-orange-400';
    case 'critical-bug': return 'text-red-400';
  }
}

function getTokenBorderColor(token: SprintToken): string {
  switch (token.type) {
    case 'clean-code-1': return 'border-green-500';
    case 'clean-code-2': return 'border-teal-500';
    case 'bug': return 'border-orange-500';
    case 'critical-bug': return 'border-red-700';
  }
}

function getTokenBgColor(token: SprintToken): string {
  switch (token.type) {
    case 'clean-code-1': return 'bg-green-900/30';
    case 'clean-code-2': return 'bg-teal-900/30';
    case 'bug': return 'bg-orange-900/30';
    case 'critical-bug': return 'bg-red-900/40';
  }
}

function isPlayerDone(ps: SprintPlayerState): boolean {
  return ps.hasStopped || ps.hasCrashed || ps.drawnTokens.length >= ps.maxDraws;
}

export function SprintPhase() {
  const players = useGameStore(s => s.players);
  const roundState = useGameStore(s => s.roundState);
  const currentRound = useGameStore(s => s.currentRound);
  const startSprint = useGameStore(s => s.startSprint);
  const drawSprintToken = useGameStore(s => s.drawSprintToken);
  const stopSprint = useGameStore(s => s.stopSprint);
  const endSprint = useGameStore(s => s.endSprint);

  const sprintState = roundState.sprintState;

  // Initialize sprint on mount if not already initialized
  useEffect(() => {
    if (!sprintState) {
      startSprint();
    }
  }, [sprintState, startSprint]);

  if (!sprintState) return null;

  const currentPlayerId = sprintState.drawOrder[sprintState.currentPlayerIndex];
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const currentPlayerState = sprintState.playerStates.find(
    ps => ps.playerId === currentPlayerId
  );

  const allDone = sprintState.isComplete;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Sprint Mini-Game - Q{currentRound}
          </motion.h1>
          <p className="text-gray-400">
            {allDone
              ? 'Sprint Complete! Review results below.'
              : `${currentPlayer?.name}'s turn to draw`}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Phase guide + Token bag */}
          <div className="lg:col-span-1">
            <PhaseGuide phase="sprint" currentRound={currentRound} />

            {/* Token bag visualization */}
            <Card className="mt-4">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Token Bag
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {sprintState.tokenBag.length}
                    </span>
                  </div>
                  <span className="text-sm text-gray-400">
                    tokens remaining
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Other players' progress */}
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-300">
                All Players
              </h3>
              {sprintState.playerStates.map((ps) => {
                const player = players.find(p => p.id === ps.playerId);
                if (!player) return null;
                const isCurrent = ps.playerId === currentPlayerId && !allDone;

                return (
                  <motion.div
                    key={ps.playerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className={isCurrent ? 'ring-2 ring-blue-500' : ''}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-sm font-semibold text-white">
                            {player.name}
                          </span>
                          {ps.hasCrashed && (
                            <Badge variant="danger" size="sm">Crashed</Badge>
                          )}
                          {ps.hasStopped && (
                            <Badge variant="success" size="sm">Stopped</Badge>
                          )}
                          {!isPlayerDone(ps) && !isCurrent && (
                            <Badge variant="default" size="sm">Waiting</Badge>
                          )}
                          {isCurrent && !isPlayerDone(ps) && (
                            <Badge variant="info" size="sm">Drawing</Badge>
                          )}
                        </div>
                        <div className="flex gap-3 text-xs">
                          <span className="text-green-400">
                            Code: {ps.hasCrashed ? 0 : ps.cleanCodeTotal}
                          </span>
                          <span className={ps.bugCount >= 2 ? 'text-red-400' : 'text-gray-400'}>
                            Bugs: {ps.bugCount}/3
                          </span>
                          <span className="text-gray-400">
                            Draws: {ps.drawnTokens.length}/{ps.maxDraws}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Center/Right column: Current player's sprint area */}
          <div className="lg:col-span-2">
            {!allDone && currentPlayerState && currentPlayer && (
              <Card className="mb-6">
                <CardContent className="p-6">
                  {/* Current player header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full"
                        style={{ backgroundColor: currentPlayer.color }}
                      />
                      <h2 className="text-xl font-bold text-white">
                        {currentPlayer.name}
                      </h2>
                      {currentPlayerState.isParticipant ? (
                        <Badge variant="success" size="sm">Participant</Badge>
                      ) : (
                        <Badge variant="default" size="sm">Free Draw</Badge>
                      )}
                    </div>
                  </div>

                  {/* Stats bar */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-800 rounded p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Clean Code</div>
                      <div className="text-2xl font-bold text-green-400">
                        {currentPlayerState.cleanCodeTotal}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Bugs</div>
                      <div className={`text-2xl font-bold ${
                        currentPlayerState.bugCount >= 2 ? 'text-red-400' :
                        currentPlayerState.bugCount >= 1 ? 'text-orange-400' : 'text-gray-300'
                      }`}>
                        {currentPlayerState.bugCount}/3
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Draws Left</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {currentPlayerState.maxDraws - currentPlayerState.drawnTokens.length}
                      </div>
                    </div>
                  </div>

                  {/* Backend revert indicator */}
                  {currentPlayerState.hasBackendRevert && (
                    <div className={`mb-4 p-2 rounded border ${
                      currentPlayerState.usedBackendRevert
                        ? 'border-gray-600 bg-gray-800/50'
                        : 'border-blue-500 bg-blue-900/30'
                    }`}>
                      <span className={`text-sm ${
                        currentPlayerState.usedBackendRevert
                          ? 'text-gray-500 line-through'
                          : 'text-blue-300'
                      }`}>
                        Backend Revert: Ignore one bug {currentPlayerState.usedBackendRevert ? '(Used)' : '(Available)'}
                      </span>
                    </div>
                  )}

                  {/* Drawn tokens */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">
                      Drawn Tokens
                    </h3>
                    <div className="flex flex-wrap gap-2 min-h-[60px]">
                      <AnimatePresence>
                        {currentPlayerState.drawnTokens.map((token) => (
                          <motion.div
                            key={token.id}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', damping: 15 }}
                            className={`w-16 h-20 rounded-lg border-2 ${getTokenBorderColor(token)} ${getTokenBgColor(token)} flex flex-col items-center justify-center gap-1`}
                          >
                            <span className={`text-[10px] font-semibold ${getTokenTextColor(token)} text-center leading-tight`}>
                              {token.name}
                            </span>
                            <span className={`text-lg font-bold ${getTokenTextColor(token)}`}>
                              {token.isBug ? (token.isCritical ? 'x2' : 'x1') : `+${token.value}`}
                            </span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {currentPlayerState.drawnTokens.length === 0 && (
                        <div className="text-sm text-gray-500 italic flex items-center">
                          No tokens drawn yet - click Draw Token to begin!
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Crash animation */}
                  <AnimatePresence>
                    {currentPlayerState.hasCrashed && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mb-4 p-4 bg-red-900/50 border-2 border-red-500 rounded-lg text-center"
                      >
                        <div className="text-3xl font-bold text-red-400 mb-1">
                          CRASH!
                        </div>
                        <p className="text-red-300 text-sm">
                          Too many bugs! All clean code progress lost.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action buttons */}
                  <div className="flex gap-4 justify-center">
                    <Button
                      size="lg"
                      onClick={() => drawSprintToken(currentPlayerId)}
                      disabled={isPlayerDone(currentPlayerState)}
                    >
                      Draw Token
                    </Button>
                    <Button
                      size="lg"
                      variant="secondary"
                      onClick={() => stopSprint(currentPlayerId)}
                      disabled={isPlayerDone(currentPlayerState)}
                    >
                      Stop & Keep
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results summary when all done */}
            {allDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold text-white mb-4 text-center">
                      Sprint Results
                    </h2>

                    {/* Results table */}
                    <div className="space-y-3 mb-6">
                      {sprintState.playerStates
                        .slice()
                        .sort((a, b) => {
                          const aTotal = a.hasCrashed ? 0 : a.cleanCodeTotal;
                          const bTotal = b.hasCrashed ? 0 : b.cleanCodeTotal;
                          return bTotal - aTotal;
                        })
                        .map((ps, i) => {
                          const player = players.find(p => p.id === ps.playerId);
                          if (!player) return null;
                          const effectiveTotal = ps.hasCrashed ? 0 : ps.cleanCodeTotal;
                          const nonCrashedTotals = sprintState.playerStates
                            .filter(s => !s.hasCrashed)
                            .map(s => s.cleanCodeTotal);
                          const bestTotal = nonCrashedTotals.length > 0
                            ? Math.max(...nonCrashedTotals)
                            : 0;
                          const isBest = effectiveTotal > 0 && effectiveTotal === bestTotal;

                          return (
                            <div
                              key={ps.playerId}
                              className={`flex items-center justify-between p-3 rounded ${
                                isBest ? 'bg-yellow-900/30 border border-yellow-600' : 'bg-gray-800'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-lg font-bold text-gray-500">
                                  #{i + 1}
                                </span>
                                <div
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: player.color }}
                                />
                                <span className="text-white font-medium">
                                  {player.name}
                                </span>
                                {ps.hasCrashed && (
                                  <Badge variant="danger" size="sm">Crashed</Badge>
                                )}
                                {isBest && (
                                  <Badge variant="warning" size="sm">Best Sprint</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <span className="text-green-400">
                                  -{effectiveTotal} debt
                                </span>
                                {isBest && (
                                  <span className="text-yellow-400">+1 rating</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="flex justify-center">
                      <Button size="lg" onClick={endSprint}>
                        Continue to Resolution
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
