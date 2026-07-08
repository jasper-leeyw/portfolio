# Going live — deployment guide

This takes the portfolio + LeetCode tracker from local-only to a live, self-updating
site. Everything here is free-tier.

## What lives where

```
 Static site + /api  ─────►  Vercel        (the website + read API)
 Accumulated solves  ─────►  Turso         (SQLite in the cloud — persists)
 Scheduled sync      ─────►  GitHub Actions (pulls LeetCode → writes to Turso)
```

Only the scheduled sync ever touches the LeetCode API. Every visitor reads the
cached data from `/api/practice/data`, which reads Turso.

## Prerequisites (make these free accounts first)

- **GitHub** account — https://github.com
- **Vercel** account — https://vercel.com (sign in with GitHub)
- **Turso** account — https://turso.tech
- **Node 18+** locally (you already have v18.17).

---

## Step 1 — Put the code on GitHub

From the project folder (`~/Desktop/Swe_Portfolio`):

```bash
git init
git add -A
git commit -m "Portfolio + LeetCode tracker"
```

Create an empty repo on GitHub (no README), then:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

> `.gitignore` already excludes `.data/`, `.env`, `node_modules/`, so no secrets
> or local DB get pushed.

---

## Step 2 — Create the Turso database

Install the CLI and sign up:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup            # opens the browser
```

Create the database and grab its two credentials:

```bash
turso db create evergreen

turso db show evergreen --url          # → TURSO_DATABASE_URL  (libsql://...)
turso db tokens create evergreen       # → TURSO_AUTH_TOKEN    (long string)
```

Copy both values somewhere safe for the next steps. (No schema step needed — the
tables are created automatically on first write.)

---

## Step 3 — Deploy to Vercel

1. Go to https://vercel.com/new and **Import** your GitHub repo.
2. Framework preset: **Other**. Build command: **leave empty**. Output dir: **leave empty**.
   (It's a static site + `/api` functions — no build.)
3. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `TURSO_DATABASE_URL` | the `libsql://...` url from Step 2 |
   | `TURSO_AUTH_TOKEN` | the token from Step 2 |
   | `LEET_USER` | `leegatus17` |

4. Click **Deploy**. You'll get a URL like `https://<project>.vercel.app`.

At this point the site is live but the tree still shows **sample data** — Turso is
empty until the first sync (next step).

---

## Step 4 — Seed the first sync

Run one sync locally, writing straight into Turso. Install the DB client first:

```bash
npm install
LEET_USER=leegatus17 \
TURSO_DATABASE_URL='libsql://...' \
TURSO_AUTH_TOKEN='...' \
npm run sync
```

Expected output: `synced leegatus17: fetched 19, added 19, total 19`.

Reload your Vercel URL — the bonsai now shows your **real** solves. 🎉

---

## Step 5 — Automate the sync (cron)

The workflow file `.github/workflows/sync.yml` already runs every 4 hours. It just
needs the same credentials as **repo secrets**:

1. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.
2. Add three secrets (same values as Step 2/3):
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `LEET_USER`
3. Go to the repo's **Actions** tab → **LeetCode sync** → **Run workflow** to test it
   once manually. Check the run log shows `synced ...`.

From now on it syncs on its own; new solves appear on the site within ~4 hours.

---

## Step 6 — Verify it's live and self-updating

- Visit the Vercel URL → tree shows real numbers (not the sample 86).
- Solve a new LeetCode problem → run the Action manually (or wait for the cron) →
  reload → a new leaf appears.
- Optional DB peek: `turso db shell evergreen "select count(*) from problems"`.

---

## Reference — environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `TURSO_DATABASE_URL` | Vercel + GitHub secret + local sync | which DB to use |
| `TURSO_AUTH_TOKEN` | Vercel + GitHub secret + local sync | DB auth |
| `LEET_USER` | Vercel + GitHub secret + local sync | whose LeetCode to pull |
| `SYNC_SECRET` | Vercel (optional) | protects the manual `POST /api/practice/sync` endpoint |

If `TURSO_DATABASE_URL` is **not** set (i.e. local dev), the app automatically uses
the `.data/store.json` file instead — nothing to configure.

---

## Troubleshooting

- **Tree shows sample data, not real** → Turso is empty or Vercel env vars are
  missing. Re-run Step 4, and confirm the three vars exist in Vercel → Settings →
  Environment Variables (redeploy after adding them).
- **Sync Action fails** → open the run log. Common causes: wrong `LEET_USER`, the
  free alfa-leetcode-api being down/cold (re-run), or a bad Turso token.
- **`/api/...` returns 404 on Vercel** → make sure `package.json` still has
  `"type": "module"` and the `api/` folder was pushed.
- **Only ~20 recent solves ever show** → that's LeetCode's limit per fetch; the
  4-hour cron is what accumulates history over time. If you grind >20 problems
  between syncs, temporarily run the Action more often.

## Optional hardening (later)

- **Self-host alfa-leetcode-api** (its own Docker deploy on Railway/Fly) and set
  `LEET_API` to your instance — removes the shared free-tier cold starts.
- **Custom domain** — add it in Vercel → Settings → Domains (the site stays free;
  only the domain name costs ~$10–15/yr).
