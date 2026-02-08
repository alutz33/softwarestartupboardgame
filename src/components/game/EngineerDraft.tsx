import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent, Badge, Modal, Input } from '../ui';
import { HelpCard, QuickTip } from '../ui/HelpCard';
import { PhaseGuide } from '../ui/PhaseGuide';
import { CatchUpIndicator, DraftOrderBadge } from '../ui/CatchUpIndicator';
import { TraitsGuide, PlayerStatsComparison } from '../ui/NoobHelpers';
import { useGameStore } from '../../state/gameStore';
import type { Engineer } from '../../types';
import { ENGINEER_TRAITS } from '../../types';

function EngineerCard({
  engineer,
  onBid,
  currentBid,
  playerMoney,
}: {
  engineer: Engineer;
  onBid: (amount: number) => void;
  currentBid?: number;
  playerMoney: number;
}) {
  const [showBidModal, setShowBidModal] = useState(false);
  const [bidAmount, setBidAmount] = useState(engineer.baseSalary);

  const handleSubmitBid = () => {
    if (bidAmount > 0 && bidAmount <= playerMoney) {
      onBid(bidAmount);
      setShowBidModal(false);
    }
  };

  const specialtyColors: Record<string, string> = {
    frontend: 'bg-pink-600',
    backend: 'bg-blue-600',
    fullstack: 'bg-purple-600',
    devops: 'bg-orange-600',
    ai: 'bg-green-600',
  };

  const specialtyBonuses: Record<string, string> = {
    frontend: '+1 power: Develop Features, Marketing',
    backend: '+1 power: Optimize Code, Servers',
    fullstack: '+1 power: Features & Optimize',
    devops: '+1 power: Servers, AI Research',
    ai: '+1 power: AI Research, Optimize',
  };

  return (
    <>
      <Card hoverable className="relative">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-semibold text-white">{engineer.name}</h3>
              <div className="flex gap-2 mt-1">
                <Badge
                  variant={
                    engineer.level === 'senior'
                      ? 'success'
                      : engineer.level === 'intern'
                        ? 'warning'
                        : 'default'
                  }
                >
                  {engineer.level === 'senior'
                    ? 'Senior'
                    : engineer.level === 'intern'
                      ? 'CS Intern'
                      : 'Junior'}
                </Badge>
                {engineer.specialty && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full text-white ${
                      specialtyColors[engineer.specialty]
                    }`}
                    title={specialtyBonuses[engineer.specialty]}
                  >
                    {engineer.specialty}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Base Salary</div>
              <div className="text-lg font-bold text-green-400">
                ${engineer.baseSalary}
              </div>
            </div>
          </div>

          {/* Specialty bonus hint */}
          {engineer.specialty && (
            <div className="text-[10px] text-gray-500 mb-2">
              Bonus: {specialtyBonuses[engineer.specialty]}
            </div>
          )}

          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-gray-400">Power</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    i < engineer.power
                      ? 'bg-blue-500'
                      : 'bg-gray-700'
                  }`}
                />
              ))}
              <span className="ml-2 text-gray-300">
                {engineer.power}
              </span>
            </div>
          </div>

          {/* Engineer Trait */}
          {engineer.trait && (
            <div className="mb-3 p-2 bg-purple-900/30 border border-purple-700/50 rounded">
              <div className="flex items-center gap-2">
                <Badge variant="info" size="sm">{ENGINEER_TRAITS[engineer.trait].name}</Badge>
              </div>
              <p className="text-[10px] text-purple-300 mt-1">
                {ENGINEER_TRAITS[engineer.trait].description}
              </p>
            </div>
          )}

          {/* AI efficiency hint */}
          <div className="text-xs text-gray-500 mb-3 bg-gray-800/50 p-2 rounded">
            {engineer.trait === 'ai-skeptic' ? (
              <span className="text-orange-400">Cannot use AI (+1 base power instead)</span>
            ) : engineer.level === 'senior' ? (
              <span className="text-green-400">Best with AI: +2 power, only +1 debt</span>
            ) : engineer.level === 'junior' ? (
              <span className="text-yellow-400">OK with AI: +2 power, but +3 debt</span>
            ) : (
              <span className="text-orange-400">Risky with AI: +2 power, but +4 debt!</span>
            )}
          </div>

          {currentBid !== undefined && (
            <div className="mb-3 p-2 bg-blue-900/30 rounded-lg border border-blue-700">
              <div className="text-sm text-blue-400">Your Bid</div>
              <div className="text-lg font-bold text-white">${currentBid}</div>
            </div>
          )}

          <Button
            className="w-full"
            variant={currentBid !== undefined ? 'secondary' : 'primary'}
            onClick={() => setShowBidModal(true)}
          >
            {currentBid !== undefined ? 'Update Bid' : 'Place Bid'}
          </Button>
        </CardContent>
      </Card>

      <Modal
        isOpen={showBidModal}
        onClose={() => setShowBidModal(false)}
        title={`Bid for ${engineer.name}`}
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-gray-800 rounded p-3 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Level:</span>
              <span className="text-white capitalize">{engineer.level}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Power:</span>
              <span className="text-white">{engineer.power}</span>
            </div>
            {engineer.specialty && (
              <div className="flex justify-between">
                <span className="text-gray-400">Specialty:</span>
                <span className="text-white capitalize">{engineer.specialty}</span>
              </div>
            )}
            {engineer.trait && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-700">
                <span className="text-gray-400">Trait:</span>
                <span className="text-purple-400">{ENGINEER_TRAITS[engineer.trait].name}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Bid Amount (You have ${playerMoney})
            </label>
            <Input
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={1}
              max={playerMoney}
            />
          </div>

          <div className="flex gap-2">
            {[engineer.baseSalary, engineer.baseSalary + 5, engineer.baseSalary + 10].map(
              (amount) => (
                <button
                  key={amount}
                  onClick={() => setBidAmount(amount)}
                  disabled={amount > playerMoney}
                  className={`flex-1 py-2 rounded-lg text-sm transition-colors ${
                    bidAmount === amount
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                  }`}
                >
                  ${amount}
                </button>
              )
            )}
          </div>

          <QuickTip>
            Higher bids get first pick. You pay your bid only if you win.
          </QuickTip>

          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => setShowBidModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSubmitBid}
              disabled={bidAmount <= 0 || bidAmount > playerMoney}
            >
              Submit Bid
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function EngineerDraft() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const currentRound = useGameStore((state) => state.currentRound);
  const submitBid = useGameStore((state) => state.submitBid);
  const resolveBids = useGameStore((state) => state.resolveBids);

  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const currentPlayer = players[currentPlayerIndex];

  const handleBid = (engineerId: string, amount: number) => {
    submitBid(currentPlayer.id, engineerId, amount);
  };

  const handleNextPlayer = () => {
    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(currentPlayerIndex + 1);
    } else {
      // All players have bid, resolve
      resolveBids();
    }
  };

  // Get current player's bids
  const playerBids = new Map<string, number>();
  roundState.currentBids.forEach((bid, key) => {
    if (key.startsWith(currentPlayer.id)) {
      const engineerId = key.replace(`${currentPlayer.id}-`, '');
      playerBids.set(engineerId, bid.amount);
    }
  });

  const hasBid = playerBids.size > 0;

  // Calculate draft position for current player
  const sortedByMau = [...players].sort((a, b) => a.metrics.mau - b.metrics.mau);
  const draftPosition = sortedByMau.findIndex(p => p.id === currentPlayer.id) + 1;

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-12 gap-6">
          {/* Left sidebar - Guide & Info */}
          <div className="col-span-12 lg:col-span-3 space-y-4">
            <PhaseGuide phase="engineer-draft" currentRound={currentRound} />

            {/* Catch-up mechanics */}
            {currentRound > 1 && (
              <CatchUpIndicator
                players={players}
                currentPlayerId={currentPlayer.id}
                currentRound={currentRound}
                draftOrder={roundState.draftOrder}
              />
            )}

            {/* Engineer Types Guide */}
            <HelpCard title="Engineer Types" variant="info" collapsible defaultExpanded={true}>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <Badge variant="success" size="sm">Senior</Badge>
                  <span className="text-gray-300">4 power, $25-35</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="default" size="sm">Junior</Badge>
                  <span className="text-gray-300">2 power, $10-20</span>
                </div>
                <div className="flex justify-between items-center">
                  <Badge variant="warning" size="sm">Intern</Badge>
                  <span className="text-gray-300">1 power, $5-10</span>
                </div>
                <p className="text-gray-500 mt-2">
                  AI adds +2 power. Specialty match adds +1 power.
                </p>
              </div>
            </HelpCard>

            {/* Bidding Tips */}
            <HelpCard title="Bidding Tips" variant="tip" collapsible defaultExpanded={false}>
              <ul className="space-y-1 text-xs text-gray-300">
                <li>• Higher bids get first pick</li>
                <li>• You only pay if you win</li>
                <li>• Everyone gets at least 1 intern</li>
                <li>• Match specialties to your strategy</li>
                <li>• Seniors + AI = best efficiency</li>
              </ul>
            </HelpCard>

            {/* Traits Guide */}
            <TraitsGuide />

            {/* Player Standings */}
            <PlayerStatsComparison
              players={players}
              currentPlayerId={currentPlayer.id}
              compact={true}
            />
          </div>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                  Engineer Draft - Round {roundState.roundNumber}
                </h1>
                <div className="flex items-center gap-3">
                  <span style={{ color: currentPlayer.color }} className="font-semibold">
                    {currentPlayer.name}
                  </span>
                  <span className="text-gray-400">is bidding</span>
                  {currentRound > 1 && (
                    <DraftOrderBadge position={draftPosition} total={players.length} />
                  )}
                </div>
              </div>
              <div className="flex gap-4 items-end">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Available Funds</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${currentPlayer.resources.money}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Current Engineers</div>
                  <div className="text-xl font-bold text-blue-400">
                    {currentPlayer.engineers.length}
                  </div>
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
                      : i < currentPlayerIndex
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-gray-800 text-gray-500'
                  }`}
                  style={{
                    borderColor: i === currentPlayerIndex ? player.color : undefined,
                  }}
                >
                  {player.name}
                  {i < currentPlayerIndex && ' Done'}
                </button>
              ))}
            </div>

            {/* Pool info */}
            <div className="bg-gray-800/50 rounded-lg p-3 mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                <span className="text-white font-medium">{roundState.engineerPool.length}</span> engineers available this round
              </div>
              <div className="text-xs text-gray-500">
                Round {currentRound}: {currentRound === 1 ? '30%' : currentRound === 2 ? '40%' : currentRound === 3 ? '50%' : '60%'} seniors
              </div>
            </div>

            {/* Engineer grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
              <AnimatePresence mode="popLayout">
                {roundState.engineerPool.map((engineer, i) => (
                  <motion.div
                    key={engineer.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <EngineerCard
                      engineer={engineer}
                      onBid={(amount) => handleBid(engineer.id, amount)}
                      currentBid={playerBids.get(engineer.id)}
                      playerMoney={currentPlayer.resources.money}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col items-center gap-3">
              <Button
                size="lg"
                onClick={handleNextPlayer}
                disabled={!hasBid}
              >
                {currentPlayerIndex < players.length - 1
                  ? `Done - Next Player (${players[currentPlayerIndex + 1]?.name})`
                  : 'Resolve All Bids'}
              </Button>

              {!hasBid && (
                <p className="text-gray-500 text-sm">
                  Place at least one bid to continue
                </p>
              )}

              {hasBid && (
                <p className="text-green-400 text-sm">
                  {playerBids.size} bid(s) placed - Ready to continue!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
