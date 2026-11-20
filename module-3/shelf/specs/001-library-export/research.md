# Research: Library Export

No `NEEDS CLARIFICATION` items remained in the Technical Context. The decisions below close the
design choices the spec deliberately left to planning.

## 1. CSV dialect

- **Decision**: RFC 4180. Header row `id,title,author,read`; one row per book; fields separated by
  commas; rows terminated by CRLF (header included, so an empty library is exactly
  `id,title,author,read\r\n`). A field is wrapped in double quotes when it contains `,`, `"`, `\r`
  or `\n`, and any `"` inside it is doubled. Numbers and booleans are written with `String()`
  (`true` / `false`, per the clarification). No other transformation of values (clarified: no
  formula protection).
- **Rationale**: RFC 4180 is the format every spreadsheet and CSV reader understands, and it
  satisfies FR-007/FR-008 and SC-002 (exact round trip). CRLF is the RFC's line ending; a trailing
  terminator keeps "header only" unambiguous for the empty case.
- **Alternatives considered**: LF line endings (works in most readers but is not the RFC form);
  no trailing newline (makes empty-library output a header with no terminator, and appended rows
  would need special-casing); quoting every field (valid but noisier and not required).

## 2. Hand-written CSV versus a CSV library

- **Decision**: Hand-write the serialiser (a field-escaping function plus a join).
- **Rationale**: The format has four fixed columns and one quoting rule. A package would be a new
  dependency, which `docs/B-4.md` rules out ("no dependencies") and which the project's
  constraints forbid without justification; there is none here.
- **Alternatives considered**: `csv-stringify` and similar packages (rejected: dependency for
  roughly ten lines of logic).

## 3. JSON serialisation

- **Decision**: `JSON.stringify(listBooks())`, producing a plain array of
  `{ id, title, author, read }` objects in insertion order.
- **Rationale**: Matches the shape `GET /books` already returns (clarified assumption: plain list,
  no wrapper), preserves the order the library listing uses (FR-005), and an empty library yields
  `[]` (FR-009).
- **Alternatives considered**: a wrapper such as `{ total, books }` (rejected: extra contract
  surface the spec does not ask for); pretty-printing (rejected: not required, larger payload).

## 4. Validating the `format` query value

- **Decision**: A type guard `isExportFormat(value: unknown): value is "json" | "csv"` that accepts
  only the exact lower-case strings `json` and `csv`. Anything else, including `undefined`, `""`,
  `JSON`, `xml` and arrays, gets 422.
- **Rationale**: Express 5.3.0 defaults its `query parser` setting to `"simple"`
  (`node_modules/express/lib/application.js:97`), so `?format=json&format=csv` arrives as an array
  and `?format=` arrives as `""`. A strict string comparison therefore covers every unsupported
  case in FR-010 with one check and no casts (no `any`, no `!`).
- **Alternatives considered**: lower-casing the value (rejected: spec says exact match);
  `Number()`/`String()` coercion as `app.ts` does for pagination (rejected: would turn an array
  into a string like `"json,csv"` and hide the problem).

## 5. Error response

- **Decision**: Status 422 with body `{ "detail": "Unsupported format. Supported formats: json, csv" }`.
- **Rationale**: Project convention is `{ detail }` with a status code, `docs/B-4.md` names 422,
  and FR-010 requires the message to name the supported formats. The same message is used for a
  missing, empty, repeated or unknown value, so there is one behaviour to test.
- **Alternatives considered**: 400 (rejected: the project's convention and the backlog say 422);
  distinct messages for "missing" and "unknown" (rejected: no requirement, more branches).

## 6. Response content type

- **Decision**: JSON export sent as `application/json; charset=utf-8`; CSV as
  `text/csv; charset=utf-8`, both via `res.type(...)` followed by `res.send(string)`. No
  `Content-Disposition` header and no byte-order mark.
- **Rationale**: FR-011 requires the type to match the format. The spec assumes the export is the
  plain response body, not a named download. UTF-8 without a BOM keeps non-English characters
  intact for standard readers.
- **Alternatives considered**: `res.json()` for JSON (rejected: it would stringify a second time
  or force two code paths; the function already returns a string); adding `attachment` filename
  (rejected: out of scope per the assumptions); a BOM for older Excel (rejected: pollutes the
  first header name for standard CSV readers).

## 7. Where the code lives and route placement

- **Decision**: `exportBooks` in `src/storage.ts`, as `docs/B-4.md` specifies; the route in
  `src/app.ts` registered next to the other `GET /books/...` routes and before any future
  `GET /books/:id` (backlog B-8).
- **Rationale**: Keeps the flat layout and the existing separation (storage builds data, app
  handles HTTP). Today no `GET /books/:id` exists, so there is no clash, but a later `:id` route
  registered earlier would swallow `/books/export`; registering the specific path first avoids
  that.
- **Alternatives considered**: a new `src/export.ts` module (rejected: contradicts B-4
  decomposition for little gain at this size).

## 8. Logging

- **Decision**: `log.info("books.exported", { format })` on success and
  `log.warn("books.export.invalid_format", { format })` on rejection, through the existing
  `getLogger("app")` instance.
- **Rationale**: `CLAUDE.md` requires `getLogger()` with lower-case dot-separated names, never
  `console.log`. Logs are JSON lines on stdout, so logging the raw query value is safe from
  injection.

## 9. Testing without a CSV dependency

- **Decision**: Assert exact CSV strings for simple cases, and add one round-trip test that
  parses the CSV with a small RFC 4180 reader defined inside the test file, then compares to the
  stored books (SC-002).
- **Rationale**: Proves escaping works against an independent reader without adding a package.
  Storage tests reset state with `books.clear()` in `beforeEach`, as the existing tests do; the
  new API tests do the same, importing `books` from `../src/storage`.
- **Alternatives considered**: only exact-string assertions (rejected: they would pass for any
  escaping that matches the author's own mistake); a parser package (rejected: dependency).
