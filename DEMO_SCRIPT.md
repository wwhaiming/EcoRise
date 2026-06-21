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
- From the Home screen, open the **School Hidden Footprint** card, which now leads straight into the
  AI Insights action plan, and confirm that every action shows its monthly kilogram impact, a cost
  band with an effort line, and a "Verify by" metric, alongside an Approve control.
- On the Home header, open the **notifications bell** and confirm that the seeded history is present,
  with a small unread badge, so the bell already shows real content the moment a judge logs in.
- On the **Feed** tab, confirm that each post now carries a topical action photo rather than an empty
  banner, since the feed is part of what the closing scene shows.
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
- **SCREEN:** From the Home screen, open the **School Hidden Footprint** card, which now leads directly
  into the **AI Insights** action plan, so the deepest analysis in the product sits one tap from the
  landing screen. On the top ranked action, click `~X kg/mo`, pause. Click its **cost band · effort** line, pause. Click **Verify by:
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
  **points awarded**. Open the **Feed** tab and hold for two seconds on the post that this action just
  created, which now appears with a real action photo so the community side of the loop is visible.
  Open the **notifications bell** on the Home header and hold on the points entry that the same action
  generated. Then click **Quests** and click the top quest tied to the biggest emitter.
- **VO:** *"Students still take action, and it has to be just as honest as everything else. When
  someone logs an action, a vision model identifies the photo, but the kilograms come from the same
  cited factor, and the points are scored on the server. The AI can describe an action, but it can
  never award itself a single point. Once the action is verified, it surfaces in the class feed with its
  own photo, and the student receives a notification for the points that were awarded, so the journey
  from a logged action to public recognition stays visible to everyone in the class. And the quests the
  class sees are ranked by the school's biggest emitter, so the footprint decides what students are
  asked to do, rather than the other way around."*
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

**Goal.** Make the viewer feel a gut-level contradiction in the first ten seconds: one student's effort is a rounding error against the school's institutional emissions. The clip must burn two numbers into memory, the `≈186 t` headline and the single coral cafeteria bar, so the voiceover's "150,000 bike rides" lands on a frame the eye has already locked onto.

**Pre-roll state.** Open already on the FootprintDashboard, with the "[School Name] — Weekly Insights" header for the Garfield High School board in view. [Map flag: the script calls this the "School Footprint card," but the literal `≈186 t CO₂e / mo` headline and the coral cafeteria food bar live in the ① Input data / RawDataChart region of the FootprintDashboard, not on the Home-screen "School Hidden Footprint" card, which carries only a heading and a → button. Start on the dashboard so those exact elements render.] Position the view so the `≈186 t CO₂e / mo` headline sits in the upper-center of the frame and the coral cafeteria bar is visible without scrolling. Settle this framing before the clip starts and do not scroll on camera. Park the cursor in neutral space in the lower third, off any element, dead still before the first frame. Status chips such as "N anomalies detected" may be visible but are not touched.

**Cursor and click choreography.** The opening voiceover plays over a still, pre-framed shot, so do not click on the opening sentence. There are two clicks total in the scene.

1. Settle, no action. Hold the pre-framed still for the first voiceover sentences while the cursor rests motionless in neutral space. No zoom yet, roughly five seconds.
2. Click the `≈186 t CO₂e / mo` headline. Move in one clean arc straight to the headline number, stop, and click directly on the `≈186 t CO₂e / mo` text itself, not the surrounding label or whitespace. Hold three seconds dead still while the zoom eases in and commits to the headline. Time it so the word "186 tonnes" lands exactly as the zoom finishes settling.
3. Click the top coral cafeteria food bar. Move in one smooth arc down to the tallest coral bar in the RawDataChart (the cafeteria food line, the biggest at about 60.3 t), stop, and click directly on that coral bar itself, not the adjacent bars or the legend. Hold two seconds dead still while the zoom recenters and settles. Time it so the phrase "more than a hundred and fifty thousand of those bike rides" lands as the zoom finishes settling.
4. Hold the settled frame. Do not move or click. Let the coral-bar frame ride under the closing voiceover, cursor still on the bar, roughly three seconds, then cut.

**Scroll.** None. All framing is set in pre-roll, both targets are in frame from the start, and no scroll is needed or permitted anywhere in this clip.

**Caption sync.** Two captions only.
- `1.2 kg  vs  186,000 kg / month` fades in after the headline zoom has fully settled, roughly as the voiceover says "186 tonnes," so it confirms the number the zoom is already holding. Do not pop it during cursor travel.
- `built for the eco / env-science classroom` fades in over the settled coral-bar frame as the voiceover reaches "EcoRise is built for that classroom," and holds to the cut.

Captions appear only on settled frames and never overlap a cursor move or a zoom transition.

**Avoid.**
- Clicking the Home-screen "School Hidden Footprint" card or its → button instead of the literal `≈186 t` headline, which would land the zoom on the wrong element.
- Clicking a neighboring category bar, since Electricity at about 57.2 t is nearly as tall as cafeteria's 60.3 t, so aim only at the single tallest coral bar.
- Any scroll, micro-scroll, or reframe mid-clip.
- Touching a status chip, the 🔄 Refresh icon, or the ← Back icon while traveling between targets.
- Circling, hovering-jitter, or hunting for the bar. Move in one arc, stop, and click.
- Cutting the three-second headline hold or two-second bar hold short, since this scene overrides the default hold.
- A loud click-highlight flare or a third caption competing with the zoom.

**Retake trigger.** Reshoot if either the word "186 tonnes" or the phrase "150,000 bike rides" fires before its zoom has finished settling, or if a click lands anywhere other than the `≈186 t` headline or the single top coral cafeteria bar. Each beat is an independent clip, so reshoot only the broken beat.

**Clean exit.** End on the fully settled, zoomed frame of the top coral cafeteria food bar, cursor still on it, the `built for the eco / env-science classroom` caption holding, no motion in progress. Freeze there for a clean cut into Scene 2, which opens on this same FootprintDashboard.

### Scene 2

