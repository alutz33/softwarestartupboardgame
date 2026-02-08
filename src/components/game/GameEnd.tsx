import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent } from '../ui';
import { useGameStore } from '../../state/gameStore';

export function GameEnd() {
  const players = useGameStore((state) => state.players);
  const winner = useGameStore((state) => state.winner);
  const finalScores = useGameStore((state) => state.finalScores);
  const calculateWinner = useGameStore((state) => state.calculateWinner);
  const initGame = useGameStore((state) => state.initGame);

  useEffect(() => {
    if (!winner) {
      calculateWinner();
    }
  }, [winner, calculateWinner]);

  const winningPlayer = players.find((p) => p.id === winner);

  // Sort players by score
  const sortedPlayers = [...players].sort((a, b) => {
    const scoreA = finalScores?.get(a.id) || 0;
    const scoreB = finalScores?.get(b.id) || 0;
    return scoreB - scoreA;
  });

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl">
        {/* Winner announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="text-8xl mb-4"
          >
            🎉
          </motion.div>
          <h1 className="text-5xl font-bold text-white mb-2">End of Year 1!</h1>
          {winningPlayer && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-2xl text-gray-400 mb-2">Winner</p>
              <p
                className="text-4xl font-bold"
                style={{ color: winningPlayer.color }}
              >
                {winningPlayer.name}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Final standings */}
        <div className="space-y-4 mb-8">
          {sortedPlayers.map((player, i) => {
            const score = finalScores?.get(player.id) || 0;
            const isWinner = player.id === winner;

            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Card
                  className={
                    isWinner
                      ? 'border-yellow-500 bg-yellow-900/10'
                      : ''
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl font-bold ${
                          i === 0
                            ? 'bg-yellow-600 text-white'
                            : i === 1
                            ? 'bg-gray-400 text-white'
                            : i === 2
                            ? 'bg-orange-700 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        {i + 1}
                      </div>

                      {/* Player info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="text-xl font-semibold text-white">
                            {player.name}
                          </span>
                          {isWinner && (
                            <span className="text-yellow-400 ml-2">👑</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          {player.strategy?.funding} |{' '}
                          {player.strategy?.tech} |{' '}
                          {player.strategy?.product}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-xs text-gray-500">MAU</div>
                          <div className="text-lg font-bold text-blue-400">
                            {player.metrics.mau.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Revenue</div>
                          <div className="text-lg font-bold text-green-400">
                            ${player.metrics.revenue}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Rating</div>
                          <div className="text-lg font-bold text-yellow-400">
                            {player.metrics.rating}/10
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Score</div>
                        <div className="text-3xl font-bold text-white">
                          {score}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Play again */}
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => initGame(players.length)}
          >
            Play Again
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => window.location.reload()}
          >
            New Game
          </Button>
        </div>
      </div>
    </div>
  );
}
