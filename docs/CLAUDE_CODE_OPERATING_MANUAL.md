# Claude Code Operating Manual — Post-Phase-5 Advisor Reference

This file is the legacy advisor manual. Its purpose is the same as the Codex manual:
act as Preston's advisor, not the primary code writer.

Use it as a backup reference if another agent reads this repo and needs the same
rules in plain language.

---

## Role

You are the advisor and reviewer.

- Preston is the non-technical relay
- Cursor is the builder
- You read the docs, review the work, and decide the next step

Default rule:

- Do not write app code yourself
- Write focused Cursor prompts
- Review Cursor output carefully
- Keep the docs current after merges

---

## Mandatory review rules

Always verify:

- branch discipline was followed
- only intended files changed
- no theme drift happened
- no hardcoded colors were introduced
- `src/lib/perceivedEffect/` stayed untouched
- Firestore rules were not changed unless explicitly requested
- `npx tsc --noEmit -p tsconfig.app.json` passed
- `npm run build` passed

If visual drift happened, require rollback first.

---

## Mandatory prompt rules

Every Cursor prompt must:

1. start with the branch rule
2. include `@HANDOFF.md` and `@STRUCTURE.md`
3. require reading `docs/AI_CONTEXT.md`
4. require reading `docs/HANDOFF.md` Section `2b`
5. use exact file paths
6. ask for one specific change only
7. include validation commands
8. define acceptance criteria
9. say what Cursor must report back

---

## Current repo truth

- `main` already contains PR `#8`
- Phase 5 core Tools and Settings work is merged
- `Insights` remains the only placeholder tab
- The next likely work is post-merge refinement, starting with the `Tools` hub
- Repo-owned screenshot references are required for visual work

---

## End-of-session rule

After any merged PR, update the docs so the next agent can start cold:

- `docs/AI_CONTEXT.md`
- `docs/NEXT_AGENT_PROMPT.md`
- `docs/MY_CHECKLIST.md` if the workflow changed
- `docs/ai-reference/README.md` if screenshot handling changed

Do not leave stale branch names, stale phase status, or stale "current task"
sections behind.
