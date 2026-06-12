# Doser 2.0 — Cursor Handoff Packet

## How to use this file
At the start of every Cursor task, type @HANDOFF.md to give the agent full context before it writes a single line of code.
If the task is visual, pair this with screenshots from `docs/ai-reference/current-app-state/`
and `docs/ai-reference/goal/`. Do not rely on `Downloads` or other machine-specific paths.
NEVER DEVIATE FROM THE CURRENT APP THEME. NO EXCEPTIONS. UNDER NO CIRCUMSTANCES IS THAT EVER OKAY.

---

## 1. Project Overview

App name: Doser | URL: usedoser.com
Type: PWA — intentionally distributed outside app stores
Stack: React + TypeScript + Vite + Tailwind CSS v3 + Firebase Auth + Firestore
Purpose: Harm reduction tool for GBL, BDO, and GHB users. Safe interval timing, dosing pattern tracking, perceived effect level calculation. Not a medical device. Not a guarantee of safety.

---

## 2. Design System

### Aesthetic
- Dark only. No light mode. No gradients fading to white or light.
- Flat design. No decorative drop shadows. No glassmorphism.
- Clinical-adjacent minimalism. References: Apple Health, Oura, Whoop. Serious and data-trustworthy.
- No design flourishes. Every element earns its place through function.
- Current app theme is the source of truth. Reference screenshots do not authorize
  a new theme, new fonts, a new capitalization style, or a different product feel.

### Capitalization Rule
- "doser" (the wordmark) is the ONLY word in the app that is intentionally lowercase. Brand decision, not a style pattern.
- All other text uses consistent capitalization. ALL CAPS is fine where it looks better (WAIT, LOG ENTRY, LAST ENTRY). Title Case for nav items and screen titles. Sentence case for descriptive text.
- Rule is consistency across screens. Equivalent labels must match across all screens.
- Do not apply the doser lowercase treatment to any other word anywhere in the app.

### Typography
- Wordmark "doser": Unbounded weight 300 — used ONLY for the wordmark, nothing else
- Timer digits, dose picker number: Antonio weight 200 — var(--font-display)
- Card section headers, screen titles: Montserrat weight 600/700 — var(--font-heading)
- All labels, nav text, body copy, buttons: Inter weight 400/500/600 — var(--font-body)
- JetBrains Mono: legacy only — still used in gate/auth/onboarding screens, do not use for new screens
- All fonts loaded from Google Fonts — already imported in src/index.css

## 2b. Design System Rules (Standard for All New Screens)

### Color Tokens
Use ONLY CSS variables from src/index.css. Never hardcode hex.
- `var(--color-ring)` = #C8E840 — accent, ring fill, active states, icons
- `var(--color-action)` = #E8532A — primary CTA button (LOG ENTRY, destructive actions)
- `var(--color-load)` = #9B8FD4 — secondary text, sub-labels, secondary insights
- `var(--app-bg)` = #131313 — full-screen background
- `var(--app-surface)` = #181a1e — card backgrounds, elevated surfaces
- `var(--app-text)` = #edf0f4 — primary text, headlines, values
- `var(--app-dim)` = #c8cdd4 — secondary text, hints
- `var(--app-faint)` = #3e454e — disabled states, inactive labels
- `var(--app-divider)` = #222629 — card borders, dividers

### Typography
- Display numbers: `var(--font-display)` (Antonio 200) — timers, large values only
- Headings/titles: `var(--font-heading)` (Montserrat 600–700) — card headers, screen titles
- Body/UI text: `var(--font-body)` (Inter 400–600) — labels, buttons, copy, nav
- Never hardcode font family names. Always use CSS variable references.

### Layout
- Use Flexbox or CSS Grid with `gap:` property (never inline margins)
- Use Tailwind for structure/spacing only — never for colors
- All colors: CSS variables via Tailwind syntax, e.g. `text-[var(--color-ring)]` or `bg-[var(--app-surface)]`
- Never use bare Tailwind colors like `text-emerald-400` or `bg-gray-900`

