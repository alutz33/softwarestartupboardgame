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
| 1.2 | Mars-style resource production tracking | Calculative friction, abstract growth |
| 1.3 | Integer rating system (1-10 scale, no decimals) | Calculative friction |
| 1.4 | Dual-sided engineering cards (Leader / Minor Engineers) | Theme, setup complexity |
| 1.5 | Simplified corporation selection (Leader + Funding Type) | Setup complexity, decision paralysis |
| 1.6 | Rework puzzle into inclusive "Sprint" mini-game | Puzzle mismatch |
| 1.7 | Add visual company progression system | Abstract growth |
| 1.8 | Make planning phase sequential (draft-style) | Weak interaction |

### Tier 2: Depth & Theme (Medium Impact)

| # | Change | Addresses |
|---|--------|-----------|
| 2.1 | Quarterly themes with unique modifiers | Same-y rounds |
| 2.2 | Dynamic events with player response choices | Passive events |
| 2.3 | Recurring revenue engine system | Flat economy |

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

### 1.2 Mars-Style Resource Production Tracking

**Inspiration:** Terraforming Mars uses a simple, elegant production tracking system. Each resource (MegaCredits, Steel, Titanium, Plants, Energy, Heat) has a **production track** — a single token that slides up and down a numbered track. At the start of each generation, you produce resources equal to your production value. No multiplication chains, no formulas to remember. You just look at where your token sits.

**Problem:** Our current system calculates MAU, revenue, and rating through complex formulas involving chained multipliers (corporation type × action effects × engineer productivity × tech debt penalty). Players can't predict outcomes or plan strategically because the math is opaque.

**Solution:** Adopt a Terraforming Mars-style **production track** for each key metric. Each player has three production markers that move up and down a track:

**Production Tracks:**

| Track | Range | Produces | How It Moves |
|---|---|---|---|
| **MAU Production** | 0-20 | +N × 200 MAU per round | Develop Features: +1, Marketing: +2, Go Viral: +3 on success |
| **Revenue Production** | 0-15 | +N × $5 income per round | Monetization: +1, Partnership: +1, MRR from server infra: automatic |
| **Rating Track** | 1-10 | Final scoring (10 pts per point) | Optimize Code: +1, Monetization: -1, Events: varies |

**How it works in play:**
1. At the start of each round, each player **produces** resources equal to their production marker positions
2. Actions during the round **move the markers** up or down by fixed integer amounts
3. Players can see at a glance: "My MAU production is at 6, so I'll gain 1,200 MAU next round"
4. No hidden multipliers, no chained calculations — just move the token

**Example round flow:**
```
Start of Round 2:
  MAU Production marker at: 4  → Gain +800 MAU
  Revenue Production at: 2     → Gain +$10
  Rating at: 6                 → (scoring only, no production)

During Round 2:
  Assign engineer to Develop Features → MAU Production moves 4 → 5
  Assign engineer to Monetization     → Revenue Production moves 2 → 3, Rating moves 6 → 5

Start of Round 3:
  MAU Production marker at: 5  → Gain +1,000 MAU
  Revenue Production at: 3     → Gain +$15
```

**Corporation type determines starting production values:**
Instead of complex multipliers, each corporation/funding type simply starts with different production marker positions (see section 1.5).

**Tech debt affects production:**
- At 4+ debt: -1 to MAU production (marker slides down)
- At 8+ debt: -1 to Revenue production as well
- At 12+ debt: -1 to Rating as well
- These penalties are applied/removed dynamically as debt changes, moving the markers

**Why this works:**
- **Tangible**: Players physically move a token — they SEE their engine growing
- **Predictable**: "My production is 5, I'll gain 1,000 MAU" — no calculator needed
- **Proven**: Terraforming Mars is one of the most successful strategy games ever, and this system is a core reason why
- **Engine-building satisfaction**: Watching your production markers climb creates the compounding growth feeling currently missing
- **Replaces MRR subsystem**: The revenue production track IS the recurring revenue engine (eliminates need for separate 2.4 MRR system)

**Impact on codebase:**
- `src/types/index.ts`: Add `ProductionTrack` type with `mauProduction`, `revenueProduction` fields; Rating becomes integer
- `src/state/gameStore.ts`: Add `produceResources()` at round start; `resolveActions()` modifies production markers instead of direct resource values
- `src/data/actions.ts`: Change action effects to production marker deltas (e.g., `mauProductionDelta: +1`)
- `src/data/corporations.ts`: Replace multipliers with starting production positions
- New component: `src/components/game/ProductionBoard.tsx` — visual track display per player

