// ============================================
// GAME CONFIGURATION
// ============================================

export const TOTAL_QUARTERS = 4;
export const TOTAL_ROUNDS = TOTAL_QUARTERS; // Backwards compatibility alias
export const MAX_PLAYERS = 4;
export const MIN_PLAYERS = 2;

// ============================================
// RESOURCE TYPES
// ============================================

export interface Resources {
  money: number;
  serverCapacity: number;
  aiCapacity: number;
  techDebt: number;
}

// ============================================
// PRODUCTION TRACKS (Mars-style)
// ============================================
// Each player has production markers that slide along tracks.
// At the start of each round, players produce resources equal to their marker positions.

export interface ProductionTracks {
  mauProduction: number;       // 0-20: produces N × 200 MAU per round
  revenueProduction: number;   // 0-15: produces N × $5 income per round
}

export const PRODUCTION_CONSTANTS = {
  MAU_PER_PRODUCTION: 200,      // Each point of MAU production = +200 MAU
  MONEY_PER_PRODUCTION: 5,      // Each point of revenue production = +$5
  MAX_MAU_PRODUCTION: 20,
  MAX_REVENUE_PRODUCTION: 15,
} as const;

// ============================================
// CORPORATION / STRATEGY SELECTION
// ============================================

export type FundingType = 'vc-heavy' | 'bootstrapped' | 'angel-backed';
export type TechType = 'ai-first' | 'quality-focused' | 'move-fast';
export type ProductType = 'b2b' | 'consumer' | 'platform';

export interface CorporationStrategy {
  funding: FundingType;
  tech: TechType;
  product: ProductType;
}

// ============================================
// CORPORATION POWERS (Asymmetric Abilities)
// ============================================

export type CorporationPowerType = 'pivot' | 'lean-team' | 'insider-info';

export interface CorporationPower {
  id: CorporationPowerType;
  name: string;
  description: string;
  usesPerGame: number; // -1 = passive/unlimited
  triggersOn: 'manual' | 'draft' | 'hire' | 'passive'; // When the power activates
}

export interface FundingOption {
  id: FundingType;
  name: string;
  description: string;
  startingMoney: number;
  equityRetained: number; // 0-100%
  bonusEffect: string;
  power: CorporationPower; // Unique ability for this funding type
}

export interface TechOption {
  id: TechType;
  name: string;
  description: string;
  startingAiCapacity: number;
  startingTechDebt: number;
  bonusEffect: string;
}

export interface ProductOption {
  id: ProductType;
  name: string;
  description: string;
  mauMultiplier: number;
  revenueMultiplier: number;
  ratingMultiplier: number;
}

// ============================================
// STARTUP CARDS (Terraforming Mars-style Draft)
// ============================================

export type StartupAbilityType =
  | 'pivot'                  // Change product type once (existing)
  | 'lean-team'              // 20% off engineer costs (existing)
  | 'insider-info'           // See 2 extra engineers in draft (existing)
  | 'marketing-discount'     // 50% off marketing action
  | 'extra-forecasting'      // See events 2 quarters ahead
  | 'passive-income'         // +$5 per quarter
  | 'revenue-boost'          // +20% monetization revenue
  | 'viral-boost'            // +50% MAU from Go Viral
  | 'debt-immunity';         // Events cannot add tech debt

export interface StartupAbility {
  type: StartupAbilityType;
  value: number;  // Percentage or flat amount
  description: string;
}

export interface StartupCard {
  id: string;
  name: string;
  tagline: string;  // Flavor text
  funding: FundingType;
  tech: TechType;
  product: ProductType;
  // Starting bonuses (override defaults)
  startingMoney?: number;
  startingAiCapacity?: number;
  startingTechDebt?: number;
  startingMau?: number;
  // Passive abilities
  ability?: StartupAbility;
}

// ============================================
// ENGINEERS
// ============================================

export type EngineerLevel = 'junior' | 'senior' | 'intern';

// ============================================
// ENGINEER TRAITS (Unique characteristics)
// ============================================

export type EngineerTraitType =
  | 'ai-skeptic'      // Cannot use AI augmentation, +1 base power
  | 'equity-hungry'   // Costs +$5, +1 power if retained 2+ rounds
  | 'startup-veteran' // Immune to event penalties
  | 'night-owl';      // +1 power on last action assigned each round