### Cards & Components
- Card bg: `background: var(--app-surface)`
- Card border: `1px solid var(--app-divider)`
- Card radius: `border-radius: 16px`
- Icon buttons: `border-radius: 10px`
- Primary buttons: `border-radius: 14px`
- No drop shadows, no gradients, no glassmorphism

### Copy Rules
- Buttons & labels: ALL CAPS (LOG ENTRY, WAIT, DOSE AMOUNT, INSIGHTS)
- Descriptive text: Sentence case (First word capitalized, rest lowercase except proper nouns)
- Always include units on numbers: "1.8 mL", not "1.8"
- Time format: colons only, no am/pm ("01:20:00", "12:30 PM" is OK as shown in spec)
- No emoji anywhere in the app
- Do not introduce a casual lowercase or mixed-case convention outside the
  explicit existing brand rules.

### Animation
- Prefer opacity transitions over color shifts on hover
- Duration: 150ms (fast interactions) or 300ms (page transitions)
- Easing: `cubic-bezier(0.4, 0, 0.2, 1)` (ease-in-out) for most transitions
- No decorative infinite loops except explicit ambient effects (e.g., breathe pulse)

---

### CSS Color Variables (Legacy — Gate/Auth/Onboarding only)
For compatibility with existing screens, these are still defined in src/index.css.
DO NOT use in new screens. They exist only for gate, auth, and onboarding:

--color-accent: #d7e332 (used by gate, auth, onboarding)
--color-cta: #ff5a18 (used by gate, auth, onboarding)
--color-purple: #b89cff (used by gate, auth, onboarding)
--color-bg: #000000 (used by gate, auth, onboarding)
--color-app: #090a0d (used by gate, auth, onboarding)
--color-surface: rgba(255,255,255,0.05) (used by gate, auth, onboarding)
--color-border: rgba(255,255,255,0.07) (used by gate, auth, onboarding)
--color-text: #ffffff (used by gate, auth, onboarding)
--color-text-muted: rgba(255,255,255,0.55) (used by gate, auth, onboarding)
--color-text-dim: rgba(255,255,255,0.60) (used by gate, auth, onboarding)
--color-nav-inactive: rgba(255,255,255,0.80) (used by gate, auth, onboarding)

### Spacing
- Mobile-first. 390px reference width.
- Bottom safe area: env(safe-area-inset-bottom) on all fixed bottom elements.
- Ring sizing: use clamp() or max-w-full — never hardcoded px.

---

## 3. Git Workflow

Every task follows this process. No exceptions.

Branch naming:
- feat/[task-name] — new feature or screen
- fix/[task-name] — bug fix
- refactor/[task-name] — restructuring
- style/[task-name] — visual/CSS only
- chore/[task-name] — deps, config, tooling

Per-task steps:
1. git checkout main && git pull origin main
2. git checkout -b feat/[task-name]
3. Cursor works ONLY on this branch — never on main
4. git add -p (review changes before committing)
5. git commit -m "feat: short description"
6. git push origin feat/[task-name]
7. Open Pull Request on GitHub — CodeRabbit reviews automatically
8. Read all CodeRabbit comments, fix anything flagged
9. Merge PR to main only after review passes
10. git checkout main && git pull && git branch -d feat/[task-name]

Commit format: feat: / fix: / refactor: / style: / chore: followed by short description.
Never push directly to main. One branch per Cursor task.

---

## 4. App Architecture

Entry flow in order:
1. Gate Layer — Age gate, Legal acknowledgment, Harm-reduction acknowledgment
2. Auth — Log in, Sign up, Forgot password, Recovery
3. Onboarding — Profile setup, Substance defaults, Notification basics, Finish into Timer
4. Main App Shell — Five tabs: Insights / History / Timer / Tools / Settings

Tabs:
- Timer: Primary screen. Check timing state, log a dose.
- Insights: Analysis and pattern interpretation of logged data.
- History: Raw log review, editing, import/export.
- Tools: Stash, Dose Buddy, Taper, Emergency Resources, Safety Reference.
- Settings: Account, Profile, Notifications, Themes, Install, Legal.

---

## 5. Timer Screen Visual Spec

Primary screen. Reference screenshot is source of truth.

