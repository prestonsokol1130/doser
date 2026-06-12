# Doser v0 Design Rules

This page is the repo-grounded design brief to hand to v0 when generating UI concepts for Doser.

Use this together with:
- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md`
- `docs/STRUCTURE.md`

If you have fresh screenshots in `docs/ai-reference/`, include them too. Do not rely on random external references or old `Downloads` images.

## What Doser Is

- Doser is a harm-reduction PWA for GBL, BDO, and GHB users.
- It helps users track dose timing, review session patterns, and estimate perceived effect level.
- It is not a medical device.
- It should feel precise, calm, serious, and useful.
- It should not feel playful, casual, glossy, or gamified.

## Current App Surface

Top-level tabs in the live app:
- Insights
- History
- Timer
- Tools
- Settings

Current status as of 2026-06-12:
- `Timer` is live
- `History` is live
- `Tools` is live
- `Settings` is live
- `Insights` is live (Peer Comparison tab still deferred)

For Tools and Settings work, preserve the existing navigation model. Improve the hub presentation, not the overall product architecture.

## Brand and Tone

The app should communicate:
- timing awareness
- harm reduction
- measured clarity
- seriousness without panic
- utility over decoration

The app should avoid:
- streak language
- gamification
- celebration mechanics
- playful health branding
- vague wellness language
- flashy consumer-fintech dashboard patterns

## Design System Tokens

Use only the live CSS variables from `src/index.css`.

Primary tokens:
- `var(--app-bg)` = full app background
- `var(--app-surface)` = primary card background
- `var(--app-surface-alt)` = alternate elevated surface
- `var(--app-divider)` = border and divider color
- `var(--app-text)` = main text
- `var(--app-dim)` = secondary text
- `var(--app-faint)` = low-emphasis text
- `var(--color-ring)` = main accent and active state
- `var(--color-action)` = action / warning accent
- `var(--color-load)` = supporting accent

Legacy tokens such as `--color-accent`, `--color-cta`, `--color-purple`, `--color-surface`, and `--color-border` are for older gate/auth/onboarding surfaces. Do not use them for new Tools or Settings concepts.

## Typography

Use the app font variables only:
- `var(--font-display)` for large numbers only
- `var(--font-heading)` for section titles and strong headings
- `var(--font-body)` for labels, descriptions, buttons, and navigation

Typography behavior:
- UI labels and buttons should stay uppercase
- Supporting descriptive copy should stay sentence case
- Only the `doser` wordmark uses the existing lowercase brand rule
- Numeric values should include units like `mL`, `min`, `%`, or `day(s)` where relevant

## Layout Rules

- Mobile-first
- Reference width: 390px
- Respect safe areas
- Prefer flex and grid with `gap`
- Keep spacing clean and intentional
- Use Tailwind for spacing and structure only
- Use CSS variables for all colors
- Never hardcode hex values in generated UI

## Component Rules

Cards:
- background: `var(--app-surface)`
- border: `1px solid var(--app-divider)`
- radius: `16px`

Icon buttons:
- radius: `10px`

Primary buttons:
- radius: `14px`

Interaction:
- prefer opacity transitions over decorative color choreography
- use restrained motion only
- keep states clear and legible

## What v0 Must Not Do

- No gradients
- No drop shadows
- No glassmorphism
- No light mode
- No off-theme palettes
- No heavy purple direction
- No big generic dashboard charts on navigation hubs
- No shadcn-default look with white panels and startup-marketing composition
- No emoji
- No casual lowercase system labels

## Live Visual Patterns Worth Preserving

These are strong patterns already present in the repo:
- Dark restrained surfaces with thin dividers
- Uppercase labels with tight tracking
- Large display numerics for meaningful values only
- Accent color used sparingly for active states and key metrics
- Compact stat pills and status chips
- Clear separation between content cards and background

The Stash screen is especially useful as a reference for:
- strong information hierarchy
- clear quantitative emphasis
- compact supporting stats
- serious visual tone without becoming boring

## Tools Hub Content Model

The Tools hub is currently a navigation hub for:
- `Stash`
- `Dose Buddy`
- `Taper`
- `Emergency Resources`
- `Safety Reference`

When generating a better Tools hub, each destination should explain both:
- what it is
- why the user might open it now

Recommended live-summary behavior:
- `Stash`: show current remaining amount and percent; surface a low state when relevant
- `Dose Buddy`: show enabled/off and whether check-in before dose is on
- `Taper`: show active/inactive and today’s target when active
- `Emergency Resources`: keep urgent, clear, and immediate
- `Safety Reference`: keep calm and informational

Recommended hierarchy:
- `Stash` should be the most information-rich item
- `Dose Buddy` and `Taper` should feel like active utilities
- `Emergency Resources` should stand out enough to be found fast, but not visually hijack the whole page

## Settings Hub Content Model

The Settings hub is currently a navigation hub for:
- `Account`
- `Profile`
- `Notifications`
- `Themes`
- `Install App`
- `Legal`

Recommended live-summary behavior:
- `Account`: signed-in email
- `Profile`: nickname and signal that dose defaults/body profile are configured
- `Notifications`: summary of reminder state
- `Themes`: dark only
- `Install App`: installed or ready-to-install style message
- `Legal`: terms and privacy

Recommended hierarchy:
- `Account`, `Profile`, and `Notifications` are the primary controls
- `Themes`, `Install App`, and `Legal` are secondary utility destinations

## Good Directions for v0

- Turn flat list rows into more expressive navigation cards
- Add stronger visual hierarchy
- Use grouping where it improves scanability
- Show status, state, or useful metadata directly on the hub item
- Keep the screens obviously navigational, not analytical dashboards
- Make the pages feel more finished and purposeful than the current plain list treatment

## Bad Directions for v0

- Replacing the Doser theme
- Redesigning inner tools screens instead of the hub
- Introducing a wellness aesthetic
- Using abstract illustration instead of useful information
- Turning the page into a dashboard that competes with the Timer screen
- Making every destination equally loud

## Screenshot Rules

- Use repo-owned images from `docs/ai-reference/`
- Goal images are directional only
- They do not authorize a new theme, new fonts, new capitalization system, or a different product feel
- The current files in `docs/ai-reference/current-app-state/` are historical wrong-theme examples and should not be treated as the live source of truth
- Before the next visual pass, add fresh screenshots such as:
  - `tools-hub-current.png`
  - `settings-hub-current.png`
  - `tools-hub-goal.png`
  - `settings-hub-goal.png`

## Implementation Reality

These designs need to be believable for the real repo:
- React
- TypeScript
- Vite
- Tailwind CSS v3

The current live hub files are:
- `src/components/tools/ToolsScreen.tsx`
- `src/components/settings/SettingsScreen.tsx`
- `src/components/tools/NavRow.tsx`
- `src/components/tools/SubScreenHeader.tsx`

The generated concept should help improve those surfaces, not replace the app with a different product.
