# Prompt for Next Agent — Phase 4 (Carousel Cards + History Screen)

**START WITH THIS:** Read @HANDOFF.md first, then read docs/AI_CONTEXT.md to understand the full project state.

---

## Current Status

**Phase 3b (Dose Persistence) is COMPLETE and MERGED** (as of 2026-06-07).
- Doses now persist to Firestore with validation: saveDoses() and fetchDoses() in profileStore.ts
- All CodeRabbit issues fixed and pushed to feat/dose-persistence
- PR #5 pending merge — should pass CodeRabbit once this session is over
- Firestore subcollection structure: users/{uid}/doses with full validation on read/write
- Security rules updated for subcollection access: match /users/{uid}/{document=**}

---

## Your Task: Phase 4 — Carousel Cards + History Screen

### Part 1: Wire Carousel Cards 2–6 (Medium Priority First)

**Status:** Cards 2–6 exist as placeholder shells with header text only.

**Required Builds:**

1. **Card 2 — TODAY (Session Summary)**
   - Total doses logged today (count + total mL)
   - Substance breakdown (e.g., "2.4 mL GBL, 1.8 mL BDO")
   - Session time window (first dose → last dose)
   - Time since last dose
   
2. **Card 3 — CURRENT STATE (PEL Gauge)**
   - Uses PEL engine: call `calculatePerceivedEffect()` from src/lib/perceivedEffect/
   - Display as large percentage (0–100%)
   - Color coding: red (0%), yellow (50%), green (100%)
   - Show current tolerance level
   - Update every 1000ms as nowMs updates
   
3. **Card 4 — PAST 12 HOURS (Dose History)**
   - Timeline of all doses logged in last 12 hours
   - Each dose: time, substance, amount, time since that dose
   - Optional: small bar chart showing dose spacing
   - Scrollable if many doses
   
4. **Card 5 — FORECAST (PEL Bell Curve)**
   - Uses PEL engine: call `calculateForecast()` or similar to project next 8 hours
   - Display as SVG chart: X-axis time (now → +8h), Y-axis PEL (0–100%)
   - Show current position on curve
   - Highlight "next safe window" if available
   
5. **Card 6 — SESSION COMPARE (Pattern Analysis)**
   - Compare current session vs 7-day average
   - Total dose count, average spacing, average dose size
   - Trend indicator (↑ more aggressive, ↓ lighter, → consistent)

