# Option C – Local Setup (Frontend + Backend)

Run the full app locally before deploying to Vercel + Render.

---

## Prerequisites

- **Python 3.11+** and **Node.js 18+**
- **PostgreSQL** – only needed if you want to use Postgres (SQLite is the default for local dev)

---

## Step 1: Database

**Default: SQLite** – no setup needed. The app uses `local.db` in the project root. Just run and go.

### Optional: PostgreSQL

1. Install [PostgreSQL](https://www.postgresql.org/download/) for Windows
2. Create a database:
   ```powershell
   psql -U postgres -c "CREATE DATABASE ledger_book;"
   ```
3. Default connection: `postgresql://postgres:postgres@localhost:5432/ledger_book`
   - Adjust username/password if different

### Option B: Cloud PostgreSQL (Neon, Render, etc.)

1. Create a free PostgreSQL database
2. Copy the connection URL (e.g. `postgresql://user:pass@host/dbname`)

---

## Step 2: Create `.env` file

In the project root, create `.env` with:

```env
# Database: SQLite (default) or PostgreSQL
DATABASE_URL=sqlite:///./local.db

# JWT secret – run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-secret-at-least-32-chars-long

# Frontend calls this API
VITE_API_URL=http://localhost:3001

# CORS – allow frontend dev server
APP_URL=http://localhost:5173
```

**Generate JWT_SECRET:**

```powershell
# Windows (PowerShell) – if OpenSSL is installed
openssl rand -hex 32

# Or use any random 32+ character string
```

---

## Step 3: Install Python dependencies

```powershell
pip install -r requirements.txt
```

---

## Step 4: Run backend and frontend

### Option 1: Two terminals

**Terminal 1 – Backend:**
```powershell
npm run server
```
API at http://localhost:3001

**Terminal 2 – Frontend:**
```powershell
npm run dev
```
App at http://localhost:5173

### Option 2: Single command

```powershell
npm run start
```
Runs both backend and frontend.

---

## Step 5: Test

1. Open http://localhost:5173
2. You should see **Login** and **Sign up** (not the Supabase auth screen)
3. Click **Sign up** → create account → add ledger entry
4. Refresh – data should persist (stored in Postgres)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `psycopg2` / `ModuleNotFoundError` | Run `pip install -r requirements.txt` |
| `Connection refused` (DB) | Ensure PostgreSQL is running; check `DATABASE_URL` |
| `password authentication failed for user "postgres"` | Update `DATABASE_URL` in `.env` with your actual postgres password, or use a cloud DB (Neon, Render) |
| CORS error | Ensure `.env` has `APP_URL=http://localhost:5173` |
| Blank page / "Failed to fetch" | Ensure backend is running; check `VITE_API_URL` in `.env` |
| Login screen doesn't appear | Remove `VITE_SUPABASE_URL` from `.env` if present |

---

## API docs (Swagger)

When the backend is running: http://localhost:3001/api-docs
