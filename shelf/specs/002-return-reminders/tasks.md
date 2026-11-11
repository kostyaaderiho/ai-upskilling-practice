---

description: "Task list for return reminders (PUT /books/:id/due, POST /books/:id/return, GET /books/reminders)"
---

# Tasks: Напоминания о возврате книг

**Input**: Design documents from `/specs/002-return-reminders/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/reminders-api.md

**Tests**: ОБЯЗАТЕЛЬНЫ (конституция, принцип II): сначала падающий тест, затем код.

**Organization**: Задачи сгруппированы по историям пользователя из spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: можно выполнять параллельно (разные файлы, нет зависимостей)
- **[Story]**: к какой истории относится задача (US1, US2)

## Path Conventions

Единый проект: `src/` и `tests/` в корне репозитория. Все тесты фичи — в одном файле
`tests/reminders.test.ts`; хранилище живёт между тестами файла, поэтому в `beforeEach` вызывается
`books.clear()` (импорт `books` из `../src/storage`), а id берётся из ответа на создание книги,
не хардкодится. Все задачи правят общие файлы (`src/storage.ts`, `src/app.ts`,
`tests/reminders.test.ts`), поэтому параллельных задач нет: выполнять строго по порядку.

## Phase 1: Setup

**Purpose**: зафиксировать исходное состояние

- [ ] T001 Прогнать `npm run check` и записать реальный исходный результат (tsc, eslint, vitest) до любых правок; если `tsc` падает на `src/validation-draft.ts` (импорт несуществующего `validateBody` из `express`), назвать это в отчёте и не трогать файл без отдельной просьбы; шум `console.log` из `src/storage.ts` — известный долг B-6

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: общие объявления, нужные всем историям

- [ ] T002 В `src/storage.ts` добавить в `interface Book` необязательное поле `dueDate?: string` (формат `YYYY-MM-DD`; поле либо отсутствует, либо содержит существующую календарную дату; не `null`), объявить `export type ReminderStatus = "overdue" | "due-soon"`, `export interface Reminder { id: number; title: string; dueDate: string; status: ReminderStatus }`, `export const REMINDER_WINDOW_DAYS = 3` и `export class InvalidDueDateError extends Error {}` (по образцу `BookNotFoundError`), без логики

**Checkpoint**: типы, константа и доменная ошибка есть, можно писать тесты историй

---

## Phase 3: User Story 1 - Срок возврата у взятой книги (Priority: P1) 🎯 MVP

**Goal**: `PUT /books/:id/due` задаёт или заменяет срок, `POST /books/:id/return` снимает его; ошибки — `{ detail }`.

**Independent Test**: создать книгу, задать срок, получить книгу через `GET /books/:id` и увидеть `dueDate`; заменить срок; вернуть книгу и увидеть, что поля `dueDate` нет; неверная дата даёт 400, несуществующая книга — 404.

### Tests for User Story 1 (write FIRST, must FAIL)

- [ ] T003 [US1] Создать `tests/reminders.test.ts` с импортами `request` из `supertest`, `beforeEach/describe/expect/it` из `vitest`, `app` из `../src/app`, `books` из `../src/storage`, `beforeEach(() => books.clear())` и тестом: создать книгу через `POST /books`, `PUT /books/:id/due` с телом `{ "dueDate": "2026-11-20" }` → 200, тело содержит `dueDate: "2026-11-20"` и остальные поля книги; затем `GET /books/:id` возвращает тот же `dueDate`
- [ ] T004 [US1] В `tests/reminders.test.ts` добавить тест замены: после первого `PUT` повторный `PUT /books/:id/due` с `"2026-12-01"` → 200, `GET /books/:id` показывает `dueDate: "2026-12-01"`; и тест прошедшей даты: `"2020-01-01"` принимается (200)
- [ ] T005 [US1] В `tests/reminders.test.ts` добавить тесты возврата: `POST /books/:id/return` после установки срока → 200, в теле нет ключа `dueDate` (`expect("dueDate" in body).toBe(false)`), `GET /books/:id` тоже без `dueDate`; повторный `POST /books/:id/return` и возврат книги, у которой срока не было, → 200 без ошибки
- [ ] T006 [US1] В `tests/reminders.test.ts` добавить тесты ошибок: `PUT /books/:id/due` с `dueDate` — отсутствует, число `20261120`, строка `"2026-2-1"`, `"20261120"`, `"2026-02-31"`, `"2026-13-01"` → 400 и тело `{ detail: <непустая строка> }`, а срок книги не изменился (книга с ранее заданным сроком сохраняет его); `PUT` и `POST /books/:id/return` для несуществующего id (например `999999`) → 404 и тело `{ detail: "Book not found" }`
- [ ] T007 [US1] В `tests/reminders.test.ts` добавить тест совместимости (FR-012): у книги без срока в ответах `POST /books` и `GET /books` нет ключа `dueDate`, а `POST /books/:id/read` по-прежнему возвращает книгу без этого ключа
- [ ] T008 [US1] Запустить `npx vitest run tests/reminders.test.ts` и убедиться, что T003–T006 ПАДАЮТ (ручек ещё нет, ожидается 404 вместо 200/400); сохранить вывод как доказательство. T007 может пройти сразу — это охранный тест, зафиксировать это в отчёте

### Implementation for User Story 1

- [ ] T009 [US1] В `src/storage.ts` реализовать `export function parseDueDate(value: unknown): string`: принимает только строку, точно подходящую под `^\d{4}-\d{2}-\d{2}$`, и существующую календарную дату (разобрать год, месяц, день, собрать `new Date(Date.UTC(y, m - 1, d))` и сверить, что `getUTCFullYear/Month/Date` совпали с разобранными — иначе `2026-02-31` молча сдвинется на март); любое иное значение бросает `InvalidDueDateError`; прошлая дата допустима; явный возвращаемый тип, без `any`
- [ ] T010 [US1] В `src/storage.ts` реализовать `export function setDueDate(id: number, dueDate: string): Book` (через `getBook(id)`, бросает `BookNotFoundError`; записывает `book.dueDate = dueDate`; `log.info("due date set", { id, dueDate })` через `log` из `getLogger`, без `console.*`) и `export function returnBook(id: number): Book` (через `getBook(id)`; `delete book.dueDate`, а не присваивание `undefined`/`null`; `log.info("book returned", { id })`)
- [ ] T011 [US1] В `src/app.ts` добавить `app.put("/books/:id/due", …)`: сначала `parseDueDate(req.body?.dueDate)` — при `InvalidDueDateError` ответ `400 { detail: "Due date must be a valid date in YYYY-MM-DD format" }` и `log.warn("invalid due date", { id })`, затем `storage.setDueDate(id, dueDate)`; и `app.post("/books/:id/return", …)` по образцу существующей `POST /books/:id/read`; `BookNotFoundError` → `404 { detail: "Book not found" }` с `log.warn("book not found", { id })`, остальные ошибки пробросить `throw err`; тело запроса типизировать через `interface` с полем `dueDate: unknown`, без `any`
- [ ] T012 [US1] Запустить `npx vitest run tests/reminders.test.ts` — тесты US1 должны быть зелёными; затем `npx eslint src/app.ts src/storage.ts tests/reminders.test.ts` и `npx tsc --noEmit` (если `tsc` красный только из-за `src/validation-draft.ts`, это известная вне-задачная проблема из T001)

**Checkpoint**: срок можно задать, заменить и снять независимо от напоминаний; US1 — рабочий MVP

---

## Phase 4: User Story 2 - Список книг, которые пора вернуть (Priority: P2)

**Goal**: `GET /books/reminders` отдаёт взятые книги с просроченным или приближающимся сроком (окно 3 дня), от раннего срока к позднему.

**Independent Test**: создать книги со сроками вчера, сегодня, через 3 дня, через 4 дня и без срока; запросить напоминания и сверить состав, статусы и порядок.

### Tests for User Story 2 (write FIRST, must FAIL)

- [ ] T013 [US2] В `tests/reminders.test.ts` добавить тест пустого результата: `getReminders("2026-11-11")` (импорт из `../src/storage`) на пустом хранилище → `[]`, а `GET /books/reminders` → 200 и тело `[]` (не 404 «Book not found» от `GET /books/:id`)
- [ ] T014 [US2] В `tests/reminders.test.ts` добавить тест границ окна с фиксированным «сегодня» `"2026-11-11"` (книги создаются через `addBook`, срок — через `setDueDate`): срок `2026-11-10` → `status: "overdue"`; `2026-11-11` (сегодня) → `"due-soon"`, не `"overdue"`; `2026-11-14` (через 3 дня) → `"due-soon"`; `2026-11-15` (через 4 дня) и книга без срока → в список не входят; книга после `returnBook` → не входит; прочитанная книга (`markRead`) с просроченным сроком → остаётся в списке
- [ ] T015 [US2] В `tests/reminders.test.ts` добавить тест порядка и формы: несколько книг со сроками в разном порядке добавления → результат отсортирован по `dueDate` по возрастанию, при равных датах — по `id`; каждый элемент имеет ровно ключи `id`, `title`, `dueDate`, `status` (`Object.keys(...).sort()`), без `author` и `read`
- [ ] T016 [US2] В `tests/reminders.test.ts` добавить HTTP-тест с датами от реальных часов: небольшая функция-помощник в самом тесте строит локальную дату `YYYY-MM-DD` со сдвигом в днях из `getFullYear/getMonth/getDate` (не из `toISOString()`, он даёт UTC); создать книги со сроком вчера, сегодня и через 10 дней, `GET /books/reminders` → 200, в теле ровно первые две книги, первая `overdue`, вторая `due-soon`
- [ ] T017 [US2] Запустить `npx vitest run tests/reminders.test.ts` и убедиться, что T013–T016 ПАДАЮТ (`getReminders` и ручки ещё нет); сохранить вывод как доказательство

### Implementation for User Story 2

- [ ] T018 [US2] В `src/storage.ts` реализовать `export function getReminders(today: string = localDateString()): Reminder[]`: для каждой книги с `dueDate` посчитать `left` — число календарных дней от `today` до срока через `Date.UTC` по компонентам дат (не вычитанием локальных `Date`, чтобы переход на летнее время не давал сдвиг в сутки); `left < 0` → `"overdue"`, `0 <= left <= REMINDER_WINDOW_DAYS` → `"due-soon"`, иначе и при отсутствии срока книгу пропустить; результат `{ id, title, dueDate, status }`, сортировка по `dueDate` по возрастанию, затем по `id`; локальные помощники `localDateString(): string` (из `getFullYear/getMonth/getDate`, с ведущими нулями) и `daysBetween(from: string, to: string): number`; явные возвращаемые типы, без `any`; `log.info("reminders listed", { count })`
- [ ] T019 [US2] В `src/app.ts` добавить `app.get("/books/reminders", …)` сразу после `GET /books/recent` и ДО `GET /books/:id` (иначе путь перехватит параметр): `res.json(storage.getReminders())`
- [ ] T020 [US2] Запустить `npx vitest run tests/reminders.test.ts` — все тесты US2 и US1 зелёные; затем `npx eslint src/app.ts src/storage.ts tests/reminders.test.ts`

**Checkpoint**: обе истории работают; напоминания видят сроки, заданные в US1

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: проверка целиком и отчёт

- [ ] T021 Пройти ручную проверку из `specs/002-return-reminders/quickstart.md` (запустить `npm run dev`, выполнить команды `curl`, сверить ожидания по шагам) и записать реальные ответы
- [ ] T022 Прогнать `npm run check` и привести в отчёт настоящий вывод (tsc, eslint, vitest); сравнить с исходным результатом из T001
- [ ] T023 Проверить `git status`: изменены только `src/app.ts`, `src/storage.ts`, `tests/reminders.test.ts` и файлы `specs/002-return-reminders/`; `package.json`, `eslint.config.js`, `tsconfig.json` не тронуты; замеченное рядом, но вне задачи, назвать одной строкой в отчёте; не коммитить и не пушить без просьбы

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: без зависимостей
- **Foundational (Phase 2)**: после Setup, блокирует обе истории (общие типы и ошибка)
- **User Story 1 (Phase 3)**: после Phase 2, не зависит от US2
- **User Story 2 (Phase 4)**: после Phase 2; тесты используют `setDueDate` и `returnBook` из US1 для подготовки данных, поэтому практически выполняется после US1
- **Polish (Phase 5)**: после обеих историй

### Within Each User Story

- Тесты пишутся и падают до реализации (T008, T017)
- `parseDueDate` → `setDueDate` / `returnBook` → ручки в `app.ts`
- `getReminders` → ручка `GET /books/reminders`

### Parallel Opportunities

Параллельных задач нет: все задачи правят три общих файла. Истории разделены контрольными точками, а не параллельной работой.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001)
2. Phase 2: Foundational (T002)
3. Phase 3: User Story 1 (T003–T012)
4. **STOP and VALIDATE**: срок задаётся, заменяется и снимается, ошибки в формате `{ detail }`

### Incremental Delivery

1. Setup + Foundational → типы готовы
2. User Story 1 → срок возврата хранится (MVP)
3. User Story 2 → напоминания по срокам
4. Polish → `npm run check` и ручная проверка

---

## Notes

- Окно «скоро» = срок сегодня или в ближайшие `REMINDER_WINDOW_DAYS` (3) дня; решение и альтернатива — в `research.md`, раздел 3
- Ошибка формата даты — `400`, как решено в `001`; существующий `422` у названия в `POST /books` не менять
- На красной фазе (T008, T017) тесты импортируют имена, которых ещё нет: `tsc` в это время красный, красной фазой считается прогон `vitest`