---

### 1.3 Integer Rating System (No Decimals)

**Problem:** The current rating system uses a 1.0-5.0 decimal scale with +0.1/-0.1 increments. This creates several issues:
- Decimal math is harder to reason about mentally
- "+0.1 rating" feels insignificant and unsatisfying
- 50 discrete steps (1.0 to 5.0 in 0.1 increments) is an awkward granularity
- Doesn't align with the integer power system from 1.1

**Solution:** Replace with a **1-10 integer scale**. No decimals anywhere in the game.

**New Rating Scale:**

| Rating | Star Display | Meaning |
|---|---|---|
| 1-2 | 1 star | Terrible — users actively warn others away |
| 3-4 | 2 stars | Poor — functional but frustrating |
| 5-6 | 3 stars | Average — gets the job done |
| 7-8 | 4 stars | Good — users recommend it |
| 9-10 | 5 stars | Excellent — category leader |

**Rating changes become whole numbers:**
- Optimize Code: +1 rating
- Monetization: -1 rating
- Marketing (with good product): +1 rating
- Data Breach (unmitigated): -2 rating
- DDoS (unmitigated): -1 rating
- Competitor Launch (unmitigated): -1 rating

**Starting ratings by corporation type:**
- B2B SaaS: Start at 5 (average, business users are more forgiving)
- Consumer App: Start at 6 (slightly above average, consumer polish expected)
- Platform Play: Start at 5 (balanced)

**Scoring:** 5 points per rating point (max 50 at rating 10)

**Benefits:**
- Whole numbers are easier to track and reason about
- "+1 rating" feels meaningful and tangible
- Aligns with the integer power system
- The 1-10 scale maps naturally to "star ratings" (divide by 2)
- No fractional tokens needed for physical play

**Impact on codebase:**
- `src/types/index.ts`: `rating: number` stays but constrain to integer 1-10
- `src/data/corporations.ts`: Replace decimal rating modifiers with integers
- `src/data/actions.ts`: Replace all `+0.1`/`-0.1` with `+1`/`-1`
- `src/data/events.ts`: Replace `-0.3`, `-0.5` with `-1`, `-2`
- `src/state/gameStore.ts`: Remove decimal rounding logic, clamp to 1-10

---

### 1.4 Dual-Sided Engineering Cards (Major Leader / Minor Engineers)

**Problem:** The current system has separate concepts for corporation identity and engineers that don't connect thematically. Corporations are built from a 3x3x3 grid (27 combinations) which causes decision paralysis during setup. Engineer cards are purely mechanical with no personality.

**Solution:** Engineering cards are **dual-sided**. One side is a **Major Leader** character, the other side is a **Minor Engineer**.

**How it works:**

**At game start — Leader Draft:**
1. Deal 3 Leader cards to each player (face up, **Leader side**)
2. Each player picks 1 to be their CEO/Founder
3. Your Major Leader defines your corporation's personality, unique power, starting bonuses, and **product lock** (constrains your starting product type)
4. Remaining cards get shuffled back into the engineer deck (Leader side hidden)

**Each round — Engineer Recruitment (building your motley crew):**

The engineer draft pool each round contains **two types of cards**:

1. **Generic engineers** (the majority): Standard Intern/Junior/Senior with specialties and the existing trait system (AI Skeptic, Equity-Hungry, etc.). These are the bread-and-butter of your team.
2. **Persona engineer cards** (1-2 per round): Leftover persona cards from the Leader deck, shuffled in engineer-side-up. These are **premium hires** — they have better stats + a unique named trait. They're the exciting draft picks.

This creates a natural drafting tension: "Do I grab the cheap generic Junior DevOps, or splurge on 'Lora Page' the Senior AI Researcher with a powerful unique trait?"

Over 4 rounds, your corporation accumulates a **motley crew** — a mix of generic workhorses and standout persona characters. No two teams look the same.

**The "Motley Crew" Engine-Building Feel (inspired by 7 Wonders):**

In 7 Wonders, each card you draft gives a small, specific bonus (+1 shield, +1 science symbol, +2 coins). Individually they're minor, but they compound into a unique engine. Our persona engineers work the same way — each is a **slight engine upgrade** rather than a game-warping power. Only the Leader card has a dramatic once-per-game ability.

