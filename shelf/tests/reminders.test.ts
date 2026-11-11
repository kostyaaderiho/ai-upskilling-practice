import { beforeEach, describe, expect, expectTypeOf, it } from "vitest";

import {
  addBook,
  BookNotFoundError,
  books,
  InvalidDueDateError,
  REMINDER_WINDOW_DAYS,
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
