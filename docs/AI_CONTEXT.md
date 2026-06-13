# Doser 2.0 — AI Context Document
# Read this first before anything else in any conversation about this project.

---

## What This Project Is

Doser is a harm reduction PWA for GBL, BDO, and GHB users. It helps users track dose
timing, review session patterns, and estimate perceived effect level so they can make
safer redosing decisions.

It is not a medical device. It does not guarantee safety. It is intentionally
distributed outside app stores at `usedoser.com`.

Preston is the solo builder and product owner. He does not code directly. He uses:

- an advisor agent for planning, review, prompts, and handoff quality
- Cursor for the actual code changes

Preston has no coding background. Any agent helping him must spell out every step in
plain English and must not assume technical knowledge.

---

## Repository

GitHub: https://github.com/prestonsokol1130/doser
Local path: `C:\Users\Preston Sokol\Projects\doser 2.0\doser`

Stack:

- React
- TypeScript
- Vite
- Tailwind CSS v3
- Firebase Auth
- Firestore
- vite-plugin-pwa / Workbox

Code review:

- CodeRabbit is connected and reviews PRs automatically

Current git state when this file was last updated:

- `main` contains PR `#8`, the merged local-only follow-up from PR `#10`, and the
  explicit local-only upgrade decision from PR `#11`
- `main` HEAD when this file was last updated: `242463e feat: add explicit local-only upgrade decision (#11)`
- No active feature branch should be assumed from this file alone

---

## Current Build Status

Last updated: 2026-06-12

### Phase 1 — Foundation: COMPLETE

- Clean Vite + React + TS + Tailwind scaffold merged
- Global CSS variables and Google fonts locked in
- Firebase project connected
- Firestore database created
- `.env` stays local and gitignored

### Phase 2 — Gate + Auth + Onboarding: COMPLETE

- PR `#1` — gate flow merged
- PR `#2` — auth flow merged
- PR `#3` — onboarding merged

### Phase 3 — Timer + Persistence: COMPLETE

- PR `#4` — timer screen merged
- PR `#5` — dose persistence merged

Live capabilities:

- Timer screen
- Substance switching
- Dose logging
- Perceived effect integration
- Dose persistence to Firestore
- Dose validation on load and save

### Phase 4 — History + Carousel: COMPLETE

- PR `#7` merged to `main`
- History screen built
- Carousel cards 2–6 wired to real data
- 3D cube transition merged

### Phase 5 — Tools + Settings: CORE COMPLETE

PR `#8` merged to `main` on 2026-06-12.

Merged deliverables:

- `Tools` tab hub
- `Stash`
- `Dose Buddy`
- `Taper`
- `Emergency Resources`
- `Safety Reference`
- `Settings` tab hub
- `Account`
- `Profile`
- `Notifications`
- `Themes`
- `Install App`
- `Legal`

Merged supporting work:

- `MainApp.tsx` now owns shared app state across Timer, History, Tools, and Settings
- Dose contexts persist alongside profile and doses
- `src/lib/stash.ts`, `src/lib/taper.ts`, `src/lib/doseBuddy.ts` added
- Profile types extended for Stash, Taper, Dose Buddy, notifications, and theme
- `authStore.ts` includes sign-out support for the Account screen

Phase 5 refinements that are already merged:

1. Theme rollback
   - The off-theme Tools / Dose Buddy / Stash drift was removed
   - Current app theme was restored
   - Goal images are directional only, not permission for a new visual system

2. Stash redesign
   - Stash hero uses the horizontal liquid-tank layout
   - Inline refill controls, stat pills, quick chips, and accelerated stepper are live

3. Stash data model fix
   - `StashPrefs.fullMl` now stores the tank's 100 percent visual reference
   - `capacityMl` is no longer forced to act as both current amount and denominator
   - Legacy profiles fall back through `stashFullMl()`

4. Stash animation follow-up fixes
   - The earlier rejected slosh pass was replaced during iteration
   - Follow-up fixes merged:
     - keyframe names normalized to kebab-case
     - duplicate SVG wave path removed from the reference HTML
     - fill-control buttons in the reference HTML explicitly use `type="button"`

5. Dose Buddy mobile cleanup
   - Start-session / redose check-in sheet was tightened for small screens
   - "Why this suggestion" stays collapsed until opened
   - Mobile height was capped more carefully

6. Accessibility and review fixes
   - `NavRow` decorative chevron hidden correctly from screen readers
   - `NavRow` keyboard focus state added
   - Install prompt dismissal now shows user feedback
   - Shared validation constants moved into `src/types.ts`
   - `MainApp.tsx` profile persistence guard fixed so profile saving is enabled only after a successful load

### Post-Phase-5 Follow-up — Local-Only Access: COMPLETE AND MERGED

Merged to `main` through commits:

- `dc81679 feat: add local-only access mode`
- `e953675 refactor: enhance local-only mode handling and improve dose context sanitization`
- `88d8446 fix: wrap up local-only access flow`

Delivered behavior:

- Log in screen offers `Continue on this device`
- Device-only mode can complete onboarding without Firebase auth
- Profile, doses, and dose contexts persist locally in `localStorage`
- Main app reads and writes local state when device-only mode is active
- `Settings` -> `Account` shows device-only status and a path back to the auth screen
- Local onboarding save now rolls back the profile write if the onboarding-complete flag fails to persist

Current limitation:

- There is still no migration/import flow from local-only data into a signed-in Firebase account

### Post-Phase-5 Follow-up — Local-Only Upgrade Decision: COMPLETE AND MERGED

Merged to `main` via PR `#11` at `242463e`.

Delivered behavior:

- When a device-only user with local data completes auth, `src/App.tsx` pauses at a
  `local-upgrade` phase instead of silently switching storage models
- `src/components/auth/LocalOnlyUpgradeDecision.tsx` explains that local-only and
  account storage are separate and nothing has been moved, deleted, or merged
- The user can choose `Use account storage` or `Stay on this device`
- Choosing account storage clears local-only mode and continues into the signed-in flow;
  local-only data remains on the device for later import
- Choosing stay on device signs out and returns to device-only mode with local data intact
- `src/store/localSessionStore.ts` tracks the local-only auth flow so the handoff is
  explicit from `Settings` -> `Account` -> sign-in as well

Review outcome from the merge:

- All 3 actionable CodeRabbit review issues on PR `#10` were resolved before merge
- The remaining `Docstring Coverage` note was a warning inside the PR comment, not
  a blocking required check

### Live tab state right now

- `Timer` — live
- `History` — live
- `Tools` — live
- `Settings` — live
- `Insights` — live (Peer Comparison tab still deferred)

---

## Immediate Next Work

There is no active core-phase rebuild right now. The next likely work is finishing and
verifying real notifications end to end, then refinement.

Priority order unless Preston changes it:

1. Finish and verify real notifications end to end
   - Work continues on `feat/real-notifications-v1` (not merged to `main`)
   - Implementation exists and builds pass, but real signed-in browser/PWA delivery has
     not been confirmed on a real device yet
   - Do not describe notifications as working until manual device testing proves delivery

2. Tools / Settings redesign intake
   - Preston has external reference material from `Doser Scroll Animations.zip`
   - Those references are not yet safely normalized into the repo
   - Before any visual Cursor task, approved screenshots or mockups must be copied into:
     - `docs/ai-reference/goal/`
   - Do not rely on `Downloads` paths in prompts

3. Local-only -> account migration/import (deferred)
   - The explicit upgrade decision is complete on `main` via PR `#11`
   - A future task may add import/migration from local-only data into a signed-in account
   - Do not silently merge local data into cloud data

4. Tools hub refinement
   - Start with `src/components/tools/ToolsScreen.tsx`
   - Keep the existing theme
   - Keep sub-screen logic intact
   - Treat this as a hub-layout / presentation pass, not a rewrite of Stash, Dose Buddy, or Taper

5. Settings hub refinement
   - After Tools hub
   - Same rules: hub-only first, preserve logic, preserve theme

Still deferred:

- Push notification delivery beyond settings UI
- Insights Peer Comparison tab (opt-in anonymous comparison — UI stub only)
- Dose Buddy peer comparison / local peer contribution feature
- Dose Buddy contexts wiring into other analytics surfaces beyond current use

Validation snapshot from the latest local-only wrap-up:

- `npx tsc --noEmit -p tsconfig.app.json` passes
- `npm run build` passes
- `npm run lint` still fails on pre-existing repo-wide issues in:
  - `src/components/settings/InstallAppScreen.tsx`
  - `src/components/settings/ProfileSettingsScreen.tsx`
  - `src/components/tools/DoseBuddyControls.tsx`
  - `src/components/tools/DoseBuddyScreen.tsx`
  - `src/components/tools/StashScreen.tsx`

