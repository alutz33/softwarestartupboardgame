# Ship It! - Core Gameplay Loop Improvement Plan

## Source: GitHub Issue Feedback + Codebase Analysis

This plan synthesizes feedback from gameplay review issues (citing mechanics from Scythe, Wingspan, Arkham Horror, Ark Nova, Tokaido, Spirit Island, Quacks of Quedlinburg, and others) with a deep analysis of the current codebase.

---

## Problem Summary

The core loop (Draft → Plan → Resolve → Event × 4 rounds) has strong bones but suffers from:

1. **Calculative friction** - Too many percentage multipliers chained together
2. **Abstract growth** - No visual/tactile sense of building something
3. **Puzzle genre mismatch** - Coding puzzle alienates non-coders and idles non-participants
4. **Passive events** - Things happen TO you with no response agency
5. **Rounds feel same-y** - Rounds 1-2 are mechanically identical
6. **Weak player interaction** - Mostly parallel sandboxes with blind slot competition
7. **Flat economy** - Money doesn't compound; no engine-building satisfaction

---

## Plan Overview

### Tier 1: Core Loop Fixes (High Impact, Do First)

| # | Change | Addresses |
|---|--------|-----------|
| 1.1 | Streamline math to integer bonuses | Calculative friction |
| 1.2 | Rework puzzle into inclusive "Sprint" mini-game | Puzzle mismatch |
| 1.3 | Add visual company progression system | Abstract growth |
| 1.4 | Make planning phase sequential (draft-style) | Weak interaction |

### Tier 2: Depth & Theme (Medium Impact)

| # | Change | Addresses |
|---|--------|-----------|
| 2.1 | Tech mogul parody personas | Theme/flavor |
| 2.2 | Quarterly themes with unique modifiers | Same-y rounds |
| 2.3 | Dynamic events with player response choices | Passive events |
| 2.4 | Recurring revenue engine system | Flat economy |

### Tier 3: Polish & Balance (Lower Priority)

| # | Change | Addresses |
|---|--------|-----------|
| 3.1 | Tooltip system for terminology | Accessibility |
| 3.2 | Rebalance scoring formula | Overall balance |
| 3.3 | Add "Market Conditions" passive layer | World feel |

---

## Tier 1: Detailed Specifications

### 1.1 Streamline Math: Percentages → Integers

**Problem:** Current resolution chains 5+ multipliers:
```
output = base_productivity × AI_boost × (1 + specialty_bonus) × equity_bonus × night_owl × debt_penalty
```
This is fine for the computer to calculate but impossible for players to reason about or predict outcomes.

