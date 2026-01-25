# Ship It! - The Software Startup Board Game

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

```
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
```

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

This phase is played **simultaneously** by all players.

### Action Space Competition (NEW!)

**Some actions have limited slots.** When you assign an engineer to a limited action, you claim a slot. Other players cannot use that action once all slots are filled!

| Action | Available Slots | Competition Level |
|--------|----------------|-------------------|
| **Marketing** | 1 | Exclusive - only ONE player can market per round! |
| **Hire Recruiter** | 1 | Exclusive - only ONE recruiter available! |
| **Upgrade Servers** | 2 | Limited |
| **Research AI** | 2 | Limited |
| **Monetization** | 2 | Limited |
| **Develop Features** | 3 | Moderate competition |
| **Optimize Code** | Unlimited | Puzzle handles competition |
| **Pay Down Debt** | Unlimited | Always available (safety valve) |

### Planning Steps
1. Assign each of your engineers to an available action space
2. Optionally add AI augmentation to any engineer (costs AI Capacity)
3. Lock your plan when ready
4. Phase ends when all players have locked their plans

**Strategy Tip:** Watch what actions other players are claiming! If Marketing is taken, you'll need another growth strategy.

---

## Phase 4: Reveal Phase

All plans are revealed simultaneously. If any player assigned an engineer to "Optimize Code," the Puzzle Phase is triggered.

---

## Phase 5: Puzzle Phase (Conditional)

**Triggered when:** Any player chose the "Optimize Code" action.

### Puzzle Overview
A visual programming mini-game where players solve a path-finding challenge using code blocks.

### Difficulty Progression

| Round | Difficulty | Time Limit | Coins | Available Blocks |
|-------|------------|------------|-------|------------------|
| 1 | Easy | 30 sec | 3-5 | Move, Loop, Collect |
| 2 | Medium | 45 sec | 5-6 | + Turn Left, Turn Right |
| 3 | Hard | 60 sec | 9 | + If (conditionals) |
| 4 | Expert | 90 sec | 6+ | + While, Function |

### Winning the Puzzle
1. **Correct solution** - All coins must be collected
2. **Efficiency** - Fewest code blocks used
3. **Speed** - Fastest time (tiebreaker)

### Puzzle Rewards (Scaled by Investment - NEW!)

The puzzle winner receives rewards based on how many engineers they assigned to Optimize Code:

| Engineers Assigned | Reward |
|-------------------|--------|
| 1 engineer | -1 Tech Debt |
| 2 engineers | -2 Tech Debt |
| 3 engineers | -3 Tech Debt + $10 bonus |

**Strategy:** Investing more engineers in Optimize Code gives you a bigger potential reward, but also means fewer engineers on other actions!

---

## Phase 6: Resolution Phase

All planned actions are now executed.

### Available Actions

| Action | Cost | Slots | Base Effect | Notes |
|--------|------|-------|-------------|-------|
| **Develop Features** | Free | 3 | +500 MAU | Scales with engineer productivity |
| **Optimize Code** | Free | - | -1 Tech Debt, +0.1 Rating | Triggers puzzle; reward scales with engineers assigned |
| **Pay Down Debt** | Free | - | -2 Tech Debt | Guaranteed effect, always available |
| **Upgrade Servers** | $10 | 2 | +5 Server Capacity | Prevents crashes during viral moments |
| **Research AI** | $15 | 2 | +2 AI Capacity | Enables future AI augmentation |
| **Marketing** | $20 | 1 | +1000 MAU, +0.1 Rating | **Exclusive!** VC-Heavy gets 1.5x |
| **Monetization** | Free | 2 | +300 Revenue, -0.1 Rating | Revenue scales with current MAU |
| **Hire Recruiter** | $25 | 1 | +2 bonus engineers next round | **Exclusive!** |

### Late-Game Actions (NEW!)

These powerful actions unlock in later rounds for high-stakes plays:

