import { beforeEach, describe, expect, it } from "vitest";

import { addBook, BookNotFoundError, books, markRead, recent } from "../src/storage";

beforeEach(() => {
  books.clear();
});

describe("recent", () => {
  it("returns an empty array when there are no books", () => {
    expect(recent()).toEqual([]);
  });

  it("returns the single book when there is only one", () => {
    const book = addBook("Дюна", "Фрэнк Герберт");
    expect(recent()).toEqual([{ id: book.id, title: "Дюна" }]);
  });

  it("returns at most three books, newest first", () => {
    for (const title of ["Первая", "Вторая", "Третья", "Четвёртая", "Пятая"]) {
      addBook(title, "Автор");
    }

    expect(recent().map((b) => b.title)).toEqual(["Пятая", "Четвёртая", "Третья"]);
  });

  it("returns only id and title", () => {
    addBook("Дюна", "Фрэнк Герберт");
    expect(Object.keys(recent()[0]).sort()).toEqual(["id", "title"]);
  });
});

describe("markRead", () => {
  it("marks an unread book as read and returns it", () => {
    const book = addBook("Дюна", "Фрэнк Герберт");
    expect(book.read).toBe(false);

    const result = markRead(book.id);
    expect(result.id).toBe(book.id);
    expect(result.read).toBe(true);
  });

  it("persists the read flag in storage", () => {
    const book = addBook("Дюна", "Фрэнк Герберт");
    markRead(book.id);
    expect(books.get(book.id)?.read).toBe(true);
  });

  it("is idempotent for an already read book", () => {
    const book = addBook("Дюна", "Фрэнк Герберт");
    markRead(book.id);
    expect(markRead(book.id).read).toBe(true);
  });

  it("throws BookNotFoundError for a missing id", () => {
    expect(() => markRead(999999)).toThrow(BookNotFoundError);
  });
});
