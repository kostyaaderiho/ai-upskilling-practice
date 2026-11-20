# CLAUDE.md

## Stack

- TypeScript (strict), Node.js 20+, Express 5, Vitest + supertest, ESLint.
- In-memory storage (src/storage.ts). No build step, run via tsx.

## Commands

- Run: npm run dev
- Check: npm run check (tsc --noEmit, eslint, vitest). Run after every change.

## Conventions

- Log only through getLogger() from src/log.ts, never console.log.
- Log message names are lower-case and dot-separated: "book.read", not "book read".
- API errors are { detail } with a status code (404, 422).
- Tests go in tests/, file <module>.test.ts.
- No any and no non-null assertion (!).

## Prohibitions

- Do not change files unrelated to the task.
- Do not add dependencies without my approval.
- Do not git push or merge: a human decides after review.
