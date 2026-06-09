# Prompt for Next Codex Agent - Phase 4 Merge Cleanup

@HANDOFF.md
@STRUCTURE.md

Do not create a new branch. Run `git branch --show-current` first and work only on the existing branch.

Verify you are on `feat/carousel-history-phase4`. If not, stop and tell me. Do not switch branches yourself.

Read `docs/AI_CONTEXT.md` before writing any code.
Read `docs/CODEX_HANDOFF_PHASE4_GIT.md` before writing any code.

Read the handoff document fully before writing any code.
Pay special attention to HANDOFF.md Section 2b (Design System Rules).

Read the existing codebase before assuming anything.
If anything is unclear, stop and ask before writing code.

## Current State

- Branch: `feat/carousel-history-phase4`
- Phase 4 feature work is already implemented and pushed
- PR #7 is the active review / merge target
- `dist/` has been removed from git tracking and is ignored
- The worktree should stay clean unless you are making the final review cleanup or merge-doc updates

## What Is Already Done

- `MainApp.tsx` orchestrates shared app state for Timer and History
- `HistoryScreen.tsx` and `EditDoseModal.tsx` are implemented
- `sessionStats.ts` and `pelDisplay.ts` are implemented and wired in
- carousel cards 2-6 are data-driven
- the 3D cube carousel transition is implemented
- the timer ring rework is in place
- the Phase 4 validation fixes are already applied:
  - History date headings
  - `currentSession()` empty-session guard
  - chronological 7-day sorting
  - visible edit validation errors
- the guarded `.gitignore` append example is documented in `docs/CODEX_HANDOFF_PHASE4_GIT.md`

## What Still Needs Attention

1. Check the live PR #7 review state after refresh.
2. Decide which CodeRabbit comments are still live and which are stale.
3. Only change `TimerCarousel.tsx` if you can verify a real scroll/swipe conflict.
4. Merge PR #7 once the review state is acceptable.
5. After merge, update `docs/AI_CONTEXT.md` with the merged result and mark Phase 4 complete.
6. After merge, clean up the branch locally and remotely.

## Review Items To Re-check

- `src/components/timer/carousel/CarouselCardShell.tsx`
  - CodeRabbit already suggested `rounded-[22px]` instead of the old inline radius. If the current remote branch already has that change, do not re-open the issue.
- `src/components/timer/carousel/TimerCarousel.tsx`
  - Do not add `preventDefault()` unless you can prove a real touch conflict.
- `docs/CODEX_HANDOFF_PHASE4_GIT.md`
  - If any stale review comment still references the old `.gitignore` example, confirm it points to the guarded `Select-String` / `Add-Content` version already committed.

## Constraints

- Do NOT modify `src/lib/perceivedEffect/`
- Do NOT remove `translateZ(-depthPx)` from the carousel stage
- Do NOT convert the inline timer ring clamp sizing back to Tailwind
- Do NOT create a new branch
- Do NOT commit to `main`
- Do NOT rewrite Phase 4 from scratch

## Merge / Cleanup Steps After Review Is Clear

1. Merge PR #7 to `main`.
2. Pull the merged `main` locally.
3. Delete the feature branch locally and remotely:
   - `git checkout main`
   - `git pull origin main`
   - `git branch -d feat/carousel-history-phase4`
   - `git push origin --delete feat/carousel-history-phase4`
4. Update `docs/AI_CONTEXT.md` with the merged Phase 4 status.

## Validation

If you make any additional change, re-run:
- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

## Report Back

When done, tell Preston:
- which CodeRabbit comments were still open after refresh
- which ones were stale versus still-live and why
- whether the PR is merge-ready
- which docs were updated
- the exact merge / cleanup steps to run next
