# EcoRise — Demo Video Script (voiceover + screen recording · 5:00)

**Format:** a *virtual* demo — record silent screen clips per scene, record the voiceover (VO)
separately, then assemble in your editor. Timestamps are pacing targets, not hard cuts.
**Target runtime:** **~5:00** (8 scenes). To cut down to ~3:30, drop Scenes 6 and 7 (the deep
cut); never cut Scene 5. **Aspect:** record the app in the mobile device frame; 1080×1920 portrait.

> **The one line the video must land:** *A student biking to school saves ~1.2 kg of CO₂.
> Garfield High emits ~186 tonnes a month — over 150,000 bike rides. EcoRise shows students that
> gap, points the school at its biggest lever, and only lets the AI speak when it can be grounded
> and a human approves it.*

---

## How to use this script

1. **Capture** each scene's `SCREEN:` action as a clean silent screen recording (no mic).
2. **Record** the `VO:` lines as a continuous voiceover (or per-scene; see VO tips).
3. **Assemble:** lay VO first, cut screen clips to match, add the `ON-SCREEN TEXT:` captions.
4. Keep the numbers exactly as below — they're computed from the real seed, not invented.

---

## Verified numbers (editor reference — keep accurate)

| Category | ~t CO₂e / mo | Data |
|---|---:|---|
| **Cafeteria food** (biggest line) | **60.3** | EPA per-meal estimate — *labeled low confidence* |
| Electricity | 57.2 | **Real** — Seattle Public Schools utility dashboard |
| Student/staff commuting | 42.5 | EPA estimate |
| Heating (natural gas) | 25.3 | **Real** — same dashboard |
| Landfill waste / Water | 0.8 / 0.2 | EPA estimate |
| **Total** | **≈186** | overall confidence **LOW** (only 2 of 6 categories real) |

Real energy = **~82 t** (electricity + gas), Seattle Public Schools dashboard, Garfield HS CY2023
(143,083 kWh/mo; 4,766 therms/mo; enrollment 1,507, NCES CCD 530771001171). 1.2 kg ≈ one ~3-mile
car trip avoided (EPA 0.40 kg/mi). Grounding threshold **0.75**; example score ~0.82.

---

## Pre-record capture setup (do once, before filming)

```bash
# Terminal 1 — seed the coach corpus FIRST
cd backend && COACH_ENABLED=true npm run seed:coach
# Terminal 2 — seed the board + login, run the app
COACH_ENABLED=true npm run demo
```

- Log in as `demo@ecorise.app` (password printed by the seed). Board: **Garfield High School**.
- Footprint baseline is pre-seeded (real Seattle energy). Confirm the **Next step** card shows a
  real recommendation, not the DEV "Demo fixture" placeholder.
- Have one photo ready (a bike or an LED bulb) for the Scene 7 Log-action upload.
- Record in the mobile device frame. Move slowly and deliberately — you'll cut to the VO, so smooth
  beats beat fast clicks.

---

## Shot list (8 scenes → ~5:00)

### Scene 1 · 0:00 – 0:30 · Cold open: the contradiction
- **SCREEN:** School Footprint card, fully loaded. Hold 3s on the `≈186 t CO₂e / mo` headline.
  Slowly sweep the category bars; rest on the top (coral) bar — cafeteria food.
- **VO:** *"Most school sustainability apps count what students do — the bike rides, the recycled
  bottles. But here's the contradiction. A student biking to school instead of a short car ride
  saves about a kilogram of CO₂. Garfield High emits about 186 tonnes a month — more than a hundred
  and fifty thousand bike rides. Direction B asks for the school's hidden footprint. This is it."*
- **ON-SCREEN TEXT:** `1.2 kg  vs  186,000 kg / month` → `≈ 150,000 bike rides`

### Scene 2 · 0:30 – 1:05 · Real where we have it, honest where we don't
- **SCREEN:** Highlight the **Electricity** and **Heating (gas)** rows, then the confidence label
  reading **LOW**.
- **VO:** *"And we're honest about the data. Electricity and gas — about 82 tonnes — are real,
  straight from Seattle Public Schools' utility dashboard. The other categories are EPA
  national-average estimates, and the app says so. Overall confidence reads low, and it stays low
  until a teacher enters real meals, buses, and water. EcoRise refuses to fake precision — and it
  points you at the exact number worth verifying next."*
- **ON-SCREEN TEXT:** `Energy = real (Seattle Public Schools)` · `4 of 6 = labeled estimates` · `confidence: LOW by design`

### Scene 3 · 1:05 – 1:45 · The leverage ratio (the core idea)
- **SCREEN:** Scroll to the **Action leverage** panel. Hold on `leverage.message`.
- **VO:** *"Here's the idea that defines the whole product — the leverage ratio. EcoRise doesn't
  make students guess what matters. It puts individual action on one side and the school's
  institutional emissions on the other, and computes the gap. Small actions aren't shamed — students
  are simply shown where their voice moves the biggest number. Because the biggest lever isn't
  individual. It's institutional."*
- **ON-SCREEN TEXT:** `Leverage = your action ÷ the school's biggest emitter`

