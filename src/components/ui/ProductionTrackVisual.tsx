import { motion } from 'framer-motion';
import type { Player } from '../../types';
import { PRODUCTION_CONSTANTS } from '../../types';
import { HelpIcon } from './HelpIcon';

interface ProductionTrackVisualProps {
  label: string;
  value: number;
  max: number;
  color: string;
  perPointLabel?: string;
}

export function ProductionTrackVisual({
  label,
  value,
  max,
  color,
  perPointLabel,
}: ProductionTrackVisualProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="text-[10px] text-gray-400 w-16 shrink-0 text-right">{label}</div>
      <div className="flex-1 relative h-5 bg-gray-800 rounded-full border border-gray-700 overflow-hidden">
        {/* Track fill */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex justify-between px-0.5 pointer-events-none">
          {Array.from({ length: Math.min(max, 20) + 1 }).map((_, i) => (
            i > 0 && i < max ? (
              <div key={i} className="w-px h-full bg-gray-700/50" />
            ) : <div key={i} />
          ))}
        </div>
        {/* Value marker */}
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full border-2 border-white shadow-md"
          style={{ backgroundColor: color }}
          initial={{ left: 0 }}
          animate={{ left: `calc(${percentage}% - 8px)` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        />
      </div>
      <div className="text-xs font-bold w-20 shrink-0" style={{ color }}>
        {value}{perPointLabel && <span className="text-[10px] text-gray-500 font-normal ml-1">{perPointLabel}</span>}
      </div>
    </div>
  );
}

interface ProductionTracksPanelProps {
  player: Player;
}

export function ProductionTracksPanel({ player }: ProductionTracksPanelProps) {
  const mauProd = player.productionTracks.mauProduction;
  const revProd = player.productionTracks.revenueProduction;
  const rating = player.metrics.rating;

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      <div className="flex items-center gap-1.5 mb-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase">Production Tracks</h3>
        <HelpIcon tip="Passive income each round. MAU production gives free users, Revenue production gives free cash. Rating affects marketing effectiveness." position="right" />
      </div>
      <div className="space-y-2">
        <ProductionTrackVisual
          label="MAU Prod"
          value={mauProd}
          max={PRODUCTION_CONSTANTS.MAX_MAU_PRODUCTION}
          color="#3b82f6"
          perPointLabel={`+${mauProd * PRODUCTION_CONSTANTS.MAU_PER_PRODUCTION}/rd`}
        />
        <ProductionTrackVisual
          label="Rev Prod"
          value={revProd}
          max={PRODUCTION_CONSTANTS.MAX_REVENUE_PRODUCTION}
          color="#10b981"
          perPointLabel={`+$${revProd * PRODUCTION_CONSTANTS.MONEY_PER_PRODUCTION}/rd`}
        />
        <ProductionTrackVisual
          label="Rating"
          value={rating}
          max={10}
          color="#eab308"
        />
      </div>
    </div>
  );
}
