# Ship It! Board Game - Developer Notes

## Build Commands
- **Type checking**: `npx tsc --noEmit --project tsconfig.app.json`
  - Do NOT use bare `tsc --noEmit` — the root `tsconfig.json` uses project references with `"files": []` and will report 0 errors even when components have type errors
- **Full build**: `npx vite build`
- **Dev server**: `npx vite`
- Always run both type check AND vite build before committing

## Project Structure
- **Types**: `src/types/index.ts` — single source of truth for all game types, constants, and helper functions
- **Game logic**: `src/state/gameStore.ts` — Zustand store with all game state mutations (~2000 lines)
- **Game data**: `src/data/` — engineers, actions, corporations, events, game rules, personaCards
- **UI components**: `src/components/game/` (phase screens) and `src/components/ui/` (reusable widgets)
- **Simulation**: `src/simulation/` — balance test harness (excluded from tsconfig.app.json, runs via `npx tsx`)
- **Design doc**: `GAMEPLAY_IMPROVEMENT_PLAN.md` — full design spec for all planned improvements

## Architecture Conventions
- **State management**: Zustand with `immer` middleware for immutable updates
- **Styling**: Tailwind CSS utility classes, dark theme (`bg-gray-900` base)
- **Animation**: Framer Motion (`motion` components, `AnimatePresence`)
- **Integer math only**: All game values are integers — no decimals anywhere in the game system
  - Engineer power: 1 (intern), 2 (junior), 4 (senior)
  - AI bonus: flat +2 power
  - Specialty bonus: flat +1 power
  - Trait bonuses: flat +1 power
  - Rating: 1-10 integer scale
  - Tech debt penalty: -1 power per 4 debt (0-3: none, 4-7: -1, 8-11: -2, 12+: -3)

## Key Technical Lessons
1. **tsconfig project references**: Root config delegates to `tsconfig.app.json` and `tsconfig.node.json`. Component type errors only show with `--project tsconfig.app.json`
2. **Edit tool requires Read first**: Always read a file before editing it in a new context
3. **Type changes cascade widely**: Changing a core type like `Engineer` (productivity→power) touched 15+ files across data, state, and UI layers. Plan for this.
4. **Production track system**: `ProductionTracks` in Player state, `PRODUCTION_CONSTANTS` for per-point values, debt levels reduce effective production at round start
5. **Simulation excluded from browser tsconfig**: `src/simulation/` uses Node APIs (process.argv), so it's excluded from `tsconfig.app.json`. Run simulation with `npx tsx src/simulation/runBalance.ts [gamesPerCombo]`
6. **Badge component variants**: Available variants are `default`, `success`, `warning`, `danger`, `info` (NOT `error`)
7. **Adding new GamePhases**: Must update `PhaseGuide.tsx` Record (exhaustive), `App.tsx` switch, `GameStore` interface, and `createInitialState` roundState
8. **RoundState has required fields**: When constructing RoundState objects, `personaPool: []` is required alongside `engineerPool`

## Implementation Status
- **Phase 1 COMPLETE** (commit 07212a8): Integer power, Mars-style production tracks, 1-10 rating
- **Phase 2 COMPLETE**: 18 dual-sided persona cards, leader draft, funding selection, persona auctions, leader passives
- **Phase 2.5 COMPLETE**: Balance simulation harness (18 leaders x 3 funding types = 54 combos)
- **Phase 3 NEXT**: Sprint mini-game (push-your-luck replacing coding puzzle)
- See `GAMEPLAY_IMPROVEMENT_PLAN.md` for full Phase 3-5 roadmap

## Phase 2 Architecture
- **Game flow**: setup → leader-draft → funding-selection → engineer-draft → planning → ...
- **Persona cards**: `src/data/personaCards.ts` — 18 cards with LeaderSide + PersonaEngineerSide
- **Leader draft**: Deal 3 cards per player, pick 1 as CEO. Unchosen return to persona deck.
- **Funding selection**: After leader pick, choose VC-Heavy/Bootstrapped/Angel-Backed
- **Persona auctions**: During engineer draft, persona cards auctioned via mini-auction ($5 increments)
- **Leader passives**: 10 of 18 implemented in resolveActions (enterprise-culture, perfectionist, efficient-ai, etc.)
- **Persona traits**: 7 of 18 engineer-side traits implemented (Flat Hierarchy, Optimizer, Growth Hacker, etc.)

## Balance Findings (Phase 2.5)
- Steeve Careers (perfectionist: +1 rating/round) significantly overperforms
- Bootstrapped funding type outperforms VC-Heavy and Angel-Backed
- Jensen Wattson, Marc Cloudoff, Silica Su underperform — passives not yet implemented
- Balance tuning needed before Phase 3
