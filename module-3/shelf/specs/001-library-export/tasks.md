---

description: "Task list for Library Export (GET /books/export?format=json|csv)"
---

# Tasks: Library Export

**Input**: Design documents from `/specs/001-library-export/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/export-endpoint.md, quickstart.md; `.specify/memory/constitution.md` v1.0.0

**Tests**: REQUIRED. Constitution Principle II (Test-First, NON-NEGOTIABLE) and `plan.md` "Delivery order" demand a failing test, run and seen to fail for the expected reason, before any code it covers. Every story below follows: write tests, run them red, implement, run green.

**Organization**: Tasks are grouped by user story. All three stories edit the same four files (`src/storage.ts`, `src/app.ts`, `tests/storage.test.ts`, `tests/api.test.ts`), so stories are delivered sequentially (P1 → P2 → P3); `[P]` is used only for tasks in different files.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1, US2, US3 (user-story phases only)
- Field constraints are cited, not restated: `data-model.md` `Entity.field`

## Path Conventions

Single project, flat layout kept (plan.md "Structure Decision"): `src/` and `tests/` at the repository root. Run tests with `npx vitest run --bail 1` (CLAUDE.local.md); the full gate is `npm run check`. No `any`, no `!`, log only through `getLogger()`, no new dependencies, no files outside the four above.

---

## Phase 1: Setup

**Purpose**: Confirm the starting point. There is nothing to initialise: no new files, modules or dependencies.

- [ ] T001 Run `npm run check` from the repository root (scripts in `package.json`) and confirm `tsc --noEmit`, `eslint .` and `vitest run` are green before any change. If something already fails, report it and stop; do not fix unrelated files.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The one shared declaration every story's code and tests depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T002 Add `export type ExportFormat = "json" | "csv";` to `src/storage.ts`, directly after the `Book` interface (closed value set defined in `data-model.md` `ExportFormat`). Type only, no behaviour, so no test precedes it.

**Checkpoint**: `npx tsc --noEmit` still passes; user story work can begin.

---

## Phase 3: User Story 1 - Export the library as JSON (Priority: P1) 🎯 MVP

**Goal**: `GET /books/export?format=json` returns every book (read and unread) as one JSON array in listing order.

**Independent Test**: Add three books, mark one read, request `?format=json`; the response is `200`, `application/json; charset=utf-8`, a JSON array of exactly those three books with `id`, `title`, `author`, `read`, and `GET /books` is unchanged afterwards. An empty library returns `[]`.

### Tests for User Story 1 (write first, must FAIL before T006/T007) ⚠️

- [ ] T003 [P] [US1] In `tests/storage.test.ts`, add `exportBooks` to the existing import from `../src/storage` and add `describe("exportBooks() as json")` (the file's top-level `beforeEach` already calls `books.clear()`). Cases: (a) three books via `addBook`, one marked with `markRead`: `JSON.parse(exportBooks("json"))` equals `listBooks()`, in insertion order, with `id`, `title`, `author`, `read` on every record (FR-002, FR-004, FR-005, FR-006, SC-001); (b) empty library: result is `"[]"` (FR-009); (c) titles/authors containing a comma, a double quote, a line break and non-English characters parse back identical; (d) a snapshot taken with `structuredClone(listBooks())` before the call deep-equals `listBooks()` after it (FR-012); (e) a book added immediately before the call is present; (f) 1,000 books export in under 1,000 ms (SC-005).
- [ ] T004 [P] [US1] In `tests/api.test.ts`, add `beforeEach` to the `vitest` import, import `books` from `../src/storage`, and append `describe("GET /books/export?format=json")` with its own `beforeEach(() => books.clear())` scoped inside the describe, so existing tests are untouched. Cases (create books with `POST /books`, mark one read with `POST /books/:id/read`): (a) `200`, header `content-type` equal to `application/json; charset=utf-8` (FR-011), body equal to the books in listing order with the marked one `read: true`; (b) empty library gives `200` and body `[]`; (c) a book POSTed immediately before the export appears; (d) `GET /books` returns the same list before and after the export (US1 scenario 3, FR-012). Do not add missing/invalid-format cases here (US3).
- [ ] T005 [US1] Run `npx vitest run --bail 1 tests/storage.test.ts`, then `npx vitest run --bail 1 tests/api.test.ts` (one file at a time, because `--bail 1` stops at the first failure). Confirm the storage cases fail because `exportBooks` is not a function, and the API cases fail with status `404` where `200` is expected (the existing `GET /books/:id` handles `/books/export` and answers "Book not found"). Do not proceed on any other failure reason.

### Implementation for User Story 1

- [ ] T006 [US1] In `src/storage.ts`, add `export function exportBooks(format: ExportFormat): string` after `listBooks()`. For `json`, return `JSON.stringify(listBooks())`, so each record carries `Book.id` (`data-model.md` `Book.id`), `Book.title` (`data-model.md` `Book.title`), `Book.author` (`data-model.md` `Book.author`) and `Book.read` (`data-model.md` `Book.read`) as stored, with the invariants of `data-model.md` `Library export` (research.md §3). For `csv`, throw `new Error("csv export is not implemented")` as a placeholder that T012 replaces. Run `npx vitest run --bail 1 tests/storage.test.ts` until green.
- [ ] T007 [US1] In `src/app.ts`, register `app.get("/books/export", ...)` immediately after `app.get("/books/recent", ...)` and **before** the existing `app.get("/books/:id", ...)`; otherwise `:id` captures `/books/export` and returns 404. Handler: `res.type("application/json; charset=utf-8")`, then `res.send(storage.exportBooks("json"))`, then `log.info("books.exported", { format: "json" })` using the existing `log` instance (research.md §6, §8; contracts/export-endpoint.md). The `format` query value is not read yet (US2, US3).
- [ ] T008 [US1] Run `npx vitest run --bail 1`, then `npm run check`. All US1 tests pass and the existing tests are unaffected.

**Checkpoint**: US1 works and is testable on its own. The handler ignores `format`, so the endpoint is not ready for callers until US3.

---

## Phase 4: User Story 2 - Export the library as CSV (Priority: P2)

**Goal**: `GET /books/export?format=csv` returns RFC 4180 CSV: header `id,title,author,read`, one CRLF-terminated row per book in listing order, with correct quoting.

**Independent Test**: Add books (one title with a comma and quotes), request `?format=csv`; a standard CSV reader shows one row per book under the header, titles are reconstructed exactly, and an empty library gives the header row only.

### Tests for User Story 2 (write first, must FAIL before T012/T013) ⚠️

- [ ] T009 [P] [US2] In `tests/storage.test.ts`, add a local helper `parseCsv(text: string): string[][]` that is an independent RFC 4180 reader (quoted fields, doubled quotes, embedded `,` CR LF, CRLF row ends; no package, no `any`, no `!`; research.md §9) and `describe("exportBooks() as csv")`. Cases: (a) exact string for two books equal to `"id,title,author,read\r\n1,Dune,Frank Herbert,true\r\n..."`, with `true`/`false` read values and listing order (FR-005, FR-007); (b) empty library equals exactly `"id,title,author,read\r\n"` (FR-009); (c) round trip: titles/authors containing a comma, a double quote, LF, CRLF and non-English characters come back identical from `parseCsv(exportBooks("csv"))` (FR-008, SC-002); (d) values beginning with `=`, `+`, `-`, `@` are written unchanged (FR-008, clarified); (e) the library is unchanged after the call (FR-012); (f) 1,000 books export in under 1,000 ms (SC-005).
- [ ] T010 [P] [US2] In `tests/api.test.ts`, append `describe("GET /books/export?format=csv")` with its own `beforeEach(() => books.clear())`. Cases: (a) `200`, `content-type` equal to `text/csv; charset=utf-8` (FR-011), `res.text` equal to the header plus the rows for books created through `POST /books`, including the quickstart example `Hello, "World"` giving `2,"Hello, ""World""",A. Author,false` and a marked-read book giving `true`; (b) empty library gives exactly `id,title,author,read\r\n`; (c) `?format=json` still returns JSON, so `format` now selects the output.
- [ ] T011 [US2] Run `npx vitest run --bail 1 tests/storage.test.ts`, then `npx vitest run --bail 1 tests/api.test.ts`. Confirm the storage CSV cases fail with `csv export is not implemented` and the API CSV cases fail on content type/body because the route still returns JSON. Do not proceed on any other failure reason.

### Implementation for User Story 2

- [ ] T012 [US2] In `src/storage.ts`, replace the `csv` placeholder in `exportBooks` with the RFC 4180 serialiser described in research.md §1: a private (non-exported) `csvField(value: string): string` that quotes a field when it contains `,`, `"`, CR or LF and doubles inner quotes; header `id,title,author,read`; every row, header included, ends in `\r\n`. Column order and rendering follow `data-model.md` `Library export` "Column mapping": `Book.id` (`data-model.md` `Book.id`) as a decimal number, `Book.title` (`data-model.md` `Book.title`) and `Book.author` (`data-model.md` `Book.author`) exactly as stored, `Book.read` (`data-model.md` `Book.read`) as `true`/`false`. No other transformation of values. Run `npx vitest run --bail 1 tests/storage.test.ts` until green.
- [ ] T013 [US2] In `src/app.ts`, update the `/books/export` handler: when `req.query.format === "csv"`, use `res.type("text/csv; charset=utf-8")` and `storage.exportBooks("csv")`; otherwise keep the JSON path from T007. Log `log.info("books.exported", { format })` with the chosen format. No `Content-Disposition` header and no byte-order mark (research.md §6). Any non-`csv` value still returns JSON until T019.
- [ ] T014 [US2] Run `npx vitest run --bail 1`, then `npm run check`. US1 and US2 tests all pass.