**Design System Rules:**
- Use `var(--font-heading)` for card titles (Montserrat 600)
- Use `var(--font-body)` for labels (Inter 400)
- Use `var(--color-ring)` for active/highlight states (#C8E840)
- Use `var(--color-load)` for secondary insights (#9B8FD4)
- Card bg: `var(--app-surface)` with 1px border `var(--app-divider)`
- Border radius: 16px for cards
- No hardcoded colors — CSS variables only

**PEL Engine Integration:**
- The engine files exist in src/lib/perceivedEffect/ — do NOT modify them
- You may call exported functions like `calculatePerceivedEffect(doses, substance, nowMs, profile, tolerance)`
- Engine is hand-tuned for subjective intensity modeling (not pharmacokinetic math)
- GBL onset 10min, rise 18min, plateau 12min, decline 38min half-life, hard cutoff 180min
- BDO onset 22min, rise 28min, plateau 15min, decline 58min half-life, hard cutoff 300min
- Single dose at peak = ~88% (intentional), 100% only in extreme stacking (intentional)

---

### Part 2: Build History Screen (High Priority After Cards)

**Status:** Does not exist yet. Will be Tab 2 in bottom nav.

**Features Required:**

1. **Dose List View**
   - Chronological list (newest first) of all logged doses
   - Each row: date + time, substance badge, amount, time-ago
   - Swipe-to-delete or delete button per dose (must update Firestore)
   - Filter by substance (GBL / BDO / All)
   - Search by date or amount range (optional for Phase 4)

2. **Edit Dose**
   - Tap a dose → modal with edit form
   - Can change amount, substance, timestamp
   - Save → updates Firestore
   - Cancel → discard

3. **Bulk Actions** (optional for Phase 4)
   - Select multiple doses → delete all
   - Export as CSV (dates, substance, amounts, notes if added later)

4. **Screen Layout**
   - Header: "HISTORY" (all caps), subtitle optional
   - Top: filter/search bar
   - Main: scrollable dose list (full height, bottom safe area)
   - No carousel on History screen — just list view

**Data Source:**
- Use fetchDoses(uid) from profileStore.ts
- When dose is deleted/edited, call saveDoses(uid, updatedArray) to persist
- Local state management: useState for doses array, filter state, selected dose

**Design System:**
- Use same color tokens as timer screen
- Typography: Montserrat for screen title, Inter for labels
- List item styling: light border, hover opacity transition (150ms)
- Delete action: use `var(--color-action)` (#E8532A)

---

## Git Workflow

1. **Do NOT create a new branch.** Check which branch already exists:
   ```
   git branch -a
   ```

2. Work on the existing feat/[task-name] branch only.

3. When you finish a feature (e.g., all carousel cards), commit:
   ```
   git add src/components/timer/carousel/...
   git commit -m "feat: wire carousel cards 2-6 with PEL engine"
   ```

4. Push:
   ```
   git push origin feat/[task-name]
   ```

5. Preston will open the PR on GitHub. CodeRabbit will review automatically.

6. Read CodeRabbit feedback and fix any issues before merge.

---

## Files You'll Touch

- `src/components/timer/carousel/TimerCarousel.tsx` — add card content components
- `src/components/timer/carousel/cards/` — create new card files (Card2.tsx, Card3.tsx, etc.)
- `src/screens/HistoryScreen.tsx` — new file, full History tab implementation
- `src/App.tsx` or routing file — wire HistoryScreen to Tab 2
- Possibly: `src/store/profileStore.ts` — if you need a helper for dose stats aggregation

**Do NOT modify:**
- src/lib/perceivedEffect/ — the PEL engine files are sacred, hand-tuned, never rewrite
- docs/HANDOFF.md or AI_CONTEXT.md unless instructed
- Firestore security rules (they're already correct)
- index.css color tokens (use them, don't redefine)

---

## Testing Checklist

Before you finish:

1. **Carousel cards:**
   - [ ] Cards render at correct size in carousel
   - [ ] PEL gauge updates every second as time passes
   - [ ] Card 4 (history) shows correct doses and times
   - [ ] Card 5 (forecast) shows a reasonable PEL curve shape
   - [ ] All text uses correct fonts and colors from design system
   - [ ] Swipe navigation still works with all 6 cards
   - [ ] Pagination dots show correct active state

2. **History screen:**
   - [ ] Tab click navigates to History (not a placeholder anymore)
   - [ ] Dose list shows all logged doses in chronological order
   - [ ] Delete removes dose and updates Firestore
   - [ ] Edit modal opens, changes persist
   - [ ] Filter by substance works
   - [ ] Scrolling is smooth, bottom safe area respected
   - [ ] No layout shift or overflow

3. **Integration:**
   - [ ] Timer screen still works (refresh page, doses persist, timer runs)
   - [ ] Switching between Timer and History tabs works
   - [ ] Logging a new dose in Timer updates immediately in History list
   - [ ] Deleting dose in History removes it from Timer's PEL calculations

---

## Questions to Ask Preston (If Stuck)

- If PEL engine API is unclear, ask for a quick example of how to call it
- If History screen scope seems too big, ask which features to defer
- If design tokens feel missing, check HANDOFF.md Section 2b first, then ask
- If Firestore query feels wrong, ask for clarification on data model
- If you're unsure about animation/interaction details, ask for reference or spec

---

## Success Criteria

- [ ] All 6 carousel cards implemented and wired
- [ ] History screen fully functional (list, edit, delete, filter)
- [ ] All CodeRabbit feedback cleared
- [ ] App tested in browser — no console errors, smooth interactions
- [ ] PR ready to merge to main

**Next after merge:** Phase 4b would be Insights screen (patterns, statistics, recommendations) and Tools screen (Dose Buddy calculator, etc.).

---

Good luck! Read @HANDOFF.md and docs/AI_CONTEXT.md first, then jump in.
