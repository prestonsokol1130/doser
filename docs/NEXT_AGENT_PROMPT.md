# Next Task — Fix Production Deploy + Verify Notifications

@HANDOFF.md
@STRUCTURE.md

Do not create, switch, or rename any branch.

First command to run: git branch --show-current

You should be on: main

If not, STOP and tell me.

---

Read before doing anything:
- docs/AI_CONTEXT.md
- docs/HANDOFF.md
- docs/CLAUDE_CODE_OPERATING_MANUAL.md
- api/notify.ts

---

## What Happened This Session

PR #12 (feat/real-notifications-v1) was merged to main on Jun 14 2026.

A production deploy was triggered via the Vercel API. It deployed commit 8afe6c3
which had a TypeScript error that slipped past the build: a variable named `body`
was used before its declaration in `sendOneSignalPush` in `api/notify.ts`.

This caused usedoser.com to show a black screen. The Vercel logs showed:
  "Cannot access 'body' before initialization"
  on every POST /api/notify cron call.

The fix was applied on main in commit 3b9f56e:
  "fix: resolve body variable shadowing in sendOneSignalPush"
  - renamed the parsed OneSignal response variable from `body` to `responseBody`
  - updated 3 usages of that variable in the same function

tsc and npm run build both passed after the fix.

A second production deploy was triggered via the Vercel API targeting commit 3b9f56e.
Deploy URL: doser-htkwskl8b-prestonsokol1130-6341s-projects.vercel.app
That deploy may or may not have completed by the time you read this.

---

## Your First Job

1. Check if the new deploy is live:
   - Open https://usedoser.com — does it load?
   - Check the Vercel dashboard for the project "doser" — is the latest deployment
     from commit 3b9f56e marked as Ready and promoted to Production?

2. If the deploy is not promoted to production yet:
   - Go to the Vercel dashboard
   - Find the deployment doser-htkwskl8b-prestonsokol1130-6341s-projects.vercel.app
   - Click the three dots next to it and click "Promote to Production"

3. If usedoser.com loads correctly after promotion:
   - Ask Preston to open it on his phone, sign in, go to Settings → Notifications,
     and grant permission
   - Then check the OneSignal dashboard at dashboard.onesignal.com → Audience →
     Subscriptions to see if Preston's device appears

4. If usedoser.com is still black after promotion:
   - Check the Vercel build logs for commit 3b9f56e for any new errors
   - Fix any errors found in api/notify.ts on main, commit, push, and redeploy

---

## Vercel Project Info

Project ID: prj_XoQl5z1GL156j5G7XyywyQ5ajFAG
Team ID: team_PfeZqxnT0NDAs2WeZzMwwirH
GitHub repo: prestonsokol1130/doser (repo ID: 1260952512)
Production branch: main

NOTE: Ask Preston to create a Vercel token at vercel.com/account/tokens.
The previous token was revoked.

To trigger a production deploy via API:
POST https://api.vercel.com/v13/deployments?teamId=team_PfeZqxnT0NDAs2WeZzMwwirH
Body: {"name":"doser","gitSource":{"type":"github","repoId":1260952512,"ref":"main"},"target":"production"}
Auth: Bearer <token>

The GitHub CLI is installed at:
C:\Users\Preston Sokol\AppData\Local\Microsoft\WindowsApps\gh.exe
It is authenticated. Use it to read PR reviews and repo state.

---

## After The Site Is Back Up

Once usedoser.com loads:

1. Preston opens it on his phone, signs in
2. Goes to Settings → Notifications, grants permission
3. Check OneSignal dashboard → Audience → Subscriptions for his device
4. If device appears: wait for a dose-due notification or trigger one manually
5. If no device appears after granting permission: the OneSignal SDK init is
   failing — check browser console on the phone for errors

---

## PR #14 — Still Open

Branch: feat/default-substance-preference
PR: https://github.com/prestonsokol1130/doser/pull/14

This branch adds a default substance preference to the user profile. Main was
merged into it. A CodeRabbit full review was triggered. After the production
site is stable, check this PR and handle any CodeRabbit findings before merging.

---

## Known Deferred Issues (Do Not Fix Without Preston Approving)

- Timezone: notifications fire in UTC. Requires adding timezone field to Profile.
- DST-safe midnight calculation: same root cause.
- Unbounded user scan: acceptable at current user count.

---

## Validation

Run before any commit:
- npx tsc --noEmit -p tsconfig.app.json
- npm run build

Both must pass.

---

## Report Back To Preston

1. Is usedoser.com loading?
2. Did Preston's device appear in OneSignal after granting permission?
3. Did a test notification arrive?
4. What is still not working and why?