**Checkpoint**: US1 and US2 both work. Unknown formats still fall back to JSON until US3.

---

## Phase 5: User Story 3 - Clear rejection of an unsupported format (Priority: P3)

**Goal**: A missing, empty, repeated, wrongly-cased or unknown `format` is refused with `422 { detail }` naming the supported formats, and no book data is returned.

**Independent Test**: With books in the library, request `?format=xml`, no `format`, `?format=`, `?format=JSON` and `?format=json&format=csv`; each returns `422` with `{ "detail": "Unsupported format. Supported formats: json, csv" }` and nothing else.

### Tests for User Story 3 (write first, must FAIL before T018/T019) ⚠️

- [ ] T015 [P] [US3] In `tests/storage.test.ts`, add `isExportFormat` to the import and add `describe("isExportFormat()")`: true for `"json"` and `"csv"`; false for `"JSON"`, `"CSV"`, `"xml"`, `""`, `undefined`, `null`, `42`, `["json"]` and `["json", "csv"]` (exact lower-case match only; `data-model.md` `ExportFormat`, research.md §4). Use `it.each`.
- [ ] T016 [P] [US3] In `tests/api.test.ts`, append `describe("GET /books/export with an unsupported format")` with its own `beforeEach(() => books.clear())`. Create two books first so "no book data" is meaningful. Use `it.each` over the URLs `/books/export?format=xml`, `/books/export`, `/books/export?format=`, `/books/export?format=JSON`, `/books/export?format=json&format=csv`: each returns status `422` and a body that `toEqual` `{ detail: "Unsupported format. Supported formats: json, csv" }` (FR-010, SC-004; contracts/export-endpoint.md).
- [ ] T017 [US3] Run `npx vitest run --bail 1 tests/storage.test.ts`, then `npx vitest run --bail 1 tests/api.test.ts`. Confirm the storage cases fail because `isExportFormat` is not a function, and the API cases fail because the route answers `200` with JSON instead of `422`. Do not proceed on any other failure reason.

