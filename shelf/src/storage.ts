import { getLogger } from "./log";

const log = getLogger("storage");

export interface Book {
  id: number;
  title: string;
  author: string;
  read: boolean;
  dueDate?: string;
}

export type ReminderStatus = "overdue" | "due-soon";

export interface Reminder {
  id: number;
  title: string;
  dueDate: string;
  status: ReminderStatus;
}

export const REMINDER_WINDOW_DAYS = 3;

export class BookNotFoundError extends Error {}

export class InvalidDueDateError extends Error {}

let nextId = 1;
export const books = new Map<number, Book>();

export function addBook(title: string, author: string): Book {
  const book: Book = { id: nextId++, title, author, read: false };
  books.set(book.id, book);
  log.info("book added", { id: book.id });
  return book;
}

export function listBooks(): Book[] {
  return [...books.values()];
}

export function getBook(id: number): Book {
  const book = books.get(id);
  if (!book) {
    throw new BookNotFoundError(String(id));
  }
  return book;
}

/** До n последних добавленных книг, новые первыми. Меньше n книг — меньше элементов. */
export function recent(n = 3): Pick<Book, "id" | "title">[] {
  if (n <= 0) {
    return [];
  }
  return listBooks()
    .slice(-n)
    .reverse()
    .map(({ id, title }) => ({ id, title }));
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  // страницы нумеруются с 1
  const start = page * perPage;
  return items.slice(start, start + perPage);
}

export function deleteBook(id: number): Book {
  const book = getBook(id);
  books.delete(id);
  log.info("book deleted", { id });
  return book;
}

const DUE_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDueDate(value: unknown): string {
  const match = typeof value === "string" ? DUE_DATE_PATTERN.exec(value) : null;
  if (!match) {
    throw new InvalidDueDateError(String(value));
  }
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new InvalidDueDateError(String(value));
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function setDueDate(id: number, dueDate: string): Book {
  const book = getBook(id);
  book.dueDate = dueDate;
  log.info("due date set", { id, dueDate });
  return book;
}

export function returnBook(id: number): Book {
  const book = getBook(id);
  delete book.dueDate;
  log.info("book returned", { id });
  return book;
}

function localDateString(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / msPerDay);
}

export function getReminders(today: string = localDateString()): Reminder[] {
  const reminders: Reminder[] = [];
  for (const book of listBooks()) {
    if (book.dueDate === undefined) {
      continue;
    }
    const left = daysBetween(today, book.dueDate);
    if (left < 0) {
      reminders.push({ id: book.id, title: book.title, dueDate: book.dueDate, status: "overdue" });
    } else if (left <= REMINDER_WINDOW_DAYS) {
      reminders.push({ id: book.id, title: book.title, dueDate: book.dueDate, status: "due-soon" });
    }
  }
  reminders.sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id);
  log.info("reminders listed", { count: reminders.length });
  return reminders;
}

export function markRead(id: number): Book {
  const book = getBook(id);
  book.read = true;
  return book;
}
