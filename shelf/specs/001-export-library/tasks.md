---

description: "Task list for library export (GET /books/export)"
---

# Tasks: Экспорт библиотеки

**Input**: Design documents from `/specs/001-export-library/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/export-api.md

**Tests**: ОБЯЗАТЕЛЬНЫ (конституция, принцип II, и FR-009): сначала падающий тест, затем код.

**Organization**: Задачи сгруппированы по историям пользователя; порядок работ следует `docs/B-4.md`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можно выполнять параллельно (разные файлы, нет зависимостей)
- **[Story]**: к какой истории относится задача (US1, US2, US3)

## Path Conventions

Единый проект: `src/` и `tests/` в корне репозитория. Все тесты новой фичи — в одном файле
`tests/export.test.ts`; хранилище живёт между тестами файла, поэтому тест пустой библиотеки
MUST идти первым, а ожидаемые id брать из ответа на создание книги, не хардкодить.

## Phase 1: Setup

**Purpose**: зафиксировать исходное состояние

- [ ] T001 Прогнать `npm run check` и записать реальный исходный результат (tsc, eslint, vitest) до любых правок; шум `console.log` из `src/storage.ts` — известный долг B-6, не трогать

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: общие объявления, нужные всем историям

- [ ] T002 Добавить в `src/storage.ts` объявления `export type ExportFormat = "json" | "csv"` и `export class UnsupportedFormatError extends Error {}` (по образцу `BookNotFoundError`), без логики

**Checkpoint**: типы и доменная ошибка есть, можно писать тесты историй

---

## Phase 3: User Story 1 - Выгрузка библиотеки в JSON (Priority: P1) 🎯 MVP

**Goal**: `GET /books/export?format=json` отдаёт все книги массивом `{id, title, author, read}`.

**Independent Test**: создать книги через `POST /books`, запросить JSON-экспорт и сверить с созданными книгами; на пустой библиотеке получить `[]`.

### Tests for User Story 1 (write FIRST, must FAIL)

- [ ] T003 [US1] Создать `tests/export.test.ts` с импортами `request`, `describe/expect/it`, `app` из `../src/app` и ПЕРВЫМ тестом: пустая библиотека, `GET /books/export?format=json` → 200, `Content-Type` содержит `application/json`, тело `[]`
- [ ] T004 [US1] В `tests/export.test.ts` добавить тест: создать две книги через `POST /books`, `GET /books/export?format=json` → 200, тело содержит обе книги с полями `id`, `title`, `author`, `read` (id брать из ответов на создание); повторный экспорт даёт то же тело (экспорт не меняет данные)
- [ ] T005 [US1] Запустить `npx vitest run tests/export.test.ts` и убедиться, что T003–T004 ПАДАЮТ (ручки ещё нет, ожидается 404); сохранить вывод как доказательство

### Implementation for User Story 1

- [ ] T006 [US1] В `src/storage.ts` реализовать `parseExportFormat(value: unknown): ExportFormat` (принимает только строку `json` в нижнем регистре, иное бросает `UnsupportedFormatError`) и `exportBooks(format: ExportFormat): string` с веткой JSON через `JSON.stringify(listBooks())`; явные возвращаемые типы, без `any`
- [ ] T007 [US1] В `src/app.ts` добавить `GET /books/export` рядом с `GET /books/recent` (до любых будущих `/books/:id`): `parseExportFormat(req.query.format)`, `res.type("application/json").send(storage.exportBooks(format))`; залогировать успех через `getLogger("app")` из `src/log.ts` (`log.info("export succeeded", { format, count })`), без `console.*`
- [ ] T008 [US1] Запустить `npx vitest run tests/export.test.ts` — T003–T004 должны стать зелёными

**Checkpoint**: JSON-экспорт работает и тестируется независимо (MVP)

---

## Phase 4: User Story 2 - Выгрузка библиотеки в CSV (Priority: P2)

**Goal**: `GET /books/export?format=csv` отдаёт CSV: заголовок `id,title,author,read` и по строке на книгу, разделитель записей `\r\n`, экранирование по RFC 4180.

**Independent Test**: создать книги (в том числе с запятой, кавычками и переводом строки в названии), запросить CSV и сверить строку целиком.

### Tests for User Story 2 (write FIRST, must FAIL)

- [ ] T009 [US2] В `tests/export.test.ts` добавить два теста CSV. (a) С книгами: `Content-Type` содержит `text/csv`, первая строка `id,title,author,read`, затем по строке на каждую книгу с теми же данными, что в JSON, `read` как `true`/`false`. (b) Пустая библиотека: ответ — только строка заголовков; так как к этому моменту книги уже созданы (T004), тест (b) MUST получать чистое хранилище через `vi.resetModules()` и динамический `await import("../src/app")`
- [ ] T010 [US2] В `tests/export.test.ts` добавить тест экранирования: название с запятой, с кавычками (`"` удваивается) и с переводом строки берётся в двойные кавычки и занимает одну запись; не-ASCII символы сохраняются
- [ ] T011 [US2] Запустить `npx vitest run tests/export.test.ts` и убедиться, что T009–T010 ПАДАЮТ (csv пока не поддерживается)