export interface EngineerTrait {
  id: EngineerTraitType;
  name: string;
  description: string;
}

export const ENGINEER_TRAITS: Record<EngineerTraitType, EngineerTrait> = {
  'ai-skeptic': {
    id: 'ai-skeptic',
    name: 'AI Skeptic',
    description: 'Cannot use AI augmentation, but +1 base power',
  },
  'equity-hungry': {
    id: 'equity-hungry',
    name: 'Equity-Hungry',
    description: 'Costs +$5 salary, +1 power if retained 2+ rounds',
  },
  'startup-veteran': {
    id: 'startup-veteran',
    name: 'Startup Veteran',
    description: 'Immune to negative event effects',
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: '+1 power on last action assigned each round',
  },
};

export interface Engineer {
  id: string;
  name: string;
  level: EngineerLevel;
  specialty?: 'frontend' | 'backend' | 'fullstack' | 'devops' | 'ai';
  baseSalary: number;
  power: number; // integer power: intern=1, junior=2, senior=4
  trait?: EngineerTraitType; // Optional unique trait
}

export interface HiredEngineer extends Engineer {
  playerId: string;
  salaryPaid: number;
  assignedAction?: ActionType;
  hasAiAugmentation: boolean;
  roundsRetained: number; // Number of rounds this engineer has been with the player
}

// ============================================
// ACTIONS / WORKER PLACEMENT
// ============================================

export type ActionType =
  | 'develop-features'
  | 'optimize-code'
  | 'pay-down-debt'
  | 'upgrade-servers'
  | 'research-ai'
  | 'marketing'
  | 'monetization'
  | 'hire-recruiter'
  // Late-game actions (unlock in later rounds)
  | 'go-viral'
  | 'ipo-prep'
  | 'acquisition-target';

export interface ActionSpace {
  id: ActionType;
  name: string;
  description: string;
  maxWorkers?: number; // undefined = unlimited
  requiredResources?: Partial<Resources>;
  effect: ActionEffect;
  unlocksAtRound?: number; // Round number when this action becomes available (1-4)
}

export interface ActionEffect {
  mauChange?: number;
  revenueChange?: number;
  ratingChange?: number;           // Integer: +1, -1, +2, -2
  resourceChanges?: Partial<Resources>;
  // Production track deltas (Mars-style)
  mauProductionDelta?: number;     // How much to move MAU production marker
  revenueProductionDelta?: number; // How much to move Revenue production marker
  triggersMinigame?: boolean;
  special?: string;
}

export interface PlannedAction {
  actionType: ActionType;
  engineerId: string;
  useAiAugmentation: boolean;
}

// ============================================
// BIDDING
// ============================================

export interface Bid {
  playerId: string;
  amount: number;
  timestamp: number; // for tiebreakers
}

export interface BidResult {
  engineerId: string;
  winningBid: Bid;
  allBids: Bid[];
}

// ============================================
// EVENTS
// ============================================

export type EventType =
  | 'ddos-attack'
  | 'supply-chain-issues'
  | 'viral-moment'
  | 'security-breach'
  | 'competitor-launch';

export interface GameEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  effect: EventEffect;
  mitigation: EventMitigation;
}

export interface EventEffect {
  mauChange?: number;
  revenueChange?: number;
  ratingChange?: number;
  resourceChanges?: Partial<Resources>;
  special?: string;
}

export interface EventMitigation {
  condition: string;
  reducedEffect: EventEffect;
}

// ============================================
// PUZZLE MINI-GAME
// ============================================

export type BlockType = 'move' | 'loop' | 'if' | 'while' | 'function' | 'collect' | 'turn-left' | 'turn-right';
export type Direction = 'up' | 'down' | 'left' | 'right';
export type Condition = 'has-coin' | 'path-clear' | 'at-edge';

export interface CodeBlock {
  id: string;
  type: BlockType;
  value?: number; // for LOOP(n)
  condition?: Condition; // for IF/WHILE
  children?: CodeBlock[]; // for nested blocks
}

export interface PuzzleGrid {
  width: number;
  height: number;
  playerStart: { x: number; y: number; direction: Direction };
  coins: { x: number; y: number }[];
  walls: { x: number; y: number }[];
  goal?: { x: number; y: number };
}

