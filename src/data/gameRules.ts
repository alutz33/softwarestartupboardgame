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
      'Ship It! is a competitive strategy board game for 2-4 players where you build a software startup. Place code tokens on your grid, publish apps or grow users, manage engineers, and race for milestones — all while keeping tech debt under control.',
    stats: {
      players: '2-4',
      duration: '~45 minutes',
      rounds: '12 (3 per quarter, 4 quarters)',
    },
  },

  objective: {
    title: 'Objective',
    description:
      'Score the most Victory Points by the end of Year 1 (4 quarters). Your strategy depends on your play style:',
    metrics: [
      {
        name: 'Agency',
        fullName: 'App Studio',
        description: 'Publish apps by matching grid patterns to app cards for VP',
      },
      {
        name: 'Product',
        fullName: 'Live Product',
        description: 'Grow MAU via milestones + commit code lines for VP',
      },
      {
        name: 'Both',
        fullName: 'Shared',
        description: 'Money converts to VP ($10 = 1 VP) + milestone bonuses',
      },
    ],
  },

  whatsNew: [
    {
      title: 'Code Grid System',
      badge: 'NEW',
      description:
        'Each player has a 4x4 grid where they place colored code tokens. The grid is central to both play styles:',
      items: [
        { mechanic: 'Develop Features', effect: 'Pick a token from the shared pool and place it on your grid' },
        { mechanic: 'Publish App (Agency)', effect: 'Match a pattern on your grid to an app card for star ratings and VP' },
        { mechanic: 'Commit Code (Product)', effect: 'Lock 3 same-color or 4 all-different tokens in a line for VP + MAU production' },
        { mechanic: 'Optimize Code', effect: 'Push-your-luck mini-game that earns grid swaps to rearrange tokens' },
      ],
    },
    {
      title: 'Action Draft Phase',
      badge: 'NEW',
      description:
        'Replaces the old planning/reveal/resolution phases. Players take turns in snake draft order (lowest VP first) placing one engineer at a time. Actions resolve immediately when placed!',
    },
    {
      title: 'Two Play Styles',
      badge: 'NEW',
      description:
        'Choose App Studio (agency) or Live Product at the start. Each has different scoring, free actions, and marketing/monetization effects.',
    },
    {
      title: '3 Rounds per Quarter',
      badge: 'NEW',
      description:
        'Each quarter has 3 action draft rounds. Between rounds, engineers unassign and return to your pool. Events, production, and engineer drafts happen only at quarter boundaries.',
    },
    {
      title: 'Free Actions',
      description: 'Before placing an engineer each turn, you can take free actions: Publish App (agency), Commit Code, or Use Leader Power.',
    },
    {
      title: 'Catch-Up Mechanics',
      description: 'Multiple mechanisms help trailing players:',
      items: [
        { mechanic: 'Snake Draft Order', effect: 'Lowest VP picks first in the action draft' },
        { mechanic: 'Engineer Draft', effect: 'Lowest MAU picks first when hiring engineers' },
        { mechanic: 'Income Cap', effect: 'High MAU income is capped to prevent runaway leaders' },
      ],
    },
  ],

  gameSetup: {
    title: 'Game Setup',
    steps: [
      'Select number of players (2-4)',
      'Each player drafts a Leader (pick 1 of 3 persona cards dealt)',
      'Each player chooses a Play Style: App Studio (agency) or Live Product',
      'Players receive starting resources based on leader + balanced funding',
      'First engineer draft begins — lowest MAU picks first',
    ],
  },

  gameFlow: {
    title: 'Game Flow',
    description: 'The game spans 4 quarters. Each quarter follows this flow:',
    phases: [
      { name: 'Engineer Draft', note: 'start of each quarter' },
      { name: 'Action Draft R1', note: 'snake order by VP' },
      { name: 'Action Draft R2', note: 'engineers reset' },
      { name: 'Action Draft R3', note: 'last round of quarter' },
      { name: 'Event Phase', note: 'end of quarter only' },
      { name: 'Quarter End', note: 'production + cleanup' },
    ],
  },

  phases: [
    {
      number: 1,
      name: 'Leader Draft & Play Style',
      note: 'Game Start Only',
      description:
        'Each player picks a leader from 3 dealt persona cards, then chooses a play style that determines how they score VP.',
      subsections: [
        {
          title: 'Play Styles',
          table: {
            headers: ['Style', 'Scoring', 'Free Action', 'Marketing Effect', 'Monetization Effect'],
            rows: [
              {
                Style: 'App Studio (Agency)',
                Scoring: 'VP from published app star ratings',
                'Free Action': 'Publish App: match grid pattern to app card',
                'Marketing Effect': '+1 star bonus on next publish',
                'Monetization Effect': '+$1 per total published star',
              },
              {
                Style: 'Live Product',
                Scoring: 'VP from MAU milestones + committed code',
                'Free Action': 'Commit Code: lock 3-same or 4-different tokens',
                'Marketing Effect': '+1 MAU production track',
                'Monetization Effect': '+$1 recurring revenue per round',
              },
            ],
          },
        },
        {
          title: 'Leaders',
          content: '18 unique persona cards, each with: a starting bonus, a once-per-game power, and an always-on passive ability. Unchosen leaders become premium engineers (Senior, 4 power) with unique traits in the engineer draft.',
        },
      ],
    },
    {
      number: 2,
      name: 'Engineer Draft',
      description:
        'At the start of each quarter, hire engineers from a shared pool. Lowest MAU picks first (catch-up mechanic).',
      subsections: [
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
          content: 'Each engineer has a specialty that gives +1 power when assigned to a matching action:',
          table: {
            headers: ['Specialty', 'Matching Actions'],
            rows: [
              { Specialty: 'Frontend', 'Matching Actions': 'Develop Features, Marketing' },
              { Specialty: 'Backend', 'Matching Actions': 'Optimize Code, Upgrade Servers' },
              { Specialty: 'Fullstack', 'Matching Actions': 'Develop Features, Optimize Code' },
              { Specialty: 'DevOps', 'Matching Actions': 'Upgrade Servers, Research AI' },
              { Specialty: 'AI', 'Matching Actions': 'Research AI, Optimize Code' },
            ],
          },
        },
        {
          title: 'Engineer Traits (~35% chance)',
          table: {
            headers: ['Trait', 'Effect'],
            rows: [
              { Trait: 'AI Skeptic', Effect: '+1 base power, but cannot use AI augmentation' },
              { Trait: 'Equity-Hungry', Effect: '+$5 hire cost, but +1 power if retained 2+ rounds' },
              { Trait: 'Startup Veteran', Effect: 'Immune to negative event effects' },
              { Trait: 'Night Owl', Effect: '+1 power on the last action assigned each round' },
            ],
          },
        },
        {
          title: 'Pool Quality',
          items: [
            'Pool size = Players + 1 (plus recruiter/insider bonuses)',
            'Q1: 30% seniors, Q2: 40%, Q3: 50%, Q4: 60%',
            'Persona engineers (unchosen leaders) are auctioned separately',
          ],
        },
      ],
    },
    {
      number: 3,
      name: 'Action Draft (3 rounds per quarter)',
      description:
        'The core of each quarter. Players take turns in snake order (lowest VP first) placing engineers on action spaces. Actions resolve immediately when placed.',
      subsections: [
        {
          title: 'Turn Structure',
          items: [
            '1. Take free actions (optional): Publish App, Commit Code, or Use Leader Power',
            '2. Select an unassigned engineer',
            '3. Place them on an available action space',
            '4. Action resolves immediately (or triggers mini-game for interactive actions)',
            '5. Next player\'s turn (snake order advances)',
          ],
        },
        {
          title: 'Available Actions',
          table: {
            headers: ['Action', 'Cost', 'Slots', 'Effect'],
            rows: [
              { Action: 'Develop Features', Cost: 'Free', Slots: '3', Effect: 'Pick a token from the shared pool and place it on your grid' },
              { Action: 'Optimize Code', Cost: 'Free', Slots: 'No limit', Effect: 'Push-your-luck mini-game: earn grid swaps to rearrange tokens' },
              { Action: 'Pay Down Debt', Cost: 'Free', Slots: 'No limit', Effect: '-2 tech debt (always available safety valve)' },
              { Action: 'Marketing', Cost: '$20', Slots: '1', Effect: '+MAU (scaled by power and rating). Agency: +1 star bonus. Product: +1 MAU production' },
              { Action: 'Monetization', Cost: 'Free', Slots: '2', Effect: '+Revenue (scaled by power and MAU). Agency: +$1/published star. Product: +$1 recurring' },
              { Action: 'Upgrade Servers', Cost: '$10', Slots: '2', Effect: '+5 server capacity' },
              { Action: 'Research AI', Cost: '$15', Slots: '2', Effect: '+2 AI capacity' },
              { Action: 'Hire Recruiter', Cost: '$25', Slots: '1', Effect: 'See +2 extra engineers next quarter' },
            ],
          },
        },
        {
          title: 'Late-Game Actions',
          table: {
            headers: ['Action', 'Unlocks', 'Cost', 'Slots', 'Effect'],
            rows: [
              { Action: 'Go Viral', Unlocks: 'Q3', Cost: '$15', Slots: '1', Effect: '50/50: success = +3000 MAU + 2 MAU prod; fail = -1000 MAU' },
              { Action: 'IPO Prep', Unlocks: 'Q4', Cost: '$50', Slots: '1', Effect: '+25 bonus VP' },
              { Action: 'Acquisition Target', Unlocks: 'Q4', Cost: 'Free', Slots: '1', Effect: 'MAU x 0.002 instant VP; lose 50% MAU' },
            ],
          },
        },
        {
          title: 'Interactive Actions',
          content: 'Develop Features and Optimize Code trigger interactive mini-games instead of resolving automatically. Develop Features lets you pick a token from the shared pool and place it on your grid. Optimize Code runs a push-your-luck game where successes earn grid swaps.',
        },
        {
          title: 'Between Rounds (within a quarter)',
          items: [
            'All engineers unassign and return to your pool',
            'Occupied action slots reset',
            'Per-round flags (commit code used, etc.) reset',
            'No events, no production — just another action draft round',
          ],
        },
      ],
    },
    {
      number: 4,
      name: 'Event Phase',
      description: 'At the end of each quarter (after all 3 rounds), draw and apply an event to all players.',
      subsections: [
        {
          title: 'Event Types',
          content: 'Events can be positive (viral moment, Product Hunt) or negative (DDoS, data breach, competitor launch). High server capacity, low tech debt, or high rating can mitigate negative effects.',
        },
        {
          title: 'Mitigation Examples',
          table: {
            headers: ['Event', 'Mitigated By', 'Full Effect', 'Reduced Effect'],
            rows: [
              { Event: 'DDoS Attack', 'Mitigated By': 'Server > 20', 'Full Effect': '-500 MAU, -1 rating, +1 debt', 'Reduced Effect': '-100 MAU only' },
              { Event: 'Data Breach', 'Mitigated By': 'Tech Debt < 4', 'Full Effect': '-2 rating, -200 revenue, +2 debt', 'Reduced Effect': '-1 rating, -50 revenue' },
              { Event: 'Competitor Launch', 'Mitigated By': 'Rating > 7', 'Full Effect': '-300 MAU, +1 debt', 'Reduced Effect': '-50 MAU only' },
            ],
          },
        },
      ],
    },
    {
      number: 5,
      name: 'Quarter End',
      description: 'After the event phase, the quarter wraps up with production, cleanup, and preparation for next quarter.',
      subsections: [
        {
          title: 'Production (Mars-Style Tracks)',
          items: [
            'MAU Production: +200 MAU per production point (max 20 points)',
            'Revenue Production: +$5 per production point (max 15 points)',
            'Tech debt reduces effective production (4-7 debt: -1 MAU prod; 8-11: -1 MAU, -1 Rev; 12+: -2 MAU, -1 Rev)',
            'Product corps: +recurring revenue income',
          ],
        },
        {
          title: 'Quarter Cleanup',
          items: [
            'All engineers unassign',
            'Quarterly theme changes',
            'Code token pool refills',
            'Milestone check',
            'New engineer draft for next quarter',
          ],
        },
      ],
    },
  ],

  scoring: {
    title: 'End of Game Scoring',
    description: 'After Q4, calculate Victory Points based on your play style:',
    formula: 'Agency: Published App VP + Money/10 + Milestones  |  Product: MAU Milestone VP + Committed Code/2 + Money/10 + Milestones',
    note: 'Both styles also gain VP from IPO Prep (+25) or Acquisition Target (MAU x 0.002) if taken in Q4.',
  },

  milestones: {
    title: 'Milestones',
    description:
      'The first player to achieve a milestone claims its bonus VP. Each can only be claimed once per game.',
    items: [
      { name: 'First to 5K Users', requirement: 'Reach 5,000 MAU', bonus: '+10 VP', icon: '5K' },
      { name: 'Five Star Startup', requirement: 'Reach 9+ rating', bonus: '+15 VP', icon: '9+' },
      { name: 'Clean Code Club', requirement: 'Reach 0 tech debt (after having debt)', bonus: '+10 VP', icon: '0d' },
      { name: 'Growth Hacker', requirement: 'Reach 10,000 MAU', bonus: '+15 VP', icon: '10K' },
      { name: 'Revenue King', requirement: 'Reach $1,000 revenue', bonus: '+12 VP', icon: '$1K' },
    ],
  },

  specialRules: {
    title: 'Key Mechanics & Clarifications',
    rules: [
      {
        name: 'Code Grid',
        description: 'Your 4x4 grid holds colored tokens (green, orange, blue, purple). Develop Features adds tokens; Publish App and Commit Code consume them.',
      },
      {
        name: 'AI Augmentation',
        description: 'When placing an engineer, optionally enable AI for +2 power but generates tech debt (1-4 based on engineer level). AI-First tech or certain leaders reduce this.',
      },
      {
        name: 'Tech Debt Penalty',
        description: 'Every 4 points of debt = -1 power to all engineers. At 12+ debt: -3 power, -2 MAU production, -1 revenue production, -1 rating.',
      },
      {
        name: 'Exclusive Actions',
        description: 'Marketing, Hire Recruiter, Go Viral, IPO Prep, and Acquisition Target each have 1 slot. First player to claim blocks all others for that round.',
      },
      {
        name: 'Snake Draft Order',
        description: 'Action draft uses snake order by VP (lowest first). If 3 players, the order might be: 1-2-3-3-2-1-1-2-3...',
      },
      {
        name: 'Publish App (Agency)',
        description: 'Match a pattern from a held app card to your grid. Stars (1-5) depend on how many tokens match. VP = card max VP x (stars/5). Marketing star bonus adds to matches.',
      },
      {
        name: 'Commit Code (Product)',
        description: 'Once per round. Lock 3 same-color tokens or 4 all-different-color tokens in a row/column. Gives +$1, +1 MAU production, and counts toward VP (1 VP per 2 commits).',
      },
      {
        name: 'MAU Milestones (Product)',
        description: 'Product corps score VP from reaching MAU thresholds: 1K (+1 VP), 2.5K (+2), 5K (+3), 10K (+5).',
      },
      {
        name: 'Rating Scale',
        description: 'Integer from 1 to 10. Affects marketing effectiveness and event mitigation. Cannot exceed 10 or drop below 1.',
      },
    ],
  },

  houseRules: {
    title: 'Tips & Strategy',
    rules: [
      {
        name: 'Agency Strategy',
        description: 'Fill your grid quickly with Develop Features, use Marketing for star bonuses, then Publish Apps for VP. Optimize Code helps rearrange tokens into better patterns.',
      },
      {
        name: 'Product Strategy',
        description: 'Build same-color clusters or diverse lines on your grid. Commit Code every round for steady VP + MAU growth. Marketing advances your MAU production track for compounding returns.',
      },
      {
        name: 'Managing Tech Debt',
        description: 'Keep debt below 4 for no penalties. Pay Down Debt is always available as a safety valve. AI augmentation is powerful but watch the debt accumulation!',
      },
      {
        name: 'Late Game',
        description: 'Q3 unlocks Go Viral (risky but huge MAU). Q4 unlocks IPO Prep ($50 for +25 VP) and Acquisition Target (cash out MAU for VP). Plan your money for these!',
      },
    ],
  },

  quickStart: {
    title: 'Quick Start Summary',
    steps: [
      { step: 1, action: 'Pick your leader (1 of 3 persona cards)' },
      { step: 2, action: 'Choose play style: App Studio or Live Product' },
      { step: 3, action: 'Draft engineers (lowest MAU picks first)' },
      { step: 4, action: 'Action Draft: take free actions, then place 1 engineer' },
      { step: 5, action: 'Actions resolve immediately — repeat for all engineers' },
      { step: 6, action: '3 rounds per quarter, then event + production' },
      { step: 7, action: '4 quarters total — highest VP wins!' },
    ],
  },
};

// Keep the old export for backwards compatibility during transition
export const gameRulesText = `# Ship It! - The Software Startup Board Game
(Legacy format - see gameRules object for structured data)`;
