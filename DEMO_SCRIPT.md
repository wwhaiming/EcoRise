# EcoRise: Demo Video Script (voiceover + screen recording, 5:00)

**Format:** a *virtual* demo. Record silent screen clips per scene with **Screen Studio** (macOS),
record the voiceover (VO) separately, then assemble in your editor. Timestamps are pacing targets,
not hard cuts. **Target runtime:** **~5:00** (8 scenes). To cut to ~3:30, drop Scene 6 and thin
Scene 7, but never cut Scene 4 or Scene 5. **Aspect:** mobile device frame, 1080×1920 portrait.

> **The one line the video must land:** *A student biking to school saves about 1.2 kg of CO₂,
> while Garfield High emits roughly 186 tonnes a month, the equivalent of over 150,000 bike rides.
> EcoRise shows students that gap, ranks the institutional fixes that actually close it, and only
> lets the AI speak when it can be grounded and a human approves it.*

---

## Screen Studio setup (read first, it changes how you film)

Screen Studio auto-zooms toward each click, eases the cursor, and adds click highlights. Design the
capture around that instead of fighting it:

- **The golden rhythm: click once, pause 1 to 1.5 seconds for the zoom to settle, then let the VO
  hit the key word.** Every key number should be the thing you click, so the auto-zoom lands on it.
- **One deliberate action at a time.** No circling the cursor, no fast wheel-scrolling, no double
  navigations. Erratic motion makes the auto-zoom lurch.
- **Scroll at most once per scene** to place the target panel in the vertical center, then click.
- **Let the zoom do the emphasis.** Because Screen Studio already spotlights each click, use *fewer*
  captions (see each scene), or the screen gets noisy.
- **Settings:** subtle solid or soft-gradient background, moderate padding, cursor size up one notch,
  click highlights on but gentle, auto-zoom on.
- It is edited, so **capture order need not match scene order.** Film the cleanest take of each beat;
  arrange in the timeline afterward.

---

## How to use this script

1. **Capture** each scene's `SCREEN:` action as a clean silent Screen Studio clip.
2. **Record** the `VO:` lines as a continuous voiceover, or per scene (see VO tips).
3. **Assemble:** lay the VO first, cut the clips to match, then add the `ON-SCREEN TEXT:` captions.
4. Keep the numbers exactly as below. They are computed from the real seed, not invented.

---

## Verified numbers (editor reference, keep accurate)

| Category | ~t CO₂e / mo | Data |
|---|---:|---|
| **Cafeteria food** (biggest line) | **60.3** | EPA per-meal estimate, *labeled low confidence* |
| Electricity | 57.2 | **Real**, Seattle Public Schools utility dashboard |
| Student/staff commuting | 42.5 | EPA estimate |
| Heating (natural gas) | 25.3 | **Real**, same dashboard |
| Landfill waste / Water | 0.8 / 0.2 | EPA estimate |
| **Total** | **≈186** | overall confidence **LOW** (only 2 of 6 categories real) |

Real energy is about **82 t** (electricity plus gas), from the Seattle Public Schools dashboard,
Garfield HS CY2023 (143,083 kWh/mo; 4,766 therms/mo; enrollment 1,507, NCES CCD 530771001171).
1.2 kg is roughly one 3-mile car trip avoided (EPA 0.40 kg/mi). Grounding threshold is **0.75**,
example score around 0.82. The footprint headline reads in tonnes; category bars read in kg/mo. The
eval report is a small **illustrative** set (a handful of answerable, unanswerable, and injection
probes), not a large benchmark; say so on camera.

---

## Pre-record capture setup (do once, before filming)

```bash
# Terminal 1: seed the coach corpus FIRST
cd backend && COACH_ENABLED=true npm run seed:coach
# Terminal 2: seed the board + login, run the app
COACH_ENABLED=true npm run demo
```

- Log in as `demo@ecorise.app` (password printed by the seed). Board: **Garfield High School**.
- The footprint baseline is pre-seeded with real Seattle energy.
- Open **Learning → AI Insights** and confirm the **ranked action plan** shows, per action, a kg/mo
  impact, a **cost band · effort** line, and a **"Verify by"** metric, with an **Approve** control.
  This panel runs on the synthetic utility CSVs (sample provided) and labels itself a synthetic
  sandbox, not a pilot. If it is empty, re-run `npm run seed:footprint`.
- Confirm the **Next step** card shows a real grounded recommendation, not the DEV "Demo fixture".
- Pick your bike or LED photo into the file dialog *before* the Scene 7 take, so the file picker
  never appears in the capture.

---

## Shot list (8 scenes, ~5:00)

### Scene 1 · 0:00 – 0:30 · Cold open: the contradiction
- **SCREEN:** Start already on the School Footprint card. Click once directly on the `≈186 t CO₂e / mo`
  headline and hold 3 seconds while the zoom settles. Then click the top (coral) cafeteria food bar
  and hold 2 seconds. Do not scroll during the opening sentence.