export interface Puzzle {
  id: string;
  difficulty: 1 | 2 | 3 | 4;
  grid: PuzzleGrid;
  optimalBlocks: number;
  availableBlocks: BlockType[];
  timeLimit: number; // seconds
}

export interface PuzzleSolution {
  playerId: string;
  blocks: CodeBlock[];
  blockCount: number;
  solveTime: number; // milliseconds
  isCorrect: boolean;
}

export interface PuzzleResult {
  puzzleId: string;
  solutions: PuzzleSolution[];
  winnerId?: string;
  bonusAwarded: PuzzleBonus;
}

export interface PuzzleBonus {
  techDebtReduction?: number;
  extraMau?: number;
  extraRevenue?: number;
  extraRating?: number;
}

// ============================================
// PLAYER STATE
// ============================================

export interface PlayerMetrics {
  mau: number;
  revenue: number;
  rating: number; // 1-10 integer scale (no decimals)
}

export interface Player {
  id: string;
  name: string;
  color: string;
  isReady: boolean;
  strategy?: CorporationStrategy;
  startupCard?: StartupCard; // The startup card this player selected
  resources: Resources;
  metrics: PlayerMetrics;
  productionTracks: ProductionTracks; // Mars-style production markers
  engineers: HiredEngineer[];
  plannedActions: PlannedAction[];
  hasRecruiterBonus: boolean;
  synergiesUnlocked: string[];
  // Corporation power tracking
  powerUsesRemaining: number; // For limited-use powers like Pivot
  hasPivoted: boolean; // Track if VC-Heavy has used their pivot
  // IPO/Acquisition tracking for late-game actions
  ipoBonusScore: number; // Score bonus from IPO Prep action
}

// ============================================
// GAME PHASES
// ============================================

export type GamePhase =
  | 'setup'
  | 'startup-draft'           // New: Terraforming Mars-style startup card selection
  | 'corporation-selection'   // Legacy: kept for backwards compatibility
  | 'engineer-draft'
  | 'planning'
  | 'reveal'
  | 'puzzle'
  | 'resolution'
  | 'event'
  | 'round-end'
  | 'game-end';

export interface RoundState {
  roundNumber: number;
  phase: GamePhase;
  engineerPool: Engineer[];
  currentBids: Map<string, Bid>; // engineerId -> bid
  bidResults: BidResult[];
  currentEvent?: GameEvent;
  upcomingEvent?: GameEvent; // EVENT FORECASTING: Show next round's event during planning
  currentPuzzle?: Puzzle;
  puzzleResults?: PuzzleResult;
  occupiedActions: Map<ActionType, string[]>; // action -> array of playerIds who have claimed it
  draftOrder: string[]; // player IDs in draft order (lowest MAU first for catch-up)
}

// ============================================
// GAME STATE
// ============================================

// ============================================
// MILESTONES (Achievement System)
// ============================================

export interface Milestone {
  id: string;
  name: string;
  description: string;
  bonus: number; // Score bonus at game end
  claimedBy?: string; // playerId who claimed it
  claimedRound?: number; // round when claimed
}

// Milestone definitions (conditions checked in gameStore)
export const MILESTONE_DEFINITIONS = [
  { id: 'first-5k-mau', name: 'First to 5K Users', description: 'First player to reach 5,000 MAU', bonus: 10 },
  { id: 'first-9-rating', name: 'Five Star Startup', description: 'First player to achieve 9+ rating (5 stars)', bonus: 15 },
  { id: 'first-debt-free', name: 'Clean Code Club', description: 'First player to have 0 tech debt (after having debt)', bonus: 10 },
  { id: 'first-10k-mau', name: 'Growth Hacker', description: 'First player to reach 10,000 MAU', bonus: 15 },
  { id: 'revenue-leader', name: 'Revenue King', description: 'First player to reach $1,000 revenue', bonus: 12 },
] as const;

