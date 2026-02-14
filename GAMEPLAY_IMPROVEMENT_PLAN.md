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

**JENSEN WATTSON**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Supreme Leather Jacket Officer" | "Senior GPU Infrastructure Engineer" |
| **Flavor** | *"The more GPUs you buy, the more money you save. Trust me."* | *"Will solve any problem by throwing more parallel cores at it"* |
| **Starting Bonus** | +2 AI Capacity, +1 Rev Production, +$20 money | — |
| **Product Lock** | Must start as Platform or B2B SaaS | — |
| **Power (once/game)** | **GPU Tax**: All opponents who use AI augmentation this round must pay you $5 each | — |
| **Passive** | Research AI gives +1 extra AI Capacity | +2 power on Research AI; when any player uses AI augmentation, you gain +$2 (royalties) |
| **Specialty** | — | AI |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Parallel Processor"*: When assigned to Research AI, also gives +1 server capacity (GPU clusters need infrastructure) |

**SAM CHATMAN**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Chief Alignment Officer" | "Senior AI Safety Researcher" |
| **Flavor** | *"This could end humanity. Anyway, that'll be $20/month."* | *"Writes safety papers during standup meetings"* |
| **Starting Bonus** | +3 AI Capacity, Start Rating 6 | — |
| **Product Lock** | Must start as Platform | — |
| **Power (once/game)** | **Safety Pause**: All opponents cannot use AI augmentation this round (you still can) | — |
| **Passive** | AI augmentation generates zero debt for your engineers, BUT -1 Rating every round you use AI (public trust erosion) | When assigned to Research AI, also reduces tech debt by 1 (safe AI development) |
| **Specialty** | — | AI |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Alignment Researcher"*: +2 power on Research AI, but if you have more than 6 AI Capacity, -1 power on all other actions (existential dread) |

**SILICA SU**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "CEO & Chief Engineer" | "Senior Chip Architect" |
| **Flavor** | *"Our roadmap said we'd ship it. So we shipped it. Revolutionary concept."* | *"Optimizes everything. Including the office coffee schedule."* |
| **Starting Bonus** | +1 MAU Production, engineers cost -$5 to hire | — |
| **Product Lock** | Must start as B2B SaaS | — |
| **Power (once/game)** | **Roadmap Execution**: Double the output of all Develop Features actions this round | — |
| **Passive** | All engineer hiring costs -$5 (efficiency culture) | +1 power on any action, but only if you have fewer total engineers than the player with the most (underdog bonus) |
| **Specialty** | — | Fullstack |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Process Optimizer"*: When assigned to Develop Features, also gives +1 Rev Production (shipping = revenue) |

**BINGE HASTINGS**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Chief Content Officer" | "Senior Recommendation Algorithm Engineer" |
| **Flavor** | *"Sleep is our greatest competitor. And we are winning."* | *"The algorithm knows what you want before you do"* |
| **Starting Bonus** | +1 MAU Production, +1 Rev Production | — |
| **Product Lock** | Must start as Consumer App | — |
| **Power (once/game)** | **Binge Drop**: All Develop Features output this round is doubled (content dump strategy) | — |
| **Passive** | +1 Revenue Production at end of every round where Rating is 6+ (subscribers stay if quality stays) | +1 power on Monetization; Monetization does NOT reduce Rating (no ad backlash) |
| **Specialty** | — | Backend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Content Algorithm"*: When assigned to Marketing, also gives +1 MAU Production (recommendation engine) |

**WHITNEY BUZZ HERD**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Founder & Chief Impact Officer" | "Senior Community Safety Engineer" |
| **Flavor** | *"We didn't disrupt dating. We made it civilized. You're welcome."* | *"Has banned more trolls than you've had hot dinners"* |
| **Starting Bonus** | Start Rating 7, +1 MAU Production | — |
| **Product Lock** | Must start as Consumer App | — |
| **Power (once/game)** | **First Move**: Claim any one action slot before the normal draft order this round (priority override) | — |
| **Passive** | Rating can never drop below 4 from events (trust & safety shield); Marketing gives +1 Rating bonus | +1 power on Marketing; Marketing gives +500 MAU bonus (word-of-mouth) |
| **Specialty** | — | Frontend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Community Manager"*: When assigned to any action, your Rating cannot decrease this round from that action's effects |

