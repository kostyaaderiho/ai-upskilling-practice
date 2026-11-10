import { beforeEach, describe, expect, it } from "vitest";

import { addBook, books, recent } from "../src/storage";

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