| Action | Unlocks | Cost | Slots | Effect | Risk/Reward |
|--------|---------|------|-------|--------|-------------|
| **Go Viral** | Round 3 | $15 | 1 | 50% chance: +3000 MAU, 50% chance: -1000 MAU | High risk, high reward marketing gamble |
| **IPO Prep** | Round 4 | $50 | 1 | +25 final score bonus | Converts cash directly to points |
| **Acquisition Target** | Round 4 | Free | 1 | Gain MAU × 0.002 instant score, lose 50% MAU | Trade users for guaranteed points |

**Late-Game Strategy:**
- **Go Viral:** Best when you're behind and need a big swing. The expected value is +1000 MAU.
- **IPO Prep:** Safe play if you have excess cash. $50 → 25 points is excellent conversion.
- **Acquisition Target:** Good if you have high MAU but low revenue/rating. Locks in your lead.

### Action Resolution Modifiers
Effects are modified by:
- Engineer's output multiplier (based on type and AI usage)
- Specialty bonuses (if applicable)
- Strategy bonuses (funding/tech approach modifiers)
- Product type multipliers

### Income Generation (with Catch-Up Mechanics)

At end of resolution:

| Component | Formula |
|-----------|---------|
| **Base Income** | MAU / 100 |
| **Income Cap** | Maximum of $30 + ($10 × Round Number) |
| **Underdog Bonus** | +$10 if your MAU is below median |

**Example (Round 2):**
- Player A: 8000 MAU = $80 base, but capped at $50. Final: $50
- Player B: 3000 MAU = $30 base (under cap). Below median, gets +$10. Final: $40

### Milestone Check (NEW!)

After resolving actions, check if any player achieved a milestone for the first time. See **Milestones** section.

---

## Milestones (NEW!)

Milestones are one-time achievements. **First player to achieve each milestone claims it permanently** and earns bonus points at game end.

| Milestone | Condition | Bonus Points |
|-----------|-----------|--------------|
| **First to 5K Users** | Reach 5,000 MAU | +10 |
| **Growth Hacker** | Reach 10,000 MAU | +15 |
| **Five Star Startup** | Achieve 5.0 rating | +15 |
| **Clean Code Club** | Reach 0 tech debt (after Round 1) | +10 |
| **Revenue King** | Reach $1,000 revenue | +12 |

**Total possible milestone points:** 62

### Milestone Strategy
- Milestones create tension and racing opportunities
- Sometimes it's worth sacrificing efficiency to claim a milestone before opponents
- The 5-star rating milestone is very difficult - requires Quality-Focused strategy or lucky events

---

## AI Augmentation

Using AI boosts engineer output but generates Technical Debt.

### AI Output Table

| Engineer Type | Without AI | With AI | Debt Generated |
|---------------|------------|---------|----------------|
| **Intern** | 0.3x | 0.6x | 4 |
| **Junior** | 0.5x | 1.0x | 3 |
| **Senior** | 1.0x | 1.5x | 1 |

**Note:** AI-First tech approach reduces debt generated by 50%.

---

## Technical Debt

Technical debt accumulates from AI usage and poor decisions. High debt has serious consequences.

### Debt Penalty Levels

| Debt Level | Rating Penalty | Feature Break Chance | Special Penalty |
|------------|----------------|---------------------|-----------------|
| 0-3 | None | 0% | None |
| 4-6 | -0.1 Rating | 0% | None |
| 7-9 | -0.1 Rating | 20% | None |
| 10+ | -0.2 Rating | 40% | 50% of engineers forced to Pay Down Debt |

**Tip:** The "Clean Code Club" milestone rewards getting to 0 debt!

---

## Phase 7: Event Phase

One event is drawn from the shuffled event deck each round.

### Event Forecasting (NEW!)

During the Planning Phase, you can see **next round's event** displayed in the UI. This allows you to prepare:
- See "DDoS Attack" coming? Build up server capacity this round!
- "Data Breach" incoming? Pay down tech debt to mitigate it!
- "Viral Moment" next round? Make sure your servers can handle the surge!