Example crew assembly over a game:
- **Round 1**: Generic Junior Frontend + persona card **"Satoshi Nakamaybe"** (Backend, passive: tech debt can't exceed 5)
- **Round 2**: Generic Senior DevOps + **"Lora Page"** (AI, +2 power on Research AI)
- **Round 3**: Your team is now specialized — AI research covered, infrastructure covered, debt safety net
- **Round 4**: Final piece — grab **"Susan Fry"** (Monetization expert) to cash out your engine

---

#### Detailed Persona Card Specifications

Each persona card has two fully designed sides. The **Leader side** is powerful (once/game ability, starting bonuses, product lock). The **Engineer side** is a premium hire (stronger stats and a unique named trait, but no game-warping power).

**WILLIAM DOORS**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Founder & Chairman" | "Senior Software Architect" |
| **Flavor** | *"640K ought to be enough for anybody... right?"* | *"Has opinions about operating systems"* |
| **Starting Bonus** | +$20 money, +1 Rev Production, Start Rating 7 | — |
| **Product Lock** | Must start as B2B SaaS or Platform | — |
| **Power (once/game)** | **Blue Screen Protocol**: Force all opponents to skip Optimize Code this round | — |
| **Passive** | All engineers get +1 power on Develop Features | +1 power to ALL actions (generalist) |
| **Specialty** | — | Backend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Philanthropist"*: Costs +$10 to hire, but your company gets +$5 income/round while employed |

**STEEVE CAREERS**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Chief Visionary Officer" | "Senior UX Designer" |
| **Flavor** | *"People don't know what they want until you show it to them"* | *"Will reject your mockup 47 times"* |
| **Starting Bonus** | Start Rating 8, +$10 extra cash | — |
| **Product Lock** | Must start as Consumer App | — |
| **Power (once/game)** | **Reality Distortion Field**: Double the output of ALL your engineers this round | — |
| **Passive** | +1 rating every round (perfectionist) | +1 power on Marketing actions |
| **Specialty** | — | Frontend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Perfectionist"*: Develop Features gives +1 rating but -200 MAU |

**ELOM TUSK**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Technoking" | "Senior AI/Fullstack Engineer" |
| **Flavor** | *"I'm going to put software on Mars"* | *"Sleeps at the office. Literally."* |
| **Starting Bonus** | +3 AI Capacity, +2 MAU Production | — |
| **Product Lock** | None (claims to do everything) | — |
| **Power (once/game)** | **Meme Power**: Go Viral succeeds automatically (no 50/50) | — |
| **Passive** | +500 MAU from any action (hype), but ±200 random variance each round | +2 power on Research AI, but AI Augmentation adds +1 extra debt |
| **Specialty** | — | AI |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Night Owl"* + *"Volatile"*: each round, randomly gain or lose 1 power |

**JESS BEZOS**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "CEO & Optimization Overlord" | "Senior DevOps Engineer" |
| **Flavor** | *"Your margin is my opportunity"* | *"Will automate your job. And their own."* |
| **Starting Bonus** | +10 server capacity, +1 Rev Production, Start Rating 4 | — |
| **Product Lock** | Must start as Platform or B2B SaaS | — |
| **Power (once/game)** | **Prime Day**: Monetization gives 3× revenue this round | — |
| **Passive** | +2 free server capacity each round | +1 power on Upgrade Servers and Monetization |
| **Specialty** | — | DevOps |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Optimizer"*: Pay Down Debt removes 1 extra debt when this engineer is assigned |

**MARK ZUCKER**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Chief Connectivity Officer" | "Senior Growth Engineer" |
| **Flavor** | *"Move fast and break things... especially privacy"* | *"Knows exactly how many friends you have"* |
| **Starting Bonus** | +3 MAU Production, Start Rating 4 | — |
| **Product Lock** | Must start as Consumer App or Platform | — |
| **Power (once/game)** | **Data Harvest**: Steal 2 MAU Production from the leading player | — |
| **Passive** | +500 MAU whenever any player uses Marketing (network effects) | +1 power on Develop Features and Marketing |
| **Specialty** | — | Fullstack |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Growth Hacker"*: When assigned to Marketing, also gives +1 MAU Production |

**LORA PAGE**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Co-Founder & Chief Scientist" | "Senior AI Researcher" |
| **Flavor** | *"Don't be evil. Be ambitious."* | *"Published 3 papers this sprint instead of writing code"* |
| **Starting Bonus** | +3 AI Capacity, +1 MAU Production | — |
| **Product Lock** | Must start as Platform | — |
| **Power (once/game)** | **Moonshot Lab**: Research AI gives 3× output AND no debt this round | — |
| **Passive** | AI augmentation generates 50% less debt | +2 power on Research AI, -1 power on Marketing |
| **Specialty** | — | AI |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Researcher"*: No specialty bonus on non-AI actions, but double bonus on AI actions |

**SUSAN FRY**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Chief Operating Officer" | "Senior Business Analyst" |
| **Flavor** | *"Revenue isn't a vanity metric if it's recurring"* | *"Has a spreadsheet for her spreadsheets"* |
| **Starting Bonus** | +2 Rev Production, Start Rating 6 | — |
| **Product Lock** | Must start as B2B SaaS | — |
| **Power (once/game)** | **IPO Fast-Track**: Immediately score your current Revenue Production × 5 as bonus points | — |
| **Passive** | +$5 income per round (Ad Network) | +1 power on Monetization, costs -$5 to hire (bargain) |
| **Specialty** | — | Backend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Monetizer"*: Each Monetization action gives +1 Rev Production instead of the usual amount |

**SATOSHI NAKAMAYBE**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Anonymous Founder" | "Senior Cryptography Engineer" |
| **Flavor** | *"Trust the protocol, not the corporation"* | *"Nobody knows their real name either"* |
| **Starting Bonus** | Tech debt capped at 5, +1 all production | — |
| **Product Lock** | Must start as Platform | — |
| **Power (once/game)** | **Decentralize**: All opponents gain +2 tech debt | — |
| **Passive** | Cannot use Marketing action. Immune to Data Breach events. | +1 power on Optimize Code and Research AI |
| **Specialty** | — | Backend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Decentralist"*: Tech debt from AI augmentation is halved (round down) for this engineer |

---

#### Generic Engineers (Bulk of the Draft Pool)

Generic engineers still use the existing system — randomly generated with Level + Specialty + optional Trait (~35% chance). They are the workhorses of your team. Persona cards are the exciting draft picks that appear 1-2 per round.

| Component | Generic Engineers | Persona Engineers |
|---|---|---|
| **Names** | Procedural ("Alex B.", "Jordan K.") | Named characters ("Lora Page", "Elom Tusk") |
| **Levels** | Intern (1 power), Junior (2), Senior (4) | All Senior (4 power) — they're premium |
| **Specialty** | Random from 5 types | Fixed, thematic to character |
| **Traits** | ~35% chance of generic trait (AI Skeptic, Night Owl, etc.) | Always have a unique named trait |
| **Availability** | 3-4 per round in draft pool | 1-2 per round mixed into pool |
| **Cost** | Standard salary by level | Often premium (+$5-10 hire cost) but worth it |

**Existing generic traits (kept for generic engineers):**
- AI Skeptic, Equity-Hungry, Startup Veteran, Night Owl — these stay as-is

---

#### How Perks Create Engine-Building

The persona engineer traits are designed as **small engine pieces** (7 Wonders model) that stack and combo:

- **Stacking**: Hire multiple engineers with complementary traits on the same action = compounding bonuses
- **Combos**: "Lora Page" persona (AI researcher, debt reduction) + Lora Page *leader* (AI-heavy, +1 debt/round) = neutralize your leader's weakness
- **Specialization**: Go all-in on DevOps persona hires → server infrastructure engine → crash-proof + passive revenue
- **Counterplay**: See opponents drafting AI engineers → grab "Satoshi Nakamaybe" before they do (debt halving on AI)
- **Leader synergy**: Each leader's passive creates demand for specific engineer types — Elom Tusk wants AI engineers, Jess Bezos wants DevOps engineers, etc.

---

#### What Gets Kept vs. What Changes

| Current System | Status |
|---|---|
| Funding Strategy (VC/Bootstrap/Angel) | **Keep** — still a meaningful starting choice |
| Tech Approach (AI-First/Quality/Move-Fast) | **Fold into Leader cards** — each Leader implies a tech identity |
| Product Type (B2B/Consumer/Platform) | **Fold into Leader cards** — Leader has a product lock |
| 18 Startup Cards (pre-built combos) | **Replace with ~8-10 dual-sided persona cards** |
| Generic engineers with random traits | **Keep** — they're the majority of the draft pool |
| Existing 4 traits (AI Skeptic, etc.) | **Keep for generic engineers**. Persona engineers get unique named traits instead |

---

#### Why This Works

- **Reduces component count**: One deck of persona cards serves two purposes (Leader + premium Engineer)
- **Thematic**: Your leader was once an engineer who founded the company — now they lead a crew of misfits
- **Simplifies setup**: Pick 1 of 3 leaders instead of navigating a 3x3x3 grid
- **Adds personality throughout**: Not just turn 1 — persona engineers appear in the draft pool every round as premium picks
- **Engine-building depth** (7 Wonders model): Each persona hire adds a named trait that compounds. By round 4, your team has a distinct identity and synergy
- **Generic + Persona mix**: Generic engineers keep costs manageable and decisions quick. Persona engineers are the exciting "should I splurge?" moments
- **Replayability**: With 8 persona cards and only 1 chosen as leader, 6-7 rotate through the engineer pool each game in different order
- **Physical production friendly**: Dual-sided cards are standard in board game manufacturing
- **Scales naturally**: 8 personas for base game, add more in expansions without changing any systems

**Impact on codebase:**
- `src/data/engineers.ts`: **Keep** generic engineer generation (Intern/Junior/Senior + random specialty + ~35% trait). Add logic to shuffle 1-2 persona cards into each round's draft pool.
- New file: `src/data/personaCards.ts`: Define ~8 dual-sided persona cards with full `leaderSide` and `engineerSide` data (starting bonuses, product locks, powers, traits, flavor text)
- `src/data/corporations.ts`: Drastically simplified (see 1.5) — product locks come from Leader cards now
- `src/types/index.ts`: Add `PersonaCard` type with `leaderSide: LeaderData` and `engineerSide: PersonaEngineerData`; add `productLock` field; keep existing `Engineer` type for generics
- New component: `src/components/game/LeaderDraft.tsx` — show 3 persona cards on Leader side, pick 1
- New component: `src/components/game/PersonaEngineerCard.tsx` — premium hire display with named trait, flavor text
- Modify: `src/components/game/CorporationSelection.tsx` → simplified to Leader draft + Funding pick
- Modify: `src/state/gameStore.ts` — Leader power activation, product lock enforcement, persona trait resolution during `resolveActions()`, persona passive effects at round start/end

---

### 1.5 Simplified Corporation Selection

**Problem:** The current 3×3×3 grid (Funding × Tech Approach × Product Type = 27 combinations) is overwhelming during setup. Players spend too long analyzing combinations before the game even starts. Many combinations feel samey. The tech approach and product type choices are really about identity/strategy, which is now handled by the Major Leader card (1.4).

**Solution:** Corporation selection becomes just **two choices**: your **Major Leader** (from 1.4) and your **Funding Type**.

**Setup flow (new):**
```
1. Deal 3 Leader cards to each player (Leader side up) → pick 1 as CEO/Founder
2. Return unchosen cards to engineer deck (shuffled in, Engineer side up)
3. Leader's product lock determines your product type automatically
4. Choose Funding Type: VC-Heavy, Bootstrapped, or Angel-Backed
5. Done. Start playing.
```

**Funding Types (streamlined):**

| Funding | Starting Cash | Starting Production | Special Rule |
|---|---|---|---|
| **VC-Heavy** | $100 | MAU: 0, Rev: 0, Rating: per leader | +2 Marketing power. Can pivot (change leader power target) once/game. 40% equity. |
| **Bootstrapped** | $40 | MAU: 1, Rev: 1, Rating: per leader | Revenue scores 2x at end. -20% hiring costs. 100% equity. |
| **Angel-Backed** | $70 | MAU: 0, Rev: 0, Rating: per leader | +1 engineer capacity. See +2 extra engineers during draft. 70% equity. |

**What happened to Tech Approach and Product Type?**
- **Tech Approach** (AI-First, Quality-Focused, Move-Fast): Folded into Leader cards. Lora Page IS the AI-First approach. Steeve Careers IS Quality-Focused. Elom Tusk IS Move-Fast. The leader's starting bonuses and powers encode the same strategic identity.
- **Product Type** (B2B SaaS, Consumer App, Platform Play): Folded into Leader **product locks**. Each leader constrains which product type(s) you can start as (e.g., Jess Bezos → B2B/Platform, Mark Zucker → Consumer/Platform, Steeve Careers → Consumer). The multipliers are replaced by production track starting positions.

**Why this works:**
- **Faster setup**: 2 decisions instead of 3 (and the leader pick is fun, not analytical)
- **Character-driven**: "I'm playing as Elom Tusk with VC funding" tells a story. "I chose VC-Heavy + Move-Fast + Consumer App" does not.
- **Same strategic depth**: The leader card encodes the strategic differentiation that tech approach + product type used to provide
- **Cleaner mental model**: Funding is about resources/constraints. Leader is about strategy/identity. Two orthogonal axes instead of three overlapping ones.

**Impact on codebase:**
- `src/data/corporations.ts`: Remove tech approach and product type arrays; keep funding types only
- `src/types/index.ts`: Simplify `Corporation` type — remove `techApproach`, `productType`; add `leader: LeaderCard`
- `src/components/game/CorporationSelection.tsx`: Redesign to two-step flow (Leader draft → Funding pick)
- `src/state/gameStore.ts`: Remove corporation combination logic; apply leader bonuses at game start

---

### 1.6 Rework Puzzle → "Sprint" Mini-Game

**(Unchanged from original 1.2 — renumbered)**

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

### 1.7 Visual Company Progression System

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

### 1.8 Sequential Action Drafting (Replace Blind Simultaneous Planning)

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

### 2.1 Quarterly Themes

**(Note: Tech Mogul Parody Personas have been folded into section 1.4 — Major Leader cards. The persona roster now lives on the leader side of dual-sided engineering cards, eliminating the need for a separate persona system.)**

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

### 2.2 Dynamic Events with Response Choices

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
| **Exploit the Chaos** | Ignore event, gain +500 MAU (steal competitors' users) | Risk: 30% chance of -1 rating backlash |
| **Hunker Down** | Default: take the normal effect | Free |
| **PR Campaign** | Convert negative event into +1 rating (spin the narrative) | $20 |

**Impact on codebase:**
- Modify: `src/data/events.ts` - add `MarketShift` type, add response options to crises
- Modify: `src/types/index.ts` - `EventResponse` type
- Modify: `src/components/game/EventPhase.tsx` - add response selection UI
- Modify: `src/state/gameStore.ts` - `applyEvent()` now takes player responses

---

### 2.3 Recurring Revenue Engine

**Problem:** Economy doesn't compound. No engine-building satisfaction. Money comes and goes without growth feeling.

**Status:** Largely addressed by the Mars-style Production Track system (1.2). The Revenue Production track IS the recurring revenue engine — it grows as players take Monetization actions, and pays out every round. The explicit MRR resource is no longer needed as a separate concept.

**Remaining value:** If additional engine-building depth is desired beyond the production track, consider:
- Server infrastructure contributing to Revenue Production automatically (+1 Rev Production per 10 server capacity)
- Some Leader cards granting starting Revenue Production (Susan Fry's Ad Network)
- Startup cards that boost production track movement rates

**Impact on codebase:** Mostly handled by 1.2 implementation. No separate MRR resource needed.

---

## Tier 3: Brief Specifications

### 3.1 Tooltip System
- Add contextual tooltips for MAU ("Monthly Active Users - your player base"), Rating ("User satisfaction, 1-5 stars"), etc.
- Show calculated power breakdown on hover during planning
- Already feasible with existing Tailwind setup

### 3.2 Rebalance Scoring
After integer power conversion and production tracks, rebalance the scoring formula:
- MAU: 1 point per 1,000 (keep)
- Revenue: 1 point per 500 (keep, production track changes revenue curve)
- Rating: 5 points per rating point on the 1-10 scale (max 50)
- Debt penalty: -3 points per debt level above 3 (graduated, not cliff)
- Milestone bonuses: keep but adjust values based on new action economy
- Production track positions may also factor into scoring (reward engine-building)

### 3.3 Market Conditions (Passive Layer)
- Persistent global modifiers that change each round
- Displayed at top of screen: "Current Market: AI Boom (+1 power to Research AI for all players)"
- Separate from events - these are the economic weather
- Draw from a deck at game start so all 4 are known (full information, like Spirit Island)

---

## Implementation Priority & Sequencing

```
Phase 1 (Foundation — do these together, they're deeply interconnected):
  1.1 Integer power system          ← All math depends on this
  1.2 Mars-style production tracks  ← Core resource engine, replaces multiplier chains
  1.3 Integer rating (1-10)         ← Eliminates last decimals from the game

Phase 2 (Identity & Setup):
  1.4 Dual-sided engineering cards  ← Leader/engineer card design
  1.5 Simplified corporations      ← Leader + Funding only (depends on 1.4)

Phase 3 (Core Loop):
  1.8 Sequential action draft      ← Biggest gameplay feel change
  1.6 Sprint mini-game             ← Can be built independently
  2.1 Quarterly themes             ← Layered on top of action system

Phase 4 (Depth):
  2.2 Dynamic events               ← Builds on existing event system
  2.3 Recurring revenue engine     ← Mostly handled by production tracks already

Phase 5 (Polish):
  1.7 Visual progression           ← Art/animation heavy, do last
  3.1-3.3 Balance & polish         ← After all mechanics are stable
```

---

## Open Questions for Discussion

1. **~~Personas vs. Corporation Builder~~** → RESOLVED: Leaders are on dual-sided engineering cards (1.4). Corporations simplified to Leader + Funding (1.5). The 3×3×3 grid is eliminated. Strategic depth comes from the Leader roster (8 leaders × 3 funding types = 24 combinations, each with distinct identity).

2. **Production track granularity:** Are the production track ranges (MAU: 0-20, Revenue: 0-15, Rating: 1-10) right? Too few steps means actions don't feel impactful enough. Too many means the track is fiddly. Terraforming Mars uses wide ranges (TR: 20-80+), but our game is only 4 rounds.

3. **Sprint mini-game scope:** Should non-Optimize-Code players also draw tokens (smaller pool) to stay engaged? Or keep it exclusive to Optimize Code players but make it fast enough that idle time is minimal?

4. **Sequential planning timing:** With 4 players and 3+ engineers each, sequential placement is 12+ picks per round. Is this too slow? Should we do 2 engineers per pick, or group picks?

5. **Quarterly theme flexibility:** Should quarterly themes be fixed (always same order) or drawn randomly? Fixed = more learnable; random = more replayable.

6. **Backward compatibility:** Should we preserve the simultaneous planning mode as a "Quick Play" option for players who prefer speed over interaction?

7. **Leader card balance:** With leaders encoding what used to be three separate choices (tech approach + product type + persona), each leader is doing a lot of work. Need playtesting to ensure no leader is dominant. The 8-leader roster should be expandable over time.

8. **Physical vs. digital card design:** Dual-sided cards work naturally for physical production. In the digital version, how do we represent the "flip" — show both sides in a modal? Tab interface? The leader side needs prominent display during the game since it defines your identity.

9. **Persona card distribution per round:** With 8 persona cards total and 1 claimed as Leader, 7 remain in the engineer deck. At 1-2 persona cards per round over 4 rounds, that's 4-8 persona appearances. In a 4-player game, not every player gets a persona hire every round — that's intentional scarcity (makes them exciting draft picks). But is 1-2 per round the right frequency? Too rare = forgettable. Too common = generics feel pointless.

10. **Persona engineer pricing:** All persona engineers are Senior (4 power) with a unique trait. Should they cost more to hire than generic Seniors? A premium hire cost (+$5-10) creates a meaningful "is this worth it?" decision. Or should the trait itself carry the downside (like Elom Tusk's engineer side adding extra debt)?

11. **Product lock flexibility:** Each leader has a product lock (e.g., "Must start as B2B SaaS or Platform"). Should this be a hard constraint or a soft one (e.g., "may start as anything, but gets +1 production if B2B/Platform")? Hard locks reduce combinatorics but add identity. Soft locks preserve choice at the cost of one more thing to weigh during setup.

---

*Plan created from issue feedback citing: Terraforming Mars (production tracks, corporation identity), 7 Wonders (incremental engine-building via card drafting, Leaders expansion), Gloomhaven/Arkham Horror (named characters with unique abilities leading your party), Scythe (visual progression), Ark Nova (tag bonuses), Quacks of Quedlinburg (push-your-luck), Spirit Island (telegraphed threats), Tokaido (catch-up turn order), Arkham Horror (event layering), Parks/Arks (purchasable initiative), Captain Sonar (skill-gap warning).*
