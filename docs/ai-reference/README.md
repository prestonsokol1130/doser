# AI Reference Assets

Use this folder as the source of truth for screenshots and mockups that AI agents
should reference in prompts.

## Folder Structure

- `current-app-state/`
  - Latest screenshots of the app as it exists right now.
  - Use these when asking an agent to inspect regressions, compare current UI, or
    understand what is already built.
- `goal/`
  - Target inspiration, mockups, annotated screenshots, and desired design
    direction.
  - Use these when asking an agent to redesign or restyle a surface.
  - These are directional references only. They must not be copied literally and
    must not be used to justify a different visual system than the current app.
- `archive/`
  - Older screenshots and superseded prompt assets.
  - Do not treat these as the current source of truth unless the prompt says to.

## Rules

1. Put new screenshots here instead of leaving them in `Downloads` or another
   machine-specific path.
2. When a screenshot becomes the new source of truth, place it in
   `current-app-state/` or `goal/` with a clear filename.
3. Move outdated screenshots to `archive/` instead of deleting them when history
   may still be useful.
4. Prompts should reference repo-owned files from this folder, not absolute local
   paths outside the repo.
5. The current app theme remains the source of truth even when `goal/` contains
   strong visual references.
6. The 2026-06-10 Stash + Dose Buddy pass used the `goal/` screenshots and was
   rejected for theme drift. On 2026-06-11 it was rolled back to the app theme, and
   the Stash screen was then redesigned from a Claude Design handoff. Treat `goal/`
   images as directional only — never as authorization for a new visual system.

## Filename Suggestions

- `stash-current.png`
- `stash-goal.png`
- `dose-buddy-setup-current.png`
- `dose-buddy-setup-goal.png`
- `dose-buddy-checkin-goal.png`

If a prompt depends on visuals, mention the exact files from this folder near the
top of the prompt.
