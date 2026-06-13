# Doser 2.0 — AI Context Document
# Read this first before anything else in any conversation about this project.

---

## What This Project Is

Doser is a harm reduction PWA for GBL, BDO, and GHB users. It helps users track dose
timing, review session patterns, and estimate perceived effect level so they can make
safer redosing decisions.

It is not a medical device. It does not guarantee safety. It is intentionally
distributed outside app stores at `usedoser.com`.

Preston is the solo builder and product owner. He does not code directly.

Preston has no coding experience. Any agent helping on this repo must explain every
step in plain English and must not assume technical knowledge.

---

## Role Model For Future Agents

This repo is built around a three-role workflow. Future agents must follow it exactly
unless Preston explicitly changes the workflow.

### Preston

- product owner
- non-technical middle man
- opens the chats
- pastes prompts between systems
- runs the browser tests when told exactly what to do
- opens PRs and handles GitHub clicks when guided step by step

### Advisor Agent

- reads the docs and the live repo first
- decides what the next task should be
- writes the exact prompt for the coding agent
- reviews the coding agent's output
- tells Preston what to do next in plain English
- keeps the docs current after meaningful changes

The advisor is not allowed to assume Preston knows what a branch, PR, build, service
worker, Firebase Function, or environment variable is. If those terms are used, they
must be explained in plain language.

### Coding Agent

- Cursor is the default coding agent in this repo
- the coding agent reads the code, makes the edits, and runs validation
- the coding agent must work only on the branch Preston already created
- the coding agent must not create, rename, or switch branches

If Claude Code or another system is used instead of Cursor, that agent must be told
explicitly whether it is acting as advisor-only or coding-agent-only for that session.
Do not let one agent drift between both roles without saying so.

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
- OneSignal (web push delivery on the notifications branch)
- Vercel serverless functions (notification scheduler on the notifications branch)

Code review:

- CodeRabbit is connected and reviews PRs automatically

Firebase project:

- `doser-e389f`

Auth methods enabled:

- Email/Password
- Google

Current merged baseline on `main`:

- `main` contains Phase 5 core Tools and Settings work from PR `#8`
- `main` also contains the local-only follow-up merged at commit `88d8446` (PR `#10`)
- `main` also contains the explicit local-only upgrade decision from PR `#11`
- `main` HEAD when this file was last updated: `242463e feat: add explicit local-only upgrade decision (#11)`

Current active branch during this doc update:

- `feat/real-notifications-v1`

Do not assume any future session is still on that branch. Always verify the live repo.
No active feature branch should be assumed from this file alone.

---

## Current Build Status

Last updated: 2026-06-13

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

- `MainApp.tsx` owns shared app state across Timer, History, Tools, and Settings
- Dose contexts persist alongside profile and doses
- `src/lib/stash.ts`, `src/lib/taper.ts`, `src/lib/doseBuddy.ts` added
- Profile types extended for Stash, Taper, Dose Buddy, notifications, and theme
- `authStore.ts` includes sign-out support for the Account screen

Phase 5 refinements already merged:

1. Theme rollback
   - The off-theme Tools / Dose Buddy / Stash drift was removed
   - Current app theme was restored
2. Stash redesign
   - Stash hero uses the horizontal liquid-tank layout
   - Inline refill controls, stat pills, quick chips, and accelerated stepper are live
3. Stash data model fix
   - `StashPrefs.fullMl` stores the 100 percent reference
   - `capacityMl` is no longer forced to do two jobs
4. Dose Buddy mobile cleanup
   - Start-session / redose sheet was tightened for smaller screens
5. Accessibility and follow-up fixes
   - keyboard focus and review fixes were merged

### Post-Phase-5 Follow-up — Local-Only Access: COMPLETE AND MERGED

Merged to `main` through:

- `dc81679 feat: add local-only access mode`
- `e953675 refactor: enhance local-only mode handling and improve dose context sanitization`
- `88d8446 fix: wrap up local-only access flow`

Delivered behavior on `main`:

- Log in screen offers `Continue on this device`
- Device-only mode can complete onboarding without Firebase auth
- Profile, doses, and dose contexts persist locally in `localStorage`
- Main app reads and writes local state when device-only mode is active
- `Settings -> Account` shows device-only status and a path back to auth
- Local onboarding save rolls back if the onboarding-complete flag fails to persist

Known gap still on `main`:

- there is still no migration/import flow from local-only data into a signed-in account

Important prior seam (before PR `#11`):

- `src/App.tsx` previously cleared local-only mode and routed forward as soon as a
  Firebase auth session existed

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

### Live Tab State On `main`

- `Timer` — live
- `History` — live
- `Tools` — live
- `Settings` — live
- `Insights` — live
- `Insights -> Peer Comparison` — still deferred

---

## Branch In Progress — `feat/real-notifications-v1`

This branch is in progress. It is not merged to `main`.

### Goal Of This Branch

Build the first real notification system using the existing Firebase stack instead of
leaving notifications as settings-only UI.

### What Was Added On This Branch

Client-side additions:

- `src/components/settings/NotificationsScreen.tsx`
  - adds a real browser-permission status card
  - shows honest states:
    - account required
    - browser not supported
    - push config missing
    - browser notifications blocked
    - browser notifications on
  - adds a visible `Missed-Dose Alert` toggle
  - removes the fake `Dose Logged Confirmation` toggle
- `src/components/onboarding/NotificationBasics.tsx`
  - removes the fake confirmation toggle
  - tells local-only users that background notifications require an account
- `src/components/MainApp.tsx`
  - syncs push registration for signed-in users
- `src/store/authStore.ts`
  - removes the browser push target on sign-out
- `src/main.tsx`
  - explicitly registers the service worker
- `src/lib/pushRegistration.ts`
  - handles browser permission checks
  - requests permission
  - initializes the OneSignal web SDK and calls `OneSignal.login(uid)`
  - no token stored in Firestore — OneSignal manages device registration internally
- `src/lib/firebase.ts`
  - exports `firebaseApp` for Firebase Auth and Firestore
- `src/sw.ts`
  - custom bundled Workbox service worker
  - handles caching only; no Firebase Messaging

Timing / notification logic additions:

- `src/lib/notifications.ts`
  - centralizes:
    - next dose window calculation
    - dose due reminder time
    - missed-dose alert time
    - session auto-end time
- fixed product rules implemented:
  - missed-dose alert = 1 hour after redose eligibility
  - session auto-end timing = 3 hours after redose eligibility
- `src/lib/sessionStats.ts`
  - current session now ends using the new preferred-interval-plus-3-hours rule
- `src/components/timer/TimerScreen.tsx`
- `src/components/timer/carousel/SessionCompareCard.tsx`
- `src/lib/doseBuddy.ts`
  - updated to use the new current-session signature

Backend additions:

- `api/notify.ts` — Vercel serverless function (replaces the Firebase Functions scheduler)
- `vercel.json` — cron configuration for the Vercel function

The new Vercel serverless function runs as a cron job and sends notifications for:

- dose due reminder
- missed-dose alert
- daily summary
- stash low alert

The same scheduled backend also records session auto-end timing markers, even though
there is not yet a richer explicit session document model in Firestore.

### Notification Behavior Intended By This Branch

For signed-in account users with push permission granted:

1. Dose due reminder
   - uses the saved lead time
   - sends before the next window opens
2. Missed-dose alert
   - separate toggle
   - sends 1 hour after the user became eligible to redose
3. Session auto-end
   - no separate toggle
   - follows the missed-dose timeline
   - session is treated as inactive 3 hours after redose eligibility
4. Daily summary
   - uses the saved time
   - first version includes:
     - doses today
     - total mL today
     - last dose time
5. Stash low alert
   - uses the saved threshold
   - fires only when crossing into the low state

### What Is Honest To Say Right Now

The code path is built.

It is **not yet honest to say notifications are confirmed working in real use**.

Why:

- full real end-to-end phone/PWA delivery has not been verified yet
- the in-app browser automation became unreliable after the new service worker took
  over the local preview tab
- no completed manual signed-in phone test was captured during this branch work

So the truthful status is:

- implementation exists
- build passes
- backend package builds
- real delivery is not yet confirmed end to end

### Validation Completed On This Branch

- `npx tsc --noEmit -p tsconfig.app.json` passes
- `npm run build` passes
- `npm run build` inside `functions/` passes
- local preview endpoint returned HTTP `200`

### Validation Still Missing Before Anyone Claims It Works

These checks still need to be performed manually on a real signed-in browser/PWA,
preferably on phone:

1. confirm browser permission prompt behaves correctly
2. confirm the OneSignal dashboard shows a registered subscriber for the user
3. confirm dose due reminder reaches the device
4. confirm missed-dose alert reaches the device
5. confirm daily summary arrives at the chosen time
6. confirm stash low alert arrives only on threshold crossing
7. confirm users with notifications off do not receive those alerts
8. confirm signed-out browsers stop receiving account notifications

### Environment / Deploy Prerequisites For This Branch

The following must exist for real delivery:

- root app env must include:
  - `VITE_ONESIGNAL_APP_ID`
- Vercel serverless function at `api/notify.ts` must be deployed
- server env must include `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`, Firebase admin vars, and `CRON_SECRET`
- cron-job.org must be configured to call `POST https://usedoser.com/api/notify` every minute

If the OneSignal app ID is missing, the UI tells the truth and says push setup is missing.

### Important Warnings For Future Agents

- Do not tell Preston "notifications work" unless a real device test proves it
- Do not treat a successful build as proof of delivery
- Do not quietly switch this branch back to settings-only language
- Do not remove the honest blocked/missing states from the Notifications screen
- Do not claim local-only users get real background notifications in this version
- Do not silently merge this branch with local-only upgrade work unless Preston
  explicitly wants the branches combined

---

## Immediate Next Work

There are now two distinct tracks.

There is no active core-phase rebuild right now. The next likely work is finishing and
verifying real notifications end to end, then refinement.

### Track A — Completed on `main` (PR `#11`)

Explicit local-only -> account upgrade decision

- device-only users now get a clear stop-and-explain handoff after auth
- no silent merge
- no silent delete
- no silent overwrite