### Header
- Left: "doser" wordmark — Unbounded font-light 56px lowercase tracking 0.16em white
- Below wordmark: "TIMING AWARENESS" — 14px uppercase tracking 0.34em var(--color-purple)
- Right: Flashlight button — 76x76px rounded-[22px] border var(--color-border) bg var(--color-surface)
- Right: Substance selector — 76px tall min-w-[128px] rounded-[22px] same border/bg. Dot var(--color-accent) + "GBL" + chevron

### Top Stat Row
Two equal cards: rounded-[22px] border var(--color-border) bg var(--color-surface) p-5.
Last Entry: clock icon var(--color-accent), "LAST ENTRY" 12px uppercase tracking 0.18em var(--color-text-muted), value dose+bullet+time.
Session Total: bar chart icon var(--color-accent), "SESSION TOTAL" same label style, value total mL.

### Timer Ring Card
Container: rounded-[28px] border var(--color-border) bg var(--color-surface) py-8 px-4.
Ring outer: 470x470px max-w-full. conic-gradient: var(--color-accent) active arc, var(--color-ring-gap) ~16deg gap at top.
Ring inner: 410x410px max-w-[88%] bg var(--color-ring-inner) rounded-full.
Inside ring top to bottom:
- State label "WAIT" — 28px semibold uppercase tracking 0.18em var(--color-accent)
- Countdown "00:38:24" — 96px font-light tracking -0.04em white
- Divider 1px 140px wide rgba(255,255,255,0.12)
- "next window" — 21px var(--color-purple)
- Time "12:20 AM" — 26px white

### Pagination Dots
Centered row gap-5. Active: 12x12px rounded-full var(--color-accent). Inactive: 12x12px rounded-full white/25%.

### Dose Card
Container: rounded-[28px] border var(--color-border) bg var(--color-surface) p-6.
Minus button: 86x86px rounded-full border var(--color-border) minus icon var(--color-accent) 52px.
Center: "DOSE AMOUNT" 15px uppercase tracking 0.34em var(--color-purple). Dose number 84px font-light. "mL" 22px var(--color-purple) baseline-aligned.
Plus button: same as minus.
Scale: 37 ticks 1px wide rounded. Center 56px var(--color-accent). Major every 4th 32px var(--color-tick-major). Minor 16px var(--color-tick-minor). Labels 16px var(--color-text-dim), active var(--color-accent). Range: 1.20 to 2.40.
LOG ENTRY button: w-full h-[82px] rounded-[18px] bg var(--color-cta). Target icon + "LOG ENTRY" 22px semibold uppercase tracking 0.18em text-black.

### Bottom Nav
Border-top var(--color-border) bg rgba(255,255,255,0.04) pt-3 pb-6 plus safe area.
5 cols: Insights/History/Timer/Tools/Settings. Active: var(--color-accent). Inactive: var(--color-nav-inactive). Labels 13px. Icons 32x32px.

---

## 6. Carousel Cards Visual Spec

All cards share the Timer Ring card container style. 6 cards total.

Card 1 — TIMER RING: See Section 5.

Card 2 — TODAY:
Header "TODAY". Stats: DOSES TODAY / TOTAL / AVG INTERVAL / FIRST ENTRY / LAST ENTRY. Labels 12px uppercase var(--color-text-muted). Values white.

Card 3 — CURRENT STATE:
Header "CURRENT STATE". Sub-label "PERCEIVED EFFECT" var(--color-purple). Large state text e.g. "Moderate". Trend label "Steady" muted. Gauge arc right side LOW to HIGH with needle. Bottom: NEXT WINDOW / SESSION COUNT / TOTAL.

Card 4 — PAST 12 HOURS:
Header "PAST 12 HOURS". Top: ENTRIES / TOTAL / LAST ENTRY. Entry list: time + amount + interval per row, horizontal bar var(--color-accent) proportional to dose size. WINDOW PROGRESS bar at bottom var(--color-accent).

Card 5 — FORECAST:
Header "FORECAST". Sub-label "PREDICTED LEVEL" var(--color-purple). Right: "AT NEXT WINDOW" + state label. PEL bell curve chart, Y-axis High/Moderate/Low/None, X-axis NOW/NEXT WINDOW. Fill var(--color-accent) low opacity, line var(--color-accent).

