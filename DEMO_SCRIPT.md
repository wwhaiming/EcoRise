# EcoRise — Judge demo script (4:30 frame)

**Core thesis:** Institutional emissions dwarf student behavior. Student action only becomes
meaningful when it targets the school's biggest emitter — and that requires knowing what the
biggest emitter is. EcoRise surfaces that, grounds the recommendation in cited evidence, and
makes the leverage ratio visible.

> **Separate artifact**: [`PITCH_VIDEO_SCRIPT.md`](PITCH_VIDEO_SCRIPT.md) covers the
> pre-recorded 5-minute submission video. This file is the live judge walkthrough only.

---

## Setup (once, ~30s before judging)

```bash
npm run install:all
npm run demo            # seeds a populated board + login, starts frontend + backend
cd backend && COACH_ENABLED=true npm run seed:coach   # enable + seed the coach corpus
```

Open http://localhost:5173 and log in as `demo@ecorise.app` (password printed by seed).
Board: **Garfield High School**. Navigate to **School Footprint** and leave it open.

With `OPENAI_API_KEY` set you get live AI; without it the app uses the deterministic mock
and labels itself "DEMO — no model." Either path is valid; call it out if asked.

> **Data sources for Garfield High School**
>
> | Field | Value | Source |
> |---|---|---|
> | Electricity (kWh/mo) | 143,083 | **Real** — Seattle Public Schools Energy & Utility Dashboard, CY 2023 (1,716,998 kWh ÷ 12). [seattleschools.org](https://www.seattleschools.org/departments/resource-conservation/utility-data-dashboard/) |
> | Natural gas (therms/mo) | 4,766 | **Real** — same dashboard, CY 2023 (57,189 therms ÷ 12) |
> | Enrollment | 1,507 students | **Real** — NCES CCD 2024-25 (ID 530771001171) |
> | Bus miles/week | — | **Estimated** — national average per-student factor (EPA) |
> | % students driven | — | **Estimated** — national average |
> | Daily meals served | — | **Estimated** — national average |
> | Monthly water (m³) | — | **Estimated** — national average |
> | Landfill bags/week | — | **Estimated** — national average |

---

## Hook · 0:00 – 0:30 · The problem

**What's on screen:** School Footprint card. Nothing else.

> *"Most eco apps track student behavior. They count the bike rides and the recycled bottles.
> But Garfield High School emits 47 tonnes of CO₂ every month from its energy bill alone — and
> nobody was showing students that number. We built EcoRise because the problem was never the
> students. It was the school."*

**Beats:**
1. Let the `Xt CO₂e / mo` headline sit for 3 seconds. Don't click anything.
2. Sweep down the category bars. Point at the flame icon on the top bar: *"That's the biggest emitter."*

---

## Solution · 0:30 – 2:00 · The AI approach

**What to show:** Stay on School Footprint. Click **Update school data**, enter real numbers, save.
Then scroll to **Action leverage** and **Next step**.

### 0:30 – 1:00 · The data → confident footprint

> *"A teacher pulls up last month's utility bill. 42,000 kWh. 310 therms. 1,400 meals a day.
> Fill in what you know — the model fills the rest from national EPA averages. Watch the
> confidence jump from low to high."*

**Enter these demo values:**
| Field | Value |
|---|---|
| Electricity (kWh/mo) | `42000` |
| Gas (therms/mo) | `310` |
| Bus miles/week | `620` |
| Meals served/day | `1400` |

Click **Save baseline** → toast fires → card reloads with `high` confidence chip.

### 1:00 – 1:30 · The leverage ratio

> *"Here's the insight that drives Direction B. Every student biking one day saves about
> 1.2 kg. The school's energy bill emits 38 tonnes a month. Student action is real — but
> it's a rounding error until someone fixes the HVAC schedule. That's what the leverage
> panel shows."*

Point at `leverage.message`. Read the kg-vs-tonnes ratio aloud.

### 1:30 – 2:00 · The AI recommendation + faithfulness gate

Scroll to the **Next step** card (sparkle icon, dark background).

> *"The AI generated a recommendation. But it only appeared here because it scored 0.82 on
> our faithfulness gate — a check against the source corpus. Below the recommendation: the
> grounding score and the actual citation. The LLM did not invent a number. A deterministic
> engine computed it from an EPA factor."*

Point: recommendation headline → explanation → source chip → `?` help tip (grounding score).

> **AI layer note for judges:** `COACH_ENABLED=true` activates RAG retrieval over a
> 1,000-paper corpus using sqlite-vec embeddings, then scores every candidate answer against
> retrieved sources. Threshold is 0.75 — below that the coach withholds rather than guesses.
> Run `npm run test:coach-eval` to re-generate the live eval metrics.

---

## Demo · 2:00 – 4:00 · Show it working

### 2:00 – 2:30 · Log an action → Evidence Panel

- Tap **Log action**, add a photo (bike or LED swap).
- Walk the Evidence Panel: **AI detected** + confidence ring → **Carbon math** (formula +
  cited factor + range) → **Points awarded** → **AI pipeline · tools run** → **Integrity checks**.

> *"The vision model perceived the action. The kilograms came from a cited EPA factor.
> The points were scored server-side. The LLM cannot award a point."*

### 2:30 – 3:00 · Human-in-the-loop approval gate

Return to School Footprint insights dashboard.

> *"Every recommendation requires a named staff member to approve it before it becomes
> active. That is a hard constraint, not a UX choice — because wrong cafeteria orders
> affect 1,400 lunches."*

Show **Flag as Inaccurate** on a prediction card.

> *"Staff can flag predictions wrong. Repeated flags surface as a model-review signal.
> They don't just consume outputs — they correct the model."*

### 3:00 – 3:30 · AI report card (Research tab)

Open **Research** tab → scroll to eval metrics.

> *"These are live numbers from our eval harness — re-run with `npm run test:coach-eval`.
> Not hardcoded. Faithfulness pass rate, citation validity, hallucination rate,
> injection resistance, Recall@k. The refusal card: if a question can't be grounded,
> the coach withholds rather than guesses."*

### 3:30 – 4:00 · Quests driven by footprint analysis

Navigate to **Quests**.

> *"Quest categories are ranked by the school's top emitter. When energy is the biggest
> source, energy quests surface first. The footprint analysis drives what students are
> asked to do — not the other way around."*

---

## Impact · 4:00 – 4:30 · Who benefits

**Stay on Quests or return to Footprint card.**

> *"Three groups benefit directly. Teachers get an auditable, cited baseline they can
> hand to a facilities manager — not an AI guess. Students get quests ranked by actual
> impact, not engagement optimization. And administrators get an approval gate and an
> eval harness they can point to when a parent asks how the AI makes decisions.*
>
> *This is one school. The same model runs for any school that enters its utility data.
> The hidden footprint becomes visible. The leverage ratio becomes actionable."*

---

## If the live demo fails

- No network / no key → app already runs offline; point at the "DEMO — no model" badge.
  Nothing is faked.
- Total failure → play the recorded fallback video (see [`DEPLOY.md`](DEPLOY.md)).
