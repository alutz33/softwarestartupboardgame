export const gameRulesText = `# Ship It! - The Software Startup Board Game

## Complete Rules Reference

---

## Overview

**Ship It!** is a competitive strategy board game for 2-4 players where you compete to build the most successful software startup. Balance growth, revenue, and user satisfaction while managing technical debt, racing for milestones, and blocking competitors from key actions.

**Players:** 2-4
**Duration:** ~30 minutes
**Rounds:** 4

---

## Objective

Build the most valuable startup by the end of 4 rounds. Your success is measured by three key metrics:

| Metric | Description |
|--------|-------------|
| **MAU** (Monthly Active Users) | Your user base size |
| **Revenue** | Money generated from your product |
| **Rating** | User satisfaction (1.0 - 5.0 scale) |

**New:** Claim **Milestones** throughout the game for bonus points!

---

## What's New in This Edition

### Corporation Powers (NEW!)
Each funding strategy now has a **unique ability** that provides asymmetric gameplay:
- **VC-Heavy → Pivot:** Change your product type once per game
- **Bootstrapped → Lean Team:** 20% discount on all engineer hiring
- **Angel-Backed → Insider Info:** See 2 extra engineers in each draft

### Engineer Traits (NEW!)
~35% of engineers have special traits that affect gameplay:
- **AI Skeptic:** Cannot use AI, but +10% base productivity
- **Equity-Hungry:** Costs +$5, but +20% productivity if retained 2+ rounds
- **Startup Veteran:** Immune to negative event effects
- **Night Owl:** +30% productivity on last action assigned each round

### Late-Game Actions (NEW!)
New high-risk/high-reward actions unlock in later rounds:
- **Round 3:** Go Viral (risky marketing)
- **Round 4:** IPO Prep, Acquisition Target

### Event Forecasting (NEW!)
See next round's event during planning phase so you can prepare strategically!

### Scaled Puzzle Rewards (NEW!)
More engineers on Optimize Code = bigger puzzle rewards (1-3 debt reduction + bonus money)

### Action Space Competition
Some action spaces have **limited slots**. First player to claim a slot blocks others from using it that round. Plan carefully!

### Catch-Up Mechanics
- **Draft Order:** Players with lowest MAU pick first in the engineer draft
- **Income Cap:** High MAU income is capped to prevent runaway leaders
- **Underdog Bonus:** Players below median MAU receive +$10 per round

### Milestones
Race to be first to achieve key goals for permanent scoring bonuses!

---

## Game Setup

1. Select number of players (2-4)
2. Shuffle the event deck
3. Each player selects their corporation identity (see Corporation Selection)
4. Players receive starting resources based on their choices
5. Set out the 5 milestone cards (unclaimed)

---

## Game Flow

Each round follows this sequence of phases:

\`\`\`
Corporation Selection (Round 1 only)
        |
   Engineer Draft (lowest MAU picks first!)
        |
   Planning Phase (compete for action slots)
        |
   Reveal Phase
        |
   Puzzle Phase (if triggered)
        |
  Resolution Phase (check milestones!)
        |
    Event Phase
        |
    Round End
\`\`\`

---

## Phase 1: Corporation Selection (Round 1 Only)

Each player makes three strategic choices that define their startup's identity:

### Funding Strategy

| Strategy | Starting Money | Special Bonus | Equity Retained | Unique Power |
|----------|---------------|---------------|-----------------|--------------|
| **VC-Heavy** | $100 | Marketing effectiveness +50% | 40% | **Pivot** - Change product type once per game |
| **Bootstrapped** | $40 | Revenue counts 2x for scoring | 100% | **Lean Team** - 20% discount on hiring |
| **Angel-Backed** | $70 | +1 engineer capacity per round | 70% | **Insider Info** - See +2 engineers in draft |

### Corporation Powers (Detailed)

| Power | Funding Type | Effect | Usage |
|-------|--------------|--------|-------|
| **Pivot** | VC-Heavy | Change your product type (B2B ↔ Consumer ↔ Platform) mid-game. Affects all future growth multipliers. | Once per game, during Planning phase |
| **Lean Team** | Bootstrapped | All engineer hiring costs are reduced by 20%. Applied automatically to winning bids. | Passive (always active) |
| **Insider Info** | Angel-Backed | See 2 additional engineers in each draft round, giving you more options to bid on. | Passive (always active) |

### Tech Approach

| Approach | Starting AI Capacity | Starting Tech Debt | Special Bonus |
|----------|---------------------|-------------------|---------------|
| **AI-First** | 4 | 2 | AI augmentation generates 50% less debt |
| **Quality-Focused** | 1 | 0 | +0.1 rating bonus each round |
| **Move-Fast** | 2 | 3 | +200 MAU per "Develop Features" action |

### Product Type

| Product | MAU Multiplier | Revenue Multiplier | Rating Multiplier |
|---------|---------------|-------------------|-------------------|
| **B2B SaaS** | 0.5x | 2.0x | 0.8x |
| **Consumer App** | 2.0x | 0.5x | 1.2x |
| **Platform Play** | 1.0x | 1.0x | 1.0x |

---

## Phase 2: Engineer Draft

Engineers are the workers you'll assign to actions. Each round features a sealed-bid auction.

### Catch-Up Draft Order
**Players with the lowest MAU pick first!** This gives trailing players a chance to catch up by securing the best engineers.

Draft order is recalculated at the start of each round based on current MAU standings.

### Engineer Pool
- Pool size = Number of Players + 1 + Recruiter Bonuses
- Engineers are randomly generated with varying skills
- Later rounds feature more senior engineers (30% seniors in Round 1 -> 60% in Round 4)

### Engineer Types

| Type | Base Productivity | Typical Salary |
|------|-------------------|----------------|
| **Senior** | 1.0x | ~$30 |
| **Junior** | 0.5x | ~$15 |
| **Intern** | 0.3x | ~$5 |

### Engineer Specialties

| Specialty | Primary Bonus | Secondary Bonus |
|-----------|---------------|-----------------|
| **Frontend** | +20% Develop Features | +10% Marketing |
| **Backend** | +20% Optimize Code | +10% Server Upgrades |
| **Fullstack** | +10% Develop Features | +10% Optimize Code |
| **DevOps** | +30% Upgrade Servers | +10% Research AI |
| **AI** | +30% Research AI | +10% Optimize Code |

### Engineer Traits (NEW!)

Approximately 35% of engineers have a unique trait that provides special abilities:

| Trait | Effect | Strategy Tips |
|-------|--------|---------------|
| **AI Skeptic** | Cannot use AI augmentation, but has +10% base productivity | Best for quality-focused strategies; no AI debt risk |
| **Equity-Hungry** | Costs +$5 to hire, but gains +20% productivity if retained for 2+ rounds | Hire early for maximum value; great long-term investment |
| **Startup Veteran** | Immune to negative event effects | Protects against DDoS, breaches, competitor launches |
| **Night Owl** | +30% productivity on the last action assigned each round | Assign to your most important action last! |

**Trait Strategy:**
- **AI Skeptic:** Ideal for players avoiding tech debt. They produce more without needing AI.
- **Equity-Hungry:** Plan to keep them! Round 1 hires get the bonus in Rounds 3-4.
- **Startup Veteran:** Insurance against bad events. One veteran protects your whole company.
- **Night Owl:** Order your action assignments carefully - save them for last!

### Bidding Rules
1. All players simultaneously submit sealed bids for each engineer
2. Engineers are awarded to highest bidder (earliest bid wins ties)
3. Money is deducted from winning player's budget
4. Every player is guaranteed at least one engineer (intern safety net)

---

## Phase 3: Planning Phase

In this phase, players assign their engineers to action spaces. Each action has an effect on your company's metrics.

### Available Actions

| Action | Effect |
|--------|--------|
| **Develop Features** | +MAU (depends on product type & engineering strength) |
| **Marketing Push** | +MAU (marketing multiplier applies) |
| **Monetize Users** | +Revenue (depends on user base & product type) |
| **Optimize Code** | -Tech Debt (triggers puzzle phase if 2+ engineers) |
| **Upgrade Servers** | +Revenue & MAU (scales with DevOps talent) |
| **Research AI** | +AI capacity, improves productivity |

### Action Slots
Some actions have limited slots. Players who assign first block others.

---

## Phase 4: Reveal Phase

Players reveal their assigned engineers. Resolve action priorities based on slots and engineer power.

---

## Phase 5: Puzzle Phase

Triggered when Optimize Code has 2+ engineers. Solve the puzzle to reduce technical debt.

### Puzzle Rewards
- Base reward: -1 tech debt
- +1 extra per additional engineer (max 3)
- Bonus money for perfect clear

---

## Phase 6: Resolution Phase

Apply the effects of all actions. Update MAU, Revenue, Rating, Tech Debt, AI Capacity, etc.

### Milestone Check
After resolution, check for milestone achievements. First player to reach them claims the bonus.

---

## Phase 7: Event Phase

Draw an event card and apply its effect to all players.

Events can be positive (viral boost) or negative (security breach, PR crisis).

---

## Phase 8: Round End

Each round ends with:
- Income from Revenue (capped if MAU too high)
- Rating adjustments
- MAU decay (if applicable)
- Refresh action slots
- Draft order recalculation

---

## End of Game Scoring

After Round 4, calculate your total startup value:

**Final Score =**
(MAU / 100) + Revenue + (Rating × 10) + Milestones + Equity Retained Bonus

### Equity Retained Bonus
More equity retained increases your final score multiplier.

---

## Milestones

The first player to achieve any milestone claims its bonus. Each can only be claimed once.

| Milestone | Requirement | Bonus |
|-----------|------------|-------|
| **10K Users** | Reach 10,000 MAU | +5 points |
| **$100 Revenue** | Reach $100 revenue | +5 points |
| **5-Star App** | Reach 5.0 rating | +5 points |
| **Zero Debt** | Tech debt reduced to 0 | +5 points |
| **AI Mastery** | Reach AI capacity 8 | +5 points |

---

## Special Rules & Clarifications

- **AI Augmentation:** If AI is used on actions, it increases productivity but adds tech debt (unless AI-First).
- **Tech Debt Penalty:** Every point of tech debt reduces productivity by 5%.
- **Rating Cap:** Rating cannot exceed 5.0 or fall below 1.0.
- **MAU Floor:** MAU cannot fall below 0.
- **Revenue Floor:** Revenue cannot fall below 0.
- **Puzzle Phase:** Only triggers if 2+ engineers are assigned to Optimize Code.

---

## Optional House Rules

Want a longer game? Try 6 rounds instead of 4.
Want more chaos? Shuffle 2 event cards per round and resolve both.
Want more strategy? Allow milestone stealing if another player surpasses within 1 round.

---

## Quick Start Summary

1. Pick corporation identity (Round 1 only)
2. Draft engineers (lowest MAU goes first)
3. Assign engineers to actions
4. Reveal + resolve actions
5. Check milestones + apply event
6. End round and update income
7. Repeat for 4 rounds

`;
