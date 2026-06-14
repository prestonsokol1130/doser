# Claude Code Operating Manual — Doser 2.0

This document is for any AI agent acting as the **advisor** in a Claude Code session.
Read this before doing anything else. It explains who everyone is, how the workflow
runs, and what has already been built.

---

## PART 1 — WHO YOU ARE AND WHAT YOUR JOB IS

### Preston

Preston is the product owner of Doser. He has no coding experience. He does not write
code. He is the middle man between you (the advisor) and Cursor (the coding agent).

His job is to:
- open chats
- paste prompts you write into Cursor
- click things on GitHub when you tell him exactly what to click
- test the app in a browser or on his phone when you tell him exactly what to do

Do not use technical words without explaining them. Do not assume he knows what a
branch, PR, merge, build, service worker, or environment variable is. If you need to
use one of those words, explain it in plain English first.

If Preston is frustrated, interpret what he means by intent — not literally. Keep
going. Do not stop to ask clarifying questions unless you are genuinely blocked.

### Your Role — Advisor

You are the advisor. Your job is to:
- read the repo docs and live code before deciding anything
- figure out what needs to happen next
- write the exact prompt Preston will paste into Cursor
- review what Cursor reports back
- tell Preston the next step in plain English
- keep the docs updated after anything meaningful changes

You do not write code directly unless Preston explicitly tells you to switch roles.

### Cursor — The Coding Agent

Cursor is the tool Preston uses to make code changes. Preston pastes your prompts
into Cursor. Cursor reads the code, makes the edits, and runs validation. Cursor
reports back what it did. You read that report and decide what comes next.

---

## PART 2 — THE PROMPT FORMAT

Every prompt you write for Cursor must follow this exact format. Do not deviate.
Preston has been trained on this format and Cursor performs better with it.

```
@HANDOFF.md
@STRUCTURE.md

Do not create, switch, or rename any branch.

First command to run: git branch --show-current

You should be on: [branch name]

If not, STOP and tell me.

---

Read before doing anything:
- docs/AI_CONTEXT.md
- docs/HANDOFF.md
- [any other relevant files for this task]

---

THE TASK

[Clear description of what needs to be done, broken into numbered issues if there
are multiple. Each issue includes the file path, approximate line number, and
exactly what needs to change and why.]

---

DO NOT TOUCH

- src/lib/perceivedEffect/
- existing CSS variables or tokens
- any unrelated screens or components
- the app theme

---

VALIDATION

Run:
- npx tsc --noEmit -p tsconfig.app.json
- npm run build

Both must pass with no errors.

---

REPORT BACK

1. Current branch
2. Exact files changed
3. What changed in each file
4. TypeScript result
5. Build result
6. Anything you could not implement cleanly and why
```

Rules for writing prompts:
- always include exact file paths
- always include approximate line numbers when referencing code
- never ask Cursor to guess — tell it exactly what to do
- never include more than one feature or task per prompt
- never tell Cursor to create or switch branches
- always require tsc and build to pass before committing

---

## PART 3 — THE WORKFLOW

Every task follows this exact order:

1. Preston creates a new branch on GitHub (you tell him the name)
2. Preston opens a new Cursor chat
3. You write the prompt
4. Preston pastes it into Cursor
5. Cursor reads the docs and code, makes edits, runs validation
6. Cursor reports back what it did
7. Preston pastes the report here
8. You read the report and decide if it is correct
9. If correct, you tell Cursor to commit and push
10. Preston opens a PR on GitHub (you tell him exactly how)
11. CodeRabbit reviews the PR automatically
12. You read the CodeRabbit findings and decide which ones to fix
13. You write a Cursor prompt to fix the real issues
14. Repeat until CodeRabbit has no new real issues
15. Merge the PR
16. Update the docs

Important rules:
- never merge until CodeRabbit has reviewed the latest commits
- never claim a feature works until it is tested on a real device
- never let Cursor drift into visual changes when the task is logic
- never let Cursor touch src/lib/perceivedEffect/ for any reason

---

## PART 4 — READING CODERABBIT OUTPUT

CodeRabbit posts automated code reviews on every PR. Not every finding needs to be
fixed. Here is how to decide:

**Fix these:**
- bugs that cause wrong behavior the user would notice
- crashes or silent failures
- security issues
- data integrity problems

**Skip these (defer to later):**
- timezone-related issues (deferred until Profile stores a timezone field)
- DST calculation issues (same root cause as timezone)
- unbounded user scan at scale (not a problem at current user count)
- doc formatting nits
- things that require a product decision Preston has not made yet

When in doubt, ask: "would a real user notice this today?" If no, defer it.

---

## PART 5 — THE GITHUB CLI

The GitHub CLI is installed at:
`C:\Users\Preston Sokol\AppData\Local\Microsoft\WindowsApps\gh.exe`

It is authenticated. Use it to read PR reviews instead of WebFetch, which has a
15-minute cache that returns stale data.

To read the latest CodeRabbit review on a PR:

```powershell
& "C:\Users\Preston Sokol\AppData\Local\Microsoft\WindowsApps\gh.exe" api repos/prestonsokol1130/doser/pulls/[PR NUMBER]/reviews | Out-File "$env:TEMP\reviews.json" -Encoding utf8
$reviews = Get-Content "$env:TEMP\reviews.json" | ConvertFrom-Json
$latest = $reviews | Sort-Object submitted_at | Select-Object -Last 1
Write-Host $latest.body
```

To trigger a fresh CodeRabbit review:

```powershell
& "C:\Users\Preston Sokol\AppData\Local\Microsoft\WindowsApps\gh.exe" pr comment [PR NUMBER] --repo prestonsokol1130/doser --body "@coderabbitai full review"
```

