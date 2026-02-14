# Ship It! — Remaining Phases Execution Plan

**Status as of Phase 2.5**: Core integer math, production tracks, 18 persona cards, leader draft, funding selection, persona auctions, 10/18 leader passives, 7/18 persona traits, and balance simulation harness are all implemented and compiling.

---

## Phase 2.6: Balance Tuning (Pre-requisite to Phase 3)

**Goal**: Get all 18 leaders and persona traits fully functional, then tune numbers until no leader/funding combo has >35% or <15% win rate.

### Step 1: Implement remaining 9 leader passives in `gameStore.ts`

These are already documented as TODOs at line ~1597 of gameStore.ts:

| Passive | Leader | Implementation |
|---|---|---|
| `hype-machine` | Elom Tusk | In resolveActions: +500 MAU from any action, then `randInt(-200, 200)` variance at round end |
| `network-effects` | Mark Zucker | In resolveActions: after all players resolve, check if any opponent used Marketing → +500 MAU to Zucker |
| `immutable-ledger` | Satoshi | In assignEngineer: block Marketing assignment. In applyEvent: skip Data Breach for this player |
| `gpu-royalties` | Jensen Wattson | In resolveActions: Research AI gives +1 extra AI Capacity |
| `alignment-tax` | Sam Chatman | In resolveActions: AI debt = 0, but at round end if any AI was used → -1 Rating |
| `trust-safety` | Whitney Buzz Herd | In applyEvent: rating floor 4. In resolveActions: Marketing gives +1 extra Rating |
| `marketplace-tax` | Gabe Newdeal | In endRound: count opponents who used Develop Features × $3 |
| `dual-focus` | Jack Blocksey | In assignEngineer: allow two exclusive action slots instead of one |
| `crisis-resilience` | Brian Spare-key | In resolveActions: when any opponent gains MAU from Marketing/Go Viral, Brian gains +200 MAU |

### Step 2: Implement remaining 11 persona engineer traits

These are already documented as TODOs at line ~1608:

| Trait | Persona Engineer | Where |
|---|---|---|
| Perfectionist | Steeve Careers eng | resolveActions: develop-features → +1 rating, -200 MAU |
| Volatile | Elom Tusk eng | resolveActions: research-ai → +2 power; AI aug → +1 extra debt |
| Researcher | Lora Page eng | resolveActions: no specialty bonus on non-AI, 2× on AI |
| Decentralist | Satoshi eng | resolveActions: AI debt halved for this engineer (floor) |
| Parallel Processor | Jensen eng | resolveActions: research-ai → also +1 server capacity |
| Alignment Researcher | Sam eng | resolveActions: +2 on research-ai, -1 if AI Capacity > 6 |
| Monetizer | Susan eng | resolveActions: monetization → +1 rev production (custom) |
| Protocol Purist | Jack eng | resolveActions: +1 on pay-down-debt, immune to event debt |
| Community Manager | Whitney eng | resolveActions: rating cannot decrease from assigned action |
| Admiral's Discipline | Grace eng | resolveActions: action generates 0 tech debt even with AI |
| Resilience Architect | Brian eng | resolveActions: +1 on upgrade-servers; on negative event +1 server |

### Step 3: Update balance simulator with new passives

Add the 9 new leader passives to `src/simulation/balanceSimulator.ts` so the sim results are accurate.

### Step 4: Run simulation (1000+ games per combo) and tune

- Run `npx tsx src/simulation/runBalance.ts 1000`
- Identify outliers (>35% or <15% win rate)
- Tuning levers:
  - Steeve Careers: nerf perfectionist to "+1 rating every other round" or "only if rating < 8"
  - Bootstrapped: reduce starting money from $40→$35, or reduce 2x revenue scoring to 1.5x
  - Underperforming leaders: buff starting bonuses or passive magnitude
- Re-run simulation after each adjustment until within bounds
- Target: all combos within 15-35% win rate, all leaders within 20-30% aggregate

### Files touched
- `src/state/gameStore.ts` (passives + traits in resolveActions, assignEngineer, applyEvent, endRound)
- `src/simulation/balanceSimulator.ts` (add new passives)
- `src/data/personaCards.ts` (may adjust starting bonuses)
- `src/data/corporations.ts` (may adjust funding starting money/bonuses)

### Estimated scope: ~200-300 lines of game logic, ~100 lines of sim updates

