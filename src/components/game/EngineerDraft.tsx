import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, CardContent, Badge } from '../ui';
import { HelpCard } from '../ui/HelpCard';
import { PhaseGuide } from '../ui/PhaseGuide';
import { CatchUpIndicator, DraftOrderBadge } from '../ui/CatchUpIndicator';
import { TraitsGuide, PlayerStatsComparison } from '../ui/NoobHelpers';
import { useGameStore } from '../../state/gameStore';
import type { Engineer, PersonaCard } from '../../types';
import { ENGINEER_TRAITS } from '../../types';

// ============================================
// Shared: Engineer Card (display only, no bid modal)
// ============================================

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

function EngineerCardDisplay({
  engineer,
  selected,
  onSelect,
  disabled,
  showHireButton,
  hireCost,
  onHire,
}: {
  engineer: Engineer;
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  showHireButton?: boolean;
  hireCost?: number;
  onHire?: () => void;
}) {
  return (
    <Card
      hoverable={!disabled}
      selected={selected}
      onClick={disabled ? undefined : onSelect}
      className={disabled ? 'opacity-50' : ''}
    >
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
              {engineer.isPersona && (
                <Badge variant="info">Persona</Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">
              {hireCost !== undefined ? 'Hire Cost' : 'Base Salary'}
            </div>
            <div className="text-lg font-bold text-green-400">
              ${hireCost !== undefined ? hireCost : engineer.baseSalary}
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
                  i < engineer.power ? 'bg-blue-500' : 'bg-gray-700'
                }`}
              />
            ))}
            <span className="ml-2 text-gray-300">{engineer.power}</span>
          </div>
        </div>

        {/* Generic Engineer Trait */}
        {engineer.trait && (
          <div className="mb-3 p-2 bg-purple-900/30 border border-purple-700/50 rounded">
            <div className="flex items-center gap-2">
              <Badge variant="info" size="sm">
                {ENGINEER_TRAITS[engineer.trait].name}
              </Badge>
            </div>
            <p className="text-[10px] text-purple-300 mt-1">
              {ENGINEER_TRAITS[engineer.trait].description}
            </p>
          </div>
        )}

        {/* Persona Engineer Trait */}
        {engineer.personaTrait && (
          <div className="mb-3 p-2 bg-amber-900/30 border border-amber-700/50 rounded">
            <div className="flex items-center gap-2">
              <Badge variant="warning" size="sm">
                {engineer.personaTrait.name}
              </Badge>
            </div>
            <p className="text-[10px] text-amber-300 mt-1">
              {engineer.personaTrait.description}
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

        {showHireButton && onHire && (
          <Button
            className="w-full"
            variant={selected ? 'primary' : 'secondary'}
            onClick={onHire}
            disabled={disabled}
          >
            Hire for ${hireCost ?? engineer.baseSalary}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Draft Order Bar
// ============================================

function DraftOrderBar({
  draftOrder,
  currentPickerIndex,
  players,
}: {
  draftOrder: string[];
  currentPickerIndex: number;
  players: { id: string; name: string; color: string }[];
}) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto">
      {draftOrder.map((playerId, i) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return null;
        const isCurrent = i === currentPickerIndex;
        const isDone = i < currentPickerIndex;

        return (
          <div
            key={playerId}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              isCurrent
                ? 'bg-gray-700 text-white ring-2'
                : isDone
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-gray-800 text-gray-500'
            }`}
            style={{
              borderColor: isCurrent ? player.color : undefined,
              ...(isCurrent ? { ringColor: player.color } : {}),
            }}
          >
            {isCurrent && '>> '}{player.name}{isDone && ' (picked)'}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Persona Auction Card Display
// ============================================

function PersonaAuctionCard({ persona }: { persona: PersonaCard }) {
  const eng = persona.engineerSide;
  return (
    <Card className="border-amber-600/50 bg-gradient-to-br from-gray-800 to-amber-900/20">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <img
            src={`/personas/${persona.id}.png`}
            alt={persona.name}
            className="w-12 h-16 object-cover rounded-lg border border-amber-700/50"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{persona.name}</h3>
            <p className="text-sm text-amber-400">{eng.title}</p>
          </div>
        </div>

        <p className="text-xs text-gray-400 italic mb-4">&quot;{eng.flavor}&quot;</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span className="text-xs text-gray-400">Level</span>
            <div><Badge variant="success">Senior</Badge></div>
          </div>
          <div>
            <span className="text-xs text-gray-400">Power</span>
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-sm ${
                    i < eng.power ? 'bg-blue-500' : 'bg-gray-700'
                  }`}
                />
              ))}
              <span className="ml-1 text-sm text-gray-300">{eng.power}</span>
            </div>
          </div>
          <div>
            <span className="text-xs text-gray-400">Specialty</span>
            {eng.specialty && (
              <div>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full text-white ${
                    specialtyColors[eng.specialty]
                  }`}
                >
                  {eng.specialty}
                </span>
              </div>
            )}
          </div>
          <div>
            <span className="text-xs text-gray-400">Base Salary</span>
            <div className="text-green-400 font-bold">$15</div>
          </div>
        </div>

        {/* Persona trait */}
        <div className="p-3 bg-amber-900/40 border border-amber-700/50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="warning" size="sm">{eng.trait.name}</Badge>
          </div>
          <p className="text-xs text-amber-300">{eng.trait.description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Generic Draft Sub-Phase
// ============================================

function GenericDraftView() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const currentRound = useGameStore((state) => state.currentRound);
  const draftPickEngineer = useGameStore((state) => state.draftPickEngineer);

  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);

  const { draftOrder, currentDraftPickerIndex, engineerPool } = roundState;
  const pickerIndex = currentDraftPickerIndex ?? 0;
  const currentPickerId = draftOrder[pickerIndex];
  const currentPicker = players.find(p => p.id === currentPickerId);

  if (!currentPicker) return null;

  // Calculate hire cost for selected engineer (with discounts)
  const getHireCost = (engineer: Engineer): number => {
    let cost = engineer.baseSalary;
    if (currentPicker.leader?.leaderSide.passive.id === 'lean-efficiency') {
      cost = Math.max(0, cost - 5);
    }
    if (currentPicker.strategy?.funding === 'bootstrapped') {
      cost = Math.round(cost * 0.8);
    }
    return cost;
  };

  const handleHire = (engineerId: string) => {
    draftPickEngineer(currentPickerId, engineerId);
    setSelectedEngineerId(null);
  };

  const pickNumber = pickerIndex + 1;
  const totalPicks = draftOrder.length;

  return (
    <>
      {/* Draft order bar */}
      <DraftOrderBar
        draftOrder={draftOrder}
        currentPickerIndex={pickerIndex}
        players={players}
      />

      {/* Current picker header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
            Engineer Draft - Q{roundState.roundNumber}
          </h1>
          <div className="flex items-center gap-3">
            <span style={{ color: currentPicker.color }} className="font-semibold text-lg">
              {currentPicker.name}
            </span>
            <span className="text-gray-400">is picking</span>
            <Badge variant="info">Pick #{pickNumber} of {totalPicks}</Badge>
            {currentRound > 1 && (
              <DraftOrderBadge position={pickerIndex + 1} total={players.length} />
            )}
          </div>
        </div>
        <div className="flex gap-4 items-end">
          <div className="text-right">
            <div className="text-xs text-gray-400">Available Funds</div>
            <div className="text-2xl font-bold text-green-400">
              ${currentPicker.resources.money}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Current Engineers</div>
            <div className="text-xl font-bold text-blue-400">
              {currentPicker.engineers.length}
            </div>
          </div>
        </div>
      </div>

      {/* Pool info */}
      <div className="bg-gray-800/50 rounded-lg p-3 mb-4 flex items-center justify-between">
        <div className="text-sm text-gray-400">
          <span className="text-white font-medium">{engineerPool.length}</span> generic engineers available
        </div>
        <div className="text-xs text-gray-500">
          {roundState.personaPool.length > 0 && (
            <span className="text-amber-400">
              + {roundState.personaPool.length} persona card{roundState.personaPool.length !== 1 ? 's' : ''} to auction after draft
            </span>
          )}
        </div>
      </div>

      {/* Engineer grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        <AnimatePresence mode="popLayout">
          {engineerPool.map((engineer, i) => {
            const cost = getHireCost(engineer);
            const canAfford = currentPicker.resources.money >= cost;
            return (
              <motion.div
                key={engineer.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: i * 0.03 }}
              >
                <EngineerCardDisplay
                  engineer={engineer}
                  selected={selectedEngineerId === engineer.id}
                  onSelect={() => setSelectedEngineerId(
                    selectedEngineerId === engineer.id ? null : engineer.id
                  )}
                  disabled={!canAfford}
                  showHireButton={selectedEngineerId === engineer.id && canAfford}
                  hireCost={cost}
                  onHire={() => handleHire(engineer.id)}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Instruction text */}
      {!selectedEngineerId && (
        <div className="text-center text-gray-500 text-sm">
          Click an engineer card to select, then click &quot;Hire&quot; to draft them
        </div>
      )}
    </>
  );
}

