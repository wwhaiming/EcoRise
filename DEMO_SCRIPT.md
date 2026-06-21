# EcoRise: Demo Video Script (voiceover + screen recording, 5:00)

**Built for the ecology / environmental-science classroom.** EcoRise is a tool an
environmental-science class actually uses: students see their own school's real carbon
footprint, learn from a bank of a thousand real research papers, and turn that into
cited, teacher-approved action. This is the audience the whole script speaks to.

**Format:** a *virtual* demo. Record silent screen clips per scene with **Screen Studio**
(macOS), record the voiceover (VO) separately, then assemble in your editor. Timestamps
are pacing targets, not hard cuts. **Target runtime:** **~5:00** (8 scenes). To cut to
~3:30, drop Scene 7 and thin Scene 4, but never cut Scene 5 or Scene 6. **Aspect:** mobile
device frame, 1080×1920 portrait.

> **The one line the video must land:** *A student biking to school saves about 1.2 kg of
> CO₂, while their school emits roughly 186 tonnes a month, the equivalent of over 150,000
> bike rides. EcoRise shows an environmental-science class that gap, grounds it in a thousand
> real research papers, and only lets the AI speak when it can cite its source and a human
> approves the action.*

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
1.2 kg is roughly one 3-mile car trip avoided (EPA 0.40 kg/mi). The **research paper bank holds
1,000 real research papers** (OpenAlex). Grounding threshold is **0.75**, example score ~0.82.
The footprint headline reads in tonnes; category bars read in kg/mo.

---

## Pre-record capture setup (do once, before filming)

```bash
# Terminal 1: seed BOTH the coach corpus and the 1,000-paper research bank FIRST
cd backend && COACH_ENABLED=true npm run seed:coach && npm run seed:research
# Terminal 2: seed the board + login, run the app
COACH_ENABLED=true npm run demo
```

- Log in as `demo@ecorise.app` (password printed by the seed). Board: **Garfield High School**.
- The footprint baseline is pre-seeded with real Seattle energy.
- **Confirm the Research tab is full:** Browse should list real papers and refresh on each click;
  Ask should return a cited answer. (If empty, re-run `npm run seed:research`.)
- Open **Learning -> AI Insights** and confirm the ranked action plan shows, per action, a kg/mo
  impact, a cost band + effort line, and a "Verify by" metric, with an Approve control.
- Pick your bike or LED photo into the file dialog *before* the Scene 7 take.

---

## Shot list (8 scenes, ~5:00)

### Scene 1 · 0:00 – 0:30 · Cold open: the contradiction every eco class hits
- **SCREEN:** Start already on the School Footprint card. Click once directly on the `≈186 t CO₂e / mo`
  headline and hold 3 seconds while the zoom settles. Then click the top (coral) cafeteria food bar
  and hold 2 seconds. Do not scroll during the opening sentence.
- **VO:** *"Every environmental-science class teaches students to shrink their footprint, with the
  bike rides and the recycled bottles. But here is the contradiction those classes run into. When a
  student bikes to school instead of taking a short car ride, they save a little over a kilogram of
  CO₂. Their school, meanwhile, emits about 186 tonnes every single month, which works out to more
  than a hundred and fifty thousand of those bike rides. EcoRise is built for that classroom, to
  surface the school's hidden footprint and show students where their effort actually counts."*
- **ON-SCREEN TEXT:** `1.2 kg  vs  186,000 kg / month`   ·   `built for the eco / env-science classroom`

### Scene 2 · 0:30 – 1:10 · Honest data, and a footprint that improves
- **SCREEN:** Click the Electricity row, pause. Click the Heating (gas) row, pause. Click the **LOW**
  confidence label, hold. Then click **Update school data** and enter real local inputs for **meals
  per day, commute share, and water** (energy is already pre-seeded). **Save**, and hold on the
  overall confidence chip as it climbs from **LOW to MEDIUM**. *(The model needs at least four of six
  categories provided to reach MEDIUM, so enter all three, not just meals.)*
- **VO:** *"A class can trust this because it is honest about its data. The electricity and gas
  figures, about 82 tonnes, are real, pulled straight from Seattle Public Schools' public utility
  dashboard. The other categories are national-average estimates from the EPA, and the app says so:
  overall confidence reads low on purpose. But it is not stuck there. When the class adds real local
  numbers for meals, commuting, and water, four of six categories move from defaults to school data,
  and the confidence climbs from low to medium. It is a live lesson in measurement and uncertainty,
  not a black box."*
