import { useState, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
}

const ARROW_SIZE = 6;
const GAP = 4;

export function Tooltip({ content, children, position = 'top', delay = 200, disabled = false }: TooltipProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const handleMouseEnter = useCallback(() => {
    timeoutRef.current = setTimeout(() => setShow(true), delay);
  }, [delay]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setShow(false);
  }, []);

  useLayoutEffect(() => {
    if (!show || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - ARROW_SIZE - GAP;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + ARROW_SIZE + GAP;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - ARROW_SIZE - GAP;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + ARROW_SIZE + GAP;
        break;
    }

    // Clamp to viewport
    const pad = 8;
    left = Math.max(pad, Math.min(left, window.innerWidth - tooltipRect.width - pad));
    top = Math.max(pad, Math.min(top, window.innerHeight - tooltipRect.height - pad));

    setCoords({ top, left });
  }, [show, position]);

  const arrowStyle = (): React.CSSProperties => {
    if (!triggerRef.current || !tooltipRef.current) return {};
    const triggerRect = triggerRef.current.getBoundingClientRect();

    switch (position) {
      case 'top':
        return {
          position: 'absolute',
          bottom: -ARROW_SIZE * 2,
          left: triggerRect.left + triggerRect.width / 2 - coords.left - ARROW_SIZE,
          width: 0, height: 0,
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderTop: `${ARROW_SIZE}px solid rgb(55 65 81)`,
        };
      case 'bottom':
        return {
          position: 'absolute',
          top: -ARROW_SIZE,
          left: triggerRect.left + triggerRect.width / 2 - coords.left - ARROW_SIZE,
          width: 0, height: 0,
          borderLeft: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid rgb(55 65 81)`,
        };
      case 'left':
        return {
          position: 'absolute',
          right: -ARROW_SIZE * 2,
          top: triggerRect.top + triggerRect.height / 2 - coords.top - ARROW_SIZE,
          width: 0, height: 0,
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          borderLeft: `${ARROW_SIZE}px solid rgb(55 65 81)`,
        };
      case 'right':
        return {
          position: 'absolute',
          left: -ARROW_SIZE,
          top: triggerRect.top + triggerRect.height / 2 - coords.top - ARROW_SIZE,
          width: 0, height: 0,
          borderTop: `${ARROW_SIZE}px solid transparent`,
          borderBottom: `${ARROW_SIZE}px solid transparent`,
          borderRight: `${ARROW_SIZE}px solid rgb(55 65 81)`,
        };
    }
  };

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && !disabled && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] pointer-events-none"
          style={{ top: coords.top, left: coords.left }}
        >
          <div className="bg-gray-700 text-gray-100 text-xs rounded-lg px-3 py-2 shadow-lg border border-gray-600 max-w-xs relative">
            {typeof content === 'string' ? (
              <span className="whitespace-pre-line">{content}</span>
            ) : (
              content
            )}
            <span style={arrowStyle()} />
          </div>
        </div>,
        document.body
      )}
    </span>
  );
}
