# Data Model: Library Export

The feature adds no stored data. It reads the existing library and renders a snapshot.

## Book (existing, unchanged)

Defined in `src/storage.ts`, held in the in-memory `books` map.

| Field | Type | Notes |
|-------|------|-------|
| `id` | number | Unique, assigned on creation, increasing; defines listing and export order |
| `title` | string | Free text; may contain commas, quotes, line breaks, non-English characters |
| `author` | string | Free text; same as title |
| `read` | boolean | `false` on creation; `true` after "mark read" |

No validation rules are added here (title validation is backlog B-5, a separate feature).

## ExportFormat (new, in-memory type)

The closed set of values accepted by the endpoint.

| Value | Output |
|-------|--------|
| `json` | Single JSON document: array of book records |
| `csv` | RFC 4180 text: header row, then one row per book |

Any other input is not an `ExportFormat` and is rejected with 422.

## Library export (new, transient)

A string produced on demand from the current books, never stored. It does not change the library
(FR-012).

### Column mapping

| Position | CSV header | JSON key | Source | CSV rendering |
|----------|-----------|----------|--------|---------------|
| 1 | `id` | `id` | `Book.id` | decimal number |
| 2 | `title` | `title` | `Book.title` | exactly as stored, quoted if it contains `,` `"` CR or LF |
| 3 | `author` | `author` | `Book.author` | same as title |
| 4 | `read` | `read` | `Book.read` | `true` or `false` |

### Invariants

- Exactly one record per book currently in the library; none omitted, none duplicated (FR-002).
- Record order equals listing order, which is ascending `id` (FR-005).
- JSON for an empty library is `[]`; CSV for an empty library is the header row and its line
  terminator only (FR-009).
- Values are never altered beyond CSV quoting; nothing is trimmed, truncated or neutralised
  (FR-008, clarified).

### State transitions

None. The export is stateless and read-only.
