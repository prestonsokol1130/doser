# Codex Handoff — Phase 4 Commit + PR + Branch Cleanup

**Written:** 2026-06-09 by Claude Code (advisor) for the next agent (Codex).
**Repo:** https://github.com/prestonsokol1130/doser
**Local path:** `C:\Users\Preston Sokol\Projects\doser 2.0\doser`
**Branch you must stay on:** `feat/carousel-history-phase4`

> Read `docs/AI_CONTEXT.md` and `docs/HANDOFF.md` first for full project context.
> Preston is a non-coding solo dev relaying between AI agents. Be explicit and
> spell out every git step — do not assume he knows git internals.

---

## 1. Where things stand

Phase 4 (carousel cards 2–6, 3D cube transition, History screen, timer-ring rework)
is **functionally complete and working in the browser** on the dev server, but **none
of it is committed yet.** Your job is to get this branch into a correct, complete,
committable state and walk Preston through the PR.

### The single most important fact

**The Phase 4 work is split between MODIFIED (tracked) files and brand-new UNTRACKED
files.** If you commit only the modified files, the app will not build because the
modified files import the untracked ones. You must `git add` BOTH.

Run `git status` and you will see something like:

```
Modified (tracked):
  src/components/timer/carousel/CarouselCardShell.tsx
  src/components/timer/carousel/TimerCarousel.tsx
  src/components/timer/carousel/TimerRingCard.tsx
  dist/index.html          <- build artifact, see section 3
  dist/sw.js               <- build artifact, see section 3

Untracked (NEW — never committed):
  src/components/MainApp.tsx                              <- app shell, critical
  src/components/history/HistoryScreen.tsx                <- History tab
  src/components/history/EditDoseModal.tsx                <- edit dose modal
  src/components/timer/carousel/CardStat.tsx              <- shared card stat cell
  src/components/timer/carousel/carouselTypes.ts          <- shared card prop types
  src/lib/sessionStats.ts                                 <- today/12h/7d aggregations
  src/lib/pelDisplay.ts                                   <- PEL color/label (display only)
  dist/assets/                                            <- build artifacts, see section 3
```

---

## 2. What was built / changed this session (so you can review intelligently)

### New feature files (untracked — author: Cursor)
- `src/components/MainApp.tsx` — top-level app shell. Loads profile + doses once from
  Firestore, holds shared `doses` state, passes it to both Timer and History so they
  stay in sync. Bottom-nav switches Timer / History / placeholder tabs.
- `src/components/history/HistoryScreen.tsx` — chronological dose list, filter
  (All/GBL/BDO), delete (persists via `saveDoses`), tap-to-edit.
- `src/components/history/EditDoseModal.tsx` — edit amount / substance / timestamp.
- `src/components/timer/carousel/CardStat.tsx` — reusable label/value cell + `CardHeader`.
- `src/components/timer/carousel/carouselTypes.ts` — `CarouselCardData` prop type.
- `src/lib/sessionStats.ts` — today/12-hour/7-day aggregations, session splitting.
- `src/lib/pelDisplay.ts` — PEL % → color/label mapping (DISPLAY ONLY; does not
  reimplement PEL math — it calls the engine).

### Modified files (author: Claude Code, debugging the timer ring + carousel)
- `src/components/timer/carousel/TimerCarousel.tsx`
  - Layout: `px-3 pt-3` on the carousel, `py-3` on pagination dots → consistent 12px gaps.
  - Viewport fills the zone (`flex-1`); removed old fixed `max-h`/centering hacks.
  - 3D cube: stage transform is
    `translateZ(${-depthPx}px) rotateY(...)` — the `translateZ(-depthPx)` is REQUIRED
    (see AI_CONTEXT "3D CAROUSEL PERSPECTIVE"). Transition is `650ms`.
- `src/components/timer/carousel/TimerRingCard.tsx`
  - Ring is an explicit square via inline style `clamp(260px, 40vh, 350px)` (NOT
    Tailwind — see JIT note). Countdown + labels use inline `clamp()` font sizes that
    scale with the ring.
  - Idle/safe state now shows **READY / `--:--:--` / awaiting entry** with no stale
    time; the live countdown (WAIT / time / "next window") only shows during an active
    wait window.
