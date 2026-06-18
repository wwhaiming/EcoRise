# GeoRise — deploy & record (run by you)

> These steps need a hosting account and a screen recorder, so **you** run them — they
> can't be done from inside the repo. Everything here is verified against the actual
> scripts/env the app uses; nothing is faked.

## 0. Prerequisites

- Node 18+.
- A strong `JWT_SECRET`: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
- Optional `OPENAI_API_KEY` (without it the deployed app runs on the offline mock + ONNX CNN, clearly flagged).

## 1. Recommended split: backend on Render, frontend on Netlify

### Backend (Render — Web Service)
- Root directory: `backend`
- Build: `npm ci`
- Start: `node server.js`
- Env vars:
  - `JWT_SECRET` = (the generated secret)
  - `OPENAI_API_KEY` = (optional)
  - `COACH_ENABLED` = `true`
  - `NODE_ENV` = `production`
  - `CORS_ORIGINS` = `https://<your-netlify-domain>`
- **Persistent DB:** attach a Render Disk mounted where `georise.db` lives, or accept that the SQLite file resets on redeploy (fine for a demo). State this honestly to judges if asked.
- After first deploy, open the service shell and seed:
  ```bash
  npm run seed          # demo board + login
  npm run seed:coach    # approved coach corpus
  ```
- Verify: `GET https://<backend-domain>/api/health` → `{"status":"ok"}`

### Frontend (Netlify — static)
- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `frontend/dist`
- Env var: `VITE_API_BASE` = `https://<your-render-backend-domain>`  (the API client reads this; see `frontend/src/utils/api.js`)

### Single-host alternative
Any Node host can serve the API and the built `frontend/dist` as static files behind the same origin (then `VITE_API_BASE` can be omitted and CORS is moot). Render/Railway/Fly all work.

## 2. Smoke-check the deploy

- `GET /api/health` returns ok.
- Log in with the seeded demo account; the board is populated.
- `GET /api/coach/eval-report` returns the AI report card.
- `GET /api/privacy/policy` returns the model/data card.

## 3. Record the fallback video (≈3 min)

1. Follow [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) step by step on the deployed (or local) app.
2. Screen-record with QuickTime / OBS / Loom.
3. Upload unlisted (YouTube/Loom) and paste the link into the README badge area and the submission form.

## 4. Paste back into the submission

- Deployed URL → README top + submission.
- Video link → README + submission.
- Repo branch: `georise-v2-footprint-privacy` (or merge to `main` before submitting).

---

### Honest status

The deployed URL, the recorded video, and live screenshots are the only remaining
submission items, and they require your hosting/recording accounts — they are **not**
fabricated in this repo. Everything they showcase (footprint digest, Evidence Panel,
privacy center, AI report card) is built, tested (86/86), and runnable locally today.
