# Contract: `GET /books/export`

Exports every book in the library in one requested format. Read-only; takes no request body.

## Request

```text
GET /books/export?format=<json|csv>
```

| Parameter | Where | Required | Allowed values |
|-----------|-------|----------|----------------|
| `format` | query string | yes | exactly `json` or `csv` (lower case, given once) |

## Responses

### 200 OK, `format=json`

- `Content-Type: application/json; charset=utf-8`
- Body: a JSON array of book records in listing order (ascending `id`).

```json
[
  { "id": 1, "title": "Dune", "author": "Frank Herbert", "read": true },
  { "id": 2, "title": "Emma", "author": "Jane Austen", "read": false }
]
```

Empty library: `[]`

### 200 OK, `format=csv`

- `Content-Type: text/csv; charset=utf-8`
- Body: RFC 4180 text. Header row `id,title,author,read`, then one row per book in listing order.
  Rows end with CRLF. Fields containing `,` `"` CR or LF are wrapped in double quotes with inner
  quotes doubled. Read status is `true` or `false`.

```text
id,title,author,read
1,Dune,Frank Herbert,true
2,"Hello, World","Quote ""Q"" Author",false
```

Empty library: `id,title,author,read` followed by CRLF and nothing else.

### 422 Unprocessable Content

Returned when `format` is missing, empty, given more than once, in a different letter case, or any
value other than `json` / `csv`. No book data is returned.

```json
{ "detail": "Unsupported format. Supported formats: json, csv" }
```

## Behavioural guarantees

- Never modifies the library.
- No authentication, pagination, filtering or sorting; the response is the whole library.
- Not served as a file download (no `Content-Disposition`); the export is the response body.
- Existing endpoints are unchanged.

## Test traceability

| Contract point | Spec reference |
|----------------|----------------|
| JSON array of `id`, `title`, `author`, `read` in listing order | FR-002, FR-004, FR-005, FR-006, SC-001 |
| CSV header, rows, escaping, `true`/`false` | FR-007, FR-008, SC-002 |
| Empty library succeeds in both formats | FR-009, SC-003 |
| 422 with `{ detail }` naming supported formats | FR-010, SC-004 |
| Content types | FR-011 |
| Read-only | FR-012 |
