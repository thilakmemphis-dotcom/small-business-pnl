# Option C: Vercel (frontend) + Render (backend) – Setup Guide

Frontend on Vercel, backend API on Render. Users visit your Vercel URL.

---

## Part 1: Render (Backend)

### 1.1 Create PostgreSQL database

1. Go to [render.com](https://render.com) → sign in with GitHub
2. **New +** → **PostgreSQL**
3. Name: `ledger-book-db`, choose region → **Create Database**
4. Wait for ready → copy **Internal Database URL** (starts with `postgresql://`)

### 1.2 Create Web Service (API only)

1. **New +** → **Web Service**
2. Connect repo: **small-business-pnl**
3. Settings:
   | Field | Value |
   |-------|-------|
   | Name | `ledger-book-api` |
   | Environment | **Docker** |
   | Dockerfile Path | `Dockerfile.api` |
   | Instance Type | Free |

   **Dockerfile Path** is under **Advanced** → or later in **Settings** → **Build & Deploy**

### 1.3 Environment variables (Render)

In Web Service → **Environment** → add:

| Key | Value |
|----|-------|
| `DATABASE_URL` | Your Internal Database URL from 1.1 |
| `JWT_SECRET` | Run `openssl rand -hex 32` and paste output |
| `PORT` | `3001` |

**Leave `APP_URL` empty for now** – you’ll add it after Part 2.

### 1.4 Deploy

1. **Create Web Service**
2. Wait 3–5 minutes
3. Copy your **Render URL** (e.g. `https://ledger-book-api-xxxx.onrender.com`)

---

## Part 2: Vercel (Frontend)

### 2.1 Deploy project

1. Go to [vercel.com](https://vercel.com) → sign in with GitHub
2. **Add New…** → **Project**
3. Import **small-business-pnl** repo
4. Settings:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

### 2.2 Environment variables (Vercel)

In **Settings** → **Environment Variables**:

| Name | Value |
|------|-------|
| `VITE_API_URL` | Your **Render URL** from Part 1 (e.g. `https://ledger-book-api-xxxx.onrender.com`) |

**Important:** Do **not** add `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` for Option C.

### 2.3 Deploy

1. **Deploy** (or trigger redeploy)
2. Copy your **Vercel URL** (e.g. `https://small-business-pnl.vercel.app`)

---

## Part 3: Connect (CORS)

### 3.1 Add Vercel URL to Render

1. Render → **ledger-book-api** → **Environment**
2. Add:
   | Key | Value |
   |----|-------|
   | `APP_URL` | Your **Vercel URL** (e.g. `https://small-business-pnl.vercel.app`) |
3. **Save** – Render will redeploy (~1–2 min)

---

## Part 4: Test

1. Open your **Vercel URL**
2. You should see the app with **Login** and **Sign up**
3. Sign up → add a ledger entry → refresh → data should persist

---

## Checklist

- [ ] Render: PostgreSQL created, Internal URL copied
- [ ] Render: Web Service created with `Dockerfile.api`
- [ ] Render: `DATABASE_URL`, `JWT_SECRET`, `PORT` set
- [ ] Render: Service deployed, URL copied
- [ ] Vercel: Project deployed
- [ ] Vercel: `VITE_API_URL` = Render URL
- [ ] Render: `APP_URL` = Vercel URL
- [ ] Test: Sign up, add entry, refresh

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| CORS / "Failed to fetch" | Set `APP_URL` on Render = exact Vercel URL (no trailing slash). Redeploy Render. |
| Blank page / login fails | Ensure `VITE_API_URL` on Vercel = Render URL. Redeploy Vercel. |
| Data not saving | Check `DATABASE_URL` on Render; verify Postgres is running. |
| Slow first load | Render Free tier sleeps after idle; first request can take ~30 s. |

---

**Share with users:** Your **Vercel** URL only.
