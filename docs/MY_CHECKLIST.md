# Doser — My Task Checklist

Read this every time before starting a new Cursor task.

---

## Step 1 — Create the branch YOURSELF in Cursor terminal

Run these three commands in order. Change [task-name] to something descriptive.

  git checkout main
  git pull origin main
  git checkout -b feat/[task-name]

Example: git checkout -b feat/auth-screens

DO NOT let Cursor create the branch. You always create it first.

---

## Step 2 — Open a NEW Cursor Agent chat

Start a fresh chat every time. Never continue an old one for a new task.

---

## Step 3 — Paste this at the top of EVERY prompt

Copy this block and put it before anything else you type:

------------------------------------------------------------
@HANDOFF.md
@STRUCTURE.md

Do not create a new branch. Run git branch first to confirm
which branch you are on, then work only on that branch.

Read the handoff document fully before writing any code.
Pay special attention to HANDOFF.md Section 2b (Design System Rules) —
all new screens must follow those rules for colors, fonts, layout, copy, and animations.

Read the existing codebase before assuming anything.
If anything is unclear, stop and ask before writing code.
------------------------------------------------------------

Then below that, describe what you want built.

---

## Step 4 — Answer any questions Cursor asks

If Cursor stops and asks questions before building — that is correct behavior.
Answer them, then let it proceed.

---

## Step 5 — Test it yourself before approving

Run npm run dev in the terminal and check the browser.
Make sure it looks right before you tell Cursor it's done.

---

## Step 6 — Tell Cursor to commit and push

Once you are happy with it, tell Cursor:

  Looks good. Commit and push.

---

## Step 7 — Open a Pull Request on GitHub

Go to github.com/prestonsokol1130/doser
GitHub will show a banner for your branch — click Compare & pull request
Title it the same as your branch name
Click Create pull request

---

## Step 8 — Wait for CodeRabbit

CodeRabbit will automatically review the PR within a few minutes.
Read every comment it leaves.
If it flags something, fix it before merging.

---

## Step 9 — Merge

Once CodeRabbit is happy and you have reviewed it — click Merge pull request on GitHub.

---

## Step 10 — Clean up

Run these in the terminal after merging:

  git checkout main
  git pull origin main
  git branch -d feat/[task-name]

---

## Rules to never break

- Never push directly to main
- Never let Cursor create a branch
- One task per Cursor chat — never combine multiple things
- Never approve code you have not tested in the browser first
- If CodeRabbit flags something, fix it — do not dismiss it
- If Cursor changes files outside the scope of the task, tell it to stop and revert

---

## Phases still to build

Phase 4 — History + Carousel + 3D Cube: COMPLETE
  - Carousel cards 2–6 are built and wired
  - History screen is built and live
  - Phase 4 review fixes were applied and merged

Phase 5 — Tools + Settings: NEXT
  - Tools: Stash, Dose Buddy, Taper, Emergency Resources, Safety Reference
  - Settings: Account, Profile, Notifications, Themes, Install App, Legal


---

## Final Step — Update AI_CONTEXT.md

After every merged PR, before closing the session, update docs/AI_CONTEXT.md:

1. Change the phase status to reflect what just merged
2. Update "Next task" to the next thing in the phase
3. Add any new tech decisions or known issues discovered this session
4. Commit it: git add docs/AI_CONTEXT.md && git commit -m "chore: update AI context" && git push origin main

This keeps any AI (Claude, ChatGPT, Gemini, Cursor) able to pick up exactly
where you left off by reading this one file.
