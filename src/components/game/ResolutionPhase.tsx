import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../state/gameStore';

export function ResolutionPhase() {
  const resolveActions = useGameStore((state) => state.resolveActions);

  useEffect(() => {
    // Auto-resolve after a brief animation
    const timer = setTimeout(() => {
      resolveActions();
    }, 1500);

    return () => clearTimeout(timer);
  }, [resolveActions]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: 'linear',
          }}
          className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"
        />
        <h2 className="text-2xl font-bold text-white mb-2">
          Executing Actions...
        </h2>
        <p className="text-gray-400">Calculating results</p>
      </motion.div>
    </div>
  );
}
