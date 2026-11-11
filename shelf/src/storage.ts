import { getLogger } from "./log";

const log = getLogger("storage");

export interface Book {
  id: number;
  title: string;
  author: string;
  read: boolean;
}

export class BookNotFoundError extends Error {}

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

export function markRead(id: number): Book {
  const book = getBook(id);
  book.read = true;
  return book;
}
