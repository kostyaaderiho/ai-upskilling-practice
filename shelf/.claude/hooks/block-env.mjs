#!/usr/bin/env node
// PreToolUse hook: запрещает агенту читать .env.
// Claude Code подаёт на stdin JSON вызова инструмента, ждёт код выхода:
//   0 — разрешить, 2 — заблокировать (текст из stderr получает агент).

const MESSAGE =
  "Доступ к .env запрещён правилами проекта: там секреты, и в контекст агента они попадать не должны.\n" +
  "Если нужно знать, какие переменные существуют, спросите человека или посмотрите их имена в README.";

const readStdin = async () => {
  let raw = "";
  for await (const chunk of process.stdin) raw += chunk;
  return raw;
};

// .env, ./.env, path/to/.env, .env.local — но не environment.ts и не .envrc
const TOUCHES_ENV = /(^|[\s"'`/=:])\.env(\.[\w-]+)?($|[\s"'`;:,)])/;

const payload = await readStdin();

let input;
try {
  input = JSON.parse(payload || "{}");
} catch {
  // Непонятный ввод — не наше дело блокировать вызов.
  process.exit(0);
}

const toolInput = input.tool_input ?? {};
const candidates = [
  toolInput.file_path,
  toolInput.path,
  toolInput.notebook_path,
  toolInput.command,
  toolInput.pattern,
  toolInput.glob,
].filter((value) => typeof value === "string");

if (candidates.some((value) => TOUCHES_ENV.test(value))) {
  process.stderr.write(`${MESSAGE}\n`);
  process.exit(2);
}

process.exit(0);