**MARC CLOUDOFF**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Founder & Chief Hawaiian Shirt Officer" | "Senior Enterprise Sales Engineer" |
| **Flavor** | *"Why would anyone install software when they could pay me monthly? Forever?"* | *"Can close a six-figure deal over a lunch meeting"* |
| **Starting Bonus** | +2 Rev Production, +$20 money | — |
| **Product Lock** | Must start as B2B SaaS | — |
| **Power (once/game)** | **Acquisition Spree**: Steal one hired engineer from any opponent by paying their salary + $10 | — |
| **Passive** | Monetization gives +1 Revenue Production (instead of flat revenue) — revenue compounds every round | +2 power on Monetization when product type is B2B SaaS |
| **Specialty** | — | Backend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Enterprise Sales"*: When assigned to Monetization, also gives +$5 flat bonus (upselling) |

**GABE NEWDEAL**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "President & Flat Hierarchy Philosopher" | "Senior Platform Architect" |
| **Flavor** | *"We will absolutely make a third version. Just not in your lifetime."* | *"Works on whatever they want. Currently: hats."* |
| **Starting Bonus** | +$30 money, +1 all production tracks | — |
| **Product Lock** | Must start as Platform | — |
| **Power (once/game)** | **Steam Sale**: All opponents lose $10 (their users spent it on your platform). You gain $5 per opponent. | — |
| **Passive** | Earn +$3 for every other player who uses Develop Features each round (platform cut / marketplace tax) | +1 power on ANY action (generalist), but you cannot assign this engineer to the same action as another engineer (flat hierarchy) |
| **Specialty** | — | Fullstack |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Flat Hierarchy"*: When this engineer is your only engineer on an action, +2 power bonus (works best alone) |

**JACK BLOCKSEY**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "CEO × 2" | "Senior Protocol Engineer" |
| **Flavor** | *"I simplified my life to one meal, one social network, and 280 characters."* | *"Fasts on Tuesdays. Deploys on Fridays."* |
| **Starting Bonus** | +1 MAU Production, +1 Rev Production | — |
| **Product Lock** | Must start as Consumer App or Platform | — |
| **Power (once/game)** | **Dual Pivot**: Change your product type AND immediately take one extra action this round | — |
| **Passive** | May assign engineers to TWO different exclusive (1-slot) actions in the same round (running two companies) | +1 power on Monetization and Optimize Code, but cannot be AI-augmented (decentralization philosophy) |
| **Specialty** | — | Fullstack |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Protocol Purist"*: +1 power on Pay Down Debt; immune to tech debt from events (protocol is solid) |

**GRACE DEBUGGER**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Rear Admiral & Chief Compiler" | "Senior Systems Architect" |
| **Flavor** | *"The most dangerous phrase is: 'We've always done it this way.' Also, there's a moth in your mainframe."* | *"Wrote the first compiler. What did you do today?"* |
| **Starting Bonus** | Start with 0 tech debt (regardless of other choices), Start Rating 6 | — |
| **Product Lock** | Must start as B2B SaaS or Platform | — |
| **Power (once/game)** | **Compiler Overhaul**: Immediately reduce your tech debt to zero, regardless of current level | — |
| **Passive** | Optimize Code gives double output (+2 rating instead of +1) | +2 power on Optimize Code and Pay Down Debt; immune to forced debt paydown rolls |
| **Specialty** | — | Backend |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Admiral's Discipline"*: When assigned to any action, that action generates 0 tech debt (even with AI augmentation) |

**BRIAN SPARE-KEY**

| | Leader Side (CEO) | Engineer Side (Hire) |
|---|---|---|
| **Title** | "Co-Founder & Chief Belonging Officer" | "Senior Marketplace Engineer" |
| **Flavor** | *"We sold cereal boxes to fund our startup. Your Series A pitch is adorable."* | *"Can turn any spare room into a revenue stream"* |
| **Starting Bonus** | +2 MAU Production, +$10 money | — |
| **Product Lock** | Must start as Platform | — |
| **Power (once/game)** | **Surge Pricing**: Monetization gives 3× revenue this round AND +1 Rating | — |
| **Passive** | Every time any opponent gains MAU from Marketing or Go Viral, you also gain +200 MAU (network effect) | Immune to negative events; when a negative event hits, this engineer's assigned action gets +2 power (thriving in crisis) |
| **Specialty** | — | DevOps |
| **Level** | — | Senior (4 power) |
| **Trait** | — | *"Resilience Architect"*: +1 power on Upgrade Servers; when a negative event occurs, gain +1 server capacity (builds for the worst) |

---

