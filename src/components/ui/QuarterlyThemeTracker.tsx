import { useState } from 'react';
import { Tooltip } from './Tooltip';
import type { QuarterlyTheme } from '../../types';

interface QuarterlyThemeTrackerProps {
  themes: QuarterlyTheme[];
  currentRound: number;
}

function ThemeTooltipContent({ theme, quarter }: { theme: QuarterlyTheme; quarter: number }) {
  return (
    <div className="text-left min-w-[200px] max-w-[280px]">
      <div className="text-white font-semibold mb-1">Q{quarter}: {theme.name}</div>
      <p className="text-gray-300 text-xs leading-relaxed">{theme.description}</p>
      {theme.modifiers.restrictedActions && theme.modifiers.restrictedActions.length > 0 && (
        <div className="text-red-400 text-[11px] mt-1.5">
          Restricted: {theme.modifiers.restrictedActions.join(', ')}
        </div>
      )}
      {theme.modifiers.bonusActions && theme.modifiers.bonusActions.length > 0 && (
        <div className="text-green-400 text-[11px] mt-1">
          Bonus: {theme.modifiers.bonusActions.join(', ')}
        </div>
      )}
    </div>
  );
}

export function QuarterlyThemeTracker({ themes, currentRound }: QuarterlyThemeTrackerProps) {
  const [expandedQuarter, setExpandedQuarter] = useState<number | null>(null);

  if (themes.length === 0) return null;

  const activeTheme = themes[currentRound - 1];

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
      {/* Quarter pills */}
      <div className="flex gap-1 mb-2">
        {themes.slice(0, 4).map((theme, index) => {
          const quarter = index + 1;
          const isCurrent = quarter === currentRound;
          const isPast = quarter < currentRound;

          return (
            <Tooltip
              key={theme.id}
              content={<ThemeTooltipContent theme={theme} quarter={quarter} />}
              position="bottom"
            >
              <button
                onClick={() => setExpandedQuarter(expandedQuarter === quarter ? null : quarter)}
                className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-purple-600 text-white ring-1 ring-purple-400 hover:bg-purple-500'
                    : isPast
                      ? 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-300'
                      : 'bg-gray-800 text-gray-500 hover:bg-gray-700 hover:text-gray-400'
                }`}
              >
                Q{quarter}
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Current theme name */}
      {activeTheme && (
        <div className="text-xs text-center">
          <span className="text-purple-400 font-medium">{activeTheme.name}</span>
        </div>
      )}

      {/* Expanded theme details (click to pin) */}
      {expandedQuarter !== null && themes[expandedQuarter - 1] && (
        <div className="mt-2 p-2 bg-gray-900/50 rounded text-xs border border-gray-700">
          <div className="text-white font-semibold mb-1">
            Q{expandedQuarter}: {themes[expandedQuarter - 1].name}
          </div>
          <p className="text-gray-400 text-[11px]">{themes[expandedQuarter - 1].description}</p>
          {themes[expandedQuarter - 1].modifiers.restrictedActions &&
            themes[expandedQuarter - 1].modifiers.restrictedActions!.length > 0 && (
            <div className="text-red-400 text-[10px] mt-1">
              Restricted: {themes[expandedQuarter - 1].modifiers.restrictedActions!.join(', ')}
            </div>
          )}
          {themes[expandedQuarter - 1].modifiers.bonusActions &&
            themes[expandedQuarter - 1].modifiers.bonusActions!.length > 0 && (
            <div className="text-green-400 text-[10px] mt-1">
              Bonus: {themes[expandedQuarter - 1].modifiers.bonusActions!.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
