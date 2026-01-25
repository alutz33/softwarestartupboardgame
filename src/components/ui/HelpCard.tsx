import { motion } from 'framer-motion';
import { useState } from 'react';
import type { ReactNode } from 'react';

interface HelpCardProps {
  title: string;
  children: ReactNode;
  variant?: 'info' | 'tip' | 'warning' | 'rule';
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

const variantStyles = {
  info: {
    bg: 'bg-blue-900/30',
    border: 'border-blue-500/50',
    icon: 'i',
    iconBg: 'bg-blue-500',
    title: 'text-blue-300',
  },
  tip: {
    bg: 'bg-green-900/30',
    border: 'border-green-500/50',
    icon: '?',
    iconBg: 'bg-green-500',
    title: 'text-green-300',
  },
  warning: {
    bg: 'bg-yellow-900/30',
    border: 'border-yellow-500/50',
    icon: '!',
    iconBg: 'bg-yellow-500',
    title: 'text-yellow-300',
  },
  rule: {
    bg: 'bg-purple-900/30',
    border: 'border-purple-500/50',
    icon: '#',
    iconBg: 'bg-purple-500',
    title: 'text-purple-300',
  },
};

export function HelpCard({
  title,
  children,
  variant = 'info',
  collapsible = false,
  defaultExpanded = true,
}: HelpCardProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const styles = variantStyles[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles.bg} ${styles.border} border rounded-lg overflow-hidden`}
    >
      <button
        onClick={() => collapsible && setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-2 p-3 ${collapsible ? 'cursor-pointer hover:bg-white/5' : 'cursor-default'}`}
      >
        <span className={`${styles.iconBg} w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white`}>
          {styles.icon}
        </span>
        <span className={`${styles.title} font-semibold text-sm flex-1 text-left`}>{title}</span>
        {collapsible && (
          <span className="text-gray-400 text-xs">{isExpanded ? '[-]' : '[+]'}</span>
        )}
      </button>
      {isExpanded && (
        <motion.div
          initial={collapsible ? { height: 0, opacity: 0 } : false}
          animate={{ height: 'auto', opacity: 1 }}
          className="px-3 pb-3 text-sm text-gray-300"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

interface QuickTipProps {
  children: ReactNode;
}

export function QuickTip({ children }: QuickTipProps) {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 rounded px-2 py-1">
      <span className="text-yellow-400">TIP:</span>
      <span>{children}</span>
    </div>
  );
}

interface RuleReminderProps {
  children: ReactNode;
}

export function RuleReminder({ children }: RuleReminderProps) {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-800/50 rounded px-2 py-1 border-l-2 border-purple-500">
      <span>{children}</span>
    </div>
  );
}
