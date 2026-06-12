# AI Reference Assets

Use this folder as the source of truth for screenshots and mockups that AI agents
reference in prompts.

---

## Folder structure

- `current-app-state/`
  - Screenshots of what the app looks like now
  - Use these for regression checks and current-UI comparisons
- `goal/`
  - Approved directional targets, mockups, and inspiration
  - Use these for visual refinement prompts
- `archive/`
  - Older or superseded references

---

## Critical rules

1. Put prompt reference images in this repo folder, not in `Downloads`.
2. Prompts should reference repo-owned files from this folder.
3. Goal images are directional only unless Preston explicitly says to copy closely.
4. Goal images never authorize a different theme, different fonts, different capitalization system, or different product feel.
5. If the current UI changed materially, add fresh `current-app-state` screenshots before writing the next visual prompt.

---

## Important current caveat

The files currently in `current-app-state/` are not a clean snapshot of the live app.
They are historical wrong-theme examples from the rejected 2026-06-10 pass:

- `docs/ai-reference/current-app-state/dose buddy wroing theme.png`
- `docs/ai-reference/current-app-state/stash-screen-wrong-theme.png`

Do not treat those two files as the visual source of truth for current main.

Before the next visual refinement task, add fresh current-state screenshots for the
actual merged UI.

---

## Recommended next screenshots to add

- `tools-hub-current.png`
- `settings-hub-current.png`
- `tools-hub-goal.png`
- `settings-hub-goal.png`

Use clear names so prompts can reference exact files without confusion.
