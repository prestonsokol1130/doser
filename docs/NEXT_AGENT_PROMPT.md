# Next Task — Redesign the Stash Tank Water Animation

@HANDOFF.md
@STRUCTURE.md

Do not create a new branch. Run `git branch --show-current` first and work only on
the existing branch. You must be on `feat/phase-5-tools-settings`. If you are not,
STOP and tell Preston. Never create, switch, or rename branches.

Read before writing any code:
- docs/AI_CONTEXT.md  (full current state — read the Phase 5 section in full)
- docs/HANDOFF.md     (especially Section 2b — Design System Rules)
- docs/STRUCTURE.md

NEVER DEVIATE FROM THE CURRENT APP THEME. NO EXCEPTIONS.

## Status

Phase 5 Tools + Settings screens are built and the Stash screen was redesigned on
2026-06-11 (liquid-tank hero, inline refill, hold-to-accelerate stepper, low-alert
presets) with a new `fullMl` stash model. All Phase 5 work is UNCOMMITTED on
`feat/phase-5-tools-settings`.

## The task

Redesign the **Stash tank water animation**. The current "slosh" animation was
rejected by Preston — it looks bad.

What it must look like:
- Water sloshing inside a tank that is being moved horizontally, in BOTH directions
  (oscillating back and forth), not drifting one way.
- Clearly noticeable, but not overdone or distracting.
- The slosh intensity INCREASES when the user changes the volume with the +/-
  buttons (and the quick chips / stepper), then settles back to a calm idle.
- Still turns the app's orange (`var(--color-action)`) when the stash is low, and
  respects `prefers-reduced-motion`.

Where the current (rejected) animation lives — replace/redo only this:
- `src/index.css` → `@keyframes stashSlosh`, `@keyframes stashRipple`
- `src/components/tools/StashScreen.tsx` → the `StashVessel` component, the
  `BASE_SLOSH` constant, the `WAVE_A` mask string, and the `requestAnimationFrame`
  "boost" effect driven by the `boostSignal` prop.

## Constraints

- Colors: CSS variables only (`--color-ring`, `--color-action`, `--app-*`); use
  `color-mix(...)` for accent tints. Never hardcode hex/rgba for colors.
- Do not change the stash data model, the `fullMl` logic, `src/lib/stash.ts`, or any
  other screen. This is an animation-only change to the tank visual.
- Do not modify `src/lib/perceivedEffect/`.
- Keep the `StashScreen` props interface and all existing functionality intact.

## Validation

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

## Report back

- What animation approach you used and why it reads as horizontal sloshing.
- How the intensity boost on volume change works.
- Confirm only the animation files above were touched.
- Paste the results of the two validation commands.
