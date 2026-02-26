# Add Database (Supabase)

The app works with **localStorage** by default. To use a database so data syncs across devices:

## 1. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and sign up
2. **New project** → name it (e.g. `ledger-book`)
3. Set a database password and wait for setup to finish

## 2. Enable Anonymous Auth

1. In Supabase Dashboard: **Authentication** → **Providers**
2. Find **Anonymous** and enable it

## 3. Run the schema

1. In Supabase: **SQL Editor** → **New query**
2. Copy the contents of `supabase-schema.sql`
3. Paste and click **Run**

## 4. Get your API keys

1. **Settings** → **API**
2. Copy **Project URL** and **anon public** key

## 5. Configure the app

Create a `.env` file in the project root:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...
```

## 6. Add to Vercel

In your Vercel project: **Settings** → **Environment Variables**

Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then redeploy.

---

With this set up, data is stored in Supabase instead of the browser. Each device gets its own anonymous session; data is per-device until you add email login later.
