# Vulnerability Reports API

Backend: Node.js + Express + TypeScript + SQLite.

## Start

```bash
npm install
npm run dev
```

Server starts at:

```text
http://localhost:3000
```

## SQLite database

The database file is created automatically on application start:

```text
data/lab3.db
```

The reference schema is stored in:

```text
src/db/schema.sql
```

Tables are created with `CREATE TABLE IF NOT EXISTS`.

## Database schema

### `users`

- `id` - primary key.
- `username` - required (`NOT NULL`).
- `email` - required and unique (`NOT NULL`, `UNIQUE`).
- `created_at` - creation timestamp.

### `categories`

- `id` - primary key.
- `name` - required and unique (`NOT NULL`, `UNIQUE`).
- `description` - required (`NOT NULL`).
- `created_at` - creation timestamp.

### `reports`

- `id` - primary key.
- `user_id` - required foreign key to `users.id`.
- `category_id` - optional foreign key to `categories.id`.
- `title`, `description`, `reporter` - required (`NOT NULL`).
- `severity` - restricted by `CHECK` to `Low`, `Medium`, or `High`.
- `status` - restricted by `CHECK` to `Open`, `Closed`, or `In Progress`.
- `created_at` - creation timestamp.

Relationships:

- `users 1 -> many reports`.
- `categories 1 -> many reports`.
- Deleting a user uses `ON DELETE CASCADE`.
- Deleting a category uses `ON DELETE SET NULL`.

## Migrations

Applied schema changes are tracked in:

```text
schema_migrations
```

Numbered SQL migrations are stored in:

```text
src/db/migrations/
  001_init.sql
  002_add_indexes.sql
```

On startup the application:

1. Reads migration files in filename order.
2. Checks `schema_migrations`.
3. Applies only files that have not been recorded yet.
4. Runs every migration inside a transaction.
5. Records the filename after a successful commit.

## Indexes

The schema creates this index:

```sql
CREATE INDEX IF NOT EXISTS idx_reports_status_created_at
ON reports(status, created_at);
```

It is used for the common reports query that filters by `status` and sorts by `created_at`, for example:

```bash
curl "http://localhost:3000/api/reports?status=Open&sort=created_at&order=DESC&limit=5"
```

Additional indexes on `reports.user_id` and `reports.category_id` speed up foreign-key filtering and JOIN operations.

## Seed data

To fill the database with test data:

```bash
npm run seed
```

The seed script creates 3 users, 3 categories, and 6 reports. It also logs key DB events:

```text
[DB] Schema initialized
[DB] Seed started
[DB] Seed completed: 3 users, 3 categories, 6 reports
```

Seed runs inside a transaction. If any insert fails, all seed changes are rolled back.

## Entities and CRUD

Full CRUD is available for 3 entities:

```text
/api/users
/api/categories
/api/reports
```

Each entity supports:

```text
POST /
GET /
GET /:id
PUT /:id
DELETE /:id
```

List endpoints use one response format:

```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 10
  }
}
```

## Backend structure

- `dtos/` defines create and update request shapes for all three entities.
- `controllers/` handle HTTP input and response formatting.
- `services/` contain validation and business rules.
- `repositories/` contain SQL and data-access operations.
- `db/` contains connection initialization, migrations, schema, and seed startup.

SQL used by the application is isolated in the repository/data-access and database layers rather than being spread across controllers and services.

## Relationships

`reports.user_id` references `users.id` with `ON DELETE CASCADE`.

If a user is deleted, all reports created by this user are deleted too. This is suitable here because a report is treated as dependent on its author.

`reports.category_id` references `categories.id` with `ON DELETE SET NULL`.

If a category is deleted, reports remain in the database, but their category becomes empty. This preserves report history even when a category is removed.

## Error format

All errors are returned from one centralized middleware:

```json
{
  "code": 400,
  "message": "Invalid email format",
  "details": {
    "field": "email"
  },
  "path": "/api/users",
  "timestamp": "2026-06-03T00:00:00.000Z"
}
```

## Examples

### Create user

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"Ivan\",\"email\":\"ivan@example.com\"}"
```

### Update user

```bash
curl -X PUT http://localhost:3000/api/users/1 \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"IvanUpdated\"}"
```

### Create category

```bash
curl -X POST http://localhost:3000/api/categories \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Web\",\"description\":\"Web application vulnerabilities\"}"
```

### Create report

```bash
curl -X POST http://localhost:3000/api/reports \
  -H "Content-Type: application/json" \
  -d "{\"userId\":1,\"categoryId\":1,\"title\":\"SQL Injection\",\"severity\":\"High\",\"description\":\"Login form is vulnerable\",\"reporter\":\"Ivan\"}"
```

### Get by id

```bash
curl http://localhost:3000/api/users/1
curl http://localhost:3000/api/categories/1
curl http://localhost:3000/api/reports/1
```

### Get report with related data

This endpoint returns a report with its related user and category:

```bash
curl http://localhost:3000/api/reports/1/details
```

### JOIN with filtering and sorting

This endpoint joins reports with users and categories, filters the result, sorts it, and applies a limit:

```bash
curl "http://localhost:3000/api/reports/details?status=Open&userId=1&sort=created_at&order=DESC&limit=5"
```

### Aggregated analytics

This endpoint uses `COUNT` and conditional `SUM` expressions:

```bash
curl http://localhost:3000/api/reports/stats
```

Example response:

```json
{
  "data": {
    "total": 6,
    "open": 3,
    "in_progress": 1,
    "closed": 2,
    "high_severity": 2
  }
}
```

### Sorting and filtering

Reports filtered by status and user, sorted by creation date:

```bash
curl "http://localhost:3000/api/reports?status=Open&userId=1&sort=created_at&order=DESC&limit=5"
```

Categories filtered by name and sorted alphabetically:

```bash
curl "http://localhost:3000/api/categories?name=Web&sort=name&order=ASC&limit=5"
```

Users filtered by email and sorted by username:

```bash
curl "http://localhost:3000/api/users?email=example.com&sort=username&order=ASC&limit=5"
```

## SQL injection demonstration

`GET /api/reports/demo/unsafe-search` intentionally constructs one SQL query with string concatenation. It exists only for a classroom demonstration and is disabled by default.

Enable it in PowerShell:

```powershell
$env:ENABLE_UNSAFE_SQL_DEMO='true'
npm run dev
```

Normal input:

```bash
curl "http://localhost:3000/api/reports/demo/unsafe-search?title=SQL%20Injection"
```

Demonstration input:

```text
' OR 1=1 --
```

URL-encoded request:

```bash
curl "http://localhost:3000/api/reports/demo/unsafe-search?title=%27%20OR%201%3D1%20--"
```

The input changes the intended `WHERE title = '...'` condition into a condition that is true for every row, so the endpoint returns records that were not requested. This is dangerous because user input becomes part of SQL syntax. The unsafe endpoint is intentionally left vulnerable for the required demonstration; all normal repository queries use parameter placeholders.

### Delete

```bash
curl -X DELETE http://localhost:3000/api/reports/1
curl -X DELETE http://localhost:3000/api/categories/1
curl -X DELETE http://localhost:3000/api/users/1
```

## HTTP status codes

- `201 Created` for successful POST requests.
- `400 Bad Request` for invalid request body, for example missing required fields.
- `403 Forbidden` when the unsafe SQL demonstration is disabled.
- `404 Not Found` when a requested user, category, or report does not exist.
- `409 Conflict` for unique constraint violations such as duplicate email or category name.
