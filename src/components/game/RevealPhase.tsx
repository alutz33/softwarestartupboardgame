import { motion } from 'framer-motion';
import { Button, Card, CardContent, Badge } from '../ui';
import { useGameStore } from '../../state/gameStore';
import { ACTION_SPACES } from '../../data/actions';

export function RevealPhase() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const revealPlans = useGameStore((state) => state.revealPlans);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Plans Revealed!
          </motion.h1>
          <p className="text-gray-400">
            Round {roundState.roundNumber} - See what everyone planned
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {players.map((player, i) => (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-semibold text-white">
                      {player.name}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {player.plannedActions.map((action, j) => {
                      const engineer = player.engineers.find(
                        (e) => e.id === action.engineerId
                      );
                      const actionSpace = ACTION_SPACES.find(
                        (a) => a.id === action.actionType
                      );

                      return (
                        <motion.div
                          key={action.engineerId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 + j * 0.05 + 0.3 }}
                          className="p-2 bg-gray-700/50 rounded"
                        >
                          <div className="text-sm text-white">
                            {engineer?.name}
                            {action.useAiAugmentation && (
                              <Badge variant="info" size="sm" className="ml-2">
                                +AI
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-blue-400">
                            → {actionSpace?.name}
                          </div>
                        </motion.div>
                      );
                    })}

                    {player.plannedActions.length === 0 && (
                      <div className="text-sm text-gray-500 italic">
                        No actions planned
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={revealPlans}>
            {players.some((p) =>
              p.plannedActions.some((a) => a.actionType === 'optimize-code')
            )
              ? 'Start Puzzle Challenge!'
              : 'Execute Actions'}
          </Button>
        </div>
      </div>
    </div>
  );
}
