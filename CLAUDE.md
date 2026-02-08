# Ship It! Board Game - Developer Notes

## Build Commands
- **Type checking**: `npx tsc --noEmit --project tsconfig.app.json`
  - Do NOT use bare `tsc --noEmit` — the root `tsconfig.json` uses project references with `"files": []` and will report 0 errors even when components have type errors
- **Full build**: `npx vite build`
- **Dev server**: `npx vite`
- Always run both type check AND vite build before committing

## Project Structure
- **Types**: `src/types/index.ts` — single source of truth for all game types, constants, and helper functions
- **Game logic**: `src/state/gameStore.ts` — Zustand store with all game state mutations (~1500 lines)
- **Game data**: `src/data/` — engineers, actions, corporations, events, game rules
- **UI components**: `src/components/game/` (phase screens) and `src/components/ui/` (reusable widgets)
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

## Implementation Status
- **Phase 1 COMPLETE** (commit 07212a8): Integer power, Mars-style production tracks, 1-10 rating
- **Phase 2 NEXT**: Dual-sided engineering cards (18 personas), simplified corporation selection
- See `GAMEPLAY_IMPROVEMENT_PLAN.md` for full Phase 2-5 roadmap