export interface GameState {
  id: string;
  phase: GamePhase;
  currentRound: number; // Now represents quarters (Q1-Q4)
  currentQuarter: number; // Alias for currentRound
  players: Player[];
  currentPlayerIndex: number;
  roundState: RoundState;
  eventDeck: GameEvent[];
  usedEvents: GameEvent[];
  milestones: Milestone[]; // Track claimed milestones
  // Startup card draft
  startupDeck: StartupCard[];
  dealtStartupCards: Map<string, StartupCard[]>; // playerId -> dealt cards
  winner?: string;
  finalScores?: Map<string, number>;
}

// ============================================
// GAME ACTIONS (for state management)
// ============================================

export type GameAction =
  | { type: 'START_GAME'; playerCount: number }
  | { type: 'SET_PLAYER_NAME'; playerId: string; name: string }
  | { type: 'SELECT_STRATEGY'; playerId: string; strategy: CorporationStrategy }
  | { type: 'PLAYER_READY'; playerId: string }
  | { type: 'SUBMIT_BID'; playerId: string; engineerId: string; amount: number }
  | { type: 'RESOLVE_BIDS' }
  | { type: 'ASSIGN_ENGINEER'; playerId: string; engineerId: string; action: ActionType; useAi: boolean }
  | { type: 'LOCK_PLAN'; playerId: string }
  | { type: 'REVEAL_PLANS' }
  | { type: 'START_PUZZLE' }
  | { type: 'SUBMIT_PUZZLE_SOLUTION'; playerId: string; solution: CodeBlock[] }
  | { type: 'RESOLVE_ACTIONS' }
  | { type: 'APPLY_EVENT' }
  | { type: 'END_ROUND' }
  | { type: 'CALCULATE_WINNER' };

// ============================================
// UI STATE
// ============================================

export interface UIState {
  selectedEngineerId?: string;
  selectedActionSpace?: ActionType;
  showBidModal: boolean;
  showPuzzleModal: boolean;
  showEventModal: boolean;
  animatingReveal: boolean;
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

// ============================================
// TECH DEBT EFFECTS (Integer-based)
// ============================================

export interface TechDebtLevel {
  min: number;
  max: number;
  powerPenalty: number;             // Flat power reduction for ALL engineers (-1 per 4 debt)
  mauProductionPenalty: number;     // Penalty to MAU production track
  revenueProductionPenalty: number; // Penalty to Revenue production track
  ratingPenalty: number;            // Integer penalty to rating
  blocksDevelopment: boolean;       // Blocks develop-features and optimize-code
}

export const TECH_DEBT_LEVELS: TechDebtLevel[] = [
  { min: 0, max: 3, powerPenalty: 0, mauProductionPenalty: 0, revenueProductionPenalty: 0, ratingPenalty: 0, blocksDevelopment: false },
  { min: 4, max: 7, powerPenalty: -1, mauProductionPenalty: -1, revenueProductionPenalty: 0, ratingPenalty: 0, blocksDevelopment: false },
  { min: 8, max: 11, powerPenalty: -2, mauProductionPenalty: -1, revenueProductionPenalty: -1, ratingPenalty: 0, blocksDevelopment: false },
  { min: 12, max: Infinity, powerPenalty: -3, mauProductionPenalty: -2, revenueProductionPenalty: -1, ratingPenalty: -1, blocksDevelopment: true },
];

// Helper function to get current tech debt level
export function getTechDebtLevel(techDebt: number): TechDebtLevel {
  return TECH_DEBT_LEVELS.find(l => techDebt >= l.min && techDebt <= l.max) || TECH_DEBT_LEVELS[0];
}

// ============================================
// AI AUGMENTATION (Integer Power System)
// ============================================
// AI augmentation adds +2 power (flat) but generates tech debt.
// Debt generated depends on engineer level (seniors are more careful with AI).

export const AI_POWER_BONUS = 2; // Flat +2 power from AI augmentation

export interface AiDebtByLevel {
  engineerLevel: EngineerLevel;
  techDebtGenerated: number;
}

export const AI_DEBT_TABLE: AiDebtByLevel[] = [
  { engineerLevel: 'intern', techDebtGenerated: 4 },
  { engineerLevel: 'junior', techDebtGenerated: 3 },
  { engineerLevel: 'senior', techDebtGenerated: 1 },
];

export function getAiDebt(level: EngineerLevel): number {
  return AI_DEBT_TABLE.find(e => e.engineerLevel === level)?.techDebtGenerated ?? 2;
}
