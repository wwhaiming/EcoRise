# EcoRise — Demo Video Script (voiceover + screen recording)

**Format:** a *virtual* demo — record silent screen clips per scene, record the voiceover (VO)
separately, then assemble in your editor. Timestamps are pacing targets, not hard cuts.
**Target runtime:** ~3:30 (trim to the USAII submission cap). **Aspect:** record the app in the
mobile device frame; 1080×1920 portrait reads best for a school app.

> **The one line the video must land:** *A student biking to school saves ~1.2 kg of CO₂.
> Garfield High emits ~186 tonnes a month — over 150,000 bike rides. EcoRise shows students that
> gap, points the school at its biggest lever, and only lets the AI speak when it can be grounded
> and a human approves it.*

---

## How to use this script

1. **Capture** each scene's `SCREEN:` action as a clean silent screen recording (no mic).
2. **Record** the `VO:` lines as one continuous voiceover track (or per-scene; see VO tips).
3. **Assemble:** lay VO first, cut screen clips to match. Add the `ON-SCREEN TEXT:` captions.
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
- Record in the mobile device frame. Hide the cursor where possible; move slowly and deliberately
  (you'll cut to the VO, so smooth beats > fast clicks).

---

## Shot list

### Scene 1 · 0:00 – 0:25 · Cold open: the contradiction
- **SCREEN:** School Footprint card, fully loaded. Hold still 3s on the `≈186 t CO₂e / mo`
  headline. Slowly sweep down the category bars; rest on the top (coral) bar — cafeteria food.
- **VO:** *"One screen, one contradiction. A student biking to school instead of a short car ride
  saves about a kilogram of CO₂. Garfield High emits about 186 tonnes a month — more than a
  hundred and fifty thousand bike rides. Direction B asks for the school's hidden footprint.
  This is it."*
- **ON-SCREEN TEXT:** `1.2 kg  vs  186,000 kg / month` → then `≈ 150,000 bike rides`

### Scene 2 · 0:25 – 1:00 · Real where we have it, honest where we don't
- **SCREEN:** Stay on the card. Slowly highlight the **Electricity** and **Heating (gas)** rows
  (the real ones), then the confidence label reading **LOW**.
- **VO:** *"Electricity and gas — about 82 tonnes — are real, straight from Seattle Public
  Schools' utility dashboard. The other categories are EPA national-average estimates, and the app
  says so. Overall confidence reads low, and it stays low until a teacher enters real meals, buses,
  and water. EcoRise refuses to fake precision — and it points you at the number worth verifying
  next."*
- **ON-SCREEN TEXT:** `Energy = real (Seattle Public Schools)` · `4 of 6 = labeled estimates` · `confidence: LOW by design`

### Scene 3 · 1:00 – 1:35 · The leverage ratio (the core idea)
- **SCREEN:** Scroll to the **Action leverage** panel. Hold on `leverage.message`.
- **VO:** *"Here's the idea that defines Direction B. EcoRise doesn't make students guess what
  matters — it computes the leverage ratio: individual action on one side, the school's
  institutional emissions on the other. Small actions aren't shamed; students are shown where their
  voice moves the biggest number. The biggest lever is institutional, not individual."*
- **ON-SCREEN TEXT:** `Leverage = your action ÷ the school's biggest emitter`

### Scene 4 · 1:35 – 2:25 · AI-drafted, not AI-trusted
- **SCREEN:** Scroll to the **Next step** card. Hover the **`?`** to reveal the grounding score +
  citation. Then open **Assign**, pick **Cafeteria Manager** (or Facilities Director) from the
  dropdown; rest on the **✓ Approve — Make Active Goal** button. Briefly show the anomaly card's
  **"Deterministic — no LLM"** help tip.
- **VO:** *"This recommendation only appeared because it passed a grounding check — you can see the
  score and the cited source. The carbon number came from deterministic math; the AI just drafted
  the language. In fact — the AI retrieves evidence and drafts words. It does not compute the
  emissions, award the points, approve the action, or publish the change. And even after it passes
  the gate, it's only proposed. A named staff role has to approve it before it becomes a school
  goal. A wrong cafeteria order affects fifteen hundred lunches — so a human owns that call."*
- **ON-SCREEN TEXT:** `Grounding 0.82 ≥ 0.75 ✓` · `Deterministic math · cited source · human approval`

### Scene 5 · 2:25 – 3:05 · The proof: the AI says nothing (the money shot)
- **SCREEN:** Research tab → **"Ask a question…"** box. Type **`Who won the 2022 World Cup?`** and
  submit. Hold on the response: **"No grounded answer found in the corpus."** Then pan the eval
  metrics (faithfulness pass, citation validity, hallucination rate, refusal rate, injection).
- **VO:** *"This is the screen that matters most. Ask it something outside its evidence, and it
  doesn't improvise — it refuses. The AI is allowed to say nothing. The same gate that just refused
  this is the gate that lets a recommendation through only when it's grounded. And we measure it —
  these are live numbers from our eval harness, not hardcoded."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `eval harness · re-runnable`

### Scene 6 · 3:05 – 3:30 · Impact + scale + close
- **SCREEN:** Cut back to the Footprint card; optionally a quick wipe across Quests.
- **VO:** *"Teachers get an auditable, cited baseline. Students get quests ranked by real impact,
  not engagement bait. Administrators get an approval gate and an eval harness they can point to
  when a parent asks how the AI decides. One school today; a district is the same pipeline repeated.
  One-point-two kilograms versus 186 tonnes — we made the school see the difference, and made the
  AI earn the right to recommend the fix."*
- **ON-SCREEN TEXT:** `EcoRise — see the hidden footprint. Act on the real lever.`

---

## VO recording tips

- Read **slower than feels natural** — recorded VO always sounds rushed on playback.
- One thought per breath. Let the two big numbers (1.2 kg / 186 tonnes) breathe with a beat of
  silence; the edit can hold the screen there.
- Record in a soft room (closet / under a blanket kills echo). One clean take per scene beats one
  long take — easier to re-do a flub.
- Keep energy up on the cold open and the refusal scene; those carry the video.

## Edit / assembly notes

- Lay the VO first; cut screen clips to land each key word on the matching screen (the number
  appears as you say it).
- Captions: keep `ON-SCREEN TEXT` short, high-contrast, bottom third. They make the video work
  even muted (judges often scrub silently first).
- Light, neutral background music at ~15–20% under the VO; duck it during the two big numbers.
- Export 1080×1920 (portrait) or 1080p landscape per the submission portal. Keep under the
  USAII length cap; if you must trim, cut Scene 2 detail first, never Scene 5.
- Upload unlisted (YouTube/Loom) and paste the link into the README + submission form.

## Optional B-roll (only if you need a longer cut)

- **Log action → Evidence Panel** (photo → AI-detected → cited carbon math → server-scored points)
  — the student-behavior side; shows what a student actually does.
- **Quests** ranked by the school's top emitter (footprint drives gamification).
- **Privacy Center** (tenant isolation, consent flow, school-level aggregate data, not student PII)
  — useful if the written submission asks about FERPA/COPPA.

## Honesty guardrails for the VO (do not overclaim)

- Energy is **real**; the other four categories are **estimates** — never call the whole footprint
  "real." Cafeteria is the biggest *line* but it's an *estimate* (say "largest line," not "measured").
- "Injection resistance" = the eval harness's **pass rate on tested cases**, not perfect safety.
- The corpus is a **curated evidence set**, not "the internet." The on-screen citation backs it.