**Solution:** Replace percentage multipliers with flat integer bonuses using a **tag-matching system** (inspired by Ark Nova's tag accumulation).

**Current (percentage-based):**
```
Frontend engineer (0.5 base) + AI boost (×2.0) + specialty (×1.2) + trait (×1.3) = 1.56 output
→ Develop Features: +500 × 1.56 = +780 MAU
```

**Proposed (integer-based):**
```
Junior engineer: base power 2
+ AI augmented: +2 power (now 4 power)
+ Frontend on Develop Features: +1 power (now 5 power)
+ Night Owl (last action): +1 power (now 6 power)
→ Develop Features: +200 MAU per power = +1200 MAU
```

**Key changes:**
- Engineer productivity: Replace decimal (0.3, 0.5, 1.0) with integer power (1, 2, 4)
  - Intern: 1 power
  - Junior: 2 power
  - Senior: 4 power
- Specialty bonus: +1 power (primary), +0 (secondary removed for simplicity)
- AI augmentation: +2 power (flat, regardless of engineer level)
- Traits: +1 power (flat bonus when conditions met)
- Tech debt penalty: -1 power per 4 debt levels (at 4 debt: -1, at 8: -2, at 12: -3)
- Action effects scale linearly: each power point = fixed output per action

**Impact on codebase:**
- `src/data/engineers.ts`: Change `productivity: number` (decimal) → `power: number` (integer)
- `src/state/gameStore.ts`: Rewrite `resolveActions()` to sum integers instead of multiply decimals
- `src/types/index.ts`: Update `Engineer` type, remove `AI_AUGMENTATION_TABLE` percentage entries
- `src/data/actions.ts`: Change effects to "per power" scaling

**Benefits:**
- Players can mentally calculate: "I have 6 power on Develop Features, that's 1200 MAU"
- Balancing is easier (adjust one number, not a multiplication chain)
- Cards/tooltips can show "Power: 6" instead of "Output multiplier: 1.56x"

---

### 1.2 Rework Puzzle → "Sprint" Mini-Game

**Problem:** The coding puzzle (path-finding with code blocks) is:
- A completely different genre from the strategic planning game
- Alienating to non-coders
- Creates idle time for non-participants
- Skill gap means the same player wins every time (Captain Sonar problem)

**Solution:** Replace with a **"Sprint" push-your-luck mini-game** that ALL players participate in simultaneously.

**Sprint Mechanic (inspired by Quacks of Quedlinburg):**

Every player who assigned engineers to "Optimize Code" participates. But ALL players get a simpler parallel activity.

**How it works:**
1. Player draws from a bag/deck of "commit tokens" one at a time
2. Tokens are: `+1 Clean Code`, `+1 Clean Code`, `+2 Clean Code`, `Bug!`, `Bug!`, `Critical Bug!`
3. Each `Clean Code` token reduces tech debt by its value
4. Each `Bug!` token adds 1 to a "bug counter"
5. `Critical Bug!` adds 2 to the bug counter
6. **Player chooses when to stop** (push your luck)
7. If bug counter reaches **3**, your sprint "crashes" - you get nothing and +1 tech debt
8. If you stop before crashing, you keep all Clean Code tokens as debt reduction
9. **More engineers assigned = more draws** (1 eng = 5 draws max, 2 eng = 7, 3 eng = 9)
10. Engineers with Backend specialty: one free "bug revert" (ignore one Bug! token)

**Why this works:**
- Everyone understands "draw cards, push your luck, don't bust"
- No coding knowledge needed
- Tension and excitement for all players simultaneously
- More engineers = more opportunities but same risk
- Quick to resolve (30 seconds per player)
- Still rewards the Optimize Code action with meaningful choices

**Non-participants:** Players who didn't choose Optimize Code can observe and trash-talk (social element). Keep the phase short enough that it doesn't drag.

**Impact on codebase:**
- `src/data/puzzles.ts`: Replace puzzle templates with sprint token distributions
- `src/components/game/PuzzlePhase.tsx`: Complete rewrite → `SprintPhase.tsx`
- `src/components/puzzle/`: Can be removed or repurposed
- `src/state/gameStore.ts`: Replace `submitPuzzleSolution()` with `drawSprintToken()`, `stopSprint()`

---

### 1.3 Visual Company Progression System

**Problem:** Company growth is just numbers changing. No sense of building something.

**Solution:** Add a **"Server Rack" visual board** per player (digital equivalent of Scythe's dual-layer mat).

**Concept:**
Each player has a visual company dashboard showing:

1. **Office Level** (based on total engineers hired over game):
   - Garage (0-2 engineers)
   - Coworking Space (3-4 engineers)
   - Small Office (5-6 engineers)
   - Campus (7+ engineers)
   - Visual upgrade with each tier

2. **Product Board** (features shipped):
   - Grid of feature slots that "light up" as you Develop Features
   - Each feature is a small icon (Chat, Search, Dashboard, API, Mobile, etc.)
   - Hitting milestones unlocks visual badges on the board

3. **Server Rack** (infrastructure):
   - Visual rack that fills with servers as capacity grows
   - Glows red when near crash threshold
   - Turns green when well-provisioned

4. **Tech Debt Visualizer**:
   - Code quality meter (green → yellow → red)
   - At high debt: visual "spaghetti code" overlay on the product board
   - At 0 debt: sparkle effect ("Clean Code Club")

5. **Revenue Dashboard**:
   - Animated ticker showing MRR (Monthly Recurring Revenue)
   - Graph line showing trend over rounds

**Impact on codebase:**
- New component: `src/components/game/CompanyDashboard.tsx`
- New component: `src/components/game/ServerRack.tsx`
- New component: `src/components/game/ProductBoard.tsx`
- Modify: `src/components/game/PlanningPhase.tsx` - embed dashboard
- Modify: `src/components/game/RoundEnd.tsx` - show progression animations
- Add visual asset definitions to `src/data/` (feature icons, office art, etc.)

---

### 1.4 Sequential Action Drafting (Replace Blind Simultaneous Planning)

**Problem:** Simultaneous planning means slot competition is resolved by luck/speed, not strategy. No reading opponents, no bluffing, no counter-play.

**Solution:** Replace with **sequential action claiming** in snake-draft order.

**How it works:**
1. Draft order = lowest MAU picks first (existing catch-up mechanic)
2. On your turn, you **claim one action slot** by placing one engineer
3. Play passes to next player
4. Continue until all players have placed all engineers
5. Snake order: P1→P2→P3→P4→P4→P3→P2→P1→P1→... (so last-pick player gets compensating advantage)

**Why this is better:**
- You SEE what opponents are doing before you commit
- "Do I rush for Marketing before Player 2, or grab Develop Features while slots are open?"
- Creates moments of tension: "They took the last Marketing slot!"
- Blocking becomes intentional and strategic, not accidental
- Preserves the catch-up mechanic (trailing player picks first)
- Mirrors the feel of worker placement games (Agricola, Lords of Waterdeep)

**AI augmentation decision:**
- When placing an engineer, you simultaneously decide if they get AI augmentation
- This is a public decision (opponents see it), adding information to the game

**Timer per pick:**
- Optional 30-second timer per placement to keep the game moving
- Auto-assigns to "Pay Down Debt" if timer expires

**Impact on codebase:**
- `src/state/gameStore.ts`: Replace `lockPlan()` / `revealPlans()` with `claimActionSlot(playerId, engineerId, actionType, useAI)`
- `src/components/game/PlanningPhase.tsx`: Major rework - show all players' boards, highlight current picker, animate placements
- Remove: `RevealPhase.tsx` (no longer needed - actions are visible as placed)
- `src/types/index.ts`: Add `currentPickerIndex`, `pickOrder` to `RoundState`

---

## Tier 2: Detailed Specifications

### 2.1 Tech Mogul Parody Personas

**Concept:** Replace generic corporation names with parody tech mogul characters. Each persona has a name, personality, strengths/weaknesses, and a unique ability.

**Example Personas:**

| Parody Name | Based On | Personality | Strength | Weakness | Unique Power |
|---|---|---|---|---|---|
| **William Doors** | Bill Gates | Methodical, philanthropic | Software (+1 power all dev actions) | Slow to market (-1 power marketing) | **Blue Screen**: Once/game, force all opponents to lose 1 round of server uptime |
| **Steeve Careers** | Steve Jobs | Perfectionist, visionary | Design/Rating (+0.2 rating/round) | Expensive taste (all costs +$5) | **Reality Distortion**: Once/game, double marketing effect |
| **Jess Bezos** | Jeff Bezos | Relentless, data-driven | Infrastructure (+2 free server capacity/round) | Low rating start (2.5 instead of 3.0) | **Prime Day**: Once/game, convert server capacity to MAU (cap × 50) |
| **Elom Tusk** | Elon Musk | Chaotic, ambitious | Hype/MAU (+500 MAU from any action) | Volatile (random -200 to +200 MAU each round) | **Meme Power**: Once/game, Go Viral with 75% success rate instead of 50% |
| **Mark Zucker** | Mark Zuckerberg | Data-focused, growth-obsessed | User growth (MAU ×1.5) | Privacy issues (-0.3 rating start) | **Data Harvest**: Once/game, steal 10% of leading opponent's MAU |
| **Lora Page** | Larry Page | Research-driven, moonshot thinker | AI capacity (+3 starting AI) | Feature bloat (+1 debt/round) | **Moonshot**: Once/game, Research AI gives 3× normal output |
| **Susan Fry** | Susan Wojcicki / Sheryl Sandberg | Operations maven, monetization expert | Revenue (+50% monetization) | Low innovation (-1 power dev features) | **Ad Network**: Passive +$5 income per round from ad revenue |
| **Satoshi Nakamaybe** | Satoshi Nakamoto | Mysterious, decentralized | Tech debt immunity (max 5 debt) | No marketing ability (can't use Marketing action) | **Decentralize**: Once/game, all opponents gain +2 tech debt |

**Implementation approach:**
- Personas replace the current Corporation Selection (funding + tech + product)
- Each persona bundles a pre-set combination + a unique power + flavor text
- Players draft personas instead of building a corporation from 3×3×3 options
- Reduces setup complexity while adding personality
- Can still have 2 personas dealt per player (pick 1, like startup cards)

**OR** (lighter touch): Keep corporation selection as-is, but add a persona as a **fourth choice** that provides flavor + one unique ability. This preserves the strategic depth of the 3×3×3 grid while adding character.

**Impact on codebase:**
- New file: `src/data/personas.ts`
- Modify: `src/types/index.ts` - add `Persona` type
- Modify: `src/components/game/CorporationSelection.tsx` or new `PersonaDraft.tsx`
- Modify: `src/state/gameStore.ts` - integrate persona powers

---

### 2.2 Quarterly Themes

**Problem:** All 4 rounds feel mechanically identical. Only late-game action unlocks differentiate rounds 3-4.

**Solution:** Each round has a **"Market Condition"** theme that modifies available actions and rewards.

| Round | Theme | Modifier | Thematic Justification |
|---|---|---|---|
| **Q1: Launch Quarter** | "The Startup Boom" | Develop Features gives +50% output. Monetization unavailable. Hiring costs -$5. | You're building your MVP. Investors want product, not revenue. |
| **Q2: Growth Quarter** | "Market Expansion" | Marketing costs halved ($10). New action: **Partnership Deal** ($15, gain +500 MAU and +$10/round recurring). | Time to find your market fit. |
| **Q3: Scale Quarter** | "The Reckoning" | All server costs doubled. Tech debt penalties increase by 1 tier. Go Viral unlocks. Monetization gives 1.5×. | Infrastructure strain and pressure to monetize. |
| **Q4: Exit Quarter** | "IPO Window" | IPO Prep and Acquisition unlock. All milestones worth +5 bonus points. Rating matters 2× for scoring. | Final push. Every metric matters for your exit. |

**Impact on codebase:**
- New file: `src/data/quarters.ts` - define quarterly modifiers
- Modify: `src/data/actions.ts` - `getAvailableActions()` considers quarterly modifiers
- Modify: `src/state/gameStore.ts` - `resolveActions()` applies quarterly multipliers
- Modify: `src/components/game/PlanningPhase.tsx` - display current quarter theme

---

### 2.3 Dynamic Events with Response Choices

**Problem:** Events resolve automatically based on thresholds. No player agency.

**Solution:** Split events into two types and add a **response choice** after each event.

**Event Types:**

1. **Market Shifts (Passive, persist for 1 round):**
   - "AI Hype Cycle": All Research AI actions give double output next round
   - "Hiring Freeze": Engineer pool reduced by 2 next round
   - "Bull Market": All income +$10 next round
   - "Regulation Wave": Players with >10K MAU must pay $20 compliance fee

2. **Crises (Immediate, require response):**
   - Keep existing events (DDoS, Data Breach, etc.)
   - But after the event is revealed, each player picks a **response:**

| Response | Effect | Cost |
|---|---|---|
| **Invest in Recovery** | Reduce negative effects by 50% | $15 |
| **Exploit the Chaos** | Ignore event, gain +500 MAU (steal competitors' users) | Risk: 30% chance of -0.3 rating backlash |
| **Hunker Down** | Default: take the normal effect | Free |
| **PR Campaign** | Convert negative event into +0.2 rating (spin the narrative) | $20 |

**Impact on codebase:**
- Modify: `src/data/events.ts` - add `MarketShift` type, add response options to crises
- Modify: `src/types/index.ts` - `EventResponse` type
- Modify: `src/components/game/EventPhase.tsx` - add response selection UI
- Modify: `src/state/gameStore.ts` - `applyEvent()` now takes player responses

---

### 2.4 Recurring Revenue Engine

**Problem:** Economy doesn't compound. No engine-building satisfaction. Money comes and goes without growth feeling.

**Solution:** Add **Monthly Recurring Revenue (MRR)** as a persistent income stream that grows over time.

**How it works:**
- Each Monetization action now adds both one-time revenue AND +$5 MRR
- MRR pays out at the start of each round (before engineer draft)
- Server upgrades also contribute: each 5 server capacity = +$2 MRR (hosting fees)
- Some startup cards/personas grant starting MRR
- MRR is shown on the Company Dashboard as a growing line graph

**New resource:**
```typescript
resources: {
  money: number,
  mrr: number,        // NEW: pays out each round
  serverCapacity: number,
  aiCapacity: number,
  techDebt: number,
}
```

**Balance implications:**
- Starting money can be reduced since MRR provides ongoing income
- Income cap formula changes: cap applies to MAU-based income only, MRR is uncapped
- Creates meaningful early-game investment decisions: "Monetize now for MRR, or grow first?"
- Late-game MRR compounds to feel like a real business engine

**Impact on codebase:**
- Modify: `src/types/index.ts` - add `mrr` to Resources
- Modify: `src/state/gameStore.ts` - MRR payout at round start, Monetization adds MRR
- Modify: `src/data/actions.ts` - Monetization effect includes MRR gain
- Modify: `src/components/game/RoundEnd.tsx` - show MRR growth

---

## Tier 3: Brief Specifications

### 3.1 Tooltip System
- Add contextual tooltips for MAU ("Monthly Active Users - your player base"), Rating ("User satisfaction, 1-5 stars"), etc.
- Show calculated power breakdown on hover during planning
- Already feasible with existing Tailwind setup

### 3.2 Rebalance Scoring
After integer power conversion, rebalance the scoring formula:
- MAU: 1 point per 1,000 (keep)
- Revenue: 1 point per 500 (keep, but MRR changes revenue scale)
- Rating: 10 points per star (keep)
- Debt penalty: -3 points per debt level above 3 (graduated, not cliff)
- Milestone bonuses: keep but adjust values based on new action economy

### 3.3 Market Conditions (Passive Layer)
- Persistent global modifiers that change each round
- Displayed at top of screen: "Current Market: AI Boom (+1 power to Research AI for all players)"
- Separate from events - these are the economic weather
- Draw from a deck at game start so all 4 are known (full information, like Spirit Island)

---

## Implementation Priority & Sequencing

```
Phase 1 (Foundation):
  1.1 Integer power system     ← Everything else depends on this

Phase 2 (Core Loop):
  1.4 Sequential action draft  ← Biggest gameplay feel change
  1.2 Sprint mini-game         ← Can be built independently
  2.2 Quarterly themes         ← Layered on top of action system

Phase 3 (Depth):
  2.1 Parody personas          ← Flavor layer, independent
  2.3 Dynamic events           ← Builds on existing event system
  2.4 Recurring revenue        ← Economy rework

Phase 4 (Polish):
  1.3 Visual progression       ← Art/animation heavy, do last
  3.1-3.3 Balance & polish     ← After all mechanics are stable
```

---

## Open Questions for Discussion

1. **Personas vs. Corporation Builder:** Should parody personas REPLACE the 3×3×3 corporation selection, or be an additional layer on top of it? Replacing simplifies setup but reduces strategic combinations from 27 to ~8.

2. **Sprint mini-game scope:** Should non-Optimize-Code players also draw tokens (smaller pool) to stay engaged? Or keep it exclusive to Optimize Code players but make it fast enough that idle time is minimal?

3. **Sequential planning timing:** With 4 players and 3+ engineers each, sequential placement is 12+ picks per round. Is this too slow? Should we do 2 engineers per pick, or group picks?

4. **Quarterly theme flexibility:** Should quarterly themes be fixed (always same order) or drawn randomly? Fixed = more learnable; random = more replayable.

5. **Backward compatibility:** Should we preserve the simultaneous planning mode as a "Quick Play" option for players who prefer speed over interaction?

---

*Plan created from issue feedback citing: Scythe (visual progression), Ark Nova (tag bonuses), Quacks of Quedlinburg (push-your-luck), Spirit Island (telegraphed threats), Tokaido (catch-up turn order), Arkham Horror (event layering), Parks/Arks (purchasable initiative), Captain Sonar (skill-gap warning).*
