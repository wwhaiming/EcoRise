# EcoRise: Demo Video Script (voiceover + screen recording, 5:00)

**Built for the ecology / environmental-science classroom.** EcoRise is a tool an
environmental-science class actually uses: students see their own school's real carbon
footprint, learn from a seeded research corpus, and turn that into cited, teacher-approved
action. This is the audience the whole script speaks to.

**Direction:** USAII Global AI Hackathon 2026, Direction B, "My School's Hidden Footprint."
The AI is the protagonist of this video. It retrieves approved evidence, learns each school's
normal utility baseline, flags anomalies, forecasts next month, ranks specific interventions,
and grades cited learning questions. The deterministic carbon math and the named human
approval gate stay explicit throughout, because that is what makes the AI trustworthy.

**Format:** a *virtual* demo. Record silent screen clips per scene with **Screen Studio**
(macOS), record the voiceover (VO) separately, then assemble in your editor. Timestamps
are pacing targets, not hard cuts. **Target runtime:** **~5:00** (8 scenes). To cut to
~3:30, drop Scene 7 and thin Scene 4, but never cut Scene 5 or Scene 6. **Aspect:** mobile
device frame, 1080x1920 portrait.

> **The one line the video must land:** *A student biking to school saves about 1.2 kg of
> CO2, while their school emits roughly 186 tonnes a month, the equivalent of over 150,000
> bike rides. EcoRise shows an environmental-science class that gap, grounds it in a
> 1,000-paper seeded research corpus, and only lets the AI speak when it can cite its source
> and a human approves the action.*

---

## Rubric coverage map (how the 8 scenes earn every scoring area)

The competition scores five areas. AI Reasoning and Responsible AI carry the extra weight, so
every scene names what it earns, and the two heaviest areas appear in the most scenes.

| Scene | Problem | AI Reasoning | Solution Design | Impact & Insight | Responsible AI |
|---|:---:|:---:|:---:|:---:|:---:|
| 1 · The contradiction | ● primary | | | ● | |
| 2 · Honest data, confidence rises | ● | ● | ● | ● primary | ● |
| 3 · The leverage ratio | ● | ● | ● primary | ● | |
| 4 · Anomaly to ranked decision | ● | ● primary | ● | ● | ● |
| 5 · The research corpus | | ● primary | ● | | ● |
| 6 · The AI says nothing | | ● | | | ● primary |
| 7 · Student loop, server-scored | ● | ● | ● | ● | ● primary |
| 8 · Impact, scale, close | ● | ● | ● | ● | ● |

Every area is covered by at least three scenes. AI Reasoning is load-bearing in seven of eight
scenes, and Responsible AI is named in six, which matches where the extra weight sits.

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
- It is edited, so **capture order need not match scene order.** Film the cleanest take of each beat,
  then arrange in the timeline afterward.

---

## How to use this script

1. **Capture** each scene's `SCREEN:` action as a clean silent Screen Studio clip.
2. **Record** the `VO:` lines as a continuous voiceover, or per scene (see VO tips).
3. **Assemble:** lay the VO first, cut the clips to match, then add the `ON-SCREEN TEXT:` captions.
4. Keep the numbers exactly as below. They are computed from the real seed, not invented.

---

## Verified numbers (editor reference, keep accurate)

| Category | ~t CO2e / mo | Data |
|---|---:|---|
| **Cafeteria food** (biggest line) | **60.3** | EPA per-meal estimate, *labeled low confidence* |
| Electricity | 57.2 | **Real**, Seattle Public Schools utility dashboard |
| Student/staff commuting | 42.5 | EPA estimate |
| Heating (natural gas) | 25.3 | **Real**, same dashboard |
| Landfill waste / Water | 0.8 / 0.2 | EPA estimate |
| **Total** | **~186** | overall confidence **LOW** (only 2 of 6 categories real) |

Real energy is about **82 t** (electricity plus gas), from the Seattle Public Schools dashboard,
Garfield HS CY2023 (143,083 kWh/mo; 4,766 therms/mo; enrollment 1,507, NCES CCD 530771001171).
1.2 kg is roughly one 3-mile car trip avoided (EPA 0.40 kg/mi). The **research corpus holds 1,000
papers** ingested from OpenAlex; in the MVP this runs as a **seeded demo corpus**, labeled on-screen.
The footprint headline renders in tonnes, as a one-decimal value followed by the letter t with no
approximation symbol, for example `186.2t`; the category bars read in kg/mo.

**Retrieval and faithfulness constants (verify against code before putting any number on-screen):**
the retrieval similarity floor is `COACH_SIM_FLOOR=0.35` (lexical coverage) and the entailment floor
is `COACH_FAITH_FLOOR=0.8`, documented in the plan and not yet enforced as a hard constant in code. Do
not put a "0.75 grounding threshold" or a guaranteed "0.82" example score on-screen; neither is in the
inventory. The answer card renders only the answer text and its leaf-icon citation chips, with no
similarity or match score, so do not put any retrieval score on-screen and do not name one in the VO;
surface retrieval as grounded by showing the visible citation the build itself displays on the answer
card, rather than a number that does not render.

**AI mechanics the VO may name (all real in the code, do not exceed these):** deterministic per-category
emission factors with cited sources; confidence is LOW with all defaults and MEDIUM at four or more real
teacher inputs; retrieval pulls the top five to six approved source chunks; a three-gate faithfulness
check (citation validity, then a numeric-claim check, then an LLM entailment judge call) screens every
drafted question; anomalies come from an ordinary-least-squares regression on school days and heating and
cooling degree-days, flagged at a residual z-score of two or more; forecasts reuse that fitted model with
an 80 percent interval; interventions are ranked by mid-point CO2e weighted by whether they hit the
detected anomaly or the biggest emitter and by cost and effort; coach points are capped at 10 per day and
40 per week and the model never writes a point to the database.

---

## Pre-record capture setup (do once, before filming)

```bash
# Terminal 1: seed BOTH the coach corpus and the 1,000-paper research corpus FIRST
cd backend && COACH_ENABLED=true npm run seed:coach && npm run seed:research
# Terminal 2: seed the board + login, run the app
COACH_ENABLED=true npm run demo
```

- Log in as `demo@ecorise.app` (password printed by the seed). Board: **Garfield High School**.
- **Verify the school name the app actually renders, and match every caption to it.** The Footprint
  Dashboard header (`frontend/src/pages/FootprintDashboard.jsx` ~L453) falls back to
  `Greenfield High` if the API does not return a school name, while the seeded board is
  **Garfield High School**. Before filming Scenes 1, 4, and 8, open the dashboard and read the header:
  if it shows `Greenfield High`, either fix the seed so the name resolves or caption with the name the
  app actually displays, and use that same name consistently in every scene.
- The footprint baseline is pre-seeded with real Seattle energy. Open **Learning → AI Coach** and
  confirm the **School Footprint** card renders with the one-decimal tonnes headline, for example
  `186.2t CO2e / mo` (`hasBaseline` satisfied, so the headline is not "Estimating…"), the confidence
  chip, the category bars, and the **Update school data** button.
- **Confirm the Research Library is full:** under **Learning → Research Library**, Browse should list
  the seeded papers and refresh on each click, and Ask should return a cited answer. (If empty, re-run
  `npm run seed:research`.)
- **Confirm the demo-mode labels render:** the Research Library view shows a green
  `Research library · 1,000 papers` eyebrow, but it does **not** render a `demo corpus / sample data`
  chip in code, so add that label as a caption in the edit. The School Footprint card also does **not**
  render a `sample data` chip in code, so if the build runs the coach on sample data, add that label as
  a caption too, so a muted-scrub judge still sees the disclosure.
- **Confirm the embedding mode:** if the build is running the offline embedding fallback, the
  ResearchLibrary view does not render an `offline embeddings` label in code, so add that label as a
  caption so retrieval is not read as always-neural.
- From the **Home** screen, open the **School Hidden Footprint** card, which routes into the Footprint
  Dashboard, and confirm Section ④ "AI Recommendations + Human Approval Gate" renders at least one
  RecommendationCard in the "Proposed, awaiting approval" state, each showing a "Projected annual CO2e
  avoided" badge, an "Estimated impact" badge, and a "Why:" reasoning box, alongside the Approve button.
- **Confirm one approved action shows a measured before/after value** from `action_plan_items`. The
  RecommendationCard does **not** render a before/after row on the proposed card itself, so confirm
  where the measured reduction appears in the live build (an approved entry or a separate row). If no
  approved item carries a recorded after-value, set one before filming, or cut the before/after beat
  in Scene 4.
- On the Home header, open the **notifications bell** and confirm that the seeded history is present,
  with a small unread badge, so the bell already shows real content the moment a judge logs in.
- On the **Feed** tab, confirm that each post now carries a topical action photo rather than an empty
  banner, since the feed is part of what the closing scene shows.
- **Confirm the onboarding screen is reachable** (or capture one clean still of it), so the closing
  set of screens is visibly complete; a 2 to 3 second clip or caption is enough. Onboarding.jsx exists
  in the codebase but has no confirmed in-app route, so treat it as an edited insert, not a live
  navigation.
- **Confirm the Privacy & data screen and its exact heading.** It is reachable via Profile → settings
  (`ctx.go('privacy')`); `frontend/src/components/PrivacyCenter.jsx` (L152-153) renders the green
  `FERPA & COPPA` eyebrow above the `Privacy & data` h1, so caption Scene 8 with that exact heading text.
- Pick your bike or LED photo into the file dialog *before* the Scene 7 take.

---

## Shot list (8 scenes, ~5:00)

### Scene 1 · 0:00 – 0:30 · Cold open: the contradiction every eco class hits
- **Rubric coverage:** Problem Understanding (primary), Impact & Insight.
- **SCREEN:** Pre-roll already on **Learning → AI Coach → School Footprint card**, the one-decimal
  `186.2t CO2e / mo` headline showing (`hasBaseline` satisfied), the coral top category bar with its
  flame icon visible below. To get here from app startup, click the bottom-nav **Learning** tab, which
  defaults to the **AI Coach** sub-tab, and the School Footprint card renders automatically. Click once
  directly on the `186.2t` tonnes figure and hold 3 seconds while the zoom settles. Then click the top
  coral category bar (the flame-marked biggest emitter, first row) or its kg/mo value, and hold 2
  seconds. Do not scroll during the opening sentence.
- **VO:** *"Every environmental-science class teaches students to shrink their footprint, with the
  bike rides and the recycled bottles. But here is the contradiction those classes run into. When a
  student bikes to school instead of taking a short car ride, they save a little over a kilogram of
  CO2. Their school, meanwhile, emits about 186 tonnes every single month, which works out to more
  than a hundred and fifty thousand of those bike rides. That 186 tonnes is mostly hidden, spread
  across categories the class can act on, energy, cafeteria and lunch waste, commuting, and campus
  waste, and no student can see it. EcoRise is built for that classroom, to make the school's hidden
  footprint visible and to point the AI at where student effort actually moves the number."*
- **ON-SCREEN TEXT:** `1.2 kg  vs  186,000 kg / month`   ·   `energy · lunch waste · commuting · campus waste`   ·   `built for the eco / env-science classroom`

### Scene 2 · 0:30 – 1:05 · Honest data, and a footprint that improves
- **Rubric coverage:** Impact & Insight (primary), Responsible AI, AI Reasoning, Problem Understanding, Solution Design.
- **SCREEN:** Stay on the **Learning → AI Coach → School Footprint card** from Scene 1; no navigation. Scroll at most once before beat 1 to frame the category bars, the LOW confidence chip, and the **Update school data** button together. (Confirm these elements render in the live build first; the card lives in `frontend/src/components/SchoolFootprint.jsx`.) The card does not render a `sample data` chip, so if the coach runs on sample data, add that label as a caption in the edit.
  1. Click once across the **Electricity** and **Heating (natural gas)** category bar rows, both framed in one zoom. Hold 1.5s. ("about 82 tonnes, are real.")
  2. Click the **LOW** confidence chip (on the LOW text itself, not whitespace). Hold 1.5s. ("confidence reads low on purpose.")
  3. Click **Update school data** and hold 1.5s while the input form opens. Every beat after this lives on the form.
  4. Enter **Meals served/day → % driven to school → Water (m3/mo)** in one smooth pass (energy is pre-seeded; do not touch it). All three are required, or the confidence chip will not reach MEDIUM.
  5. Click **Save baseline**, then freeze; do not chase the result with the cursor.
  6. Hold 2s on the overall confidence chip as it climbs **LOW → MEDIUM**. End frame.
  - *Scroll:* at most one, before beat 1, to center the category bars, chip, and button. *(MEDIUM needs four or more of six categories on real data, so enter all three inputs, not just meals.)*
  - *Before filming, record the exact tested input values so the take is repeatable:* meals served/day `___`, percent driven `___%`, water `___ m3`. If these fields do not render in the live build, do not film Scene 2 as written.