### Implementation for User Story 2

- [ ] T012 [US2] В `src/storage.ts` расширить `parseExportFormat` значением `csv` и добавить в `exportBooks` ветку CSV: столбцы `id,title,author,read`; поле в двойных кавычках, если содержит `,`, `"`, `\r` или `\n`, внутренние `"` удваиваются; записи через `\r\n`, завершающий `\r\n` после последней записи; значения не модифицируются (риск CSV-инъекции формул зафиксирован в research.md, не нейтрализуется)
- [ ] T013 [US2] В `src/app.ts` в ручке `GET /books/export` задавать `Content-Type: text/csv; charset=utf-8` для формата `csv`, `application/json` для `json`
- [ ] T014 [US2] Запустить `npx vitest run tests/export.test.ts` — T003–T010 зелёные

**Checkpoint**: оба формата работают; JSON по-прежнему проходит

---

## Phase 5: User Story 3 - Понятная ошибка при неверном формате (Priority: P3)

**Goal**: неизвестный или отсутствующий формат даёт `400 { "detail": "Unsupported export format" }` и никаких данных.

**Independent Test**: запросить экспорт с `format=xml`, без `format` и с `format=JSON`.

### Tests for User Story 3 (write FIRST, must FAIL)

- [ ] T015 [US3] В `tests/export.test.ts` добавить тест: `GET /books/export?format=xml` → 400, тело ровно `{ detail: "Unsupported export format" }`
- [ ] T016 [US3] В `tests/export.test.ts` добавить тесты: запрос без `format` и запрос `format=JSON` (другой регистр) → 400 с тем же телом; в теле нет данных книг
- [ ] T017 [US3] Запустить `npx vitest run tests/export.test.ts` и убедиться, что T015–T016 ПАДАЮТ (ожидается 500 от необработанной `UnsupportedFormatError`)

### Implementation for User Story 3

- [ ] T018 [US3] В `src/app.ts` в ручке `GET /books/export` ловить `storage.UnsupportedFormatError`: `log.warn("export rejected", { format: req.query.format })` и `res.status(400).json({ detail: "Unsupported export format" })`; прочие ошибки пробрасывать (`throw err`), как в `POST /books/:id/read`
- [ ] T019 [US3] Запустить `npx vitest run tests/export.test.ts` — все тесты зелёные

**Checkpoint**: все три истории работают

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T020 Прогнать `npm run check` (tsc + eslint + vitest) и привести реальный вывод в отчёте; сверить с исходным результатом из T001
- [ ] T021 Пройти ручные шаги из `specs/001-export-library/quickstart.md` на `npm run dev` (только localhost) и убедиться, что ответы совпадают с `contracts/export-api.md`
- [ ] T022 Проверить `git status`: изменены только `src/storage.ts`, `src/app.ts`, `tests/export.test.ts` и файлы в `specs/001-export-library/`; `package.json`, `eslint.config.js`, `tsconfig.json` не тронуты

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: без зависимостей
- **Foundational (Phase 2)**: после Setup, блокирует все истории
- **US1 (Phase 3)**: после Foundational; создаёт ручку
- **US2 (Phase 4)**: после US1 (расширяет ручку и `exportBooks`)
- **US3 (Phase 5)**: после US1 (добавляет обработку ошибки в ручку); от US2 не зависит
- **Polish (Phase 6)**: после всех историй

### Within Each User Story

- Тесты пишутся и ПАДАЮТ до реализации (T005, T011, T017 — обязательные контрольные точки)
- `storage.ts` до `app.ts`
- История завершена, когда её тесты зелёные

### Parallel Opportunities

Почти все задачи правят три общих файла (`src/storage.ts`, `src/app.ts`, `tests/export.test.ts`), поэтому
параллельные [P]-задачи отсутствуют намеренно. После US1 истории US2 и US3 по смыслу независимы,
но их тесты лежат в одном файле, так что выполнять их последовательно проще и безопаснее.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001 → T002
2. T003–T008 (JSON-экспорт)
3. STOP и проверить: `npx vitest run tests/export.test.ts`, затем `npm run check`

### Incremental Delivery

1. MVP (US1) → CSV (US2) → ошибки (US3) → Polish
2. После каждой истории тесты файла зелёные; предыдущие истории не ломаются

---

## Notes

- Тест-первым: перед реализацией каждой истории красный прогон (T005, T011, T017)
- Новых зависимостей нет; CSV пишется вручную
- Коммиты и push — только по прямой просьбе
