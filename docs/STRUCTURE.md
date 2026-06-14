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

Important live state on `main`:

- `App.tsx` pauses at `local-upgrade` when a device-only user with local data completes auth
- explicit upgrade decision is merged via PR `#11` (`LocalOnlyUpgradeDecision.tsx`)
- migration/import from local-only data into a signed-in account is still not built

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

Legacy Firebase Functions package (superseded by `api/notify.ts` on Vercel).

- `functions/src/index.ts`
- `functions/package.json`
- `functions/tsconfig.json`

### `api/`

- `api/notify.ts` — Vercel serverless notification scheduler (OneSignal delivery)

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
├── main.tsx                          Entry point. Mounts App into #root.
│                                     Explicitly registers the PWA service worker.
├── App.tsx                           Phase router. Gate → Auth → Onboarding → MainApp.
│                                     Also owns the local-only/auth handoff.
│                                     When auth succeeds and local-only data exists,
│                                     pauses at `local-upgrade` and renders
│                                     LocalOnlyUpgradeDecision before continuing.
├── App.css                           Unused boilerplate. Do not add styles here.
├── index.css                         Global styles, CSS variables, Google Fonts import.
│                                     DO NOT remove existing variables — other screens use them.
│                                     Add new variables here when a new design token is needed.
├── types.ts                          All shared TypeScript types. Source of truth for:
│                                     Dose, Profile, SubstancePrefs, DoseContext, Substance,
│                                     WeightUnit, HeightUnit, BiologicalSex, FoodState,
│                                     HydrationState, SleepLevel, NotificationPrefs,
│                                     StashPrefs (capacityMl + fullMl + refillAt),
│                                     TaperPrefs, DoseBuddyPrefs, ThemeId, ToleranceEstimate.
│
├── assets/
│   ├── hero.png                      Used in gate/onboarding screens.
│   ├── react.svg                     Unused boilerplate.
│   └── vite.svg                      Unused boilerplate.
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
├── store/
│   ├── appStore.ts                   preferredDoseMl(), preferredIntervalMinutes() helpers.
│   │                                 Intentional duplicate of timerUtils.ts helpers — deferred refactor.
│   │                                 Consolidation waits until timerUtils.ts is fully modularized.
│   │                                 See HANDOFF §11.
│   ├── authStore.ts                  subscribeToAuth(callback) — Firebase Auth listener.
│   │                                 Returns unsubscribe function. Used in App.tsx.
│   ├── gateStore.ts                  isGateComplete() — reads from localStorage.
│   │                                 markGateComplete() — writes to localStorage.
│   ├── localDataStore.ts             Device-only profile/dose/dose-context storage.
│   │                                 Includes onboarding-complete flag helpers and validation.
│   ├── localSessionStore.ts          Device-only session mode flag (`doser.localOnly`).
│   │                                 Lets the app route back into auth or local mode.
│   └── profileStore.ts               fetchUserDocument(uid) — reads Firestore users/{uid}.
│                                     saveUserDocument(uid, data) — writes profile to Firestore.
│                                     isOnboardingComplete(uid) — checks if profile exists.
│                                     defaultProfile() — returns a zero-state Profile object.
│
└── components/
    │
    ├── MainApp.tsx                   Shared app shell for all five tabs (Insights, History, Timer, Tools, Settings).
    │                                 Owns activeTab, profile, doses, doseContexts,
    │                                 loading state, nowMs ticker, and local-only persistence routing.
    │
    ├── gate/                         PHASE 2 — COMPLETE (PR #1 merged)
    │   ├── GateLayer.tsx             Orchestrates gate screens in sequence.
    │   ├── GateLayout.tsx            Shared layout wrapper for gate screens.
    │   ├── AgeGate.tsx               Screen 1: age confirmation.
    │   ├── LegalGate.tsx             Screen 2: legal acknowledgment.
    │   ├── HarmReductionGate.tsx     Screen 3: harm reduction acknowledgment.
    │   └── Wordmark.tsx              "doser" wordmark component used in gate screens.
    │
    ├── auth/                         PHASE 2 — COMPLETE (PR #2 merged)
    │   ├── AuthLayer.tsx             Orchestrates auth screens. Routes between log in / sign up.
    │   ├── AuthLayout.tsx            Shared layout wrapper for auth screens.
    │   ├── AuthField.tsx             Reusable text input for auth forms.
    │   ├── AuthLink.tsx              Reusable link/button used in auth footers.
    │   ├── LocalOnlyUpgradeDecision.tsx  Explicit storage decision after device-only user signs in (PR #11).
    │   ├── LogIn.tsx                 Email + password login screen. Firebase signInWithEmailAndPassword.
    │   │                             Also exposes `Continue on this device` for local-only mode.
    │   ├── SignUp.tsx                Email + password registration. Firebase createUserWithEmailAndPassword.
    │   ├── ForgotPassword.tsx        Password reset email screen. Firebase sendPasswordResetEmail.
    │   └── RecoveryAccount.tsx       Account recovery screen.
    │
    ├── onboarding/                   PHASE 2 — COMPLETE (PR #3 merged)
    │   ├── OnboardingLayer.tsx       Orchestrates onboarding screens in sequence.
    │   │                             Saves either to Firestore or local storage depending on mode.
    │   ├── OnboardingLayout.tsx      Shared layout wrapper for onboarding screens.
    │   ├── OnboardingField.tsx       Reusable input/select field for onboarding forms.
    │   ├── ProfileSetup.tsx          Screen 1: name, age, height, weight, biological sex.
    │   ├── SubstanceDefaults.tsx     Screen 2: GBL/BDO preferred dose + interval.
    │   ├── NotificationBasics.tsx    Screen 3: notification preferences.
    │   └── FinishIntoTimer.tsx       Screen 4: completion screen, advances to TimerScreen.
    │
    ├── timer/                        PHASE 3 — COMPLETE (PR #4 merged)
    │   ├── DoseBuddyCheckInSheet.tsx PHASE 5 — pre-dose Dose Buddy check-in overlay.
    │   ├── TimerScreen.tsx           Timer tab screen.
    │   │                             Receives shared state from MainApp:
    │   │                             doses[], profile, doseContexts, setDoses(), nowMs.
    │   │                             Owns timer-tab-specific UI state such as
    │   │                             substance, doseAmount, and carousel position.
    │   ├── TimerHeader.tsx           Header row: "doser" wordmark + flashlight btn + substance pill.
    │   ├── TopStatRow.tsx            Two stat cards: LAST ENTRY + SESSION TOTAL.
    │   ├── DoseCard.tsx              Bottom dose control: −/+ buttons, scroll ruler, LOG ENTRY btn.
    │   │                             Scroll ruler range: 0.1–10.0 mL, loops at both ends.
    │   ├── BottomNav.tsx             5-tab nav bar: Insights / History / Timer / Tools / Settings.
    │   │                             All five tabs are live.
    │   ├── TimerIcons.tsx            All SVG icon components used in the timer screen.
    │   ├── timerUtils.ts             Pure utility functions and types for the timer:
    │   │                             TimerState, TimerPhase, DOSE_MIN, DOSE_MAX, DOSE_STEP,
    │   │                             computeTimerState(), formatCountdown(), formatTimeShort(),
    │   │                             clampDoseAmount() (wraps at boundaries by design),
    │   │                             snapDoseToStep(), formatDoseAmount(), formatLastEntry(),
    │   │                             preferredDoseForSubstance(), preferredIntervalForSubstance(),
    │   │                             lastDose(), sessionTotalMl(), dosesForSubstance().
    │   └── carousel/
    │       ├── TimerCarousel.tsx     Horizontal scroll carousel + PaginationDots component.
    │       │                         6 cards. Swipe or dot-tap to navigate.
    │       ├── CarouselCardShell.tsx Shared card container (border, bg, radius) for all carousel cards.
    │       ├── TimerRingCard.tsx     Card 1 — BUILT. SVG stroke ring, countdown, WAIT/SAFE state.
    │       │                         Fill animation on LOG ENTRY (4s), then decays with remaining time.
    │       ├── TodayCard.tsx         Card 2 — BUILT. Today summary stats.
    │       ├── CurrentStateCard.tsx  Card 3 — BUILT. PEL gauge + tolerance state.
    │       ├── Past12HoursCard.tsx   Card 4 — BUILT. Dose history timeline.
    │       ├── ForecastCard.tsx      Card 5 — BUILT. PEL forecast curve.
    │       └── SessionCompareCard.tsx Card 6 — BUILT. Session compare vs average.
    │
    ├── history/                      PHASE 4 — COMPLETE (PR #7 merged)
    │   ├── EditDoseModal.tsx         Edit dose amount, substance, and timestamp.
    │   └── HistoryScreen.tsx         Chronological dose list, filter, delete, edit.
    │
    ├── insights/                     LIVE — Insights tab (Peer Comparison sub-tab deferred)
    │   └── InsightsScreen.tsx        Pattern cards from real dose logs via `src/lib/insightsData.ts`.
    │
    ├── tools/                        PHASE 5 — MERGED ON MAIN
    │   ├── ToolsScreen.tsx           Tools hub: NavRow list → 5 sub-screens.
    │   ├── StashScreen.tsx           Stash: liquid-tank hero, inline refill, stat
    │   │                             pills, quick remove/add chips, AccelStepper,
    │   │                             low-alert presets, live stash visualization.
    │   ├── DoseBuddyScreen.tsx       Dose Buddy: Setup + Previous Inputs tabs.
    │   ├── DoseBuddyControls.tsx     Shared Dose Buddy selectors + option constants.
    │   ├── TaperScreen.tsx           Taper: step-down schedule form.
    │   ├── EmergencyResourcesScreen.tsx  Crisis lines / urgent help.
    │   ├── SafetyReferenceScreen.tsx Timing + harm-reduction basics.
    │   ├── SubScreenHeader.tsx       Shared sub-screen header (title/subtitle/back).
    │   ├── NavRow.tsx                Shared hub list row.
    │   └── FormField.tsx             Shared text input + ToggleField.
    │
    └── settings/                     PHASE 5 — MERGED ON MAIN
        ├── SettingsScreen.tsx        Settings hub: NavRow list → 6 sub-screens.
        ├── AccountScreen.tsx         Account + sign-out (authStore.logOut()).
        │                             In local-only mode, shows device-only status and exits back to auth.
        ├── ProfileSettingsScreen.tsx Edit profile fields.
        ├── NotificationsScreen.tsx   Notification preferences.
        ├── ThemesScreen.tsx          Theme selection (dark only for now).
        ├── InstallAppScreen.tsx      PWA install guidance.
        └── LegalScreen.tsx           Legal / acknowledgments.

firebase.json
functions/
├── package.json
├── tsconfig.json
└── src/
    └── index.ts

api/
└── notify.ts                         Vercel serverless notification scheduler (OneSignal path)

public/
└── OneSignalSDKWorker.js             OneSignal service worker (separate from src/sw.ts)
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

**How local-only mode works:**
`src/store/localSessionStore.ts` tracks whether the app should run in device-only mode.
When that flag is active, `App.tsx` routes around auth, `OnboardingLayer.tsx` saves into
`src/store/localDataStore.ts`, and `MainApp.tsx` persists profile/dose state locally.
Returning to the auth screen is supported. When a device-only user with local data
completes auth, `App.tsx` pauses at `local-upgrade` and shows
`LocalOnlyUpgradeDecision.tsx` before switching to account-backed storage.
Migration from local-only data into Firebase is not yet built.

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
  - OneSignal web SDK initialization via `react-onesignal`
  - `OneSignal.login(uid)` — Firebase UID as OneSignal External User ID
  - no device tokens stored in Firestore; OneSignal manages registration internally

### Service workers

- `src/sw.ts`
  - Workbox worker for PWA caching only (no Firebase Messaging)
- `public/OneSignalSDKWorker.js`
  - OneSignal's separate service worker (`serviceWorkerPath` in OneSignal init)

### Notification backend

- `api/notify.ts`
  - Vercel serverless cron target (replaces Firebase Functions scheduler)
  - due reminder
  - missed-dose alert
  - daily summary
  - stash low alert
  - session auto-end markers
  - sends via OneSignal REST API using `include_aliases.external_id: [uid]`

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
- when a device-only user with local data completes auth, pauses at `local-upgrade`
  and renders `LocalOnlyUpgradeDecision.tsx` before continuing into account-backed storage
- migration/import from local-only data into a signed-in account is still not built

### `src/components/settings/AccountScreen.tsx`

- device-only users can go back to auth from here

---

## Firestore Shape That Matters

Current important collections/documents:

- `users/{uid}`
  - `profile`
  - `doseContexts`
- `users/{uid}/doses/{doseId}`

The former `users/{uid}/notificationDevices` subcollection (FCM tokens) has been
removed. OneSignal manages device registration internally — no device tokens are
stored in Firestore.

Do not assume more exists without reading the live code first.

---

## Validation Map

Web app validation:

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

Notifications backend validation:

- confirm `api/notify.ts` deploys with Vercel
- confirm all required server env vars are present on Vercel:
  - `ONESIGNAL_APP_ID`
  - `ONESIGNAL_REST_API_KEY`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `CRON_SECRET`

Manual verification still required on notifications branch:

- signed-in browser permission flow
- OneSignal dashboard shows a registered subscriber
- real device/PWA delivery via OneSignal
- Vercel cron-backed end-to-end testing

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
- `src/lib/pushRegistration.ts`
- `api/notify.ts`

---

## Reality Check For Future Agents

The notifications branch has real architecture now, but not full real-world proof.

If you are continuing `feat/real-notifications-v1`, your first questions should be:

1. Is `api/notify.ts` deployed and reachable on Vercel?
2. Are OneSignal env vars present (`VITE_ONESIGNAL_APP_ID`, `ONESIGNAL_APP_ID`, `ONESIGNAL_REST_API_KEY`)?
3. Does the OneSignal dashboard show a registered subscriber for the test user?
4. Has a signed-in real-device test been completed?
5. Which exact flows have actually been observed arriving on device?

If those answers are missing, do not tell Preston the feature is working.
