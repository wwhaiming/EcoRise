# EcoRise — One-Click Interactive Demo Deploy

This deploys a single public URL where a judge can open the app and is **automatically
signed in** to a fully seeded board (same data as `npm run demo`) and can click around
the whole product. One container serves both the API and the built UI, so there is no
CORS and the login cookie just works.

## What was built for this

- **Single-host server.** `backend/server.js` now serves the built `frontend/dist` and
  falls back to `index.html` for client routes, so the API and UI share one origin.
- **Seed-on-boot.** With `DEMO_MODE=true`, the server seeds the demo board + account and
  the coach corpus on startup, so a fresh (even ephemeral) host comes up populated.
- **Auto sign-in.** `POST /api/auth/demo-login` (gated on `DEMO_MODE`, demo account only)
  signs the visitor in with no password. The frontend calls it automatically when there
  is no session, so judges land straight on the populated board.
- **Container + blueprint.** `Dockerfile` + `render.yaml` make it a one-click deploy.

## Option A — Render one-click (recommended, free)

1. Push this repo to GitHub (already done: `github.com/wwhaiming/EcoRise`).
2. In Render: **New + -> Blueprint -> connect this repo.** Render reads `render.yaml`,
   builds the `Dockerfile`, and auto-generates `JWT_SECRET`.
3. Click **Apply**. In ~3-5 min you get a public `https://ecorise-demo-XXXX.onrender.com`.
4. Open it. You are auto-signed-in to the demo board. Share the URL with judges.

That is the entire process. No shell step, no manual seeding.

> Free-plan notes: the instance sleeps after ~15 min idle and cold-starts in ~30-60s on
> the next visit (it re-seeds fresh each cold start). The filesystem is ephemeral, so
> judge edits reset on restart. For persistence, switch to a paid plan and uncomment the
> disk + `DATABASE_URL` block in `render.yaml`.

## Option B — any container host (Fly.io, Railway, Cloud Run)

The `Dockerfile` is host-agnostic. Set these env vars and deploy:

```
NODE_ENV=production
DEMO_MODE=true
COACH_ENABLED=true
JWT_SECRET=<a strong 32+ char random string>
# optional: OPENAI_API_KEY=sk-...   (without it, the AI runs the offline mock, clearly labeled)
```

- **Fly.io:** `fly launch` (it detects the Dockerfile), `fly secrets set JWT_SECRET=...`, `fly deploy`.
- **Railway:** new project from repo, add the env vars, deploy.
- **Cloud Run:** `gcloud run deploy --source .` with the env vars.

## Run the demo image locally (sanity check before sharing)

```bash
docker build -t ecorise-demo .
docker run -p 3001:3001 -e JWT_SECRET=local_dev_secret_at_least_32_chars_long_xx ecorise-demo
# open http://localhost:3001  -> auto-signed-in demo
```

## Things to know (be honest with judges)

- **Shared demo account.** Every visitor signs in as the same demo account, so concurrent
  judges share state (likes, posts, approvals). Fine for a few judges; if you need each
  judge isolated, ask and we can switch auto-login to per-visitor guest accounts.
- **AI mode.** Without `OPENAI_API_KEY` the app runs the deterministic offline mock and
  labels itself "DEMO — no model." The carbon math, faithfulness gate, and eval metrics
  are identical either way.
- **Security.** `demo-login` is a deliberate, scoped auth bypass: it only works when
  `DEMO_MODE=true`, only ever logs in the seeded demo account, and returns 404 otherwise.
  Do not set `DEMO_MODE=true` on a deployment that holds real user data.
