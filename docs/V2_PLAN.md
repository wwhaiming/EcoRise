# GeoRise v2 — Win Plan & Progress Tracker

Branch: `georise-v2-footprint-privacy`. Goal: push every CODEABLE rubric gap to its honest
maximum and re-grade with the council at each checkpoint. Status legend: ☐ todo · ◐ in-progress · ☑ done+verified.

## Honest ceiling (no cheating)
A maximally harsh judge's 100/100 needs real-world validation we cannot fabricate without lying:
a real classroom pilot, real school operational data (kWh/therms/bus-miles/meals), human-labeled
eval sets, and deployment under load. Those stay explicitly UNFAKED. Every estimate ships with a
truthful confidence label + assumptions. We build the rest to masterful quality.

## Phases (dependency-ordered)

### Phase 1 — School hidden-footprint intelligence  (#1 gap, both reviews)
- ☑ `backend/utils/footprintModel.js`: Scope-style categories (electricity, natural_gas, commuting,
  cafeteria_food, landfill_waste, water) → kgCO2e/month from cited EPA/OWID factors, each with
  confidence + assumptions + low/high. Defaults labeled estimates; confidence rises with real inputs. (f79bdbd, sanity-checked)
- ☑ `backend/routes/coach.js` `/school-footprint` (baseline) + `/school-insight` (biggest emitter +
  action-leverage + grounded recommendation gated by deterministicFaithfulness >= SIM_FLOOR). (1332251, verified live)
- ☑ "action leverage" line in /school-insight, surfaced in the digest UI.
- ☑ `components/SchoolFootprint.jsx` digest as the AI-tab hero + baseline wizard. (a0c7e66, verified live + screenshotted)
- ☑ add a footprintModel unit test to backend/test (1164aed, 8 hermetic cases).

### RESUME POINTER (for a fresh session)
Branch `georise-v2-footprint-privacy`. DONE: Phase 1 (footprint intelligence + unit tests) AND
Phase 2 (privacy/FERPA-COPPA, re-scoped to additive — see docs/PRIVACY.md). Backend 79/79 green,
frontend builds clean. Committed dd85755 and pushed to georise-v2-footprint-privacy.
NEXT = council re-grade checkpoint CP1 (re-run /claude-council:ask with Phase 1+2 implemented),
then Phase 3 (evaluation rigor: real metrics, semantic entailment gate, in-app AI report card,
model cards). Phases 4-6 (winning-plan UX fixes, scale honesty, submission artifacts) after.

### Phase 2 — Privacy / FERPA-COPPA for minors  (can DISQUALIFY; non-negotiable)
RE-SCOPED (2026-06-18): code review showed the leaderboard ALREADY is the tenant boundary
(membership-gated everywhere; email never leaked). A parallel `school_id` on every table was
rejected as redundant, high-risk churn. We hardened + tested the existing boundary and spent
the budget on the additive pieces a harsh judge actually grades. Full design: docs/PRIVACY.md.
- ☑ tenant isolation hardened + proven (cross-board denial test); `school_id` migration
  intentionally NOT done (documented rationale, not an oversight).
- ☑ consent model (demo / classroom / parent); uploads blocked until consent — enforced BEFORE
  any AI call in posts + trashspotter; organizer auto-consented; student self-attest path.
- ☑ image retention (minimize default / standard / 24h / do_not_store); jimp thumbnails; full
  original never stored by default; 24h purge sweep on boot + 60s interval.
- ☑ teacher review before feed/leaderboard publication; reject reverses points EXACTLY (clawback
  by point_events.source_id). Review OFF by default; documented pending-window tradeoff.
- ☑ account export + delete (cascade, clears session); privacy-by-design + model/data card; audit log.
- ☑ backend tests: test/privacy.test.js (8 integration cases) — full suite 79/79 green.
- ☑ frontend: PrivacyCenter screen + consent gate in upload modal + Profile entry; vite build green.

### Phase 3 — Evaluation rigor (real, not illustrative)
- ☐ human-labeled eval set (>=30 cases) for retrieval + grounding; compute Recall@k, MRR,
  citation precision, refusal precision, fraud false-positive rate.
- ☐ semantic entailment grounding gate (atomic-claim → entailment judge) ALONGSIDE lexical gate;
  label honestly as added layer.
- ☑ in-app "AI report card" reads REAL eval output, not hardcoded numbers — GET
  /api/coach/eval-report serves results.json (written by `npm run test:coach-eval`),
  surfaced in the Research tab. (80/80 suite, +1 endpoint test.)
- ☐ model cards: CNN (dataset/accuracy/confusion/limits) + OpenAI vision usage.

### Phase 4 — Winning-plan correctness + UX (from the 17-agent review)
- ☐ verify/remove 1GB tar + scratch dumps; branding; .env.example; rate-limit/day; OpenAI timeout +
  AbortController; image downscale; eco offline fallback; startup self-check; honest labels;
  remove rubric chips; auto-load research; Board→Home; 502 refusal card; a11y dialog; aria-live;
  guidance dilution fix; fraud reason in panel; delete chatEcoAction; data-not-instructions clauses;
  carbon formula line; role-specific landing.

### Phase 5 — Scale honesty
- ☐ real vector index (sqlite-vec/pgvector) OR explicitly document brute-force as a demo choice with
  a migration path; per-school/role/endpoint quotas + cost note; disaster-mode handling + smoke load test.

### Phase 6 — Submission
- ☐ mermaid architecture; DEMO_SCRIPT (digest-first order); comparison table; one sticky hook;
  hero screenshots/GIF; deployed URL; recorded fallback video.

## Council re-grade checkpoints
- CP1 after Phase 1+2 · CP2 after Phase 3 · CP3 after Phase 4-6. Re-run `/claude-council:ask` each time,
  record the new score + remaining gaps below.

### Grade log
- Baseline (all-fixes-assumed): 85/100. Biggest blocker: validated school-level footprint intelligence.
- Phase 1 shipped: footprint model + /school-insight digest + 8 unit tests (closes the #1 codeable gap).
- Phase 2 shipped: privacy engine (consent gate, retention minimization, teacher review, export/delete,
  audit log, model card) + 8 integration tests. Addresses the FERPA/COPPA "can-disqualify" gap. CP1
  council re-grade not yet re-run.
