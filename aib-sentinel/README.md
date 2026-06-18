# AIB Sentinel

Private IS Security Advisory Platform for Arab Islamic Bank (AIB).

## Setup

### Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set ANTHROPIC_API_KEY, JWT_SECRET, ADMIN_PASSWORD
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # dev server at http://localhost:5173
# or: npm run build  (then served by backend at :3001)
```

## Default credentials

Username: `admin`  
Password: value of `ADMIN_PASSWORD` in `backend/.env` (default: `sentinel2026`)

## Features

- **Daily Brief** — AI-generated 5-persona brief from live feeds, PDF export
- **CVE Watchlist** — CISA KEV + NVD + vendor PSIRTs filtered to your stack, Excel export
- **Asset Registry** — Editable asset table; add/retire at any time
- **Open Actions** — Track remediation actions from briefs
- **4C Finding Generator** — Structured audit findings in English or Arabic, PDF export
- **Feed Status** — Health panel for all 8 intelligence sources

## Feed schedule

Feeds pull daily at 06:00, brief generates at 06:30 (Asia/Jerusalem). Trigger manually via the UI.

## Environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Required for brief + finding generation |
| `JWT_SECRET` | Long random string for JWT signing |
| `ADMIN_PASSWORD` | Login password (set before first run) |
| `NVD_API_KEY` | Optional — removes NVD rate limiting |
| `PORT` | Backend port (default: 3001) |