Card 6 — SESSION COMPARE:
Header "SESSION COMPARE". Sub-label "vs your average (last 10 sessions)" var(--color-purple). Three rows: DOSE SIZE / SPACING / TOTAL AMOUNT. Each: current value + bar + delta label. Delta labels var(--color-cta).

---

## 7. PEL Calculation Engine

CRITICAL: This is hand-tuned subjective intensity modeling — NOT pharmacokinetic math. Do not replace, fix, or rewrite with PK equations. Calibration is intentional. Preserve exactly.

What it measures: "How strongly do effects likely feel right now?" Not plasma concentration.

Core files — copy from old repo, do not rewrite:
- src/lib/perceivedEffect/effectCurves.ts
- src/lib/perceivedEffect/perceivedEffectModel.ts
- src/lib/perceivedEffect/toleranceModel.ts

Effect curve constants:
GBL: Onset 10min / Rise 18min / Plateau 12min / Decline half-life 38min / Hard wear-off 180min
BDO: Onset 22min / Rise 28min / Plateau 15min / Decline half-life 58min / Hard wear-off 300min

Curve shape: delay -> smoothstep rise -> flat peak -> exponential decay -> hard zero at wear-off. No tail.

Display calibration (intentional, do not change):
- Single anchor dose at peak: ~88% display
- Ordinary overlap: high-90s, never 100%
- 100% only in extreme stacked states
- SOFT_SAT_LINEAR_CEIL = 0.6, SOFT_SAT_WIDTH = 0.33

Tolerance model: 9-factor behavioral model 7/30/60-day windows. Index 0.6 (sensitive) to 2.2 (heavy). 1.0 = typical.
High tolerance: same dose peaks ~40% not ~88%.
PEL = 0% while tolerance still elevated after long break — correct, do not fix.

Context modifiers: Food empty +8%/faster onset, full -7%/slower. Hydration low +3%, good -1%. Sleep poor +5%/faster, good -2%.
Profile modifiers: Weight (75/weightKg)^0.1. Age max(0.88, 1-(age-30)*0.0035). Sex female +4%, male -2%.

Key functions:
- computePerceivedEffectLevelAt(doses, profile, atMs, contextByDoseId?)
- computeDosePerceivedPercentAt(dose, profile, atMs, allDoses, contextByDoseId?)
- isDosePerceptuallyActive(dose, profile, atMs, allDoses, contextByDoseId?)
- formatPerceivedEffectPct(percent)
- calculateBehavioralTolerance(doses, profile, nowMs)
- describeToleranceState(tolerance)

---

## 8. Data Model

```
Substance = "GBL" | "BDO"
LegacySubstance = "GHB"
DoseSubstance = Substance | LegacySubstance
WeightUnit = "kg" | "lbs"
HeightUnit = "cm" | "in"
BiologicalSex = "male" | "female"
FoodState = "empty" | "snack" | "full"
HydrationState = "low" | "ok" | "good"
SleepLevel = "poor" | "ok" | "good"

SubstancePrefs: { preferredDoseMl: number, preferredIntervalMinutes: number }

DoseContext: { foodState, hydrationState, sleepLevel }

Dose: { id: string, substance: DoseSubstance, amountMl: number, ts: number, updatedAt?: number }

Profile: { nickname, age, heightCm, heightUnit, weightKg, weightUnit, biologicalSex,
           gbl: SubstancePrefs, bdo: SubstancePrefs, avatarId, accentHex, glowHex,
           notif: NotificationPrefs, stash: StashPrefs, taper: TaperPrefs,
           doseBuddy: DoseBuddyPrefs, themeId: ThemeId }

StashPrefs: { capacityMl, fullMl?, refillAt }
  capacityMl = current on-hand baseline; doses logged after refillAt deplete it.
  fullMl     = full container volume = the Stash tank's 100% reference. Set on Refill.
               The tank empties as the current amount drops below fullMl. Optional;
               legacy data without it falls back to capacityMl (see stashFullMl()).
  refillAt   = timestamp; doses logged after this count toward consumption.
  Helpers in src/lib/stash.ts: stashRemainingMl, stashConsumedMl, stashRemainingPct,
  stashFullMl, isStashLow.

DoseContextMap = Map<string, DoseContext>
Built via: buildDoseContextMap(checkIns) in src/lib/doseBuddy.ts
DoseContext does NOT embed in Dose — attached separately by dose id.

ToleranceEstimate: { index, trend, confidence, drivers, doseSizeScore, frequencyScore,
                     intervalScore, volumeScore, activeDayScore, streakScore,
                     earlyRedoseScore, escalationScore, recoveryScore, rawComposite }
ToleranceTrend = "rising" | "stable" | "easing"
ToleranceConfidence = "calibrating" | "partial" | "full"
```

