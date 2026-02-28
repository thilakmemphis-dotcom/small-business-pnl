# Ledger Book – Deployment Guide

This guide explains how to deploy Ledger Book. Choose one of three options below.

---

## Which URL do I share with users?

| Option | Share this URL |
|--------|----------------|
| **Option A (Vercel + Supabase)** | Your Vercel URL |
| **Option B (Render + Postgres)** | Your Render Web Service URL |
| **Option C (Vercel + Render split)** | Your **Vercel** URL only (frontend) |

**Do not share:** Render dashboard links, "Deployments" tab, or "View deployment" – those show build logs, not the app.

---

## Which option should I use?

| | **Option A: Vercel + Supabase** | **Option B: Render only** | **Option C: Vercel + Render split** |
|---|---|---|---|
| **Login/Signup** | No (anonymous) | Yes | Yes |
| **Password reset** | No | Yes | Yes |
| **Data** | Per device | Per user (synced) | Per user (synced) |
| **Frontend** | Vercel | Render (Docker) | Vercel |
| **Backend** | Supabase | Render (Docker) | Render (Docker) |
| **Share URL** | Vercel | Render | **Vercel** |
| **Complexity** | Easiest | Medium | Medium |

---

# Option A: Vercel + Supabase

Use this if you want a simple deploy with no login screen. Data is saved per device.

---

## Step 1: Push code to GitHub

1. Make sure your project is on GitHub (you’ve already done this).
2. Ensure the latest code is pushed:
   ```powershell
   cd c:\Users\ThilakGoki\small-business-pnl
   git add -A
   git commit -m "Updates"
   git push origin main
   ```

---

## Step 2: Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. Click **New Project**.
3. Fill in:
   - **Name:** ledger-book (or any name)
   - **Database Password:** choose a strong password and save it
   - **Region:** closest to your users
4. Click **Create new project** and wait 1–2 minutes.

---

## Step 3: Create the database table in Supabase

1. In your Supabase project, go to **SQL Editor** (left sidebar).
2. Click **New query**.
3. Copy the full contents of `supabase-schema.sql` from this project.
4. Paste it into the SQL Editor.
5. Click **Run** (or press Ctrl+Enter).
6. You should see “Success. No rows returned”.

---

## Step 4: Get your Supabase credentials

1. In Supabase, go to **Settings** (gear icon) → **API**.
2. Copy:
   - **Project URL** (e.g. `https://xxxxx.supabase.co`)
   - **anon public** key (under “Project API keys”)

---

