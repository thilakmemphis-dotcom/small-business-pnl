# Ledger Book – Small Business P&L

Kirana shop P&L app with Tamil/English support.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 – data is stored in browser localStorage by default.

## Database (optional)

To sync data across devices, add [Supabase](https://supabase.com). See **DATABASE.md** for setup.

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
