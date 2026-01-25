import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent } from '../ui';
import { useGameStore } from '../../state/gameStore';

export function SetupScreen() {
  const [playerCount, setPlayerCount] = useState(2);
  const initGame = useGameStore((state) => state.initGame);

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">Ship It!</h1>
          <p className="text-xl text-gray-400">
            The Software Startup Board Game
          </p>
        </div>

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-lg font-semibold text-white mb-4">
              Number of Players
            </h2>
            <div className="flex gap-3">
              {[2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setPlayerCount(num)}
                  className={`
                    flex-1 py-4 rounded-lg text-xl font-bold transition-all
                    ${
                      playerCount === num
                        ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }
                  `}
                >
                  {num}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          className="w-full"
          size="lg"
          onClick={() => initGame(playerCount)}
        >
          Start Game
        </Button>

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>2-4 players | 4 rounds | ~30 minutes</p>
        </div>
      </motion.div>
    </div>
  );
}
