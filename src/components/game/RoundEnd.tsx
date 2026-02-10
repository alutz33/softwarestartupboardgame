import { motion } from 'framer-motion';
import { Button, Card, CardContent } from '../ui';
import { HelpCard } from '../ui/HelpCard';
import { MilestoneTracker } from '../ui/MilestoneTracker';
import { WinCondition, ScoreBreakdown } from '../ui/WinCondition';
import { MiniDebtIndicator } from '../ui/TechDebtWarning';
import { useGameStore } from '../../state/gameStore';
import { TOTAL_QUARTERS } from '../../types';

function StatBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-medium">
          {typeof value === 'number' && value % 1 !== 0
            ? value.toFixed(1)
            : value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

export function RoundEnd() {
  const players = useGameStore((state) => state.players);
  const currentRound = useGameStore((state) => state.currentRound);
  const currentQuarter = useGameStore((state) => state.currentQuarter);
  const milestones = useGameStore((state) => state.milestones);
  const endRound = useGameStore((state) => state.endRound);

  const maxMau = Math.max(...players.map((p) => p.metrics.mau), 1);
  const maxRevenue = Math.max(...players.map((p) => p.metrics.revenue), 1);

  // Sort players by estimated score
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = a.metrics.mau / 1000 + a.metrics.revenue / 500 + a.metrics.rating * 5;
    const scoreB = b.metrics.mau / 1000 + b.metrics.revenue / 500 + b.metrics.rating * 5;
    return scoreB - scoreA;
  });

  // Calculate draft order for next quarter (lowest MAU first)
  const draftOrder = [...players]
    .sort((a, b) => a.metrics.mau - b.metrics.mau)
    .map(p => p.name);

  // Check for newly claimed milestones this round
  const newMilestones = milestones.filter(m => m.claimedRound === currentRound);

  // Calculate milestone points per player
  const getMilestonePoints = (playerId: string) => {
    return milestones
      .filter(m => m.claimedBy === playerId)
      .reduce((sum, m) => sum + m.bonus, 0);
  };

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
            Q{currentQuarter} Complete!
          </h1>
          <p className="text-gray-400">
            {currentQuarter < TOTAL_QUARTERS
              ? `${TOTAL_QUARTERS - currentQuarter} quarter${TOTAL_QUARTERS - currentQuarter !== 1 ? 's' : ''} remaining in Year 1`
              : 'End of Year 1!'}
          </p>
        </div>

        {/* New Milestones Alert */}
        {newMilestones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4 mb-6"
          >
            <h3 className="text-yellow-400 font-bold mb-2">Milestones Claimed This Quarter!</h3>
            <div className="flex flex-wrap gap-3">
              {newMilestones.map(m => {
                const player = players.find(p => p.id === m.claimedBy);
                return (
                  <div key={m.id} className="flex items-center gap-2 bg-yellow-500/10 px-3 py-2 rounded">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: player?.color }}
                    />
                    <span className="text-white font-medium">{player?.name}</span>
                    <span className="text-gray-400">claimed</span>
                    <span className="text-yellow-400">{m.name}</span>
                    <span className="text-yellow-500 text-sm">(+{m.bonus} pts)</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Main content - Player summaries */}
          <div className="col-span-12 lg:col-span-8">
            {/* Standings header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Current Standings</h2>
              <div className="text-xs text-gray-500">
                Ranked by estimated final score
              </div>
            </div>

            {/* Player summaries */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {sortedPlayers.map((player, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className={i === 0 ? 'ring-2 ring-yellow-500/50' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${
                            i === 0 ? 'text-yellow-400' :
                            i === 1 ? 'text-gray-300' :
                            i === 2 ? 'text-orange-400' : 'text-gray-500'
                          }`}>
                            #{i + 1}
                          </span>
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="font-semibold text-white">
                            {player.name}
                          </span>
                          {i === 0 && <span className="text-yellow-400">Leader</span>}
                        </div>
                        <MiniDebtIndicator techDebt={player.resources.techDebt} />
                      </div>

                      <div className="space-y-3">
                        <StatBar
                          label="MAU"
                          value={player.metrics.mau}
                          maxValue={maxMau}
                          color="bg-blue-500"
                        />
                        <StatBar
                          label="Revenue"
                          value={player.metrics.revenue}
                          maxValue={maxRevenue}
                          color="bg-green-500"
                        />
                        <StatBar
                          label="Rating"
                          value={player.metrics.rating}
                          maxValue={5}
                          color="bg-yellow-500"
                        />
                      </div>

                      <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <div className="text-gray-500 text-xs">Money</div>
                          <div className="text-green-400 font-medium">
                            ${player.resources.money}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Servers</div>
                          <div className="text-blue-400 font-medium">
                            {player.resources.serverCapacity}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">AI Cap</div>
                          <div className="text-purple-400 font-medium">
                            {player.resources.aiCapacity}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs">Engineers</div>
                          <div className="text-cyan-400 font-medium">
                            {player.engineers.length}
                          </div>
                        </div>
                      </div>

                      {/* Milestone points */}
                      {getMilestonePoints(player.id) > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <div className="flex justify-between text-sm">
                            <span className="text-purple-400">Milestone Bonus:</span>
                            <span className="text-purple-400 font-bold">+{getMilestonePoints(player.id)} pts</span>
                          </div>
                        </div>
                      )}

                      {/* Score Breakdown (collapsible) */}
                      <details className="mt-3">
                        <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-300">
                          View score breakdown
                        </summary>
                        <div className="mt-2">
                          <ScoreBreakdown player={player} milestonePoints={getMilestonePoints(player.id)} />
                        </div>
                      </details>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right sidebar - Info */}
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Win Condition reminder */}
            <WinCondition players={players} currentRound={currentQuarter} />

            {/* Milestones */}
            <MilestoneTracker
              milestones={milestones}
              players={players}
            />

            {/* Next Quarter Preview */}
            {currentQuarter < TOTAL_QUARTERS && (
              <HelpCard title="Next Quarter Preview" variant="info">
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="text-gray-400 mb-1">Draft Order (lowest MAU first):</div>
                    <div className="space-y-1">
                      {draftOrder.map((name, i) => (
                        <div key={name} className="flex items-center gap-2">
                          <span className={`w-5 text-center ${i === 0 ? 'text-green-400' : 'text-gray-500'}`}>
                            {i + 1}.
                          </span>
                          <span className="text-white">{name}</span>
                          {i === 0 && <span className="text-green-400 text-[10px]">(picks first!)</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-400">Income Cap Next Quarter:</div>
                    <div className="text-yellow-400 font-bold">${30 + ((currentQuarter + 1) * 10)}</div>
                  </div>

                  <div>
                    <div className="text-gray-400">Engineer Pool Quality:</div>
                    <div className="text-white">
                      {currentQuarter + 1 === 2 ? '40%' : currentQuarter + 1 === 3 ? '50%' : '60%'} seniors
                    </div>
                  </div>
                </div>
              </HelpCard>
            )}

            {/* Tips based on standings */}
            <HelpCard title="Strategy Tips" variant="tip" collapsible defaultExpanded={false}>
              <div className="space-y-2 text-xs">
                {sortedPlayers[0] && sortedPlayers[0].id === sortedPlayers[0].id && (
                  <p className="text-yellow-400">
                    <strong>Leaders:</strong> Watch out for catch-up mechanics!
                    Trailing players draft first and get bonus income.
                  </p>
                )}
                <p className="text-blue-400">
                  <strong>Behind?</strong> Focus on unclaimed milestones and block
                  leaders from exclusive actions (Marketing, Recruiter).
                </p>
                <p className="text-green-400">
                  <strong>Tech Debt:</strong> Keep it below 7 to avoid the -10 point penalty!
                </p>
              </div>
            </HelpCard>
          </div>
        </div>

        <div className="flex justify-center mt-8">
          <Button size="lg" onClick={endRound}>
            {currentQuarter < TOTAL_QUARTERS ? 'Start Next Quarter' : 'See Year 1 Results'}
          </Button>
        </div>
      </div>
    </div>
  );
}