**Note:** The current round's event is still a surprise, but you always know what's coming NEXT round.

### Events

| Event | Effect | Mitigation Condition | Mitigated Effect |
|-------|--------|---------------------|------------------|
| **DDoS Attack** | -500 MAU, -0.3 Rating | Server Capacity > 20 | -100 MAU, -0.1 Rating |
| **Cloud Provider Outage** | Cannot use Upgrade Servers | Server Capacity > 15 | No effect |
| **Viral Moment** | +2000 MAU (may crash) | Servers can handle load | +2000 MAU, +0.2 Rating |
| **Data Breach** | -0.5 Rating, -200 Revenue | Tech Debt < 4 | -0.1 Rating, -50 Revenue |
| **Competitor Launch** | -300 MAU | Rating > 4.0 | -50 MAU |

### Viral Moment Crash
If gained MAU would exceed **Server Capacity x 100**:
- Lose 50% of new users gained
- Rating penalty: -0.5

---

## Phase 8: Round End

1. View current metrics and resources
2. Check milestone standings
3. Proceed to next round (or end game if Round 4 complete)
4. Engineers carry over to next round
5. Recruiter bonuses apply to next draft
6. **Draft order recalculated** (lowest MAU picks first next round)

---

## Winning the Game

### Final Scoring Formula

```
Score = (MAU / 1000)
      + (Revenue / 500) x Funding Multiplier
      + (Rating x 10)
      + Milestone Bonuses
      + Late-Game Action Bonuses (IPO Prep, Acquisition Target)
      - Debt Penalty
```

### Scoring Components

| Component | Calculation |
|-----------|-------------|
| **MAU Points** | 1 point per 1,000 users |
| **Revenue Points** | 1 point per 500 revenue (2x if Bootstrapped) |
| **Rating Points** | 10 points per rating point (max 50) |
| **Milestone Bonuses** | +10 to +15 per milestone claimed |
| **IPO Prep Bonus** | +25 points (if used in Round 4) |
| **Acquisition Bonus** | +MAU × 0.002 points (if used in Round 4) |
| **Debt Penalty** | -10 points if Tech Debt >= 7 |

### Victory
The player with the **highest score** after 4 rounds wins.

**Tiebreaker:** Most milestones claimed, then highest MAU.

---

## Special Rules & Edge Cases

### Intern Safety Net
If a player fails to win any engineers in the draft, they automatically receive a free intern (cost: minimum of $5 or available money).

### Engineer Retention
Engineers you hire stay with your company. They can be reassigned to different actions each round.

### Recruiter Bonus Stacking
If you use "Hire Recruiter" multiple times, the bonuses stack (+2 engineers per recruiter used).

### Bidding Ties
When multiple players bid the same amount, the player who submitted their bid first wins.

### Rating Limits
- Minimum Rating: 1.0
- Maximum Rating: 5.0

### Forced Debt Paydown
At debt level 10+, half of your engineers are automatically assigned to "Pay Down Debt" and cannot be freely assigned.

### Action Slot Blocking
- Once all slots for an action are claimed, other players cannot use that action
- A player with an engineer already on an action can add more engineers there
- Moving an engineer away frees up the slot for others

### Startup Veteran Trait
- If ANY of your engineers has the "Startup Veteran" trait, your entire company is protected from negative event effects
- You automatically receive the mitigated version of all events
- Does not affect positive events like Viral Moment

### AI Skeptic Trait
- Engineers with this trait CANNOT be augmented with AI, even if you have AI capacity
- They compensate with +10% base productivity
- The AI decision prompt won't appear for these engineers

### Equity-Hungry Trait
- Track how many rounds each engineer has been retained
- The +20% productivity bonus activates starting in the round where they've been with you for 2+ rounds
- Example: Hired in Round 1 → Normal in R1 and R2 → +20% bonus in R3 and R4

### Night Owl Trait
- The +30% bonus only applies to the LAST action you assign that round
- Plan your action assignment order carefully
- If you only assign one action, that engineer gets the bonus

