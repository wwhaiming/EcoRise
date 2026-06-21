# EcoRise: Demo Video Script (voiceover + screen recording, 5:00)

**Format:** a *virtual* demo. Record silent screen clips per scene with **Screen Studio** (macOS),
record the voiceover (VO) separately, then assemble in your editor. Timestamps are pacing targets,
not hard cuts. **Target runtime:** **~5:00** (8 scenes). To cut to ~3:30, drop Scenes 6 and 7, but
never cut Scene 5. **Aspect:** mobile device frame, 1080×1920 portrait.

> **The one line the video must land:** *A student biking to school saves about 1.2 kg of CO₂,
> while Garfield High emits roughly 186 tonnes a month, the equivalent of over 150,000 bike rides.
> EcoRise shows students that gap, points the school at its biggest lever, and only lets the AI
> speak when it can be grounded and a human approves it.*

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
with an example score around 0.82. The footprint headline reads in tonnes; category bars read in kg/mo.

---

## Pre-record capture setup (do once, before filming)

```bash
# Terminal 1: seed the coach corpus FIRST
cd backend && COACH_ENABLED=true npm run seed:coach
# Terminal 2: seed the board + login, run the app
COACH_ENABLED=true npm run demo
```

- Log in as `demo@ecorise.app` (password printed by the seed). Board: **Garfield High School**.
- The footprint baseline is pre-seeded with real Seattle energy. Confirm the **Next step** card
  shows a real recommendation, not the DEV "Demo fixture" placeholder.
- Pick your bike or LED photo into the file dialog *before* you start the Scene 7 take, so the file
  picker never shows up in the capture.

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

### Scene 2 · 0:30 – 1:05 · Real where we have it, honest where we don't
- **SCREEN:** Click the Electricity row and pause. Click the Heating (gas) row and pause. Click the
  **LOW** confidence label and hold. Keep the cursor still between clicks, no sweeping.
- **VO:** *"We are also honest about where these numbers come from. The electricity and gas figures,
  which add up to about 82 tonnes, are real, pulled straight from Seattle Public Schools' public
  utility dashboard. The other categories are national-average estimates from the EPA, and the app
  says so directly. Overall confidence stays low on purpose, and it only rises once a teacher enters
  real data for meals, buses, and water. EcoRise would rather show you low confidence than fake a
  precise number it hasn't earned, and it tells you exactly which figure is worth verifying first."*
- **ON-SCREEN TEXT:** `Energy = measured public data` · `4 of 6 = estimates` · `confidence: LOW by design`

### Scene 3 · 1:05 – 1:45 · The leverage ratio (the core idea)
- **SCREEN:** Scroll once to center the **Action leverage** panel. Click the leverage message and
  hold through the first sentence. End centered on that computed comparison.
- **VO:** *"This next idea is what the whole product is built around, and we call it the leverage
  ratio. Instead of asking students to guess what matters, EcoRise weighs one student's action
  against the school's institutional emissions and computes the gap between them. Small actions still
  matter, but the app shows students when their effort is best aimed at changing the system around
  them, because the largest lever in a school is almost never individual. It is institutional."*
- **ON-SCREEN TEXT:** `Leverage: one student action  vs  the school's biggest line`

### Scene 4 · 1:45 – 2:35 · AI-drafted, not AI-trusted
- **SCREEN:** Scroll once to the **Next step** card. Click the `?` info control and pause on the
  grounding score and citation. Click **Assign** and pause. Click **Cafeteria Manager** (or
  Facilities Director) and pause. Move the cursor onto **✓ Approve — Make Active Goal** and hold with
  the button centered, but do not click it, so the approval gate reads as a deliberate human step.
- **VO:** *"Now the AI makes a recommendation, but notice how little we actually trust it on its own.
  This card only appeared because it passed a grounding check, and you can see both the score and the
  source it was drawn from. The carbon number itself came from deterministic math, so the AI is
  really only responsible for the wording. To put it plainly, the AI retrieves evidence and drafts
  language. It does not compute the emissions, it does not award the points, it does not approve the
  action, and it does not publish anything. Even after a recommendation clears the gate, it stays a
  proposal until a named staff member signs off, because a wrong cafeteria order affects fifteen
  hundred lunches."*
- **ON-SCREEN TEXT:** `Grounding 0.82 ≥ 0.75` · `cited source` · `human approval required`

### Scene 5 · 2:35 – 3:20 · The proof: the AI says nothing (the money shot)
- **SCREEN:** Be on the Research tab before recording. Click the **"Ask a question…"** box, type
  **`Who won the 2022 World Cup?`**, and submit. When **"No grounded answer found in the corpus."**
  appears, **do nothing for 4 full seconds.** Then click-zoom each eval metric in turn: faithfulness
  pass, citation validity, hallucination rate, refusal rate, injection. Keep this scene calm.
