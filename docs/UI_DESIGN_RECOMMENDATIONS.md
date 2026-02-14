# Ship It! — UI Design Recommendations

## Current State (post grid-redesign branch)

The game has 8 distinct phase screens plus modals and overlays. The action-draft phase (where players spend ~80% of gameplay) was recently redesigned to place the code grid at center stage with compact action tiles at the bottom. This doc covers recommendations for all screens.

---

## 1. Action Draft Phase (Primary — Just Redesigned)

### What's Working
- Code grid is now the center attraction at 64×64px cells
- Action tiles are compact in a horizontal strip at the bottom, adjacent to the engineer tray
- Drag-and-drop + click-click dual interaction mode
- Left sidebar is compact (leader, stats, tech debt)
- Opponent view is clean with mini grids

### Recommendations

**1.1 Empty State — Fill the Dead Space**
The center panel has significant whitespace below the code pool when the grid is mostly empty (early game). Consider:
- Show a **contextual tip** in the empty space: "Place tokens on your grid by assigning engineers to Develop Features"
- Or show a **mini scoreboard** with production tracks inline (MAU track, Revenue track) so players always see progress
- This space will naturally fill as agency players see held cards + app market

**1.2 Action Tile Hover Detail**
The compact action tiles sacrifice description text for space. Add a **tooltip on hover** that shows the full action description + cost + effect. Currently you have to remember what each action does.

**1.3 Visual Feedback on Engineer Selection**
When an engineer is selected (click mode), the action tiles should visually pulse or brighten to indicate they're drop targets. Currently only the "Click or drop on an action" text hint appears — a subtle border glow on all available actions would be more discoverable.

**1.4 Turn Transition Animation**
When turns alternate between players, there's no visual indication beyond the header text changing. Add a brief **slide-in banner** or **color flash** showing "Player 2's Turn" for 1-2 seconds to make the transition obvious in hotseat play.

**1.5 Code Pool Could Be Inline with Grid**
The shared code pool is currently below the grid in a separate section. Consider placing it **to the right of the grid** (side-by-side) since they're used together during Develop Features. This pairs the "pick from pool → place on grid" flow spatially.

**1.6 Opponent Grid Should Show Token Colors**
The opponent mini-grids use `size="sm"` (32px cells) which is readable, but ensure the 2-letter token labels (FE, DO, BE, FS) are visible at that size. If not, consider just showing colored squares without labels for opponents.

---

## 2. Setup Screen

### What's Working
- Clean, centered layout
- Player count selector is clear
- Planning mode options are distinct

### Recommendations

**2.1 Add Visual Preview of Game Modes**
"Strategic" vs "Quick Play" modes are text-only. Add a small icon or diagram for each:
- Strategic: icon showing alternating arrows (snake draft)
- Quick Play: icon showing simultaneous placement

**2.2 Player Name Entry**
Currently names are assigned as "Player 1", "Player 2" etc. Consider adding optional name inputs on the setup screen to avoid the separate CEO Name field on the leader draft.

**2.3 Game Length Estimate**
The "2-4 players | 4 rounds | ~30 minutes" text at the bottom says "4 rounds" but the game has 12 rounds (4 quarters × 3 rounds). Should say "4 quarters" or "12 rounds".

---

## 3. Leader Draft

### What's Working
- Leader cards are visually rich with portraits, powers, and passives
- Product lock badges clearly indicate gameplay constraints
- Starting bonuses are clearly listed

### Recommendations

**3.1 Reduce Sidebar Verbosity**
The left sidebar repeats the phase title ("Choose Your Leader") twice — once in the PhaseGuide header and once as body text. The WHAT TO DO steps and TIPS section take up significant vertical space. Consider:
- Collapse tips behind an expandable "Show Tips" toggle (default collapsed for returning players)
- Or move tips into a tooltip on a help icon

**3.2 Card Selection State**
When a card is selected (blue border), the "Confirm & Next Player" button should show the leader name: "Confirm Lora Page" instead of generic "Confirm & Next Player".

**3.3 CEO Name Input Placement**
The CEO Name input sits above the cards but feels disconnected. Move it below the selected card or into the confirmation flow: select card → enter name → confirm.

**3.4 Unchosen Leaders Messaging**
The subtitle says "Unchosen leaders become premium engineers" but this is easy to miss. Add a visual indicator on unselected cards showing they'll appear as persona engineers later.

---

## 4. Funding Selection (Corporation Style)

### What's Working
- Two-option layout (Agency vs Product) is clean
- Scoring breakdowns and key actions are well-structured
- Card selection for Agency players works smoothly

### Recommendations

**4.1 Visual Differentiation**
Agency and Product cards look identical except for text content. Add a distinctive visual treatment:
- Agency: blue/indigo accent theme, app/grid icon
- Product: green accent theme, growth/chart icon

**4.2 Interactive Comparison**
When hovering over one style, consider dimming the other slightly to focus attention. The current equal-weight presentation makes it hard to compare.

**4.3 Card Selection Phase Transition**
When an Agency player transitions to card selection, the whole screen re-renders. Add a smooth transition/animation between style selection and card selection phases.

---

## 5. Engineer Draft

### What's Working
- Engineer cards clearly show level, specialty, power, cost, and traits
- Hire cost is prominent
- Draft phase progress tracker on left sidebar

### Recommendations

**5.1 Engineer Card Sizing**
Cards are full-width in a row which makes them wide but short. For 2-3 engineers, consider a more compact card that's taller and narrower with the portrait/icon more prominent — similar to how leader cards look.

