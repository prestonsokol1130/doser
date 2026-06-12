# Doser — My Task Checklist

Read this before every new Cursor task.

---

## Step 1 — Create the branch yourself

Open the terminal in the repo folder and run:

```powershell
git checkout main
git pull origin main
git checkout -b feat/[task-name]
```

Replace `[task-name]` with a short name for the task.

Example:

```powershell
git checkout -b feat/tools-hub-refine
```

Do not let Cursor create the branch.

---

## Step 2 — Open a brand-new Cursor chat

Never reuse an old Cursor chat for a new task.

---

## Step 3 — Paste the prompt from your advisor

Your advisor should give you one focused prompt.

Before you send it, make sure it:

- starts with the branch rule
- includes `@HANDOFF.md`
- includes `@STRUCTURE.md`
- says to read `docs/AI_CONTEXT.md`
- says to read `docs/HANDOFF.md` Section `2b`
- uses exact file paths
- covers one task only

If the task is visual:

- use screenshots from `docs/ai-reference/`
- do not use screenshots from `Downloads`
- say whether the screenshots are directional or should be copied closely
- do not change the current app theme unless you explicitly approve that

---

## Step 4 — Answer Cursor's questions

If Cursor asks questions before coding, that is normal.

Paste the questions to your advisor.
Paste the advisor's answers back into Cursor.

---

## Step 5 — Test it yourself

In the repo terminal, run:

```powershell
npm run dev
```

Then open the browser and test the exact thing that changed.

Do not approve code you have not tested yourself.

---

## Step 6 — Have Cursor commit and push

When the change is correct and tested, tell Cursor:

```text
Looks good. Commit and push.
```

---

## Step 7 — Open the Pull Request

Go to:

- `https://github.com/prestonsokol1130/doser`

Then:

1. click the banner for your branch
2. click `Compare & pull request`
3. confirm the base branch is `main`
4. create the PR

---

## Step 8 — Wait for CodeRabbit

Do not merge immediately.

Wait for CodeRabbit.
If CodeRabbit finds issues, fix them before merging.

---

## Step 9 — Merge

After:

- your own browser test passed
- CodeRabbit is clean
- the PR checks passed

merge the PR into `main`.

---

## Step 10 — Clean up locally

After merge, run:

```powershell
git checkout main
git pull origin main
git branch -d feat/[task-name]
git fetch origin --prune
```

---

## Step 11 — Update the docs

After every merged PR, update:

- `docs/AI_CONTEXT.md`
- `docs/NEXT_AGENT_PROMPT.md`
- any other docs that became stale
- `docs/ai-reference/` if the visual source of truth changed

This is mandatory. Do not leave stale branch names or stale "current task" notes in the repo.

---

## Rules to never break

- Never push directly to `main`
- Never let Cursor create the branch
- One task per Cursor chat
- Never approve code you did not test
- If CodeRabbit flags something real, fix it
- If Cursor changes files outside the task scope, stop it
- If a visual pass drifts off-theme, correct that before continuing
- Never let Cursor modify `src/lib/perceivedEffect/`

---

## Current project snapshot

- Phase 5 core Tools and Settings work is merged into `main`
- `Insights` is still placeholder-only
- Next likely refinement work:
  - Tools hub first
  - Settings hub second
  - only after approved screenshots are in `docs/ai-reference/goal/`
