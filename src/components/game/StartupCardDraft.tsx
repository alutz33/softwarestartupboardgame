import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent, Input, Badge } from '../ui';
import { useGameStore } from '../../state/gameStore';
import { FUNDING_OPTIONS, TECH_OPTIONS, PRODUCT_OPTIONS } from '../../data/corporations';
import type { StartupCard } from '../../types';

function StartupCardDisplay({
  card,
  isSelected,
  isDiscarded,
  onClick,
}: {
  card: StartupCard;
  isSelected: boolean;
  isDiscarded: boolean;
  onClick: () => void;
}) {
  const funding = FUNDING_OPTIONS.find(f => f.id === card.funding);
  const tech = TECH_OPTIONS.find(t => t.id === card.tech);
  const product = PRODUCT_OPTIONS.find(p => p.id === card.product);

  // Calculate starting resources for display
  const startingMoney = card.startingMoney ?? funding?.startingMoney ?? 0;
  const startingAi = card.startingAiCapacity ?? tech?.startingAiCapacity ?? 0;
  const startingDebt = card.startingTechDebt ?? tech?.startingTechDebt ?? 0;
  const startingMau = card.startingMau ?? Math.round(1000 * (product?.mauMultiplier ?? 1));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: isDiscarded ? 0.3 : 1,
        scale: isSelected ? 1.02 : 1,
        filter: isDiscarded ? 'grayscale(100%)' : 'none',
      }}
      whileHover={!isDiscarded ? { scale: 1.02 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Card
        hoverable={!isDiscarded}
        selected={isSelected}
        onClick={isDiscarded ? undefined : onClick}
        className={`${isDiscarded ? 'cursor-not-allowed' : 'cursor-pointer'} h-full`}
      >
        <CardContent className="p-5">
          {/* Card Name */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white">{card.name}</h3>
            <p className="text-sm text-gray-400 italic">{card.tagline}</p>
          </div>

          {/* Strategy Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="success">{funding?.name}</Badge>
            <Badge variant="info">{tech?.name}</Badge>
            <Badge variant="warning">{product?.name}</Badge>
          </div>

          {/* Starting Resources */}
          <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
            <div className="text-xs text-gray-500 mb-2 text-center">STARTING RESOURCES</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Money:</span>
                <span className="text-green-400 font-semibold">${startingMoney}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">AI Capacity:</span>
                <span className="text-purple-400 font-semibold">{startingAi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tech Debt:</span>
                <span className={`font-semibold ${startingDebt > 0 ? 'text-orange-400' : 'text-green-400'}`}>
                  {startingDebt}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">MAU:</span>
                <span className="text-blue-400 font-semibold">{startingMau.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Multipliers */}
          <div className="flex justify-center gap-3 text-xs mb-4">
            <span className="text-blue-400">MAU: {product?.mauMultiplier}x</span>
            <span className="text-green-400">Rev: {product?.revenueMultiplier}x</span>
            <span className="text-yellow-400">Rating: {product?.ratingMultiplier}x</span>
          </div>

          {/* Special Ability */}
          {card.ability ? (
            <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="info" size="sm">ABILITY</Badge>
                <span className="text-sm font-semibold text-purple-300 capitalize">
                  {card.ability.type.replace(/-/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-300">{card.ability.description}</p>
            </div>
          ) : (
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="text-xs text-gray-500 text-center">
                No special ability - balanced starting bonuses
              </div>
            </div>
          )}

          {/* Selection indicator */}
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center"
            >
              <Badge variant="success">SELECTED</Badge>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StartupCardDraft() {
  const players = useGameStore((state) => state.players);
  const getDealtCards = useGameStore((state) => state.getDealtCards);
  const selectStartupCard = useGameStore((state) => state.selectStartupCard);
  const setPlayerName = useGameStore((state) => state.setPlayerName);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerName, setPlayerNameLocal] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const dealtCards = getDealtCards(currentPlayer.id);

  const handleCardSelect = (cardId: string) => {
    if (hasConfirmed) return;
    setSelectedCardId(cardId);
  };

  const handleConfirm = () => {
    if (!selectedCardId) return;

    // Set player name
    const name = playerName.trim() || `Player ${currentPlayerIndex + 1}`;
    setPlayerName(currentPlayer.id, name);

    // Select the startup card
    selectStartupCard(currentPlayer.id, selectedCardId);
    setHasConfirmed(true);

    // Move to next player after a brief delay
    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setPlayerNameLocal('');
        setSelectedCardId(null);
        setHasConfirmed(false);
      }
    }, 500);
  };

  // Check if this player already selected (from store)
  const hasSelected = currentPlayer.startupCard !== undefined;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-2"
          >
            Choose Your Startup
          </motion.h1>
          <p className="text-gray-400 text-lg">
            Player {currentPlayerIndex + 1} of {players.length}
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Each startup has unique attributes and abilities. Choose wisely!
          </p>
        </div>

        {/* Player Name */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="max-w-md mx-auto mb-8"
        >
          <Input
            label="CEO Name"
            placeholder={`Player ${currentPlayerIndex + 1}`}
            value={playerName}
            onChange={(e) => setPlayerNameLocal(e.target.value)}
            disabled={hasConfirmed || hasSelected}
          />
        </motion.div>

        {/* Startup Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <AnimatePresence mode="wait">
            {dealtCards.map((card) => (
              <StartupCardDisplay
                key={card.id}
                card={card}
                isSelected={selectedCardId === card.id}
                isDiscarded={hasConfirmed && selectedCardId !== card.id}
                onClick={() => handleCardSelect(card.id)}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Instructions */}
        {!selectedCardId && !hasConfirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-400 mb-6"
          >
            Click a startup card to select it
          </motion.div>
        )}

        {/* Confirm Button */}
        <div className="flex justify-center">
          <Button
            size="lg"
            disabled={!selectedCardId || hasConfirmed || hasSelected}
            onClick={handleConfirm}
            className="min-w-[200px]"
          >
            {hasConfirmed || hasSelected
              ? 'Confirmed!'
              : currentPlayerIndex < players.length - 1
                ? 'Confirm & Next Player'
                : 'Confirm & Start Game'}
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mt-6">
          {players.map((player, i) => (
            <div
              key={player.id}
              className={`w-3 h-3 rounded-full transition-colors ${
                player.startupCard
                  ? 'bg-green-500'
                  : i === currentPlayerIndex
                    ? 'bg-blue-500'
                    : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-xs text-gray-600">
          <p>Startup cards combine funding strategy, tech approach, and product type.</p>
          <p>Some cards include special abilities that provide ongoing benefits.</p>
        </div>
      </div>
    </div>
  );
}
