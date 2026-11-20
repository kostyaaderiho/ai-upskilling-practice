# Feature Specification: Library Export

**Feature Branch**: `001-library-export` (spec directory name; no git branch created, working on `main`)

**Created**: 2026-11-20

**Status**: Draft

**Input**: User description: "Library export: GET /books/export?format=json or csv.. The decomposition is in docs/B-4.md."

## Clarifications

### Session 2026-11-20

- Q: Should the export contain every book in the library, or only the books marked as read? → A: All books, read and unread, each with its read status
- Q: How should a book's read status be written in the CSV export? → A: `true` / `false`
- Q: When a caller omits the `format` parameter, should the export refuse the request or fall back to JSON? → A: Refuse with the same 422 error as an unsupported format (no default format)
- Q: Should the CSV export alter titles or authors that begin with `=`, `+`, `-` or `@`, or write them exactly as stored? → A: Write values exactly as stored; no formula protection

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Export the library as JSON (Priority: P1)

A library owner wants a complete copy of their book collection in a structured, machine-readable
form, so they can back it up, move it to another tool, or process it with a script.

**Why this priority**: JSON is the lossless, unambiguous format and is the smallest slice that
delivers the core value of getting the whole library out. It is a viable MVP on its own.

**Independent Test**: Add a few books (some marked read), request the export with the format set
to `json`, and confirm the response is valid JSON containing exactly those books with all their
details.

**Acceptance Scenarios**:

1. **Given** a library with three books, one of them marked as read, **When** the owner requests
   an export with format `json`, **Then** the response is a valid JSON document listing all three
   books, each with its id, title, author and read status.
2. **Given** an empty library, **When** the owner requests an export with format `json`,
   **Then** the response succeeds and is a valid JSON document containing no books.
3. **Given** a library with books, **When** the owner requests an export, **Then** the books in
   the library are unchanged afterwards.

---

### User Story 2 - Export the library as CSV (Priority: P2)

A library owner wants to open their collection in a spreadsheet to sort, filter or share it with
people who do not use scripts.

**Why this priority**: CSV widens who can use the export (spreadsheet users), but the library is
already retrievable through the JSON export, so it ranks second.

**Independent Test**: Add books, request the export with the format set to `csv`, and confirm a
standard spreadsheet or CSV reader shows one row per book under a header row.

**Acceptance Scenarios**:

1. **Given** a library with three books, **When** the owner requests an export with format `csv`,
   **Then** the response is CSV text with a header row naming the columns followed by one row per
   book, in the same order as the library listing.
2. **Given** an empty library, **When** the owner requests an export with format `csv`,
   **Then** the response succeeds and contains only the header row.
3. **Given** a book whose title contains a comma, a double quote or a line break, **When** the
   owner exports as `csv`, **Then** a standard CSV reader reconstructs the original title exactly.

---

### User Story 3 - Clear rejection of an unsupported format (Priority: P3)

A caller asks for a format the export does not offer (or forgets to name one) and needs to be told
what went wrong, rather than receiving data in a format they did not expect.

**Why this priority**: It protects callers from silent misuse but adds no new data access, so it
ranks after both working formats.

**Independent Test**: Request the export with an unsupported format value and with no format at
all, and confirm each is refused with an explanatory error and no book data.

**Acceptance Scenarios**:

1. **Given** any library, **When** the caller requests an export with format `xml`, **Then** the
   request is refused as invalid input (status 422) with an error message that names the
   supported formats, and no book data is returned.
2. **Given** any library, **When** the caller requests an export without specifying a format,
   **Then** the request is refused in the same way as an unsupported format.

---

### Edge Cases

- Empty library: both formats succeed (JSON with no books; CSV with the header row only), never
  an error.
- Titles or authors containing commas, double quotes, line breaks, or non-English characters: the
  exported values MUST reconstruct exactly when read back with a standard reader of that format.
- Format value in a different letter case (for example `JSON`): treated as unsupported.
- Format given more than once (for example `format=json&format=csv`) or with an empty value:
  treated as unsupported.
- Books marked as read versus unread: the read status MUST be present and correct for every
  book in both formats.
- A book added immediately before the export request: it MUST appear in the export.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide an export of the library through `GET /books/export`, with
  the desired output chosen by a `format` query parameter.
- **FR-002**: The export MUST include every book currently in the library, read and unread
  alike; there is no filtering by read status.
- **FR-003**: The system MUST support exactly two formats: `json` and `csv`.
- **FR-004**: Every exported book MUST include its id, title, author and read status.
- **FR-005**: Books MUST be exported in the same order as the library listing (the order they
  were added).
- **FR-006**: The JSON export MUST be a single valid JSON document containing a list of book
  records, one per book.
- **FR-007**: The CSV export MUST begin with a header row naming the columns, followed by one row
  per book. A book's read status MUST be written as `true` or `false`, matching the JSON export.
- **FR-008**: CSV values containing commas, double quotes or line breaks MUST be escaped so that
  a standard CSV reader recovers the original values. Values MUST otherwise be written exactly
  as stored, including those beginning with `=`, `+`, `-` or `@`.
- **FR-009**: For an empty library, the JSON export MUST be an empty list and the CSV export MUST
  consist of the header row only; neither is an error.
- **FR-010**: A request whose `format` is missing, empty, repeated, or anything other than
  exactly `json` or `csv` MUST be refused with status 422 and an error body of the form
  `{ detail }` whose message names the supported formats; no book data is returned.
- **FR-011**: The response content type MUST match the requested format (JSON for `json`, CSV
  text for `csv`).
- **FR-012**: Exporting MUST NOT change the library in any way.

### Key Entities

- **Book**: An item in the library. Attributes: id (unique, assigned when the book is added),
  title, author, and read status (read or not read).
- **Library export**: A snapshot of all books at the moment of the request, rendered in one
  requested format. It is produced on demand and is not stored.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: For any library, parsing the JSON export yields exactly the same set of books, with
  identical field values, as the library listing (100% of books, 0 differences).
- **SC-002**: For any library, reading the CSV export with a standard CSV reader yields exactly
  the same set of books as the library listing, including titles and authors that contain commas,
  quotes or line breaks (100% round-trip fidelity).
- **SC-003**: Exporting an empty library succeeds in both formats and produces a valid, readable
  result every time.
- **SC-004**: 100% of requests with a missing or unsupported format are refused with a message
  that names the supported formats, and none of them return book data.
- **SC-005**: A library of 1,000 books is exported in under 1 second in either format.

## Assumptions

- The export is a read-only snapshot taken at request time; no filtering, sorting options, or
  pagination are offered.
- Format values are matched exactly and in lower case; there is no default format.
- The JSON export is a plain list of book records (matching how the library listing is shaped),
  not a wrapper object with extra metadata.
- CSV columns are the four book attributes (id, title, author, read) in that order; the exact
  header names follow the attribute names.
- The export is returned directly as the response body; it is not offered as a named file
  download.
- Hardening against spreadsheet formula injection is out of scope; it can be added later as a
  separate change (see Clarifications).
- The feature is delivered with no new third-party dependencies and no calls to external
  services, as stated in `docs/B-4.md` ("no dependencies") and in the constraints the user gave
  for the project constitution (localhost only, tests first, no new dependencies without
  justification). That constitution has not been written yet, so these constraints are recorded
  here rather than inherited from it.
- Error responses follow the project's existing convention of `{ detail }` with an HTTP status
  code.
- Other backlog items (B-5 title validation, B-8/B-9 get and delete by id) are separate features
  and are not part of this one.
