# Doser 2.0 — Cursor Handoff Packet

## How to use this file
At the start of every coding-agent task, include `@HANDOFF.md` so the agent gets full
context before writing code.

If the task is visual, pair this with screenshots from:

- `docs/ai-reference/current-app-state/`
- `docs/ai-reference/goal/`

Do not rely on `Downloads` or other machine-specific paths.

NEVER DEVIATE FROM THE CURRENT APP THEME.

---

## 1. Project Overview

App name: Doser
URL: usedoser.com
Type: PWA distributed outside app stores
Stack: React + TypeScript + Vite + Tailwind CSS v3 + Firebase Auth + Firestore

Purpose:

- harm reduction tool for GBL, BDO, and GHB users
- safe interval timing
- dosing pattern tracking
- perceived effect level calculation

It is not a medical device. It does not guarantee safety.

---

## 1a. Human Workflow Rules

Preston does not code. He is the middle man.

The intended workflow is:

- advisor agent reads the repo, decides what to do, and writes the exact prompt
- Preston pastes that prompt into Cursor or another coding agent
- coding agent reads code, makes edits, and runs validation
- Preston tests in browser or on device
- advisor reviews the result and decides the next step

If you are reading this as an advisor:

- do not assume Preston knows technical terms
- give plain-English instructions
- tell him exactly what command to run and what success looks like

If you are reading this as a coding agent:

- do the code work
- do not ask Preston to make code decisions you can answer from the repo
- do not create or switch branches

---

## 2. Design System

### Aesthetic

- dark only
- no light mode
- flat design
- no decorative drop shadows
- no glassmorphism
- clinical-adjacent minimalism
- current app theme is the source of truth

### Capitalization Rule

- `doser` is the only intentionally lowercase brand word
- all other labels and headings must stay consistent

### Typography

- wordmark `doser`: Unbounded 300
- timer digits / large values: `var(--font-display)` = Antonio 200
- headers / section titles: `var(--font-heading)` = Montserrat 600/700
- body / labels / buttons: `var(--font-body)` = Inter 400/500/600

## 2b. Design System Rules (Authority)

### Color Tokens

Use only CSS variables from `src/index.css`.

- `var(--color-ring)`
- `var(--color-action)`
- `var(--color-load)`
- `var(--app-bg)`
- `var(--app-surface)`
- `var(--app-text)`
- `var(--app-dim)`
- `var(--app-faint)`
- `var(--app-divider)`

Never hardcode hex values in components.

### Layout

- use Tailwind for structure and spacing only
- use CSS variables for color
- use Flexbox or Grid with `gap`

### Components

- card radius: `16px`
- icon button radius: `10px`
- primary button radius: `14px`
- no shadows
- no gradients

### Copy Rules

- buttons and labels: uppercase where the app already uses uppercase
- descriptive text: sentence case
- always include units
- no emoji

### Animation

- opacity-first transitions
- 150ms or 300ms
- standard ease-in-out curve

---

## 3. Git Workflow

Branch rule:

- Preston creates the branch before the coding-agent task starts
- the coding agent must not create, rename, or switch branches

Required first command:

`git branch --show-current`

If the current branch is not the branch Preston said to use, stop and report that.

Per-task flow:

1. coding agent verifies branch
2. coding agent implements one scoped task
3. Preston tests
4. after approval, coding agent commits and pushes
5. Preston opens PR
6. CodeRabbit comments are handled
7. merge only after review and testing

---

## 4. App Architecture

Entry flow:

1. Gate
2. Auth
3. Onboarding
4. Main app shell

Tabs:

- Insights
- History
- Timer
- Tools
- Settings

---

## 5. Current Branch Reality

### What is on `main`

- Phase 5 core Tools and Settings work is merged
- local-only access follow-up is merged at `88d8446`
- local-only mode exists
- explicit local-only -> account upgrade decision does not exist yet

### What is on `feat/real-notifications-v1`

This branch is in progress and not merged.

Branch additions:

- real browser notification permission surface in Settings
- Firebase web push token sync for signed-in browsers
- custom Workbox service worker in `src/sw.ts`
- Firebase Functions package in `functions/`
- notification timing helpers in `src/lib/notifications.ts`
- real backend scheduling logic for:
  - dose due reminder
  - missed-dose alert
  - daily summary
  - stash low alert