- **ON-SCREEN TEXT:** `Energy = measured public data` · `add real inputs → confidence LOW → MEDIUM`

### Scene 3 · 1:10 – 1:45 · The leverage ratio (the core idea)
- **SCREEN:** Scroll once to center the **Action leverage** panel. Click the leverage message and
  hold through the first sentence. End centered on that computed comparison.
- **VO:** *"This next idea is what the whole product is built around, and we call it the leverage
  ratio. Instead of asking students to guess what matters, EcoRise weighs one student's action
  against the school's institutional emissions and computes the gap. Small actions still matter, but
  the class can see exactly when student effort is best aimed at changing the system around them,
  because the largest lever in a school is almost never individual. It is institutional. So the
  obvious question for the class becomes, what should the school actually do."*
- **ON-SCREEN TEXT:** `Leverage: one student action  vs  the school's biggest line`

### Scene 4 · 1:45 – 2:35 · From insight to decision (the decision engine + governance)
- **SCREEN:** Go to the **Learning** tab and open the **AI Insights** action plan. On the top ranked
  action, click `~X kg/mo`, pause. Click its **cost band · effort** line, pause. Click **Verify by:
  <metric>**, pause. Click the **status chips** (proposed → approved → verified), pause. Click
  **Approve** on one action, then on the now-approved action click into the **record measured
  before/after** row so the verification step is visible.
- **VO:** *"This is where the leverage idea becomes a decision rather than a slogan. EcoRise ranks
  concrete institutional actions by how much carbon each one avoids per month, and for every action
  it shows the cost band, the effort, the staff role that owns it, and the exact metric the class
  would check to confirm it worked. Once a fix is approved, staff record the real before and after,
  so students see measured outcomes, not just predictions. And the wording is AI-drafted but not
  AI-trusted. To put it plainly, the AI retrieves evidence and drafts language. It does not compute
  the emissions, award the points, approve the action, or publish anything. Each action stays a
  proposal until a named staff member signs off."*
- **ON-SCREEN TEXT:** `ranked by CO₂e/mo · cost · effort · verify-by · owner` · `human-approved · measured`

### Scene 5 · 2:35 – 3:25 · The research paper bank (the class's AI-powered library)
- **SCREEN:** Open the **Research** tab. Click **Browse** and hold on the list of papers; click Browse
  again so a fresh set loads. Click the **Ask a question…** box and ask an in-domain question such as
  **`Does biking instead of driving meaningfully cut emissions?`**; hold on the cited answer. Then on
  one paper click **Summarize** (hold on the plain-language key points), and **Visual** (hold on the
  infographic the AI extracts).
- **VO:** *"And the class is not learning in a vacuum. This is a research library of a thousand real
  papers built right into the app. Students can browse it, or ask a question and get an answer drawn
  only from those papers, always shown with its citation. They can have the AI summarize a dense
  study into plain-language key points, or turn it into a diagram of cause and effect. For an
  environmental-science class, that is a primary-source research bank with an AI tutor on top, so the
  footprint they are looking at is backed by the actual literature."*
- **ON-SCREEN TEXT:** `1,000 real research papers` · `ask · summarize · visualize` · `every answer cited`

### Scene 6 · 3:25 – 4:00 · The proof: the AI says nothing (responsible AI for the classroom)
- **SCREEN:** Still on the Research tab, click the **Ask a question…** box and ask a question outside
  the corpus: **`Who won the 2022 World Cup?`**, submit, and when **"No grounded answer found in the
  corpus."** appears, **do nothing for 4 full seconds.** *(Optional harder probe, rehearse first: ask
  `What exact percent will meatless Mondays cut our school's emissions?` and show it refuse rather than
  invent a number; if it ever answers, drop it.)* Then click-zoom the eval report card: faithfulness,
  citation validity, refusal rate, hallucination rate.
