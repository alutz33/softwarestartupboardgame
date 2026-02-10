import { motion } from 'framer-motion';
import type { GamePhase } from '../../types';

interface PhaseGuideProps {
  phase: GamePhase;
  currentRound?: number;
}

const phaseInfo: Record<GamePhase, { title: string; emoji: string; description: string; steps: string[]; tips: string[] }> = {
  'setup': {
    title: 'Game Setup',
    emoji: 'Game Setup',
    description: 'Choose how many players will compete.',
    steps: ['Select 2-4 players', 'Click Start Game'],
    tips: ['More players = more competition for action slots!'],
  },
  'leader-draft': {
    title: 'Choose Your Leader',
    emoji: 'Choose Your Leader',
    description: 'Pick a tech mogul to lead your startup. Each leader has unique powers!',
    steps: [
      '1. Review your 3 leader cards',
      '2. Compare starting bonuses and product locks',
      '3. Check their once-per-game power',
      '4. Select one as your CEO/Founder',
    ],
    tips: [
      'Your leader determines your product type',
      'Unchosen leaders become premium engineers in the draft',
      'Leader passives are active all game long',
    ],
  },
  'funding-selection': {
    title: 'Choose Funding',
    emoji: 'Choose Funding',
    description: 'Pick your funding strategy to complement your leader.',
    steps: [
      '1. Review the three funding types',
      '2. Consider starting cash vs. special bonuses',
      '3. Select your funding and confirm',
    ],
    tips: [
      'VC-Heavy: Most cash but only 40% equity',
      'Bootstrapped: Least cash but revenue scores 2x',
      'Angel-Backed: Balanced, extra draft picks',
    ],
  },
  'startup-draft': {
    title: 'Choose Your Startup',
    emoji: 'Choose Your Startup',
    description: 'Select from two startup cards dealt to you.',
    steps: [
      '1. Review your two startup options',
      '2. Compare funding, tech, and product combinations',
      '3. Check for special abilities',
      '4. Select one and confirm',
    ],
    tips: [
      'Each startup has unique attributes and abilities',
      'The discarded card is removed from the game',
      'Starting bonuses can give you an early edge!',
    ],
  },
  'corporation-selection': {
    title: 'Build Your Startup',
    emoji: 'Build Your Startup',
    description: 'Define your startup identity with three strategic choices.',
    steps: [
      '1. Choose your Funding Strategy (affects starting money)',
      '2. Choose your Tech Approach (affects AI and debt)',
      '3. Choose your Product Type (affects growth multipliers)',
      '4. Enter your startup name',
      '5. Click Ready when done',
    ],
    tips: [
      'VC-Heavy + Consumer = Fast MAU growth',
      'Bootstrapped + B2B = High revenue scoring',
      'Each combination creates a unique playstyle!',
    ],
  },
  'engineer-draft': {
    title: 'Hire Your Team',
    emoji: 'Hire Your Team',
    description: 'Bid on engineers to add to your team. Lowest MAU picks first!',
    steps: [
      '1. Review the engineer pool',
      '2. Place bids on engineers you want',
      '3. Higher bids win, but spend wisely!',
      '4. Everyone gets at least one engineer',
    ],
    tips: [
      'Seniors (1.0x) are most efficient',
      'Match specialties to your planned actions',
      'AI specialists are great for Research AI action',
      "If you're behind in MAU, you pick first!",
    ],
  },
  'action-draft': {
    title: 'Action Draft',
    emoji: 'Action Draft',
    description: 'Take turns placing engineers on actions. Effects resolve immediately!',
    steps: [
      '1. Free actions: Publish App, Commit Code, or Use Leader Power',
      '2. Place an engineer on an action space',
      '3. Resolve the action immediately (pick tokens, swap grid, etc.)',
      '4. Next player goes (snake order by VP)',
    ],
    tips: [
      'Lowest VP goes first — catch-up mechanic!',
      'Develop Features lets you pick a token from the pool',
      'Publish apps to score VP (Agency) or commit code for recurring revenue (Product)',
    ],
  },
  'planning': {
    title: 'Plan Your Actions',
    emoji: 'Plan Your Actions',
    description: 'Assign engineers to action spaces. Some slots are limited!',
    steps: [
      '1. Click an engineer to select them',
      '2. Click an action space to assign them',
      '3. Optionally enable AI augmentation (+output, +debt)',
      '4. Lock your plan when ready',
    ],
    tips: [
      'Marketing & Recruiter have only 1 slot each!',
      'Watch what opponents claim - blocked actions show "Full"',
      'AI boost is powerful but creates tech debt',
      'Pay Down Debt is always available (safety valve)',
    ],
  },
  'reveal': {
    title: 'Plans Revealed',
    emoji: 'Plans Revealed',
    description: 'See what everyone planned this quarter.',
    steps: ['Review all player plans', 'Proceed to puzzle or resolution'],
    tips: ['Look for blocking patterns', 'Note who used AI augmentation'],
  },
  'puzzle': {
    title: 'Code Optimization Challenge',
    emoji: 'Code Optimization Challenge',
    description: 'Solve the puzzle to win bonus tech debt reduction!',
    steps: [
      '1. Drag code blocks to build your solution',
      '2. Collect all coins with fewest blocks',
      '3. Submit before time runs out',
    ],
    tips: [
      'LOOP blocks are very efficient',
      'Winner gets -2 tech debt!',
      'Fewer blocks = higher score',
    ],
  },
  'sprint': {
    title: 'Sprint Mini-Game',
    emoji: 'Sprint Mini-Game',
    description: 'Push your luck! Draw tokens from the bag for clean code, but watch out for bugs.',
    steps: [
      '1. Draw tokens from the shared bag',
      '2. Clean code tokens add to your score',
      '3. Bugs accumulate - 3 bugs and you crash!',
      '4. Stop anytime to bank your clean code points',
    ],
    tips: [
      'More engineers = more draws allowed',
      'Backend specialists get one free bug revert',
      'Critical bugs count as 2 regular bugs',
      'Crashing loses ALL your clean code progress',
    ],
  },
  'resolution': {
    title: 'Executing Actions',
    emoji: 'Executing Actions',
    description: 'All actions are now being processed.',
    steps: ['Watch your metrics change', 'Income is calculated', 'Milestones are checked'],
    tips: ['Income is capped to prevent runaway leaders', 'Check if you claimed any milestones!'],
  },
  'event': {
    title: 'Market Event',
    emoji: 'Market Event',
    description: 'A random event affects all players!',
    steps: ['See the event effect', 'Check if you mitigated it', 'Review impact on metrics'],
    tips: [
      'High server capacity mitigates DDoS and outages',
      'Low tech debt mitigates data breaches',
      'High rating mitigates competitor launches',
    ],
  },
  'round-end': {
    title: 'Quarter Complete',
    emoji: 'Quarter Complete',
    description: 'Review standings before the next quarter.',
    steps: ['Check your metrics', 'Compare to opponents', 'Plan for next quarter'],
    tips: [
      'Behind? You draft first next quarter!',
      'Check unclaimed milestones',
      'Manage tech debt before it hits penalty levels',
    ],
  },
  'game-end': {
    title: 'End of Year 1',
    emoji: 'End of Year 1',
    description: 'Final scores are calculated!',
    steps: ['See final standings', 'Review score breakdown', 'Start a new game?'],
    tips: ['Milestones can swing the final result!', 'Debt penalty is -10 points if debt >= 7'],
  },
};

