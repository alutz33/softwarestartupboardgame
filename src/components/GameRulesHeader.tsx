import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameRules } from '../data/gameRules';
import { Badge } from './ui/Badge';

// Sub-components for rules display

interface RulesTableProps {
  headers: string[];
  rows: Record<string, string>[];
}

function RulesTable({ headers, rows }: RulesTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800/50">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700 bg-gray-800">
            {headers.map((header) => (
              <th
                key={header}
                className="px-3 py-2 text-left font-semibold text-gray-300"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {rows.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-700/30">
              {headers.map((header) => (
                <td key={header} className="px-3 py-2 text-gray-300">
                  {row[header]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface CollapsibleSectionProps {
  title: string;
  badge?: string;
  badgeVariant?: 'info' | 'success' | 'warning' | 'danger' | 'default';
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  accentColor?: string;
}

function CollapsibleSection({
  title,
  badge,
  badgeVariant = 'info',
  icon,
  defaultOpen = false,
  children,
  accentColor = 'border-blue-500',
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/30 transition-colors border-l-4 ${accentColor}`}
      >
        {icon && <span className="text-lg">{icon}</span>}
        <span className="flex-1 font-semibold text-white">{title}</span>
        {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
        <span className="text-gray-400 text-sm">{isOpen ? '[-]' : '[+]'}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PhaseCardProps {
  number: number;
  name: string;
  note?: string;
  description: string;
  subsections?: Array<{
    title: string;
    content?: string;
    items?: string[];
    highlight?: boolean;
    badge?: string;
    table?: {
      headers: string[];
      rows: Record<string, string>[];
    };
  }>;
}

function PhaseCard({ number, name, note, description, subsections }: PhaseCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/30 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-700/30 transition-colors"
      >
        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {number}
        </span>
        <div className="flex-1">
          <span className="font-semibold text-white">{name}</span>
          {note && (
            <span className="ml-2 text-xs text-gray-400">({note})</span>
          )}
        </div>
        <span className="text-gray-400 text-sm">{isOpen ? '[-]' : '[+]'}</span>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-700/50">
              <p className="text-gray-300 text-sm pt-3">{description}</p>
              {subsections?.map((sub, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h5 className="text-sm font-medium text-gray-200">{sub.title}</h5>
                    {sub.badge && <Badge variant="info">{sub.badge}</Badge>}
                  </div>
                  {sub.highlight && sub.content && (
                    <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-3 text-sm text-green-300">
                      {sub.content}
                    </div>
                  )}
                  {!sub.highlight && sub.content && (
                    <p className="text-gray-400 text-sm">{sub.content}</p>
                  )}
                  {sub.items && (
                    <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                      {sub.items.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {sub.table && (
                    <RulesTable headers={sub.table.headers} rows={sub.table.rows} />
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main component

export function GameRulesHeader({ defaultExpanded = false }: { defaultExpanded?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <header className="border-b border-gray-700/60 bg-gray-900/95">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header Bar */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-3 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📖</span>
            <span className="text-lg font-semibold text-white">Game Rules Reference</span>
          </div>
          <span className="text-sm text-gray-400">
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </button>

        {/* Rules Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="max-h-[70vh] overflow-y-auto pb-4 space-y-4">
                {/* Overview & Objective */}
                <CollapsibleSection
                  title="Overview & Objective"
                  icon="🎯"
                  accentColor="border-purple-500"
                  defaultOpen={true}
                >
                  <p className="text-gray-300">{gameRules.overview.description}</p>
                  <div className="flex gap-4 flex-wrap">
                    <div className="bg-gray-700/50 rounded-lg px-4 py-2">
                      <span className="text-gray-400 text-xs">Players</span>
                      <p className="text-white font-semibold">{gameRules.overview.stats.players}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg px-4 py-2">
                      <span className="text-gray-400 text-xs">Duration</span>
                      <p className="text-white font-semibold">{gameRules.overview.stats.duration}</p>
                    </div>
                    <div className="bg-gray-700/50 rounded-lg px-4 py-2">
                      <span className="text-gray-400 text-xs">Rounds</span>
                      <p className="text-white font-semibold">{gameRules.overview.stats.rounds}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-gray-200 mb-2">Victory Metrics</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {gameRules.objective.metrics.map((metric) => (
                        <div
                          key={metric.name}
                          className="bg-gray-700/30 rounded-lg p-3 border border-gray-600"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="info">{metric.name}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{metric.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CollapsibleSection>

                {/* What's New */}
                <CollapsibleSection
                  title="What's New in This Edition"
                  icon="✨"
                  badge="UPDATED"
                  badgeVariant="success"
                  accentColor="border-green-500"
                >
                  <div className="space-y-3">
                    {gameRules.whatsNew.map((feature, idx) => (
                      <div key={idx} className="bg-gray-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-white">{feature.title}</span>
                          {feature.badge && <Badge variant="success">{feature.badge}</Badge>}
                        </div>
                        <p className="text-sm text-gray-400">{feature.description}</p>
                        {feature.items && (
                          <ul className="mt-2 space-y-1">
                            {feature.items.map((item, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                                <span className="text-green-400">•</span>
                                {'power' in item && (
                                  <span>
                                    <strong className="text-blue-300">{item.power}</strong> ({item.funding}): {item.effect}
                                  </span>
                                )}
                                {'trait' in item && (
                                  <span>
                                    <strong className="text-yellow-300">{item.trait}</strong>: {item.effect}
                                  </span>
                                )}
                                {'round' in item && (
                                  <span>
                                    <strong className="text-purple-300">{item.round}</strong>: {item.action}
                                  </span>
                                )}
                                {'mechanic' in item && (
                                  <span>
                                    <strong className="text-cyan-300">{item.mechanic}</strong>: {item.effect}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Game Setup */}
                <CollapsibleSection
                  title="Game Setup"
                  icon="🎲"
                  accentColor="border-cyan-500"
                >
                  <ol className="list-decimal list-inside space-y-2">
                    {gameRules.gameSetup.steps.map((step, idx) => (
                      <li key={idx} className="text-gray-300">{step}</li>
                    ))}
                  </ol>
                </CollapsibleSection>

                {/* Game Flow */}
                <CollapsibleSection
                  title="Game Flow"
                  icon="🔄"
                  accentColor="border-yellow-500"
                >
                  <p className="text-gray-400 text-sm mb-3">{gameRules.gameFlow.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {gameRules.gameFlow.phases.map((phase, idx) => (
                      <div key={idx} className="flex items-center">
                        <div className="bg-gray-700 rounded-lg px-3 py-2 text-center">
                          <span className="text-white text-sm font-medium">{phase.name}</span>
                          {phase.note && (
                            <span className="block text-xs text-gray-400">{phase.note}</span>
                          )}
                        </div>
                        {idx < gameRules.gameFlow.phases.length - 1 && (
                          <span className="text-gray-500 mx-1">→</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Phase Details */}
                <CollapsibleSection
                  title="Phase-by-Phase Breakdown"
                  icon="📋"
                  accentColor="border-blue-500"
                >
                  <div className="space-y-2">
                    {gameRules.phases.map((phase) => (
                      <PhaseCard
                        key={phase.number}
                        number={phase.number}
                        name={phase.name}
                        note={phase.note}
                        description={phase.description}
                        subsections={phase.subsections}
                      />
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Scoring */}
                <CollapsibleSection
                  title="End of Game Scoring"
                  icon="🏆"
                  accentColor="border-yellow-500"
                >
                  <p className="text-gray-300">{gameRules.scoring.description}</p>
                  <div className="bg-gray-700/50 rounded-lg p-4 border border-yellow-500/30 mt-2">
                    <code className="text-yellow-300 text-sm">{gameRules.scoring.formula}</code>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">{gameRules.scoring.note}</p>
                </CollapsibleSection>

                {/* Milestones */}
                <CollapsibleSection
                  title="Milestones"
                  icon="🎖️"
                  accentColor="border-orange-500"
                >
                  <p className="text-gray-400 text-sm mb-3">{gameRules.milestones.description}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {gameRules.milestones.items.map((milestone, idx) => (
                      <div
                        key={idx}
                        className="bg-gray-700/30 rounded-lg p-3 border border-gray-600 flex items-start gap-3"
                      >
                        <span className="text-2xl">{milestone.icon}</span>
                        <div>
                          <span className="font-medium text-white">{milestone.name}</span>
                          <p className="text-xs text-gray-400">{milestone.requirement}</p>
                          <Badge variant="success" size="sm" className="mt-1">
                            {milestone.bonus}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Special Rules */}
                <CollapsibleSection
                  title="Special Rules & Clarifications"
                  icon="📜"
                  accentColor="border-red-500"
                >
                  <div className="space-y-2">
                    {gameRules.specialRules.rules.map((rule, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-red-400 font-bold">•</span>
                        <div>
                          <span className="text-white font-medium">{rule.name}:</span>{' '}
                          <span className="text-gray-400">{rule.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* House Rules */}
                <CollapsibleSection
                  title="Optional House Rules"
                  icon="🏠"
                  accentColor="border-gray-500"
                >
                  <div className="space-y-2">
                    {gameRules.houseRules.rules.map((rule, idx) => (
                      <div key={idx} className="bg-gray-700/30 rounded-lg p-3">
                        <span className="text-white font-medium">{rule.name}</span>
                        <p className="text-gray-400 text-sm">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Quick Start */}
                <CollapsibleSection
                  title="Quick Start Summary"
                  icon="🚀"
                  badge="TL;DR"
                  badgeVariant="warning"
                  accentColor="border-green-500"
                  defaultOpen={true}
                >
                  <div className="flex flex-wrap gap-2">
                    {gameRules.quickStart.steps.map((item) => (
                      <div
                        key={item.step}
                        className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2"
                      >
                        <span className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                          {item.step}
                        </span>
                        <span className="text-gray-300 text-sm">{item.action}</span>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
