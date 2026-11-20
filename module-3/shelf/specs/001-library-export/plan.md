# Implementation Plan: Library Export

**Branch**: `001-library-export` (spec directory name; no git branch created, working on `main`) | **Date**: 2026-11-20 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-library-export/spec.md`

## Summary

Add `GET /books/export?format=json|csv`, which returns every book in the library as a single JSON
document or as RFC 4180 CSV. The work is one new function, `exportBooks(format)`, in
`src/storage.ts` (JSON via `JSON.stringify`, CSV via a small hand-written serialiser) and one new
route in `src/app.ts` that validates the `format` query value, returns `422 { detail }` for
anything other than exactly `json` or `csv`, and otherwise sends the result with the matching
content type. No new dependencies, no outbound calls, no changes to existing behaviour. Tests are
written first (storage and API), seen to fail, then the code is added. Decomposition follows
`docs/B-4.md`.

## Technical Context

**Language/Version**: TypeScript 5.7 (strict), Node.js 20+ (v24.18.0 locally), run via `tsx`, no build step

**Primary Dependencies**: Express 5.3.0 (existing); no additions

**Storage**: In-memory `Map` in `src/storage.ts` (existing); the export is a read-only view of it

**Testing**: Vitest 3 + supertest; run with `npx vitest run --bail 1`; full gate is `npm run check`

**Target Platform**: Local Node.js process, HTTP on localhost

**Project Type**: Single-project web service (REST API)

**Performance Goals**: 1,000 books exported in under 1 second (SC-005); synchronous in-memory serialisation is far below that

**Constraints**: No new dependencies; no external services or network calls; no `any`; no non-null assertion (`!`); log only through `getLogger()`; errors as `{ detail }`

**Scale/Scope**: One endpoint and one storage function; new cases are added to the two existing test files

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` is still the unfilled template, so there are no ratified
principles to gate against. As a stand-in, this plan is checked against the three constraints
given when `/speckit-constitution` was invoked and the conventions in `CLAUDE.md`. Treat the
result as provisional until a constitution is ratified.

| Gate | Pre-research | Post-design |
|------|--------------|-------------|
| Localhost only: no external services or network calls | PASS: nothing outbound is needed | PASS: no HTTP client, no I/O beyond the existing server response |
| Tests first: a failing test before code | PASS: planned order below | PASS: delivery order keeps every test before its code |
| No new dependencies without justification | PASS: none needed | PASS: CSV is hand-written (about 10 lines); the test-side CSV reader is a local helper, not a package |
| `getLogger()` only, dot-separated lower-case names | PASS | PASS: `books.exported`, `books.export.invalid_format` |
| Errors as `{ detail }` with 422/404 | PASS | PASS: 422 with `{ detail }` |
| No `any`, no `!` | PASS | PASS: `isExportFormat(value: unknown)` type guard instead of casts |
| Only files related to the task | PASS | PASS: `src/storage.ts`, `src/app.ts`, two test files |

Pre-existing code that conflicts with these rules but is **out of scope** for this feature (do not
fix here): `src/storage.ts` `addBook` and `src/server.ts` use `console.log` (backlog B-6), and
`src/server.ts` calls `app.listen(port)` with no host, so the server binds to all interfaces
rather than loopback only. The second one conflicts with "localhost only" and deserves its own
backlog item.

## Project Structure

### Documentation (this feature)

```text
specs/001-library-export/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/
│   └── export-endpoint.md   # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app.ts               # + GET /books/export route (before any future GET /books/:id)
└── storage.ts           # + ExportFormat, isExportFormat(), exportBooks()

tests/
├── storage.test.ts      # + exportBooks() cases (written first, fail first)
└── api.test.ts          # + GET /books/export cases (written first, fail first)
```

**Structure Decision**: The existing flat `src/` + `tests/` layout is kept. The decomposition in
`docs/B-4.md` places `exportBooks` in `src/storage.ts`, so no new module is added. Tests go in the
existing `<module>.test.ts` files, as `CLAUDE.md` requires.

**Delivery order (tests first)**:

1. Write storage tests for `exportBooks` (JSON and CSV, empty, escaping, order, read flag,
   exact-as-stored values, no mutation). Run `npx vitest run --bail 1`; confirm they fail because
   `exportBooks` does not exist.
2. Implement `ExportFormat`, `isExportFormat`, `exportBooks` until the storage tests pass.
3. Write API tests for the endpoint (both formats, content types, empty library, 422 cases). Run
   and confirm they fail with 404 for the missing route.
4. Add the route in `src/app.ts` until the API tests pass.
5. Run `npm run check` (tsc, eslint, vitest).

## Complexity Tracking

No Constitution Check violations introduced by this feature; nothing to justify.
