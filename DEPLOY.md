# Deploy Ledger Book to the Web

## Step 1: Create a GitHub repository

1. Go to **https://github.com/new**
2. **Repository name:** `small-business-pnl`
3. Leave it **empty** (no README, no .gitignore)
4. Click **Create repository**

## Step 2: Connect and push your code

Open PowerShell in your project folder and run (replace `YOUR_GITHUB_USERNAME` with your actual username):

```powershell
cd c:\Users\ThilakGoki\small-business-pnl
git remote set-url origin https://github.com/YOUR_GITHUB_USERNAME/small-business-pnl.git
git push -u origin main
```

Example: If your username is `thilakgoki`, use:
```powershell
git remote set-url origin https://github.com/thilakgoki/small-business-pnl.git
git push -u origin main
```

## Step 3: Deploy on Vercel

1. Go to **https://vercel.com** and sign in (use "Continue with GitHub")
2. Click **Add New…** → **Project**
3. Find **small-business-pnl** and click **Import**
4. Click **Deploy** (leave settings as-is)
5. Wait 1–2 minutes

Your app will be live at a URL like: **https://small-business-pnl.vercel.app**

---
**Your GitHub username:** _______________
(Fill this in, then use it in the `git remote set-url` command above)