### Scene 4 · 1:45 – 2:35 · AI-drafted, not AI-trusted
- **SCREEN:** Scroll to the **Next step** card. Hover the **`?`** to reveal the grounding score +
  citation. Open **Assign**, pick **Cafeteria Manager** (or Facilities Director); rest on
  **✓ Approve — Make Active Goal**.
- **VO:** *"So the AI makes a recommendation — but watch how little we trust it. This card only
  appeared because it passed a grounding check; you can see the score and the cited source. The
  carbon number came from deterministic math — the AI just drafted the language. Say that plainly:
  the AI retrieves evidence and drafts words. It does not compute the emissions, award the points,
  approve the action, or publish the change. And even after it passes the gate, it's only proposed.
  A named staff role has to approve it before it becomes a school goal — because a wrong cafeteria
  order affects fifteen hundred lunches."*
- **ON-SCREEN TEXT:** `Grounding 0.82 ≥ 0.75 ✓` · `deterministic math · cited source · human approval`

### Scene 5 · 2:35 – 3:15 · The proof: the AI says nothing (the money shot)
- **SCREEN:** Research tab → **"Ask a question…"** box. Type **`Who won the 2022 World Cup?`** and
  submit. Hold on **"No grounded answer found in the corpus."** Then pan the eval metrics
  (faithfulness pass, citation validity, hallucination rate, refusal rate, injection).
- **VO:** *"This is the screen that matters most. Ask it something outside its evidence, and it
  doesn't improvise — it refuses. The AI is allowed to say nothing. The same gate that just refused
  this is the gate that lets a recommendation through only when it's grounded. And we don't just
  claim it — we measure it. These are live numbers from our eval harness: faithfulness, citation
  validity, hallucination rate, refusal rate. Re-runnable, not hardcoded."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `eval harness · re-runnable`

### Scene 6 · 3:15 – 3:55 · How it works (the pipeline)
- **SCREEN:** Show the **AI pipeline · tools run** section of an Evidence panel (or the AI-evidence
  card). Slowly reveal each step.
- **VO:** *"Under the hood, it's a pipeline, not a chatbot. A deterministic engine reads the school
  data, flags anomalies with a z-score, forecasts next month, and computes every carbon number from
  a cited EPA factor. Only then does retrieval pull supporting research from a curated evidence
  corpus, the model drafts a recommendation, and a faithfulness gate scores it against those
  sources. Pass, and a human approves it. Fail, and it's withheld. Five steps the model never gets
  to skip."*
- **ON-SCREEN TEXT:** `deterministic math → retrieval → draft → faithfulness gate → human approval`

### Scene 7 · 3:55 – 4:35 · The student side closes the loop
- **SCREEN:** Tap **Log action**, upload the bike/LED photo. Walk the **Evidence panel**: AI
  detected + confidence ring → Carbon math (formula + cited factor + range) → Points awarded →
  Integrity checks. Then cut to **Quests** ranked by the top emitter.
- **VO:** *"Students still have a role — it just has to be honest too. Log an action, and a vision
  model identifies it, but the kilograms come from the same cited factor, and the points are scored
  on the server — the AI can describe an action, it can't award itself a point. And the quests
  students see are ranked by the school's biggest emitter. The footprint decides what we ask
  students to do — not the other way around."*
- **ON-SCREEN TEXT:** `vision detects · cited carbon math · server-scored points` · `quests ranked by real impact`

### Scene 8 · 4:35 – 5:00 · Impact, scale, and the close
- **SCREEN:** Cut back to the Footprint card; quick wipe across the Privacy center, then end on the
  headline number.
- **VO:** *"Teachers get an auditable, cited baseline. Students get quests ranked by real impact.
  Administrators get an approval gate, an eval harness, and a privacy center built for student data.
  One school today; a district is the same pipeline repeated. One-point-two kilograms versus 186
  tonnes — EcoRise made the school see the difference, and made the AI earn the right to recommend
  the fix."*
- **ON-SCREEN TEXT:** `EcoRise — see the hidden footprint. Act on the real lever.`

---

## VO recording tips

- Read **slower than feels natural** — recorded VO always sounds rushed on playback. ~145–155 wpm.
- One thought per breath. Let the two big numbers (1.2 kg / 186 tonnes) breathe; hold the screen there.
- Soft room (closet / under a blanket kills echo). One clean take per scene beats one long take.
- Keep energy highest on Scene 1 (cold open) and Scene 5 (refusal) — they carry the video.

## Edit / assembly notes

- Lay the VO first; cut screen clips so each key word lands on the matching screen (number appears as you say it).
- Captions short, high-contrast, bottom third — the video must work muted (judges scrub silently first).
- Light neutral music ~15–20% under the VO; duck it during the two big numbers and the refusal line.
- Export 1080×1920 portrait (or 1080p landscape per the portal). Keep under the USAII length cap.
- Trim order if you must shorten: Scene 6 first, then Scene 7. **Never cut Scene 5.**
- Upload unlisted (YouTube/Loom); paste the link into the README + submission form.

## Honesty guardrails for the VO (do not overclaim)

- Energy is **real**; the other four categories are **estimates** — never call the whole footprint
  "real." Cafeteria is the biggest *line* but it's an *estimate* (say "largest line," not "measured").
- "Injection resistance" = the eval harness's **pass rate on tested cases**, not perfect safety.
- The corpus is a **curated evidence set**, not "the internet." The on-screen citation backs it.
