// Structured game rules data for typed React rendering

export interface TableRow {
  [key: string]: string;
}

export interface RuleSection {
  title: string;
  content?: string;
  items?: string[];
  table?: {
    headers: string[];
    rows: TableRow[];
  };
}

export const gameRules = {
  overview: {
    title: 'Overview',
    description:
      'Ship It! is a competitive strategy board game for 2-4 players where you compete to build the most successful software startup. Balance growth, revenue, and user satisfaction while managing technical debt, racing for milestones, and blocking competitors from key actions.',
    stats: {
      players: '2-4',
      duration: '~30 minutes',
      rounds: '4',
    },
  },

  objective: {
    title: 'Objective',
    description:
      'Build the most valuable startup by the end of 4 rounds. Your success is measured by three key metrics:',
    metrics: [
      {
        name: 'MAU',
        fullName: 'Monthly Active Users',
        description: 'Your user base size',
      },
      {
        name: 'Revenue',
        fullName: 'Revenue',
        description: 'Money generated from your product',
      },
      {
        name: 'Rating',
        fullName: 'Rating',
        description: 'User satisfaction (1-10 integer scale)',
      },
    ],
  },

  whatsNew: [
    {
      title: 'Corporation Powers',
      badge: 'NEW',
      description:
        'Each funding strategy now has a unique ability that provides asymmetric gameplay:',
      items: [
        { power: 'Pivot', funding: 'VC-Heavy', effect: 'Change your product type once per game' },
        { power: 'Lean Team', funding: 'Bootstrapped', effect: '20% discount on all engineer hiring' },
        { power: 'Insider Info', funding: 'Angel-Backed', effect: 'See 2 extra engineers in each draft' },
      ],
    },
    {
      title: 'Engineer Traits',
      badge: 'NEW',
      description: '~35% of engineers have special traits that affect gameplay:',
      items: [
        { trait: 'AI Skeptic', effect: 'Cannot use AI, but +1 base power' },
        { trait: 'Equity-Hungry', effect: 'Costs +$5, but +1 power if retained 2+ rounds' },
        { trait: 'Startup Veteran', effect: 'Immune to negative event effects' },
        { trait: 'Night Owl', effect: '+1 power on last action assigned each round' },
      ],
    },
    {
      title: 'Late-Game Actions',
      badge: 'NEW',
      description: 'New high-risk/high-reward actions unlock in later rounds:',
      items: [
        { round: 'Round 3', action: 'Go Viral (risky marketing)' },
        { round: 'Round 4', action: 'IPO Prep, Acquisition Target' },
      ],
    },
    {
      title: 'Event Forecasting',
      badge: 'NEW',
      description: "See next round's event during planning phase so you can prepare strategically!",
    },
    {
      title: 'Scaled Puzzle Rewards',
      badge: 'NEW',
      description:
        'More engineers on Optimize Code = bigger puzzle rewards (1-3 debt reduction + bonus money)',
    },
    {
      title: 'Action Space Competition',
      description:
        'Some action spaces have limited slots. First player to claim a slot blocks others from using it that round. Plan carefully!',
    },
    {
      title: 'Catch-Up Mechanics',
      description: 'Multiple mechanisms help trailing players:',
      items: [
        { mechanic: 'Draft Order', effect: 'Players with lowest MAU pick first in the engineer draft' },
        { mechanic: 'Income Cap', effect: 'High MAU income is capped to prevent runaway leaders' },
        { mechanic: 'Underdog Bonus', effect: 'Players below median MAU receive +$10 per round' },
      ],
    },
    {
      title: 'Milestones',
      description: 'Race to be first to achieve key goals for permanent scoring bonuses!',
    },
  ],

  gameSetup: {
    title: 'Game Setup',
    steps: [
      'Select number of players (2-4)',
      'Shuffle the event deck',
      'Each player selects their corporation identity (see Corporation Selection)',
      'Players receive starting resources based on their choices',
      'Set out the 5 milestone cards (unclaimed)',
    ],
  },

  gameFlow: {
    title: 'Game Flow',
    description: 'Each round follows this sequence of phases:',
    phases: [
      { name: 'Corporation Selection', note: 'Round 1 only' },
      { name: 'Engineer Draft', note: 'lowest MAU picks first!' },
      { name: 'Planning Phase', note: 'compete for action slots' },
      { name: 'Reveal Phase' },
      { name: 'Puzzle Phase', note: 'if triggered' },
      { name: 'Resolution Phase', note: 'check milestones!' },
      { name: 'Event Phase' },
      { name: 'Round End' },
    ],
  },

  phases: [
    {
      number: 1,
      name: 'Corporation Selection',
      note: 'Round 1 Only',
      description:
        "Each player makes three strategic choices that define their startup's identity:",
      subsections: [
        {
          title: 'Funding Strategy',
          table: {
            headers: ['Strategy', 'Starting Money', 'Special Bonus', 'Equity Retained', 'Unique Power'],
            rows: [
              {
                Strategy: 'VC-Heavy',
                'Starting Money': '$100',
                'Special Bonus': 'Marketing effectiveness +50%',
                'Equity Retained': '40%',
                'Unique Power': 'Pivot - Change product type once per game',
              },
              {
                Strategy: 'Bootstrapped',
                'Starting Money': '$40',
                'Special Bonus': 'Revenue counts 2x for scoring',
                'Equity Retained': '100%',
                'Unique Power': 'Lean Team - 20% discount on hiring',
              },
              {
                Strategy: 'Angel-Backed',
                'Starting Money': '$70',
                'Special Bonus': '+1 engineer capacity per round',
                'Equity Retained': '70%',
                'Unique Power': 'Insider Info - See +2 engineers in draft',
              },
            ],
          },
        },
        {
          title: 'Corporation Powers (Detailed)',
          table: {
            headers: ['Power', 'Funding Type', 'Effect', 'Usage'],
            rows: [
              {
                Power: 'Pivot',
                'Funding Type': 'VC-Heavy',
                Effect: 'Change your product type (B2B / Consumer / Platform) mid-game. Affects all future growth multipliers.',
                Usage: 'Once per game, during Planning phase',
              },
              {
                Power: 'Lean Team',
                'Funding Type': 'Bootstrapped',
                Effect: 'All engineer hiring costs are reduced by 20%. Applied automatically to winning bids.',
                Usage: 'Passive (always active)',
              },
              {
                Power: 'Insider Info',
                'Funding Type': 'Angel-Backed',
                Effect: 'See 2 additional engineers in each draft round, giving you more options to bid on.',
                Usage: 'Passive (always active)',
              },
            ],
          },
        },
        {
          title: 'Tech Approach',
          table: {
            headers: ['Approach', 'Starting AI Capacity', 'Starting Tech Debt', 'Special Bonus'],
            rows: [
              {
                Approach: 'AI-First',
                'Starting AI Capacity': '4',
                'Starting Tech Debt': '2',
                'Special Bonus': 'AI augmentation generates 50% less debt',
              },
              {
                Approach: 'Quality-Focused',
                'Starting AI Capacity': '1',
                'Starting Tech Debt': '0',
                'Special Bonus': '+1 rating at end of each round',
              },
              {
                Approach: 'Move-Fast',
                'Starting AI Capacity': '2',
                'Starting Tech Debt': '3',
                'Special Bonus': '+1 MAU production at start, debt accumulates faster',
              },
            ],
          },
        },
        {
          title: 'Product Type',
          table: {
            headers: ['Product', 'MAU Multiplier', 'Revenue Multiplier', 'Rating Multiplier'],
            rows: [
              {
                Product: 'B2B SaaS',
                'MAU Multiplier': '0.5x',
                'Revenue Multiplier': '2.0x',
                'Rating Multiplier': '0.8x',
              },
              {
                Product: 'Consumer App',
                'MAU Multiplier': '2.0x',
                'Revenue Multiplier': '0.5x',
                'Rating Multiplier': '1.2x',
              },
              {
                Product: 'Platform Play',
                'MAU Multiplier': '1.0x',
                'Revenue Multiplier': '1.0x',
                'Rating Multiplier': '1.0x',
              },
            ],
          },
        },
      ],
    },
    {
      number: 2,
      name: 'Engineer Draft',
      description:
        'Engineers are the workers you\'ll assign to actions. Each round features a sealed-bid auction.',
      subsections: [
        {
          title: 'Catch-Up Draft Order',
          highlight: true,
          content:
            'Players with the lowest MAU pick first! This gives trailing players a chance to catch up by securing the best engineers. Draft order is recalculated at the start of each round based on current MAU standings.',
        },
        {
          title: 'Engineer Pool',
          items: [
            'Pool size = Number of Players + 1 + Recruiter Bonuses',
            'Engineers are randomly generated with varying skills',
            'Later rounds feature more senior engineers (30% seniors in Round 1 -> 60% in Round 4)',
          ],
        },
        {
          title: 'Engineer Types',
          table: {
            headers: ['Type', 'Base Power', 'Typical Salary'],
            rows: [
              { Type: 'Senior', 'Base Power': '4', 'Typical Salary': '~$30' },
              { Type: 'Junior', 'Base Power': '2', 'Typical Salary': '~$15' },
              { Type: 'Intern', 'Base Power': '1', 'Typical Salary': '~$5' },
            ],
          },
        },
        {
          title: 'Engineer Specialties',
          table: {
            headers: ['Specialty', 'Matching Actions', 'Bonus'],
            rows: [
              { Specialty: 'Frontend', 'Matching Actions': 'Develop Features, Marketing', Bonus: '+1 power' },
              { Specialty: 'Backend', 'Matching Actions': 'Optimize Code, Upgrade Servers', Bonus: '+1 power' },
              { Specialty: 'Fullstack', 'Matching Actions': 'Develop Features, Optimize Code', Bonus: '+1 power' },
              { Specialty: 'DevOps', 'Matching Actions': 'Upgrade Servers, Research AI', Bonus: '+1 power' },
              { Specialty: 'AI', 'Matching Actions': 'Research AI, Optimize Code', Bonus: '+1 power' },
            ],
          },
        },
        {
          title: 'Engineer Traits',
          badge: 'NEW',
          content: 'Approximately 35% of engineers have a unique trait that provides special abilities:',
          table: {
            headers: ['Trait', 'Effect', 'Strategy Tips'],
            rows: [
              {
                Trait: 'AI Skeptic',
                Effect: 'Cannot use AI augmentation, but has +1 base power',
                'Strategy Tips': 'Best for quality-focused strategies; no AI debt risk',
              },
              {
                Trait: 'Equity-Hungry',
                Effect: 'Costs +$5 to hire, but gains +1 power if retained for 2+ rounds',
                'Strategy Tips': 'Hire early for maximum value; great long-term investment',
              },
              {
                Trait: 'Startup Veteran',
                Effect: 'Immune to negative event effects',
                'Strategy Tips': 'Protects against DDoS, breaches, competitor launches',
              },
              {
                Trait: 'Night Owl',
                Effect: '+1 power on the last action assigned each round',
                'Strategy Tips': 'Assign to your most important action last!',
              },
            ],
          },
          tips: [
            { trait: 'AI Skeptic', tip: 'Ideal for players avoiding tech debt. +1 power without needing AI.' },
            { trait: 'Equity-Hungry', tip: 'Plan to keep them! Round 1 hires get the +1 power bonus in Rounds 3-4.' },
            { trait: 'Startup Veteran', tip: 'Insurance against bad events. One veteran protects your whole company.' },
            { trait: 'Night Owl', tip: 'Order your action assignments carefully - save them for last for +1 power!' },
          ],
        },
        {
          title: 'Bidding Rules',
          items: [
            'All players simultaneously submit sealed bids for each engineer',
            'Engineers are awarded to highest bidder (earliest bid wins ties)',
            "Money is deducted from winning player's budget",
            'Every player is guaranteed at least one engineer (intern safety net)',
          ],
        },
      ],
    },
    {
      number: 3,
      name: 'Planning Phase',
      description:
        "In this phase, players assign their engineers to action spaces. Each action has an effect on your company's metrics.",
      subsections: [
        {
          title: 'Available Actions',
          table: {
            headers: ['Action', 'Effect'],
            rows: [
              { Action: 'Develop Features', Effect: '+MAU (depends on product type & engineering strength)' },
              { Action: 'Marketing Push', Effect: '+MAU (marketing multiplier applies)' },
              { Action: 'Monetize Users', Effect: '+Revenue (depends on user base & product type)' },
              { Action: 'Optimize Code', Effect: '-Tech Debt (triggers puzzle phase if 2+ engineers)' },
              { Action: 'Upgrade Servers', Effect: '+Revenue & MAU (scales with DevOps talent)' },
              { Action: 'Research AI', Effect: '+AI capacity (AI adds +2 power per engineer)' },
            ],
          },
        },
        {
          title: 'Action Slots',
          content: 'Some actions have limited slots. Players who assign first block others.',
        },
      ],
    },
    {
      number: 4,
      name: 'Reveal Phase',
      description:
        'Players reveal their assigned engineers. Resolve action priorities based on slots and engineer power.',
    },
    {
      number: 5,
      name: 'Puzzle Phase',
      description:
        'Triggered when Optimize Code has 2+ engineers. Solve the puzzle to reduce technical debt.',
      subsections: [
        {
          title: 'Puzzle Rewards',
          items: [
            'Base reward: -1 tech debt',
            '+1 extra per additional engineer (max 3)',
            'Bonus money for perfect clear',
          ],
        },
      ],
    },
    {
      number: 6,
      name: 'Resolution Phase',
      description:
        'Apply the effects of all actions. Update MAU, Revenue, Rating, Tech Debt, AI Capacity, etc.',
      subsections: [
        {
          title: 'Milestone Check',
          content:
            'After resolution, check for milestone achievements. First player to reach them claims the bonus.',
        },
      ],
    },
    {
      number: 7,
      name: 'Event Phase',
      description: 'Draw an event card and apply its effect to all players.',
      subsections: [
        {
          title: 'Event Types',
          content:
            'Events can be positive (viral boost) or negative (security breach, PR crisis).',
        },
      ],
    },
    {
      number: 8,
      name: 'Round End',
      description: 'Each round ends with:',
      subsections: [
        {
          title: 'End of Round Tasks',
          items: [
            'Income from Revenue (capped if MAU too high)',
            'Rating adjustments',
            'MAU decay (if applicable)',
            'Refresh action slots',
            'Draft order recalculation',
          ],
        },
      ],
    },
  ],

  scoring: {
    title: 'End of Game Scoring',
    description: 'After Round 4, calculate your total startup value:',
    formula: 'Final Score = (MAU / 100) + Revenue + (Rating x 5) + Milestones + Equity Retained Bonus',
    note: 'More equity retained increases your final score multiplier.',
  },

  milestones: {
    title: 'Milestones',
    description:
      'The first player to achieve any milestone claims its bonus. Each can only be claimed once.',
    items: [
      { name: '10K Users', requirement: 'Reach 10,000 MAU', bonus: '+5 points', icon: '👥' },
      { name: '$100 Revenue', requirement: 'Reach $100 revenue', bonus: '+5 points', icon: '💰' },
      { name: '5-Star App', requirement: 'Reach 9+ rating (5 stars)', bonus: '+5 points', icon: '⭐' },
      { name: 'Zero Debt', requirement: 'Tech debt reduced to 0', bonus: '+5 points', icon: '🔧' },
      { name: 'AI Mastery', requirement: 'Reach AI capacity 8', bonus: '+5 points', icon: '🤖' },
    ],
  },

  specialRules: {
    title: 'Special Rules & Clarifications',
    rules: [
      {
        name: 'AI Augmentation',
        description: 'AI adds +2 power to any engineer but generates tech debt (less for AI-First strategy).',
      },
      {
        name: 'Tech Debt Penalty',
        description: 'Every 4 points of tech debt gives -1 power penalty to all engineers.',
      },
      { name: 'Rating Cap', description: 'Rating is an integer from 1 to 10.' },
      { name: 'MAU Floor', description: 'MAU cannot fall below 0.' },
      { name: 'Revenue Floor', description: 'Revenue cannot fall below 0.' },
      {
        name: 'Puzzle Phase',
        description: 'Only triggers if 2+ engineers are assigned to Optimize Code.',
      },
    ],
  },

  houseRules: {
    title: 'Optional House Rules',
    rules: [
      { name: 'Longer Game', description: 'Want a longer game? Try 6 rounds instead of 4.' },
      {
        name: 'More Chaos',
        description: 'Want more chaos? Shuffle 2 event cards per round and resolve both.',
      },
      {
        name: 'More Strategy',
        description:
          'Want more strategy? Allow milestone stealing if another player surpasses within 1 round.',
      },
    ],
  },

  quickStart: {
    title: 'Quick Start Summary',
    steps: [
      { step: 1, action: 'Pick corporation identity (Round 1 only)' },
      { step: 2, action: 'Draft engineers (lowest MAU goes first)' },
      { step: 3, action: 'Assign engineers to actions' },
      { step: 4, action: 'Reveal + resolve actions' },
      { step: 5, action: 'Check milestones + apply event' },
      { step: 6, action: 'End round and update income' },
      { step: 7, action: 'Repeat for 4 rounds' },
    ],
  },
};

// Keep the old export for backwards compatibility during transition
export const gameRulesText = `# Ship It! - The Software Startup Board Game
(Legacy format - see gameRules object for structured data)`;