- **VO:** *"Most school sustainability apps focus on what students do, like the bike rides and the
  recycled bottles. But the real story is a contradiction. When a student bikes to school instead of
  taking a short car ride, they save a little over a kilogram of CO₂. Garfield High, meanwhile,
  emits roughly 186 tonnes every single month, which works out to more than a hundred and fifty
  thousand of those bike rides. Direction B asks us to find the school's hidden footprint, and this
  is exactly what that looks like."*
- **ON-SCREEN TEXT:** `1.2 kg  vs  186,000 kg / month`

### Scene 2 · 0:30 – 1:10 · Honest data, and a footprint that improves
- **SCREEN:** Click the Electricity row, pause. Click the Heating (gas) row, pause. Click the **LOW**
  confidence label, hold. Then click **Update school data** and enter real local inputs for **meals
  per day, commute share, and water** (energy is already pre-seeded). **Save**, and hold on the
  overall confidence chip as it climbs from **LOW to MEDIUM**. *(The model needs at least four of six
  categories provided to reach MEDIUM, so enter all three, not just meals.)*
- **VO:** *"We are honest about where these numbers come from. The electricity and gas figures, which
  add up to about 82 tonnes, are real, pulled straight from Seattle Public Schools' public utility
  dashboard. The other categories are national-average estimates from the EPA, and the app says so:
  overall confidence reads low on purpose. But it is not stuck there. Now we add real local inputs
  for meals, commute share, and water, on top of the measured electricity and gas. That moves four of
  six categories from defaults to school-provided data, so the confidence moves from low to medium.
  The footprint gets more trustworthy the moment the school feeds it real numbers, and it always
  tells you which one to verify next."*
- **ON-SCREEN TEXT:** `Energy = measured public data` · `add real inputs → confidence LOW → MEDIUM`

### Scene 3 · 1:10 – 1:45 · The leverage ratio (the core idea)
- **SCREEN:** Scroll once to center the **Action leverage** panel. Click the leverage message and
  hold through the first sentence. End centered on that computed comparison.
- **VO:** *"This next idea is what the whole product is built around, and we call it the leverage
  ratio. Instead of asking students to guess what matters, EcoRise weighs one student's action
  against the school's institutional emissions and computes the gap between them. Small actions still
  matter, but the app shows students when their effort is best aimed at changing the system around
  them, because the largest lever in a school is almost never individual. It is institutional. So the
  obvious question is, what should the school actually do."*
- **ON-SCREEN TEXT:** `Leverage: one student action  vs  the school's biggest line`

### Scene 4 · 1:45 – 2:45 · From insight to decision (the decision engine + governance)
- **SCREEN:** Go to the **Learning** tab and open the **AI Insights** action plan. On the top ranked
  action, click `~X kg/mo`, pause. Click its **cost band · effort** line, pause. Click **Verify by:
  <metric>**, pause. Click the **status chips** (proposed → approved → verified), pause. Click
  **Approve** on one action, then on the now-approved action click into the **record measured
  before/after** row so the verification step is visible. (Optional second clip: the coach **Next
  step** card, where the `?` reveals the grounding score and citation.)
- **VO:** *"This is where the leverage idea becomes a decision rather than a slogan. EcoRise ranks
  concrete institutional actions by how much carbon each one avoids per month, and for every action
  it shows the cost band, the effort, the staff role that owns it, and the exact metric you would
  check to confirm it worked. Once a fix is approved, staff can record the real before and after, so
  the system tracks measured outcomes, not just predictions. And the wording is AI-drafted but not
  AI-trusted: every recommendation is grounded against cited sources before it appears. To put it
  plainly, the AI retrieves evidence and drafts language. It does not compute the emissions, it does
  not award the points, it does not approve the action, and it does not publish anything. Each action
  stays a proposal until a named staff member signs off."*
- **ON-SCREEN TEXT:** `ranked by CO₂e/mo · cost · effort · verify-by · owner` · `grounded · human-approved · measured`

### Scene 5 · 2:45 – 3:30 · The proof: the AI says nothing (the money shot)
- **SCREEN:** Be on the Research tab before recording. Click the **"Ask a question…"** box, type
  **`Who won the 2022 World Cup?`**, and submit. When **"No grounded answer found in the corpus."**
  appears, **do nothing for 4 full seconds.** Then, for the harder case, ask a plausible but
  unsupported in-domain question such as **`What exact percent will meatless Mondays cut Garfield's emissions?`**
  and show it refuse or hedge to cited sources rather than invent a number. *(Rehearse this second
  prompt beforehand: if it ever answers instead of refusing, drop it and keep only the off-domain
  one.)* Then click-zoom the eval report card: faithfulness, citation validity, refusal rate,
  hallucination rate.
- **VO:** *"This is the screen that matters most to me. When you ask the coach something outside its
  evidence, it does not improvise an answer. It simply refuses, because the AI is allowed to say
  nothing. That same gate, the one that just turned this question away, is what lets a recommendation
  through only when it is properly grounded. And we do not just assert that it works, we measure it,
  and we are honest about the scale. This is a small, illustrative eval set, not a giant benchmark.
  The first question was the easy case, but you just saw a harder one too: a plausible, school-specific
  question that it still refuses to answer with a made-up number. The set also includes prompt-injection
  probes, and the whole thing is re-runnable, so we can show the failures too, not only the wins."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `measured on a re-runnable eval set`