- `src/components/timer/carousel/CarouselCardShell.tsx`
  - Border + `borderRadius: '22px'` via inline style (matches the dose card; inline so
    Tailwind JIT can't drop it).

### Why inline styles instead of Tailwind classes
Tailwind's JIT did not reliably regenerate arbitrary class values on the long-running
dev server, so ring size / radius / font size live in `style={{}}`. `clamp()` for
ring/gauge sizing is explicitly allowed by HANDOFF.md. **Do not "clean these up" into
Tailwind classes** — it reintroduces the staleness bug.

### Do NOT touch
- `src/lib/perceivedEffect/` — the PEL engine. Sacred, hand-tuned. Never modify.
- The `translateZ(-depthPx)` on the carousel stage.
- The inline `clamp()` sizing on the timer ring.

---

## 3. `dist/` must leave git tracking

`dist/` (the production build output) is currently committed AND modified, and
`dist/sw.js` (the PWA service worker) is what caused a multi-hour caching trap this
session (see AI_CONTEXT "SERVICE WORKER CACHING TRAP"). It should never be in git.

Do this as part of the commit:

```bash
# from repo root: C:\Users\Preston Sokol\Projects\doser 2.0\doser
# 1. ensure dist/ is ignored
#    (append to .gitignore if not already present)
echo "dist/" >> .gitignore        # check it isn't already there first

# 2. stop tracking the already-committed dist files (keeps them on disk)
git rm -r --cached dist
```

---

## 4. The commit + PR process (spell this out for Preston)

> Reminder: stay on `feat/carousel-history-phase4`. Never `git checkout -b`. Never
> commit to `main`. End commit messages with the Co-Authored-By line only if Preston
> asks; otherwise normal messages are fine.

```bash
# 0. confirm branch
git branch --show-current     # must print: feat/carousel-history-phase4

# 1. ignore + untrack dist (section 3)
echo "dist/" >> .gitignore
git rm -r --cached dist

# 2. sanity: typecheck + build BEFORE committing
npx tsc --noEmit -p tsconfig.app.json
npm run build                 # must succeed; this proves no missing imports

# 3. stage everything that belongs to Phase 4 (source only, NOT dist)
git add .gitignore
git add src/

# 4. verify what you're about to commit — make sure ALL of these appear:
#    MainApp.tsx, history/HistoryScreen.tsx, history/EditDoseModal.tsx,
#    CardStat.tsx, carouselTypes.ts, sessionStats.ts, pelDisplay.ts,
#    TimerCarousel.tsx, TimerRingCard.tsx, CarouselCardShell.tsx
git status

# 5. commit
git commit -m "feat: phase 4 carousel cards 2-6, 3D cube transition, history screen, timer ring rework"

# 6. push
git push origin feat/carousel-history-phase4
```

Then Preston opens the PR on GitHub (base `main` <- compare
`feat/carousel-history-phase4`). CodeRabbit reviews automatically.

### CodeRabbit
Read every comment. Categorize by severity. Likely flags to expect:
- Validation on dose edit/delete (must validate id/substance/amountMl/ts before
  `saveDoses`). Confirm `EditDoseModal` / `HistoryScreen` validate.
- Any hardcoded hex colors (should be none — CSS variables only).
- `dist/` removal should clear a lot of noise.

Fix real issues, push to the same branch (CodeRabbit re-reviews), then Preston merges.

### After merge (branch cleanup)
```bash
git checkout main
git pull origin main
git branch -d feat/carousel-history-phase4
git push origin --delete feat/carousel-history-phase4
```

---

## 5. Known issues / things to verify before merge

1. **Console errors** — DevTools showed ~2 errors + 1 warning. Likely the Firebase
   auth iframe (`/__/auth/iframe`) or PWA registration, but CONFIRM. Open the Console
   tab and read them; don't merge with unexplained errors.
2. **History screen untested end-to-end** — list renders, but verify delete persists
   to Firestore, edit modal saves, and the substance filter works. Note: GHB doses
   only show under the "All" filter (spec asked GBL/BDO/All — acceptable).
3. **Card alignment polish (cosmetic, can be a follow-up)** — cards 2–6 have
   inconsistent vertical layout. SESSION COMPARE (card 6) is the good template (content
   fills card height). CURRENT STATE (card 3) and PAST 12 HOURS (card 4) crowd the top
   and leave empty bottoms. Recommendation: distribute content vertically to fill the
   card, do NOT center (too dense). This is polish — fine to defer to a follow-up PR.

---

## 6. Dev server / environment notes
- Dev server is (or was) running in the background on **http://localhost:5199/**.
  Start it with: `npm run dev -- --port 5199 --strictPort` from the repo root.
- If UI changes don't appear: it's almost always the service-worker cache. Use a fresh
  port or unregister the SW (AI_CONTEXT). Don't waste time refreshing.
- Stack: React + TS + Vite + Tailwind v3 + Firebase. Do NOT upgrade Tailwind to v4.
- `postcss.config` must stay `.cjs`. `tsconfig.app.json` paths have no `baseUrl` — leave it.

---

## 7. After Phase 4 merges
- Phase 4 polish (card alignment) if not done.
- Phase 5: Insights screen, Tools (Dose Buddy, Taper), Settings.
- All docs live in `docs/` — never create root-level docs.