#### Full Roster Summary (18 Persona Cards)

| # | Persona | Product Lock | Primary Identity |
|---|---|---|---|
| 1 | William Doors | B2B / Platform | Enterprise software, generalist power |
| 2 | Steeve Careers | Consumer App | Design perfectionist, rating engine |
| 3 | Elom Tusk | Any | AI hype, volatile growth |
| 4 | Jess Bezos | Platform / B2B | Infrastructure, server empire |
| 5 | Mark Zucker | Consumer / Platform | User growth, network effects |
| 6 | Lora Page | Platform | AI research, moonshots |
| 7 | Susan Fry | B2B SaaS | Revenue optimization, monetization |
| 8 | Satoshi Nakamaybe | Platform | Decentralization, debt immunity |
| 9 | Jensen Wattson | Platform / B2B | AI infrastructure, GPU tax |
| 10 | Sam Chatman | Platform | AI safety vs. commercialization |
| 11 | Silica Su | B2B SaaS | Underdog efficiency, lean teams |
| 12 | Binge Hastings | Consumer App | Subscription revenue, content |
| 13 | Whitney Buzz Herd | Consumer App | Community safety, rating protection |
| 14 | Marc Cloudoff | B2B SaaS | Enterprise SaaS, compounding revenue |
| 15 | Gabe Newdeal | Platform | Marketplace tax, patience |
| 16 | Jack Blocksey | Consumer / Platform | Dual-focus, multitasking |
| 17 | Grace Debugger | B2B / Platform | Tech debt annihilation, code quality |
| 18 | Brian Spare-key | Platform | Network effects, crisis resilience |

**Product Lock Coverage:**
- **B2B SaaS** (primary): William Doors, Susan Fry, Silica Su, Marc Cloudoff
- **Consumer App** (primary): Steeve Careers, Binge Hastings, Whitney Buzz Herd
- **Platform** (primary): Lora Page, Satoshi Nakamaybe, Jensen Wattson, Sam Chatman, Gabe Newdeal, Brian Spare-key
- **Flexible**: Elom Tusk (any), Jess Bezos (Platform/B2B), Mark Zucker (Consumer/Platform), Jack Blocksey (Consumer/Platform), Grace Debugger (B2B/Platform)

---

#### Generic Engineers (Bulk of the Draft Pool)

Generic engineers still use the existing system — randomly generated with Level + Specialty + optional Trait (~35% chance). They are the workhorses of your team. Persona cards are the exciting premium picks that trigger a mini-auction when they appear.

| Component | Generic Engineers | Persona Engineers |
|---|---|---|
| **Names** | Procedural ("Alex B.", "Jordan K.") | Named characters ("Lora Page", "Elom Tusk") |
| **Levels** | Intern (1 power), Junior (2), Senior (4) | All Senior (4 power) — they're premium |
| **Specialty** | Random from 5 types | Fixed, thematic to character |
| **Traits** | ~35% chance of generic trait (AI Skeptic, Night Owl, etc.) | Always have a unique named trait |
| **Availability** | 3-4 per round in draft pool | 2-3 per round mixed into pool (from ~14 remaining after Leader draft) |
| **Recruitment** | **Draft pick order** (lowest MAU picks first, fast) | **Mini-auction** (players bid salary — market determines price) |

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
- **Auction drama**: When a high-synergy persona appears, bidding wars create memorable moments: "I *need* Grace Debugger to fix my debt spiral — how high will they go?"

---

#### Hybrid Auction System (Engineer Recruitment)

**Generic engineers → Draft pick order (fast):**
1. Reveal the round's generic engineer pool (3-4 cards)
2. Lowest-MAU player picks first, then next lowest, etc.
3. Pay the engineer's listed salary. Done. Quick and clean.

**Persona engineers → Mini-auction (exciting):**
1. When a persona card appears in the round's pool, it triggers an auction
2. Starting bid = $15 (base Senior salary)
3. Players bid clockwise in $5 increments. Pass = out for this auction.
4. Highest bidder hires the persona at their bid price
5. If only one player bids, they get the persona at $15 (bargain!)
6. Auction order: lowest MAU starts (catch-up advantage — they set the opening)

**Why hybrid works:**
- Generic drafting is fast (no slowdown for routine hires)
- Persona auctions are rare (2-3 per round) and exciting — they're the highlight of the draft phase
- The market naturally prices persona value — overpaying hurts your economy, sniping cheap feels great
- Creates moments of tension and table talk: "Are you really going to $35 for Grace Debugger?"
- No need for a separate premium pricing rule — the auction IS the pricing

