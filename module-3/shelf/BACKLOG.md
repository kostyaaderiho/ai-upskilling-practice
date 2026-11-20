# Backlog

- B-1 (bug): /stats shows a wrong percentage of read books.
- B-2 (bug): GET /books/recent always returns 500.
- B-3 (bug): GET /books?page=1 does not show the first books.
- B-4 (feature): Library export: GET /books/export?format=json or csv.
- B-5 (feature): Book title validation: 1 to 120 characters, leading and trailing spaces trimmed.
- B-6 (debt): The code uses console.log instead of the src/log.ts logger.
- B-7 (epic): Users forget to return books to the library. We need to remind them of due dates.
- B-8 (feature): GET /books/:id — get a book by id, 404 if it does not exist.
- B-9 (feature): DELETE /books/:id — delete a book, 404 if it does not exist.
