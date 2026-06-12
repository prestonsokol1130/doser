# doser

Current repo status as of 2026-06-12:

- `main` includes PR `#8` (`a2f9938 feat: complete phase 5 tools and settings (#8)`).
- Phases 1 through 5 core work are merged.
- The latest follow-up adds a device-only path alongside account-backed use:
  - `Continue on this device` from the log in screen
  - local onboarding, profile, dose, and dose-context persistence in `localStorage`
  - a reversible exit path back to auth from `Settings` -> `Account`
  - honest copy that local-only data does not migrate into Firebase yet
- Live main-app tabs:
  - `Timer` — complete
  - `History` — complete
  - `Tools` — complete
  - `Settings` — complete
  - `Insights` — live (Peer Comparison tab still deferred)
- Phase 5 merged:
  - Tools hub plus Stash, Dose Buddy, Taper, Emergency Resources, Safety Reference
  - Settings hub plus Account, Profile, Notifications, Themes, Install App, Legal
  - Stash `fullMl` model so the tank can visually deplete correctly
  - Dose Buddy check-in sheet cleanup and mobile sizing refinements
  - CodeRabbit follow-up fixes and accessibility/persistence cleanups

Immediate next likely work:

- Build an explicit local-only -> account upgrade flow so a device-only user can
  choose what happens to their local profile and doses after signing in
- After that, import approved visual references for the Tools / Settings redesign
  into `docs/ai-reference/goal/`
- Refine the `Tools` hub first, then the `Settings` hub, one screen at a time
- Keep the current app theme intact

Read [docs/AI_CONTEXT.md](docs/AI_CONTEXT.md) first before making any product,
design, or implementation decision.
