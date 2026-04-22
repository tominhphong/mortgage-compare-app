# Mortgage Compare API — Cloudflare Worker

Backend for the mortgage-compare-app. Uses D1 (SQLite) for scenario storage and R2 for future PDF report uploads.

## Prerequisites

- Node.js 18+
- Cloudflare account (free tier is enough)
- Wrangler CLI authenticated: `npx wrangler login`

## Setup Steps

### 1. Install dependencies

```bash
cd worker
npm install
```

### 2. Create D1 database

```bash
npx wrangler d1 create mortgage-compare-db
```

Copy the `database_id` from the output and paste it into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "mortgage-compare-db"
database_id = "PASTE_YOUR_ID_HERE"
```

### 3. Apply schema

```bash
npx wrangler d1 execute mortgage-compare-db --file=src/schema.sql
```

### 4. Create R2 bucket

```bash
npx wrangler r2 bucket create mortgage-compare-reports
```

The bucket name `mortgage-compare-reports` already matches the binding in `wrangler.toml`.

### 5. Local development

```bash
npm run dev
```

Worker runs at `http://localhost:8787`.

### 6. Deploy

```bash
npm run deploy
```

After deploy, Wrangler prints your worker URL:
`https://mortgage-compare-api.<your-subdomain>.workers.dev`

Set this as `NEXT_PUBLIC_WORKER_URL` in your Next.js app's `.env.local`.

## API Reference

All responses use the envelope `{ success: bool, data?, error? }`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/scenarios` | Save a scenario |
| GET | `/api/scenarios?device_id=<uuid>` | List scenarios for a device |
| GET | `/api/scenarios/:id` | Get a single scenario |
| DELETE | `/api/scenarios/:id` | Delete a scenario |
| POST | `/api/report/generate` | Generate PDF report (stub — Sprint 5) |

### POST /api/scenarios — body

```json
{
  "device_id": "uuid-v4",
  "label": "30yr Fixed vs ARM",
  "inputs": { ... },
  "outputs": { ... }
}
```

### GET /api/scenarios

Query param `device_id` (UUID v4) is required.

## Environment / Secrets

No secrets required for v1. If you add auth later, use `.dev.vars` for local secrets:

```
# worker/.dev.vars
API_SECRET=your-secret
```

Do not commit `.dev.vars` — it is git-ignored.

## Type checking

```bash
npm run type-check
```
