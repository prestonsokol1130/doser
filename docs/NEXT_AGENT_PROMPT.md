# Prompt for Next Codex Agent - Phase 5 Tools + Settings

@HANDOFF.md
@STRUCTURE.md

Do not create a new branch. Run `git branch --show-current` first and work only on the existing branch.

Verify you are on `main`. If not, stop and tell me. Do not switch branches yourself unless I explicitly tell you to do so.

Read `docs/AI_CONTEXT.md` before writing any code.
Read `docs/HANDOFF.md` before writing any code.

Read the handoff document fully before writing any code.
Pay special attention to HANDOFF.md Section 2b (Design System Rules).

Read the existing codebase before assuming anything.
If anything is unclear, stop and ask before writing code.

## Current State

- Branch: `main`
- Phase 4 is complete and merged
- PR #7 was merged to main
- The repository docs were updated to reflect the Phase 4 merge and the move to Phase 5
- The existing timer/history behavior must remain intact

## What Phase 4 Delivered

- Carousel cards 2-6 are built and wired to real data
- The 3D cube carousel transition is working
- History screen is live with list, filter, delete, and edit
- `EditDoseModal` validation feedback was fixed
- `currentSession()` has a defensive empty-session guard
- `dosesPast7Days()` is chronologically sorted
- `dist/` is removed from git tracking and ignored
- The CodeRabbit review cleanup is complete

## Phase 5 Scope

Build the remaining Tools and Settings surfaces without breaking the existing Timer or History flows.

### Tools

1. Stash
2. Dose Buddy
3. Taper
4. Emergency Resources
5. Safety Reference

### Settings

1. Account
2. Profile
3. Notifications
4. Themes
5. Install App
6. Legal

## Constraints

- Do NOT modify `src/lib/perceivedEffect/`
- Do NOT remove `translateZ(-depthPx)` from the carousel stage
- Do NOT convert the inline timer ring clamp sizing back to Tailwind
- Do NOT hardcode colors; use the CSS variables from `src/index.css`
- Do NOT rewrite Phase 4 work
- Do NOT create a new branch

## Files Likely To Change

- `src/components/tools/*`
- `src/components/settings/*`
- `src/components/timer/BottomNav.tsx`
- `src/components/MainApp.tsx`
- `src/App.tsx` if any route wiring needs to change
- `docs/AI_CONTEXT.md` after the phase lands

## Validation

If you make any code change, re-run:
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

## Success Criteria

- Tools screens render and navigate correctly
- Settings screens render and navigate correctly
- Existing Timer and History behavior still works
- No PEL engine changes were made
- No stale Phase 4 wording remains in the active docs once Phase 5 work starts

## Report Back

When done, tell Preston:
- what Phase 4 already delivered
- what you built for Phase 5
- any files that needed route or tab wiring
- any validation or build issues you found
- which docs were updated to stay aligned with Phase 5
