# Doser 2.0 — AI Context Document
# Read this first before anything else in any conversation about this project.

---

## What This Project Is

Doser is a harm reduction PWA for GBL, BDO, and GHB users. It tracks dosing timing
and calculates perceived effect levels to help users make safer redosing decisions.
It is not a medical device. It lives at usedoser.com and is distributed outside app
stores intentionally due to policy barriers.

Preston is the solo developer. He has no coding background. He uses AI agents
(Claude for direction and architecture, Cursor for all actual code writing) to build
the app. He does not write code directly.

---

## Repository

GitHub: https://github.com/prestonsokol1130/doser
Local path: C:\Users\Preston Sokol\Projects\doser 2.0\doser
Stack: React + TypeScript + Vite + Tailwind CSS v3 + Firebase Auth
PWA: vite-plugin-pwa with Workbox service worker
Code review: CodeRabbit connected, reviews every PR automatically

---

## Current Build Status

Last updated: 2026-06-11

PHASE 1 — Foundation: COMPLETE
  Clean Vite+React+TS+Tailwind scaffold committed to main.
  CSS variables, Google Fonts (Unbounded + JetBrains Mono), folder structure all locked in.
  Firebase connected (project: doser-e389f, Email/Password + Google auth enabled).
  Firestore database created (us-east4, production mode, security rules set).
  .env file exists locally with Firebase config — gitignored, never committed.

