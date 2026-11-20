// make-project.mjs — creates the shelf practice project for module 3
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
  "src/stats.ts": `/** Share of read books as a percentage, one decimal place. */
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
  // pages are numbered from 1
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
    const res = await request(app).post("/books").send({ title: "Dune", author: "Frank Herbert" });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe("Dune");
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

A personal bookshelf for module 3.

    npm install
    npm run dev     # server on http://localhost:3000
    npm run check   # tsc --noEmit, eslint, vitest
`,
  "docs/notes.md": `# Module 3 log

Prompts, agent mistakes and decisions for each task. You check yourself against this file and the commit history.
In each section, answer the readiness-criteria points of the task that require a log entry.

## 3.1 Rules

- What the agent logged with before CLAUDE.md:
- What it logs with after, and why:
- How the agent ran the tests, before and after CLAUDE.local.md:
- Which rules live where, and why:
- Which stack you chose and why:

## 3.2 Debugging and tests

- B-1: what the tests written from the code alone checked:
- B-2: the three-part prompt:
- Hallucination: tsc error, documentation link, feedback prompt:

## 3.3 Spec Kit

- Order of Spec Kit commands and the file each step created:
- Which NEEDS CLARIFICATION markers there were and what you answered:

## 3.4 Agent mode

- What you did in plan mode and what in agent mode:
- When you stopped or rolled back the agent, and why:
- Regression after pong: what broke and how you rolled it back (or "nothing broke"):

## 3.5 Commands, hooks, MCP

- Which MCP tool the agent called to read Issue B-8:
- What the agent remembered after /compact and after /clear:
- What a colleague gets after cloning the repository:

## Final task

The decisions note is a separate file, docs/B-7-decisions.md.

- What /self-review said, and what you changed after it:
`,
  "BACKLOG.md": `# Backlog

- B-1 (bug): /stats shows a wrong percentage of read books.
- B-2 (bug): GET /books/recent always returns 500.
- B-3 (bug): GET /books?page=1 does not show the first books.
- B-4 (feature): Library export: GET /books/export?format=json or csv.
- B-5 (feature): Book title validation: 1 to 120 characters, leading and trailing spaces trimmed.
- B-6 (debt): The code uses console.log instead of the src/log.ts logger.
- B-7 (epic): Users forget to return books to the library. We need to remind them of due dates.
- B-8 (feature): GET /books/:id — get a book by id, 404 if it does not exist.
- B-9 (feature): DELETE /books/:id — delete a book, 404 if it does not exist.
`,
};

for (const [path, content] of Object.entries(FILES)) {
  const file = join("shelf", path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content, "utf8");
}
console.log("Done: project is in the shelf/ folder");
