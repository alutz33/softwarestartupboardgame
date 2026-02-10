# Action Draft Redesign — Full Grid Integration

**Date:** 2026-02-10
**Status:** Approved
**Branch:** `claude/grid-redesign`

---

## Overview

Replace the current planning → reveal → resolution phase sequence with a single **Action Draft Phase** where the grid is always visible and actions resolve immediately when engineers are placed. This makes the code grid the central game mechanic rather than backend plumbing.

---

## Turn Structure

### Phase Sequence Per Quarter
1. **Setup phases** (unchanged): leader-draft → funding/corp-style selection → engineer-draft
2. **Action Draft** (NEW — replaces planning + reveal + resolution):
   - Snake draft in VP order (lowest VP goes first for catch-up)
   - Each player turn:
     1. **Free actions** (optional): Publish App, Commit Code, Use Leader Power
     2. **Place engineer** on action space → effect resolves immediately
     3. If action is interactive (develop-features = pick token, optimize-code = push-your-luck), mini-interaction happens now
   - Repeat until all engineers placed
3. **Events** (unchanged)
4. **Round End**: income, salaries, production ticks, reset per-round flags, advance quarter

### Removed Phases
- Reveal phase (actions are visible as they happen)
- Resolution phase (actions resolve immediately)
- Sprint phase as standalone (push-your-luck embedded in optimize-code)

---

## Actions & Effects by Corporation Type

### Free Actions (start of your turn, before placing engineer)
- **Publish App** (agency only): Select held app card + grid position → pattern match → score stars/VP/money → clear matched tokens
- **Commit Code** (both types): Agency removes 1 token; Product clears 3-same-color or 4-all-different → $1 + MAU production
- **Use Leader Power** (once per game): Tap leader card to activate unique ability

### Engineer Placement Actions (immediate resolution)

| Action | Effect | Agency | Product |
|---|---|---|---|
| **Develop Features** | Pick token from shared pool, place on grid | Same | Same |
| **Optimize Code** | Push-your-luck mini-game; each success = 1 grid swap | Same | Same |
| **Pay Down Debt** | Remove tokens from tech debt buffer | Same | Same |
| **Upgrade Servers** | Expand grid (4x4 → 4x5 → 5x5) | Same | Same |
| **Research AI** | Advance AI research level (0→1→2, reduces debt) | Same | Same |
| **Marketing** | — | +1 star bonus on next published app | Advance MAU production track |
| **Monetization** | — | $1 per total star across published apps | +$1/round recurring per committed code |

---

## Scoring

### Agency Corporation
- **Primary**: VP from published app stars
- **Secondary**: Money conversion at game end (1 VP per $X remaining)

### Product Corporation
- **Primary**: VP from MAU milestones + committed code count
- **Secondary**: Money conversion at game end (1 VP per $X remaining)

### MAU Milestones (Product only, thresholds tunable)
```
{ threshold: 1000, vp: 1 }
{ threshold: 2500, vp: 2 }
{ threshold: 5000, vp: 3 }
{ threshold: 10000, vp: 5 }
```

---

## Data Model Changes

### New Player Fields
- `marketingStarBonus: number` — +1 star bonus from marketing (agency), consumed on publish
- `committedCodeCount: number` — total successful commit-code actions (product scoring)
- `recurringRevenue: number` — $1/round per committed code (product), applied at round end
- `mauMilestonesClaimed: string[]` — which MAU milestones scored (product)

### New GameState / RoundState
- `turnState: { currentPlayerIndex: number; phase: 'free-actions' | 'place-engineer' | 'resolving' | 'mini-game' }` — where we are within a single turn
- `pickOrder` recalculated by VP (lowest first) instead of MAU

### Constants
```typescript
export const MAU_MILESTONES = [
  { id: 'mau-1k', threshold: 1000, vp: 1 },
  { id: 'mau-2.5k', threshold: 2500, vp: 2 },
  { id: 'mau-5k', threshold: 5000, vp: 3 },
  { id: 'mau-10k', threshold: 10000, vp: 5 },
];
```

---

## UI Layout

### Main Screen (Action Draft Phase) — 3-Panel Layout

**Top Bar:**
- Quarter indicator (Q1-Q4) with quarterly theme
- Current player turn indicator with snake order preview
- VP scoreboard for all players

**Left Panel — Your Corporation Board:**
- Code grid (4x4 / 4x5 / 5x5) — interactive, clickable
- Tech debt buffer (4 slots) below grid
- AI research level (0/1/2)
- Held app cards (up to 3) — clickable to publish
- Leader card with "tap to use power" button
- Free action buttons: "Publish App", "Commit Code" (your turn only)

**Center — Shared Board:**
- Action spaces with engineer slots
- Shared code pool (colored tokens)
- App card market (3 face-up cards)

**Right Panel — Opponent Boards (compact):**
- Compact read-only grids per opponent
- Published apps, VP, engineer placements
- Corporation type badge (Agency/Product)

**Bottom Bar:**
- Your engineers (draggable to action spaces)
- Money, stats
- "End Turn" button

---

## Implementation Approach

Build a new `ActionDraftPhase.tsx` from scratch rather than modifying the existing PlanningPhase. Keep old phases intact until the new one works.

### Implementation Order

#### Phase A: State & Logic
1. Add new player fields (marketingStarBonus, committedCodeCount, recurringRevenue, mauMilestonesClaimed)
2. Add MAU_MILESTONES constant and TurnState type
3. Rewrite `claimActionSlot()` for immediate resolution + turn state management
4. Add free action dispatchers (publishApp already exists, wire leader power, update commitCode for product scoring)
5. Split marketing/monetization by corporation type
6. Rewrite `calculateWinner` with dual scoring paths
7. Update snake order to use VP instead of MAU
8. Add recurring revenue to round-end income

#### Phase B: Core UI
9. Build `ActionDraftPhase.tsx` shell with 3-panel layout
10. Wire left panel: grid (CodeGridView), buffer (TechDebtBufferView), held cards, leader card
11. Wire center panel: action spaces, code pool (CodePoolView), app market (AppCardView)
12. Wire right panel: compact opponent boards
13. Add free action UI (publish modal, commit code interaction, leader power tap)

#### Phase C: Interactive Actions
14. Develop-features: token picker modal (select from pool → click grid cell to place)
15. Optimize-code: inline push-your-luck mini-game with swap UI
16. Wire "End Turn" button and turn advancement

#### Phase D: Integration
17. Update App.tsx phase routing (action-draft replaces planning+reveal+resolution)
18. Update round-end for recurring revenue, MAU milestone checks
19. Remove dead phases (reveal, resolution, sprint standalone)
20. Full build verification + test updates
