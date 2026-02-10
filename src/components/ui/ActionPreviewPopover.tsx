import { useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActionPreviewPopoverProps {
  enabled: boolean;
  content: ReactNode;
  children: ReactNode;
}

export function ActionPreviewPopover({ enabled, content, children }: ActionPreviewPopoverProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [flipLeft, setFlipLeft] = useState(false);

  const handleMouseEnter = useCallback(() => {
    if (!enabled) return;
    // Detect if card is in right half of viewport to flip popover left
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setFlipLeft(rect.left + rect.width / 2 > window.innerWidth / 2);
    }
    timeoutRef.current = setTimeout(() => setShow(true), 250);
  }, [enabled]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShow(false);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {show && enabled && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={`absolute top-0 z-50 w-56 pointer-events-none ${
              flipLeft ? 'right-full mr-2' : 'left-full ml-2'
            }`}
          >
            <div className="bg-blue-900/90 border border-blue-500/50 rounded-lg p-3 shadow-xl backdrop-blur-sm">
              {content}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