---

## Phase 3: Core Loop Changes

Three independent work streams that can be built in parallel.

### Phase 3A: Sprint Mini-Game (replaces Coding Puzzle)

**Goal**: Replace the path-finding coding puzzle with a push-your-luck card draw that all players participate in simultaneously.

#### Data model changes (`src/types/index.ts`)
```
SprintToken = '+1 Clean Code' | '+2 Clean Code' | 'Bug!' | 'Critical Bug!'
SprintState = {
  tokenBag: SprintToken[]            // shuffled bag
  playerStates: Map<string, {
    drawnTokens: SprintToken[]
    bugCount: number
    cleanCodeTotal: number
    hasStopped: boolean
    hasBusted: boolean
    maxDraws: number                  // based on engineer count: 1eng=5, 2eng=7, 3eng=9
    bugReverts: number                // from Backend specialty engineers
  }>
}
```

#### Game store changes (`src/state/gameStore.ts`)
- New actions: `startSprint()`, `drawSprintToken(playerId)`, `stopSprint(playerId)`
- `startSprint()`: Create token bag (ratio: 8× +1, 3× +2, 4× Bug!, 2× Critical Bug!), init per-player state
- `drawSprintToken()`: Pop from bag, apply to player. If bugCount >= 3 → bust (lose all, +1 debt)
- `stopSprint()`: Player keeps accumulated Clean Code tokens as debt reduction
- Non-participants: auto-draw 1 token (no bust risk from single draw)
- Phase transition: `'puzzle'` → `'sprint'` in GamePhase type
- Remove old puzzle-related actions (`startPuzzle`, `submitPuzzleSolution`, `endPuzzle`)

#### UI changes
- Delete or archive: `src/components/puzzle/` directory
- New: `src/components/game/SprintPhase.tsx`
  - Show token bag (face down pile with count)
  - Per-player lane: drawn tokens displayed, bug counter, stop/draw buttons
  - Animation: token flip on draw, red flash on Bug!, explosion on bust
  - Timer: optional 60-second overall timer
- Update: `App.tsx` to route `'sprint'` phase
- Update: `PhaseGuide.tsx` with sprint instructions

#### Files touched
- `src/types/index.ts` (add SprintToken, SprintState; update GamePhase)
- `src/state/gameStore.ts` (replace puzzle actions with sprint actions)
- `src/components/game/SprintPhase.tsx` (new)
- `src/components/ui/PhaseGuide.tsx` (add sprint entry)
- `src/App.tsx` (route sprint phase)
- `src/data/puzzles.ts` → `src/data/sprintTokens.ts` (replace)

### Phase 3B: Sequential Action Drafting (Worker Placement)

**Goal**: Replace simultaneous blind planning with sequential action claiming in snake-draft order, adding strategic depth and player interaction.

#### Data model changes (`src/types/index.ts`)
```
PlanningMode = 'sequential' | 'parallel'
GameConfig = { planningMode: PlanningMode, ... }
RoundState additions:
  pickOrder: string[]              // snake draft order of player IDs
  currentPickerIndex: number       // who is currently placing
  picksRemaining: number           // total picks left in the round
```

#### Game store changes (`src/state/gameStore.ts`)
- New action: `claimActionSlot(playerId, engineerId, action, useAi)` — sequential mode
  - Validate it's this player's turn (currentPickerIndex check)
  - Place the engineer, advance to next picker in snake order
  - When all picks are made, transition to sprint/resolution
- Keep existing `lockPlan()` / `assignEngineer()` for Quick Play (parallel) mode
- `revealPlans()` → skip in sequential mode (everything is already visible)
- `initGame()` → accept `planningMode` config option
- Snake order calculation: `P1→P2→P3→P4→P4→P3→P2→P1→P1→...` where P1 is lowest MAU

#### UI changes
- Major rework: `src/components/game/PlanningPhase.tsx`
  - Sequential mode: Show all player boards visible, highlight current picker, animate placements
  - Show opponent placements in real-time
  - "Your turn!" indicator when it's the current player's pick
  - Optional 30-second timer per pick (auto-assigns Pay Down Debt on timeout)
- Parallel mode: Keep existing UI (backwards compatible)
- Update `SetupScreen.tsx`: Add planning mode toggle (Sequential recommended / Quick Play)
- RevealPhase.tsx: Skip entirely in sequential mode

