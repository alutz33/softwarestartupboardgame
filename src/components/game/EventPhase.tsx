import { motion } from 'framer-motion';
import { Button, Card, CardContent, Badge } from '../ui';
import { useGameStore } from '../../state/gameStore';
import { checkMitigation } from '../../data/events';

const EVENT_ICONS: Record<string, string> = {
  'ddos-attack': '🔥',
  'supply-chain-issues': '📦',
  'viral-moment': '📈',
  'security-breach': '🔓',
  'competitor-launch': '⚔️',
};

export function EventPhase() {
  const players = useGameStore((state) => state.players);
  const roundState = useGameStore((state) => state.roundState);
  const applyEvent = useGameStore((state) => state.applyEvent);

  const event = roundState.currentEvent;

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            No Event This Round
          </h2>
          <Button onClick={applyEvent}>Continue</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-6xl mb-4"
          >
            {EVENT_ICONS[event.type] || '⚡'}
          </motion.div>
          <h1 className="text-4xl font-bold text-white mb-2">{event.name}</h1>
          <p className="text-xl text-gray-400">{event.description}</p>
        </div>

        {/* Effect breakdown per player */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {players.map((player) => {
            const isMitigated = checkMitigation(
              event,
              player.resources,
              player.metrics
            );
            const effect = isMitigated
              ? event.mitigation.reducedEffect
              : event.effect;

            return (
              <Card
                key={player.id}
                className={
                  isMitigated
                    ? 'border-green-700 bg-green-900/10'
                    : 'border-red-700 bg-red-900/10'
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-semibold text-white">
                      {player.name}
                    </span>
                    {isMitigated ? (
                      <Badge variant="success">Mitigated!</Badge>
                    ) : (
                      <Badge variant="danger">Hit!</Badge>
                    )}
                  </div>

                  {isMitigated && (
                    <div className="text-sm text-green-400 mb-2">
                      {event.mitigation.condition}
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    {effect.mauChange && (
                      <div
                        className={
                          effect.mauChange > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        MAU: {effect.mauChange > 0 ? '+' : ''}
                        {effect.mauChange}
                      </div>
                    )}
                    {effect.revenueChange && (
                      <div
                        className={
                          effect.revenueChange > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        Revenue: {effect.revenueChange > 0 ? '+' : ''}
                        {effect.revenueChange}
                      </div>
                    )}
                    {effect.ratingChange && (
                      <div
                        className={
                          effect.ratingChange > 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        Rating: {effect.ratingChange > 0 ? '+' : ''}
                        {effect.ratingChange.toFixed(1)}
                      </div>
                    )}
                    {effect.resourceChanges?.techDebt && (
                      <div
                        className={
                          effect.resourceChanges.techDebt < 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }
                      >
                        Tech Debt:{' '}
                        {effect.resourceChanges.techDebt > 0 ? '+' : ''}
                        {effect.resourceChanges.techDebt}
                      </div>
                    )}
                    {effect.special && (
                      <div className="text-gray-400 italic mt-2">
                        {effect.special}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-center">
          <Button size="lg" onClick={applyEvent}>
            Apply Event & Continue
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
