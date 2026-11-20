# Quickstart: Validating Library Export

Prerequisites: Node.js 20+, dependencies installed (`npm install`). Everything runs on localhost.
Contract details are in [contracts/export-endpoint.md](./contracts/export-endpoint.md); field
mapping is in [data-model.md](./data-model.md).

## 1. Automated checks (tests first)

1. Add the storage and API tests described in the plan's delivery order and confirm they **fail**
   before any implementation exists:

   ```bash
   npx vitest run --bail 1
   ```

   Expected: failures because `exportBooks` and the `/books/export` route do not exist yet.

2. After implementing, run the full gate:

   ```bash
   npm run check
   ```

   Expected: `tsc --noEmit`, `eslint .` and `vitest run` all pass.

## 2. Manual end-to-end check

Start the server (default port 3000):

```bash
npm run dev
```

In another terminal, from the repository root:

```bash
# Empty library
curl -i "http://127.0.0.1:3000/books/export?format=json"   # 200, body: []
curl -i "http://127.0.0.1:3000/books/export?format=csv"    # 200, body: header row only

# Add books, mark one read
curl -s -X POST http://127.0.0.1:3000/books -H 'content-type: application/json' \
  -d '{"title":"Dune","author":"Frank Herbert"}'
curl -s -X POST http://127.0.0.1:3000/books -H 'content-type: application/json' \
  -d '{"title":"Hello, \"World\"","author":"A. Author"}'
curl -s -X POST http://127.0.0.1:3000/books/1/read

# Export
curl -i "http://127.0.0.1:3000/books/export?format=json"
curl -i "http://127.0.0.1:3000/books/export?format=csv"

# Rejections
curl -i "http://127.0.0.1:3000/books/export?format=xml"
curl -i "http://127.0.0.1:3000/books/export"
curl -i "http://127.0.0.1:3000/books/export?format=JSON"
curl -i "http://127.0.0.1:3000/books/export?format=json&format=csv"
```

## 3. Expected outcomes

| Check | Expected |
|-------|----------|
| JSON export of the two books above | 200, `application/json`, array of two records; book 1 has `"read": true` |
| CSV export | 200, `text/csv`, header `id,title,author,read`, then `1,Dune,Frank Herbert,true` and `2,"Hello, ""World""",A. Author,false` |
| Empty library | JSON `[]`; CSV header row only; both 200 |
| `xml`, missing, `JSON`, repeated `format` | 422 with `{"detail":"Unsupported format. Supported formats: json, csv"}` and no book data |
| `GET /books` after exporting | Unchanged list (export is read-only) |

Server logs (JSON lines on stdout) should show `books.exported` for successes and
`books.export.invalid_format` for rejections.
