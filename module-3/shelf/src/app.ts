import express from "express";

import { percent } from "./stats";
import * as storage from "./storage";

export const app = express();
app.use(express.json());

interface NewBook {
  title: string;
  author: string;
}

app.post("/books", (req, res) => {
  const body = req.body as NewBook;
  res.json(storage.addBook(body.title, body.author));
});

app.get("/books", (req, res) => {
  const page = Number(req.query.page ?? 1);
  const perPage = Number(req.query.per_page ?? 10);
  res.json(storage.paginate(storage.listBooks(), page, perPage));
});

app.get("/books/recent", (_req, res) => {
  res.json(storage.recent());
});

app.post("/books/:id/read", (req, res) => {
  const id = Number(req.params.id);
  try {
    res.json(storage.markRead(id));
  } catch (err) {
    if (err instanceof storage.BookNotFoundError) {
      console.log("book not found", id);
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
