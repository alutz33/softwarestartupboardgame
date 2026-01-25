import { gameRulesText } from '../data/gameRules';

export function GameRulesHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-700/60 bg-gray-900/95 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3">
        <details className="group">
          <summary className="cursor-pointer list-none text-lg font-semibold text-white">
            <span className="flex items-center justify-between">
              <span>Game Rules Reference</span>
              <span className="text-sm font-normal text-gray-400 group-open:hidden">
                Click to expand
              </span>
              <span className="hidden text-sm font-normal text-gray-400 group-open:inline">
                Click to collapse
              </span>
            </span>
          </summary>
          <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-lg border border-gray-700/60 bg-gray-900 px-4 py-3 text-sm text-gray-100">
            <pre className="whitespace-pre-wrap font-sans leading-relaxed">
              {gameRulesText}
            </pre>
          </div>
        </details>
      </div>
    </header>
  );
}