- session auto-end timing aligned to preferred interval + 3 hours
- fake dose logged confirmation UI removed from onboarding/settings
- honest local-only copy saying background notifications require an account

### What is not yet proven

Do not say notifications are working end to end yet.

The code exists, but real background delivery is not yet confirmed because:

- no full signed-in phone/PWA test was completed
- the service-worker change made the in-app browser automation unreliable during testing
- the Firebase Functions package still needs real deploy-and-device verification

The honest phrase is:

- implementation exists
- build passes
- real delivery is not yet confirmed

---

## 6. Product Rules For Notifications V1

These decisions are fixed on the notifications branch:

- missed-dose alert is a separate toggle
- missed-dose alert happens 1 hour after redose eligibility
- session auto-end follows 3 hours after redose eligibility
- daily summary stays simple
- stash low alert fires only when crossing into the low state
- no dose logged confirmation feature in this branch
- no fake open-app-only notification solution

---

## 7. PWA / Notification Infrastructure

Current PWA setup:

- `vite-plugin-pwa`
- custom bundled service worker at `src/sw.ts`
- explicit service worker registration in `src/main.tsx`
- Firebase web push through `src/lib/pushRegistration.ts`
- Firebase Functions backend in `functions/`

Required env for real push:

- `VITE_FIREBASE_VAPID_KEY`

Required real-world validation before claiming success:

- grant permission in a signed-in browser
- verify token stored under `users/{uid}/notificationDevices/{deviceId}`
- verify notifications actually arrive on device

---

## 8. Data Model Notes

Firestore currently stores:

- `users/{uid}` profile data
- `users/{uid}/doses` dose data
- `doseContexts` on the user document

Notifications branch additionally stores:

- `users/{uid}/notificationDevices/{deviceId}`

That browser-device document is used for push delivery.

Do not invent a different backend path unless Preston explicitly approves it.

---

## 9. What The Coding Agent Must Read First

Before writing code, read:

- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md`
- `docs/STRUCTURE.md`

If visual work is involved, also read:

- `docs/ai-reference/README.md`

If working on notifications, also inspect:

- `src/components/settings/NotificationsScreen.tsx`
- `src/components/onboarding/NotificationBasics.tsx`
- `src/lib/notifications.ts`
- `src/lib/pushRegistration.ts`
- `src/sw.ts`
- `functions/src/index.ts`
- `src/store/profileStore.ts`
- `src/components/MainApp.tsx`

---

## 10. Agent Rules

### Coding agent rules

Before writing any code:

1. read the relevant files first
2. do not guess names or paths
3. do not invent fake data
4. do not silently resolve errors

While working:

5. do not change the current theme
6. do not modify files outside the task scope
7. do not rewrite working code unless required
8. do not touch `src/lib/perceivedEffect/`
9. do not create or switch branches

Validation:

10. run:
    - `npx tsc --noEmit -p tsconfig.app.json`
    - `npm run build`
11. if notifications backend changed, also run:
    - `npm run build` inside `functions/`

Report back:

12. current branch
13. files changed
14. what changed
15. what is still unverified
16. validation output

### Advisor rules

If you are the advisor instead of the coding agent:

- do not write repo code yourself by default
- write one focused coding prompt at a time
- make Preston's next step obvious
- translate technical results into plain English
- do not oversell partial verification

---

## 11. What Not To Touch

- `src/lib/perceivedEffect/`
- unrelated visual redesign work
- unrelated Tools / Settings screens
- existing tokens in `src/index.css` may be added to, never removed or renamed
- `src/types.ts` add only, never rename existing types

Do not quietly turn the notifications branch back into a fake settings-only feature.

---

## 12. Next Likely Work

Two parallel truths matter:

### Still missing on `main`

- explicit local-only -> account upgrade decision

### Still missing on `feat/real-notifications-v1`

- deploy the Firebase Functions package
- confirm VAPID key is present
- manually test real signed-in browser/PWA delivery
- verify each notification path on device
- then fix any issues found in real testing

---

## 13. Report-Back Standard

When finishing a task, the coding agent should tell Preston:

1. current branch
2. exact files changed
3. what changed step by step
4. what still needs testing
5. exact validation results
6. whether the feature is fully verified or only partially implemented