---

## Key Documents in This Repo

`docs/AI_CONTEXT.md`
- Current-state truth source

`docs/HANDOFF.md`
- Technical and design rules
- Section `2b` is the design-system law

`docs/STRUCTURE.md`
- Real file tree and wiring map

`docs/CODEX_OPERATING_MANUAL.md`
- Advisor-role manual for Codex-style sessions

`docs/CLAUDE_CODE_OPERATING_MANUAL.md`
- Backup advisor-role reference in the same spirit

`docs/MY_CHECKLIST.md`
- Preston's step-by-step workflow

`docs/NEXT_AGENT_PROMPT.md`
- The next likely Cursor task brief

`docs/ai-reference/README.md`
- Rules for repo-owned screenshots and mockups

---

## How the Workflow Works

Every task should follow this pattern:

1. Preston creates the branch himself from `main`
2. Preston opens a brand-new Cursor chat
3. Advisor writes one focused Cursor prompt
4. Cursor reads the docs and code first
5. Cursor asks questions if blocked
6. Cursor changes code and runs validation
7. Preston tests in the browser
8. Advisor reviews the result
9. Cursor commits and pushes
10. Preston opens the PR
11. CodeRabbit review is handled before merge
12. After merge, docs are updated so the next session starts clean

Important workflow rules:

- Cursor never creates branches
- One task per Cursor chat
- Prompts must use exact file paths
- Visual prompts must use repo-owned screenshots only
- If a visual pass drifts off-theme, rollback comes before any new design work

---

## Tech Decisions Made

### Firebase over Supabase

The project switched away from Supabase during early work. Firebase Auth and
Firestore are the current backend stack. Do not write new docs or prompts that
describe this app as Supabase-based.

### PEL over pharmacokinetic math

The app uses perceived effect level, not concentration math. The subjective model is
intentional and must not be rewritten.

### PWA only

This is a web app, intentionally distributed outside app stores.

### Stash model

`StashPrefs` intentionally separates:

- `capacityMl` = current on-hand baseline
- `fullMl` = the 100 percent tank reference
- `refillAt` = timestamp after which consumption counts against the current stash

This separation is required so the tank can visually deplete correctly after refill.

### Accent tints

New translucent accent treatments must use `color-mix(...)` with design tokens rather
than hardcoded rgba values.

---

## Design System Summary

`docs/HANDOFF.md` Section `2b` is the authority.

Short version:

- dark only
- flat
- no gradients
- no glassmorphism
- no decorative shadows
- CSS variables only
- Tailwind for structure and spacing, not raw color decisions
- only `doser` is lowercase
- never drift away from the established product feel

Font summary:

- `--font-display` = Antonio for big numbers
- `--font-heading` = Montserrat for section titles and headers
- `--font-body` = Inter for UI text
- Unbounded only for the `doser` wordmark

---

## The PEL Engine

Critical rule:

- Do not rewrite `src/lib/perceivedEffect/`

This folder contains hand-tuned subjective intensity modeling. Its calibration values
and behavior are intentional.

---

## Known Issues / Watch Outs

- Service worker caching on localhost can make the browser show stale UI
- Tailwind JIT can keep stale arbitrary-value utilities on long-lived dev sessions
- Insights Peer Comparison tab is still a deferred stub inside the live Insights screen
- The repo's screenshot library is incomplete for current Tools / Settings state
  - existing `current-app-state` images are historical wrong-theme references, not fresh truth captures
  - fresh current UI screenshots should be added before future visual-review tasks
- `npm run lint` still has pre-existing failures in:
  - `src/components/settings/InstallAppScreen.tsx`
  - `src/components/settings/ProfileSettingsScreen.tsx`
  - `src/components/tools/DoseBuddyControls.tsx`
  - `src/components/tools/DoseBuddyScreen.tsx`
  - `src/components/tools/StashScreen.tsx`

---

## How to Help Preston

- Interpret typos and frustration by intent, not literally
- Ask clarifying questions only when genuinely needed
- Do not assume technical knowledge
- Be explicit about clicks, commands, file names, and success conditions
- If a task is visual, keep the current theme as law
- If a reference lives outside the repo, move it into `docs/ai-reference/` before using it in prompts
