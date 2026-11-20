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
- B-2: the three-part prompt:
- Hallucination: tsc error, documentation link, feedback prompt:

## 3.3 Spec Kit

- Order of Spec Kit commands and the file each step created:
- Which NEEDS CLARIFICATION markers there were and what you answered:

## 3.4 Agent mode

- What you did in plan mode and what in agent mode:
- When you stopped or rolled back the agent, and why:
- Regression after pong: what broke and how you rolled it back (or "nothing broke"):

## 3.5 Commands, hooks, MCP

- Which MCP tool the agent called to read Issue B-8:
- What the agent remembered after /compact and after /clear:
- What a colleague gets after cloning the repository:

## Final task

The decisions note is a separate file, docs/B-7-decisions.md.

- What /self-review said, and what you changed after it:
