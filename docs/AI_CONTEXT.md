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

Last updated: 2026-06-07

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
  Firestore dose persistence (feat/dose-persistence): IN REVIEW

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
  - Firestore security rules updated (Phase 4 start)
  - Dose persistence to Firestore: implemented but CodeRabbit flagged 5 issues

  IN PROGRESS (feat/dose-persistence branch):
  - Fix 5 CodeRabbit issues on dose persistence (2 critical, 3 polish)
  - Critical Issue 1: isInitialLoadRef check order blocks first dose save
  - Critical Issue 2: Delete support not implemented (deleted doses reappear)
  - Polish Issue 3: Batch limit (500 ops) needs chunking
  - Polish Issue 4: No validation on write
  - Polish Issue 5: Hardcoded substance allowlist

  SKIPPED / DEFERRED:
  - Carousel Cards 2–6 are placeholder shells
  - Flashlight button: visual only, no functionality
  - Tab navigation: clicking other tabs does nothing yet

PHASE 4 — History + Insights: NOT STARTED
  First task: Merge dose persistence (after CodeRabbit issues fixed)
  Then: Design + build History screen
  Then: Wire carousel cards 2–6
  Then: Build Insights screen

PHASE 5 — Tools + Settings: NOT STARTED

---

## Key Documents in This Repo

docs/HANDOFF.md — Full technical spec for Cursor agents. Design system, visual spec,
  PEL engine documentation, data model, all agent rules. Every Cursor task starts
  with @HANDOFF.md.

docs/MY_CHECKLIST.md — Preston's plain-English step-by-step process for every task.
  Branch creation, Cursor prompt template, PR process, CodeRabbit review, merge,
  cleanup. Read this to understand the workflow.

docs/AI_CONTEXT.md — This file. The first thing any AI assistant should read to
  understand the full project state before helping.

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

---

## Design System Summary

**For complete design rules, see HANDOFF.md Section 2b (Design System Rules).**
That section is the authoritative reference and must be read by every agent building new screens.

Quick reference:
- Dark only. Flat. Clinical-adjacent. No shadows, gradients, or glassmorphism.
- Reference apps: Apple Health, Oura, Whoop.
- Always use CSS variables — never hardcode hex.
- Use Tailwind for structure/layout only — never for colors.

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

---

## How to Help Preston

Preston communicates with typos, abbreviations, and frustration. Interpret intent,
do not ask for clarification unless genuinely blocked.

Output style: direct, no preamble, no summary after delivering output.
When writing Cursor prompts: always start with the branch rule, then @HANDOFF.md,
then clear specific instructions.
When reviewing CodeRabbit output: read from Gmail connector, categorize by
severity, tell Preston exactly which to fix and which to ignore.
When something goes wrong: use Windows MCP and Claude in Chrome MCP to fix it
directly rather than giving Preston instructions to follow.
