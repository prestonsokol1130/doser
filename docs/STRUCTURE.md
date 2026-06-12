# Doser 2.0 — Codebase Structure Reference

Last updated: 2026-06-12

**BEFORE BUILDING ANYTHING: Read HANDOFF.md Section 2b (Design System Rules).**
That section defines all the colors, fonts, layout rules, copy rules, and animation rules
that every new screen must follow. It is the authoritative reference.

This file provides the file tree and folder structure. Read this alongside HANDOFF.md and AI_CONTEXT.md before building any new screen.
`docs/ai-reference/` stores screenshots and mockups, but the current app theme and
design rules remain the source of truth.

---

## App Entry Flow

```
main.tsx
  └── App.tsx  ← controls which phase renders based on gate/auth/onboarding state
        ├── GateLayer       (phase: 'gate')
        ├── AuthLayer       (phase: 'auth')
        ├── loading spinner (phase: 'onboarding-check')
        ├── OnboardingLayer (phase: 'onboarding')
        └── MainApp         (phase: 'timer')  ← live app shell for Timer / History / Tools / Settings
```

Phases advance linearly on first launch: gate → auth → onboarding → timer.
On return visits: gate is skipped through localStorage and onboarding is skipped if
the Firestore profile already exists.

---

## Full File Tree

```
docs/
├── ai-reference/
│   ├── current-app-state/           Current UI screenshots for comparison.
│   ├── goal/                        Directional references only, not authorization
│   │                                for a new visual system.
│   └── archive/                     Older screenshots and superseded references.
│
src/
│
├── main.tsx                          Entry point. Mounts App into #root.
├── App.tsx                           Phase router. Gate → Auth → Onboarding → MainApp.
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
│   ├── firebase.ts                   Firebase app init, exports: auth, db (Firestore).
│   │                                 Import these — never re-initialize Firebase elsewhere.
│   ├── insightsAdvanced.ts           Advanced session analysis helpers. Not yet wired to UI.
│   ├── metabolicProfile.ts           Metabolic profile calculations. Not yet wired to UI.
│   ├── doseBuddy.ts                  PHASE 5 — Dose Buddy suggestion engine + context map.
│   ├── stash.ts                      PHASE 5 — stash remaining/consumed/pct + stashFullMl().
│   ├── taper.ts                      PHASE 5 — taper step-down schedule calculations.
│   └── perceivedEffect/              PEL engine — DO NOT MODIFY ANY FILE IN THIS FOLDER.
│       ├── effectCurves.ts           GBL/BDO curve constants and shape math.
│       ├── perceivedEffectModel.ts   computePerceivedEffectLevelAt() and related exports.
│       └── toleranceModel.ts         9-factor behavioral tolerance model.
│
├── store/
│   ├── appStore.ts                   preferredDoseMl(), preferredIntervalMinutes() helpers.
│   │                                 Note: timerUtils.ts has duplicate versions — see HANDOFF §11.
│   ├── authStore.ts                  subscribeToAuth(callback) — Firebase Auth listener.
│   │                                 Returns unsubscribe function. Used in App.tsx.
│   ├── gateStore.ts                  isGateComplete() — reads from localStorage.
│   │                                 markGateComplete() — writes to localStorage.
│   └── profileStore.ts               fetchUserDocument(uid) — reads Firestore users/{uid}.
│                                     saveUserDocument(uid, data) — writes profile to Firestore.
│                                     isOnboardingComplete(uid) — checks if profile exists.
│                                     defaultProfile() — returns a zero-state Profile object.
│
└── components/
    │
    ├── MainApp.tsx                   Shared app shell for Timer + History + Tools + Settings.
    │                                 Owns activeTab, profile, doses, doseContexts,
    │                                 loading state, and nowMs ticker.
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
    │   ├── LogIn.tsx                 Email + password login screen. Firebase signInWithEmailAndPassword.
    │   ├── SignUp.tsx                Email + password registration. Firebase createUserWithEmailAndPassword.
    │   ├── ForgotPassword.tsx        Password reset email screen. Firebase sendPasswordResetEmail.
    │   └── RecoveryAccount.tsx       Account recovery screen.
    │
    ├── onboarding/                   PHASE 2 — COMPLETE (PR #3 merged)
    │   ├── OnboardingLayer.tsx       Orchestrates onboarding screens in sequence.
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
    │   │                             Insights is placeholder-only. The other 4 tabs are live.
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
    ├── insights/                     NOT STARTED
    │   └── (empty — create files here when building)
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
        ├── ProfileSettingsScreen.tsx Edit profile fields.
        ├── NotificationsScreen.tsx   Notification preferences.
        ├── ThemesScreen.tsx          Theme selection (dark only for now).
        ├── InstallAppScreen.tsx      PWA install guidance.
        └── LegalScreen.tsx           Legal / acknowledgments.
```

---

## Key Wiring Facts

**How a new tab screen gets connected:**
1. Create the screen component in the correct folder
2. Import it into `src/components/MainApp.tsx`
3. Add or update the render branch keyed off `activeTab`
4. Make sure the tab id is represented in `BottomNav.tsx`

**How doses are stored:**
Doses live in shared React state in the main app shell and are persisted to
Firestore through `saveDoses()` / `fetchDoses()` helpers. New features should read
from the shared dose state instead of creating a second source of truth.

**How profile data is accessed:**
`fetchUserDocument(uid)` from `src/store/profileStore.ts` returns the Firestore
`users/{uid}` document. The `profile` field contains the full `Profile` object.
Always read the existing Firestore schema before assuming field names.

**How PEL is calculated:**
Import from `src/lib/perceivedEffect/perceivedEffectModel.ts`.
Key function: `computePerceivedEffectLevelAt(doses, profile, atMs, contextByDoseId?)`
Never duplicate this logic. Never rewrite these files.

**CSS variables:**
Defined in `src/index.css`. Two sets exist:
- Original set: `--color-accent`, `--color-cta`, `--color-purple`, `--color-surface`, etc.
  Used by gate, auth, onboarding screens — do not rename or remove.
- New design system set: `--color-ring`, `--color-action`, `--color-load`, `--app-surface`,
  `--app-divider`, `--app-text`, `--app-dim`, `--app-faint`, etc.
  Used by timer screen and all future screens.

**Font families (CSS variables):**
`--font-display`: Antonio 200 — timer digits, dose numbers
`--font-heading`: Montserrat 600/700 — card headers, section titles
`--font-body`: Inter 400/500/600 — labels, nav, body text
`--font-mono` / Unbounded: wordmark "doser" only

---

## Build Commands

```
npm run dev                            Start dev server (usually localhost:5173)
npx tsc --noEmit -p tsconfig.app.json  Required validation check
npm run build                          Required production build check
npm run lint                           Optional lint check if the task calls for it
```

---

## What NOT to Touch

- `src/lib/perceivedEffect/` — hand-tuned, never modify
- `src/index.css` — only ADD variables, never remove or rename existing ones
- `src/types.ts` — only ADD types, never rename existing ones
- `.env` — never commit, gitignored
- Tailwind v3 — do not upgrade to v4