PHASE 2 — Gate + Auth + Onboarding: COMPLETE
  Gate Layer (PR #1): MERGED — age gate, legal, harm reduction acknowledgment screens
  Auth screens (PR #2): MERGED — log in, sign up, forgot password, recovery (Firebase)
  Onboarding (PR #3): MERGED — 4-screen onboarding, profile saved to Firestore, skips on return

PHASE 3 — Timer Screen: COMPLETE
  Core timer screen (PR #4): MERGED 2026-06-07
  Dose persistence to Firestore (PR #5): IN REVIEW — all CodeRabbit issues fixed

  DONE:
  - TimerScreen.tsx — full state management (doses, profile, substance, nowMs, carousel index)
  - TimerHeader — wordmark, substance selector (GBL/BDO), flashlight button (visual only)
  - TopStatRow — LAST ENTRY + SESSION TOTAL stat cards
  - TimerRingCard (Carousel Card 1) — SVG ring, WAIT/SAFE states, fill animation on LOG ENTRY
  - TimerCarousel — horizontal scroll carousel, swipe navigation, pagination dots
  - DoseCard — dose adjuster 0.1–10.0 mL looping scroll wheel, LOG ENTRY button
  - BottomNav — 5-tab nav, Timer tab active, other tabs are visual placeholders only
  - New design system tokens: Fonts (Antonio, Inter, Montserrat), Colors (--color-ring, etc.)
  - PEL engine files copied into src/lib/perceivedEffect/
  - Firestore security rules updated (Phase 4 start, historical)
  - Dose persistence to Firestore: implemented but CodeRabbit flagged 5 issues

  IN PROGRESS (historical, feat/dose-persistence branch):
  - Fix 5 CodeRabbit issues on dose persistence (2 critical, 3 polish)
  - Critical Issue 1: isInitialLoadRef check order blocks first dose save
  - Critical Issue 2: Delete support not implemented (deleted doses reappear)
  - Polish Issue 3: Batch limit (500 ops) needs chunking
  - Polish Issue 4: No validation on write
  - Polish Issue 5: Hardcoded substance allowlist

  SKIPPED / DEFERRED (historical notes):
  - Carousel Cards 2–6 are placeholder shells (header text only, no content):
      Card 2 — TODAY: session summary stats
      Card 3 — CURRENT STATE: PEL gauge (needs PEL engine wired + persistent doses)
      Card 4 — PAST 12 HOURS: dose history list + bars (now has persistent storage)
      Card 5 — FORECAST: PEL bell curve chart (needs PEL engine wired)
      Card 6 — SESSION COMPARE: compare vs average (needs historical session data)
  - Flashlight button: button exists visually, no functionality implemented
  - Tab navigation: Timer, History, Tools, and Settings tabs are wired in MainApp.
    Insights tab remains a placeholder.

  DOSE PERSISTENCE (Phase 3b):
  - Implemented: saveDoses() with differential sync and batch chunking (400 ops limit)
  - Implemented: fetchDoses() with validation on load
  - Firestore structure: users/{uid}/doses subcollection with validation
  - Security rules updated: match /users/{uid}/{document=**} for subcollection access
  - Validation: All doses checked for valid id (string), substance (GBL/BDO/GHB),
    amountMl (number), ts (number) before write and on fetch
  - Constant: VALID_DOSE_SUBSTANCES exported from types.ts to prevent drift
  - Next: Historical note — PR #5 merged, then Phase 4 was built and is now complete

  RECOMMENDED: Phase 5 Tools + Settings shell is built on feat/phase-5-tools-settings.
  Next: Preston browser test, PR, CodeRabbit review, merge. Then Insights phase planning.

PHASE 4 — History + Carousel + 3D Cube: COMPLETE (PR #7 merged to main on 2026-06-09)
  Last touched: 2026-06-09

  COMPLETED PHASE 4 DELIVERABLES:
  - Carousel cards 2–6 wired to real data + PEL engine:
      Card 2 TODAY, Card 3 CURRENT STATE (PEL gauge), Card 4 PAST 12 HOURS,
      Card 5 FORECAST, Card 6 SESSION COMPARE
  - 3D cube carousel transition (rotateY prism, 650ms, working)
  - History screen (HistoryScreen.tsx + EditDoseModal.tsx): list, filter, delete, edit
  - MainApp.tsx shell: loads profile+doses once, shares between Timer and History,
    bottom-nav tab switching
  - Helper libs: src/lib/sessionStats.ts, src/lib/pelDisplay.ts
  - Timer ring fully reworked: contained, correct size clamp(260px,40vh,350px),
    READY/--:--:--/awaiting entry idle state, scaled text, rounded corners
  - Phase 4 validation fixes: EditDoseModal validation feedback, currentSession guard,
    chronological 7-day sorting, guarded dist/ ignore example in git handoff doc
  - CodeRabbit-applied CarouselCardShell fix on the remote branch: rounded-[22px]
    now lives in the class list instead of the old inline borderRadius style
  - dist/ removed from git tracking and added to .gitignore

  PHASE 4 MERGE / CLEANUP:
  - PR #7 merged to main
  - Feature branch cleanup should be done locally and remotely
  - If any stale CodeRabbit thread remains visible, confirm it against the current
    main branch before making more code changes

PHASE 5 — Tools + Settings: IN PROGRESS (feat/phase-5-tools-settings branch)
  Last touched: 2026-06-11

  IMPORTANT: All Phase 5 work below is UNCOMMITTED in the local working tree on the
  feat/phase-5-tools-settings branch. Nothing here has been committed to git yet, so
  there is no git history to recover it from. Do not run destructive git/file
  commands against these files without confirming with Preston first.

  COMPLETED PHASE 5 DELIVERABLES (this branch):
  - Tools tab: hub navigation + 5 sub-screens (Stash, Dose Buddy, Taper,
    Emergency Resources, Safety Reference)
  - Settings tab: hub navigation + 6 sub-screens (Account, Profile,
    Notifications, Themes, Install App, Legal)
  - MainApp wiring: profile + dose context persistence to Firestore
  - New libs: src/lib/stash.ts, src/lib/taper.ts, src/lib/doseBuddy.ts
  - Profile types extended: StashPrefs, TaperPrefs, DoseBuddyPrefs, themeId
  - Auth: logOut() in authStore for Account screen sign-out

  2026-06-11 SESSION — theme rollback, Dose Buddy tweaks, Stash redesign:
  1. THEME ROLLBACK (DONE): The rejected 2026-06-10 Stash + Dose Buddy redesign was
     corrected back to the app theme. The off-system mint/teal palette, lowercase
     copy, oversized radii, gradient glow, and emoji glyphs were removed from:
       - src/components/tools/StashScreen.tsx
       - src/components/tools/DoseBuddyScreen.tsx
       - src/components/tools/DoseBuddyControls.tsx
       - src/components/timer/DoseBuddyCheckInSheet.tsx
     ToolsScreen.tsx was already on-theme and left unchanged. All colors now use CSS
     variables (color-mix for accent tints). Verified: tsc + npm run build pass.
  2. DOSE BUDDY (DONE): Removed the "Local peer contribution" toggle (peer feature
     deferred; the localPeerContribution field stays in the type, just not rendered).
     The Dose Buddy "inputs used" chips (Age, Body weight, etc.) are now
     var(--color-action) orange.
  3. STASH SCREEN REDESIGN (DONE): Replaced StashScreen with the Claude Design
     handoff layout — horizontal liquid-tank hero, inline refill, three stat pills
     (Consumed / Days left / Status), quick remove/add chip rows, a hold-to-
     accelerate stepper (AccelStepper), and 5 low-alert preset chips. Conformed to
     theme tokens (color-mix). Verified: tsc + build pass.
  4. STASH DATA MODEL CHANGE (DONE): Added StashPrefs.fullMl — the "full container"
     volume = the tank's 100% reference. Previously capacityMl was BOTH the current
     amount and the 100% denominator, so the tank stayed pinned at 100% until empty.
     Now: capacityMl = current on-hand baseline; fullMl = the 100% reference (set on
     Refill). stashRemainingPct divides remaining by stashFullMl() (falls back to
     capacityMl for legacy data). Touched: src/types.ts, src/lib/stash.ts (new
     stashFullMl()), src/store/profileStore.ts (default fullMl: 0).

  OPEN — CURRENT PENDING TASK (needs rework):
  - STASH TANK WATER ANIMATION — REJECTED by Preston ("looks terrible"). A liquid
    "slosh" animation was added but Preston does not like how it looks. THE NEXT TASK
    is to redesign this animation so it convincingly looks like water sloshing in a
    tank that is being moved horizontally in BOTH directions — clearly noticeable but
    not overdone — and so the slosh intensity INCREASES when the user changes the
    volume with the +/- buttons, then settles. The current (rejected) animation lives
    in exactly these places:
      - src/index.css  →  @keyframes stashSlosh, @keyframes stashRipple
      - src/components/tools/StashScreen.tsx  →  the StashVessel component, the
        BASE_SLOSH constant, the WAVE_A mask string, and the requestAnimationFrame
        "boost" effect driven by the boostSignal prop.

  STILL DEFERRED:
  - Insights tab (placeholder remains)
  - Dose Buddy local peer contribution / peer comparison feature
  - Dose Buddy contexts not yet wired into carousel PEL cards (Phase 4 intact)
  - Push notification delivery (prefs UI only; service worker alerts not built)

  REFERENCE — Claude Design handoff bundle: The Stash redesign came from a
  claude.ai/design share (project "doser-scroll-animations"), containing the original
  HTML mockup, StashScreen-redesign.tsx, and a _ds design-system token set. That
  bundle is NOT stored in the repo. If the original design intent is needed (e.g. for
  the water animation), ask Preston to re-share the design link or save the bundle
  into docs/ai-reference/.

---

## Key Documents in This Repo

**All documentation lives in docs/ folder for organization.**

docs/HANDOFF.md — Full technical spec for Cursor agents. Design system, visual spec,
  PEL engine documentation, data model, all agent rules. Every Cursor task starts
  with @HANDOFF.md.

docs/MY_CHECKLIST.md — Preston's plain-English step-by-step process for every task.
  Branch creation, Cursor prompt template, PR process, CodeRabbit review, merge,
  cleanup. Read this to understand the workflow.

docs/AI_CONTEXT.md — This file. The first thing any AI assistant should read to
  understand the full project state before helping. It should always reflect the
  latest completed phase and the next phase to build.

docs/CLAUDE_CODE_OPERATING_MANUAL.md — Complete guide for Claude Code advisor role.
  Responsibilities, constraints, red lines, git workflow, session end checklist.
  Every Claude Code session reads this to understand the advisor role.

docs/CLAUDE_CODE_PHASE4_STARTUP.txt — Archived Phase 4 startup reference. Use
  only for historical context; current agents should read the Phase 5 prompt.

docs/NEXT_AGENT_PROMPT.md — The current pending task brief (Stash tank water
  animation redesign), ready to hand to Cursor.

docs/CODEX_OPERATING_MANUAL.md — Defines Codex's role as Preston's guide/advisor:
  the Codex → Preston → Cursor loop, the required Cursor-prompt structure, the docs
  to read, and how to review Cursor's output. Read this when Codex is the advisor.

docs/ai-reference/README.md — Source-of-truth instructions for AI screenshot and
  mockup references. Use repo-owned images from `docs/ai-reference/current-app-state/`
  and `docs/ai-reference/goal/`, not `Downloads` or other local-only paths.

---

## How the Workflow Works

Every task follows this exact pattern:
1. Preston creates a feature branch: git checkout -b feat/[task-name]
2. New Cursor Agent chat — never reuse an old chat
3. Cursor reads @HANDOFF.md first, then the codebase, then builds
4. Cursor stops and asks questions if anything is unclear — this is correct behavior
5. Preston tests in the browser before approving anything
6. Cursor commits and pushes to the feature branch
7. Preston opens a PR on GitHub
8. CodeRabbit reviews automatically — all major issues must be fixed before merging
9. Preston merges the PR
10. Branch cleanup: git checkout main, git pull, git branch -d feat/[task-name]

Cursor rules that matter most:
- Never creates branches — Preston always creates them first
- Never hardcodes hex colors — CSS variables only
- Never duplicates PEL calculation logic — calls existing functions
- Never modifies files outside the scope of the current task
- When unsure about anything — stops and asks, never guesses

---

## Tech Decisions Made

Firebase over Supabase: Switched during Phase 2. Firebase Auth handles
  email/password and Google sign-in. Supabase was the original plan but was
  replaced. No Supabase code remains in the codebase.

Firestore: Database created in us-east4 (Northern Virginia). Production mode.
  Security rules set to allow read/write only for authenticated user on their own
  users/{uid} document.

Tailwind v3 (not v4): v4 is a breaking change. The project is locked to v3.4.
  Do not upgrade.

PEL over Active Load: The app uses Perceived Effect Level (subjective intensity
  model) instead of pharmacokinetic concentration math. This was a deliberate
  decision. The PEL engine is hand-tuned and must never be rewritten.

PWA only: No app store distribution. Web-only intentionally.

Stash model (Phase 5): StashPrefs separates current amount from full capacity.
  capacityMl = current on-hand baseline (doses logged after refillAt deplete it).
  fullMl = the full container volume = the tank's 100% reference. The Stash tank
  visual empties as the current amount drops below fullMl. fullMl is set on Refill;
  manual +/- and the stepper only raise fullMl if the new amount exceeds it. Legacy
  profiles without fullMl fall back to capacityMl via stashFullMl().

Accent tints use color-mix: New Phase 5 screens express translucent accent fills as
  color-mix(in srgb, var(--color-ring) N%, transparent) instead of hardcoded rgba,
  so every color stays a design-system token. Never hardcode hex/rgba for colors.

---

## Design System Summary

**For complete design rules, see HANDOFF.md Section 2b (Design System Rules).**
That section is the authoritative reference and must be read by every agent building new screens.

Quick reference:
- Dark only. Flat. Clinical-adjacent. No shadows, gradients, or glassmorphism.
- Reference apps: Apple Health, Oura, Whoop.
- Always use CSS variables — never hardcode hex.
- Use Tailwind for structure/layout only — never for colors.
- NEVER DEVIATE FROM THE CURRENT APP THEME. NO EXCEPTIONS. UNDER NO CIRCUMSTANCES IS THAT EVER OKAY.

**Font System (Phase 3 onwards):**
- `var(--font-display)` — Antonio 200 (timer digits, large values only)
- `var(--font-heading)` — Montserrat 600/700 (card headers, screen titles)
- `var(--font-body)` — Inter 400/600 (labels, buttons, nav, copy)
- Unbounded 300 — "doser" wordmark ONLY
- JetBrains Mono — gate/auth/onboarding screens only, do not use for new screens

**Color System (Two sets exist):**
- LEGACY (gate/auth/onboarding only): --color-accent, --color-cta, --color-purple, etc.
- NEW (timer + all future screens): --color-ring, --color-action, --color-load, --app-*, etc.

See HANDOFF.md Section 2b for all 9 color tokens, layout rules, copy rules, and animation rules.

---

## The PEL Engine (Critical — Do Not Rewrite)

The core calculation engine lives in src/lib/perceivedEffect/.
It models how strongly effects FEEL, not pharmacokinetic concentration.
It is hand-tuned subjective intensity modeling — not PK math.

GBL curve: onset 10min, rise 18min, plateau 12min, decline half-life 38min, hard cutoff 180min
BDO curve: onset 22min, rise 28min, plateau 15min, decline half-life 58min, hard cutoff 300min

Hard zero after wear-off — no pharmacological tail.
Single dose at peak = ~88% display (intentional, not a bug).
100% only in extreme stacking scenarios (intentional).

Tolerance model: 9-factor behavioral model, index 0.6-2.2.
PEL = 0% while tolerance elevated after long break = correct, do not fix.

These calibration values must never be changed by any agent.

---

## What the App Will Look Like (Timer Screen Reference)

The primary screen is a dark mobile UI with:
- "doser" wordmark (Unbounded font-light, lowercase) top left
- "TIMING AWARENESS" subtitle in purple below it
- Flashlight button + substance selector (GBL/BDO) top right
- Two stat cards: LAST ENTRY and SESSION TOTAL
- Large ring timer (conic-gradient, yellow-green active arc)
  - Shows WAIT or SAFE state
  - Countdown timer in large monospace font
  - "next window" time below
- Swipeable carousel with 6 cards:
  1. Timer ring (main)
  2. Today summary
  3. Current State (PEL gauge)
  4. Past 12 Hours
  5. Forecast (PEL bell curve)
  6. Session Compare
- Dose card at bottom: minus/amount/plus, scale picker, LOG ENTRY button
- Bottom nav: Insights / History / Timer / Tools / Settings

Full visual spec with exact pixel values and colors is in docs/HANDOFF.md Section 5-6.

---

## Known Issues / Watch Out For

- Cursor keeps creating its own branches despite the rule. Always start prompts with:
  "Do not create a new branch. Run git branch first and work only on that branch."

- postcss.config needs .cjs extension (not .js) because package.json has "type": "module"

- Tailwind v3 — do not let any agent upgrade this or suggest v4

- The tsconfig.app.json uses paths without baseUrl (TypeScript 6 compatible) — do not add baseUrl back

- The .env file is gitignored and must never be committed. .env.example is committed
  as a template with placeholder values only.

- PWA install prompt is blocked in incognito — always test in a standard browser session

- Weight and dose number inputs have a decimal auto-format bug when typing — fixed in
  onboarding via raw string state + parse on blur. Apply same pattern to any future
  numeric inputs.

- SERVICE WORKER CACHING TRAP (cost hours in the 2026-06-09 session): VitePWA uses
  registerType: 'autoUpdate'. A past production preview registered a service worker on
  localhost that then served a FROZEN cached build over the dev server — code changes
  did not appear no matter how many times the page was refreshed. Symptoms: edits
  confirmed in the served module via curl, but the browser shows old UI. Fixes:
  (a) run the dev server on a fresh port that never had a SW, and/or
  (b) DevTools > Application > Service Workers > Unregister, then Clear site data.
  Permanent fix: stop committing dist/ and consider disabling PWA in dev.

- TAILWIND JIT STALENESS: changing an arbitrary Tailwind class value (e.g.
  rounded-[28px] -> rounded-[22px]) sometimes does NOT regenerate the CSS rule on a
  long-running dev server — the element's class changes but the old CSS rule is still
  applied. For critical, frequently-tuned values (ring size, radius, font size) prefer
  inline style={{ ... }} with CSS values (clamp() is allowed for ring/gauge sizing per
  HANDOFF.md). This is why TimerRingCard sizing uses inline styles, not Tailwind.

- 3D CAROUSEL PERSPECTIVE: the cube faces use translateZ(depthPx); the rotating stage
  MUST also use translateZ(-depthPx) so the active face lands at z=0. Without it the
  front face is magnified ~1.5x (rings/cards look zoomed and corners get clipped by the
  viewport's overflow-hidden). Do not remove the stage translateZ(-depthPx).

---

## How to Help Preston

Preston communicates with typos, abbreviations, and frustration. Interpret intent,
do not ask for clarification unless genuinely blocked.

Output style: direct, no preamble, no summary after delivering output.
When writing Cursor prompts: always start with the branch rule, then @HANDOFF.md,
then clear specific instructions.
If the task depends on screenshots or visual comparison, keep those assets in
`docs/ai-reference/` and reference those repo paths in the prompt.
Reference screenshots are directional only unless the user explicitly approves a
theme change or close copy. They do not authorize new fonts, new capitalization
patterns, off-system colors, or a different product feel.
When reviewing CodeRabbit output: read from Gmail connector, categorize by
severity, tell Preston exactly which to fix and which to ignore.
When something goes wrong: use Windows MCP and Claude in Chrome MCP to fix it
directly rather than giving Preston instructions to follow.