**5.2 Specialty Relevance Hint**
New players may not understand which specialties match which actions. Add a subtle hint: "Frontend matches Develop Features" below the specialty badge.

**5.3 Cost vs Budget Visual**
The "Available Funds: $90" text is in the top-right corner, far from the "$19" hire cost on each card. Consider showing a "remaining after hire" preview: "$19 → $71 remaining" to help budget decisions.

**5.4 Left Sidebar Declutter**
The "Engineer Types", "Draft Tips", and "Engineer Traits" sections are extensive. Default these to collapsed and show only the "Draft Phase" progress tracker by default. Expanding help content should be opt-in.

---

## 6. Persona Auction

### What's Working
- Split layout with persona card on left and auction mechanics on right
- Bidding order is clear
- Pass/bid buttons are well-placed

### Recommendations

**6.1 Bid Buttons Layout**
The "Bid $15" button is large/primary, but "$20" and "$25" are small secondary buttons. Make all three equal-sized to reduce the implicit bias toward minimum bid.

**6.2 Show Auction History**
When multiple bids happen, there's no visual history. Add a small bid log: "P1 bid $15 → P2 bid $20 → P1 passed".

**6.3 Pass Button Clarity**
"Pass (withdraw from auction)" is clear but could be shorter: just "Pass" with the withdrawal consequence in a tooltip.

---

## 7. Global UI Patterns

### 7.1 Consistent Header Bar
Each phase has its own header treatment. Standardize:
- **Top bar** (always visible): Game title/logo | Phase name | Progress (Q1-Q4, Round) | VP scores
- This provides orientation no matter which phase you're in

### 7.2 Phase Transition Animation
Currently phases switch instantly. Add a brief (300ms) crossfade or slide transition between phases to give a sense of progression and prevent jarring context switches.

### 7.3 PhaseGuide Sidebar
The PhaseGuide sidebar appears on most screens but varies in content density. Standardize behavior:
- **First time** a phase is seen: expanded with full tips
- **Subsequent visits**: collapsed to just the title, expandable on click
- Track "seen phases" in localStorage

### 7.4 Color Palette Consistency
Player colors, action type colors, and token colors should have a documented palette:
- **Tokens**: Green (FE), Orange (DO), Blue (BE), Purple (FS) — well-established
- **Action categories**: Could benefit from subtle color coding (development = green, economy = gold, growth = blue)
- **Player colors**: Currently assigned at game start — ensure sufficient contrast for colorblind accessibility

### 7.5 Responsive Considerations
The game targets desktop but some screens overflow on smaller monitors (1366×768):
- Test at 1366×768 minimum viewport
- Action draft bottom bar may need scrolling at this size
- Use `min-h-0` + `overflow-auto` patterns consistently

### 7.6 Sound/Haptic Feedback (Future)
Key moments that would benefit from audio cues:
- Turn change chime
- Token placement click
- Engineer assignment confirmation
- Bust/bust on optimize code
- App publish success fanfare

---

## 8. Information Architecture

### 8.1 What Information Do Players Need, When?

| Phase | Critical Info | Nice-to-Have | Currently Hidden |
|-------|-------------|-------------|-----------------|
| Action Draft | Grid state, available actions, code pool | Opponent grids, score delta | Action descriptions (compact mode) |
| Engineer Draft | Engineer stats, budget | Specialty-action mapping | Budget math preview |
| Persona Auction | Persona power, current bid | Remaining personas count | Auction strategy tips |
| Leader Draft | Leader powers, product locks | How unchosen leaders return | — |

### 8.2 Progressive Disclosure
Not all information needs to be visible at once. The current approach of showing everything simultaneously (especially in draft phases) can overwhelm new players. Consider:
1. **Essential** (always visible): current action, primary choices
2. **Important** (visible on demand): stats, tips, opponent state
3. **Reference** (collapsed/tooltip): rules, detailed breakdowns

---

## 9. Priority Matrix

| Priority | Recommendation | Effort | Impact |
|----------|---------------|--------|--------|
| P0 (Done) | Grid-centric layout for action draft | Large | High |
| P0 (Done) | Drag-and-drop engineer assignment | Medium | High |
| P1 | Action tile hover tooltips (description) | Small | Medium |
| P1 | Turn transition animation | Small | Medium |
| P1 | Game length estimate fix on setup screen | Tiny | Low |
| P1 | Sidebar declutter (collapse tips by default) | Medium | Medium |
| P2 | Code pool side-by-side with grid | Medium | Medium |
| P2 | Engineer selection visual feedback on tiles | Small | Medium |
| P2 | Phase transition animations | Medium | Medium |
| P2 | Corporation style visual differentiation | Small | Low |
| P3 | Progressive disclosure system | Large | High |
| P3 | Consistent global header bar | Medium | Medium |
| P3 | Sound/audio feedback | Medium | Medium |
| P3 | Responsive layout at 1366×768 | Medium | Low |

---

## 10. File Map

Key files for implementing these recommendations:

```
src/components/game/
  ActionDraftPhase.tsx    — Main gameplay (recently redesigned)
  LeaderDraft.tsx         — Leader selection
  EngineerDraft.tsx       — Engineer hiring
  FundingSelection.tsx    — Corp style + card selection
  SetupScreen.tsx         — Game setup

src/components/ui/
  ActionSpaceCard.tsx     — Action tile (has compact mode)
  EngineerToken.tsx       — Engineer in tray (has drag support)
  CodeGridView.tsx        — Grid display (has size variants)
  CodePoolView.tsx        — Token pool
  PhaseGuide.tsx          — Sidebar helper (target for declutter)
  AppCardView.tsx         — App card display
```
