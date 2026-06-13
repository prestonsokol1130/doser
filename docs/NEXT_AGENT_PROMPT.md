# Next Task — Add the Explicit Local-Only Upgrade Decision

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

Phase 5 core Tools and Settings screens are already on `main`.
The local-only access follow-up is also already merged on `main` at `88d8446`.

Current live local-only flow:

- `src/components/auth/LogIn.tsx` offers `Continue on this device`
- `src/store/localSessionStore.ts` sets the `doser.localOnly` session flag
- `src/App.tsx` routes device-only users into local onboarding or the main app
- `src/store/localDataStore.ts` persists local profile, doses, dose contexts, and
  the local onboarding-complete flag
- `src/components/settings/AccountScreen.tsx` can send a device-only user back to auth

Current gap:

- once a Firebase auth session appears, `src/App.tsx` immediately calls
  `clearLocalOnlyMode()`, sets `localOnly` false, and routes into the signed-in flow
- that means a device-only user who logs in does not get an explicit storage-upgrade
  decision yet

---

## The task

Implement the next safe step for local-only mode: when a user leaves device-only mode
and signs in or creates an account, the app must hit an explicit upgrade decision
instead of silently switching storage models with no explanation.

The minimum acceptable product behavior is:

- If local-only data exists and the user completes auth, the app must stop and explain
  that device-only data and cloud account data are currently separate.
- The user must get an explicit choice before continuing into the signed-in app.
- Do not silently merge local data into Firestore.
- Do not silently delete local-only data.
- Do not silently overwrite existing cloud-backed data with local-only data.
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
- `src/components/MainApp.tsx` only if genuinely required

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
- Preserve the current dark theme and current typography/capitalization rules

## Suggested implementation direction

Use the real code, but the handoff seam is likely:

1. Device-only user enters from `Settings` -> `Account` -> `Log In or Create Account`
2. User completes Firebase auth
3. App detects both:
   - a valid Firebase session
   - existing local-only data
4. App pauses before normal signed-in routing and shows a clear decision surface
5. User explicitly chooses how to proceed

Keep the first pass small and safe. An acceptable initial version is a decision flow
that preserves local-only data for later import and lets the user continue into the
account-backed app only after acknowledging that the two storage models are separate.

---

## Validation

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`
- `npm run lint` is optional for this task because there is existing unrelated lint debt

---

## Acceptance criteria

- A local-only user who signs in is not silently dropped into a different storage model
- The upgrade path is explicit and understandable
- Local-only data is neither silently deleted nor silently merged
- Existing cloud-backed data is not silently overwritten
- The current theme is preserved
- Validation commands pass

## Browser checks

Test at least this path locally:

- Log in screen -> `Continue on this device` -> finish onboarding -> reach main app
- `Settings` -> `Account` -> `Log In or Create Account`
- complete sign-in or sign-up
- confirm the app stops at the explicit upgrade decision instead of silently entering
  the signed-in app
- reload after the decision path and confirm behavior is consistent

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
