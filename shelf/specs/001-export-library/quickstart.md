# Quickstart: проверка экспорта библиотеки

## Предусловия

- `npm install` выполнен; доступ в сеть не нужен.

## Автоматическая проверка

```bash
npx vitest run tests/export.test.ts
npm run check
```

Ожидание: тесты на пустую библиотеку, JSON, CSV (с экранированием) и неверный формат проходят;
`tsc`, `eslint` и `vitest` завершаются без ошибок.

## Ручная проверка

```bash
npm run dev    # http://localhost:3000
curl -s -X POST localhost:3000/books -H 'content-type: application/json' \
  -d '{"title":"Война, и мир","author":"Лев Толстой"}'
curl -s 'localhost:3000/books/export?format=json'
curl -s 'localhost:3000/books/export?format=csv'
curl -si 'localhost:3000/books/export?format=xml'
```

Ожидание: JSON-массив с книгой; CSV с заголовком и названием в кавычках; для `xml`
статус 400 и `{"detail":"Unsupported export format"}`. Детали — в
[contracts/export-api.md](contracts/export-api.md).