---

## 9. Persistence

- Firebase Auth handles sign-in state
- Firestore stores:
  - `users/{uid}` profile data
  - `users/{uid}/doses` dose entries
  - `doseContexts` on the user document
- Local React state is owned by `MainApp.tsx` and persisted through
  `src/store/profileStore.ts`
- PEL calculations are stateless — inputs only: doses + profile + timestamp
- Read the live Firestore helpers before assuming field names or write shape

---

## 10. PWA

- vite-plugin-pwa with Workbox service worker
- iOS/iPadOS notifications require service worker implementation
- Install prompt blocked in incognito — test in standard browser session
- No app store distribution — web-only intentionally

---

## 11. Cursor Agent Rules

Before writing any code:
1. Read the relevant files in the codebase first. Do not assume paths, names, or class names.
2. Read this entire document before starting any task.
2a. If the task references screenshots or mockups, read `docs/ai-reference/README.md`
    and use the repo-owned files there as the visual source of truth.
2b. Screenshot references are directional unless the user explicitly asks for a
    close copy. They do not justify a new visual system.

While working:
3. If unsure about any detail not in this spec — STOP. Do not guess. Ask.
4. Do not modify files outside the scope of the current task.
5. Do not use placeholder, mock, or hardcoded fake data.
6. Do not resolve errors silently — stop and report them exactly as they appear.
7. Do not simplify or refactor working code unless explicitly told to.
8. Do not invent a solution if the spec already defines how to build it.
9. Do not change the current app theme, typography conventions, capitalization
   conventions, or overall product feel unless the user explicitly approves that
   theme change.

On styling:
9. Never hardcode hex values in components. Use CSS variables from src/index.css only.
10. Never hardcode px for ring/gauge sizing. Use clamp() or max-w-full.
11. Layout fixes at root level only. No one-off px patches inside components.

On calculations:
12. Never duplicate PEL logic. Call computePerceivedEffectLevelAt — do not reimplement.

On commits:
13. One task per chat. No combining unrelated changes.
14. Correction prompts must state what is wrong and why, not just "fix this".

---

## 12. Phased Build Order

Phase 1 — Foundation: COMPLETE. Clean baseline committed to main.
Next: Copy PEL files from old repo into src/lib/perceivedEffect/ before starting Phase 2.

Phase 2 — Gate + Auth + Onboarding:
Age gate -> Legal -> Harm-reduction acknowledgment.
Log in / Sign up / Forgot password.
Onboarding: profile setup -> substance defaults -> notification basics -> Timer.

Phase 3 — Timer Screen:
Header, stat row, carousel (6 cards), pagination dots, dose card.
Build exactly to visual spec in Sections 5 and 6.
Wire PEL engine to Timer ring and Current State card.

Phase 4 — History + Carousel + 3D Cube: COMPLETE.
History: list, filter, delete, edit.
Carousel: cards 2–6 wired to real data + PEL engine.
3D cube transition: working and merged.

Phase 5 — Tools + Settings: CORE COMPLETE.
Tools: Stash, Dose Buddy, Taper, Emergency Resources, Safety Reference.
Settings: Account, Profile, Notifications, Themes, Install App, Legal.

Current likely next work:
- refine the Tools hub first
- refine the Settings hub second
- keep the existing theme intact

---

## 13. What NOT to Change

