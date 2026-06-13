# Doser 2.0 — Codebase Structure Reference

Last updated: 2026-06-13

Read this alongside:

- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md`

`docs/HANDOFF.md` Section `2b` is the design authority.

---

## App Entry Flow

```text
main.tsx
  └── App.tsx
        ├── GateLayer
        ├── AuthLayer
        ├── loading spinner
        ├── OnboardingLayer
        └── MainApp
```

Flow:

- gate -> auth -> onboarding -> timer shell on first use
- gate skipped on return visits
- onboarding skipped if Firestore profile already exists
- local-only mode bypasses auth and uses local storage instead of Firestore

Important live gap on `main`:

- `App.tsx` still routes a local-only user straight into signed-in mode once auth appears
- explicit upgrade decision is still missing on `main`

---

## Key Top-Level Files

### `src/main.tsx`

- app entry point
- mounts React app
- explicitly registers the PWA service worker

### `src/App.tsx`

- phase router
- gate/auth/onboarding/main-app chooser
- owns local-only/auth handoff behavior

### `src/index.css`

- global CSS variables
- existing variables must not be removed or renamed

### `src/types.ts`

- shared TypeScript types
- add only, do not rename existing types without explicit instruction

---

## Important Folders

### `src/components/`

- `gate/`
- `auth/`
- `onboarding/`
- `timer/`
- `history/`
- `insights/`
- `tools/`
- `settings/`

### `src/lib/`

- `firebase.ts`
- `notifications.ts`
- `pushRegistration.ts`
- `stash.ts`
- `doseBuddy.ts`
- `taper.ts`
- `perceivedEffect/` ← do not touch

### `src/store/`

- `authStore.ts`
- `gateStore.ts`
- `localDataStore.ts`
- `localSessionStore.ts`
- `profileStore.ts`

### `functions/`

Branch-local notifications backend package.

- `functions/src/index.ts`
- `functions/package.json`
- `functions/tsconfig.json`

### `docs/`

- `AI_CONTEXT.md`
- `HANDOFF.md`
- `STRUCTURE.md`
- `CODEX_OPERATING_MANUAL.md`
- `CLAUDE_CODE_OPERATING_MANUAL.md`
- `MY_CHECKLIST.md`
- `NEXT_AGENT_PROMPT.md`

---

## File Tree (Practical Map)

```text
src/
├── main.tsx
├── App.tsx
├── index.css
├── types.ts
│
├── components/
│   ├── MainApp.tsx
│   ├── gate/
│   ├── auth/
│   ├── onboarding/
│   │   ├── OnboardingLayer.tsx
│   │   ├── NotificationBasics.tsx
│   │   └── ...
│   ├── timer/
│   │   ├── TimerScreen.tsx
│   │   ├── timerUtils.ts
│   │   └── carousel/
│   │       ├── SessionCompareCard.tsx
│   │       └── ...
│   ├── history/
│   ├── insights/
│   ├── tools/
│   └── settings/
│       ├── SettingsScreen.tsx
│       ├── NotificationsScreen.tsx
│       └── ...
│
├── lib/
│   ├── firebase.ts
│   ├── notifications.ts
│   ├── pushRegistration.ts
│   ├── sessionStats.ts
│   ├── stash.ts
│   ├── doseBuddy.ts
│   ├── taper.ts
│   └── perceivedEffect/
│
└── store/
    ├── authStore.ts
    ├── gateStore.ts
    ├── localDataStore.ts
    ├── localSessionStore.ts
    └── profileStore.ts

firebase.json
functions/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts
```

---

## Main App State Ownership

### `src/components/MainApp.tsx`

This is the shared live app shell.

It owns:

- active tab
- profile state
- dose state
- dose context state
- loading state
- ticking `nowMs`
- local-only persistence routing
- signed-in browser push registration sync on the notifications branch

If a feature needs access to shared doses/profile, start here before inventing a new
source of truth.

---

## Notification Branch Structure

If the current branch is `feat/real-notifications-v1`, these files are the main seams.

### Client notification UI

- `src/components/settings/NotificationsScreen.tsx`
  - permission state card
  - real notification toggles
  - honest blocked/missing/account-required states

- `src/components/onboarding/NotificationBasics.tsx`
  - simplified onboarding notification settings
  - local-only limitation copy

### Shared notification logic

- `src/lib/notifications.ts`
  - next dose window calculation
  - due reminder time
  - missed-dose time
  - session auto-end time

### Browser push registration

- `src/lib/pushRegistration.ts`
  - browser support check
  - permission check
  - permission request
  - Firebase web token retrieval
  - Firestore device registration

### Service worker

- `src/sw.ts`
  - Workbox worker
  - Firebase Messaging initialization

### Firebase backend

- `functions/src/index.ts`
  - scheduled Firebase notification sender
  - due reminder
  - missed-dose alert
  - daily summary
  - stash low alert
  - session auto-end markers

### Supporting persistence seams

- `src/lib/firebase.ts`
- `src/store/profileStore.ts`
- `src/store/authStore.ts`

---

## Local-Only Mode Structure

### `src/store/localSessionStore.ts`

- stores whether device-only mode is active

### `src/store/localDataStore.ts`

- stores local-only profile
- stores local-only doses
- stores local-only dose contexts
- stores local onboarding complete flag

### `src/App.tsx`

- decides whether user goes through auth or local-only path
- current merged gap:
  - no explicit upgrade decision after local-only user signs in

### `src/components/settings/AccountScreen.tsx`

- device-only users can go back to auth from here

---

## Firestore Shape That Matters

Current important collections/documents:

- `users/{uid}`
  - `profile`
  - `doseContexts`
- `users/{uid}/doses/{doseId}`

Notifications branch adds:

- `users/{uid}/notificationDevices/{deviceId}`

Do not assume more exists without reading the live code first.

---

## Validation Map

Web app validation:

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

Notifications backend validation:

- in `functions/`: `npm run build`

Manual verification still required on notifications branch:

- signed-in browser permission flow
- real device/PWA delivery
- function deploy-backed end-to-end testing

---

## High-Risk Files

Do not modify casually:

- `src/lib/perceivedEffect/*`
- `src/index.css` existing variables
- `src/types.ts` existing types

Be careful with:

- `src/App.tsx`
- `src/components/MainApp.tsx`
- `src/store/profileStore.ts`
- `src/lib/sessionStats.ts`
- `src/sw.ts`
- `functions/src/index.ts`

---

## Reality Check For Future Agents

The notifications branch has real architecture now, but not full real-world proof.

If you are continuing `feat/real-notifications-v1`, your first questions should be:

1. Is the Firebase Functions package deployed?
2. Is `VITE_FIREBASE_VAPID_KEY` present locally?
3. Has a signed-in real-device test been completed?
4. Which exact flows have actually been observed arriving on device?

If those answers are missing, do not tell Preston the feature is working.