---

#### What Gets Kept vs. What Changes

| Current System | Status |
|---|---|
| Funding Strategy (VC/Bootstrap/Angel) | **Keep** — still a meaningful starting choice |
| Tech Approach (AI-First/Quality/Move-Fast) | **Fold into Leader cards** — each Leader implies a tech identity |
| Product Type (B2B/Consumer/Platform) | **Fold into Leader cards** — Leader has a hard product lock |
| 18 Startup Cards (pre-built combos) | **Replace with 18 dual-sided persona cards** |
| Generic engineers with random traits | **Keep** — majority of draft pool, hired via pick order |
| Existing 4 traits (AI Skeptic, etc.) | **Keep for generic engineers**. Persona engineers get unique named traits instead |
| Engineer bidding | **New hybrid**: Draft pick order for generics, mini-auction for personas |

---

#### Why This Works

- **Reduces component count**: One deck of persona cards serves two purposes (Leader + premium Engineer)
- **Thematic**: Your leader was once an engineer who founded the company — now they lead a crew of misfits
- **Simplifies setup**: Pick 1 of 3 leaders instead of navigating a 3x3x3 grid
- **Adds personality throughout**: Not just turn 1 — persona engineers appear in the draft pool every round as premium picks
- **Engine-building depth** (7 Wonders model): Each persona hire adds a named trait that compounds. By round 4, your team has a distinct identity and synergy
- **Generic + Persona mix**: Generic engineers keep costs manageable and quick via draft pick order. Persona engineers create exciting mini-auction moments
- **Replayability**: With 18 persona cards and 1 per player claimed as Leader, a 4-player game puts ~14 into the engineer deck in shuffled order. Different personas surface each round, different auction dynamics each game
- **Physical production friendly**: Dual-sided cards are standard in board game manufacturing
- **Scales naturally**: 18 personas for base game, add more in expansion packs without changing any systems
- **One side per context**: Leader side shown during setup, engineer side shown during play. No flip mechanic needed — clean, contextual UI

**Impact on codebase:**
- `src/data/engineers.ts`: **Keep** generic engineer generation (Intern/Junior/Senior + random specialty + ~35% trait). Add logic to shuffle 2-3 persona cards into each round's draft pool.
- New file: `src/data/personaCards.ts`: Define 18 dual-sided persona cards with full `leaderSide` and `engineerSide` data (starting bonuses, product locks, powers, traits, flavor text)
- `src/data/corporations.ts`: Drastically simplified (see 1.5) — product locks come from Leader cards now
- `src/types/index.ts`: Add `PersonaCard` type with `leaderSide: LeaderData` and `engineerSide: PersonaEngineerData`; add `productLock` field; keep existing `Engineer` type for generics
- New component: `src/components/game/LeaderDraft.tsx` — show 3 persona cards on **Leader side only**, pick 1
- New component: `src/components/game/PersonaEngineerCard.tsx` — **Engineer side only** display with named trait, flavor text (Leader side never shown during gameplay)
- New component: `src/components/game/PersonaAuction.tsx` — mini-auction UI for persona engineer bidding ($5 increments, pass mechanic, bid tracking)
- Modify: `src/components/game/CorporationSelection.tsx` → simplified to Leader draft + Funding pick
- Modify: `src/state/gameStore.ts` — Leader power activation, product lock enforcement, hybrid draft logic (pick order for generics, auction for personas), persona trait resolution during `resolveActions()`, persona passive effects at round start/end
- New file: `src/test/leaderBalance.ts` — simulation harness to run automated games and flag win-rate outliers per leader/funding combination

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

**Non-participants get one free draw:** Players who didn't assign engineers to Optimize Code still get **1 draw** from the commit token bag. This keeps everyone engaged during the phase — you might get a free Clean Code token (+1 debt reduction), or you might draw a Bug (no effect since you can't bust with one draw). It's a tiny bonus that keeps eyes on the table without diluting the advantage of committing engineers to Optimize Code.

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

**Quick Play Mode (parallel planning):**

Preserved as an alternative for groups who prefer speed over interaction:
- All players assign engineers simultaneously (current system, blind)
- Plans are revealed at the same time; slot conflicts resolved by MAU tiebreaker (lowest MAU gets priority)
- Faster rounds but less player interaction — good for casual games, learning the rules, or impatient groups
- Toggle in game setup: "Planning Mode: Sequential (recommended) / Quick Play (parallel)"
- Both modes use the same action slot system, same resolution logic — only the assignment phase differs