- **VO:** *"A class can trust this footprint because the AI never invents a number. Every category is a
  deterministic calculation: a measured or default quantity multiplied by a published emission factor,
  with the source attached. Electricity and gas, about 82 tonnes a month, come from Seattle Public
  Schools' public utility dashboard. Food, commuting, waste, and water start as EPA defaults, so the
  model rates its own confidence LOW on purpose, because every figure is a default. Then the class adds
  real local inputs for meals, commuting, and water. Once four of the six categories run on real data,
  the same scoring rule lifts the confidence to MEDIUM. The AI is not guessing harder. It is being
  honest about how much evidence it has, and showing the class a live lesson in measurement and
  uncertainty."*
- **ON-SCREEN TEXT:** `Energy = measured public data` · `add real inputs → confidence LOW → MEDIUM` · `sample data where labeled`

### Scene 3 · 1:05 – 1:35 · The leverage ratio (the core idea)
- **Rubric coverage:** Solution Design (primary), AI Reasoning, Impact & Insight, Problem Understanding.
- **SCREEN:** Stay on the **Learning → AI Coach → School Footprint card** in post-Scene-2 state: confidence chip on **MEDIUM**, the **Update school data** form **closed** so the button reads "Update school data" and not "Close", category bars rendered with the top bar coral and flame-marked. Cursor near vertical center. (The "Action leverage" panel is a green-tinted box with an "Action leverage" eyebrow and one muted message line, seated below the category bars; `frontend/src/components/SchoolFootprint.jsx` ~L114-118, and it renders only when the leverage data exists, so confirm it in pre-flight.)
  1. One scroll down to center the **Action leverage** panel, then stop.
  2. Click the muted **leverage message** line (the text itself, not the eyebrow or padding). Hold 1.5s. ("we call it the leverage ratio.")
  3. Click the **top coral category bar** (flame-marked biggest emitter, first row) or its kg/mo value. Hold 1.5s. ("against the school's institutional emissions.")
  4. Click the **leverage message** line again. Hold 1.5s through the close ("what should the school actually do"). End frame.
  - *Scroll:* exactly one (beat 1). Do not click the confidence chip.
- **VO:** *"EcoRise turns that gap into a number it calls the leverage ratio. The AI identifies the
  school's biggest hidden emitter, the flame-marked line, then weighs one student action, valued by the
  same cited carbon factors, against that institutional line. The comparison is computed, not asserted,
  so the class can see exactly when personal effort is best aimed at changing the system around them.
  Small actions still matter. But the biggest school lever is usually institutional, not individual.
  Once the AI has surfaced that, the next question becomes concrete: what should the school actually do
  first, and can it prove the answer?"*
- **ON-SCREEN TEXT:** `Leverage: one student action vs the largest school emissions line`

### Scene 4 · 1:35 – 2:20 · From anomaly to ranked decision (the decision engine + governance)
- **Rubric coverage:** AI Reasoning (primary), Responsible AI, Solution Design, Impact & Insight, Problem Understanding.
- **SCREEN:** Pre-roll on the **Home** screen, with the **School Hidden Footprint** card visible (sparkle badge, green "AI Insights" eyebrow, "School Hidden Footprint" heading, "Anomalies · Predictions · Recommendations" subtitle, navigation arrow; `frontend/src/pages/Home.jsx` ~L69-82). Section ④ "AI Recommendations + Human Approval Gate" on the destination dashboard must render at least one RecommendationCard in the "Proposed, awaiting approval" state. (The proposed card has **no** kg/mo headline, **no** cost-band line, **no** "Verify by", and **no** before/after row; use the real elements below and do not hunt for ones that are not there. The measured before/after is a separate `action_plan_items` value, confirmed in pre-flight, not a row on the proposed card.)
  1. Click the **"School Hidden Footprint"** card heading, which routes to the Footprint Dashboard (`ctx.go('footprint')`). Hold 1.5s.
  2. One scroll to center Section ④ and the top RecommendationCard, then click its **recommendation title**. Hold 1.5s. ("ranks.")
  3. Click the **"Projected annual CO2e avoided: N kg"** badge (the green number). Hold 1.5s. ("how much carbon each one could avoid.")
  4. Click the **"Estimated impact:"** badge. Hold 1s. (covers "cost and effort.")
  5. Click the **"Why:"** reasoning box. Hold 1.5s. ("the AI retrieves evidence and drafts language.")
  6. Click the **"Proposed, awaiting approval"** status chip. Hold 1s. ("stays a proposal until…")
  7. Click **"Approve, Make Active Goal"**. Hold 1.5s as the card flips to "Active, visible on school leaderboard feed". ("a named staff member signs off.")
  8. *(Only if pre-flight confirmed it renders:)* scroll once to the **approved item's measured before/after value** from `action_plan_items`, with its percent reduction. Hold 2s. End frame. ("a measured reduction, not just a projection.") If no measured before/after renders in the live build, cut this beat and end on beat 7.
  - *Scroll:* up to two total (beat 2 and beat 8). Do not open the Assign flow.
  - *Note:* if the dashboard header shows `Greenfield High` instead of `Garfield High School`, caption with the name the app actually displays (see pre-record setup).
- **VO:** *"This is where the AI does its hardest reasoning. Behind this card, it learns what normal
  electricity, gas, and water look like for this school by fitting consumption against school days and
  heating and cooling degree-days, so weather and occupancy are accounted for. When a month runs above
  that learned baseline by two standard deviations or more, the AI flags it as an anomaly, never as
  savings, and reuses the same fitted model to forecast next month with an 80 percent confidence band.
  Then it ranks specific interventions, boosting any fix that targets the detected anomaly or the
  biggest emitter, weighted down by cost and effort, and it shows the projected annual CO2e avoided
  for each one. The Why box is retrieved evidence the model drafts into plain language. But the AI can
  only propose. Every recommendation carries a named human owner, and the card stays Proposed until
  that staff member clicks Approve. Once approved, the action becomes an active school goal, and the
  plan can track a real before-and-after reduction, so the loop closes on a measured outcome and not
  only a prediction. The rule is fixed: AI reasons and proposes, a person approves, and the AI never
  changes a building setting or enacts a thing on its own."*
- **ON-SCREEN TEXT:** `anomaly z>=2 · forecast · ranked fix · projected CO2e avoided` · `proposed → staff-approved active goal · measured before/after`

### Scene 5 · 2:20 – 3:05 · The research corpus (the class's AI-powered library)
- **Rubric coverage:** AI Reasoning (primary), Solution Design, Responsible AI.
- **SCREEN:** Navigate from Scene 4 back to **Home**, then click the bottom-nav **Learning** tab and toggle the sub-tab pill to **Research Library** (so "Research Library" is active and "AI Coach" is inactive; `frontend/src/pages/Research.jsx` renders the ResearchLibrary). Pre-roll with the "Ask a question…" input and the **Browse** button in view, the papers list empty so the first Browse visibly populates it. (Button labels are confirmed in `frontend/src/components/ResearchLibrary.jsx` as **Browse**, **Ask**, **Summarize**, and **Visualize**. The component renders a green `Research library · 1,000 papers` eyebrow but no `demo corpus / sample data` chip, so add it as a caption. The answer card renders only the answer text and leaf-icon citation chips, with no similarity or match score, so there is no score to click.)
  1. Click **Browse**. Hold 1.5s as the matching-papers count and the list load. ("browse it.")
  2. Click **Browse** again (cursor already on it). Hold 1.5s, until at least the first two paper titles visibly change. (corpus-depth proof; no key word.) If the list does not visibly swap on 1080x1920 mute playback, cut this beat.
  3. Click the **"Ask a question…"** input. Hold 1s; let the zoom settle before typing.
  4. Type `Does biking instead of driving meaningfully cut emissions?`, click **Ask**. Hold 1.5s until the answer card renders.
  5. Click the **citation chip** (the leaf-icon source chip on the answer card, the chip, not the answer text). Hold 1.5s. ("always shown with its citation.") The answer card renders no similarity or match score, so do not hunt for one and do not click prose; hold the citation chip for the full duration.
  6. Scroll once to center the first PaperCard, click **Summarize** (leaf icon). Hold 1.5s for the key-points box.
  7. Click **Visualize** (sparkle icon, right of Summarize). Hold 1.5s for the gradient infographic.
  - *Scroll:* exactly one (between beats 5 and 6). Labels: it is "Visualize" (not "Visual"), and a Learning sub-tab (not a top-level "Research" tab).
- **VO:** *"The class is not learning in a vacuum, and the AI is not free-associating. EcoRise holds a
  1,000-paper research corpus, ingested from OpenAlex and seeded as a demo corpus for this build. When
  a student asks a question, the AI scores every passage for similarity and retrieves the top five or
  six most similar approved passages, then answers using only those passages, with the citation
  visible. Retrieval is what grounds it: the model reasons over evidence it just pulled, not over
  memory it cannot show you. Students can turn a dense study into plain-language key points and then
  into a cause-and-effect visual, both built from the same cited source. For environmental science,
  that means the footprint conversation sits on top of primary research, not a generic chatbot."*
- **ON-SCREEN TEXT:** `1,000-paper seeded research corpus` · `retrieve top-k · ask · summarize · visualize` · `every answer cited`

