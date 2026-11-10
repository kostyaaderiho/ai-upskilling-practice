// make-project.mjs — создаёт учебный проект shelf для модуля 3
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const packageJson = {
  name: "shelf",
  private: true,
  type: "module",
  scripts: {
    dev: "tsx watch src/server.ts",
    test: "vitest run",
    lint: "eslint .",
    typecheck: "tsc --noEmit",
    check: "tsc --noEmit && eslint . && vitest run",
  },
  dependencies: {
    express: "^5.1.0",
  },
  devDependencies: {
    "@eslint/js": "^9.20.0",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.0",
    "@types/supertest": "^6.0.2",
    eslint: "^9.20.0",
    supertest: "^7.0.0",
    tsx: "^4.19.0",
    typescript: "^5.7.0",
    "typescript-eslint": "^8.24.0",
    vitest: "^3.0.0",
  },
};

const FILES = {
  "src/log.ts": `type Level = "info" | "warn" | "error";

export type Logger = Record<Level, (msg: string, extra?: Record<string, unknown>) => void>;

export function getLogger(name: string): Logger {
  const write = (level: Level) => (msg: string, extra: Record<string, unknown> = {}) => {
    process.stdout.write(JSON.stringify({ level, logger: name, msg, ...extra }) + "\\n");
  };
  return { info: write("info"), warn: write("warn"), error: write("error") };
}
`,
  "src/stats.ts": `/** Доля прочитанных книг в процентах, одна цифра после запятой. */
export function percent(read: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round(((read * total) / 100) * 10) / 10;
}
`,
  "src/storage.ts": `export interface Book {
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
  console.log("book added", book.id);
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

export function recent(n = 3): Pick<Book, "id" | "title">[] {
  const all = listBooks();
  return Array.from({ length: n }, (_, i) => {
    const book = all[all.length - i];
    return { id: book.id, title: book.title };
  });
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
`,
  "src/app.ts": `import express from "express";

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
`,
  "src/server.ts": `import { app } from "./app";

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => {
  console.log("Shelf listening on port", port);
});
`,
  "tests/api.test.ts": `import request from "supertest";
import { describe, expect, it } from "vitest";

import { app } from "../src/app";

describe("POST /books", () => {
  it("creates a book", async () => {
    const res = await request(app).post("/books").send({ title: "Дюна", author: "Фрэнк Герберт" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Дюна");
  });
});
`,
  "package.json": JSON.stringify(packageJson, null, 2) + "\n",
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "tests"]
}
`,
  "eslint.config.js": `import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", ".claude/", ".specify/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
);
`,
  ".env": "SECRET_KEY=dev-only-not-a-real-secret\n",
  ".gitignore":
    "node_modules/\n.env\n.tmp/\nCLAUDE.local.md\n.claude/settings.local.json\n",
  "README.md": `# Shelf

Личная книжная полка для модуля 3.

    npm install
    npm run dev     # сервер на http://localhost:3000
    npm run check   # tsc --noEmit, eslint, vitest
`,
  "docs/notes.md": `# Журнал модуля 3

Промпты, ошибки агента и решения по заданиям. По этому файлу и истории коммитов вы проверяете себя по критериям.
В каждом разделе отвечайте на те пункты критериев готовности задания, которые требуют записи в журнал.

## 3.1 Правила

- Чем агент логировал до CLAUDE.md:
- Чем после и почему:
- Какой стек выбрали и почему:

## 3.2 Отладка и тесты

- B-1: что проверяли тесты по одному коду:
- B-2: промпт из трёх частей:
- Галлюцинация: ошибка tsc, ссылка на документацию, промпт с обратной связью:

## 3.3 Spec Kit

- Порядок команд Spec Kit и какой файл создал каждый шаг:
- Какие NEEDS CLARIFICATION были и что вы ответили:

## 3.4 Агентный режим

- Что делали в режиме плана, что в агентном:
- Когда остановили или откатили агента и почему:

## 3.5 Команды, hooks, MCP

- Какой инструмент MCP вызвал агент, чтобы прочитать Issue B-8:
- Что агент помнил после /compact и после /clear:

## Итоговое задание

Заметка о решениях — отдельный файл docs/B-7-decisions.md.

- Где сработал hook, что сказал /self-review:
`,
  "BACKLOG.md": `# Бэклог

- B-1 (баг): /stats показывает неверный процент прочитанных книг.
- B-2 (баг): GET /books/recent всегда отвечает 500.
- B-3 (баг): GET /books?page=1 не показывает первые книги.
- B-4 (фича): Экспорт библиотеки: GET /books/export?format=json или csv.
- B-5 (фича): Валидация названия книги: от 1 до 120 символов, пробелы по краям обрезаются.
- B-6 (долг): В коде console.log вместо логгера src/log.ts.
- B-7 (эпик): Пользователи забывают вернуть книги в библиотеку. Нужно напоминать о сроках.
- B-8 (фича): GET /books/:id — получить книгу по id, 404, если её нет.
- B-9 (фича): DELETE /books/:id — удалить книгу, 404, если её нет.
`,
};

for (const [path, content] of Object.entries(FILES)) {
  const file = join("shelf", path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}
console.log("Готово: проект в папке shelf/");