**Impact on codebase:**
- `src/state/gameStore.ts`: Replace `lockPlan()` / `revealPlans()` with `claimActionSlot(playerId, engineerId, actionType, useAI)` for sequential mode; keep existing `lockPlan()` for Quick Play mode behind a `planningMode` toggle
- `src/components/game/PlanningPhase.tsx`: Major rework — show all players' boards, highlight current picker, animate placements in sequential mode; retain simultaneous UI for Quick Play mode
- Remove: `RevealPhase.tsx` (no longer needed in sequential mode — actions are visible as placed. In Quick Play, reveal still happens but uses simplified conflict resolution)
- `src/types/index.ts`: Add `currentPickerIndex`, `pickOrder` to `RoundState`; add `planningMode: 'sequential' | 'parallel'` to `GameConfig`

---

## Tier 2: Detailed Specifications

### 2.1 Quarterly Themes

**(Note: Tech Mogul Parody Personas have been folded into section 1.4 — Major Leader cards. The persona roster now lives on the leader side of dual-sided engineering cards, eliminating the need for a separate persona system.)**

**Problem:** All 4 rounds feel mechanically identical. Only late-game action unlocks differentiate rounds 3-4.

**Solution:** Each round has a **"Market Condition"** theme that modifies available actions and rewards. Themes are **randomized** each game (inspired by Parks, where trail sites are shuffled each playthrough), so players can't memorize a fixed "Round 2 always has cheap Marketing" pattern.

**Theme Pool (draw 4 at game start, assign randomly to Rounds 1-4):**

| Theme | Modifier | Thematic Justification |
|---|---|---|
| **"The Startup Boom"** | Develop Features gives +50% output. Monetization unavailable. Hiring costs -$5. | Building your MVP. Investors want product, not revenue. |
| **"Market Expansion"** | Marketing costs halved ($10). New action: **Partnership Deal** ($15, gain +500 MAU and +$10/round recurring). | Time to find your market fit. |
| **"The Reckoning"** | All server costs doubled. Tech debt penalties increase by 1 tier. Go Viral unlocks. Monetization gives 1.5×. | Infrastructure strain and pressure to monetize. |
| **"IPO Window"** | IPO Prep and Acquisition unlock. All milestones worth +5 bonus points. Rating matters 2× for scoring. | Final push. Every metric matters for your exit. |
| **"AI Gold Rush"** | Research AI costs halved. AI augmentation gives +1 extra power. But +1 tech debt on all AI actions. | The hype cycle is real. |
| **"Talent War"** | All engineer salaries +$5. But draft pool has +2 extra engineers to choose from. Persona engineers appear guaranteed. | Competition for talent heats up. |
| **"Regulatory Crackdown"** | Players with >8K MAU must pay $15 compliance fee. Optimize Code gives double output. Rating penalties are doubled. | Government notices your industry. |
| **"Bubble Market"** | All income +$10. Marketing gives 2× MAU. But end-of-round: 25% chance of market correction (-$20 all players). | Easy money... while it lasts. |

**How randomization works (Parks model):**
1. At game start, shuffle the theme deck and deal 4 themes face-up
2. All players can see all 4 themes for the entire game (full information)
3. Themes are assigned to rounds in the order dealt: Theme 1 → Round 1, Theme 2 → Round 2, etc.
4. Players can plan ahead knowing what's coming — the strategy is in adapting to *this game's* specific theme order
5. Some themes are harder in early rounds, easier in late rounds (and vice versa) — the randomization creates different strategic landscapes each game

**Late-game action unlocks** (IPO Prep, Acquisition, Go Viral) are still round-gated as before — they unlock at their designated round regardless of which theme is active. If "IPO Window" theme lands on Round 2, the milestone scoring bonus applies but IPO Prep itself isn't available until Round 4.

**Impact on codebase:**
- New file: `src/data/quarters.ts` - define theme pool (8+ themes), shuffle logic
- Modify: `src/data/actions.ts` - `getAvailableActions()` considers active theme modifiers
- Modify: `src/state/gameStore.ts` - shuffle themes at game start, store in `gameState.themeOrder`; `resolveActions()` applies theme modifiers
- Modify: `src/components/game/PlanningPhase.tsx` - display all 4 themes with current round highlighted

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
  1.4 Dual-sided engineering cards  ← Leader/engineer card design (18 persona roster)
  1.5 Simplified corporations      ← Leader + Funding only (depends on 1.4)