### Scene 6 · 3:05 – 3:45 · The proof: the AI says nothing (responsible AI for the classroom)
- **Rubric coverage:** Responsible AI (primary), AI Reasoning.
- **SCREEN:** Stay on the **Learning → Research Library** sub-tab, "Ask a question…" input empty, no answer card lingering from Scene 5. The build renders the refusal string **"No grounded answer found in the corpus."** (`ResearchLibrary.jsx` L190 default); before filming, confirm the running app renders this exact string and lock it, so the emotional center beat is not improvised. **Confirm the AI report card actually renders:** it only appears if `/api/coach/eval-report` returns `{ available: true, metrics }` (`frontend/src/pages/Research.jsx` ~L15-92), with an "AI report card" eyebrow over a metrics grid of Faithfulness pass · Citation validity · Unanswerable refusal · Hallucination rate below the fold. If that endpoint is not seeded, the card does not render; in that case film the **Responsible AI guardrails** card instead (the orange-outlined card in Research.jsx that always renders) and treat beats 6 through 9 as captions over it.
  1. Click the **"Ask a question…"** input. Hold 1s.
  2. Type `Who won the 2022 World Cup?`, submit. Keep the cursor still.
  3. When the refusal string "No grounded answer found in the corpus." renders, **do nothing for 4 full seconds**, no move, click, or scroll. Emotional center; "nothing" lands here. Confirm the refusal is silent, no toast or animation.
  4. *(Optional, rehearse first:)* re-ask `What exact percent will meatless Mondays cut our school's emissions?`, hold 3s on the refusal. Drop the beat entirely if it ever invents a number.
  5. One scroll to center the **AI report card**, settle 1s.
  6. Click the **"Faithfulness pass"** row. Hold 1.5s. ("faithfulness.")
  7. Click the **"Citation validity"** row. Hold 1.5s. ("citation validity.")
  8. Click the **"Unanswerable refusal"** row (= the script's "refusal rate"). Hold 1.5s. ("refusal rate.")
  9. Click the **"Hallucination rate"** row. Hold 1.5s. End frame. ("hallucination rate.")
  - *Scroll:* exactly one (beat 5). Use the locked refusal string in the edit; do not let a take with different wording through. If the report card is not seeded, replace beats 6 through 9 with the guardrails card per the SCREEN note.
- **VO:** *"This is the safety proof, and it is the most important reasoning the AI does. Ask something
  outside the research corpus, and EcoRise does not improvise. Before any answer is allowed, it passes a
  three-gate faithfulness check: every citation must exist and be in the passages just retrieved, every
  number in the answer must appear in the cited evidence, and a language-model judge then checks whether
  the answer is entailed by the source. If a gate fails, the AI refuses, because it is allowed to say
  nothing rather than guess. And that behavior is measured, not promised: faithfulness pass rate,
  citation validity, refusal rate, and hallucination rate, all run on a small, re-runnable eval set of
  our own test cases. These are illustrative results from our fixtures, not a third-party benchmark, and
  teachers can see the failures, not just the wins."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `3-gate faithfulness check · illustrative eval on a re-runnable test set`

### Scene 7 · 3:45 – 4:35 · The student side closes the loop
- **Rubric coverage:** Responsible AI (primary), AI Reasoning, Impact & Insight, Solution Design, Problem Understanding.
- **SCREEN:** Pre-roll on the **Quests** tab (bottom-nav "Quests" selected; `frontend/src/pages/Quests.jsx`). The **"Log action"** card (camera icon, green) centered. **Photo upload is an edited insert:** use a seeded demo image path or a drag-drop test fixture so no OS picker appears, or cut from the upload click straight to the analyzing state; if the OS file-picker shows in the raw take, that take is unusable. The bell carries seeded unread history; the Feed shows topical photos.
  1. Click the **"Log action"** card, which opens the "Log an eco action" modal. Hold 1.5s.
  2. Click the photo upload control ("Add a photo to log your action") → spinner "Analyzing your photo…". Hold 1.5s; no second click during the spinner.
  3. Click the **"AI detected"** eyebrow / action headline in the AI-detected card. Hold 1.5s. ("a vision model identifies the photo.")
  4. Click the **"CO2 SAVED"** value (the green number). Hold 1.5s. ("the kilograms come from the same cited factor.")
  5. Click **"Post & earn points"** to submit; if a points value renders in the modal, click it. Hold 1.5s. ("scored on the server… never award itself a single point.") If no in-modal points element, defer the points click to beat 6.
  6. Click the **"Feed"** tab (bottom nav). Hold 2s on the new post's Media Band photo (click the Points chip top-right if points were deferred).
  7. Go to the **Home header** (Home tab), click the **notifications bell** (top-right). Hold 1.5s on the points entry (green unread dot, "Xm ago").
  8. Click **Quests**, then the **top QuestCard** (biggest-emitter quest, yellow "2x" bonus chip on base points, with its "Log photo" button). Hold 1.5s. End frame.
  - *Scroll:* at most one (Feed centering in beat 6, only if the new post is not already at top). Each navigation is its own deliberate beat; do not chain Feed → Home → bell → Quests in one motion.
- **VO:** *"Students still take action, and here the division of labor is the whole point. When they log
  a photo, a vision model only perceives the action and its attributes, the miles, the meal type, the
  bottles displaced. It hands those attributes to deterministic code, which multiplies them by the same
  cited emission factors to compute the CO2 saved, and clamps the values so the model cannot inflate a
  number. The AI never writes a carbon figure or a point to the database. Points are scored server-side
  from an immutable ledger, and even tagging a friend grants them nothing, which blocks gaming. After
  posting, the action appears in the Feed with its own photo and triggers a points notification. The
  quests then point students back at the school's biggest emitter, so the AI's footprint analysis is
  what drives the challenge, not the other way around."*
- **ON-SCREEN TEXT:** `vision detects attributes · math is deterministic · points scored server-side`

### Scene 8 · 4:35 – 5:00 · Impact, scale, and the close
- **Rubric coverage:** Responsible AI, Impact & Insight, AI Reasoning, Solution Design, Problem Understanding.
- **SCREEN:** From Scene 7, click the bottom-nav **Learning** tab, which defaults to the **AI Coach** sub-tab, so the **School Footprint card** renders with the real tonnes value showing (`hasBaseline` satisfied, not "Estimating…" or zeroed): "School footprint" eyebrow, large one-decimal `186.2t` headline, "CO2e / mo" label, confidence chip and help tooltip, coral category bars below. Cursor in lower-third neutral space.
  1. Click the **`186.2t`** tonnes figure itself (not the "CO2e / mo" label, chip, or tooltip). Hold 2s. ("footprint.")
  2. **Insert the onboarding still or clip here** (the one named screen never otherwise shown), 2 to 3 seconds, so the screen set reads complete. A caption is enough if no clean capture exists (confirm reachability in pre-flight).
  3. **Insert (or navigate) into the Privacy & data screen.** It is reachable via Profile → settings (`ctx.go('privacy')`). If you do not want to film the Profile routing, cut from the onboarding beat straight to the Privacy & data screen already loaded. Let the transition finish; no zoom commit mid-transition.
  4. Click the **Privacy & data heading** (the h1 from `PrivacyCenter.jsx` L153, under its "FERPA & COPPA" eyebrow). Hold 1.5s. ("privacy.")
  5. **Cut / navigate back** to the School Footprint card (an edited cut is fine here). Let it re-seat, headline visible and not mid-animation.
  6. Click the **`186.2t`** figure again. Hold 2.5s, "186 tonnes" lands as the zoom settles; hold through "cite its sources." End on this dead-still frame.
  - *Scroll:* none. Navigations: into onboarding, into Privacy, back to the School Footprint card.
- **VO:** *"EcoRise pulls the class view together: one real school footprint, a 1,000-paper seeded
  research corpus the AI retrieves from, anomaly detection and forecasting on the school's own utility
  data, and a named staff approval gate on every recommendation. The AI does the heavy reasoning, and
  deterministic math and human approval keep it accountable. It is built around student-data privacy
  from the start. One classroom can use it today; a district is the same pipeline repeated, since every
  school just fits its own baseline. One point two kilograms against 186 tonnes. EcoRise makes that gap
  visible, then makes every AI recommendation cite its source and wait for a human."*
- **ON-SCREEN TEXT:** `Hidden footprint. Seeded research. Cited fixes.` · `onboarding → privacy → footprint`

---

## VO recording tips

- Read a little slower than feels natural, since recorded voiceover always sounds rushed on playback.
  Aim for roughly 145 to 155 words per minute.
- Keep one thought per breath, and let the two big numbers (1.2 kg and 186 tonnes) breathe while the
  edit holds the screen on them.
- Record in a soft room. A closet or a space under a blanket kills echo. One clean take per scene is
  easier to fix than a single long take.
- Keep your energy highest on Scene 1, Scene 4, Scene 5, and Scene 6, because the hook, the anomaly-to-
  decision reasoning, the research corpus, and the refusal are what carry the video for this audience.
- The AI-heavy scenes (2, 4, 5, 6, 7) run longer sentences. Slow down a touch more there so the
  mechanics stay clear, and let each mechanism land before naming the next.

## Edit / assembly notes

- Lay the VO down first, then cut the clips so each key word lands on the matching screen, with the
  number appearing as the auto-zoom settles on it.
- Keep captions short, high contrast, and in the bottom third, so the video still works on mute, since
  judges often scrub silently before turning the sound on. Let Screen Studio's zoom carry the rest.
- **Keep the mock-mode disclosure visible on mute:** because neither the School Footprint card nor the
  Research Library renders a chip in code, add a `demo corpus / sample data` caption over the Research
  Library in Scenes 5 and 6, a `sample data` caption over the School Footprint card in Scenes 2, 3, and
  8 if the coach runs on sample data, and an `offline embeddings` caption if the build runs the
  fallback, so a silent-scrub judge sees the disclosure without the VO.
- Run light, neutral music at about 15 to 20 percent under the VO, and duck it during the two big
  numbers and the refusal line.
- Export at 1080x1920 portrait, or 1080p landscape if the portal prefers it, and stay under the length cap.
- For a tighter 3:30 cut, drop Scene 7 first, then thin Scene 4, but keep Scene 4's anomaly-to-decision
  reasoning beat and the measured before/after beat. Keep Scene 5 (research corpus) and Scene 6 (refusal)
  since they define the product for this audience.
- Upload it unlisted (YouTube or Loom) and paste the link into the README and the submission form.

## Honesty guardrails for the VO (do not overclaim)

- Energy is real, but the other four categories are estimates, so never call the whole footprint
  "real." Cafeteria food is the biggest line, yet it is an estimate, so say "largest line," not
  "largest measured." When you raise confidence in Scene 2, say a category went from estimate to a
  real input, not that the whole footprint is now verified. Confidence is LOW with all defaults and
  MEDIUM at four or more real categories; do not claim a "high" confidence state, since the model does
  not assert one for the footprint.
- The AI mechanics are real, but stay inside them. Anomalies are flagged at a residual z-score of two
  or more from an ordinary-least-squares fit on school days and degree-days; do not invent other
  thresholds. Retrieval pulls the top five or six approved passages; do not claim the model reads all
  1,000 papers per question, and do not put an invented similarity threshold like "0.75" on-screen.
  The answer card renders no similarity or match score, so never say "the match score shown" and never
  caption a score; surface retrieval as grounded by the visible citation only. The faithfulness check
  is three gates (citation, numeric claim, then an entailment-judge call); name those, not invented
  ones, and do not claim a hard 0.8 entailment cutoff on-screen, since that floor is documented in the
  plan and not verified as an enforced constant in code.
- The deterministic split is the safety story, so keep it exact: the model perceives attributes and
  drafts language, while deterministic code computes every carbon number and the server awards every
  point. Never say the AI "calculated the CO2" or "gave points." It cannot, by design.
- The research corpus is 1,000 papers ingested from OpenAlex and seeded as a demo corpus for this
  build; call it a "1,000-paper seeded research corpus," not "1,000 real research papers," and keep the
  `demo corpus / sample data` caption on-screen. The Ask feature answers only from retrieved passages
  and always shows the citation. Embeddings are learned vectors only in OpenAI mode; in the labeled
  offline demo mode they are a deterministic lexical hash, so pair any "embedded as a vector" line with
  the `offline embeddings` caption and do not claim true neural embeddings always. Do not claim the
  corpus covers everything, and let it refuse off-corpus questions on camera.
- The eval report is a small illustrative set, not a third-party benchmark, and it renders only when
  the eval endpoint is seeded. Frame the metrics as "measured on our own test cases, and re-runnable,"
  present the numbers as illustrative fixtures rather than guaranteed production rates, and offer the
  failures, not just the passing numbers. If the report card does not render, fall back to the
  Responsible AI guardrails card and do not show metric numbers that are not on-screen.
- The recommendation impact range and projected figures are estimates with a confidence range, plus a
  named owner. Present them as decision support for staff, not guarantees, and always note that a human
  must approve before anything becomes an active goal. The one measured before/after beat in Scene 4 is
  a real recorded reduction from `action_plan_items`; present it as a measured outcome only if it
  actually renders, and keep the projected figures labeled as projections.
- Demo and fallback modes are labeled: the corpus is a seeded demo corpus, the insights run on sample
  data where labeled, and the embedding fallback is a deterministic offline mode. Surface these as
  on-screen captions, since neither card renders a chip in code, and do not present any of these as
  production scale.

---

## Detailed Screen Studio capture guide (per scene)

This section expands the shot list above into frame-by-frame Screen Studio capture direction for each scene. The Shot list remains the quick reference for what each scene shows and says, while this guide is the detailed choreography for how to film it.

### How to Use This Guide

This guide is the single source of truth for capturing the EcoRise demo in Screen Studio. Read the Global Setup section once and apply it to every scene, since the recorder settings and the golden rhythm are stated there and never repeated inside individual scenes. Each of the eight scenes below covers one beat of the story in order, with its goal, pre-roll state, click choreography, scroll budget, caption timing, scene-specific things to avoid, retake triggers, and a clean exit. Where a scene draft referenced a UI element that does not appear in the authoritative UI map, or that fights the auto-zoom, the conflict is called out inline with a bracketed note so you fix or flag it before you roll. Run the Pre-Flight checklist before any capture session, and keep the Retake-Trigger and Continuity checklist open while you film.

### Global Setup

These settings are identical across all eight scenes. Set them once and do not restate them per scene.

#### Recording target and geometry

Capture the app inside the canonical 1080×1920 portrait device frame. Keep the phone shell centered with no full-bleed and no off-center crop. Every scene matches this geometry so the clips intercut cleanly. Capture at the export resolution and do not upscale. Use 1080p landscape only if the export portal strictly demands it.

#### Recommended Screen Studio settings

- Background: subtle solid or soft gradient, neutral and low-contrast, with no busy wallpaper.
- Padding: moderate, enough to seat the device frame without shrinking the content.
- Cursor size: one notch above default for legibility on portrait export.
- Click highlights: on but gentle, a subtle pulse that confirms the tap without flaring.
- Auto-zoom: on, since the entire technique depends on it.
- Motion blur: on and subtle, so eased moves read as cinematic rather than steppy.
- Smoothness: high, which reinforces the easing and forgives small cursor imperfections.

#### How auto-zoom picks its target

Screen Studio auto-zooms toward the last click point, so the click location is the zoom target. There is no separate focus control during capture. You aim the zoom by choosing what you click. To land the zoom on a number, bar, or chip, that exact element must be the thing under the cursor when you click, not the nearby whitespace or label. The zoom recenters on each new click, so a stray or mis-aimed click reframes the shot and forces a retake. One click equals one intended target. Move in a single clean arc to the target, let the cursor rest, then click, so the easing has clean endpoints before and after.

#### The golden rhythm

Every key beat follows the same three steps in order, never overlapped.

1. Click once, directly on the target element, which is usually the key number, bar, or chip.
2. Hold dead still for 1 to 1.5 seconds while the zoom eases in and settles. Do not move, do not click again, and do not scroll. Follow any longer per-scene hold when one is stated.
3. Let the voiceover hit the key word exactly as the zoom finishes settling on the element.

The sequence is action, then settle, then word. Every key number should be the thing you click, so the auto-zoom lands the emphasis on the same pixel the voiceover names.

#### Cursor easing, one action per beat, and scroll discipline

Screen Studio eases the cursor and chases it with the zoom, so smooth deliberate motion produces a smooth push-in and erratic motion makes the zoom lurch. During capture, do not circle the cursor, jitter while hovering, fast-wheel-scroll, double-navigate, or hunt for a button, because each adds a velocity spike the easing amplifies into a visible jerk. Take one deliberate action per beat, with no chained actions and no "while I am here" clicks. Allow at most one scroll per scene, used only to bring the target panel into the vertical center, and then stop and act. Do not scroll to reposition mid-beat, during a voiceover sentence, or to micro-correct framing.

#### Caption restraint

The zoom already spotlights each click, so use the per-scene caption counts and no more. Captions are a mute-mode backstop, not the primary emphasis layer. Over-captioning on top of the zoom makes the frame busy, so trust the settle to deliver the emphasis and never stack two captions over a single zoom.

### Capture Order

Capture order does not need to match scene order, because the timeline is edited afterward. Film the cleanest take of each beat in whatever order is convenient, for example capturing together all clips that share a screen state, then arrange them in the timeline. Lay the voiceover first in assembly, then cut the clips so each key word lands on the matching settled number. Over-capturing is fine, so pick the best take per beat. Each beat is an independent, self-contained clip, so you can re-shoot any single beat without re-shooting the scene around it.

### Scene 1

**Goal.** Make the viewer feel a gut-level contradiction in the first thirty seconds, where one student biking to school is a rounding error against the school's institutional emissions. In this 0:00 to 0:30 cold open titled "the contradiction every eco class hits," the clip must burn two numbers into memory, the one-decimal `186.2t CO2e / mo` headline and the single coral top category bar, so the voiceover's "more than a hundred and fifty thousand of those bike rides" lands on a frame the eye has already locked onto. The scene earns Problem Understanding as the primary area and Impact and Insight as the secondary, so the framing must read as a problem statement, not a feature tour.

**Pre-roll state.** Open already on the SchoolFootprint card inside the Learning hub's AI Coach sub-tab, reached by switching the bottom navigation to Learning, which defaults to the AI Coach sub-tab so the SchoolFootprint card renders automatically. Make this navigation before the clip starts, off camera, so the first frame opens with the card already seated. The literal tonnes headline lives only on this SchoolFootprint card, rendered as a one-decimal value followed by the letter t with no approximation symbol, for example `186.2t`, when `hasBaseline` is satisfied, and not on the Home screen "School Hidden Footprint" card, which carries only a heading and a navigation arrow, and not on the Footprint Dashboard, which renders no tonnes headline at all, so the AI Coach sub-tab is the only screen that shows this exact figure. Confirm the board is Garfield High School. This card renders no sample-data or demo-data chip in code, so if the build runs the coach on sample data, add that label as a caption in the edit so the mock-mode disclosure reads on mute. Position the view so the "School footprint" eyebrow and the `186.2t` headline sit in the upper center of the frame and the coral top category bar in the first row of the bars grid is visible without scrolling. Settle this framing before the clip starts and do not scroll on camera. Park the cursor in neutral space in the lower third, off any element, dead still before the first frame. The confidence chip and its help tooltip sit beside the headline but are not touched in this scene.

**Cursor and click choreography.** The opening voiceover plays over a still, pre-framed shot, so do not click during the opening sentences. There are two clicks total in the scene, and the longer opening hold is what keeps this scene inside the thirty-second window without rushing the two numbers.

1. Settle, no action. Hold the pre-framed still through the opening voiceover, from "Every environmental-science class teaches students to shrink their footprint" up to the contradiction, while the cursor rests motionless in neutral space. No zoom yet, roughly six to seven seconds.
2. Click the `186.2t CO2e / mo` headline. Move in one clean arc straight to the headline number, stop, and click directly on the `186.2t` tonnes text itself, not the "CO2e / mo" label or surrounding whitespace, so the auto-zoom target is the tonnes figure. Hold three seconds dead still while the zoom eases in and commits to the headline. Time it so the words "about 186 tonnes every single month" land exactly as the zoom finishes settling, and let the frame ride through "more than a hundred and fifty thousand of those bike rides."
3. Click the coral top category bar. Move in one smooth arc down to the first row of the category bars grid, the flame-marked biggest emitter with its coral gradient fill, stop, and click directly on that coral bar or on its kg/mo value, not the adjacent rows or the flame info icon, so the zoom recenters on the biggest hidden line. Hold two to three seconds dead still while the zoom recenters and settles. Time it so the enumerated habits, "energy, cafeteria and lunch waste, commuting, and campus waste," land across the settled bar.
4. Hold the settled frame. Do not move or click. Let the coral-bar frame ride under the closing line, "EcoRise is built for that classroom, to make the school's hidden footprint visible and to point the AI at where student effort actually moves the number," cursor still on the bar, roughly four seconds, then cut so the clip ends at or just before 0:30.

**Scroll budget.** None. All framing is set in pre-roll, both targets are in frame from the start, and no scroll is needed or permitted anywhere in this clip.

**Caption sync.** Three captions, each on a settled frame, never overlapping a cursor move or a zoom transition.
- `1.2 kg  vs  186,000 kg / month` fades in after the headline zoom has fully settled, roughly as the voiceover says "186 tonnes," so it confirms the number the zoom is already holding. Do not pop it during cursor travel.
- `energy · lunch waste · commuting · campus waste` fades in over the settled coral-bar frame as the voiceover enumerates the four habits, so the mute viewer sees the same four levers the voiceover names.
- `built for the eco / env-science classroom` fades in over the same settled coral-bar frame as the voiceover reaches "EcoRise is built for that classroom," and holds to the cut. Never stack this caption over the habits caption, and let the first clear before the second appears.

**Avoid.** Do not click, hover, or zoom the confidence chip, its help tooltip, or the flame info icon on the top bar in this scene, since each pulls the auto-zoom off the two numbers that carry the cold open and adds a velocity spike the easing amplifies. Do not switch sub-tabs to Research Library, and do not navigate to the Home screen "School Hidden Footprint" card or the Footprint Dashboard by mistake, because neither renders the `186.2t` tonnes headline and coral bar this scene depends on. Do not enumerate the four habits with cursor taps, and name them in voiceover and caption only, with the zoom resting on the single coral bar. Do not let the clip overrun 0:30.

**Retake trigger.** Re-shoot if the click lands on the "CO2e / mo" label or whitespace instead of the `186.2t` tonnes text, if the zoom commits to a non-top bar or to the flame icon rather than the coral top category bar, if the cursor drifts or jitters during either three-second hold, if the headline reads "Estimating…" or a zeroed value instead of the real one-decimal tonnes figure, if a sample-data caption that was meant to run is missing, or if the total runtime crosses 0:30 and forces the closing line to be clipped.

**Clean exit.** End on the dead-still coral-bar frame with the zoom fully settled, cursor resting on the bar, no pending motion or half-finished zoom. Stay on the SchoolFootprint card so the cut into Scene 2 is clean and opens on the same AI Coach sub-tab, and the final frame still reads the biggest hidden emitter.

### Scene 2

**Goal.** Make the viewer trust this AI because it is openly honest about what it knows. The energy numbers are real and measured, the rest are flagged EPA defaults, the overall confidence reads LOW on purpose, and the instant a class enters real local inputs the confidence visibly climbs from LOW to MEDIUM. The clip must read as measurement and uncertainty shown live, not a polished black box. Keep it moving, since the category bars get only two quick beats, then the scene opens the input wizard, so the opening minute of Scene 1 plus this scene is never spent staring at one static state.

**Pre-roll state.** Stay on the SchoolFootprint card inside the Learning hub's AI Coach sub-tab, carried forward from Scene 1's clean exit, with no navigation required since this is the same card. The "School footprint" eyebrow, the `186.2t` headline, the confidence chip beside it, the category bars grid, and the "Update school data" button below the bars are the surfaces this scene uses, so frame them before the first frame rolls. This card renders no sample-data chip in code, so if the build runs the coach on sample data, run a `sample data` caption through the static beats so the labeled-data disclosure is on camera here. Park the cursor at rest in neutral space in the lower third, not hovering any interactive element. Confirm that the Electricity bar row, the Heating (natural gas) bar row, the LOW confidence chip, the "Update school data" button, and the wizard's "Meals served/day," "% driven to school," and "Water (m3/mo)" input fields plus the "Save baseline" button that drives LOW to MEDIUM all render in the live build before capture, and record the exact tested input values, meals served per day, commute share percent, and water, so the take is repeatable. If these fields do not render on screen at capture time, do not film Scene 2 as written, and return it to the script owner. The choreography below assumes they render as described, and every named click must hit the real element, never nearby whitespace.

**Cursor and click choreography.** Apply the golden rhythm on every beat. Default hold is 1 to 1.5 seconds unless stated. The static bars get only beats 1 and 2, and by beat 3 the scene opens the input wizard, so the static card never dominates the first minute.

1. The measured-energy beat, combined. Move in one clean arc to the Electricity bar row and click it once, framing it so the Heating (natural gas) bar row directly below sits inside the same zoom and both real rows read at once. Hold 1.5 seconds. Time it so the voiceover "Electricity and gas, about 82 tonnes a month" lands as the zoom settles on the two measured rows. This is one beat, not two, so the static bars do not eat the opening minute. The auto-zoom target is the paired Electricity and Heating (natural gas) rows.
2. Move to the LOW confidence chip and click once, directly on the "low confidence" text itself, not the adjacent help tooltip or caption space. Hold 1.5 seconds, slightly longer if the zoom is still easing. The key word in "the model rates its own confidence LOW on purpose" hits exactly as the zoom settles on LOW. This is the honesty beat, so let LOW fully own the frame, then move off the bars. The auto-zoom target is the LOW confidence text.
3. The screen change. Move to "Update school data" and click it once. Hold 1.5 seconds, roughly twelve seconds into the scene, while the wizard grid opens below the button and the zoom settles on the now-visible fields. This is the deliberate early exit from the static bars, and every beat after this lives on the opened wizard. The button label flips to "Close" while the wizard is open, so do not re-click it. No second click yet. The voiceover bridges with "the class adds real local inputs." The auto-zoom target is the "Update school data" button, then the wizard fields as they open.
4. Enter the three required inputs in one calm pass, treating data entry as a single deliberate action rather than three jittery hops, with "Meals served/day," then "% driven to school," then "Water (m3/mo)." Energy is pre-seeded, so do not touch the Electricity or Gas fields. Type at a steady pace with no hunting between fields and no on-camera corrections, letting the cursor and zoom glide field to field. All three are required, because the model needs four or more of the six categories on real data to reach MEDIUM, and meals alone will not move the chip. The auto-zoom target is the active input field as the cursor advances through meals, commute, then water.
5. Move to "Save baseline" and click it once, which triggers the card to reload. Immediately go still and do not chase the result with the cursor. The auto-zoom target is the "Save baseline" button.
6. Hold on the overall confidence chip for a full two seconds without moving, clicking, or scrolling, so the zoom holds on the chip while it transitions from LOW to MEDIUM. The payoff "the same scoring rule lifts the confidence to MEDIUM" must land precisely as the chip flips to MEDIUM. If the chip animates, the verb "lifts" should ride the animation rather than precede it. This is the emotional peak, so the settle must be rock-steady for clean playback on mute. End frame. The auto-zoom target is the overall confidence chip.

**Scroll budget.** At most one scroll, used only before beat 1 and only if the energy rows or the confidence chip and "Update school data" button are not already framed in the vertical center. Use a single slow scroll to seat the chip, the energy bar rows, and the button in view, then do not scroll again for the rest of the scene. If the wizard opens already centered, scroll is none from that point. Never micro-scroll to fix framing mid-beat or during a voiceover sentence.

**Caption sync.** Two captions only.
- `Energy = measured public data` fades in as the zoom settles on the combined energy rows in beat 1, on the 82-tonnes phrase, reinforcing "real and measured" exactly where the eye is. Hold it through the LOW beat, then fade it before the "Update school data" click so the wizard is uncluttered. Because this card renders no sample-data chip in code, run a `sample data` caption alongside it through the static beats so the labeled-data disclosure is on camera, then clear it before beat 6's second caption.
- `add real inputs → confidence LOW → MEDIUM` fades in at beat 6, timed to the chip flipping to MEDIUM, as a mute-mode backstop on the same frame the voiceover reaches MEDIUM. The second caption appears only after the first is gone.

**Avoid.**
- Clicking whitespace or the help tooltip near the LOW chip, since the zoom must land on the LOW confidence text itself.
- Letting the cursor chase the confidence chip after Save, which spikes velocity and lurches the zoom right on the payoff frame. Click Save baseline, then freeze.
- Treating the three inputs as three separate zoom beats with stop-start hunting, which reads busy and adds velocity spikes. Use one smooth entry pass.
- Entering only meals, since fewer than four real categories will not reach MEDIUM and the payoff fails.
- Touching the pre-seeded Electricity or Gas wizard fields during input entry.
- Switching sub-tabs, navigating to the Footprint Dashboard, or re-opening the card mid-scene, and scrolling during any voiceover sentence.
- Filming on sample data without the `sample data` caption visible, since this card renders no chip in code and the labeled-data disclosure must be on camera in this scene.
- Over-captioning, since two caption slots are the maximum and they never overlap the zoom's own emphasis.

**Retake trigger.** Reshoot if the confidence chip does not visibly transition from LOW to MEDIUM on the settled hold, or if the voiceover word "MEDIUM" fires before the chip flips, or if the cursor lurches the zoom on the Save-to-chip handoff so the chip is not steady and centered when it changes, or if the build is on sample data and no `sample data` caption is legible in frame.

**Clean exit.** End on the settled, centered overall confidence chip now reading MEDIUM, zoom fully at rest, the `add real inputs → confidence LOW → MEDIUM` caption visible, cursor still, with the wizard closed or scrolled out of frame so the card reads clean. Hold that final frame for about one second of dead air so the editor has a clean tail into Scene 3, which stays on this same SchoolFootprint card, then stop the take.

### Scene 3

**Goal.** Make the viewer feel the core thesis, the leverage ratio, land as one quiet realization across this thirty-second window from 1:05 to 1:35, where one student action, weighed by the same cited carbon factors against the school's largest institutional emissions line, is small, and the panel has already computed that comparison so the natural next thought is "then what should the school actually do." The clip must read as the product's center of gravity, calm and inevitable, not as a feature tour, and it must carry the title beat "the leverage ratio" on the same frame the panel's own message line holds.

**Pre-roll state.** Stay on the SchoolFootprint card inside the Learning hub's AI Coach sub-tab, carried forward from Scene 2's clean exit in the post-Scene-2 state, with no navigation required since this is the same card. The overall confidence chip shows MEDIUM, the category bars render with the top bar coral and flame-marked, and the "Action leverage" panel sits below the bars, that is the green-tinted box with the "Action leverage" eyebrow and one muted message line. The "Update school data" wizard must be closed, so the button reads "Update school data," not "Close," and no input grid clutters the frame. Rest the cursor near vertical center, idle, with no highlight pulse showing. The "Action leverage" panel begins below the fold, so do not pre-scroll it into view, and the one allowed scroll brings it up on camera. Because this card renders no sample-data chip in code, run a `sample data` caption through the clip so the mock-data disclosure is on screen for a muted-scrub judge. The "Action leverage" panel and the literal leverage line were verified against source in `frontend/src/components/SchoolFootprint.jsx` lines 114 to 118, the green-tinted box with the "Action leverage" eyebrow and one muted line of `leverage.message`, seated below the category bars and above the recommendation on the SchoolFootprint card, and the panel renders only when the `leverage` object exists, so confirm it is present at pre-roll. The script phrase "the largest school emissions line" maps to the top coral category bar marked with the flame icon, the biggest hidden emitter, since there is no distinct "biggest line" element beyond that bar. The computed comparison is the single `leverage.message` line inside the panel, not a separate widget. If the named element does not render at capture time, flag it to the script owner before rolling rather than clicking a substitute.

**Cursor and click choreography.** Three clicks total across two distinct targets, each click isolated by its full hold, paced so the scene fills the 1:05 to 1:35 window without rushing.

1. Settle the thesis line. After the single centering scroll, move in one clean arc and click once directly on the muted leverage message text inside the "Action leverage" panel, that is the `leverage.message` line, not the eyebrow or the panel padding. Hold dead still for 1.5 seconds while the zoom eases in and commits to the message text. The auto-zoom target is the message line, and time it so the title phrase "we call it the leverage ratio" lands exactly as the zoom finishes settling.
2. The largest school emissions line. Keeping the panel framed, move in one smooth arc up to the top coral category bar, the flame-marked biggest emitter in the first row of the bars grid, and click once on that bar or on its kg/mo value. Hold dead still for 1.5 seconds while the zoom recenters and the auto-zoom target becomes the largest line. Time it so the phrase "against the school's institutional emissions" lands as the zoom settles, so the viewer sees the institutional magnitude exactly when the voiceover names it.
3. Return to the computed comparison for the close. Move back down in one arc and click once again on the same muted leverage message line, the auto-zoom returning to settle on that text. Hold 1.5 seconds and stay there through the closing voiceover, so the close "what should the school actually do" lands while the frame rests on the message line. This is the end frame, so do not move after the settle, and let the held still ride to the 1:35 cut.

**Scroll budget.** Exactly one scroll, used only at the very top of the clip before beat 1, a single slow scroll down to bring the "Action leverage" panel to vertical center, then stop. No micro-scroll to fix framing, no scroll between beats, and no scroll during any voiceover sentence. If the panel overshoots center, do not correct with a second scroll, and reframe in the edit or retake the scroll.

**Caption sync.** One emphasis caption only: `Leverage: one student action vs the largest school emissions line`. Fade it in as beat 2's zoom settles on the coral bar, the moment both halves of the comparison are on screen, since that is when the caption's claim is literally visible. Hold it through beat 3, then fade it out before the final settle completes so the closing frame on the message line is clean. Do not caption beat 1, and let the zoom and the voiceover carry "the leverage ratio" alone. The `sample data` caption carried through this clip is a disclosure label, not an emphasis caption, and does not count against this one-caption budget, since this card renders no sample-data chip in code.

**Avoid.**
- Opening the "Update school data" wizard or letting its input grid appear, which pushes the leverage panel and forces a corrective scroll.
- Clicking the recommendation card directly below the panel, which is Scene 4 territory and would recenter the zoom onto the wrong box.
- Clicking the confidence chip or the help tooltip near the headline, which are Scene 2 targets and read as backtracking.
- Scrolling more than the single centering scroll, micro-scrolling between beats, or hover-jittering over the bars while hunting for the coral one, and instead move in a single arc to it.
- Letting any key word, "the leverage ratio," "institutional emissions," or "what should the school actually do," fire before its zoom settles.

**Retake trigger.** Reshoot if a click lands anywhere other than the leverage message line or the top coral bar, or if any scroll, second click, or cursor jitter happens during a 1.5-second hold so the zoom never settles and the key word lands on a moving frame. Also reshoot if the confidence chip is not already reading MEDIUM at pre-roll, since this scene inherits that state from Scene 2, or if the caption renders before beat 2's coral-bar settle.

**Clean exit.** End on the settled, zoomed frame of the "Action leverage" panel's muted message line, beat 3's resting state, with the computed comparison filling the frame, the caption already faded, and the cursor still, immediately after the voiceover word "do." Cut on that held still frame. Scene 4 opens on the Home screen's "School Hidden Footprint" card, so the navigation from this AI Coach card back to Home is an edited cut between scenes and is not filmed inside this clip.

### Scene 4

**Goal.** Make the viewer watch the AI do its hardest reasoning and then watch it hand the decision to a person, where the model learns a weather-and-occupancy-adjusted baseline, flags a real anomaly, forecasts forward, ranks a specific fix with a projected carbon number, and drafts the rationale, yet the recommendation stays a proposal until a named staff member approves it, after which the plan shows a measured before-and-after reduction. The clip must read as anomaly to ranked decision to human-approved goal to measured outcome, governance you can watch happen, not a feature tour.

**Pre-roll state.** Start on the Home screen with the School Hidden Footprint card fully visible, including the sparkle gradient badge, the green uppercase "AI Insights" eyebrow, the "School Hidden Footprint" heading, the "Anomalies · Predictions · Recommendations" subtitle, and the navigation arrow button (`frontend/src/pages/Home.jsx` ~L69-82). Park the cursor in neutral lower-center, dead still, and do not pre-scroll Home. The FootprintDashboard data must already be seeded so that when section ④ loads, at least one RecommendationCard renders in the proposed, awaiting-approval state with a visible approve-and-make-active-goal button, and so that at least one already-approved action item carries a recorded before-and-after value from `action_plan_items`, so the closing beat shows a real reduction and not only a projection. If no approved item has an after-value in the seed, set one before rolling. If the build runs the insights view on sample data, add a `sample data` caption on the dashboard before filming so a muted-scrub judge sees the disclosure. No modal or notifications dropdown is open. What renders per recommendation is an uppercase category label; a single status chip that is either the proposed, awaiting-approval chip or, after approval, the green approved, active-school-goal chip, with two states only and no verified chip; the recommendation title; a "Why:" reasoning box; an "Estimated impact:" badge; a "Projected annual CO2e avoided: N kg" badge; an Assign section and button; and the approve-and-make-active-goal button, which becomes the active, visible-on-school-leaderboard-feed status bar after approval. The measured before-and-after value with its percent reduction does not sit on the proposed card, since it lives on the separate already-approved action item from `action_plan_items`, reached by the second scroll in beat 8. The choreography below maps each voiceover beat to an element that exists, so do not hunt on camera for a per-action `~X kg/mo` headline, a cost-band line, a `Verify by:` line, or a verified chip, since hunting is a retake trigger and they are not there.

**Cursor and click choreography.** Each beat is one deliberate action, one clean arc, a still hold while the zoom settles, then the key word. This scene runs 1:35 to 2:20, so the eight beats are paced to leave the longest hold for the approval flip and the measured before/after.

1. Click the School Hidden Footprint card by clicking the "School Hidden Footprint" heading itself, not the surrounding whitespace, so the card is the target. Hold 1.5 seconds while the zoom settles and the view navigates to the FootprintDashboard. The voiceover opens, "This is where the AI does its hardest reasoning," over the navigation, so the dashboard is in frame as the sentence about learning the baseline begins.
2. After the dashboard paints, take the first of the two allowed scrolls to bring section ④ into vertical center, stopping with the top-ranked RecommendationCard centered, then click that card's recommendation title. Hold 1.5 seconds while the zoom lands on the top action. The key word "ranks" lands as the zoom settles, so the viewer sees the ranked fix exactly as the voiceover names the ranking step that follows the anomaly and forecast.
3. Click the "Projected annual CO2e avoided: N kg" badge, on the green number itself, since this is the real per-action carbon figure. Hold 1.5 seconds. The voiceover "it shows the projected annual CO2e avoided for each one" lands here, on the exact number the zoom is holding.
4. Click the "Estimated impact:" badge. Hold 1 second while the zoom recenters on the impact figure. The voiceover bridges across the impact range here without naming a cost band, since no cost-band element renders, and the badge under the cursor is the real impact surface.
5. Click the "Why:" reasoning box, on the "Why:" label inside the gray panel. Hold 1.5 seconds while the zoom settles on the AI's stated rationale. The voiceover "the Why box is retrieved evidence the model drafts into plain language" rides this beat, since the box is the on-screen proof that the wording is AI-drafted evidence, not an asserted claim.
6. Click the proposed, awaiting-approval status chip at the card top. Hold 1 second while the zoom lands on the word "Proposed." The voiceover "but the AI can only propose, and the card stays Proposed until that staff member clicks Approve" begins here, so the governance gate is on screen the instant it is named.
7. Click the approve-and-make-active-goal button. Hold 1.5 seconds dead still while the approve action resolves and the card flips state, the chip changes to the green approved, active-school-goal chip and the button region becomes the active, visible-on-school-leaderboard-feed status bar. The voiceover "Once approved, the action becomes an active school goal" lands exactly as the green state settles. This is the governance center of the scene, so do not rush the hold, and let the green state fully settle before any further move.
8. Take the second allowed scroll to bring the already-approved action item's measured before-and-after value into vertical center, the `action_plan_items` before-versus-after figure with its percent reduction, then stop. Hold 2 seconds dead still while the zoom rests on the recorded reduction. The voiceover tail "the plan tracks a real before-and-after reduction, so the loop closes on a measured outcome and not only a prediction" plays over this settled frame, and the closing rule "AI reasons and proposes, a person approves, and the AI never changes a building setting on its own" trails out as the clip ends here. This is the end frame, so do not click or move after the settle.

**Scroll budget.** Exactly two scrolls, both single slow centering moves. The first is at beat 2, to bring section ④ and the top RecommendationCard into vertical center after the dashboard loads. The second is at beat 8, to bring the approved item's measured before-and-after value into center after the approval flip. Do not scroll to reveal sections ②, ③, or ⑤, do not micro-scroll to reframe the proposed card after approval since beat 7's state change happens in place, and do not scroll during any voiceover sentence other than the two deliberate centering moves.

**Caption sync.** Two captions only, matching the script's two on-screen text strings, in the bottom third, high contrast.
- `anomaly z>=2 · forecast · ranked fix · projected CO2e avoided` fades in as the beat 2 to 3 zoom settles on the top card's projected-CO2e badge, under the voiceover word "ranks," since every field it names maps to the reasoning the voiceover has just described and to the real badge on screen. Hold it through beat 5, then fade it before the approval flip.
- `proposed → staff-approved active goal · measured before/after` fades in the instant the Approve click in beat 7 flips the card to green, under the voiceover "Once approved," and holds across beat 8 so the measured-reduction half of the caption lands on the same frame as the before-and-after value. Clear it before the clean exit.

**Avoid.**
- Hunting for a `~X kg/mo` headline, a cost-band-with-effort line, a `Verify by:` line, a `proposed → approved → verified` triple, or a before-and-after row on the proposed card. They do not exist there, cursor-hunting spikes velocity and is an automatic retake, and the before-and-after lives only on the separate approved item reached in beat 8.
- Opening the Assign flow, the dropdown plus textarea, on camera, which expands the card and reframes the shot mid-scene. Approval, not assignment, is the story.
- Clicking any help tooltip, the refresh icon, or a flag-as-inaccurate control, each of which opens an overlay or recomputes and reframes.
- Double-tapping Approve or clicking again during the beat 7 state-flip hold, since the card is mid-transition and a second click lands on a moved element.
- Scrolling into sections ② Anomaly, ③ Forecast, or ⑤ Generative AI Layer, which are out of scope and would burn one of the two deliberate scrolls.
- Circling or hover-jitter over the badges while waiting for the voiceover. Rest the cursor between beats.
- Ending the scene on the proposed card instead of the approved item's measured before-and-after value, since the scene must close on the measured outcome, not the projection.

**Retake trigger.** Reshoot if the Approve click in beat 7 does not visibly flip the card to the green approved, active-school-goal state and the active, visible-on-school-leaderboard-feed status bar on camera, since the governance flip is load-bearing. Reshoot if beat 8 lands on a projection or a blank instead of the real `action_plan_items` before-and-after value with its percent reduction, since the scene now must end on a measured reduction and not only a forecast. Also reshoot if any key word ("ranks," "projected annual CO2e avoided," "Once approved," "measured outcome") fires before its zoom settles, or if any stray click opens the Assign dropdown, a help tooltip, or a flag overlay and recenters the zoom on the wrong element. Each beat is an independent clip, so reshoot only the broken beat.

**Clean exit.** End on the approved item's measured before-and-after value, fully settled and centered, the recorded reduction and its percent figure filling the frame, the `proposed → staff-approved active goal · measured before/after` caption still up, cursor at rest just off the value, no motion in progress. Hold this still frame for about one second so the editor has a clean tail into Scene 5, which opens on the Research Library sub-tab.

### Scene 5

**Goal.** Make the viewer feel that EcoRise is not a quiz toy but the class's AI-powered library, a thousand-paper seeded research corpus the class can browse, interrogate, summarize, and visualize, where every answer is traceable to its source and shown with a visible citation, so retrieval reads as grounded, not free-associated. The clip must read as primary-source rigor made effortless, and must keep the seeded-corpus disclosure on screen for a mute scrub, since this scene runs 2:20 to 3:05 and carries AI Reasoning as its primary rubric area.

**Pre-roll state.** Arrive on the Learning hub with the Research Library sub-tab selected, reached from Scene 4 by cutting back to Home and switching the bottom navigation to Learning, then toggling the sub-tab pill from AI Coach to "Research Library," which renders the ResearchLibrary component with the AIReportCard below it. Make this navigation before the clip starts, off camera, so the first frame opens with the sub-tab pill showing "Research Library" active and "AI Coach" inactive. Visible from the top are the green eyebrow "Research library · 1,000 papers" (`frontend/src/components/ResearchLibrary.jsx` L166), the "Ask the research" card with its "Ask a question…" input and "Ask" button, and below it the "Search papers…" input paired with the "Browse" button plus the topic chip row. This component renders no `demo corpus / sample data` chip and no `offline embeddings` label in code, so run both as captions through the clip rather than expecting an on-screen chip, since the disclosure must survive a muted scrub. The papers list must be unloaded at pre-roll, showing the "Browse the corpus →" prompt with no `{total} matching papers` line yet, so the first Browse click visibly populates it. No answer card, expanded summary, or visual is rendered yet. Park the cursor in lower-center dead space, still. The "Research" tab is the Research Library sub-tab of the Learning hub, reached via the AI Coach / Research Library toggle, not a top-level nav tab, and the "Visual" button renders as "Visualize" in source, so the directions below use the real labels so the editor does not hunt for a literal "Research" tab or "Visual" button. The answer card renders no similarity or match score in code, only the answer text and its leaf-icon citation chips (the `Cite` component, `ResearchLibrary.jsx` L16-23), so there is no score click in beat 5: hold the citation chip for the full duration and use the `every answer cited` caption rather than claiming a score the frame does not show. Do not put a fixed grounding threshold or a guaranteed example score on screen.

**Cursor and click choreography.** Each beat is one deliberate action, one clean arc, a still hold while the zoom settles, then the key word, timed so the voiceover key word lands as the zoom finishes settling.

1. Browse, first load. One clean arc to the "Browse" button, right of the "Search papers…" input. Click once. Hold 1.5 seconds dead still while the zoom lands on the "Browse" button and the `{total} matching papers` line that pops in beneath it. The key word "browse it" lands as the zoom settles on the freshly loaded list.
2. Browse again, fresh set. The cursor is already resting on "Browse," so do not move it away. Click "Browse" a second time. Hold 1.5 seconds still while the set swaps in and at least the first two paper titles visibly change. The zoom stays on the same region, reinforcing the corpus depth. No key word is required here, and cut this corpus-depth proof beat under "a 1,000-paper research corpus, ingested from OpenAlex and seeded as a demo corpus." If the list does not visibly swap on a 1080x1920 mute playback, drop this beat in the edit.
3. Ask the research, open input. One smooth arc up to the "Ask a question…" input inside the "Ask the research" card. Click once into the field. Hold 1 second while the zoom eases up to frame the input and its "Ask" button. Let the eased zoom finish before any keys move.
4. Type the question, then Ask. With the field framed, type `Does biking instead of driving meaningfully cut emissions?` at a steady, even cadence with no backspacing. Then move one clean arc to the "Ask" button and click once. Hold 1.5 seconds still through the busy state until the green answer card renders and the zoom settles on the answer text. The key phrase "answers using only those passages" lands as the answer paints in.
5. The citation. Do not re-navigate. Move one short, smooth arc down onto the citation chip, the leaf-icon source chip rendered beneath the answer text. Click the chip itself, not the answer whitespace. Hold the full 1.5 to 3 seconds still while the zoom lands squarely on the chip, paper title plus year. The key word "with the citation visible" lands exactly as the zoom settles, and the frame rests on the citation chip through the close, since the answer card renders no similarity or match score in code and there is no score element to click. This is the scene's emphasis region, so the click must land on the chip, never on prose.
6. Summarize. Take the one allowed scroll first, then on the centered first PaperCard move one clean arc onto its "Summarize" button, the leaf icon, secondary style. Click once. Hold 1.5 seconds through the "Summarizing…" state until the green key-points box renders and the zoom settles on the plain-language key points, the TL;DR line plus bulleted key points. The key word "plain-language key points" lands as the bullets appear.
7. Visualize. On the same PaperCard, move one short arc to its "Visualize" button, the sparkle icon, primary style, immediately right of Summarize. Click once. Hold 1.5 seconds through the "Visualizing…" state until the gradient infographic renders and the zoom lands on the infographic, headline plus metric value plus the cause-to-effect flow chips with arrows. The key phrase "cause-and-effect visual" lands as the flow chips paint in.

**Scroll budget.** Exactly one scroll, used once between beat 5 and beat 6, a single slow, deliberate scroll to bring the first PaperCard with its Summarize and Visualize buttons into the vertical center, then stop and settle before clicking Summarize. No other scrolling. The summary and visual pop-in animations play within the centered card, and the zoom carries the reveal. If the rendered Visualize infographic overflows the frame bottom, that overflow is acceptable, so do not chase it with a second scroll.

**Caption sync.** Three emphasis captions, each appearing as its matching zoom settles, never before, plus the running disclosure captions. The disclosure captions `demo corpus / sample data` and, if the build runs the offline embedding fallback, `offline embeddings`, run throughout the clip as mute-mode disclosure labels, since this component renders neither in code, and they do not count against the emphasis-caption budget.
- `1,000-paper seeded research corpus` fades in on beat 1 as the first Browse list settles, reinforcing the on-screen "Research library · 1,000 papers" eyebrow, and deliberately framing the corpus as seeded rather than as a thousand live papers, per the honesty guardrails.
- `every answer cited` fades in on beat 5 exactly as the zoom lands on the citation chip and the voiceover says "citation," then holds through the citation hold. This is the scene's headline caption, and because the answer card renders no score, the caption omits any "+ scored" claim so the on-screen text never names a number the frame does not show.
- `retrieve top-k · ask · summarize · visualize` fades in across beats 6 and 7, timed to land as the Visualize infographic settles, tying the retrieval and the three AI actions together at the clip's peak. Let it clear before the clean exit.

Each emphasis caption clears before the next beat's click, so emphasis captions never stack two-high over the zoom.

**Avoid.**
- Typing into the "Ask a question…" field while the zoom is still easing in between beats 3 and 4, since typing plus an in-flight zoom reads as a double action and lurches the push-in. Let the zoom settle, then type.
- Clicking the green answer text or surrounding whitespace when you mean the citation chip, which would land the emphasis on prose instead of the source and kill the beat.
- Putting any fixed grounding threshold or a guaranteed example score on screen, or hunting for a score element, since the answer card renders no similarity or match score in code.
- Clicking a topic chip or the "Search papers…" input, which re-filters or reloads the list and reframes the shot.
- Pressing "Browse" more than the two scripted times, since a third click re-randomizes again and looks like nervous hunting.
- Moving the cursor during any "Summarizing…," "Visualizing…," or busy state, since the render pop-in plus a moving cursor is two velocity sources the easing amplifies.
- Dropping the `demo corpus / sample data` disclosure caption, or the `offline embeddings` caption if the build runs the fallback, at any point the corpus is on screen, since this component renders neither chip in code and a muted-scrub judge must still see the disclosure.
- Circling, hover-jitter over the leaf or sparkle icons, or fast wheel-scroll on the single allowed scroll.

**Retake trigger.** Reshoot if the citation chip zoom in beat 5 lands on the answer body or whitespace instead of the source chip, or if any click, second navigation, or scroll fires during a settle hold or a busy-state render so a key zoom never settles and the voiceover word lands on a moving frame. Also reshoot if the `demo corpus / sample data` disclosure caption is not legible at any point the corpus is on screen, since the seeded-corpus claim must stay visible on mute.

**Clean exit.** End on the fully rendered Visualize infographic, the gradient header headline, the large green metric value, and the cause-to-effect flow chips with their arrows, settled and motionless, with the `retrieve top-k · ask · summarize · visualize` caption already cleared. Hold this static frame for about half a second with the cursor resting just below the infographic, so the editor has still tail handles into Scene 6, which stays on the same Research Library sub-tab and reuses the "Ask a question…" box.

### Scene 6

**Goal.** Make the viewer feel the single most trust-building beat of the demo, the one named in the title, the proof that the AI says nothing, where a question lands outside the corpus, the AI visibly chooses silence over invention, and then that silence is shown to be measured, not lucky, on a report card the teacher can re-run. The clip must convert "the AI refused" from a claim into something the viewer watched happen and then saw scored, across the 3:05 to 3:45 window.

**Pre-roll state.** Stay on the Learning hub with the Research Library sub-tab already active, carried forward from Scene 5's clean exit, with the toggle pill showing "Research Library" selected and "AI Coach" inactive. The "Ask a question…" input must be empty and idle with no answer card lingering from Scene 5, and the `demo corpus / sample data` disclosure caption must still run, since this component renders no chip in code and the mock-mode disclosure stays visible on mute through captions only. The AI report card, the "AI report card" eyebrow over its metrics grid of Faithfulness pass, Citation validity, Unanswerable refusal, and Hallucination rate, plus its status chip, sits further down the same view in `frontend/src/pages/Research.jsx`, below the fold and untouched. CRITICAL: this card renders only when the `/api/coach/eval-report` endpoint returns `available: true` with metrics, otherwise it returns null in production and shows nothing, so before filming confirm `npm run seed:coach` and the eval harness populate it. If the card does not render in the live build, reframe beats 5 to 9 around the "Responsible AI guardrails" card, the orange-outlined footer with the "Responsible AI guardrails" eyebrow and its HelpTip (`Research.jsx` L105), which always renders below the report card, or carry the metrics as captions. Park the cursor in the lower-middle of the frame, dead still. Nothing is pre-typed, and the question is typed live on camera. Before the session, capture the exact refusal string the running build renders in the answer area and lock it for the edit, so the emotional center beat is the app's real copy and not improvised wording. The "Research Library" sub-tab matches the sub-tab of the Learning hub, not a top-level nav tab. The refusal copy "No grounded answer found in the corpus." is the code default in `ResearchLibrary.jsx` L190, but capture and lock whatever literal string the running app renders, and match the app, not the script, if they differ. Confirm the refusal is silent, with no toast or animation, so the four-second hold lands. The "refusal rate" maps to the AI report card row "Unanswerable refusal," and there is no row literally labeled "refusal rate," so aim the refusal-metric zoom at the "Unanswerable refusal" row.

**Cursor and click choreography.**

1. Move in one clean arc to the "Ask a question…" input and click once to focus it. Hold 1 second still while the zoom lands on the input field. This settles as the voiceover opens, "This is the safety proof, and it is the most important reasoning the AI does."
2. Type the out-of-corpus question `Who won the 2022 World Cup?` at a steady, even pace, then submit with Enter. Do not move the cursor while typing, and keep it still on the input region. The zoom remains on the input and submit area as the voiceover reaches "Ask something outside the research corpus, and EcoRise does not improvise."
3. When the locked refusal string renders in the answer area, do nothing for four full seconds. No click, no cursor move, no scroll. Let the zoom rest on the refusal message. This dead-still four-second hold is the emotional center of the clip and the literal payoff of the scene title, with the voiceover landing "the AI refuses, because it is allowed to say nothing rather than guess," and the key word "nothing" arriving while the frame is still on the refusal line.
4. Optional harder probe, only if rehearsed and reliable. Click the "Ask a question…" input again, type `What exact percent will meatless Mondays cut our school's emissions?`, submit, and hold three seconds on the refusal or no-number response. The zoom stays on the answer area. If the app ever invents a number here, drop this beat entirely in the edit and do not improvise around it on camera. Skip the beat if there is any doubt.
5. Take the scene's one scroll to bring the AI report card to vertical center, then stop. Do not click during the scroll. Settle 1 second with the card centered and still, as the voiceover bridges into the three-gate check, "Before any answer is allowed, it passes a three-gate faithfulness check."
6. Click once directly on the "Faithfulness pass" row of the metrics grid, on the row itself, not adjacent whitespace. Hold 1.5 seconds while the zoom lands on the Faithfulness pass value, so the key word "faithfulness" lands as the zoom settles. This row stands for the whole "and a language-model judge then checks whether the answer is entailed by the source" gate the voiceover has just named.
7. Click once directly on the "Citation validity" row. Hold 1.5 seconds while the zoom recenters, timed so "citation validity" lands as it settles, matching the voiceover's "every citation must exist and be in the passages just retrieved."
8. Click once directly on the "Unanswerable refusal" row, the stand-in for the script's "refusal rate." Hold 1.5 seconds while the zoom recenters and the key word "refusal rate" lands as the zoom settles.
9. Click once directly on the "Hallucination rate" row. Hold 1.5 seconds while the zoom recenters and "hallucination rate" lands as it settles. Let this final hold extend through the voiceover tail, "These are illustrative results from our fixtures, not a third-party benchmark, and teachers can see the failures, not just the wins," without any further click.

Across beats 6 to 9 the sequence is strictly action, then settle, then word, so each metric is the thing under the cursor when clicked and the emphasis lands on the exact pixel the voiceover names, in order, faithfulness, citation validity, refusal rate, hallucination rate. One click per metric, never two. The numeric-claim gate the voiceover names, "every number in the answer must appear in the cited evidence," has no dedicated report-card row, so it rides under the Faithfulness pass and Citation validity holds rather than getting its own click, and do not hunt for a row the map does not show.

**Scroll budget.** Exactly one scroll, at beat 5 only, used solely to center the AI report card before the metric clicks. No scroll during typing, during the four-second refusal hold, or to reframe any metric. If the four named metric rows do not all fit in the centered card view, choose the scroll stop that seats Faithfulness pass through Hallucination rate in frame so beats 6 to 9 need no further scroll.

**Caption sync.** Two emphasis captions only, in the bottom third, high contrast, plus the running `demo corpus / sample data` disclosure caption that carries over from Scene 5 while the corpus is on screen, since this component renders no chip in code.
- `"The AI is allowed to say nothing."` fades in at the start of the four-second refusal hold in beat 3, timed to the voiceover phrase "allowed to say nothing," and holds for that dead-still beat, then fades before the scroll. This is the scene's headline caption and matches the title's promise.
- `3-gate faithfulness check · illustrative eval on a re-runnable test set` fades in as the AI report card settles centered at the end of beat 5, on the voiceover's "three-gate faithfulness check," and holds across the metric zooms in beats 6 to 9, so the illustrative-not-benchmark disclosure stays visible on mute. Do not stack a third emphasis caption on the individual metrics, since the zoom names each one.

**Avoid.**
- Moving or jittering the cursor during the four-second refusal hold, since any motion breaks the most important beat and makes the silence read as a glitch rather than a choice.
- Letting a take through whose refusal copy differs from the locked string captured in pre-roll, since the emotional center must be the app's real, consistent wording.
- Scrolling more than once, or scrolling during typing or the refusal hold. The one permitted scroll is beat 5 only.
- Clicking whitespace near a metric instead of the metric row, which lands the zoom off the named number.
- Hunting for the submit control or re-clicking the input after submitting. Pre-locate submit so the type-and-submit in beat 2 is one clean motion.
- Fast or uneven typing that the cursor easing amplifies. Type at a steady cadence.
- Running the optional harder probe in beat 4 live if it has not been rehearsed to refuse reliably, since an invented number on camera contradicts the entire scene.
- Stacking captions on every metric or flaring the click highlight, either of which fights the zoom and reads as noisy on mute.

**Retake trigger.** Reshoot if the cursor moves, clicks, or scrolls at any point inside the four-second refusal hold, since the silence beat is the whole scene. Also reshoot if the rendered refusal copy does not match the locked string, if any metric click lands off its named row so the zoom settles on the wrong pixel, or if the app invents an answer to either probe rather than refusing.

**Clean exit.** End on the fully settled push-in over the "Hallucination rate" row of the AI report card, the value centered and the zoom completely at rest, with the `3-gate faithfulness check · illustrative eval on a re-runnable test set` caption still up. Hold that static frame for roughly one second after the voiceover tail finishes, with no cursor motion and no pending click, so the cut into Scene 7 lands clean and never mid-transition.

### Scene 7

**Goal.** Make the viewer feel the student loop close honestly and completely, in the 3:45 to 4:35 window, where a logged photo becomes a verified action, the kilograms come from a cited emission factor and deterministic code rather than the AI, the points are scored server-side from an immutable ledger, and that single action then surfaces publicly in the Feed with its own photo, pings the student through the notifications bell, and feeds the quest ranking that the school's biggest emitter drives. The clip must read as "the AI perceives and describes, but never writes a carbon figure or awards itself a point," and as one continuous, deliberate journey from logged action to public recognition to the next quest. This is the closing student-side proof, so every navigation is its own beat and the division of labor stays legible on mute.

**Pre-roll state.** Arrive on the Quests screen by switching the bottom navigation from Scene 6's Learning tab to the Quests tab before the clip starts, off camera, so the first frame opens cleanly on Quests, or on the Home screen with the Quests section in view, whichever take begins cleanest, with the "Log action" card, the camera icon, green, in the Quick Actions Grid (`frontend/src/pages/Quests.jsx` L76), visible and centered before the clip starts. Do not start mid-scroll. Treat the photo upload as an edited insert, feeding it a seeded demo image path or a drag-drop test fixture, or cutting from the upload click straight to the analyzing state, so no OS file-picker ever appears on camera, and if the OS picker shows in the raw take, that take is unusable. The notifications bell on the Home header already carries seeded unread history with an unread badge, so the bell reads as real content the instant it opens. The Feed already shows a topical action photo on each post rather than an empty banner, so the freshly created post intercuts against a populated feed. Points are scored server-side from an immutable ledger, so any points value shown inside the Log Action modal is a client-side estimate and the authoritative point arrives in the Feed card Points chip and the notifications bell entry; confirm in pre-flight that the modal writes no points itself. If the build renders an on-screen mock or demo-data label on these surfaces, leave it visible and do not click it, since the honesty of the demo depends on that label staying on screen. Park the cursor in lower-center neutral space, dead still, framed in the canonical portrait shell per the Global Setup.

**Cursor and click choreography.** Each beat is one deliberate action, one clean arc, a still hold while the zoom settles, then the key word, following the golden rhythm. Default hold is 1.5 seconds unless stated. There are eight beats across about fifty seconds, so do not rush the navigations.

1. Click the "Log action" card, the camera icon, green, in the Quick Actions Grid, on the card itself and not the surrounding grid whitespace. Hold 1.5 seconds dead still while the zoom lands on the "Log an eco action" modal header as the sheet slides up. The voiceover opens on "Students still take action, and here the division of labor is the whole point." No second click while the sheet settles.
2. Click the photo upload control, "Add a photo to log your action." Because the photo is pre-selected as an insert, the modal advances to the analyzing state, a spinner with "Analyzing your photo…". Do not click again during the spinner. Hold 1.5 seconds through the analyzing phase while the zoom rests center-frame on the spinner, as the voiceover reaches "When they log a photo, a vision model only perceives the action and its attributes."
3. Click directly on the "AI detected" eyebrow or the action headline inside the AI Detected Card, the detected-action line in the gradient pop-in card. Hold 1.5 seconds while the zoom lands on the detected-action text. The phrase "a vision model identifies the photo" completes as the zoom settles. This is the "AI perceives" half of the contrast, so the detected text is the target.
4. Click directly on the "CO2 SAVED" value, the green number with the "CO2 SAVED" label in the AI Detected Card, the deterministic carbon math. Hold 1.5 seconds while the zoom lands on the kilograms number. The key phrase "the kilograms come from the same cited emission factors" lands exactly as the zoom settles. The number under the cursor is the target, not the label or nearby whitespace.
5. Click "Post & earn points" to submit, the primary button in the result phase. After submit, the points become the emphasis. If a points value renders in the result or confirmation state, click directly on that points chip or value and hold 1.5 seconds while the zoom lands on the points number, so the key phrase "Points are scored server-side from an immutable ledger, and the AI never writes a carbon figure or a point to the database" lands as the zoom settles. If no in-modal points element renders, end this beat on the submitted result and defer the points click to beat 6, and do not invent an in-modal points element the build does not show. The Log Action result phase may not enumerate a distinct post-submit points element inside the modal, since the mapped points surfaces are the Feed card Points chip, top-right of the Media Band, and the notifications bell points entry, so retarget here if needed.
6. Click the "Feed" tab, bottom navigation. One clean navigation. The new post sits at the top of the Feed grid. Hold 2 seconds dead still on the freshly created post card while the zoom lands on its Media Band photo, the real, topical action photo, so the community side is visible. The voiceover: "After posting, the action appears in the Feed with its own photo." If the points emphasis was deferred from beat 5, click the Points chip, top-right of the Media Band, now, otherwise keep this a pure two-second hold on the photo with no second click.
7. Reach the Home header by clicking the Home tab, then click the notifications bell icon, top-right, to open the notifications history. Treat reaching Home and tapping the bell as two deliberate beats separated by a brief settle, never chained in one motion. Once the history opens, hold 1.5 seconds on the points entry the same action generated, the green unread dot, "Xm ago" timestamp, while the zoom lands on that row. The voiceover: "and triggers a points notification," so the journey from a logged action to public recognition stays visible.
8. Click "Quests," via Home's Quests section or the Quests tab, then click the top QuestCard, the quest tied to the school's biggest emitter, the top of the Quest List, with icon, title, the yellow "2x [base points]" chip, and its "Log photo" button. Hold 1.5 seconds while the zoom lands on that QuestCard title. End frame. The voiceover closes: "The quests then point students back at the school's biggest emitter, so the AI's footprint analysis is what drives the challenge, not the other way around."

**Scroll budget.** At most one scroll, and only if needed, a single slow scroll on the Feed in beat 6 to bring the freshly created top post into vertical center, then stop and hold. The newest post should already render at the top, so use no scroll at all if it is already in frame. Never scroll inside the Log Action modal, the notifications history, or the Quests list, and never micro-scroll to reframe mid-beat.

**Caption sync.** One caption only: `vision detects attributes · math is deterministic · points scored server-side`. Bring it up on beat 4, the moment the zoom finishes settling on the "CO2 SAVED" number, so it reinforces the deterministic-math claim exactly as the zoom spotlights it. Hold it through beat 5, then fade it before the Feed navigation in beat 6. Do not re-show it, let the zoom carry emphasis on beats 6 through 8, and never stack a second caption over the seeded mock-data label if one is on screen.

**Avoid.**
- Letting the OS file-picker dialog appear in beat 2, since the photo is pre-picked precisely so no system dialog opens. If the file dialog opens, the take is contaminated.
- Clicking again during the analyzing spinner in beat 2, since a second click mid-analysis reframes the zoom off the result card and breaks the reveal.
- Chaining Feed to Home to bell to Quests as a rapid multi-navigation. Each is its own deliberate beat with a settle, since fast double-navigation spikes cursor velocity and the zoom lurches across screens.
- Clicking nearby whitespace, the label, or the card padding when the carbon-math number or the points value is the target. The number itself must be under the cursor.
- Hover-jitter or hunting for the bell. Move in one clean arc to the top-right bell icon and click once.
- Clicking or dismissing the on-screen mock or demo-data label, the avatar menu, or any unrelated Quick Action while traveling between targets.
- Over-captioning. A single caption on beat 4 only, since a second caption fighting the Feed, bell, and Quests zooms reads busy on mute.

**Retake trigger.** Reshoot if the OS file-picker dialog appears during beat 2, which means the photo was not pre-selected, or if a second click during the analyzing spinner throws the zoom off the AI Detected Card. Also reshoot if any key word ("attributes," "emission factors," "server-side," "point to the database") fires before its zoom finishes settling, or if a stray or mis-aimed click during the Feed to Home to bell to Quests sequence recenters the camera on the wrong screen. Each beat is an independent clip, so reshoot only the broken beat.

**Clean exit.** End on the Quests screen with the top QuestCard, the biggest-emitter quest, centered and the zoom fully settled on its title, cursor at rest, no motion. Do not end mid-navigation or mid-zoom, and hold the settled frame about half a second past the final voiceover word "around" so the cut into Scene 8's School Footprint card open is clean.

### Scene 8

**Goal.** Land the close as a single honest comparison made visible, one student's `1.2 kg` against the school's `186.2t`, with the full system, the seeded research, the anomaly and forecast work, the named human approval, and the student-data privacy, summed up while the AI is shown to cite and wait. The clip must burn in the `186.2t` headline at open and again at close, and prove the screen set is complete by briefly showing the two named screens never otherwise filmed, onboarding and Privacy & data, so the final frame reads as a finished, accountable product, not a slideshow.

**Pre-roll state.** Return to the SchoolFootprint card inside the Learning hub's AI Coach sub-tab, reached from Scene 7 by switching the bottom navigation to Learning, which defaults to the AI Coach sub-tab so the SchoolFootprint card renders automatically. Make this navigation before the clip starts, off camera, so the first frame opens with the card already seated, the real tonnes value rendered, `hasBaseline` satisfied so the headline reads the one-decimal `186.2t` and not "Estimating…" or a zeroed value. The "School footprint" eyebrow, the large `186.2t` headline, the "CO2e / mo" label, the confidence chip with its help tooltip, and the coral category bars below are all in frame without scrolling, the same card and figure Scene 1 opened on. Because this card renders no sample-data chip in code, run a `sample data` caption rather than expecting an on-screen chip. Park the cursor in lower-third neutral space, off every interactive element, dead still before the first frame. This is the only screen that renders the tonnes headline, so do not substitute the Home "School Hidden Footprint" card or the Footprint Dashboard, since the close depends on clicking that exact figure twice on this card.

**Cursor and click choreography.** Apply the golden rhythm on every beat. Default hold is 1 to 1.5 seconds unless a longer hold is stated. This scene mixes two live clicks on the Footprint card with two inserted screens, so treat each navigation as its own deliberate beat and never chain them.

1. The footprint anchor. Move in one clean arc straight to the `186.2t` figure itself, not the "CO2e / mo" label, the confidence chip, or the help tooltip, stop, and click directly on the tonnes text. Hold 2 seconds dead still while the zoom eases in and commits to the headline. The voiceover word "footprint" lands exactly as the zoom finishes settling.
2. The onboarding insert. Cut to the onboarding still or short clip, the one named screen never otherwise shown, sourced from `frontend/src/pages/Onboarding.jsx`, and hold it 2 to 3 seconds so the screen set reads complete. Confirm in pre-flight that this screen is reachable or capturable, since Onboarding.jsx has no confirmed in-app route and may appear only during the signup flow; if it is not capturable, a captioned still or an alternative complete-screen visual is enough. This is an edited insert, not a live navigation, so do not film a routing path into it. No zoom commit on this insert, since it is a held still.
3. The Privacy screen entry. Cut or navigate into the Privacy and data screen, which is the PrivacyCenter component reached via `ctx.go('privacy')`, and let the transition fully finish before any zoom commits, so the heading is seated and not mid-animation. The in-context Privacy entry routes through `ctx.go('privacy')` from the Profile settings button. If Privacy is only reachable through Profile, do not film the Profile routing, and cut straight to the Privacy and data screen already loaded. Otherwise trigger the in-context Privacy entry and let it settle. No second click during the transition.
4. The privacy proof. Move to the "Privacy & data" heading, the h1 text directly under the green "FERPA & COPPA" eyebrow in PrivacyCenter (`frontend/src/components/PrivacyCenter.jsx` L152-153), stop, and click directly on the heading text. Hold 1.5 seconds dead still while the zoom settles on the heading. The voiceover word "privacy" lands as the zoom finishes settling.
5. The return. Cut or navigate back to the Footprint card and let it fully re-seat, headline visible and not mid-animation, before any cursor move. An edited cut is fine here, so do not film a hunting path back. No zoom commit until the card is steady.
6. The close on the gap. Move in one clean arc back to the `186.2t` figure and click directly on the tonnes text again. Hold 2.5 seconds dead still while the zoom eases in and commits. Time it so "186 tonnes" lands exactly as the zoom settles, then hold the same settled frame through "cite its sources" and end on this dead-still frame.

**Scroll budget.** None. The Footprint card is pre-framed with the `186.2t` headline and coral bars in view from the start, and the inserted onboarding and Privacy screens each open already centered. The only positional changes are the three navigations, into onboarding, into Privacy, and back to Footprint, each a deliberate cut, never a scroll. No micro-scroll or reframe anywhere in this clip.

**Caption sync.** Two emphasis captions only, both on settled frames, plus the running `sample data` disclosure caption over the SchoolFootprint card beats, since this card renders no chip in code.
- `Hidden footprint. Seeded research. Cited fixes.` fades in after the beat 1 headline zoom has fully settled on `186.2t`, confirming the figure the zoom is already holding, and fades before the onboarding insert so the inserts stay uncluttered. Do not pop it during cursor travel.
- `onboarding → privacy → footprint` fades in over the settled beat 6 close frame, timed to "186 tonnes," as a mute-mode backstop on the same frame the zoom is holding, and holds to the cut. The second emphasis caption appears only after the first is gone, and never stack two emphasis captions over one zoom.

**Avoid.**
- Clicking the "CO2e / mo" label, the confidence chip, the help tooltip, or a coral category bar instead of the literal `186.2t` tonnes text, which would land the zoom on the wrong element on the scene's two anchor beats.
- Navigating to the Home "School Hidden Footprint" card or the Footprint Dashboard, or switching to the Research Library sub-tab, since only the AI Coach sub-tab's SchoolFootprint card renders the tonnes headline this close needs.
- Filming a Profile routing path or any on-camera hunt into or out of the Privacy and data screen, and use an edited cut so no stray navigation reframes the shot.
- Committing a zoom mid-transition on beats 3 and 5, and let each screen fully seat before the cursor moves or clicks.
- Letting the cursor chase or jitter on the return to the Footprint card, which would spike velocity and lurch the zoom right on the closing payoff frame.
- Improvising the onboarding insert as a live tour, since it is a 2 to 3 second held still or short clip, not a navigated beat.
- Cutting the 2.5-second closing hold short, or letting "186 tonnes" or "cite its sources" fire before the final zoom has settled.
- A loud click-highlight flare or a third caption competing with the close.

**Retake trigger.** Reshoot if either anchor click lands anywhere other than the `186.2t` tonnes text, if the word "186 tonnes" or the phrase "cite its sources" fires before the closing zoom has finished settling, if the Footprint headline reads "Estimating…" or a zeroed value instead of the real one-decimal tonnes figure at either anchor beat, or if a transition into Privacy or back to the Footprint card is still animating when its beat's zoom commits. Each beat is an independent clip, so reshoot only the broken beat, and the two inserts can be re-cut without re-shooting the live Footprint beats.

**Clean exit.** End on the fully settled, zoomed frame of the `186.2t` figure, cursor still on the tonnes text, the `onboarding → privacy → footprint` caption holding, no motion in progress and no transition mid-flight. Freeze there as the final frame of the demo, holding through "cite its sources and wait for a human" into the end card or cut.

### Global Pre-Flight Checklist

Run every item before any capture session.

- App seeded: the FootprintDashboard has baseline data so the tonnes headline shows a real value (`hasBaseline` satisfied), not "Estimating…" or a zeroed state, and section ④ renders at least one RecommendationCard in the "Proposed, awaiting approval" state.
- Logged in: the correct demo board is active (Garfield High School), and the account state matches each scene's pre-roll.
- Photo pre-selected: the bike or LED photo is already picked into the file dialog so clicking the upload control in Scene 7 advances straight to analyzing and result, with no OS file-picker on camera.
- Demo data present: the research library shows "1,000 papers," the category bars are loaded with the coral cafeteria bar topmost, and the AI Report Card metrics are populated.
- Bell populated: the notifications bell carries seeded history with an unread coral badge so it reads as real content the instant it opens.
- Feed populated: the Feed shows topical action photos on each post, not empty banners, so the freshly created post intercuts against a real feed.
- Build verification: confirm the Scene 2 elements (Electricity row, Heating (gas) row, LOW confidence chip, "Update school data" button, the meals/commute/water input fields, and "Save") actually render in the running build. If they do not, send Scene 2 back to the script owner before filming.
- Recorder settings applied: the Global Setup settings are set (background, padding, cursor size, gentle click highlights, auto-zoom on, subtle motion blur, high smoothness) and the 1080×1920 portrait device frame is centered.

### Global Retake-Trigger and Continuity Checklist

Keep this open while filming. Reshoot the affected beat (not the whole scene) if any trigger fires.

**Retake triggers.**
- A click lands anywhere other than the named target element, so the zoom commits to the wrong pixel.
- Any movement, second click, or scroll happens during a settle hold, so the zoom never settles and the emphasis misses.
- A voiceover key word fires before its zoom finishes settling, breaking the action-then-settle-then-word order.
- Erratic cursor motion (circling, jitter, fast wheel-scroll, double navigation, or button-hunting) lurches the zoom.
- More than one scroll occurs in a scene, or a scroll is used for any reason other than centering the target panel once.
- Multiple deliberate actions are crammed into one beat.
- A mis-navigation or stray click anywhere recenters the camera wrongly.
- An overpowered click highlight or caption clutter fights the zoom.
- Capture drifts off the 1080×1920 portrait device frame, or framing goes off-center or full-bleed so it will not intercut.
- Scene-specific failures fire: the confidence chip does not climb LOW to MEDIUM (Scene 2), the RecommendationCard does not visibly flip to the green Approved state (Scene 4), the citation chip zoom misses the source chip (Scene 5), the cursor twitches inside the four-second refusal hold or the app invents an answer instead of refusing (Scene 6), the OS file-picker appears on camera (Scene 7), or the closing tonnes headline shows "Estimating…" or fires "186 tonnes" before the zoom settles (Scene 8).

**Continuity.**
- Every scene uses the identical 1080×1920 portrait device frame, centered, so all clips intercut.
- Voice and vocabulary stay consistent: "voiceover," "settle," "hold," "the zoom," and "the key word" mean the same thing in every scene.
- State carries forward across scenes: Scene 1 ends on the coral cafeteria bar and Scene 2 opens on the same FootprintDashboard; Scene 2 raises the confidence chip to MEDIUM and Scene 3 opens with it already at MEDIUM; Scene 5 ends on the Visualize infographic and Scene 6 reuses the same Research Library tab and "Ask a question…" box.
- Each beat is an independent, self-contained clip, so any single beat can be re-shot without re-shooting the scene around it.
- Captions appear only on settled frames, never stack two-high over a single zoom, and clear before the next beat's click.
- Hold times are honored exactly, including the per-scene overrides (Scene 1's three-second headline and two-second bar holds; Scene 6's four-second refusal hold; Scene 8's two-second, then 2.5-second headline holds).
