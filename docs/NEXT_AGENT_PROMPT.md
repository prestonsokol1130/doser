# Next Task — Build the Local-Only to Account Upgrade Flow

@HANDOFF.md
@STRUCTURE.md

Do not create, switch, or rename any branch. Run `git branch --show-current` first.
Work only on the branch Preston already created for this task. If you are not on the
expected branch, STOP and tell me.

Read before writing any code:

- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md` — especially Section `2b`
- `docs/STRUCTURE.md`

---

## Status

PR `#8` is merged. Phase 5 core Tools and Settings screens are already on `main`.
The local-only access follow-up is now in place on the current branch.
Device-only users can reach the auth screen again, but there is still no explicit
upgrade/import path for moving from local-only use into an account-backed flow.

---

## The task

Implement the next safe step for local-only mode: when a user leaves device-only mode
and signs in or creates an account, the app must present an explicit upgrade decision
instead of silently switching storage models with no explanation.

The minimum acceptable product behavior is:

- If local-only data exists and the user completes auth, the app must stop and explain
  that device-only data and cloud account data are currently separate.
- The user must get an explicit choice before continuing into the signed-in app.
- Do not silently merge local data into Firestore.
- Do not silently delete local-only data.
- Keep the current app theme intact.

Use the live codebase to decide the cleanest implementation, but keep the scope tight.
This task is about the upgrade handoff, not a full sync engine.

Expected touched areas will likely include:

- `src/App.tsx`
- `src/components/auth/*` only if required for the handoff path
- `src/components/onboarding/*` only if required
- `src/components/settings/AccountScreen.tsx` only if required
- new small components/helpers if they fit the existing structure cleanly
- `src/store/localDataStore.ts`
- `src/store/localSessionStore.ts`

Do not touch:

- `src/lib/perceivedEffect/*`
- visual redesign work unrelated to this flow
- unrelated Tools / Settings screens
- Firebase schema unless absolutely necessary

---

## Product rules

- Be explicit about what happens to local-only data
- Do not claim cloud backup exists for local-only history if it does not
- Prefer a clear decision screen over background magic
- If you introduce copy, keep it direct and serious

---

## Validation

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

---

## Acceptance criteria

- A local-only user who signs in is not silently dropped into a different storage model
- The upgrade path is explicit and understandable
- Local-only data is neither silently deleted nor silently merged
- The current theme is preserved
- Validation commands pass

---

## Report back

When finished, tell me:

1. current branch name
2. exact files changed
3. what the upgrade path does now, step by step
4. whether local-only data is preserved, discarded, or queued for later import
5. results of:
   - `npx tsc --noEmit -p tsconfig.app.json`
   - `npm run build`
