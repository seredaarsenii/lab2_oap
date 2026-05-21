# Vulnerability Reports API

## Start

```bash
npm install
npm run dev
```

## GET all reports

```bash
curl http://localhost:3000/api/reports
```

## Create report

```bash
curl -X POST http://localhost:3000/api/reports \
-H "Content-Type: application/json" \
-d '{
"title":"Bug",
"severity":"High",
"description":"Test",
"reporter":"Ivan"
}'
```