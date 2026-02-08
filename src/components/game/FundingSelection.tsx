import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent, Badge } from '../ui';
import { PhaseGuide } from '../ui/PhaseGuide';
import { useGameStore } from '../../state/gameStore';
import type { FundingType, ProductType } from '../../types';
import { FUNDING_OPTIONS } from '../../data/corporations';

const productTypeLabels: Record<ProductType, string> = {
  b2b: 'B2B SaaS',
  consumer: 'Consumer App',
  platform: 'Platform Play',
};

export function FundingSelection() {
  const players = useGameStore((state) => state.players);
  const selectFunding = useGameStore((state) => state.selectFunding);
  const [selectedFunding, setSelectedFunding] = useState<Record<string, FundingType | null>>({});

  // Find players who haven't selected funding yet
  const pendingPlayers = players.filter((p) => !p.strategy);
  const currentPlayer = pendingPlayers[0];

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">All players have selected funding. Starting game...</div>
      </div>
    );
  }

  const leader = currentPlayer.leader;
  if (!leader) return null;

  const leaderSide = leader.leaderSide;
  const currentSelection = selectedFunding[currentPlayer.id] || null;

  const handleConfirm = () => {
    if (currentSelection) {
      selectFunding(currentPlayer.id, currentSelection);
      setSelectedFunding((prev) => ({ ...prev, [currentPlayer.id]: null }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <PhaseGuide phase="funding-selection" />

            {/* Show selected leader info */}
            <Card className="bg-gradient-to-br from-yellow-900/30 to-gray-800 border-yellow-700/50">
              <CardContent className="p-4">
                <div className="text-xs text-yellow-400 font-semibold mb-2">YOUR LEADER</div>
                <div className="text-lg font-bold text-white">{leader.name}</div>
                <div className="text-sm text-yellow-300">{leaderSide.title}</div>
                <div className="text-xs text-gray-400 italic mt-1">"{leaderSide.flavor}"</div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {leaderSide.productLock.map((p) => (
                    <Badge key={p} variant="info" size="sm">
                      {productTypeLabels[p]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Player progress */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="text-xs text-gray-400 font-semibold mb-2">PROGRESS</div>
                {players.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-sm mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: p.color }}
                    />
                    <span className={p.strategy ? 'text-green-400' : 'text-gray-400'}>
                      {p.name}
                    </span>
                    {p.strategy && <span className="text-green-400 text-xs">Done</span>}
                    {p.id === currentPlayer.id && !p.strategy && (
                      <span className="text-yellow-400 text-xs">Choosing...</span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
                {' '}- Choose Your Funding
              </h2>
              <p className="text-gray-400 mt-1">
                Select a funding strategy to complement {leader.name}'s strengths
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {FUNDING_OPTIONS.map((funding) => {
                const isSelected = currentSelection === funding.id;

                return (
                  <motion.div
                    key={funding.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedFunding((prev) => ({
                      ...prev,
                      [currentPlayer.id]: funding.id,
                    }))}
                    className="cursor-pointer"
                  >
                    <Card
                      className={`h-full transition-all ${
                        isSelected
                          ? 'border-2 border-green-500 bg-green-900/20'
                          : 'border border-gray-700 bg-gray-800 hover:border-gray-500'
                      }`}
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-bold text-white">{funding.name}</h3>
                          {isSelected && (
                            <Badge variant="success" size="sm">Selected</Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-300 mb-4">{funding.description}</p>

                        {/* Key stats */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Starting Cash</span>
                            <span className="text-green-400 font-semibold">${funding.startingMoney}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Equity Retained</span>
                            <span className="text-blue-400 font-semibold">{funding.equityRetained}%</span>
                          </div>
                        </div>

                        {/* Bonus effect */}
                        <div className="bg-gray-900/50 rounded p-3">
                          <div className="text-xs text-yellow-400 font-semibold mb-1">BONUS</div>
                          <p className="text-xs text-gray-300">{funding.bonusEffect}</p>
                        </div>

                        {/* Power */}
                        <div className="mt-3 bg-purple-900/20 border border-purple-700/30 rounded p-2">
                          <div className="text-xs text-purple-400 font-semibold">{funding.power.name}</div>
                          <p className="text-[10px] text-gray-400">{funding.power.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Confirm button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleConfirm}
                disabled={!currentSelection}
                className="px-8 py-3 text-lg"
              >
                {currentSelection
                  ? `Confirm ${FUNDING_OPTIONS.find((f) => f.id === currentSelection)?.name}`
                  : 'Select a Funding Type'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
