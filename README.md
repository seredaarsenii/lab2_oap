# Lab 4: TypeScript Frontend + REST API

Застосунок для керування звітами про вразливості:

- backend: Node.js, Express, TypeScript, SQLite;
- frontend: Vite, TypeScript, HTML, CSS;
- API: `/api/v1`;
- узгоджені JSON-помилки та клієнтська/серверна валідація.

## Запуск

```powershell
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

Після запуску:

- frontend: `http://localhost:5173`;
- backend: `http://localhost:3000`;
- health check: `http://localhost:3000/health`.

Команда `npm.cmd run dev` запускає обидві частини одночасно. Окремий запуск:

```powershell
npm.cmd run dev:backend
npm.cmd run dev:frontend
```

Перевірка TypeScript і production build:

```powershell
npm.cmd run check
npm.cmd run build
```

## CORS

Backend дозволяє запити лише з frontend origin:

```text
http://localhost:5173
```

Дозволені методи:

```text
GET, POST, PUT, PATCH, DELETE, OPTIONS
```

Дозволений заголовок:

```text
Content-Type
```

## Версія API

Основний префікс:

```text
http://localhost:3000/api/v1
```

Старі маршрути `/api/...` залишені як тимчасові alias, але frontend використовує лише `/api/v1/...`.

## Основна сутність: reports

Frontend використовує п'ять операцій одного `reportApi`:

```text
getList()
getById(id)
create(dto)
update(id, dto)
remove(id)
```

HTTP endpoints:

```text
GET    /api/v1/reports
GET    /api/v1/reports/:id
POST   /api/v1/reports
PUT    /api/v1/reports/:id
DELETE /api/v1/reports/:id
```

Також доступні CRUD endpoints:

```text
/api/v1/users
/api/v1/categories
```

## Приклади запитів

### GET списку

```powershell
curl.exe http://localhost:3000/api/v1/reports
```

### GET деталей

```powershell
curl.exe http://localhost:3000/api/v1/reports/1
```

### POST

```powershell
curl.exe -X POST http://localhost:3000/api/v1/reports `
  -H "Content-Type: application/json" `
  -d '{\"userId\":1,\"categoryId\":1,\"title\":\"CSRF vulnerability\",\"severity\":\"High\",\"description\":\"State-changing request has no CSRF protection\",\"reporter\":\"Student\"}'
```

Успішний POST повертає `201 Created`.

### PUT

```powershell
curl.exe -X PUT http://localhost:3000/api/v1/reports/1 `
  -H "Content-Type: application/json" `
  -d '{\"status\":\"In Progress\",\"title\":\"SQL Injection updated\"}'
```

### DELETE

```powershell
curl.exe -X DELETE http://localhost:3000/api/v1/reports/1
```

Успішний DELETE повертає `204 No Content`.

## Формат помилок

Усі backend-помилки проходять через централізований middleware:

```json
{
  "code": 400,
  "message": "Title must be at least 3 characters long",
  "details": {
    "field": "title"
  },
  "path": "/api/v1/reports",
  "timestamp": "2026-06-06T12:00:00.000Z"
}
```

Frontend перевіряє `response.ok`, читає `{ code, message, details }` та показує:

- загальне повідомлення про помилку;
- польову помилку, якщо backend повернув `details.field`;
- окреме повідомлення для `404`;
- зрозуміле повідомлення для `500`;
- повідомлення про недоступний backend;
- повідомлення про timeout.

## Валідація

Frontend перевіряє:

- обов'язкового автора;
- назву від 3 символів;
- допустиму критичність;
- репортера від 2 символів;
- опис від 5 символів.

Backend повторно перевіряє DTO та не довіряє клієнтській валідації.

Форма не очищається після помилки. Під час запиту поля та кнопка блокуються.

## UI-стани

Для списку реалізовані:

- `loading` - текст і spinner;
- `success` - таблиця даних;
- `empty` - повідомлення, якщо список або пошук порожній;
- `error` - причина помилки та кнопка повторного запиту.

Доступні створення, перегляд деталей, редагування й видалення з підтвердженням.

## Негативні сценарії

### 400: помилка валідації

```powershell
curl.exe -X POST http://localhost:3000/api/v1/reports `
  -H "Content-Type: application/json" `
  -d '{\"userId\":1,\"title\":\"x\",\"severity\":\"High\",\"description\":\"valid description\",\"reporter\":\"Student\"}'
```

Очікування: `400`, JSON-помилка, `details.field = "title"`. У UI аналогічна помилка показується біля поля.

### 404: запис не знайдено

```powershell
curl.exe http://localhost:3000/api/v1/reports/999999
```

Очікування: `404` та повідомлення `Report not found`.

### Backend недоступний

1. Відкрити frontend.
2. Зупинити backend.
3. Натиснути `Оновити список`.

Очікування: UI не зависає і показує, що backend на порту `3000` недоступний.

### Timeout

У `frontend/src/apiClient.ts` для всіх запитів встановлено timeout `10 000 ms` через `AbortController`. Якщо сервер не відповідає вчасно, UI показує інструкцію повторити запит.

### 500

Будь-яка неочікувана серверна помилка централізовано перетворюється на:

```json
{
  "code": 500,
  "message": "Internal Server Error",
  "details": null
}
```

Frontend не показує технічні деталі й виводить повідомлення: `Помилка сервера. Спробуйте повторити запит пізніше.`

## Структура

```text
frontend/
  index.html
  src/
    apiClient.ts
    main.ts
    style.css
    types.ts
src/
  controllers/
  db/
  dtos/
  middlewares/
  repositories/
  routes/
  services/
```

DTO та відповіді frontend типізовані в `frontend/src/types.ts`. Усі `fetch`-запити, JSON parsing, `response.ok`, timeout і перетворення помилок зібрані в `frontend/src/apiClient.ts`.

## SQLite

Файл бази створюється автоматично:

```text
data/lab3.db
```

Міграції зберігаються у `src/db/migrations` і виконуються транзакційно. Seed створює користувачів, категорії та звіти для демонстрації UI.
