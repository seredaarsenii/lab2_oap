# Lab 4: SQL Injection, IDOR, XSS та Security Misconfiguration

TypeScript-застосунок з Express, SQLite і Vite frontend. У роботі реалізовано 4 security-сценарії з відтворенням проблеми, виправленням і повторною перевіркою.

## Встановлення і запуск

```powershell
npm.cmd install
npm.cmd run seed
npm.cmd run dev
```

- frontend: `http://localhost:5173`
- backend: `http://localhost:3000`
- health check: `http://localhost:3000/health`

Додатково нічого встановлювати не потрібно. Автентифікація, хешування паролів і підпис токенів реалізовані стандартним модулем Node.js `crypto`.

Демо-користувачі після `npm.cmd run seed`:

| Email | Пароль | Власні report ID |
|---|---|---|
| `ivan@example.com` | `Student123!` | 1, 2 |
| `olena@example.com` | `Student123!` | 3, 4 |
| `maksym@example.com` | `Student123!` | 5, 6 |

Для production потрібно обов'язково задати довгий секрет:

```powershell
$env:AUTH_TOKEN_SECRET="replace-with-a-long-random-secret"
npm.cmd run dev
```

## Автоматична перевірка

```powershell
npm.cmd run check
npm.cmd run security:regression
npm.cmd run build
```

`security:regression` повторює SQLi/IDOR/XSS/security-header сценарії та завершується текстом `Security regression passed`.

## Автентифікація

Login:

```powershell
curl.exe -X POST http://localhost:3000/api/v1/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"ivan@example.com\",\"password\":\"Student123!\"}'
```

З відповіді треба взяти `token` і передавати:

```text
Authorization: Bearer <token>
```

Без заголовка або з невалідним токеном захищені endpoints повертають `401`. Контекст `currentUser` визначається тільки після серверної перевірки підпису токена.

## A. SQL Injection

### Було

Контрольований навчальний endpoint будує SQL конкатенацією:

```text
GET /api/v1/reports/demo/unsafe-search?title=' OR 1=1 --
```

Він вимкнений за замовчуванням. Для локального PoC:

```powershell
$env:ENABLE_UNSAFE_SQL_DEMO="true"
npm.cmd run dev:backend
```

Payload `%27%20OR%201%3D1%20--` змінює умову та повертає зайві рядки.

### Стало

Основний CRUD і safe demo використовують параметри `?`:

```text
GET /api/v1/reports/demo/safe-search?title=%27%20OR%201%3D1%20--
```

Той самий payload трактується як звичайний текст і не повертає чужі рядки. Динамічні поля сортування вибираються тільки з allowlist.

## Б. IDOR / Broken Access Control

### Було

ID з URL використовувався без перевірки власника, тому користувач міг спробувати прочитати або змінити чужий report.

### Стало

У `reports.user_id` зберігається власник. Backend додає `user_id = currentUser.id` до list/read/update/delete/JOIN/stats запитів.

- немає токена: `401`
- report не існує: `404`
- report існує, але належить іншому користувачу: `403`
- `userId` у body не дає змінити власника

Приклад: token Івана + `GET /api/v1/reports/3` повертає `403`.

## В. XSS

Payload для перевірки:

```html
<script>alert(1)</script>
```

Дані дозволено зберігати як текст, але frontend відображає поля користувача через `textContent`, `createTextNode`-еквівалентні DOM API та `Option`. Небезпечний `innerHTML` не використовується, тому скрипт не виконується. Забороняти всі кутові дужки не потрібно: проблема вирішена в місці відображення.

## Г. Security Misconfiguration

Backend:

- вимикає `X-Powered-By`;
- обмежує CORS origin до `http://localhost:5173`;
- дозволяє лише потрібні methods і headers;
- обмежує JSON body до `32kb`;
- не повертає stack trace або SQL-текст у `500`;
- додає `Content-Security-Policy`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Cross-Origin-Resource-Policy`.

Коди та формат помилок централізовані:

```json
{
  "code": 403,
  "message": "You do not have access to this report",
  "details": { "id": "3" },
  "path": "/3",
  "timestamp": "2026-06-07T12:00:00.000Z"
}
```

## Security regression HTTP

Готові ручні сценарії збережені у `security-regression.http`. Вони показують login, 401, IDOR 403, safe SQLi, optional unsafe SQLi, XSS payload і перевірку headers.

## Структура захисту

- `src/middlewares/auth.middleware.ts` - єдина перевірка Bearer token.
- `src/middlewares/security.middleware.ts` - security headers.
- `src/services/auth.service.ts` - password hash і підпис/перевірка token.
- `src/services/report.service.ts` - централізовані правила доступу.
- `src/repositories/report.repository.ts` - параметризовані SQL та owner filters.
- `src/middlewares/error.middleware.ts` - єдиний JSON-формат помилок.
- `src/security-regression.ts` - автоматичні сценарії «було/стало».

## Важливе обмеження

Unsafe SQL endpoint існує лише як локальний навчальний PoC і вимкнений без `ENABLE_UNSAFE_SQL_DEMO=true`. Не вмикайте його у відкритому або production-середовищі.
