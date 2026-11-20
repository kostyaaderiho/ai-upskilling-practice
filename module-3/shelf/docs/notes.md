# Module 3 log

Prompts, agent mistakes and decisions for each task. You check yourself against this file and the commit history.
In each section, answer the readiness-criteria points of the task that require a log entry.

## 3.1 Rules

- What the agent logged with before CLAUDE.md:

before/after:
`log.[method]`

- What it logs with after, and why:

before:

`"book added"`

after:

`"book.added"`

- How the agent ran the tests, before and after CLAUDE.local.md:

before:
`npx vitest run`

after:

`npx vitest run --bail 1`

after:

- Which rules live where, and why:

`CLAUDE.md`

Project rules

`CLAUDE.local.md`

My project-local rules

- Run tests like this: npx vitest run --bail 1

`~/.claude/CLAUDE.md`

- Which stack you chose and why:

TypeScript (strict), Node.js 20+, Express 5, Vitest + supertest, ESLint.

## 3.2 Debugging and tests

- B-1: what the tests written from the code alone checked:

5 of 7 fail, and that's a real bug in the code, not in the tests. stats.ts:6 multiplies instead of dividing:

- B-2: the three-part prompt:

Error:
<paste the exact TypeError and stack trace from terminal 1>

Code:
<paste the recent() function from src/storage.ts>

Expected behaviour:
Return up to three latest books, newest first. For an empty list — an empty array.

Fix recent() and add tests for 0, 1 and 5 books in tests/storage.test.ts.

- Hallucination: tsc error, documentation link, feedback prompt:

Error:
Error: Module '"express"' has no exported member 'validateBody'.

What the documentation says:
Express 5 has no validateBody export — https://expressjs.com/en/5x/api/

Propose a solution with no new dependencies. Don't change any code yet.

## 3.3 Spec Kit

- Order of Spec Kit commands and the file each step created:
  /speckit-constitution → .specify/memory/constitution.md; /speckit-specify →
  specs/001-export-library/spec.md; /speckit-clarify → the same spec.md, with the
  questions answered; /speckit-plan → plan.md; /speckit-tasks → tasks.md. No code.
- Which NEEDS CLARIFICATION markers there were and what you answered:
  three — what is exported, the empty CSV, authorisation. Answered as above; declaring
  filters out of scope removed two tasks from tasks.md.

## 3.4 Agent mode

- What you did in plan mode and what in agent mode:

ping: 5 failed of 6

pong: 6 passed, tests untouched

- What the checks did not catch (a regression, or something you saw in the diff):

nothing broke

- Plan mode, agent mode, and when you stopped or rolled back the agent:

nothing broke

## 3.5 Commands, hooks, MCP

- Which MCP tool the agent called to read Issue B-8:
- What the agent remembered after /compact and after /clear:
- What a colleague gets after cloning the repository:

## Final task

The decisions note is a separate file, docs/B-7-decisions.md.

- What /self-review said, and what you changed after it:

Nothing was changed. npm run check passes (39 tests in 4 files).

1–2. Violations of CLAUDE.md and the constitution

Where: src/server.ts:7
Rule: Constitution I: bind to 127.0.0.
Problem: app.listen(port) has no host, so it binds to all interfaces.
──────────────────────────────────────
Where: src/app.ts:10
Rule: Errors are { detail }
Problem: A malformed JSON body returns 400 text/html (I checked). There is no error middleware, and
Express prints the stack to stderr, no
────────────────────────────────────────
Where: src/app.ts:61, 80, 100
Rule: Errors are { detail }
Problem: throw err on unexpected errorHTML 500.
────────────────────────────────────────
Where: src/storage.ts:46-50 and src/ap
Rule: Constitution II: no change without a test
Problem: paginate and GET /books have id 11 (checked with 12 books), which is
open bug B-3.
────────────────────────────────────────
Where: src/app.ts:84-102 and src/app.t
Rule: Constitution II
Problem: POST /books/:id/read and GET
────────────────────────────────────────
Where: tests/api.test.ts and tests/val
Rule: Tests are <module>.test.ts
Problem: There is no src/api.ts or srcin app.ts. This is minor.
────────────────────────────────────────
Where: .specify/memory/constitution.md
Rule: The report says "temporary; remove before committing"
Problem: It is committed with that blo

- Clean: there is no console.\*, any orse and dot-separated. There are no newdependencies. strict is on.
- Test-first: I can't prove it from the and tests together, so a red run isn't visible.

3. Acceptance scenarios in specs/001-library-export/spec.md  
   None of the 8 has a test. Nothing in src/ or tests/ mentions export, and all FR-001–012, SC-001–005 and the 6 edge cases are equally uncoveredr each scenario:

┌───────────────────────────┬───────────┐
│ Scenario │ Existing test │ Planned in tasks.md │
├───────────────────────────┼───────────┤
│ US1-1 JSON, three books │ none │ T003a, T004a │
├───────────────────────────┼───────────┤
│ US1-2 JSON, empty library │ none │ T003b, T004b │
├───────────────────────────┼───────────┤
│ US1-3 books unchanged │ none │ T003d, T004d │
├───────────────────────────┼───────────┤
│ US2-1 CSV header and rows │ none │ T009a, T010a │
├───────────────────────────┼───────────┤
│ US2-2 CSV, empty library │ none │ T009b, T010b │
├───────────────────────────┼───────────┤
│ US2-3 CSV escaping │ none │ T009c │
├───────────────────────────┼───────────┤
│ US3-1 xml gives 422 │ none │ T016 │
├───────────────────────────┼───────────┤
│ US3-2 no format gives 422 │ none │ T016 │
└───────────────────────────┴───────────┘

4. What a colleague gets from .claude/

- Gets
  - The /new-endpoint command.
  - The PreToolUse hook (block-env.mjsson). It needs node on the PATH.
  - Nine speckit-\* skills, plus the tracked .specify/ templates, scripts and constitution.
- Not committed yet: /self-review, .gitaged only, so a clone gets none ofthem.
- Hook limits: it matches the exact na\* pass.
- Has to set up
  - npm install and Node 20+.
  - Their own .env. There is no .env.example.
  - CLAUDE.local.md is ignored, so the1.
  - Their user-level ~/.claude/CLAUDE.md. - MCP servers and logins. There is n/agents/.
  - .specify/feature.json is gitignored. Until they set SPECIFY_FEATURE_DIRECTORY=specs/001-lin and /speckit-tasks stop with "Featuredirectory not found" (common.sh:209-213).
- Noise: a CodeMie analytics JSON withme is tracked indocs/codemie/analytics/. Two more sit untracked.
- Doc drift
  - CLAUDE.md doesn't mention the constitution.
  - plan.md:42 still calls the constit. T022 doesn't cover that.
  - docs/notes.md §3.3 names specs/001-export-library and "three NEEDS CLARIFICATION markers", but spec.md has none.
  - docs/notes.md §3.5 and "Final task" are blank.

5.

Not ready: the server binds to all interfaces, errors outside the handled cases aren't { detail }, B-3 is open and paginate, GET /books, POSTstats are untested, the export has notests yet (0/8 scenarios), self-review.md, .gitignore and tasks.md are staged but not committed, constitution.md ships its temporary reon Check is stale, and an analytics JSON with a personal email in its name is tracked.