- **VO:** *"Here is what makes it safe to put in front of a class. Ask it something outside its
  evidence and it does not improvise an answer. It refuses, because the AI is allowed to say nothing.
  The same gate that just turned this question away is what keeps every grounded answer honest. And we
  measure it. This is a small, illustrative eval set, not a giant benchmark, but it reports
  faithfulness, citation validity, refusal rate, and hallucination rate, and the whole thing is
  re-runnable, so a teacher can see the failures too, not just the wins."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `measured on a re-runnable eval set`

### Scene 7 · 4:00 – 4:35 · The student side closes the loop
- **SCREEN:** Click **Log action**, pause. Click the upload control (photo pre-selected). After it
  submits, click-zoom two things only: the **AI-detected** label with the carbon math, and the
  **points awarded**. Then click **Quests** and click the top quest tied to the biggest emitter.
- **VO:** *"Students still take action, and it has to be just as honest as everything else. When
  someone logs an action, a vision model identifies the photo, but the kilograms come from the same
  cited factor, and the points are scored on the server. The AI can describe an action, but it can
  never award itself a single point. And the quests the class sees are ranked by the school's biggest
  emitter, so the footprint decides what students are asked to do, rather than the other way around."*
- **ON-SCREEN TEXT:** `vision detects · math is deterministic · points scored server-side`

### Scene 8 · 4:35 – 5:00 · Impact, scale, and the close
- **SCREEN:** Start on the Footprint card and click the `≈186 t CO₂e / mo` headline, pause. One
  navigation click into the Privacy center, click its student-data headline, pause. Return to the
  Footprint card and click the `≈186 t CO₂e / mo` headline again for the final line. End with the
  number centered, not mid-transition.
- **VO:** *"For an environmental-science class, EcoRise pulls it all together. Students get a real
  footprint and a thousand-paper research bank. Teachers get an auditable, cited baseline and an
  approval gate. And it is built around student-data privacy from the start. It works for one
  classroom today, and a district is simply the same pipeline repeated. One point two kilograms
  against 186 tonnes. EcoRise makes the class see that difference, and makes the AI cite its sources
  before it ever recommends a fix."*
- **ON-SCREEN TEXT:** `EcoRise: the hidden footprint, grounded in real research, for the eco classroom.`

---

## VO recording tips

- Read a little slower than feels natural, since recorded voiceover always sounds rushed on playback.
  Aim for roughly 145 to 155 words per minute.
- Keep one thought per breath, and let the two big numbers (1.2 kg and 186 tonnes) breathe while the
  edit holds the screen on them.
- Record in a soft room. A closet or a space under a blanket kills echo. One clean take per scene is
  easier to fix than a single long take.
- Keep your energy highest on Scene 1, Scene 5, and Scene 6, because the hook, the research bank, and
  the refusal are what carry the video for this audience.

## Edit / assembly notes

- Lay the VO down first, then cut the clips so each key word lands on the matching screen, with the
  number appearing as the auto-zoom settles on it.
- Keep captions short, high contrast, and in the bottom third, so the video still works on mute, since
  judges often scrub silently before turning the sound on. Let Screen Studio's zoom carry the rest.
- Run light, neutral music at about 15 to 20 percent under the VO, and duck it during the two big
  numbers and the refusal line.
- Export at 1080×1920 portrait, or 1080p landscape if the portal prefers it, and stay under the length cap.
- For a tighter 3:30 cut, drop Scene 7 first, then thin Scene 4. Keep Scene 5 (research bank) and
  Scene 6 (refusal) since they define the product for this audience.
- Upload it unlisted (YouTube or Loom) and paste the link into the README and the submission form.

## Honesty guardrails for the VO (do not overclaim)

- Energy is real, but the other four categories are estimates, so never call the whole footprint
  "real." Cafeteria food is the biggest line, yet it is an estimate, so say "largest line," not
  "largest measured." When you raise confidence in Scene 2, say a category went from estimate to a
  real input, not that the whole footprint is now verified.
- The research bank is 1,000 real papers; the Ask feature answers only from them and always shows the
  citation. Do not claim it covers everything, and let it refuse off-corpus questions on camera.
- The eval report is a small illustrative set, not a benchmark. Frame the metrics as "measured on our
  test cases, and re-runnable," and offer the failures, not just the passing numbers.
- The recommendation impact range and projected figures are estimates with a confidence range, plus a
  named owner. Present them as decision support for staff, not guarantees.
