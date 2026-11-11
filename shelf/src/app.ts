import express from "express";

import { getLogger } from "./log";
import { percent } from "./stats";
import * as storage from "./storage";

const log = getLogger("app");

export const app = express();
app.use(express.json());

interface NewBook {
  title: unknown;
  author: string;
}

const MAX_TITLE_LENGTH = 120;

app.post("/books", (req, res) => {
  const body = req.body as NewBook;
  if (typeof body.title !== "string") {
    res.status(422).json({ detail: "Title must be a string" });
    return;
  }
  const title = body.title.trim();
  if (title.length < 1 || title.length > MAX_TITLE_LENGTH) {
    res.status(422).json({ detail: `Title must be 1 to ${MAX_TITLE_LENGTH} characters` });
    return;
  }
  res.json(storage.addBook(title, body.author));
});

app.get("/books", (req, res) => {
  const page = Number(req.query.page ?? 1);
  const perPage = Number(req.query.per_page ?? 10);
  res.json(storage.paginate(storage.listBooks(), page, perPage));
});

app.get("/books/recent", (_req, res) => {
  res.json(storage.recent());
});

app.get("/books/reminders", (_req, res) => {
  res.json(storage.getReminders());
});

app.get("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    res.json(storage.getBook(id));
  } catch (err) {
    if (err instanceof storage.BookNotFoundError) {
      log.warn("book not found", { id });
      res.status(404).json({ detail: "Book not found" });
      return;
    }
    throw err;
  }
});

app.post("/books/:id/read", (req, res) => {
  const id = Number(req.params.id);
  try {
    res.json(storage.markRead(id));
  } catch (err) {
    if (err instanceof storage.BookNotFoundError) {
      log.warn("book not found", { id });
      res.status(404).json({ detail: "Book not found" });
      return;
    }
    throw err;
  }
});

interface NewDueDate {
  dueDate: unknown;
}

app.put("/books/:id/due", (req, res) => {
  const id = Number(req.params.id);
  const body = (req.body ?? {}) as NewDueDate;
  try {
    const dueDate = storage.parseDueDate(body.dueDate);
    res.json(storage.setDueDate(id, dueDate));
  } catch (err) {
    if (err instanceof storage.InvalidDueDateError) {
      log.warn("invalid due date", { id, dueDate: body.dueDate });
      res.status(400).json({ detail: "Due date must be a valid date in YYYY-MM-DD format" });
      return;
    }
    if (err instanceof storage.BookNotFoundError) {
      log.warn("book not found", { id });
      res.status(404).json({ detail: "Book not found" });
      return;
    }
    throw err;
  }
});

app.post("/books/:id/return", (req, res) => {
  const id = Number(req.params.id);
  try {
    res.json(storage.returnBook(id));
  } catch (err) {
    if (err instanceof storage.BookNotFoundError) {
      log.warn("book not found", { id });
      res.status(404).json({ detail: "Book not found" });
      return;
    }
    throw err;
  }
});

app.delete("/books/:id", (req, res) => {
  const id = Number(req.params.id);
  try {
    res.json(storage.deleteBook(id));
  } catch (err) {
    if (err instanceof storage.BookNotFoundError) {
      log.warn("book not found", { id });
      res.status(404).json({ detail: "Book not found" });
      return;
    }
    throw err;
  }
});

app.get("/stats", (_req, res) => {
  const all = storage.listBooks();
  const read = all.filter((b) => b.read).length;
  res.json({ total: all.length, read, percent: percent(read, all.length) });
});
