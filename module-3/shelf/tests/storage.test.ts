import { beforeEach, describe, expect, it } from "vitest";

import { addBook, BookNotFoundError, books, deleteBook, getBook, listBooks, markRead, recent } from "../src/storage";

beforeEach(() => {
  books.clear();
});

describe("recent()", () => {
  it("returns an empty array for an empty shelf", () => {
    expect(recent()).toEqual([]);
  });

  it("returns the single book when there is one", () => {
    const only = addBook("Dune", "Frank Herbert");
    expect(recent()).toEqual([{ id: only.id, title: "Dune" }]);
  });

  it("returns the three latest of five books, newest first", () => {
    addBook("First", "A");
    addBook("Second", "B");
    const third = addBook("Third", "C");
    const fourth = addBook("Fourth", "D");
    const fifth = addBook("Fifth", "E");

    expect(recent()).toEqual([
      { id: fifth.id, title: "Fifth" },
      { id: fourth.id, title: "Fourth" },
      { id: third.id, title: "Third" },
    ]);
  });

  it("returns only id and title, not the whole book", () => {
    addBook("Dune", "Frank Herbert");
    expect(Object.keys(recent()[0]).sort()).toEqual(["id", "title"]);
  });

  it("honours an explicit n", () => {
    addBook("First", "A");
    addBook("Second", "B");
    const third = addBook("Third", "C");

    expect(recent(1)).toEqual([{ id: third.id, title: "Third" }]);
    expect(recent(10)).toHaveLength(3);
    expect(recent(0)).toEqual([]);
  });
});

describe("listBooks()", () => {
  it("returns an empty array for an empty shelf", () => {
    expect(listBooks()).toEqual([]);
  });

  it("returns every book with its full shape", () => {
    const book = addBook("Dune", "Frank Herbert");
    expect(listBooks()).toEqual([{ id: book.id, title: "Dune", author: "Frank Herbert", read: false }]);
  });

  it("returns books in insertion order", () => {
    const first = addBook("First", "A");
    const second = addBook("Second", "B");
    const third = addBook("Third", "C");

    expect(listBooks().map((b) => b.id)).toEqual([first.id, second.id, third.id]);
  });

  it("returns a copy, so mutating the result does not change storage", () => {
    addBook("Dune", "Frank Herbert");

    const list = listBooks();
    list.pop();

    expect(list).toHaveLength(0);
    expect(listBooks()).toHaveLength(1);
  });

  it("omits deleted books", () => {
    const first = addBook("First", "A");
    const second = addBook("Second", "B");

    deleteBook(first.id);

    expect(listBooks().map((b) => b.id)).toEqual([second.id]);
  });

  it("reflects a book being marked as read", () => {
    const book = addBook("Dune", "Frank Herbert");
    markRead(book.id);

    expect(listBooks()[0].read).toBe(true);
  });
});

describe("markRead()", () => {
  it("marks an unread book as read and returns it", () => {
    const book = addBook("Dune", "Frank Herbert");
    expect(book.read).toBe(false);

    const result = markRead(book.id);

    expect(result).toEqual({ id: book.id, title: "Dune", author: "Frank Herbert", read: true });
  });

  it("persists the change in storage", () => {
    const book = addBook("Dune", "Frank Herbert");
    markRead(book.id);
    expect(getBook(book.id).read).toBe(true);
  });

  it("is idempotent for an already read book", () => {
    const book = addBook("Dune", "Frank Herbert");
    markRead(book.id);
    expect(markRead(book.id).read).toBe(true);
  });

  it("leaves other books untouched", () => {
    const first = addBook("First", "A");
    const second = addBook("Second", "B");

    markRead(first.id);

    expect(getBook(second.id).read).toBe(false);
  });

  it("throws BookNotFoundError for an unknown id", () => {
    expect(() => markRead(999)).toThrow(BookNotFoundError);
  });

  it("throws BookNotFoundError for a deleted book", () => {
    const book = addBook("Dune", "Frank Herbert");
    deleteBook(book.id);
    expect(() => markRead(book.id)).toThrow(BookNotFoundError);
  });

  it("throws BookNotFoundError for NaN", () => {
    expect(() => markRead(Number.NaN)).toThrow(BookNotFoundError);
  });
});