### Track B — Still needed on `feat/real-notifications-v1`

Finish and verify real notifications end to end

- Work continues on `feat/real-notifications-v1` (not merged to `main`)
- Implementation exists and builds pass, but real signed-in browser/PWA delivery has
  not been confirmed on a real device yet
- Do not describe notifications as working until manual device testing proves delivery

### Track C — Deferred follow-ups after notifications

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

Required next steps:

1. deploy the Vercel function and confirm `api/notify.ts` is live
2. confirm OneSignal env vars are present (`VITE_ONESIGNAL_APP_ID`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`)
3. manually test the notification flows on a real signed-in browser/PWA
4. fix anything discovered during real delivery testing
5. only after that, describe notifications as working

### Still Deferred

- `Insights -> Peer Comparison`
- Dose Buddy peer comparison / local peer contribution
- broader reuse of Dose Buddy contexts across more analytics surfaces

---

## Key Documents In This Repo

`docs/AI_CONTEXT.md`
- current-state source of truth

`docs/HANDOFF.md`
- technical and design rules
- Section `2b` is design law

`docs/STRUCTURE.md`
- real file tree and wiring map

`docs/CODEX_OPERATING_MANUAL.md`
- advisor workflow manual

`docs/CLAUDE_CODE_OPERATING_MANUAL.md`
- advisor backup manual for Claude-style sessions

`docs/MY_CHECKLIST.md`
- Preston's plain-English workflow checklist

`docs/NEXT_AGENT_PROMPT.md`
- current handoff prompt for the next agent/task

`docs/ai-reference/README.md`
- screenshot and mockup handling rules

---

## Workflow Rules

Every task should follow this pattern:

1. Preston creates the branch himself from `main`
2. Preston opens a brand-new coding-agent chat
3. The advisor writes one focused prompt
4. The coding agent reads docs and code first
5. The coding agent asks questions if blocked
6. The coding agent edits code and runs validation
7. Preston tests in the browser or on device
8. The advisor reviews the result
9. The coding agent commits and pushes after approval
10. Preston opens the PR
11. CodeRabbit comments are handled before merge
12. After merge, docs are updated

Important workflow rules:

- Preston is the middle man
- the advisor explains every step in plain English
- the coding agent does the actual edits
- one task per coding-agent chat
- prompts must use exact file paths
- visual prompts must use repo-owned screenshots only
- if docs and code disagree, prefer the live code and then fix the docs

---

## Tech Decisions Made

### Firebase over Supabase

Firebase Auth and Firestore are the active backend stack. Do not write new docs or
prompts that describe this app as Supabase-based.

### PEL over pharmacokinetic math

The app uses perceived effect level, not concentration math. The subjective model is
intentional and must not be rewritten.

### PWA only

This is a web app intentionally distributed outside app stores.

### Stash model

`StashPrefs` intentionally separates:

- `capacityMl` = current on-hand baseline
- `fullMl` = the 100 percent tank reference
- `refillAt` = timestamp after which consumption counts against the stash

### Notifications branch architecture

On `feat/real-notifications-v1`, notification delivery is being built through:

- browser notification permission
- OneSignal web SDK (replaced Firebase Cloud Messaging — see HANDOFF.md for why)
- a real app service worker (Workbox only; no Firebase Messaging)
- Vercel serverless function at `api/notify.ts` (replaced Firebase Functions)

Do not replace that branch with a fake "only while app is open" version.

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

- `--font-display` = Antonio
- `--font-heading` = Montserrat
- `--font-body` = Inter
- Unbounded only for the `doser` wordmark

---

## The PEL Engine

Critical rule:

- do not rewrite `src/lib/perceivedEffect/`

That folder contains hand-tuned subjective intensity modeling.

---

## Known Issues / Watch Outs

- service worker caching on localhost can make the browser show stale UI
- Tailwind JIT can keep stale arbitrary-value utilities on long-lived dev sessions
- the notifications branch is implemented but not end-to-end confirmed on a real device
- the in-app browser automation became unreliable after service-worker takeover during
  this notifications branch work
- Insights Peer Comparison tab is still a deferred stub inside the live Insights screen
- The repo's screenshot library is incomplete for current Tools / Settings state
  - existing `current-app-state` images are historical wrong-theme references, not fresh truth captures
  - fresh current UI screenshots should be added before future visual-review tasks
- `npm run lint` still has pre-existing failures outside this branch's scope in:
  - `src/components/settings/InstallAppScreen.tsx`
  - `src/components/settings/ProfileSettingsScreen.tsx`
  - `src/components/tools/DoseBuddyControls.tsx`
  - `src/components/tools/DoseBuddyScreen.tsx`
  - `src/components/tools/StashScreen.tsx`

---

## How To Help Preston

- interpret typos and frustration by intent, not literally
- do not assume technical knowledge
- explain steps exactly
- say what to click, what command to run, where to paste, and what success looks like
- if a task is visual, preserve the current theme
- if a reference lives outside the repo, move it into `docs/ai-reference/` before using it
- if a branch is only partially verified, say that plainly instead of overselling it