- **VO:** *"This is the screen that matters most to me. When you ask the coach something that falls
  outside its evidence, it does not try to improvise an answer. It simply refuses, because the AI is
  allowed to say nothing. That same gate, the one that just turned this question away, is what lets a
  recommendation through only when it is properly grounded. And we do not just assert that it works,
  we measure it. Everything on this report card, from faithfulness and citation validity to the
  hallucination and refusal rates, comes live from our evaluation harness, and any judge can re-run
  it."*
- **ON-SCREEN TEXT:** `"The AI is allowed to say nothing."` · `eval harness: re-runnable`

### Scene 6 · 3:20 – 3:55 · How it works (the pipeline)
- **SCREEN:** Frame the **AI pipeline · tools run** panel so most steps are visible at once (this is
  the same evidence panel surfaced in Scene 7; capture it there and place the clip here). Click each
  pipeline row in order, pausing after each, without scrolling while you name the steps.
- **VO:** *"Underneath all of this is a pipeline rather than a chatbot. A deterministic engine reads
  the school's data first, flags unusual readings, forecasts the month ahead, and calculates every
  carbon figure from a cited factor. Only after that does retrieval pull supporting research from a
  curated evidence corpus, the model drafts a recommendation, and a faithfulness check scores that
  draft against the sources it claims to use. If it passes, a human approves it, and if it fails, it
  is quietly withheld. Those are five steps the model never gets to skip."*
- **ON-SCREEN TEXT:** `deterministic math → retrieval → draft → faithfulness gate → human approval`

### Scene 7 · 3:55 – 4:35 · The student side closes the loop
- **SCREEN:** Click **Log action** and pause. Click the upload control (your photo is pre-selected in
  the dialog). After it submits, click-zoom in order: AI detected with the confidence ring, the
  carbon math formula and cited factor, points awarded, integrity checks. Then click **Quests** and
  click the top quest tied to the biggest emitter.
- **VO:** *"Students still have a real role to play, and it has to be just as honest as everything
  else. When someone logs an action, a vision model identifies what is in the photo, but the
  kilograms still come from the same cited factor, and the points are calculated on the server. The
  AI can describe an action, yet it can never award itself a single point. And the quests students
  see are ranked by the school's biggest emitter, so the footprint is what decides what we ask
  students to do, rather than the other way around."*
- **ON-SCREEN TEXT:** `vision detects` · `math is deterministic` · `points scored server-side`

### Scene 8 · 4:35 – 5:00 · Impact, scale, and the close
- **SCREEN:** Start on the Footprint card and click the `≈186 t CO₂e / mo` headline, pause. One
  navigation click into the Privacy center, click its student-data headline, pause. Return to the
  Footprint card and click the `≈186 t CO₂e / mo` headline again for the final line. End with the
  number centered, not mid-transition.
- **VO:** *"In the end, every group gets something they can actually rely on. Teachers get an
  auditable, cited baseline. Students get quests ranked by real impact instead of engagement.
  Administrators get an approval gate, an evaluation harness, and a privacy center built around
  student data. It works for one school today, and a district is simply the same pipeline repeated.
  One point two kilograms against 186 tonnes. EcoRise made the school see that difference, and it
  made the AI earn the right to recommend the fix."*
- **ON-SCREEN TEXT:** `EcoRise: see the hidden footprint. Act on the real lever.`

---

## VO recording tips

- Read a little slower than feels natural, since recorded voiceover always sounds rushed on playback.
  Aim for roughly 145 to 155 words per minute.
- Keep one thought per breath, and let the two big numbers (1.2 kg and 186 tonnes) breathe while the
  edit holds the screen on them.
- Record in a soft room. A closet or a space under a blanket kills echo. One clean take per scene is
  easier to fix than a single long take.
- Keep your energy highest on Scene 1 and Scene 5, because those two carry the whole video.

## Edit / assembly notes

- Lay the VO down first, then cut the clips so each key word lands on the matching screen, with the
  number appearing as the auto-zoom settles on it.
- Keep captions short, high contrast, and in the bottom third, so the video still works on mute, since
  judges often scrub silently before turning the sound on. Let Screen Studio's zoom carry the rest.
- Run light, neutral music at about 15 to 20 percent under the VO, and duck it during the two big
  numbers and the refusal line.
- Export at 1080×1920 portrait, or 1080p landscape if the portal prefers it, and stay under the USAII
  length cap.
- If you need to shorten, trim Scene 6 first and then Scene 7. Never cut Scene 5.
- Upload it unlisted (YouTube or Loom) and paste the link into the README and the submission form.

## Honesty guardrails for the VO (do not overclaim)

- Energy is real, but the other four categories are estimates, so never call the whole footprint
  "real." Cafeteria food is the biggest line, yet it is an estimate, so say "largest line," not
  "largest measured."
- "Injection resistance" means the eval harness's pass rate on the cases we tested, not perfect safety.
- The corpus is a curated evidence set, not the open internet, and the on-screen citation is what
  backs that up.
