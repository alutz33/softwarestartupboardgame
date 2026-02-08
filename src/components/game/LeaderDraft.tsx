import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent, Badge, Input } from '../ui';
import { PhaseGuide } from '../ui/PhaseGuide';
import { useGameStore } from '../../state/gameStore';
import type { PersonaCard, ProductType } from '../../types';

const productTypeLabels: Record<ProductType, string> = {
  b2b: 'B2B SaaS',
  consumer: 'Consumer App',
  platform: 'Platform Play',
};

function LeaderCardDisplay({
  card,
  isSelected,
  onClick,
}: {
  card: PersonaCard;
  isSelected: boolean;
  onClick: () => void;
}) {
  const leader = card.leaderSide;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{
        opacity: 1,
        scale: isSelected ? 1.03 : 1,
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        hoverable
        selected={isSelected}
        onClick={onClick}
        className="cursor-pointer h-full"
      >
        <CardContent className="p-5">
          {/* Name & Title */}
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-white">{card.name}</h3>
            <p className="text-sm text-yellow-400">{leader.title}</p>
            <p className="text-xs text-gray-500 italic mt-1">"{leader.flavor}"</p>
          </div>

          {/* Product Lock */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {leader.productLock.map(pt => (
              <Badge key={pt} variant="warning" size="sm">
                {productTypeLabels[pt]}
              </Badge>
            ))}
          </div>

          {/* Starting Bonuses */}
          <div className="bg-gray-900/50 rounded-lg p-3 mb-4">
            <div className="text-xs text-gray-500 mb-2 text-center">STARTING BONUSES</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {leader.startingBonus.money !== undefined && leader.startingBonus.money > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Money:</span>
                  <span className="text-green-400 font-semibold">+${leader.startingBonus.money}</span>
                </div>
              )}
              {leader.startingBonus.rating !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Rating:</span>
                  <span className="text-yellow-400 font-semibold">{leader.startingBonus.rating}/10</span>
                </div>
              )}
              {leader.startingBonus.mauProduction !== undefined && leader.startingBonus.mauProduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">MAU Prod:</span>
                  <span className="text-blue-400 font-semibold">+{leader.startingBonus.mauProduction}</span>
                </div>
              )}
              {leader.startingBonus.revenueProduction !== undefined && leader.startingBonus.revenueProduction > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Rev Prod:</span>
                  <span className="text-green-400 font-semibold">+{leader.startingBonus.revenueProduction}</span>
                </div>
              )}
              {leader.startingBonus.aiCapacity !== undefined && leader.startingBonus.aiCapacity > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">AI Cap:</span>
                  <span className="text-purple-400 font-semibold">+{leader.startingBonus.aiCapacity}</span>
                </div>
              )}
              {leader.startingBonus.serverCapacity !== undefined && leader.startingBonus.serverCapacity > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Servers:</span>
                  <span className="text-orange-400 font-semibold">+{leader.startingBonus.serverCapacity}</span>
                </div>
              )}
              {leader.startingBonus.techDebt !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Tech Debt:</span>
                  <span className={`font-semibold ${leader.startingBonus.techDebt === 0 ? 'text-green-400' : 'text-orange-400'}`}>
                    {leader.startingBonus.techDebt}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Once-per-game Power */}
          <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="danger" size="sm">POWER</Badge>
              <span className="text-sm font-semibold text-red-300">{leader.power.name}</span>
            </div>
            <p className="text-xs text-gray-300">{leader.power.description}</p>
            <p className="text-[10px] text-gray-500 mt-1">Once per game</p>
          </div>

          {/* Passive Ability */}
          <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="info" size="sm">PASSIVE</Badge>
              <span className="text-sm font-semibold text-blue-300">{leader.passive.name}</span>
            </div>
            <p className="text-xs text-gray-300">{leader.passive.description}</p>
            <p className="text-[10px] text-gray-500 mt-1">Active every round</p>
          </div>

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

export function LeaderDraft() {
  const players = useGameStore((state) => state.players);
  const getDealtLeaderCards = useGameStore((state) => state.getDealtLeaderCards);
  const selectLeader = useGameStore((state) => state.selectLeader);
  const setPlayerName = useGameStore((state) => state.setPlayerName);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [playerName, setPlayerNameLocal] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const currentPlayer = players[currentPlayerIndex];
  const dealtCards = getDealtLeaderCards(currentPlayer.id);

  const handleCardSelect = (personaId: string) => {
    if (hasConfirmed) return;
    setSelectedPersonaId(personaId);
  };

  const handleConfirm = () => {
    if (!selectedPersonaId) return;

    // Set player name
    const name = playerName.trim() || `Player ${currentPlayerIndex + 1}`;
    setPlayerName(currentPlayer.id, name);

    // Select leader card
    selectLeader(currentPlayer.id, selectedPersonaId);
    setHasConfirmed(true);

    // Move to next player after a brief delay
    setTimeout(() => {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(currentPlayerIndex + 1);
        setPlayerNameLocal('');
        setSelectedPersonaId(null);
        setHasConfirmed(false);
      }
    }, 500);
  };

  const hasSelected = currentPlayer.leader !== undefined;

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Guide */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <PhaseGuide phase="leader-draft" />
          </div>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl lg:text-4xl font-bold text-white mb-2"
              >
                Choose Your Leader
              </motion.h1>
              <p className="text-gray-400 text-lg">
                Player {currentPlayerIndex + 1} of {players.length}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                Pick a tech mogul to lead your startup. Unchosen leaders become premium engineers!
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

            {/* Leader Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <AnimatePresence mode="wait">
                {dealtCards.map((card) => (
                  <LeaderCardDisplay
                    key={card.id}
                    card={card}
                    isSelected={selectedPersonaId === card.id}
                    onClick={() => handleCardSelect(card.id)}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Instructions */}
            {!selectedPersonaId && !hasConfirmed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-400 mb-6"
              >
                Click a leader card to select them as your CEO
              </motion.div>
            )}

            {/* Confirm Button */}
            <div className="flex justify-center">
              <Button
                size="lg"
                disabled={!selectedPersonaId || hasConfirmed || hasSelected}
                onClick={handleConfirm}
                className="min-w-[200px]"
              >
                {hasConfirmed || hasSelected
                  ? 'Confirmed!'
                  : currentPlayerIndex < players.length - 1
                    ? 'Confirm & Next Player'
                    : 'Confirm & Choose Funding'}
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {players.map((player, i) => (
                <div
                  key={player.id}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    player.leader
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
      </div>
    </div>
  );
}
