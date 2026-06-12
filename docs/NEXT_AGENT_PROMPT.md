# Next Task — Refine the Tools Hub Only

@HANDOFF.md
@STRUCTURE.md

Do not create, switch, or rename any branch. Run `git branch --show-current` first.
Work only on the branch Preston already created for this task. If you are not on the
expected branch, STOP and tell me.

Read before writing any code:

- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md` — especially Section `2b`
- `docs/STRUCTURE.md`
- `docs/ai-reference/README.md`

If the approved Tools hub goal screenshots are not present inside
`docs/ai-reference/goal/`, STOP and tell me before changing any code.

---

## Status

PR `#8` is merged. Phase 5 core Tools and Settings screens are already on `main`.
This is a refinement task, not a rebuild.

The next visual work should start with the `Tools` hub only.

---

## The task

Refine the `Tools` hub screen only so it better matches the approved direction from
the repo-owned goal references while staying fully inside the existing Doser theme.

Change only the hub-level presentation for:

- `src/components/tools/ToolsScreen.tsx`

You may also adjust only these shared presentation files if needed:

- `src/components/tools/NavRow.tsx`
- `src/components/tools/SubScreenHeader.tsx`
- `src/index.css` — add tokens only if truly necessary, never remove or rename existing ones

Do not change:

- `src/components/tools/StashScreen.tsx`
- `src/components/tools/DoseBuddyScreen.tsx`
- `src/components/tools/TaperScreen.tsx`
- `src/components/tools/EmergencyResourcesScreen.tsx`
- `src/components/tools/SafetyReferenceScreen.tsx`
- any Firestore logic
- any PEL logic

---

## Design rules

- CSS variables only: `--color-ring`, `--color-action`, `--color-load`, `--app-*`
- Use `color-mix(...)` for translucent accent treatments
- Fonts only through `--font-display`, `--font-heading`, `--font-body`
- Card radius `16px`
- Icon button radius `10px`
- Primary button radius `14px`
- No gradients
- No shadows
- No emoji
- Only `doser` is lowercase
- Keep the existing app theme intact

This is a refinement, not permission to invent a different product feel.

---

## Validation

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

---

## Acceptance criteria

- The `Tools` hub looks more intentional and polished than the current list pass
- The current theme is preserved
- Navigation behavior is unchanged
- Only the allowed files were touched
- Validation commands pass

---

## Report back

When finished, tell me:

1. current branch name
2. exact files changed
3. what visual changes were made
4. whether any repo-owned goal screenshots were used, and which ones
5. results of:
   - `npx tsc --noEmit -p tsconfig.app.json`
   - `npm run build`
