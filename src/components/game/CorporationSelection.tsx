import { useState } from 'react';
import { Button, Card, CardContent, Input, Badge } from '../ui';
import { useGameStore } from '../../state/gameStore';
import {
  FUNDING_OPTIONS,
  TECH_OPTIONS,
  PRODUCT_OPTIONS,
} from '../../data/corporations';
import type { FundingType, TechType, ProductType, CorporationStrategy } from '../../types';

export function CorporationSelection() {
  const players = useGameStore((state) => state.players);
  const setPlayerName = useGameStore((state) => state.setPlayerName);
  const selectStrategy = useGameStore((state) => state.selectStrategy);
  const playerReady = useGameStore((state) => state.playerReady);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerName, setPlayerNameLocal] = useState('');
  const [selectedFunding, setSelectedFunding] = useState<FundingType | null>(null);
  const [selectedTech, setSelectedTech] = useState<TechType | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(null);

  const currentPlayer = players[currentPlayerIndex];
  const isComplete = selectedFunding && selectedTech && selectedProduct;

  const handleConfirm = () => {
    if (!isComplete) return;

    // Set player name
    const name = playerName.trim() || `Player ${currentPlayerIndex + 1}`;
    setPlayerName(currentPlayer.id, name);

    // Set strategy
    const strategy: CorporationStrategy = {
      funding: selectedFunding!,
      tech: selectedTech!,
      product: selectedProduct!,
    };
    selectStrategy(currentPlayer.id, strategy);
    playerReady(currentPlayer.id);

    // Move to next player or start game
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
      setPlayerNameLocal('');
      setSelectedFunding(null);
      setSelectedTech(null);
      setSelectedProduct(null);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose Your Strategy
          </h1>
          <p className="text-gray-400">
            Player {currentPlayerIndex + 1} of {players.length}
          </p>
        </div>

        {/* Player Name */}
        <div className="max-w-md mx-auto mb-8">
          <Input
            label="Your Name"
            placeholder={`Player ${currentPlayerIndex + 1}`}
            value={playerName}
            onChange={(e) => setPlayerNameLocal(e.target.value)}
          />
        </div>

        {/* Strategy Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Funding */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-sm">
                $
              </span>
              Funding Strategy
            </h2>
            <div className="space-y-3">
              {FUNDING_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hoverable
                  selected={selectedFunding === option.id}
                  onClick={() => setSelectedFunding(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{option.name}</h3>
                      <Badge variant="success">${option.startingMoney}</Badge>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {option.description}
                    </p>
                    <p className="text-xs text-blue-400 mb-2">{option.bonusEffect}</p>
                    {/* Unique Power */}
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="info" size="sm">POWER</Badge>
                        <span className="text-xs font-semibold text-purple-400">{option.power.name}</span>
                      </div>
                      <p className="text-xs text-gray-500">{option.power.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Tech */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm">
                {'</>'}
              </span>
              Tech Approach
            </h2>
            <div className="space-y-3">
              {TECH_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hoverable
                  selected={selectedTech === option.id}
                  onClick={() => setSelectedTech(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{option.name}</h3>
                      <div className="flex gap-1">
                        <Badge variant="info">AI: {option.startingAiCapacity}</Badge>
                        {option.startingTechDebt > 0 && (
                          <Badge variant="warning">
                            Debt: {option.startingTechDebt}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {option.description}
                    </p>
                    <p className="text-xs text-purple-400">{option.bonusEffect}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-sm">
                P
              </span>
              Product Type
            </h2>
            <div className="space-y-3">
              {PRODUCT_OPTIONS.map((option) => (
                <Card
                  key={option.id}
                  hoverable
                  selected={selectedProduct === option.id}
                  onClick={() => setSelectedProduct(option.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">{option.name}</h3>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {option.description}
                    </p>
                    <div className="flex gap-2 text-xs">
                      <span className="text-blue-400">
                        MAU: {option.mauMultiplier}x
                      </span>
                      <span className="text-green-400">
                        Rev: {option.revenueMultiplier}x
                      </span>
                      <span className="text-yellow-400">
                        Rating: {option.ratingMultiplier}x
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!isComplete}
            onClick={handleConfirm}
            className="min-w-[200px]"
          >
            {currentPlayerIndex < players.length - 1
              ? 'Next Player'
              : 'Start Game'}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {players.map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-colors ${
                i < currentPlayerIndex
                  ? 'bg-green-500'
                  : i === currentPlayerIndex
                  ? 'bg-blue-500'
                  : 'bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
