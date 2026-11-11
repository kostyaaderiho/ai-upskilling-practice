# Implementation Plan: Напоминания о возврате книг

**Branch**: `002-return-reminders` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-return-reminders/spec.md`

## Summary

Книга получает необязательное поле `dueDate` (календарная дата `YYYY-MM-DD`): есть дата — книга
взята. Три ручки: `PUT /books/:id/due` задаёт или заменяет срок, `POST /books/:id/return` снимает
его, `GET /books/reminders` отдаёт взятые книги, у которых срок прошёл или наступает в пределах
3 дней, от самого раннего срока к позднему. Логика — в `src/storage.ts`: разбор даты
`parseDueDate`, операции `setDueDate` / `returnBook`, расчёт `getReminders(today)`, где «сегодня»
передаётся параметром, чтобы тесты не зависели от часов. Ручки в `src/app.ts` переводят доменные
ошибки в `400` / `404` с `{ detail }`. Тесты пишутся первыми, зависимостей нет.

## Technical Context

**Language/Version**: TypeScript 5.7, strict, ESM; Node.js (типы `@types/node` 22)

**Primary Dependencies**: Express 5 (единственная рантайм-зависимость); новых нет

**Storage**: in-memory `Map` в `src/storage.ts`; срок возврата — поле записи `Book`

**Testing**: Vitest + supertest, тесты в `tests/*.test.ts`

**Target Platform**: локальный Node.js-процесс, только localhost

**Project Type**: web-service (небольшое Express API)

**Performance Goals**: не заданы; напоминания считаются одним проходом по книгам

**Constraints**: без внешних сервисов и сети (никаких писем и push); без новых зависимостей;
ошибки только `{ detail }`; существующие ручки и их тела не меняются

**Scale/Scope**: сотни книг в памяти процесса, без пагинации напоминаний

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Оценка | Как соблюдается |
|---------|--------|-----------------|
| I. Только localhost | Pass | Напоминания — это ответ на запрос; исходящих вызовов, планировщиков и рассылок нет. Дата «сегодня» берётся из системных часов процесса. |
| II. Тесты сначала | Pass | Задачи упорядочены: падающие тесты в `tests/reminders.test.ts`, затем код. |
| III. Зависимости с обоснованием | Pass | Даты разбираются и сравниваются вручную, `package.json` не меняется. |
| IV. Единые контракты | Pass | Ошибки — `400` / `404` с `{ detail }`; доменные ошибки — классы в `storage.ts`; логирование только через `getLogger()`. Существующие ручки не меняются: поле `dueDate` у книги без срока отсутствует, тела ответов прежние. |
| V. Строгая типизация | Pass | Явные возвращаемые типы, типы `Reminder` и `ReminderStatus`, вход — `unknown`, без `any`. |

Re-check после Phase 1: нарушений нет, раздел Complexity Tracking не требуется.

## Project Structure

### Documentation (this feature)

```text
specs/002-return-reminders/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── reminders-api.md
└── tasks.md             # создаётся /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app.ts               # ручки PUT /books/:id/due, POST /books/:id/return, GET /books/reminders
└── storage.ts           # Book.dueDate, InvalidDueDateError, parseDueDate, setDueDate,
                         # returnBook, Reminder, getReminders

tests/
└── reminders.test.ts    # новый файл: срок, возврат, ошибки, границы окна, порядок
```

**Structure Decision**: раскладка «`src/` + `tests/`» сохраняется, новые модули не заводятся:
логика живёт в `storage.ts` рядом с остальными операциями над книгами, ручки — в `app.ts`.
`GET /books/reminders` регистрируется до `GET /books/:id`, иначе путь перехватит параметр.
Тесты в отдельном файле `tests/reminders.test.ts`: хранилище живёт между тестами одного файла, а
сценариям «пусто» и «порядок» нужно чистое состояние (`books.clear()` в `beforeEach`).

## Complexity Tracking

Нарушений конституции нет, раздел не заполняется.