## Step 5: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (e.g. with GitHub).
2. Click **Add New…** → **Project**.
3. Import your **small-business-pnl** repo (or connect it if needed).
4. **Project Settings** before deploying:
   - **Framework Preset:** Vite (auto-detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. **Environment Variables** – Click “Environment Variables” and add:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | Your Project URL from Step 4 |
   | `VITE_SUPABASE_ANON_KEY` | Your anon public key from Step 4 |

6. **Important:** Do **not** add `VITE_API_URL`. If it exists, delete it.
7. Click **Deploy**.
8. Wait 1–2 minutes. Your app URL will look like:  
   `https://small-business-pnl.vercel.app`

---

## Step 6: Test

1. Open your Vercel URL.
2. Add a ledger entry.
3. Refresh the page – the entry should still be there (stored in Supabase).

---

## Summary – Option A

| Step | What you did |
|------|--------------|
| 1 | Pushed code to GitHub |
| 2 | Created Supabase project |
| 3 | Ran `supabase-schema.sql` in Supabase SQL Editor |
| 4 | Copied Project URL and anon key |
| 5 | Deployed on Vercel with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` |
| 6 | Verified the app works |

---

# Option B: Render + Postgres (full auth)

Use this if you want login, signup, and password reset. Data is synced per user account.

---

## Step 1: Push code to GitHub

Same as Option A, Step 1. Ensure your project is on GitHub with the latest changes.

---

## Step 2: Sign up and prepare Render

1. Go to [render.com](https://render.com).
2. Sign up with GitHub.
3. Connect your GitHub account if asked.

---

## Step 3: Create a PostgreSQL database on Render

1. On the Render dashboard, click **New +**.
2. Select **PostgreSQL**.
3. Fill in:
   - **Name:** ledger-book-db
   - **Region:** closest to you
4. Click **Create Database**.
5. Wait for it to be created.
6. In the database view, find **Internal Database URL**.
7. Copy it (starts with `postgresql://`). You will use it in the next step.

---

## Step 4: Create a Web Service on Render

1. Click **New +** → **Web Service**.
2. Connect your GitHub account if needed.
3. Select the **small-business-pnl** repository.
4. Click **Connect**.

---

## Step 5: Configure the Web Service

Use these settings:

| Field | Value |
|-------|-------|
| **Name** | ledger-book (or any name) |
| **Region** | Same as your database |
| **Environment** | Docker |
| **Instance Type** | Free (or Paid for production) |

Render will use the project's `Dockerfile` to build (frontend + Python API) and run the server. No separate Build/Start commands needed.

---

## Step 6: Add environment variables

1. In the Web Service setup, go to **Environment**.
2. Click **Add Environment Variable** and add each of these:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the Internal Database URL from Step 3 |
| `JWT_SECRET` | Generate one: run `openssl rand -hex 32` in a terminal |
| `PORT` | `3001` |
| `APP_URL` | `https://ledger-book.onrender.com` (replace with your actual service URL) |
| `VITE_API_URL` | `https://ledger-book.onrender.com` (same as APP_URL) |

**Note:** Before the first deploy, Render shows a default URL like `https://small-business-pnl-xxxx.onrender.com`. Use that URL for both `APP_URL` and `VITE_API_URL`. You can change it later in **Settings** → **Custom Domain** if needed.

---

## Step 7: Deploy

1. Click **Create Web Service**.
2. Render will build and deploy. Wait 3–5 minutes.
3. When done, you’ll see a URL such as `https://small-business-pnl.onrender.com`.
4. If you used a different URL in env vars, update `APP_URL` and `VITE_API_URL` to match, then redeploy.

---

## Step 8: Test and get your shareable URL

1. In the Render dashboard, open your **ledger-book** Web Service.
2. **Copy the live URL** from the top (e.g. `https://ledger-book-xxxx.onrender.com`). This is the URL you share with users.
3. **Do NOT** use links like "View deployment" or "Deployments" – those show build logs, not the app.
4. Open your live URL in a browser. You should see the **Welcome** screen with **Login** and **Sign up**.
5. Click **Sign up**, create an account, and add a ledger entry.
6. Refresh – the entry should still be there (stored in Postgres).

**If you see a "deployment" or placeholder page instead of the app:** Make sure you created a **Web Service** (Docker), not a Static Site. Static Site will not run the API or serve the app correctly. Delete and recreate as Web Service with Environment = Docker.

---

## Summary – Option B

| Step | What you did |
|------|--------------|
| 1 | Pushed code to GitHub |
| 2 | Signed up on Render |
| 3 | Created a PostgreSQL database and copied Internal Database URL |
| 4 | Created a Web Service linked to your repo |
| 5 | Set Environment = Docker (uses Dockerfile to build and run) |
| 6 | Added `DATABASE_URL`, `JWT_SECRET`, `PORT`, `APP_URL`, `VITE_API_URL` |
| 7 | Deployed and got the app URL |
| 8 | Tested login/signup and ledger data |

---

# Option C: Vercel (frontend) + Render (backend)

Use this if you want the frontend on Vercel and the backend on Render. Users visit the Vercel URL; the app calls the Render API in the background.

---

## Already deployed on Render?

If you already have a Web Service on Render:

1. Open your service → **Settings** → **Build & Deploy**
2. Find **Dockerfile Path** and set it to `Dockerfile.api`
3. Click **Save Changes** – Render will redeploy with API only (no frontend build)
4. Then follow **Part 2** below to deploy the frontend on Vercel

---

## Part 1: Deploy the backend on Render

### Step 1: Create a PostgreSQL database on Render

1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** → **PostgreSQL**.
3. Name it **ledger-book-db**, choose a region, click **Create Database**.
4. Wait for it to be ready.
5. Copy the **Internal Database URL** (starts with `postgresql://`).

---

### Step 2: Create a Web Service on Render (backend only)

1. Click **New +** → **Web Service**.
2. Connect and select your **small-business-pnl** repo.
3. Configure:

   | Field | Value |
   |-------|-------|
   | **Name** | ledger-book-api |
   | **Region** | Same as your database |
   | **Environment** | Docker |
   | **Dockerfile Path** | `Dockerfile.api` |
   | **Instance Type** | Free |

   **Dockerfile Path:** Under **Advanced** settings, set to `Dockerfile.api` so Render builds only the API (no frontend). This is faster and lighter. If you don't see it, you can add it later in **Settings** → **Docker**.

---

### Step 3: Add environment variables on Render

In the Web Service → **Environment**, add:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your Internal Database URL from Step 1 |
| `JWT_SECRET` | Run `openssl rand -hex 32` in terminal, paste the output |
| `PORT` | `3001` |
| `APP_URL` | Leave empty for now – you’ll add your Vercel URL after Part 2 |

**Note:** Do **not** add `VITE_API_URL` here – that goes on Vercel.

---

### Step 4: Deploy the backend

1. Click **Create Web Service**.
2. Wait 3–5 minutes for the build to finish.
3. Copy your **Render live URL** (e.g. `https://ledger-book-api-xxxx.onrender.com`). You’ll need it for Vercel.

---

## Part 2: Deploy the frontend on Vercel

### Step 5: Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub.
2. Click **Add New…** → **Project**.
3. Import your **small-business-pnl** repo.
4. Project settings:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

---

### Step 6: Add environment variables on Vercel

In **Settings** → **Environment Variables**, add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | Your **Render backend URL** from Step 4 (e.g. `https://ledger-book-api-xxxx.onrender.com`) |

**Important:** Do **not** add `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` for Option C.

---

### Step 7: Deploy

1. Click **Deploy** (or trigger a redeploy).
2. Wait 1–2 minutes.
3. Copy your **Vercel URL** (e.g. `https://small-business-pnl.vercel.app`).

---

## Part 3: Connect frontend and backend

### Step 8: Update Render with the Vercel URL (CORS)

1. Go back to Render → your **ledger-book-api** Web Service.
2. Open **Environment**.
3. Add or update:
   | Key | Value |
   |-----|-------|
   | `APP_URL` | Your **Vercel URL** from Step 7 |
4. Click **Save Changes**. Render will redeploy automatically (about 1–2 minutes).

---

### Step 9: Test

1. Open your **Vercel URL** in a browser.
2. You should see the **Welcome** screen with **Login** and **Sign up**.
3. Click **Sign up**, create an account, and add a ledger entry.
4. Refresh – the entry should persist (stored in Postgres on Render).

---

## Summary – Option C

| Step | What you did |
|------|--------------|
| 1–4 | Created Render Postgres and Web Service (backend) |
| 5–7 | Deployed frontend on Vercel with `VITE_API_URL` = Render URL |
| 8 | Set `APP_URL` on Render = Vercel URL (for CORS) |
| 9 | Tested the app |

**Share with users:** Your **Vercel** URL only.

---

# Troubleshooting

## Option A (Vercel + Supabase)

| Problem | Fix |
|--------|-----|
| “Failed to fetch” or blank page | Check Supabase URL and anon key in Vercel env vars. Redeploy. |
| Data not saving | Run `supabase-schema.sql` in Supabase SQL Editor. |
| Login screen appears | Remove `VITE_API_URL` from Vercel env vars and redeploy. |

## Option B (Render)

| Problem | Fix |
|--------|-----|
| Build fails | Ensure Dockerfile exists; Render uses it automatically. |
| “Application failed to start” | Check `DATABASE_URL` and `JWT_SECRET`. |
| Login works but data not saving | Verify `DATABASE_URL` and that the database is running. |
| Free tier sleeps | On Free tier, the app may sleep after inactivity. First load can take ~30 seconds. |

## Option C (Vercel + Render split)

| Problem | Fix |
|--------|-----|
| "Failed to fetch" or CORS error | Add `APP_URL` on Render = your exact Vercel URL. Redeploy Render. |
| Blank page or login doesn't work | Check `VITE_API_URL` on Vercel points to your Render URL. Redeploy Vercel. |
| Login works but data not saving | Check `DATABASE_URL` on Render and that the database is running. |
| Render backend sleeps (Free tier) | First API call after idle can take ~30 seconds. Consider upgrading for production. |

---

# Environment variables quick reference

| Variable | Option A | Option B | Option C |
|----------|----------|----------|----------|
| **Vercel** | | | |
| `VITE_SUPABASE_URL` | ✅ Required | ❌ | ❌ |
| `VITE_SUPABASE_ANON_KEY` | ✅ Required | ❌ | ❌ |
| `VITE_API_URL` | ❌ | ❌ | ✅ Render backend URL |
| **Render** | | | |
| `DATABASE_URL` | ❌ | ✅ From Postgres | ✅ From Postgres |
| `JWT_SECRET` | ❌ | ✅ Random | ✅ Random |
| `APP_URL` | ❌ | ✅ Render URL | ✅ Vercel URL |
| `VITE_API_URL` | ❌ | ✅ (optional) | ❌ Not needed |
