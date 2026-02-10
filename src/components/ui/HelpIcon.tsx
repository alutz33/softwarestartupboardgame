import type { ReactNode } from 'react';
import { Tooltip } from './Tooltip';

interface HelpIconProps {
  tip: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpIcon({ tip, position = 'top' }: HelpIconProps) {
  return (
    <Tooltip content={tip} position={position}>
      <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-gray-600 text-gray-500 hover:text-gray-300 hover:border-gray-400 text-[10px] cursor-help transition-colors">
        ?
      </span>
    </Tooltip>
  );
}
