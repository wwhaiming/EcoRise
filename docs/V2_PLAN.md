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
- ☐ `backend/utils/footprintModel.js`: Scope-style categories (electricity, natural_gas, commuting,
  cafeteria_food, landfill_waste, procurement, water) → kgCO2e/month from cited EPA/OWID factors,
  each with confidence + assumptions + sourceIds. No invented numbers; defaults clearly labeled "estimate".
- ☐ `backend/routes/coach.js` `/school-footprint` (baseline wizard input) + `/school-insight`
  (aggregate board → biggest emitter + action-leverage card, grounded + cited).
- ☐ frontend `pages/Footprint.jsx` baseline wizard + digest as the HOME dashboard hero.
- ☐ "action leverage" card: logged student savings vs institutional emitter (e.g. 1 meatless day = 95kg vs 18kg).
- ☐ tests: footprint math deterministic; insight refuses when no baseline.

### Phase 2 — Privacy / FERPA-COPPA for minors  (can DISQUALIFY; non-negotiable)
- ☐ multi-tenant `school_id` isolation: schema migration + scoped authz on every query + audit log.
- ☐ consent model (demo / classroom / parent-approved); block uploads until consent.
- ☐ image retention modes (do_not_store / 24h / until_review); store derived labels not raw where possible.
- ☐ teacher review before feed/leaderboard publication; appeal path for fraud false-positives.
- ☐ account export + delete; privacy-by-design screen; model/data card.

### Phase 3 — Evaluation rigor (real, not illustrative)
- ☐ human-labeled eval set (>=30 cases) for retrieval + grounding; compute Recall@k, MRR,
  citation precision, refusal precision, fraud false-positive rate.
- ☐ semantic entailment grounding gate (atomic-claim → entailment judge) ALONGSIDE lexical gate;
  label honestly as added layer.
- ☐ in-app "AI report card" reads REAL eval output, not hardcoded numbers.
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
