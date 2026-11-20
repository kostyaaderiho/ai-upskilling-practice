import { beforeEach, describe, expect, it } from "vitest";

import { addBook, books, recent } from "../src/storage";

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
