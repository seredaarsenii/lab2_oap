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

The schema is stored in one place:

```text
src/db/schema.sql
```

Tables are created with `CREATE TABLE IF NOT EXISTS`.

## Migrations

Applied schema changes are tracked in:

```text
schema_migrations
```

On startup the app checks this table before applying migration steps. This gives a simple migration mechanism: already-applied changes are not applied again.

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

### Delete

```bash
curl -X DELETE http://localhost:3000/api/reports/1
curl -X DELETE http://localhost:3000/api/categories/1
curl -X DELETE http://localhost:3000/api/users/1
```

## HTTP status codes

- `201 Created` for successful POST requests.
- `400 Bad Request` for invalid request body, for example missing required fields.
- `404 Not Found` when a requested user, category, or report does not exist.