#### Files touched
- `src/types/index.ts` (PlanningMode, RoundState extensions)
- `src/state/gameStore.ts` (claimActionSlot, snake draft logic)
- `src/components/game/PlanningPhase.tsx` (major rework for sequential)
- `src/components/game/SetupScreen.tsx` (mode toggle)
- `src/components/game/RevealPhase.tsx` (conditional skip)

### Phase 3C: Quarterly Themes (Parks-style)

**Goal**: Each round has a randomized market condition that modifies actions and rewards, eliminating the "every round feels the same" problem.

#### Data model changes (`src/types/index.ts`)
```
QuarterlyTheme = {
  id: string
  name: string
  description: string
  modifiers: {
    actionCostMultipliers?: Record<ActionType, number>     // e.g., marketing: 0.5
    actionOutputMultipliers?: Record<ActionType, number>   // e.g., develop-features: 1.5
    disabledActions?: ActionType[]                         // e.g., ['monetization']
    globalIncome?: number                                  // e.g., +10
    hiringCostDelta?: number                               // e.g., -5
    engineerPoolDelta?: number                             // e.g., +2
    milestoneBonus?: number                                // e.g., +5
    ratingScoreMultiplier?: number                         // e.g., 2
    marketCorrectionChance?: number                        // e.g., 0.25
    marketCorrectionPenalty?: number                       // e.g., -20
  }
}

GameState additions:
  themeOrder: QuarterlyTheme[]    // 4 themes drawn at game start, visible to all
```

#### New data file: `src/data/quarterlyThemes.ts`
Define the 8 themes from the design doc:
1. The Startup Boom (develop +50%, no monetization, hiring -$5)
2. Market Expansion (marketing halved, partnership deal unlocks)
3. The Reckoning (server costs doubled, debt penalties +1 tier, monetization 1.5x)
4. IPO Window (IPO/Acquisition unlock, milestones +5, rating 2x scoring)
5. AI Gold Rush (research AI halved, AI +1 power, +1 debt)
6. Talent War (salaries +$5, +2 pool, guaranteed persona)
7. Regulatory Crackdown (>8K MAU pays $15, optimize doubled, rating penalties doubled)
8. Bubble Market (income +$10, marketing 2x MAU, 25% correction risk)

#### Game store changes
- `initGame()`: Shuffle theme pool, draw 4, store as `themeOrder`
- `resolveActions()`: Apply active theme modifiers (cost multipliers, output multipliers, disabled actions)
- `getAvailableActions()`: Filter by theme's disabled actions
- `endRound()`: Apply market correction if theme has one

#### UI changes
- New: `src/components/game/ThemeBar.tsx` — horizontal bar showing all 4 themes, current round highlighted
- Embed in PlanningPhase and RoundEnd
- Update PhaseGuide tips to reference active theme

#### Files touched
- `src/types/index.ts` (QuarterlyTheme, GameState.themeOrder)
- `src/data/quarterlyThemes.ts` (new, 8 themes)
- `src/state/gameStore.ts` (theme shuffle, modifiers in resolveActions)
- `src/data/actions.ts` (theme-aware getAvailableActions)
- `src/components/game/ThemeBar.tsx` (new)
- `src/components/game/PlanningPhase.tsx` (embed theme bar)
- `src/components/game/RoundEnd.tsx` (show upcoming theme)

---

## Phase 4: Depth Features

### Phase 4A: Dynamic Events with Response Choices

**Goal**: Replace passive "things happen TO you" events with choice-based responses that add player agency.

#### Changes
- Split events into Market Shifts (persist 1 round) and Crises (immediate + response)
- Add 4 response options per crisis: Invest in Recovery ($15, -50% effect), Exploit the Chaos (+500 MAU, 30% backlash risk), Hunker Down (default, free), PR Campaign ($20, convert to +1 rating)
- New: `src/types/index.ts` → `EventResponse` type, `EventType = 'market-shift' | 'crisis'`
- Modify: `src/data/events.ts` → add response options to crisis events, add market shift events
- Modify: `src/components/game/EventPhase.tsx` → response selection UI with cost/risk display
- Modify: `src/state/gameStore.ts` → `applyEvent()` accepts player responses, `selectEventResponse(playerId, responseId)`

### Phase 4B: Remaining Leader Powers (Once-per-Game Abilities)

