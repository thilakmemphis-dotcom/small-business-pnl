# Ledger Book – Small Business P&L

Kirana shop P&L app with Tamil/English support.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 – data is stored in browser localStorage by default.

### Full auth (login/signup) – local

1. Start PostgreSQL locally (or use a remote URL in `.env`).
2. `pip install -r requirements.txt`
3. Build frontend: `npm run build`
4. Start API: `npm run server` (runs `uvicorn server.main:app --reload --port 3001`)
5. Set `VITE_API_URL=http://localhost:3001` when running the frontend.

## Database (optional)

To sync data across devices, add [Supabase](https://supabase.com). See **DATABASE.md** for setup.  
For full auth with Postgres, see **DEPLOY.md** (Option B – Render + Postgres).

## Build

```bash
npm run build
```

## Features

- **Ledger** – Add entries by account (Eggs, Vegetables, Rice, etc.)
- **Reports** – Weekly and monthly P&L
- **Tamil & English** – Toggle language in header
- **Qty × Units × Price** – For eggs, rice, vegetables, etc.
- **PWA** – Install on mobile home screen