export function PhaseGuide({ phase, currentRound }: PhaseGuideProps) {
  const info = phaseInfo[phase];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-4 border border-gray-700"
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{info.emoji}</span>
        <div>
          <h3 className="font-bold text-white">{info.title}</h3>
          {currentRound && (
            <span className="text-xs text-gray-500">Q{currentRound} of Year 1</span>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-300 mb-3">{info.description}</p>

      {/* Steps */}
      <div className="bg-gray-900/50 rounded p-3 mb-3">
        <div className="text-xs text-blue-400 font-semibold mb-2">WHAT TO DO:</div>
        <ul className="space-y-1">
          {info.steps.map((step, i) => (
            <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Tips */}
      <div className="space-y-1">
        <div className="text-xs text-yellow-400 font-semibold">TIPS:</div>
        {info.tips.map((tip, i) => (
          <div key={i} className="text-xs text-gray-400 flex items-start gap-2">
            <span className="text-yellow-400">TIP:</span>
            <span>{tip}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface MiniPhaseIndicatorProps {
  currentPhase: GamePhase;
}

const phaseOrder: GamePhase[] = [
  'engineer-draft',
  'planning',
  'reveal',
  'puzzle',
  'resolution',
  'event',
  'round-end',
];

export function MiniPhaseIndicator({ currentPhase }: MiniPhaseIndicatorProps) {
  const currentIndex = phaseOrder.indexOf(currentPhase);

  return (
    <div className="flex items-center gap-1">
      {phaseOrder.map((phase, index) => {
        const isActive = phase === currentPhase;
        const isPast = index < currentIndex;
        const isFuture = index > currentIndex;
        const shortName = phase.split('-')[0].slice(0, 3).toUpperCase();

        return (
          <div
            key={phase}
            className={`px-2 py-1 rounded text-[10px] font-medium ${
              isActive
                ? 'bg-blue-500 text-white'
                : isPast
                  ? 'bg-green-500/20 text-green-400'
                  : isFuture
                    ? 'bg-gray-800 text-gray-500'
                    : ''
            }`}
            title={phase}
          >
            {shortName}
          </div>
        );
      })}
    </div>
  );
}