Implement the `useLeaderPower(playerId)` action for all 18 leaders. Each is a one-time dramatic ability:

| Power | Effect | Complexity |
|---|---|---|
| blue-screen-protocol | Opponents skip Optimize Code | Low — block in assignEngineer |
| reality-distortion-field | Double all output | Medium — multiplier in resolveActions |
| meme-power | Go Viral auto-succeeds | Low — skip random check |
| prime-day | 3x monetization revenue | Low — multiplier |
| data-harvest | Steal 2 MAU Production | Medium — modify opponent state |
| moonshot-lab | 3x Research AI, no debt | Low — multiplier + skip debt |
| ipo-fast-track | Score Rev Production × 5 | Low — add to score |
| decentralize | Opponents +2 tech debt | Low — modify all opponents |
| gpu-tax | Opponents using AI pay $5 | Medium — check after all resolve |
| safety-pause | Opponents can't use AI | Medium — block in assignEngineer |
| roadmap-execution | Double Develop Features | Low — multiplier |
| binge-drop | Double Develop Features | Low — same as above |
| first-move | Claim slot before draft | Medium — special pick in sequential mode |
| acquisition-spree | Steal an engineer | High — transfer between players |
| steam-sale | Opponents lose $10 | Low — modify all opponents |
| dual-pivot | Change product + extra action | High — product change + bonus action |
| compiler-overhaul | Tech debt to zero | Low — set to 0 |
| surge-pricing | 3x monetization + rating | Low — multiplier + rating |

New store action: `useLeaderPower(playerId, targetData?)` with power-specific logic.
New UI: Power button on player dashboard, confirmation modal, target selection for targeted powers.

---

## Phase 5: Polish & Visual

### Phase 5A: Visual Company Progression

- `src/components/game/CompanyDashboard.tsx` — office level (Garage → Campus), product board (feature slots), server rack visualization
- `src/components/game/TechDebtVisualizer.tsx` — code quality meter (green → red), spaghetti code overlay at high debt
- `src/components/game/ProductionBoard.tsx` — visual track with sliding markers
- Embed in PlanningPhase and RoundEnd with progression animations

### Phase 5B: Tooltip System

- Add contextual tooltips for all game terms (MAU, Rating, Production, Power, etc.)
- Show power calculation breakdown on hover during planning
- Feasible with Tailwind + existing component structure

### Phase 5C: Final Scoring Rebalance

After all mechanics are stable:
- Run 10,000+ game simulation
- Adjust scoring weights: MAU/1000, Revenue/500, Rating×5, debt penalty curve
- Consider: production track positions as scoring bonus (reward engine-building)
- Graduated debt penalty: -3 per level above 3 instead of cliff at 7

### Phase 5D: Quick Play Mode Polish

- Ensure parallel planning mode works cleanly with all new features
- Conflict resolution: lowest MAU gets priority for contested slots
- Test with themes, sprint, and persona auctions all interacting

---

## Dependency Graph

```
Phase 2.6 (Balance Tuning)
    ↓
Phase 3A (Sprint)  ←→  Phase 3B (Sequential Draft)  ←→  Phase 3C (Themes)
    [all three are independent and can be parallelized]
    ↓
Phase 4A (Dynamic Events)  ←→  Phase 4B (Leader Powers)
    [independent, can be parallelized]
    ↓
Phase 5A-D (Polish)
    [all independent, parallelize freely]
```

## Estimated Scope per Phase

| Phase | New/Modified Files | Lines (est.) | Parallelizable |
|---|---|---|---|
| 2.6 Balance Tuning | 4 files | ~400 | No (sequential: implement, sim, tune) |
| 3A Sprint Mini-Game | 6 files | ~500 | Yes (independent of 3B/3C) |
| 3B Sequential Draft | 5 files | ~600 | Yes (independent of 3A/3C) |
| 3C Quarterly Themes | 7 files | ~400 | Yes (independent of 3A/3B) |
| 4A Dynamic Events | 4 files | ~300 | Yes (independent of 4B) |
| 4B Leader Powers | 3 files | ~400 | Yes (independent of 4A) |
| 5A Visual Progression | 4 files | ~600 | Yes |
| 5B Tooltips | 5 files | ~200 | Yes |
| 5C Final Rebalance | 3 files | ~100 | After all above |
| 5D Quick Play Polish | 3 files | ~150 | After 3B |