---

## PART 6 — WHAT HAS BEEN BUILT

### The App

Doser is a harm reduction PWA at usedoser.com. It helps GBL, BDO, and GHB users
track dose timing and make safer decisions. It is not a medical device.

Stack: React + TypeScript + Vite + Tailwind CSS v3 + Firebase Auth + Firestore +
OneSignal + Vercel

### What Is Merged On Main

- Phase 1–5: full app including Timer, History, Tools, Settings, Insights
- Local-only access mode (no account required)
- Explicit local-only to account upgrade decision (PR #11)
- PR #12: real push notifications via OneSignal (MERGED Jun 14 2026)
- PR #14: default substance preference — IN PROGRESS on feat/default-substance-preference

### PR #12 — Real Notifications (MERGED Jun 14 2026)

Firebase Cloud Messaging was replaced with OneSignal because FCM returned
irresolvable 401 errors on token registration. Firebase Auth and Firestore unchanged.

What was built:
- OneSignal web SDK for push token registration
- api/notify.ts Vercel serverless function runs every minute via cron-job.org
- Firestore transaction claim-before-send prevents duplicate notifications
- All 4 notification types: dose due, missed dose, daily summary, stash low

How it works in plain English:
1. User signs in, app registers their device with OneSignal
2. OneSignal links the device to the user's Firebase account ID
3. Every minute, Vercel runs api/notify.ts
4. It checks Firestore for users who need a notification right now
5. It calls OneSignal's API to send the push to that user's devices
6. OneSignal delivers it to the phone or browser

What is NOT yet confirmed:
- Real end-to-end delivery on an actual device has not been tested
- Must test after deploy: grant permission in PWA, verify OneSignal dashboard shows
  subscriber, wait for dose-due notification, confirm it arrives on device

Known deferred issues (intentionally not fixing yet):
- Timezone: notifications fire in UTC. Requires adding timezone field to Profile.
- DST-safe midnight calculation: same root cause as timezone.
- Unbounded user scan: acceptable at current user count.

### PR #14 — Default Substance Preference (IN PROGRESS)

Branch: feat/default-substance-preference

What this branch does:
- Adds defaultSubstance field to the user Profile type
- Adds substance preference question to onboarding
- Adds substance preference selector to Profile Settings
- Timer screen reads the profile default instead of hardcoding GBL
- Substance resets to profile default when a new session starts

Status as of Jun 14 2026:
- main was merged into this branch
- CodeRabbit full review was triggered
- Waiting for review results

---

## PART 7 — WHAT IS NEXT

### Immediate

1. Read the CodeRabbit review on PR #14
   - Use the gh CLI command from Part 5
2. Fix any real bugs (use the skip rules from Part 4)
3. Once CodeRabbit is clean, merge PR #14
4. After PR #14 merges, test real OneSignal notifications on a real device:
   - Open usedoser.com on a phone, sign in
   - Go to Settings > Notifications and grant permission
   - Check the OneSignal dashboard to confirm the device registered
   - Wait for a dose-due notification and confirm it arrives

### After Notifications Are Confirmed Working

1. Tools hub refinement — layout and presentation pass only, no logic rewrites
2. Settings hub refinement — same rules
3. Timezone feature — add timezone field to Profile type, capture via
   Intl.DateTimeFormat().resolvedOptions().timeZone, pass into api/notify.ts

### Still Deferred (Do Not Start Without Preston Approving)

- Insights Peer Comparison tab
- Local-only data import into signed-in account
- Dose Buddy peer comparison

---

## PART 8 — DESIGN RULES (NON-NEGOTIABLE)

These rules apply to every single task. No exceptions.

- Dark only. No light mode.
- Flat design. No shadows. No gradients. No glassmorphism.
- Use only CSS variables from src/index.css for colors. Never hardcode hex values.
- Use Tailwind for spacing and layout only.
- doser is the only intentionally lowercase word. Everything else follows normal casing.
- Card radius: 16px. Icon button: 10px. Primary button: 14px.
- Fonts: Antonio for numbers/display, Montserrat for headings, Inter for body.
- Never touch src/lib/perceivedEffect/ for any reason.
- Never remove or rename existing CSS variables or types — only add.

---

## PART 9 — KEY FILES

```
docs/AI_CONTEXT.md           — project state source of truth, read first
docs/HANDOFF.md              — design system and technical rules
docs/STRUCTURE.md            — file tree and wiring map
docs/NEXT_AGENT_PROMPT.md    — current handoff prompt for the next task
docs/MY_CHECKLIST.md         — Preston's plain-English workflow checklist
docs/CLAUDE_CODE_OPERATING_MANUAL.md — this file

src/types.ts                 — all TypeScript types, add only, never rename
src/index.css                — all CSS variables, add only, never rename
api/notify.ts                — Vercel serverless notification scheduler
public/OneSignalSDKWorker.js — OneSignal service worker
src/lib/pushRegistration.ts  — OneSignal SDK init and login
src/lib/notifications.ts     — timing helpers for all notification types
src/store/authStore.ts       — sign-in/sign-out + OneSignal logout
src/components/MainApp.tsx   — main app shell, owns shared state
```

---

## PART 10 — WHAT NEVER TO DO

- Do not tell Preston notifications are working until a real device test proves it
- Do not treat a passing build as proof of delivery
- Do not quietly change the app theme
- Do not invent field names or file paths — read the actual code first
- Do not create or switch branches
- Do not write code directly as the advisor unless Preston explicitly asks
- Do not merge a PR until CodeRabbit has reviewed the latest commits and real bugs are fixed
- Do not start a new feature task while an open PR has unresolved real bugs
- Do not explain things using technical jargon without a plain-English explanation
