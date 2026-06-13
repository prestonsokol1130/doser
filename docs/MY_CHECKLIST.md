# Doser — My Task Checklist

Read this before every new coding-agent task.

This checklist assumes:

- you are Preston
- you do not code directly
- your advisor tells you what to do
- Cursor is the default coding agent unless you intentionally switch

---

## Step 1 — Know who is doing what

Three roles:

- You
  - product owner
  - middle man
  - tester
- Advisor
  - reads docs
  - decides the next step
  - writes the exact prompt
- Coding agent
  - reads code
  - edits files
  - runs validation

Do not mix those up unless you intentionally want a different workflow.

---

## Step 2 — Create the branch yourself

You create the branch before opening the coding-agent chat.

The coding agent must not:

- create branches
- switch branches
- rename branches

---

## Step 3 — Open a brand-new coding-agent chat

Never reuse an old coding-agent chat for a new task.

---

## Step 4 — Paste the advisor prompt

Before sending the prompt, make sure it:

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
- keep the current theme

---

## Step 5 — Relay questions back to the advisor

If the coding agent asks questions:

1. copy the question back to your advisor
2. get the answer
3. paste that answer back to the coding agent

Do not guess technical answers yourself.

---

## Step 6 — Test it yourself

When the coding agent says the change is ready:

1. run the local app
2. test the exact feature that changed
3. do not approve untested work

For notifications work, remember:

- a successful build does not prove notifications work
- real background notification delivery must be tested on a real signed-in browser/PWA

---

## Step 7 — Have the coding agent commit and push only after approval

When the change is correct and tested, tell the coding agent to commit and push.

---

## Step 8 — Open the Pull Request

Go to GitHub and open the PR against `main`.

Then wait for:

- CodeRabbit
- any required checks

Do not merge immediately.

---

## Step 9 — Merge only after review and testing

Merge only after:

- your own testing passed
- CodeRabbit is clean or addressed
- required checks passed

---

## Step 10 — Clean up locally after merge

After merge, Preston runs locally:

```powershell
git checkout main
git pull origin main
git branch -d feat/[task-name]
git fetch origin --prune
```

---

## Step 11 — Update the docs

After meaningful work or after merge, make sure the advisor updates:

- `docs/AI_CONTEXT.md`
- `docs/HANDOFF.md`
- `docs/STRUCTURE.md`
- `docs/NEXT_AGENT_PROMPT.md`
- any other stale docs

This is mandatory.

---

## Rules To Never Break

- never push directly to `main`
- never let the coding agent create the branch
- one task per coding-agent chat
- never approve code you did not test
- if CodeRabbit flags something real, fix it
- if a visual pass drifts off-theme, stop it
- never let the coding agent modify `src/lib/perceivedEffect/`
- never let an agent say a feature works unless it was actually verified

---

## Current Reality You Should Remember

On `main`:

- Phase 5 core Tools and Settings work is merged
- local-only access follow-up is merged
- local-only -> account upgrade decision is still missing

On `feat/real-notifications-v1`:

- notification implementation exists
- builds pass
- real end-to-end device delivery is still not confirmed

If a future agent says "notifications work," ask:

- was that tested on a real signed-in browser/PWA device, yes or no?