Phase 2.5 (Balance Validation):
  Leader balance test harness       ← Simulate 1000s of games, flag win-rate outliers
  Persona engineer auction tuning   ← Test auction pacing with different pool sizes

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

### Resolved

1. **~~Personas vs. Corporation Builder~~** → RESOLVED: Leaders are on dual-sided engineering cards (1.4). Corporations simplified to Leader + Funding (1.5). The 3×3×3 grid is eliminated. Strategic depth comes from the Leader roster (8 leaders × 3 funding types = 24 combinations, each with distinct identity).

2. **~~Production track granularity~~** → ACCEPTED: Current ranges (MAU: 0-20, Revenue: 0-15, Rating: 1-10) are fine for a 4-round game. Will revisit during playtesting if movement feels too coarse or too fiddly.

3. **~~Sprint mini-game scope~~** → RESOLVED: Non-participants get **1 free draw** from the commit token bag. Keeps everyone engaged without diluting the Optimize Code action's value. Updated in section 1.6.

4. **~~Sequential planning timing~~** → ACCEPTED: 12+ picks per round is fine — it's the core interaction loop and creates the tension the game needs. Quick Play (parallel) mode available for groups who want speed. The bigger unresolved question is the engineer *auction* system (see #7 below).

5. **~~Quarterly theme flexibility~~** → RESOLVED: **Randomized** each game, Parks-style. Shuffle theme deck at start, deal 4 face-up so all themes are visible (full information). Players adapt to this game's specific theme order. Updated in section 2.1 with an expanded pool of 8 themes.

6. **~~Backward compatibility~~** → RESOLVED: **Yes**, keep Quick Play mode. Parallel simultaneous planning with MAU-based tiebreaker for slot conflicts. Toggle in game setup. Updated in section 1.8.

### Open

7. **~~Engineer auction/bidding system~~** → RESOLVED: **Hybrid (Option D)**. Generic engineers use draft pick order (lowest MAU picks first — fast, no fuss). Persona engineers trigger a **mini-auction** when they appear in the draft pool. This makes persona hires feel special and creates exciting bidding wars over premium talent. The auction also naturally solves the persona pricing question (#11) — the market determines the price.

8. **~~Leader card balance~~** → RESOLVED: Will build a **simulation test harness** to validate leader balance before playtesting. The harness will run thousands of simulated games with different leader/funding combinations and flag statistical outliers in win rates. Added to implementation sequencing as Phase 2.5.

9. **~~Physical vs. digital card design~~** → RESOLVED: Show **one side only based on context**. Leader side is displayed during game setup (Leader Draft). Engineer side is displayed during gameplay (engineer recruitment and action assignment). No flip mechanic needed — the game state determines which side is relevant. Simpler UI, no modal or tab switching.

10. **~~Persona card distribution~~** → RESOLVED: **Expand the roster to 18 persona cards** (from 8). With 18 total and 1 per player claimed as Leader, a 4-player game puts 14 persona cards into the engineer deck. At 2-3 persona appearances per round, that's 8-12 over the game — enough that they feel like a regular exciting part of drafting without overwhelming generics. Larger roster also creates expansion potential (sell persona packs). See expanded roster below.

11. **~~Persona engineer pricing~~** → RESOLVED: The **hybrid auction** (#7) solves this. Persona engineers don't have a fixed premium price — players bid what they're willing to pay. Market determines value. Overpaying for a persona hurts your economy; sniping one cheap feels great. No separate pricing rule needed.

12. **~~Product lock flexibility~~** → RESOLVED: **Hard locks**. In a 4-round game, every decision needs to be streamlined. Product locks make leader identity matter ("I AM a B2B company because I picked William Doors") and reduce setup choices. The expanded roster (18 leaders) ensures every product type has good coverage.

---

*Plan created from issue feedback citing: Terraforming Mars (production tracks, corporation identity), 7 Wonders (incremental engine-building via card drafting, Leaders expansion), Gloomhaven/Arkham Horror (named characters with unique abilities leading your party), Scythe (visual progression), Ark Nova (tag bonuses), Quacks of Quedlinburg (push-your-luck), Spirit Island (telegraphed threats), Tokaido (catch-up turn order), Arkham Horror (event layering), Parks (randomized trail tiles, purchasable initiative), Captain Sonar (skill-gap warning).*
