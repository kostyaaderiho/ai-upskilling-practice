import request from "supertest";
import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";

import { app } from "../src/app";
import {
  addBook,
  BookNotFoundError,
  books,
  getReminders,
  InvalidDueDateError,
  markRead,
  REMINDER_WINDOW_DAYS,
  returnBook,
  setDueDate,
} from "../src/storage";
import type { Book, Reminder, ReminderStatus } from "../src/storage";

beforeEach(() => {
  books.clear();
});

describe("reminders foundations", () => {
  it("fixes the reminder window at 3 days", () => {
    expect(REMINDER_WINDOW_DAYS).toBe(3);
  });

  it("exposes InvalidDueDateError as a domain error", () => {
    const err = new InvalidDueDateError("2026-02-31");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(InvalidDueDateError);
    expect(err.message).toBe("2026-02-31");
  });

  it("keeps InvalidDueDateError distinct from BookNotFoundError", () => {
    expect(new InvalidDueDateError("x")).not.toBeInstanceOf(BookNotFoundError);
    expect(new BookNotFoundError("1")).not.toBeInstanceOf(InvalidDueDateError);
  });

  it("does not add a dueDate key to a freshly created book", () => {
    const book = addBook("Дюна", "Фрэнк Герберт");
    expect("dueDate" in book).toBe(false);
  });

  it("declares the reminder types", () => {
    expectTypeOf<ReminderStatus>().toEqualTypeOf<"overdue" | "due-soon">();
    expectTypeOf<Reminder>().toEqualTypeOf<{
      id: number;
      title: string;
      dueDate: string;
      status: ReminderStatus;
    }>();
    expectTypeOf<Book["dueDate"]>().toEqualTypeOf<string | undefined>();
  });
});

async function createBook(title = "Дюна"): Promise<number> {
  const res = await request(app).post("/books").send({ title, author: "Автор" });
  return res.body.id as number;
}

describe("PUT /books/:id/due", () => {
  it("sets the due date and returns the book", async () => {
    const id = await createBook();

    const res = await request(app).put(`/books/${id}/due`).send({ dueDate: "2026-11-20" });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id, title: "Дюна", dueDate: "2026-11-20" });

    const got = await request(app).get(`/books/${id}`);
    expect(got.body.dueDate).toBe("2026-11-20");
  });

  it("replaces an existing due date", async () => {
    const id = await createBook();
    await request(app).put(`/books/${id}/due`).send({ dueDate: "2026-11-20" });

    const res = await request(app).put(`/books/${id}/due`).send({ dueDate: "2026-12-01" });
    expect(res.status).toBe(200);

    const got = await request(app).get(`/books/${id}`);
    expect(got.body.dueDate).toBe("2026-12-01");
  });

  it("accepts a date in the past", async () => {
    const id = await createBook();
    const res = await request(app).put(`/books/${id}/due`).send({ dueDate: "2020-01-01" });
    expect(res.status).toBe(200);
    expect(res.body.dueDate).toBe("2020-01-01");
  });

  it.each([
    ["missing", {}],
    ["a number", { dueDate: 20261120 }],
    ["a short month", { dueDate: "2026-2-1" }],
    ["no separators", { dueDate: "20261120" }],
    ["a non-existent day", { dueDate: "2026-02-31" }],
    ["a non-existent month", { dueDate: "2026-13-01" }],
  ])("rejects a due date that is %s and keeps the old one", async (_name, body) => {
    const id = await createBook();
    await request(app).put(`/books/${id}/due`).send({ dueDate: "2026-11-20" });

    const res = await request(app).put(`/books/${id}/due`).send(body);
    expect(res.status).toBe(400);
    expect(typeof res.body.detail).toBe("string");
    expect(res.body.detail.length).toBeGreaterThan(0);

    const got = await request(app).get(`/books/${id}`);
    expect(got.body.dueDate).toBe("2026-11-20");
  });

  it("returns 404 for a missing book", async () => {
    const res = await request(app).put("/books/999999/due").send({ dueDate: "2026-11-20" });
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });
});