### Implementation for User Story 3

- [ ] T018 [US3] In `src/storage.ts`, add `export function isExportFormat(value: unknown): value is ExportFormat` returning `value === "json" || value === "csv"`. Accept only those exact lower-case strings (`data-model.md` `ExportFormat`); no casts, no `any`, no `!`. Run `npx vitest run --bail 1 tests/storage.test.ts` until green.
- [ ] T019 [US3] In `src/app.ts`, finalise the `/books/export` handler. Read `const { format } = req.query;` and, if `!storage.isExportFormat(format)`, call `log.warn("books.export.invalid_format", { format })`, respond `res.status(422).json({ detail: "Unsupported format. Supported formats: json, csv" })` and `return`. Otherwise set the content type from the format (`json` gives `application/json; charset=utf-8`, `csv` gives `text/csv; charset=utf-8`), `res.send(storage.exportBooks(format))` and `log.info("books.exported", { format })`. This removes the fall-back-to-JSON from T013. The route stays before `app.get("/books/:id", ...)`.
- [ ] T020 [US3] Run `npx vitest run --bail 1`, then `npm run check`. All stories' tests pass.

**Checkpoint**: All three stories work independently and together; the endpoint matches `contracts/export-endpoint.md`.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end validation and scope hygiene.

- [ ] T021 [P] Walk through the manual checks in `specs/001-library-export/quickstart.md` §2: run `npm run dev`, issue the curl requests for the empty library, the two books, both formats and the four rejections, and compare with the §3 outcomes table. Confirm the server log lines `books.exported` and `books.export.invalid_format` appear, then stop the server.
- [ ] T022 [P] Correct two stale statements in the design docs. In `specs/001-library-export/research.md` §7, state that `GET /books/:id` already exists in `src/app.ts`, so registering `/books/export` before it is required now. In `specs/001-library-export/plan.md`, drop the claim that `src/storage.ts` and `src/server.ts` use `console.log` (no `console.*` remains in `src/`); keep the note that `src/server.ts` calls `app.listen(port)` without a host, which is out of scope here.
- [ ] T023 Run `npm run check` a final time, then `git status` and `git diff --stat`. Confirm only `src/storage.ts`, `src/app.ts`, `tests/storage.test.ts`, `tests/api.test.ts` and the two docs from T022 changed, and `package.json` and `package-lock.json` did not. Do not commit or push (CLAUDE.md).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: none
- **Foundational (Phase 2)**: after Setup; blocks all stories
- **US1 (Phase 3)**: after Foundational
- **US2 (Phase 4)**: after US1 (replaces the `csv` placeholder in T006 and extends the handler from T007)
- **US3 (Phase 5)**: after US2 (the final handler dispatches both formats and replaces the interim behaviour from T013)
- **Polish (Phase 6)**: after the stories you intend to ship

