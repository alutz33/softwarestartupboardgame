import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Player } from '../../types';
import { generateActionTips } from './NoobHelpers';

interface SuggestedActionsBannerProps {
  player: Player;
}

export function SuggestedActionsBanner({ player }: SuggestedActionsBannerProps) {
  const [expanded, setExpanded] = useState(false);
  const tips = generateActionTips(player);

  if (tips.length === 0) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="bg-yellow-900/20 border-b border-yellow-700/40 px-4 lg:px-8"
    >
      <div className="py-1.5 flex items-center gap-2">
        <span className="text-yellow-400 text-xs">💡</span>
        <span className="text-xs text-gray-300 flex-1">{tips[0].text}</span>
        {tips.length > 1 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[10px] text-yellow-500 hover:text-yellow-300 transition-colors"
          >
            {expanded ? 'less' : `+${tips.length - 1} more`}
          </button>
        )}
      </div>
      <AnimatePresence>
        {expanded && tips.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="pb-2 space-y-0.5">
              {tips.slice(1, 3).map((tip, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="text-yellow-600">•</span>
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