// ============================================
// Persona Auction Sub-Phase
// ============================================

function PersonaAuctionView() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const placeBid = useGameStore((state) => state.placeBid);
  const passAuction = useGameStore((state) => state.passAuction);

  const auction = roundState.personaAuction;
  if (!auction) return null;

  const { personaCard, currentBid, currentBidderId, passedPlayers, biddingOrder, currentBidderIndex } = auction;
  const currentBidderPlayerId = biddingOrder[currentBidderIndex];
  const currentBidder = players.find(p => p.id === currentBidderPlayerId);

  if (!currentBidder) return null;

  const minBid = Math.max(15, currentBid + 5);
  const canAffordBid = currentBidder.resources.money >= minBid;
  const currentWinner = currentBidderId
    ? players.find(p => p.id === currentBidderId)
    : null;

  // Count remaining persona cards (including current one being auctioned)
  const remainingPersonas = roundState.personaPool.length;

  const handleBid = () => {
    placeBid(currentBidderPlayerId, minBid);
  };

  const handleBidCustom = (amount: number) => {
    if (amount >= minBid && currentBidder.resources.money >= amount) {
      placeBid(currentBidderPlayerId, amount);
    }
  };

  const handlePass = () => {
    passAuction(currentBidderPlayerId);
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
          Persona Auction
        </h1>
        <div className="flex items-center gap-3">
          <Badge variant="warning">
            {remainingPersonas} persona{remainingPersonas !== 1 ? 's' : ''} remaining
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Persona card */}
        <motion.div
          key={personaCard.id}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <PersonaAuctionCard persona={personaCard} />
        </motion.div>

        {/* Right: Auction controls */}
        <div className="space-y-6">
          {/* Current bid info */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Current Auction</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Current Bid</div>
                  <div className="text-2xl font-bold text-green-400">${currentBid}</div>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <div className="text-xs text-gray-400">Highest Bidder</div>
                  <div className="text-lg font-bold" style={{ color: currentWinner?.color ?? '#666' }}>
                    {currentWinner?.name ?? 'No bids yet'}
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-3 mb-4">
                <div className="text-xs text-gray-400 mb-1">Minimum Next Bid</div>
                <div className="text-xl font-bold text-amber-400">${minBid}</div>
              </div>

              {/* Bidding order */}
              <div className="mb-4">
                <div className="text-xs text-gray-400 mb-2">Bidding Order</div>
                <div className="flex flex-wrap gap-2">
                  {biddingOrder.map((pId, i) => {
                    const p = players.find(pl => pl.id === pId);
                    if (!p) return null;
                    const hasPassed = passedPlayers.includes(pId);
                    const isActive = i === currentBidderIndex;

                    return (
                      <div
                        key={pId}
                        className={`px-3 py-1 rounded text-sm ${
                          hasPassed
                            ? 'bg-gray-800 text-gray-600 line-through'
                            : isActive
                              ? 'bg-blue-700 text-white ring-2 ring-blue-400'
                              : 'bg-gray-700 text-gray-300'
                        }`}
                        style={isActive ? { borderColor: p.color } : undefined}
                      >
                        {p.name}
                        {hasPassed && ' (passed)'}
                        {pId === currentBidderId && !hasPassed && ' (leading)'}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current bidder's turn */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <span style={{ color: currentBidder.color }} className="font-semibold">
                    {currentBidder.name}
                  </span>
                  <span className="text-gray-400 text-sm">
                    &mdash; ${currentBidder.resources.money} available
                  </span>
                </div>

                <div className="flex gap-3 mb-3">
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleBid}
                    disabled={!canAffordBid}
                  >
                    Bid ${minBid}
                  </Button>
                  {/* Quick bid buttons for higher amounts */}
                  {[minBid + 5, minBid + 10].map(amt => (
                    <Button
                      key={amt}
                      variant="secondary"
                      onClick={() => handleBidCustom(amt)}
                      disabled={currentBidder.resources.money < amt}
                    >
                      ${amt}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handlePass}
                >
                  Pass (withdraw from auction)
                </Button>

                {!canAffordBid && (
                  <p className="text-red-400 text-xs mt-2">
                    Not enough funds to bid. You must pass.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// ============================================
// Draft Complete Sub-Phase
// ============================================

function DraftCompleteView() {
  const players = useGameStore((state) => state.players);
  const resolveBids = useGameStore((state) => state.resolveBids);

  return (
    <div className="text-center py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <h1 className="text-3xl font-bold text-white mb-6">Draft Complete!</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-8">
          {players.map(player => (
            <Card key={player.id}>
              <CardContent className="p-4">
                <h3 className="font-bold mb-2" style={{ color: player.color }}>
                  {player.name}
                </h3>
                <div className="text-sm text-gray-400 mb-2">
                  {player.engineers.length} engineer{player.engineers.length !== 1 ? 's' : ''} hired
                </div>
                <div className="space-y-1">
                  {player.engineers.map(eng => (
                    <div key={eng.id} className="flex justify-between items-center text-xs">
                      <span className="text-white">{eng.name}</span>
                      <div className="flex gap-1 items-center">
                        <Badge
                          variant={
                            eng.level === 'senior'
                              ? 'success'
                              : eng.level === 'intern'
                                ? 'warning'
                                : 'default'
                          }
                          size="sm"
                        >
                          {eng.level}
                        </Badge>
                        <span className="text-green-400">${eng.salaryPaid}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-gray-500">
                  Remaining: ${player.resources.money}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button size="lg" onClick={() => resolveBids()}>
          Continue to Planning Phase
        </Button>
      </motion.div>
    </div>
  );
}

// ============================================
// Main EngineerDraft Component
// ============================================

export function EngineerDraft() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const currentRound = useGameStore((state) => state.currentRound);

  const draftPhase = roundState.draftPhase ?? 'generic-draft';
  const pickerIndex = roundState.currentDraftPickerIndex ?? 0;
  const currentPickerId = roundState.draftOrder[pickerIndex];
  const currentPicker = players.find(p => p.id === currentPickerId) ?? players[0];

  // For persona auction, use the current bidder
  const auction = roundState.personaAuction;
  const auctionBidderId = auction
    ? auction.biddingOrder[auction.currentBidderIndex]
    : undefined;
  const activePlayerId = draftPhase === 'persona-auction' && auctionBidderId
    ? auctionBidderId
    : currentPickerId;
  const activePlayer = players.find(p => p.id === activePlayerId) ?? currentPicker;

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
                currentPlayerId={activePlayer.id}
                currentRound={currentRound}
                draftOrder={roundState.draftOrder}
              />
            )}

            {/* Draft Phase Indicator */}
            <Card>
              <CardContent className="p-3">
                <h4 className="text-xs text-gray-400 mb-2 uppercase tracking-wider">Draft Phase</h4>
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${
                    draftPhase === 'generic-draft' ? 'text-blue-400 font-semibold' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      draftPhase === 'generic-draft'
                        ? 'bg-blue-400'
                        : draftPhase === 'persona-auction' || draftPhase === 'complete'
                          ? 'bg-green-400'
                          : 'bg-gray-600'
                    }`} />
                    Track A: Generic Draft
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${
                    draftPhase === 'persona-auction' ? 'text-amber-400 font-semibold' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      draftPhase === 'persona-auction'
                        ? 'bg-amber-400'
                        : draftPhase === 'complete'
                          ? 'bg-green-400'
                          : 'bg-gray-600'
                    }`} />
                    Track B: Persona Auctions
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${
                    draftPhase === 'complete' ? 'text-green-400 font-semibold' : 'text-gray-500'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      draftPhase === 'complete' ? 'bg-green-400' : 'bg-gray-600'
                    }`} />
                    Draft Complete
                  </div>
                </div>
              </CardContent>
            </Card>

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

            {/* Draft Tips */}
            <HelpCard
              title={draftPhase === 'persona-auction' ? 'Auction Tips' : 'Draft Tips'}
              variant="tip"
              collapsible
              defaultExpanded={false}
            >
              <ul className="space-y-1 text-xs text-gray-300">
                {draftPhase === 'generic-draft' ? (
                  <>
                    <li>- Lowest MAU picks first (catch-up)</li>
                    <li>- You pay the listed salary (no bidding)</li>
                    <li>- Each player picks one engineer per turn</li>
                    <li>- Match specialties to your strategy</li>
                    <li>- Seniors + AI = best efficiency</li>
                  </>
                ) : (
                  <>
                    <li>- Persona engineers are always Senior (4 power)</li>
                    <li>- Bids go up in $5 increments</li>
                    <li>- Each persona has a unique trait</li>
                    <li>- You can pass to save money</li>
                    <li>- Winning bid is final -- no refunds</li>
                  </>
                )}
              </ul>
            </HelpCard>

            {/* Traits Guide */}
            <TraitsGuide />

            {/* Player Standings */}
            <PlayerStatsComparison
              players={players}
              currentPlayerId={activePlayer.id}
              compact={true}
            />
          </div>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-9">
            <AnimatePresence mode="wait">
              {draftPhase === 'generic-draft' && (
                <motion.div
                  key="generic-draft"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GenericDraftView />
                </motion.div>
              )}

              {draftPhase === 'persona-auction' && (
                <motion.div
                  key="persona-auction"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <PersonaAuctionView />
                </motion.div>
              )}

              {draftPhase === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <DraftCompleteView />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
