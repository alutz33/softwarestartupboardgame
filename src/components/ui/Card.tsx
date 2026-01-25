import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
  hoverable?: boolean;
}

export function Card({
  children,
  className = '',
  onClick,
  selected,
  hoverable,
}: CardProps) {
  return (
    <motion.div
      whileHover={hoverable ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`
        bg-gray-800 rounded-xl border transition-colors
        ${selected ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-700'}
        ${hoverable ? 'cursor-pointer hover:border-gray-600' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`px-4 py-3 border-b border-gray-700 ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div className={`px-4 py-3 border-t border-gray-700 ${className}`}>
      {children}
    </div>
  );
}
