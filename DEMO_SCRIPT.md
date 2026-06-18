# EcoRise — 3-minute judge demo script

Digest-first order: lead with the Direction-B centerpiece (the school's hidden
footprint), then prove the responsible-AI claims, then the privacy story. Works fully
offline (no API key) — offline mode is clearly flagged in the UI, never faked.

## Setup (once, ~30s before judging)

```bash
npm run install:all
npm run demo            # seeds a populated board + login, starts frontend + backend
# login: demo@ecorise.app  (password printed by the seed)  ·  board "Greenfield High"
cd backend && COACH_ENABLED=true npm run seed:coach   # enable + seed the coach corpus
```

Open http://localhost:5173 and log in. With an `OPENAI_API_KEY` set you get live AI; without one the app runs on the deterministic mock + the in-repo ONNX CNN and labels itself "DEMO — no model."

---

## 0:00 – 0:30 · The hook + the hidden footprint

> "Most eco apps let the AI invent an impact number. EcoRise never does. The AI perceives; a deterministic, cited engine decides."

- Land on the **AI Footprint Coach**. Point at the **School Hidden-Footprint digest** (the hero): total t CO₂e/month, the **biggest hidden emitter** flagged, the **confidence chip**, and the disclaimer.
- "These come from cited EPA/OWID factors with an uncertainty band — a teacher can enter real bills to raise confidence." (Open the baseline wizard for one second.)

## 0:30 – 1:15 · Log an action → the AI Evidence Panel

- Tap **Log action**, add a photo (a bike works in the demo).
- When the Evidence Panel opens, walk it top to bottom: **AI detected** + confidence ring → **Carbon math** (formula + cited factor + range) → **Points awarded** breakdown → **AI pipeline · tools run** → **Integrity checks**.
- Land the line: *"The vision model only perceived the action. The kilograms came from a cited factor; the points were scored server-side. The LLM cannot award a point."*

## 1:15 – 1:45 · The coach + the AI report card

- Scroll to the **source-backed question** — note the citation chips.
- Scroll to the **AI report card** (Research tab): "These are real numbers from our eval harness, not hardcoded — citation validity, faithfulness, refusal precision, hallucination rate, injection resistance, retrieval Recall@k/MRR. Re-run with `npm run test:coach-eval`."
- Mention the **refusal card**: "If it can't ground a recommendation, it withholds it rather than guessing."

## 1:45 – 2:30 · Privacy (the FERPA/COPPA story)

- Open **Profile → Privacy & data** (the Privacy Center).
- Show **consent**: on a real classroom board a student is blocked from uploading until consent is recorded (demo this by switching a board to classroom mode, or describe it).
- Show **image retention** (minimize by default — only a thumbnail is kept), **teacher review queue** (approve/reject reverses points), **export my data** + **delete account**, and the **model/data card** with the CNN's real `val_acc 0.936`.

## 2:30 – 3:00 · Close

- "Three things make this defensible: a deterministic carbon engine, a privacy engine built for minors, and an eval harness you can re-run. The AI is one measured component, not the judge of truth."
- Optional: show `docs/SCALE.md` numbers (`npm run loadtest`) and the comparison table in the README.

---

## If the live demo fails

- No network / no key → the app already runs offline; point at the "DEMO — no model" badge and keep going. Nothing is faked.
- Total failure → play the recorded fallback video (see [`DEPLOY.md`](DEPLOY.md)).
