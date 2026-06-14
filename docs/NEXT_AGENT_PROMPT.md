# Next Task — Merge feat/real-notifications-v1

@HANDOFF.md
@STRUCTURE.md

Do not create, switch, or rename any branch. Run `git branch --show-current` first.
Work only on `feat/real-notifications-v1`. If you are not on that branch, STOP and say so.

Read before writing any code:

- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md`
- `docs/STRUCTURE.md`

---

## What happened in the last session

FCM was replaced with OneSignal entirely (401 errors on FCM registrations could not be resolved).
Firebase Auth and Firestore are unchanged. The full OneSignal migration is complete and built.

Cursor fixed multiple rounds of CodeRabbit issues on this branch. The GitHub CLI (`gh`) is now
installed at `C:\Users\Preston Sokol\AppData\Local\Microsoft\WindowsApps\gh.exe` and authenticated.

The last CodeRabbit full review (ID 4492153674, Jun 13 2026 23:17) was read via the GitHub API.
Cursor was given a prompt to fix the final 4 issues from that review. Preston confirmed it is done
but has not pushed yet as of this handoff. Confirm the latest commit is pushed before proceeding.

---

## Current status of PR #12 (feat/real-notifications-v1)

Branch: `feat/real-notifications-v1`
PR: https://github.com/prestonsokol1130/doser/pull/12

The last Cursor task fixed:

1. `src/components/timer/carousel/SessionCompareCard.tsx` — 7-day baseline now uses profile-aware session boundaries instead of fixed 6-hour gap
2. `src/lib/notifications.ts` — fallbacks added for missing profile fields (GBL=90min, BDO=120min, lead=5min)
3. `src/components/settings/NotificationsScreen.tsx` — re-reads `auth.currentUser?.uid` after `requestPermission` await before calling `syncPushRegistration`
4. `docs/STRUCTURE.md` — updated to describe OneSignal flow instead of Firebase push

Known deferred issues (CodeRabbit keeps flagging these — they are intentionally not fixed yet):

- Timezone: daily summaries run in UTC. Requires adding `timezone` field to Profile type. Deferred.
- DST-safe midnight offset: same root cause as timezone. Deferred.
- Unbounded user scan per cron run: acceptable at current user count. Deferred.
- Claim ownership on failure: edge case at very low concurrency. Deferred.

These are not regressions. Do not fix them without Preston approving the scope change.

---

## Your task

1. Confirm the last Cursor commit is pushed to `feat/real-notifications-v1`
2. Run `@coderabbitai full review` as a comment on PR #12 to trigger a fresh CodeRabbit review
3. Wait for CodeRabbit to post its review
4. Read the review using the GitHub CLI:
   ```
   gh api repos/prestonsokol1130/doser/pulls/12/reviews | Out-File "$env:TEMP\reviews.json" -Encoding utf8
   $reviews = Get-Content "$env:TEMP\reviews.json" | ConvertFrom-Json
   $latest = $reviews | Sort-Object submitted_at | Select-Object -Last 1
   Write-Host $latest.body
   ```
5. If CodeRabbit has NEW actionable issues (not the deferred ones listed above), fix them with Cursor
6. If CodeRabbit only has the deferred issues or is clean, merge PR #12

To merge:
```
gh pr merge 12 --repo prestonsokol1130/doser --squash --auto
```

---

## After merging PR #12

1. Verify Vercel auto-deploys to production (check https://usedoser.com)
2. Test OneSignal notifications end to end on a real signed-in device:
   - grant permission in the PWA
   - verify OneSignal dashboard shows a subscriber
   - wait for a dose-due notification
   - verify it arrives
3. Create the Firestore composite index if Firebase logs a URL on first query
4. If notifications work, PR #12 is fully done

---

## Required paths to inspect

- `src/components/settings/NotificationsScreen.tsx`
- `src/components/onboarding/NotificationBasics.tsx`
- `src/components/MainApp.tsx`
- `src/lib/notifications.ts`
- `src/lib/pushRegistration.ts`
- `src/store/authStore.ts`
- `api/notify.ts`
- `public/OneSignalSDKWorker.js`

---

## Validation

Run before any commit:

- `npx tsc --noEmit -p tsconfig.app.json`
- `npm run build`

Both must pass with no errors.

---

## Report back

When finished, tell Preston:

1. current branch
2. exact files changed
3. what was fixed
4. what is still deferred and why
5. whether PR #12 is merged
6. whether production delivery was tested and what the result was
