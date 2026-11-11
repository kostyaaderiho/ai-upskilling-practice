# Implementation Plan: Экспорт библиотеки

**Branch**: `001-export-library` | **Date**: 2026-11-11 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-export-library/spec.md`

## Summary

Добавить `GET /books/export?format=json|csv`, которая отдаёт все книги библиотеки в выбранном
формате. Подход: чистая функция `exportBooks` в `src/storage.ts` формирует строку (JSON через
`JSON.stringify`, CSV — собственный код по RFC 4180, без зависимостей); ручка в `src/app.ts`
проверяет формат, задаёт `Content-Type` и переводит доменную ошибку неподдерживаемого формата
в `400 { detail }`. Порядок работ следует декомпозиции из `docs/B-4.md`, тесты пишутся первыми.

## Technical Context

**Language/Version**: TypeScript 5.7, strict, ESM; Node.js (типы `@types/node` 22)

**Primary Dependencies**: Express 5 (единственная рантайм-зависимость); новых нет

**Storage**: in-memory `Map` в `src/storage.ts`

**Testing**: Vitest + supertest, тесты в `tests/*.test.ts`

**Target Platform**: локальный Node.js-процесс, только localhost

**Project Type**: web-service (небольшое Express API)

**Performance Goals**: не заданы; библиотека мала, экспорт строится за один проход

**Constraints**: без внешних сервисов и сети; без новых зависимостей; ошибки только `{ detail }`

**Scale/Scope**: сотни книг в памяти процесса, без пагинации экспорта

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Принцип | Оценка | Как соблюдается |
|---------|--------|-----------------|
| I. Только localhost | Pass | Нет сетевых вызовов; данные берутся из in-memory `Map`. |
| II. Тесты сначала | Pass | Задачи упорядочены: падающие тесты в `tests/export.test.ts`, затем код. |
| III. Зависимости с обоснованием | Pass | CSV пишется вручную, `package.json` не меняется. |
| IV. Единые контракты | Pass | Ошибка формата — `400 { detail }`; доменная ошибка-класс в `storage.ts`; логирование только через `getLogger()`. Существующие ручки не меняются. |
| V. Строгая типизация | Pass | Явные возвращаемые типы, тип `ExportFormat`, без `any`. |

Re-check после Phase 1: нарушений нет, раздел Complexity Tracking не требуется.

## Project Structure

### Documentation (this feature)

```text
specs/001-export-library/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── export-api.md
└── tasks.md             # создаётся /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── app.ts               # новая ручка GET /books/export
└── storage.ts           # ExportFormat, UnsupportedFormatError, parseExportFormat, exportBooks

tests/
└── export.test.ts       # новый файл: пустая библиотека, JSON, CSV, неверный формат
```

**Structure Decision**: существующая раскладка «`src/` + `tests/`» сохраняется. Новые модули
не заводятся: логика экспорта живёт в `storage.ts`, как и остальные операции над книгами,
ручка — в `app.ts`. Тесты в отдельном файле `tests/export.test.ts`, потому что хранилище
живёт между тестами одного файла, а сценарию «пустая библиотека» нужно чистое состояние.

## Complexity Tracking

Нарушений конституции нет, раздел не заполняется.