- PEL curve constants and shape
- SOFT_SAT_LINEAR_CEIL and SOFT_SAT_WIDTH
- Hard wear-off cutoff — hard zero, no tail
- PEL = 0% while tolerance elevated — correct behavior, do not fix
- Stacking diminishing returns formula
- 9-factor tolerance model scoring

These are intentional harm reduction calibration decisions, not bugs.


---

## 14. Folder Structure

This is the established src/ layout. All new files go in the correct folder — do not create new top-level folders without explicit instruction.

src/
  components/
    gate/          <- Age gate, legal acknowledgment, harm reduction acknowledgment
    auth/          <- Log in, sign up, forgot password, recovery
    onboarding/    <- Profile setup, substance defaults, notification basics
    timer/
      carousel/    <- All 6 carousel cards as individual components
    insights/      <- All, GBL, BDO, Peer tabs
    history/       <- Sessions, entries, edit/delete, import/export
    tools/         <- Stash, Dose Buddy, Taper, Emergency Resources, Safety Reference
    settings/      <- Account, Profile, Notifications, Themes, Install, Legal
  lib/
    perceivedEffect/
      effectCurves.ts           <- DO NOT MODIFY
      perceivedEffectModel.ts   <- DO NOT MODIFY
      toleranceModel.ts         <- DO NOT MODIFY
  store/           <- App state
  types.ts         <- All TypeScript types (see Section 8)
  App.tsx          <- Root component and routing
  main.tsx         <- Entry point
  index.css        <- Global styles and CSS variables.
                      MAY add new variables and font imports.
                      NEVER remove or rename existing variables — gate/auth/onboarding use them.


---

## 15. Branch Rule

You do not create branches. Ever.
The branch is always created by Preston before the Cursor task starts.
Your first action in any task is to run:

`git branch --show-current`

Confirm which branch you are on, then work only on that branch.
If you are not on the branch Preston said to use, stop and tell him.
Never run `git checkout -b` under any circumstances.
Never create, rename, or switch branches.


---

## 16. Current Build Status

Last updated: 2026-06-12

Phase 1 — Foundation: COMPLETE
Phase 2 — Gate + Auth + Onboarding: COMPLETE
  - Gate Layer (PR #1): MERGED
  - Auth screens with Firebase (PR #2): MERGED
  - Onboarding (PR #3): MERGED

Phase 3 — Timer Screen: COMPLETE
  - Core timer screen (PR #4): MERGED 2026-06-07
  - Built: TimerScreen, TimerHeader, TopStatRow, TimerRingCard, TimerCarousel,
    DoseCard, BottomNav, timerUtils, new design tokens in index.css
  - PEL engine files: copied into src/lib/perceivedEffect/
  - Firestore security rules: updated with {document=**} wildcard

Phase 3b — Dose Persistence: COMPLETE
  - Firestore dose persistence merged
  - Validation on load and save merged
  - Differential sync and batch chunking merged
  - Shared validation constants merged

Phase 4 — History + Carousel + 3D Cube: COMPLETE
  - PR #7 merged to main
  - History screen done
  - Carousel cards 2–6 done
  - 3D cube transition done
  - Phase 4 review fixes applied

Phase 5 — Tools + Settings: CORE COMPLETE (PR #8 merged)
  - Tools hub merged
  - Settings hub merged
  - Stash, Dose Buddy, Taper, Emergency Resources, Safety Reference merged
  - Account, Profile, Notifications, Themes, Install App, Legal merged
  - Theme rollback merged after the rejected off-theme pass
  - Stash redesign merged, including `StashPrefs.fullMl`
  - Dose Buddy mobile cleanup merged
  - Accessibility and CodeRabbit follow-up fixes merged
  - Insights tab is live (Peer Comparison sub-tab still deferred)

Next likely task:
  - refine the Tools hub using repo-owned visual references
  - then refine the Settings hub
  - do not start visual work from `Downloads`; move approved references into
    `docs/ai-reference/goal/` first

See `docs/AI_CONTEXT.md` for the full current state before doing anything.

Firebase project: doser-e389f
Auth methods enabled: Email/Password, Google
