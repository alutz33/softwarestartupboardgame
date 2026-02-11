import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, CardContent, Badge } from '../ui';
import { PhaseGuide } from '../ui/PhaseGuide';
import { AppCardView } from '../ui/AppCardView';
import { useGameStore } from '../../state/gameStore';
import type { CorporationStyle, ProductType } from '../../types';

const productTypeLabels: Record<ProductType, string> = {
  b2b: 'B2B SaaS',
  consumer: 'Consumer App',
  platform: 'Platform Play',
};

const STYLE_OPTIONS: { id: CorporationStyle; name: string; tagline: string; description: string; scoring: string[]; keyActions: string[]; accentColor: string }[] = [
  {
    id: 'agency',
    name: 'App Studio',
    tagline: 'Build apps, ship fast, score big',
    accentColor: 'indigo',
    description: 'You run a development agency that builds and publishes apps for clients. Match code patterns on your grid to app cards, then publish them for star ratings and VP.',
    scoring: [
      'VP from published app star ratings',
      'Marketing adds bonus stars to publishes',
      'Monetization earns $1 per total published star',
    ],
    keyActions: [
      'Develop Features: Pick tokens to build patterns',
      'Publish App (free): Match grid patterns to app cards',
      'Marketing: +1 star bonus on next publish',
    ],
  },
  {
    id: 'product',
    name: 'Live Product',
    tagline: 'Build your product, grow your users',
    accentColor: 'emerald',
    description: 'You\'re building a live product with real users. Commit code to your codebase, grow your MAU through production tracks, and score VP from user milestones.',
    scoring: [
      'VP from MAU milestones (1K, 2.5K, 5K, 10K users)',
      'VP from committed code (1 VP per 2 commits)',
      'Marketing advances MAU production track',
    ],
    keyActions: [
      'Develop Features: Pick tokens to build your grid',
      'Commit Code (free): Lock grid rows/columns for VP',
      'Marketing: Advance MAU production each round',
    ],
  },
];