**Goal.** Make the viewer feel that this AI is trustworthy because it is honest about what it knows: the energy numbers are real and measured, the rest are flagged estimates, the overall confidence openly reads LOW, and the moment a class adds real local inputs the confidence visibly climbs from LOW to MEDIUM. The clip must land as measurement and uncertainty shown live, not as a polished black box.

**Pre-roll state.** Open on the Footprint Dashboard reached from the Home "School Hidden Footprint" card, with the "[School Name] — Weekly Insights" header and the Status Chips row visible. The ① Input data section with the RawDataChart ("Raw school data," "Last 10 school days · all buildings combined") must be in view at the top, since this is the honest-data anchor. Park the cursor at rest in neutral space, not hovering any interactive element.

[Map flag: the Electricity row, Heating (gas) row, LOW confidence chip, "Update school data" button, the meals/commute/water input fields, and the "Save" that drives LOW to MEDIUM are not in the authoritative UI map. The map's Footprint Dashboard has no per-category energy rows, no confidence chip, and no data-entry form. These elements either live in a newer build state or a sub-panel the map did not capture. Confirm they render in the live build before capture. If they do not exist on screen at capture time, this scene cannot be shot as written and must go back to the script owner. The choreography below assumes they render as described, and every named click must hit the real element, never nearby whitespace.]

**Cursor and click choreography.** Apply the golden rhythm on every beat. Default hold is 1 to 1.5 seconds unless stated.

1. Move in one arc to the Electricity row and click it once. Hold 1.5 seconds. The voiceover bed "the electricity and gas figures" begins as the zoom settles. Let the row sit centered and readable, since this is the "real, measured" anchor.
2. Move down to the Heating (gas) row and click it once. Hold 1.5 seconds. The key figure "about 82 tonnes, are real" lands as the zoom finishes settling, so the spoken number sits on the rows that are actually measured.
3. Move to the LOW confidence label and click it once, directly on the LOW text itself, not the adjacent caption space. Hold 1.5 seconds, slightly longer if the zoom is still easing. The key word in "confidence reads low on purpose" hits exactly as the zoom settles on LOW. This is the honesty beat, so let LOW fully own the frame before any further motion.
4. Move to "Update school data" and click it once. Hold 1.5 seconds so the input view opens and the zoom settles on the now-visible fields. No second click yet. The voiceover bridges with "when the class adds real local numbers."
5. Enter the three required inputs in one calm pass, treating data entry as a single deliberate action rather than three jittery hops: meals per day, then commute share, then water. Energy is pre-seeded, so do not touch it. Type at a steady pace with no hunting between fields and no on-camera corrections, letting the cursor and zoom glide field to field. All three are required, because the model needs four of six categories on real data to reach MEDIUM, and meals alone will not move the chip.
6. Move to "Save" and click it once. Immediately go still and do not chase the result with the cursor.
7. Hold on the overall confidence chip for a full two seconds without moving, clicking, or scrolling, so the zoom holds on the chip while it transitions from LOW to MEDIUM. The payoff "the confidence climbs from low to medium" must land precisely as the chip flips to MEDIUM. If the chip animates, the verb "climbs" should ride the animation rather than precede it. This is the emotional peak, so the settle must be rock-steady for clean playback on mute.

**Scroll.** At most one scroll, used only before beat 1 and only if the energy rows or the confidence chip are not already in the vertical center. Use a single slow scroll to center the energy rows, then do not scroll again for the rest of the scene. If the input view opens already centered, scroll is none from that point. Never micro-scroll to fix framing mid-beat.

**Caption sync.** Two captions only.
- `Energy = measured public data` fades in as the zoom settles on the Heating (gas) row in beat 2, on the 82-tonnes word, reinforcing "real and measured" exactly where the eye is. Hold it through the LOW beat, then fade it before the "Update school data" click so the input view is uncluttered.
- `add real inputs → confidence LOW → MEDIUM` fades in at beat 7, timed to the chip flipping to MEDIUM, as a mute-mode backstop on the same frame the voiceover says "low to medium." The second caption appears only after the first is gone.

**Avoid.**
- Clicking whitespace near the LOW chip, since the zoom must land on the LOW text itself.
- Letting the cursor chase the confidence chip after Save, which would spike velocity and lurch the zoom right on the payoff frame. Click Save, then freeze.
- Treating the three inputs as three separate zoom beats with stop-start hunting, which reads busy and adds velocity spikes. Use one smooth entry pass.
- Entering only meals, since the chip will not reach MEDIUM and the payoff fails.
- Double-navigating or re-opening the dashboard mid-scene, and scrolling during any voiceover sentence.
- Over-captioning, since two captions are the maximum and they never overlap the zoom's own emphasis.
- Touching the pre-seeded energy fields during input entry.

**Retake trigger.** Reshoot if the confidence chip does not visibly transition from LOW to MEDIUM on the settled hold, or if the voiceover word "medium" fires before the chip flips, or if the cursor lurches the zoom on the Save-to-chip handoff so the chip is not steady and centered when it changes.

**Clean exit.** End on the settled, centered overall confidence chip now reading MEDIUM, zoom fully at rest, the `add real inputs → confidence LOW → MEDIUM` caption visible, cursor still. Hold that final frame for about one second of dead air so the editor has a clean tail, then stop the take.

### Scene 3

**Goal.** Make the viewer feel the core thesis land as a single quiet realization: one student's action, weighed against the school's largest institutional line, is small, and the panel has already done that math for them, so the natural next thought is "then what should the school do." The clip must read as the product's center of gravity, calm and inevitable, not as a feature tour.

**Pre-roll state.** Start on the School Footprint card in the post-Scene-2 state: the overall confidence chip showing MEDIUM, the category bars rendered with the top bar coral and flame-marked, and the "Action leverage" panel (green-tinted box, "Action leverage" eyebrow, one muted message line) present below the bars. The "Update school data" wizard must be closed (the button reads "Update school data," not "Close") so no input grid clutters the frame. Rest the cursor near vertical center, idle, with no highlight pulse showing. The Action leverage panel begins below the fold, so do not pre-scroll it into view; the one allowed scroll brings it up on camera.

[Map flag: the authoritative UI map does not list an "Action leverage" panel or a leverage-ratio element. The target was verified against source instead, in `frontend/src/components/SchoolFootprint.jsx` lines 113 to 119 (green-tinted box, "Action leverage" eyebrow, one muted line of `leverage.message`), seated below the category bars and above the "Next step" recommendation on the School Footprint card. The script phrase "the school's biggest line" maps to the top coral category bar marked with the flame icon (the biggest hidden emitter, lines 100 to 108); there is no distinct "biggest line" element beyond that bar. The script's "computed comparison" is the single `leverage.message` line inside the panel, not a separate widget.]

**Cursor and click choreography.** Three clicks total, two distinct targets, with each click isolated by its full hold.

1. Settle the thesis line. After the single centering scroll, move in one clean arc and click once directly on the muted leverage message text inside the "Action leverage" panel (the `leverage.message` line). Hold 1.5 seconds dead still while the zoom eases in on the message text. Time it so the phrase "we call it the leverage ratio" lands exactly as the zoom finishes settling. Do not click the eyebrow or the panel padding; the message text is the target.
2. The school's biggest line. Keeping the panel framed, move in one smooth arc up to the top coral category bar (the flame-marked biggest emitter, the first row in the bars grid) and click once on that bar or its `kg/mo` value. Hold 1.5 seconds while the zoom recenters onto the largest line. Time it so the phrase "against the school's institutional emissions" lands as the zoom settles, so the viewer sees the institutional magnitude exactly when the voiceover names it.
3. Return to the computed comparison for the close. Move back down in one arc and click once again on the same muted leverage message line. Hold 1.5 seconds and stay there through the closing voiceover, so the close "what should the school actually do" lands while the frame rests on this message line. This is the end frame, so do not move after the settle.

**Scroll.** Exactly one scroll, used only at the very top of the clip before beat 1: a single slow scroll down to bring the "Action leverage" panel to the vertical center, then stop. No micro-scroll to fix framing, no scroll between beats, and no scroll during any voiceover sentence. If the panel overshoots center, do not correct with a second scroll; reframe in the edit or retake the scroll.

**Caption sync.** One caption only: `Leverage: one student action  vs  the school's biggest line`. Fade it in as beat 2's zoom settles on the coral bar, the moment both halves of the comparison are on screen. Hold it through beat 3, then fade it out before the final settle completes so the closing frame on the message line is clean. Do not caption beat 1; let the zoom and voiceover carry "leverage ratio" alone.

**Avoid.**
- Opening the "Update school data" wizard or letting its input grid appear, which pushes the leverage panel and forces a corrective scroll.
- Clicking the "Next step" recommendation card directly below the panel, which is adjacent Scene 4 territory and would recenter the zoom onto the wrong box.
- Clicking the confidence chip or the help tooltip near the headline, which are Scene 2 targets and read as backtracking.
- Scrolling more than the single centering scroll, micro-scrolling between beats, or hover-jittering over the bars while hunting for the coral one. Move in a single arc to it.
- Letting any key word ("leverage ratio," "institutional emissions," "what should the school actually do") fire before its zoom settles.

**Retake trigger.** Reshoot if a click lands anywhere other than the leverage message line or the top coral bar, or if any scroll, second click, or cursor jitter happens during a 1.5-second hold so the zoom never settles and the key word lands on a moving frame.

**Clean exit.** End on the settled, zoomed frame of the "Action leverage" panel's muted message line (beat 3's resting state), the computed comparison filling the frame, caption already faded, cursor still, immediately after the voiceover word "do." Cut on that held still frame so it intercuts cleanly into Scene 4's School Hidden Footprint open.

### Scene 4

**Goal.** Make the viewer feel the exact moment an AI suggestion stops being a suggestion: a ranked, evidence-backed institutional fix that a named human must physically approve before it becomes a real school goal. The clip must read as the AI proposed and the human decided, governance you can watch happen.

**Pre-roll state.** Start on the Home screen with the School Footprint Card fully visible: the ✨ sparkle gradient badge, the green uppercase "AI Insights" eyebrow, the "School Hidden Footprint" heading, the "Anomalies · Predictions · Recommendations" subtitle, and the green-dark → button. Park the cursor in neutral lower-center, dead still, and do not pre-scroll Home. The FootprintDashboard data must already be seeded so that when section ④ loads, at least one RecommendationCard renders in the "Proposed — awaiting approval" state with a visible "✓ Approve — Make Active Goal" button. No modal or notifications dropdown is open.

[Map flag: the script's SCREEN line names a per-action `~X kg/mo` headline, a `cost band · effort` line, a `Verify by: <metric>` line, status chips reading `proposed → approved → verified`, and a `record measured before/after` row. None of these render in the shipped RecommendationCard. What actually renders per recommendation is: an uppercase category label; a single status chip that is either "Proposed — awaiting approval" or "✓ Approved — active school goal" (two states only, with no "verified" chip); the recommendation title; a "Why:" reasoning box; an "Estimated impact:" badge; a "Projected annual CO₂e avoided: N kg" badge; an Assign section and button; and the "✓ Approve — Make Active Goal" button, which becomes the "Active — visible on school leaderboard feed" status bar after approval. There is no before/after measurement row anywhere on this screen. The choreography below maps each voiceover beat to an element that exists. Do not hunt on camera for the `kg/mo`, `cost band`, `Verify by`, or `before/after` elements; hunting is a retake trigger and they are not there.]

**Cursor and click choreography.** Each beat is one deliberate action, one clean arc, a still hold while the zoom settles, then the key word.

1. Click the School Footprint Card by clicking the "School Hidden Footprint" heading itself, not the surrounding whitespace, so the target is the card. Hold 1.5 seconds while the zoom settles and the view navigates to the FootprintDashboard. Voiceover context: "This is where the leverage idea becomes a decision rather than a slogan."
2. After the dashboard paints, take the one allowed scroll to bring section ④ into vertical center, stopping with the top-ranked RecommendationCard centered. Then click that card's recommendation title. Hold 1.5 seconds while the zoom lands on the top action. The key word "ranks" lands as the zoom settles.
3. Click the "Projected annual CO₂e avoided: N kg" badge, clicking the green badge text itself, since this is the real per-action carbon number standing in for the script's nonexistent `kg/mo` headline. Hold 1.5 seconds. The voiceover "how much carbon each one avoids" lands here.
4. Click the "Estimated impact:" badge. Hold 1 second while the zoom recenters on the impact figure. The voiceover "the cost band, the effort" plays over it. [These exact words have no matching element, so this beat covers them with the closest real evidence chip. Do not search for a cost or effort line.]
5. Click the "Why:" reasoning box, on the "Why:" label inside the gray panel. Hold 1.5 seconds while the zoom settles on the AI's stated rationale. The voiceover "the exact metric the class would check to confirm it worked" and "the AI retrieves evidence and drafts language" ride this beat, since the "Why:" box is the on-screen proof that the wording is AI-drafted evidence.
6. Click the "Proposed — awaiting approval" status chip at the card top. Hold 1 second while the zoom lands on the word "Proposed." The voiceover "Each action stays a proposal until a named staff member signs off" begins here.
7. Click the "✓ Approve — Make Active Goal" button. Hold 1.5 seconds dead still while the approve action resolves and the card flips state. The chip changes to "✓ Approved — active school goal" and the button region becomes the "Active — visible on school leaderboard feed" status bar. The voiceover "a named staff member signs off" and "Once a fix is approved" lands exactly as the green Approved state settles. This is the emotional center, so do not rush the hold; let the green state fully settle.
8. Click the now-green "✓ Approved — active school goal" chip (or the "Active — visible on school leaderboard feed" bar) on the just-approved card. Hold 1.5 seconds while the zoom rests on the approved state. [This substitutes for the script's nonexistent `record measured before/after` row. Since no measurement row renders, end the verification beat on the strongest real "it is now a real, human-owned goal" element rather than fabricating a click.] The voiceover tail "so students see measured outcomes, not just predictions" plays over this settled green state, then trails into the close.

**Scroll.** Exactly one scroll, used only at beat 2 to bring section ④ and the top RecommendationCard into vertical center after the dashboard loads. Do not scroll to reveal sections ②, ③, or ⑤, and do not micro-scroll to reframe the card after approval, since beat 7's state change happens in place.

**Caption sync.** Two captions only, matching the script's two on-screen text strings.
- `ranked by CO₂e/mo · cost · effort · verify-by · owner` fades in as the beat 2 to 3 zoom settles on the top card's projected-CO₂e badge, under the voiceover word "ranks." [This caption advertises `cost`, `verify-by`, and `owner` fields that are not rendered as labeled rows. Keep it brief and let it sit over the ranked card generally; do not imply the viewer should look for those exact labels on screen.]
- `human-approved · measured` fades in the instant the Approve click in beat 7 flips the card to green, under the voiceover "approved." Hold it through beat 8. Clear both captions before the clean exit.

**Avoid.**
- Hunting for `~X kg/mo`, `cost band · effort`, `Verify by:`, a `proposed → approved → verified` triple, or a `before/after` row. They do not exist, and cursor-hunting spikes velocity and is an automatic retake.
- Opening the Assign flow (dropdown plus textarea) on camera, which expands the card and reframes the shot mid-scene. Approval, not assignment, is the story.
- Clicking any help tooltip, the 🔄 Refresh icon, or a ⚑ "Flag as inaccurate" button, each of which opens an overlay or recomputes and reframes.
- Double-tapping Approve or clicking again during the beat 7 state-flip hold, since the card is mid-transition and a second click lands on a moved element.
- Scrolling into sections ② Anomaly, ③ Cafeteria Forecast, or ⑤ Generative AI Layer, which are out of scope and steal the one allowed scroll.
- Circling or hover-jitter over the badges while waiting for the voiceover. Rest the cursor between beats.

**Retake trigger.** Reshoot if the Approve click in beat 7 does not visibly flip the card to the green "✓ Approved — active school goal" and "Active — visible on school leaderboard feed" state on camera, since the entire scene exists to show that flip. Also reshoot if any stray click opens the Assign dropdown, a help tooltip, or a Flag overlay and recenters the zoom on the wrong element.

**Clean exit.** End on the just-approved top RecommendationCard, fully settled in its green state, with the "✓ Approved — active school goal" chip at top and the "Active — visible on school leaderboard feed" status bar where the Approve button was, card centered, cursor at rest just off the card, both captions cleared. Hold this still green frame for about one second so the editor has a clean tail into Scene 5.

### Scene 5

**Goal.** Make the viewer feel that EcoRise is not a quiz toy but a real, citation-grounded research library with an AI tutor layered on top: a thousand genuine papers the class can browse, interrogate, summarize, and visualize, with every answer traceable to its source. The clip must read as primary-source rigor made effortless.

**Pre-roll state.** Start on the Learning hub with the Research Library sub-tab already selected, so the sub-tab toggle pill shows "Research Library" active and "AI Coach" inactive. Visible from the top: the green eyebrow "Research library · 1,000 papers," the "Ask the research" card with its "Ask a question…" input and "Ask" button, and below it the "Search papers…" input paired with the "Browse" button plus the topic chip row. The papers list must be empty or unloaded at pre-roll (no `{total} matching papers` line yet) so the first Browse click visibly populates it. No answer card, expanded summary, or visual is rendered yet. Park the cursor in lower-center dead space, still.

[Map flag: the script's "Research" tab is the Research Library sub-tab of the Learning hub, reached via the AI Coach / Research Library toggle, not a top-level nav tab. The script's "Visual" button renders as "Visualize" in source. The directions below use the real labels so the editor does not hunt for a literal "Research" tab or "Visual" button.]

**Cursor and click choreography.**

1. Browse, first load. One clean arc to the "Browse" button, right of the "Search papers…" input. Click once. Hold 1.5 seconds dead still while the zoom lands on the "Browse" button and the `{total} matching papers` line that pops in beneath it. The key word "browse it" lands as the zoom settles on the freshly loaded list.
2. Browse again, fresh set. The cursor is already resting on "Browse," so do not move it away. Click "Browse" a second time. Hold 1.5 seconds still while the randomized set swaps in and the titles visibly change. The zoom stays on the same region, reinforcing the corpus depth. No key word is required here; cut this visual-proof beat under "a research library of a thousand real papers."
3. Ask the research, open input. One smooth arc up to the "Ask a question…" input inside the "Ask the research" card. Click once into the field. Hold 1 second while the zoom eases up to frame the input and its "Ask" button. Let the eased zoom finish before any keys move.
4. Type the question, then Ask. With the field framed, type `Does biking instead of driving meaningfully cut emissions?` at a steady, even cadence with no backspacing. Then move one clean arc to the "Ask" button and click once. Hold 1.5 seconds still through the busy state until the green answer card renders, and the zoom settles on the answer text. The key phrase "ask a question and get an answer" lands as the answer paints in.
5. The citation. Do not re-navigate. Move one short, smooth arc down onto the citation chip (the leaf-icon source chip in the "Cite" row beneath the answer). Click the chip itself. Hold 1.5 seconds still while the zoom lands squarely on the chip (paper title plus year). The key word "always shown with its citation" lands exactly as the zoom settles. This is the scene's emphasis pixel, so click the chip, not the answer whitespace.
6. Summarize. One clean arc down to the first PaperCard in the list and onto its "Summarize" button (leaf icon, secondary style). Click once. Hold 1.5 seconds through the "Summarizing…" state until the green key-points box renders and the zoom settles on the plain-language key points (the TL;DR line plus bulleted key points). The key word "summarize a dense study into plain-language key points" lands as the bullets appear.
7. Visualize. On the same PaperCard, move one short arc to its "Visualize" button (sparkle icon, primary style, immediately right of Summarize). Click once. Hold 1.5 seconds through the "Visualizing…" state until the gradient infographic renders, and the zoom lands on the infographic (headline plus metric value plus the cause-to-effect flow chips with arrows). The key word "turn it into a diagram of cause and effect" lands as the flow chips paint in.

**Scroll.** Exactly one scroll, used once between beat 5 and beat 6: a single slow, deliberate scroll to bring the first PaperCard with its Summarize and Visualize buttons into the vertical center, then stop and settle before clicking Summarize. No other scrolling. The summary and visual pop-in animations play within the centered card, and the zoom carries the reveal. If the rendered Visualize infographic overflows the frame bottom, that overflow is acceptable; do not chase it with a second scroll.

**Caption sync.** Three captions only, each appearing as its matching zoom settles, never before.
- `1,000 real research papers` fades in on beat 1 as the first Browse list settles, reinforcing the on-screen "Research library · 1,000 papers" eyebrow.
- `every answer cited` fades in on beat 5 exactly as the zoom lands on the citation chip and the voiceover says "citation." This is the scene's headline caption; hold it through the settle.
- `ask · summarize · visualize` fades in across beats 6 and 7, timed to land as the Visualize infographic settles, tying the three AI actions together at the clip's peak. Let it clear before the clean exit.

Each caption clears before the next beat's click, so captions never stack two-high over the zoom.

**Avoid.**
- Typing into the "Ask a question…" field while the zoom is still easing in between beats 3 and 4, since typing plus an in-flight zoom reads as a double action and lurches the push-in. Let the zoom settle, then type.
- Clicking the green answer text or surrounding whitespace when you mean the citation chip, which would land the emphasis on prose instead of the source and kill the beat.
- Clicking a topic chip or the "Search papers…" input, which re-filters or reloads the list and reframes the shot.
- Pressing "Browse" more than the two scripted times, since a third click re-randomizes again and looks like nervous hunting.
- Moving the cursor during any "Summarizing…," "Visualizing…," or busy state, since the render pop-in plus a moving cursor is two velocity sources the easing amplifies.
- Circling, hover-jitter over the leaf or sparkle icons, or fast wheel-scroll on the single allowed scroll.

**Retake trigger.** Reshoot if the citation chip zoom in beat 5 lands on the answer body or whitespace instead of the source chip, or if any click, second navigation, or scroll fires during a settle hold or a busy-state render so a key zoom never settles and the voiceover word lands on a moving frame.

**Clean exit.** End on the fully rendered Visualize infographic (gradient header headline, large green metric value, and the cause-to-effect flow chips with their arrows), settled and motionless, with the `ask · summarize · visualize` caption already cleared. Hold this static frame for about half a second with the cursor resting just below the infographic, so the editor has still tail handles into Scene 6, which stays on the same Research Library tab and reuses the "Ask a question…" box.

### Scene 6

**Goal.** Make the viewer feel the single most trust-building beat of the demo: the AI hits a question it cannot ground and visibly chooses silence over invention, then proves that silence is measured, not lucky. The clip must convert "the AI refused" from a claim into something the viewer watched happen and then saw scored on a report card.

**Pre-roll state.** Start on the Learning Hub with the Research Library sub-tab already active (the toggle pill showing "Research Library" selected and "AI Coach" inactive). The ResearchLibrary search interface and corpus stats must be visible and idle, with the "Ask a question…" input empty and no prior answer card lingering from Scene 5. The AI Report Card (the "AI report card" eyebrow with its metrics grid of Faithfulness pass, Citation validity, Unanswerable refusal, Refusal precision, and Hallucination rate, plus its status chip) must exist further down the same view, below the fold, untouched. Park the cursor in the lower-middle of the frame, still. Nothing is pre-typed; the question is typed live on camera.

[Map flag: the script says "Research tab," but the UI map exposes this as the Research Library sub-tab of the Learning Hub, not a top-level nav tab. The script's refusal string "No grounded answer found in the corpus." is not present verbatim in the UI map; the map's nearest grounded-refusal surfaces are the Coach tab's Refusal Card ("Guidance withheld" eyebrow) and the AI Report Card's "Unanswerable refusal" row. Capture the literal string the running app renders in the Research Library answer area; if the build shows different copy, match the app, not the script. The script's "refusal rate" maps to the AI Report Card rows "Unanswerable refusal" and "Refusal precision"; there is no row literally labeled "refusal rate," so aim the refusal-metric zoom at "Unanswerable refusal."]

**Cursor and click choreography.**

1. Move in one clean arc to the "Ask a question…" input and click once to focus it. Hold 1 second still while the zoom lands on the input field. This settles as the voiceover opens, "Here is what makes it safe to put in front of a class."
2. Type the out-of-corpus question `Who won the 2022 World Cup?` at a steady, even pace, then submit (Enter, or click the submit control). Do not move the cursor while typing, and keep it still on the submit point. The zoom remains on the input and submit region. The voiceover reaches "Ask it something outside its evidence."
3. When "No grounded answer found in the corpus." (or the app's actual grounded-refusal copy) renders in the answer area, do nothing for four full seconds. No click, no cursor move, no scroll. Let the zoom rest on the refusal message. This dead-still four-second hold is the emotional center of the clip, with the voiceover landing "it does not improvise an answer. It refuses, because the AI is allowed to say nothing," and the key word "nothing" arriving while the frame is still on the refusal line.
4. Optional harder probe, only if rehearsed and reliable: click the "Ask a question…" input again, type `What exact percent will meatless Mondays cut our school's emissions?`, submit, and hold three seconds on the refusal or no-number response. The zoom stays on the answer area. If the app ever invents a number here, drop this beat entirely in the edit; do not improvise around it on camera. Skip this beat if there is any doubt.
5. Take the scene's one scroll to bring the AI Report Card to vertical center, then stop. Do not click during the scroll. Settle one second with the card centered and still. The voiceover bridges, "The same gate that just turned this question away is what keeps every grounded answer honest. And we measure it."
6. Click once directly on the "Faithfulness pass" row of the metrics grid, on the row itself, not adjacent whitespace. Hold 1.5 seconds while the zoom lands on the Faithfulness pass value. The voiceover hits "faithfulness."
7. Click once directly on the "Citation validity" row. Hold 1.5 seconds while the zoom recenters. The voiceover hits "citation validity."
8. Click once directly on the "Unanswerable refusal" row (the map's stand-in for the script's "refusal rate"). Hold 1.5 seconds while the zoom recenters. The voiceover hits "refusal rate."
9. Click once directly on the "Hallucination rate" row. Hold 1.5 seconds while the zoom recenters and the voiceover hits "hallucination rate" as the zoom settles. Let this final hold extend through the voiceover tail, "the whole thing is re-runnable, so a teacher can see the failures too, not just the wins," without any further click.

Across beats 6 to 9 the sequence is strictly action, then settle, then word, so each metric is the thing under the cursor when clicked and the emphasis lands on the exact pixel the voiceover names, in order: faithfulness, citation validity, refusal rate, hallucination rate. One click per metric, never two.

**Scroll.** Exactly one scroll, at beat 5 only, used solely to center the AI Report Card before the metric clicks. No scroll during typing, during the four-second refusal hold, or to reframe any metric. If the four metric rows do not all fit in the centered card view, choose the scroll stop that seats Faithfulness pass through Hallucination rate in frame so beats 6 to 9 need no further scroll.

**Caption sync.** Two captions only, in the bottom third, high contrast.
- `"The AI is allowed to say nothing."` fades in at the start of the four-second refusal hold in beat 3, timed to the voiceover phrase "allowed to say nothing," and holds for that dead-still beat, then fades before the scroll.
- `measured on a re-runnable eval set` fades in as the AI Report Card settles centered at the end of beat 5, on "we measure it," and holds across the metric zooms in beats 6 to 9. Do not stack a third caption on the individual metrics, since the zoom names each one.

**Avoid.**
- Moving or jittering the cursor during the four-second refusal hold, since any motion breaks the most important beat and makes the silence read as a glitch.
- Scrolling more than once, or scrolling during typing or the refusal hold. The one permitted scroll is beat 5 only.
- Clicking whitespace near a metric instead of the metric row, which lands the zoom off the named number.
- Hunting for the submit control or re-clicking the input after submitting. Pre-locate submit so the type-and-submit in beat 2 is one clean motion.
- Fast or uneven typing that the cursor easing amplifies. Type at a steady cadence.
- Running the optional harder probe in beat 4 live if it has not been rehearsed to refuse reliably, since an invented number on camera contradicts the entire scene.
- Stacking captions on every metric or flaring the click highlight, either of which fights the zoom and reads as noisy on mute.

**Retake trigger.** Reshoot if the cursor moves, clicks, or scrolls at any point inside the four-second refusal hold, since the silence beat is the whole scene. Also reshoot if any metric click lands off its named row so the zoom settles on the wrong pixel, or if the app invents an answer to either probe rather than refusing.

**Clean exit.** End on the fully settled push-in over the "Hallucination rate" row of the AI Report Card, number centered and the zoom completely at rest, with the `measured on a re-runnable eval set` caption still up. Hold that static frame for roughly one second after the voiceover tail finishes, with no cursor motion and no pending click, so the cut into Scene 7 is clean and never mid-transition.

### Scene 7

**Goal.** Make the viewer feel the student loop close honestly and completely: a photo becomes a verified action, the kilograms come from a cited factor rather than the AI, the points are scored server-side, and that single action then surfaces publicly in the Feed, pings the student via the bell, and feeds the quest ranking driven by the school's biggest emitter. The clip must read as "the AI describes, but never awards itself a point," and as one continuous journey from logged action to public recognition.

**Pre-roll state.** Start on the Quests screen (dedicated Quests tab), or the Home screen with the Quests section in view, whichever take begins cleanest. The first action is clicking "Log action," so the "Log action" card (camera icon, green, in the Quick Actions Grid) must be visible and centered before the clip starts. Do not start mid-scroll. The bike or LED photo is already picked into the file dialog before this take begins, so clicking the upload control advances straight into the analyzing and result phases without an OS file-picker appearing on camera. The notifications bell on the Home header already carries seeded history with an unread coral badge, so the bell reads as real content the instant it opens. The Feed already shows topical action photos on each post, not empty banners, so the freshly created post intercuts against a populated feed. The device is framed in the canonical 1080×1920 portrait shell, centered, with no full-bleed.

**Cursor and click choreography.**

1. Click the "Log action" card (camera icon, green, Quick Actions Grid). Hold 1.5 seconds dead still while the zoom lands on the Log Action modal sheet header ("Log an eco action") as it slides up. The voiceover opens on "Students still take action, and it has to be just as honest as everything else." No second click while the sheet settles.
2. Click the photo upload control (the capture-phase photo picker, "Add a photo to log your action"). Because the photo is pre-selected, the modal advances to analyzing (spinner plus "Analyzing your photo…") then to result. Do not click again during the spinner. Hold 1.5 seconds through the analyzing phase while the zoom rests center-frame on the spinner, as the voiceover reaches "When someone logs an action, a vision model identifies the photo."
3. Click directly on the "AI detected" eyebrow or the specific action headline inside the AI Detected Card (the display action line in the gradient pop-in card). Hold 1.5 seconds while the zoom lands on the detected-action text. The key phrase "a vision model identifies the photo" completes as the zoom settles. This is the "AI describes" half of the contrast.
4. Click directly on the "CO₂ saved" value (the green number with the "CO₂ SAVED" label in the AI Detected Card), which is the script's "AI-detected label with the carbon math." Hold 1.5 seconds while the zoom lands on the kilograms number. The key word "but the kilograms come from the same cited factor" lands exactly as the zoom settles. The number under the cursor is the target.
5. Click directly on the "Post" button to submit (primary, wide, result phase). After submit, the points awarded become the emphasis. If a points value renders in the confirmation or result state, click directly on that points chip or value. Hold 1.5 seconds while the zoom lands on the points number. The key phrase "and the points are scored on the server. The AI can describe an action, but it can never award itself a single point" lands as the zoom settles. [Map flag: the script names "the points awarded" as a discrete post-submit click target, but the UI map's Log Action result phase lists "CO₂ saved" and does not enumerate a distinct post-submit "points awarded" element inside the modal. The nearest mapped points surfaces are the Feed card "Points chip" (top-right of the media band) and the notifications bell points entry. If no points value renders in the modal at submit, retarget this beat's points click to the Points chip on the new Feed card in beat 7, and let the modal beat end on the CO₂ value from beat 4. Do not invent an in-modal points element the build does not show.]
6. Click the "Feed" tab (bottom navigation, RIGHT group: Feed | Profile). One clean navigation. The new post sits at the top of the Feed grid. Hold 2 seconds dead still on the freshly created post card, while the zoom lands on the new post's Media Band photo (the real action photo) so the community side is visible. The voiceover: "Once the action is verified, it surfaces in the class feed with its own photo." If the points emphasis was deferred from beat 5, this is where you may click the Points chip (top-right of the media band); otherwise keep this beat a pure two-second hold on the photo and do not add a second click.
7. Reach the Home header (click the avatar top-left, or the Home tab), then click the notifications bell icon (top-right) to open the Notifications Dropdown. Treat reaching Home as part of the same single navigation if you are already adjacent; otherwise the Home tap and the bell tap are two deliberate beats separated by a brief settle, never chained in one motion. Once the dropdown is open, hold 1.5 seconds on the points entry (the notification item the same action generated, with a green unread dot and an "Xm ago" timestamp) while the zoom lands on that row. The voiceover: "and the student receives a notification for the points that were awarded, so the journey from a logged action to public recognition stays visible to everyone in the class."
8. Click "Quests" (via Home's Quests section or the Quests tab), then click the top QuestCard, the quest tied to the school's biggest emitter (top of the Quest List, with icon, title, and yellow "2× [base points]" chip). Hold 1.5 seconds while the zoom lands on that QuestCard title. The voiceover closes: "And the quests the class sees are ranked by the school's biggest emitter, so the footprint decides what students are asked to do, rather than the other way around."

**Scroll.** At most one scroll, and only if needed: a single slow scroll on the Feed in beat 6 to bring the freshly created top post into vertical center, then stop and hold. If the new post already renders at the top in frame, which it should as the newest, use no scroll at all. Never scroll inside the Log Action modal, the notifications dropdown, or the Quests list.

**Caption sync.** One caption only: `vision detects · math is deterministic · points scored server-side`. Bring it up on beat 4, the moment the zoom finishes settling on the "CO₂ saved" number, so it reinforces the deterministic-math claim exactly as the zoom spotlights it. Hold it through beat 5, then fade it before the Feed navigation in beat 6. Do not re-show it; let the zoom carry emphasis on beats 6 through 8.

**Avoid.**
- Clicking again during the analyzing spinner in beat 2, since a second click mid-analysis reframes the zoom off the result card and breaks the reveal.
- Chaining the upload control click with photo selection, since the photo is pre-picked precisely so no OS file dialog appears. If the file dialog opens, the take is contaminated.
- Chaining Feed to Home to bell to Quests as a rapid multi-navigation. Each is its own deliberate beat with a settle, since fast double-navigation spikes cursor velocity and the zoom lurches across screens.
- Clicking nearby whitespace for the carbon math or points. The number itself must be under the cursor.
- Hover-jitter or hunting for the bell. Move in one clean arc to the top-right bell icon and click once.
- Over-captioning. A single caption on beat 4 only; a second caption fighting the Feed, bell, and Quests zooms reads busy on mute.

**Retake trigger.** Reshoot if the OS file-picker dialog appears on camera during beat 2 (which means the photo was not pre-selected), or if a second click during the analyzing spinner throws the zoom off the AI Detected Card. Also reshoot if any key word ("kilograms," "server," "never award itself a single point") fires before its zoom finishes settling, or if a stray or mis-aimed click during the Feed-to-Home-to-bell-to-Quests sequence recenters the camera on the wrong screen.

**Clean exit.** End on the Quests screen with the top QuestCard (the biggest-emitter quest) centered and the zoom fully settled on its title, cursor at rest, no motion. Do not end mid-navigation or mid-zoom; hold the settled frame about half a second past the final voiceover word "around" so the cut to Scene 8 is clean.

### Scene 8

**Goal.** Land the whole pitch in one breath: make the viewer feel the scale jump from a single student action to the school's entire hidden footprint, see that privacy is baked in rather than bolted on, and leave them staring at the one headline number that sums up the product. The clip should read as small action, big number, done responsibly, ending on a dead-still tonnes figure.

**Pre-roll state.** Start on the Footprint Dashboard / School Hidden Footprint surface with the School Footprint Card fully in frame: the "School footprint" eyebrow, the large tonnes headline (`{t}t` rendered, for example `≈186t`), the muted "CO₂e / mo" label beside it, the confidence chip and help tooltip to its right, and the coral-topped category bars below already loaded. The headline must already show the real tonnes value, not the "Estimating…" placeholder and not the zeroed pre-baseline state, so confirm `hasBaseline` is satisfied before rolling. Park the cursor in neutral space in the lower third, off any interactive element. No notifications dropdown or modal is open. The device is centered in the 1080×1920 portrait frame, with no full-bleed.

[Map flag: the script names a Privacy "student-data headline." No element with that literal label exists in the UI map. The real top headline on the Privacy & data screen is the "Privacy & data" h1 with a "FERPA & COPPA" eyebrow directly above it. This direction uses that h1 as the click target and treats it as the "student-data headline."]

**Cursor and click choreography.**

1. Establish the number. Move in one clean arc from the parked position to the tonnes headline and click directly on the `{t}t` figure itself (the large `≈186t` text, not the "CO₂e / mo" label and not whitespace). Hold dead still 2 seconds while the zoom eases in and settles on the tonnes figure. The voiceover "For an environmental-science class, EcoRise pulls it all together... Students get a real footprint and a thousand-paper research bank" runs over this hold, with the word "footprint" landing as the zoom finishes settling.
2. One navigation into Privacy. This is the single allowed navigation. Move smoothly to the entry into the Privacy & data screen and click it once (the Profile screen's "Privacy & data" action button, or the in-context Privacy entry that routes to `/privacy`). Do not double-click and do not hunt. Let the screen transition complete and the cursor come to rest, with no zoom emphasis committed on the transition itself, so the easing has a clean endpoint.
3. Privacy headline. Once the Privacy & data screen is settled, move in one arc to the "Privacy & data" h1 (the heading under the "FERPA & COPPA" eyebrow) and click directly on it. Hold dead still 1.5 seconds while the zoom eases onto the heading. The voiceover "And it is built around student-data privacy from the start. It works for one classroom today, and a district is simply the same pipeline repeated" runs over this hold, with the word "privacy" landing as the zoom settles.
4. Return navigation to the Footprint card. This is the second and final navigation. Move smoothly back to the Footprint surface (Back or home route to the School Footprint Card) and click once. Let the transition finish and the cursor rest, with no zoom commit mid-transition, so the next beat starts from a clean endpoint. End this beat with the Footprint card fully re-seated in frame and the tonnes headline visible and not mid-animation.
5. The closing number. Move in one final clean arc to the `{t}t` tonnes headline and click directly on it again. Hold dead still 2.5 seconds while the zoom eases in and locks on the number. The voiceover "One point two kilograms against 186 tonnes. EcoRise makes the class see that difference, and makes the AI cite its sources before it ever recommends a fix." The phrase "186 tonnes" must land exactly as the zoom finishes settling, and the screen must still hold on the centered number through "cite its sources." Do not move, click, or scroll after this click; the clip ends on this settled frame.

**Scroll.** None. The Footprint headline and the Privacy h1 are both at the top of their respective screens and already in the upper-center on load. If the headline is not centered on load, fix it once in pre-roll setup, not during capture.

**Caption sync.** One caption only, since this is the closing card. Bring `EcoRise: the hidden footprint, grounded in real research, for the eco classroom.` up in the bottom third as the beat 5 zoom finishes settling on the tonnes headline, synced to the word "186 tonnes." Fade it in over roughly 0.3 seconds so it does not compete with the push-in, and hold it through the end of the voiceover. Do not show it earlier over beats 1 through 4; let the zoom carry those beats unaided.

**Avoid.**
- Clicking the muted "CO₂e / mo" label or the confidence chip or help tooltip instead of the `{t}t` figure on beats 1 and 5, which lands the zoom off the number or fires the tooltip.
- Clicking the coral category bars or the "Action leverage" box on the Footprint card, which would jump the zoom to the wrong line and lose the headline emphasis.
- Any third navigation. Only two navigations are allowed (into Privacy, back to Footprint). A stray extra route or a mis-click on the Back chevron when you meant the headline forces a retake.
- Moving or clicking during the post-navigation settle on beats 2 and 4, since a velocity spike during the transition makes the zoom lurch into the next beat.
- Clicking the "FERPA & COPPA" eyebrow or a section card instead of the "Privacy & data" h1 on beat 3.
- Letting "186 tonnes" fire before the beat 5 zoom settles, or cutting the clip while the number is still mid-push.

**Retake trigger.** Reshoot if the tonnes headline shows "Estimating…" or the zeroed pre-baseline value at any point, since the closing number would be wrong or absent. Also reshoot if the phrase "186 tonnes" lands before the beat 5 zoom has settled on the `{t}t` figure, or if the clip ends mid-transition rather than on the centered, dead-still number.

**Clean exit.** End on the Footprint card with the zoom fully settled and locked on the `{t}t CO₂e / mo` tonnes headline, centered in the portrait frame, cursor at rest, the single closing caption held in the bottom third, no transition in progress. Freeze the last frame on that number.

### Global Pre-Flight Checklist

Run every item before any capture session.

- App seeded: the FootprintDashboard has baseline data so the tonnes headline shows a real value (`hasBaseline` satisfied), not "Estimating…" or a zeroed state, and section ④ renders at least one RecommendationCard in the "Proposed — awaiting approval" state.
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