describe("POST /books/:id/return", () => {
  it("removes the due date", async () => {
    const id = await createBook();
    await request(app).put(`/books/${id}/due`).send({ dueDate: "2026-11-20" });

    const res = await request(app).post(`/books/${id}/return`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
    expect("dueDate" in res.body).toBe(false);

    const got = await request(app).get(`/books/${id}`);
    expect("dueDate" in got.body).toBe(false);
  });

  it("is not an error for a book that was not borrowed or already returned", async () => {
    const id = await createBook();

    const first = await request(app).post(`/books/${id}/return`);
    expect(first.status).toBe(200);

    await request(app).put(`/books/${id}/due`).send({ dueDate: "2026-11-20" });
    await request(app).post(`/books/${id}/return`);
    const again = await request(app).post(`/books/${id}/return`);
    expect(again.status).toBe(200);
    expect("dueDate" in again.body).toBe(false);
  });

  it("returns 404 for a missing book", async () => {
    const res = await request(app).post("/books/999999/return");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ detail: "Book not found" });
  });
});

describe("books without a due date", () => {
  it("keep responses unchanged", async () => {
    const created = await request(app).post("/books").send({ title: "Дюна", author: "Автор" });
    expect("dueDate" in created.body).toBe(false);

    const id = created.body.id as number;
    const got = await request(app).get(`/books/${id}`);
    expect("dueDate" in got.body).toBe(false);

    const read = await request(app).post(`/books/${id}/read`);
    expect("dueDate" in read.body).toBe(false);
  });
});

function borrow(title: string, dueDate: string): number {
  const book = addBook(title, "Автор");
  setDueDate(book.id, dueDate);
  return book.id;
}

function localDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

describe("getReminders", () => {
  const today = "2026-11-11";

  it("returns an empty array when nothing is borrowed", () => {
    expect(getReminders(today)).toEqual([]);
    addBook("Без срока", "Автор");
    expect(getReminders(today)).toEqual([]);
  });

  it("classifies books around the reminder window", () => {
    const overdue = borrow("Вчера", "2026-11-10");
    const dueToday = borrow("Сегодня", "2026-11-11");
    const lastDay = borrow("Через 3 дня", "2026-11-14");
    borrow("Через 4 дня", "2026-11-15");
    addBook("Без срока", "Автор");

    expect(getReminders(today).map((r) => [r.id, r.status])).toEqual([
      [overdue, "overdue"],
      [dueToday, "due-soon"],
      [lastDay, "due-soon"],
    ]);
  });

  it("drops a book once it is returned", () => {
    const id = borrow("Вернули", "2026-11-10");
    expect(getReminders(today)).toHaveLength(1);
    returnBook(id);
    expect(getReminders(today)).toEqual([]);
  });

  it("keeps a read but not returned book", () => {
    const id = borrow("Прочитана", "2026-11-01");
    markRead(id);
    expect(getReminders(today).map((r) => r.id)).toEqual([id]);
  });

  it("sorts by due date, then by id", () => {
    const late = borrow("Позже", "2026-11-13");
    const earlyA = borrow("Раньше А", "2026-11-09");
    const earlyB = borrow("Раньше Б", "2026-11-09");
    const mid = borrow("Середина", "2026-11-11");

    expect(getReminders(today).map((r) => r.id)).toEqual([earlyA, earlyB, mid, late]);
  });

  it("returns only id, title, dueDate and status", () => {
    borrow("Дюна", "2026-11-12");
    const [reminder] = getReminders(today);
    expect(Object.keys(reminder).sort()).toEqual(["dueDate", "id", "status", "title"]);
    expect(reminder.title).toBe("Дюна");
    expect(reminder.dueDate).toBe("2026-11-12");
  });

  it("counts days across a month and year boundary", () => {
    borrow("Новый год", "2027-01-02");
    expect(getReminders("2026-12-30").map((r) => r.status)).toEqual(["due-soon"]);
    expect(getReminders("2026-12-29")).toEqual([]);
  });
});

describe("GET /books/reminders", () => {
  it("returns an empty list, not a book lookup error", async () => {
    const res = await request(app).get("/books/reminders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("lists overdue and due-soon books for the current local date", async () => {
    const yesterday = await createBook("Вчера");
    const today = await createBook("Сегодня");
    const far = await createBook("Далеко");
    await request(app).put(`/books/${yesterday}/due`).send({ dueDate: localDate(-1) });
    await request(app).put(`/books/${today}/due`).send({ dueDate: localDate(0) });
    await request(app).put(`/books/${far}/due`).send({ dueDate: localDate(10) });

    const res = await request(app).get("/books/reminders");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: yesterday, title: "Вчера", dueDate: localDate(-1), status: "overdue" },
      { id: today, title: "Сегодня", dueDate: localDate(0), status: "due-soon" },
    ]);
  });
});