export function FundingSelection() {
  const players = useGameStore((state) => state.players);
  const selectFunding = useGameStore((state) => state.selectFunding);
  const confirmAppCards = useGameStore((state) => state.confirmAppCards);
  const [selectedStyle, setSelectedStyle] = useState<Record<string, CorporationStyle | null>>({});
  const [keptCardIds, setKeptCardIds] = useState<Set<string>>(new Set());

  // Find players who need action: either no strategy yet, or agency awaiting card selection
  const cardSelectPlayer = players.find(p => p.strategy && !p.isReady && p.dealtAppCards && p.dealtAppCards.length > 0);
  const pendingPlayers = players.filter((p) => !p.strategy);
  const currentPlayer = cardSelectPlayer ?? pendingPlayers[0];

  if (!currentPlayer) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">All players ready. Starting game...</div>
      </div>
    );
  }

  const leader = currentPlayer.leader;
  if (!leader) return null;

  const leaderSide = leader.leaderSide;
  const currentSelection = selectedStyle[currentPlayer.id] || null;

  const handleConfirm = () => {
    if (currentSelection) {
      selectFunding(currentPlayer.id, currentSelection);
      setSelectedStyle((prev) => ({ ...prev, [currentPlayer.id]: null }));
      // If agency, initialize all 3 dealt cards as kept by default
      if (currentSelection === 'agency') {
        // Will be populated when dealtAppCards becomes available via re-render
        setKeptCardIds(new Set());
      }
    }
  };

  const handleToggleCard = (cardId: string) => {
    setKeptCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        // Don't allow un-keeping if it would drop below 1
        if (next.size <= 1) return prev;
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const handleConfirmCards = () => {
    if (keptCardIds.size >= 1) {
      confirmAppCards(currentPlayer.id, Array.from(keptCardIds));
      setKeptCardIds(new Set());
    }
  };

  // If this player is in card-selection mode, initialize kept cards on first render
  if (cardSelectPlayer && cardSelectPlayer.dealtAppCards && keptCardIds.size === 0) {
    // Default: all cards kept
    const allIds = new Set(cardSelectPlayer.dealtAppCards.map(c => c.id));
    if (allIds.size > 0 && keptCardIds.size === 0) {
      setKeptCardIds(allIds);
    }
  }

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
                    <span className={p.isReady ? 'text-green-400' : 'text-gray-400'}>
                      {p.name}
                    </span>
                    {p.isReady && <span className="text-green-400 text-xs">Done</span>}
                    {p.id === currentPlayer.id && p.dealtAppCards && p.dealtAppCards.length > 0 && (
                      <span className="text-indigo-400 text-xs">Picking cards...</span>
                    )}
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
            {cardSelectPlayer && cardSelectPlayer.dealtAppCards ? (
              /* ---- App Card Selection (Agency) ---- */
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
                    {' '}- Choose Your Starting App Cards
                  </h2>
                  <p className="text-gray-400 mt-1">
                    You&apos;ve been dealt 3 app cards. Keep at least 1 (click to toggle). Unkept cards return to the deck.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                  {cardSelectPlayer.dealtAppCards.map((card) => {
                    const isKept = keptCardIds.has(card.id);
                    return (
                      <motion.div
                        key={card.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleToggleCard(card.id)}
                        className="cursor-pointer"
                      >
                        <div className={`rounded-lg p-1 transition-all ${
                          isKept
                            ? 'ring-2 ring-green-500 bg-green-900/20'
                            : 'ring-1 ring-gray-600 opacity-50'
                        }`}>
                          <AppCardView card={card} />
                          <div className={`text-center text-xs font-bold mt-1 pb-1 ${
                            isKept ? 'text-green-400' : 'text-gray-500'
                          }`}>
                            {isKept ? 'KEEPING' : 'RETURNING'}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleConfirmCards}
                    disabled={keptCardIds.size < 1}
                    className="px-8 py-3 text-lg"
                  >
                    Confirm {keptCardIds.size} Card{keptCardIds.size !== 1 ? 's' : ''}
                  </Button>
                </div>
              </>
            ) : (
              /* ---- Style Selection ---- */
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    <span style={{ color: currentPlayer.color }}>{currentPlayer.name}</span>
                    {' '}- Choose Your Play Style
                  </h2>
                  <p className="text-gray-400 mt-1">
                    How will you build your software empire with {leader.name}?
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {STYLE_OPTIONS.map((option) => {
                    const isSelected = currentSelection === option.id;

                    return (
                      <motion.div
                        key={option.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedStyle((prev) => ({
                          ...prev,
                          [currentPlayer.id]: option.id,
                        }))}
                        className="cursor-pointer"
                      >
                        <Card
                          className={`h-full transition-all ${
                            isSelected
                              ? 'border-2 border-green-500 bg-green-900/20'
                              : option.accentColor === 'indigo'
                                ? 'border border-indigo-700/40 bg-gray-800 hover:border-indigo-500/60 hover:bg-indigo-900/10'
                                : 'border border-emerald-700/40 bg-gray-800 hover:border-emerald-500/60 hover:bg-emerald-900/10'
                          }`}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-xl font-bold text-white">{option.name}</h3>
                              {isSelected && (
                                <Badge variant="success" size="sm">Selected</Badge>
                              )}
                            </div>
                            <div className={`text-sm font-medium mb-3 ${option.accentColor === 'indigo' ? 'text-indigo-400' : 'text-emerald-400'}`}>{option.tagline}</div>

                            <p className="text-sm text-gray-300 mb-4">{option.description}</p>

                            {/* Scoring */}
                            <div className={`rounded p-3 mb-3 ${option.accentColor === 'indigo' ? 'bg-indigo-900/30' : 'bg-emerald-900/30'}`}>
                              <div className="text-xs text-yellow-400 font-semibold mb-2">HOW YOU SCORE VP</div>
                              <ul className="space-y-1">
                                {option.scoring.map((s, i) => (
                                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                    <span className="text-yellow-400 mt-0.5">*</span>
                                    <span>{s}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Key Actions */}
                            <div className={`rounded p-3 ${option.accentColor === 'indigo' ? 'bg-indigo-900/20 border border-indigo-700/30' : 'bg-emerald-900/20 border border-emerald-700/30'}`}>
                              <div className={`text-xs font-semibold mb-2 ${option.accentColor === 'indigo' ? 'text-indigo-400' : 'text-emerald-400'}`}>KEY ACTIONS</div>
                              <ul className="space-y-1">
                                {option.keyActions.map((a, i) => (
                                  <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                                    <span className={`mt-0.5 ${option.accentColor === 'indigo' ? 'text-indigo-400' : 'text-emerald-400'}`}>*</span>
                                    <span>{a}</span>
                                  </li>
                                ))}
                              </ul>
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
                      ? `Confirm ${STYLE_OPTIONS.find((o) => o.id === currentSelection)?.name}`
                      : 'Select a Play Style'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
