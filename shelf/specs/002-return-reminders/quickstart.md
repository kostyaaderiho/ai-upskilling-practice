# Quickstart: проверка напоминаний о возврате

## Предусловия

- `npm install` выполнен; доступ в сеть не нужен.

## Автоматическая проверка

```bash
npx vitest run tests/reminders.test.ts
npm run check
```

Ожидание: тесты на установку, замену и снятие срока, некорректную дату, `404`, границы окна
(срок вчера, сегодня, через 3 и через 4 дня), порядок и пустой список проходят; `tsc`, `eslint`
и `vitest` завершаются без ошибок.

## Ручная проверка

```bash
npm run dev    # http://localhost:3000
curl -s -X POST localhost:3000/books -H 'content-type: application/json' \
  -d '{"title":"Дюна","author":"Фрэнк Герберт"}'
curl -s -X PUT localhost:3000/books/1/due -H 'content-type: application/json' \
  -d "{\"dueDate\":\"$(date +%F)\"}"
curl -s localhost:3000/books/reminders
curl -si -X PUT localhost:3000/books/1/due -H 'content-type: application/json' \
  -d '{"dueDate":"2026-02-31"}'
curl -s -X POST localhost:3000/books/1/return
curl -s localhost:3000/books/reminders
```

Ожидание по шагам: срок сохраняется и книга видна в напоминаниях со статусом `due-soon`;
несуществующая дата даёт `400 { detail }`; после возврата поле `dueDate` исчезает, а список
напоминаний — `[]`. Контракты — [reminders-api.md](contracts/reminders-api.md), модель —
[data-model.md](data-model.md).
