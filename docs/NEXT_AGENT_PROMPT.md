# Next Task — Finish And Verify Real Notifications V1

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

PR `#11` merged the explicit local-only upgrade decision to `main`. That work is done.

You are likely continuing branch:

- `feat/real-notifications-v1`

The next active task is on branch:

- `feat/real-notifications-v1`

This branch is in progress. It is not merged to `main`.

This branch already added:

- browser notification permission UI in `src/components/settings/NotificationsScreen.tsx`
- onboarding notification cleanup in `src/components/onboarding/NotificationBasics.tsx`
- browser push registration in `src/lib/pushRegistration.ts`
- shared timing helpers in `src/lib/notifications.ts`
- service worker registration in `src/main.tsx`
- custom service worker in `src/sw.ts`
- Firebase Functions package in `functions/`
- scheduled notification sender in `functions/src/index.ts`
The app build passes.
The functions package build passes.

What is still not proven:

- real signed-in browser/PWA background notification delivery on a device

Do not describe notifications as fully working unless you personally verify real
end-to-end delivery during this task.

---

## The task

Finish the notifications branch correctly by the book.

That means:

1. verify the local app is using the right env/config for Firebase web push
2. verify the Firebase Functions package is wired correctly for deployment
3. test the real notification flows on the live local app as far as this environment allows
4. fix anything blocking real delivery
5. keep the current app theme intact
6. keep the scope on notifications only

---

## Required paths to inspect

- `src/components/settings/NotificationsScreen.tsx`
- `src/components/onboarding/NotificationBasics.tsx`
- `src/components/MainApp.tsx`
- `src/lib/firebase.ts`
- `src/lib/notifications.ts`
- `src/lib/pushRegistration.ts`
- `src/lib/sessionStats.ts`
- `src/main.tsx`
- `src/sw.ts`
- `src/store/authStore.ts`
- `src/store/profileStore.ts`
- `functions/src/index.ts`
- `firebase.json`
- `.env.example`

---

## Product rules

- missed-dose alert is a separate toggle
- missed-dose alert happens 1 hour after redose eligibility
- session auto-end follows 3 hours after redose eligibility
- daily summary stays simple
- stash low alert only fires on threshold crossing
- do not bring back dose logged confirmation
- do not replace the Firebase background path with a fake open-app-only solution
- do not claim local-only users get real account-backed background notifications

---

## Validation

Run:

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`
- in `functions/`: `npm run build`

If possible in this environment, also verify:

- permission request behavior
- token registration behavior
- due reminder path
- missed-dose path
- daily summary path
- stash low path

If any of those cannot be truly verified, say that clearly instead of pretending.

---

## Acceptance criteria

- notification branch remains honest about what is and is not verified
- browser permission path is clear
- push token registration path is sound
- functions package builds
- app build passes
- any real delivery blockers found during testing are fixed
- current theme is preserved

---

## Report back

When finished, tell me:

1. current branch name
2. exact files changed
3. what was verified for real
4. what is still unverified
5. results of:
   - `npx tsc --noEmit -p tsconfig.app.json`
   - `npm run build`
   - `functions/npm run build`