Each story is independently *testable* (its own tests and Independent Test), but not independently *deliverable* in parallel, because the stories share `src/storage.ts` and `src/app.ts`.

### Within Each Story

- Tests first, run red for the expected reason, then storage code, then route, then run green. Never edit a test to make it pass.
- `src/storage.ts` work comes before `src/app.ts` work: the route calls `exportBooks` and `isExportFormat`.

### Interim behaviour (intended, replaced under test)

| After | Behaviour | Replaced by |
|-------|-----------|-------------|
| T006 | `exportBooks("csv")` throws a placeholder error | T012 |
| T007 | route ignores `format`, always returns JSON | T013 |
| T013 | any `format` other than `csv` returns JSON | T019 |

## Parallel Opportunities

Only tasks in different files are marked `[P]`:

- Phase 3: T003 and T004; Phase 4: T009 and T010; Phase 5: T015 and T016 (storage test file and API test file)
- Phase 6: T021 and T022 (running the server, editing docs)

### Parallel Example: User Story 1

```bash
# Write both test files together, then run them red (T005):
Task: "T003 storage tests for exportBooks() as json in tests/storage.test.ts"
Task: "T004 API tests for GET /books/export?format=json in tests/api.test.ts"
```

## Implementation Strategy

### MVP First (User Story 1)

1. T001 baseline, T002 type
2. T003–T008: JSON export, tests first
3. **STOP and VALIDATE**: US1 Independent Test. Caveat: the handler ignores `format`, so do not expose the endpoint to callers yet. US3 is small, so the practical minimum to ship is US1 + US3 (with US2 landed in between because of the dependency order).

### Incremental Delivery

1. Setup + Foundational
2. US1: JSON, validate
3. US2: CSV, validate
4. US3: 422 rejection, validate; the endpoint now matches the contract
5. Polish: quickstart walk-through, doc corrections, scope check

## Notes

- Scope: four code/test files only; no new dependencies (Constitution III); no outbound calls (Constitution I).
- The B-4 open question ("all books or only read ones?") is resolved in `spec.md` Clarifications: all books.
- Known out-of-scope non-compliance: `src/server.ts` binds `app.listen(port)` to all interfaces, which conflicts with Constitution Principle I (loopback only). It needs its own backlog item.
- Commit nothing and push nothing; a human decides after review.