---

## Strategy Tips

### Early Game (Rounds 1-2)
- Establish your resource engine
- **Race for early milestones** (5K MAU, Revenue King)
- Consider server infrastructure for viral moment protection
- Watch action slots - don't get locked out of Marketing!

### Mid Game (Round 3)
- Balance growth with debt management
- Leverage your chosen strategy's bonuses
- **If behind:** Use your draft advantage and underdog bonus wisely
- Push for the 10K MAU or 5-star milestones

### Late Game (Round 4)
- Optimize for final scoring
- Manage tech debt below penalty thresholds
- Consider high-risk, high-reward plays
- **Blocking opponents** from key actions can be as valuable as boosting yourself

### Catch-Up Strategy
If you're behind:
1. You pick first in the engineer draft - get the best talent!
2. You get +$10 underdog bonus per round
3. Focus on milestones opponents haven't claimed
4. Block the leader from exclusive actions (Marketing, Recruiter)

### Strategy Synergies

| Combination | Strategy |
|-------------|----------|
| VC-Heavy + Consumer App | Aggressive marketing for explosive MAU growth (claim MAU milestones!) |
| Bootstrapped + B2B SaaS | Maximize high-value revenue (4x multiplier! + Revenue King milestone) |
| AI-First + Move-Fast | High output at the cost of debt management |
| Quality-Focused + Platform | Steady growth + 5-star milestone potential |

---

## Quick Reference Card

### Turn Order
1. Draft Engineers (lowest MAU first!)
2. Plan Actions (simultaneous, limited slots!) - See next event forecast!
3. Reveal Plans
4. Solve Puzzle (if triggered) - Rewards scale with engineers!
5. Resolve Actions + Check Milestones
6. Event Phase
7. Round End

### Key Formulas
- **Income:** min(MAU/100, 30 + round×10) + underdog bonus
- **Crash Threshold:** MAU > Server Capacity x 100
- **Final Score:** (MAU/1000) + (Revenue/500 x funding mult) + (Rating x 10) + milestones + late-game bonuses - debt penalty

### Corporation Powers
| Funding | Power |
|---------|-------|
| VC-Heavy | **Pivot** - Change product type once |
| Bootstrapped | **Lean Team** - 20% hiring discount |
| Angel-Backed | **Insider Info** - +2 engineers in draft |

### Engineer Traits (~35% of engineers)
| Trait | Effect |
|-------|--------|
| AI Skeptic | No AI, but +10% productivity |
| Equity-Hungry | +$5 cost, +20% if kept 2+ rounds |
| Startup Veteran | Immune to events |
| Night Owl | +30% on last action |

### Exclusive Actions (1 slot only)
- Marketing
- Hire Recruiter
- Go Viral (Round 3+)
- IPO Prep (Round 4)
- Acquisition Target (Round 4)

### Late-Game Actions
| Action | Round | Effect |
|--------|-------|--------|
| Go Viral | 3+ | 50/50: +3000 or -1000 MAU |
| IPO Prep | 4 | $50 → +25 score |
| Acquisition | 4 | MAU×0.002 score, lose 50% MAU |

### Puzzle Rewards (by engineers assigned)
- 1 eng: -1 debt
- 2 eng: -2 debt
- 3 eng: -3 debt + $10

### Milestones (First to claim wins!)
- 5K MAU (+10)
- 10K MAU (+15)
- 5.0 Rating (+15)
- 0 Debt (+10)
- $1K Revenue (+12)

### Debt Thresholds
- **Safe:** 0-3
- **Warning:** 4-6 (-0.1 Rating)
- **Danger:** 7-9 (-0.1 Rating, 20% break chance)
- **Critical:** 10+ (forced paydown)

### Income Caps by Round
- Round 1: $40 max
- Round 2: $50 max
- Round 3: $60 max
- Round 4: $70 max

---

*Ship It! - May the best startup win!*