### Scene 6 · 3:30 – 4:00 · How it works (the pipeline), *first to cut for a 3:30 edit*
- **SCREEN:** Frame the **AI pipeline · tools run** panel so most steps are visible at once (this is
  the same evidence panel from Scene 7; capture it there and place the clip here). Click each
  pipeline row in order, pausing after each, without scrolling.
- **VO:** *"Underneath all of this is a pipeline rather than a chatbot. A deterministic engine reads
  the school's data, flags unusual readings, forecasts the month ahead, and calculates every carbon
  figure from a cited factor. Only then does retrieval pull supporting research, the model drafts a
  recommendation, and a faithfulness check scores that draft against its sources. Pass, and a human
  approves it. Fail, and it is quietly withheld. Five steps the model never gets to skip."*
- **ON-SCREEN TEXT:** `deterministic math → retrieval → draft → faithfulness gate → human approval`

### Scene 7 · 4:00 – 4:35 · The student side closes the loop
- **SCREEN:** Click **Log action**, pause. Click the upload control (photo pre-selected). After it
  submits, click-zoom two things only: the **AI-detected** label with the carbon math, and the
  **points awarded**. Then click **Quests** and click the top quest tied to the biggest emitter.
- **VO:** *"Students still have a real role, and it has to be just as honest as everything else. When
  someone logs an action, a vision model identifies the photo, but the kilograms come from the same
  cited factor, and the points are scored on the server. The AI can describe an action, but it can
  never award itself a single point. And the quests students see are ranked by the school's biggest
  emitter, so the footprint decides what we ask students to do, rather than the other way around."*
- **ON-SCREEN TEXT:** `vision detects · math is deterministic · points scored server-side`

### Scene 8 · 4:35 – 5:00 · Impact, scale, and the close
- **SCREEN:** Start on the Footprint card and click the `≈186 t CO₂e / mo` headline, pause. One
  navigation click into the Privacy center, click its student-data headline, pause. Return to the
  Footprint card and click the `≈186 t CO₂e / mo` headline again for the final line. End with the
  number centered, not mid-transition.
- **VO:** *"In the end, every group gets something they can actually rely on. Teachers get an
  auditable, cited baseline. Students get quests ranked by real impact instead of engagement.
  Administrators get a ranked action plan, an approval gate, an evaluation harness, and a privacy
  center built around student data. It works for one school today, and a district is simply the same
  pipeline repeated. One point two kilograms against 186 tonnes. EcoRise made the school see that
  difference, and made the AI earn the right to recommend the fix."*
- **ON-SCREEN TEXT:** `EcoRise: see the hidden footprint. Act on the real lever.`

---

## VO recording tips

- Read a little slower than feels natural, since recorded voiceover always sounds rushed on playback.
  Aim for roughly 145 to 155 words per minute.
- Keep one thought per breath, and let the two big numbers (1.2 kg and 186 tonnes) breathe while the
  edit holds the screen on them.
- Record in a soft room. A closet or a space under a blanket kills echo. One clean take per scene is
  easier to fix than a single long take.
- Keep your energy highest on Scene 1, Scene 4, and Scene 5, because those three carry the video.

## Edit / assembly notes

- Lay the VO down first, then cut the clips so each key word lands on the matching screen, with the
  number appearing as the auto-zoom settles on it.
- Keep captions short, high contrast, and in the bottom third, so the video still works on mute, since
  judges often scrub silently before turning the sound on. Let Screen Studio's zoom carry the rest.
- Run light, neutral music at about 15 to 20 percent under the VO, and duck it during the two big
  numbers and the refusal line.
- Export at 1080×1920 portrait, or 1080p landscape if the portal prefers it, and stay under the USAII
  length cap.
- For a tighter 3:30 cut, drop Scene 6 first, then thin Scene 7. Never cut Scene 4 or Scene 5.
- Upload it unlisted (YouTube or Loom) and paste the link into the README and the submission form.

## Honesty guardrails for the VO (do not overclaim)

- Energy is real, but the other four categories are estimates, so never call the whole footprint
  "real." Cafeteria food is the biggest line, yet it is an estimate, so say "largest line," not
  "largest measured." When you raise confidence in Scene 2, say a category went from estimate to a
  real input, not that the whole footprint is now verified.
- The eval report is a small illustrative set, not a benchmark. Frame the metrics as "measured on our
  test cases, and re-runnable," and offer the failures, not just the passing numbers. Do not headline
  any single percentage as proof of perfect safety.
- The AI Insights action plan is a labeled **synthetic sandbox** that imports sample utility CSVs to
  demonstrate the ranked-action and measured-verification pathway. Present it as the pathway, not as
  Garfield's live operating plan, and let its on-screen "synthetic sandbox" label stay visible.
- The recommendation impact range and projected figures are estimates with a confidence range, plus a
  named owner. Present them as decision support for staff, not guarantees.
- The corpus is a curated evidence set, not the open internet, and the on-screen citation backs it.
