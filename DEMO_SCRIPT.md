# EcoRise — Judge Demo Script (4:30 live walkthrough)

> **The one line a judge must remember:** *A student biking to school saves ~1.2 kg of CO₂.
> Greenfield High's energy bill emits ~38 tonnes a month — about 30,000 bike rides. EcoRise
> shows students that gap, finds the tonne-scale lever, and only lets the AI speak when it can
> be grounded and a human approves it.*

**Thesis (USAII Direction B — "My School's Hidden Footprint"):** Institutional emissions dwarf
individual behavior. Student action only matters when it points the school at its biggest
emitter — and that requires *knowing* what the biggest emitter is. EcoRise surfaces the hidden
footprint, grounds every recommendation in cited evidence, gates the AI behind a faithfulness
score and a human approver, and puts the **leverage ratio** at the center of the product.

**Why this wins:** not "we called an LLM." It's a *responsible-AI pipeline*, and the proof is a
screen where **the AI says nothing** because it couldn't ground its answer.

> **The winner line — say it verbatim during the recommendation beat:**
> *"The AI retrieves evidence and drafts the language. It does not compute the emissions, award
> the points, approve the action, or publish the change. Those are deterministic or human."*

---

## The AI architecture in 30 seconds (for the technical judge)

```
School data ──► Deterministic engine (OLS anomaly + forecast + EPA carbon factors)
                      │
                      ▼
              RAG retrieval over a curated evidence corpus (sqlite-vec embeddings)
                      │
                      ▼
              LLM drafts recommendation  ──►  Faithfulness gate (score ≥ 0.75)
                      │                              │
                  pass │                         fail │
                      ▼                              ▼
              Named staff role approves        "Guidance withheld" (refuses to guess)
                      │
                      ▼
              Active school goal + citation + grounding score (auditable)
```

Three hard guarantees, every one on screen:
1. **The LLM never computes a carbon number.** A deterministic engine does, from a cited EPA factor.
2. **The LLM never auto-acts.** A named staff role approves before anything becomes an active goal.
3. **The LLM never guesses.** Below 0.75 faithfulness it refuses on screen — a **"Guidance
   withheld"** card, or **"No grounded answer found in the corpus"** on a direct question.

---

## Setup (~60s, before judging)

Two terminals, in this order:

```bash
# Terminal 1 — seed the coach corpus FIRST (must finish before the app needs it)
cd backend && COACH_ENABLED=true npm run seed:coach

# Terminal 2 — seed the board + login and run frontend (5173) + backend (3001)
npm run install:all      # first run only
COACH_ENABLED=true npm run demo
```

- Open **http://localhost:5173** and log in as **`demo@ecorise.app`** (password is printed by
  the seed script — copy it from the terminal).
- Board: **Greenfield High**. Invite code: **`DEMOECO`** (fresh seed) or **`USAIIECORISE`**
  on the current live DB — give a judge either to see the student view.
- **Pre-seed the baseline.** Don't type numbers live (dead air). The footprint should already
  show categories + a confidence chip when you open it.
- Open **School Footprint** and leave it on screen. That's the cold open.

**Live AI vs. offline mock:** with `OPENAI_API_KEY` set you get live model output. Without it the
app runs a deterministic mock and labels itself **"DEMO — no model."** *Either path is valid and
nothing is faked.* The carbon math, the faithfulness gate, and the eval metrics are identical in
both modes — call out the badge if asked.

> **Data honesty (one tight line, then move on):** *"The Greenfield data is representative and
> labeled synthetic. The pipeline is real — EPA factors, deterministic math, retrieval, gating,
> and human approval. Real utility CSVs use the same path."* Don't over-explain it; labeling the
> data plainly reads as confidence, not weakness.

---

## Act 1 · Cold open · 0:00 – 0:35 · The contradiction

**On screen:** School Footprint card, baseline already populated. Don't click yet.

> *"One screen, one contradiction. A student biking to school saves about **1.2 kilograms** of
> CO₂. Greenfield High's energy footprint is about **38 tonnes a month** — more than thirty
> thousand bike rides. Direction B asks for the school's hidden footprint. This is it: a computed
> baseline, cited factors, and an AI recommendation that isn't allowed to go live until it's
> grounded and a human signs off."*

**Beats:**
1. Let the big `X t CO₂e / mo` headline sit for 3 seconds. Silence sells it.
2. Sweep the category bars; point at the top (coral) bar: *"That's the biggest emitter. That's where the leverage is."*

*Why it works:* thesis + scale + product + AI-safety claim, all inside 15 seconds — no slide,
no "most eco apps..." preamble a judge has heard ten times today.

---

## Act 2 · Baseline · 0:35 – 1:20 · A confident footprint from imperfect data

**Do:** Stay on the pre-seeded card. Point at the **confidence chip** on the categories.

> *"This is built the way a real school's data arrives — partial. A teacher enters what's on the
> utility bill; the system uses disclosed defaults where data is missing and **lowers its own
> confidence** until real numbers replace the assumptions. The model tells you how much to trust
> it."*

*(Optional, only if a judge asks "can it take real data?":* click **Update school data**, type
`42000` kWh / `310` therms, **Save baseline** — the confidence chip climbs to `high`. Otherwise
skip; pre-seeded is cleaner.)*

*Why it works:* it handles messy, partial, real-world data — and surfaces its own uncertainty
instead of hiding it.

---

## Act 3 · The leverage ratio · 1:20 – 2:05 · The core insight

**Do:** Scroll to the **Action leverage** panel.

> *"This is the idea that defines Direction B. EcoRise doesn't make students guess what matters —
> it computes the leverage ratio: individual action on one side, the school's institutional
> emissions on the other. Student action becomes powerful when it targets the school-scale lever.
> The app never shames a small action; it shows students where their voice moves the biggest
> number."*

Read the actual `leverage.message` aloud (the kg-vs-tonnes line). Let it land.

*Why it works:* the thesis is on screen as a **computed number**, not a claim. (And you've
defused the "are you dismissing student effort?" trap before a judge can spring it.)

---

## Act 4 · The recommendation + governance · 2:05 – 3:10 · AI-drafted, not AI-trusted

**Do:** Scroll to the **Next step** card (sparkle icon, dark background).

> *"Here's the recommendation — and here's why you can trust it. The carbon number came from
> deterministic math. The evidence came from retrieval. This card only appeared because it
> passed the grounding threshold."*

- Hover the **`?` help tip** to reveal the **grounding score** (e.g. ~0.82) and the citation.
- Read the recommendation headline + its **estimated impact** aloud (it carries a ±15% range —
  it'll be an operational fix, e.g. an HVAC schedule change).
- *Make it proof, not architecture:* point at the anomaly card's help tip that reads
  **"Deterministic — no LLM,"** and the recommendation's citation. The separation between the
  computed number, the retrieved source, and the AI's words is visible on the screen — don't just
  assert it.

**Then say the winner line:**

> *"The AI retrieves evidence and drafts the language. It does not compute the emissions, award
> the points, approve the action, or publish the change."*

**Do:** Show the **human-in-the-loop** gate. Open **Assign**, pick a real staff role from the
dropdown — **Sustainability Coordinator / Cafeteria Manager / Facilities Director** — then point
at **✓ Approve — Make Active Goal**.

> *"Even after it passes the gate, it's still just *proposed*. A named staff role has to approve
> it before it becomes an active school goal. A wrong cafeteria order affects 1,400 lunches —
> so a human owns the decision, by design."*

---

## Act 5 · The proof: the AI says nothing · 3:10 – 3:55 · (highest-leverage beat)

**Do this live — it refuses every time.** Open the **Research** tab → the **"Ask a question…"**
box. Type a question the evidence corpus can't ground, e.g.:

> **`Who won the 2022 World Cup?`**  *(or: `What's the best stock to buy right now?`)*

The coach returns **"No grounded answer found in the corpus."** — no invented answer.

> *"This is the screen I most want you to see. Ask it something outside its evidence and it
> doesn't improvise — it refuses. **The AI is allowed to say nothing.** That's the difference
> between a demo chatbot and a system a school could trust. The same gate that just refused this
> is the gate that lets the recommendation through only when it's grounded."*

**Do:** Scroll to the **eval metrics** on the same tab.

> *"And we measure that behavior. These come from our eval harness — `npm run test:coach-eval`
> regenerates them: faithfulness pass rate, citation validity, hallucination rate, an
> unanswerable-refusal rate, and an injection test we report pass/fail on rather than claiming
> perfect safety. You can re-run it right now."*

*Why it works:* anyone can show an AI that answers. Almost no hackathon team shows an AI that
**refuses** — and then shows the metric that proves the refusal is policy, not luck.

---

## Act 6 · Impact + scale · 3:55 – 4:30 · Who benefits, and the close

**On screen:** back to the Footprint card.

> *"Three groups win immediately. Teachers get an auditable, cited baseline they can hand to a
> facilities manager — not an AI guess. Students get quests ranked by real impact, not engagement
> bait. Administrators get an approval gate and an eval harness to point to when a parent asks how
> the AI decides.*
>
> *Before EcoRise, students saw generic eco quests. After EcoRise, the school sees that heating is
> the dominant emitter and routes the fix to the person who can change the schedule. One school
> today; a district is the same pipeline repeated."*

**Close on the one number:**

> *"1.2 kilograms versus 38 tonnes. We made the school see the difference — and made the AI prove
> it earned the right to recommend the fix."*

---

## 90-second emergency cut (if judges are rushed)

1. **0:00–0:20** Cold open: 1.2 kg vs 38 tonnes ≈ 30,000 bike rides.
2. **0:20–0:45** Leverage panel: individual action vs institutional lever (read `leverage.message`).
3. **0:45–1:10** Next step card: citation + grounding score, then the winner line ("does not compute, award, approve, or publish").
4. **1:10–1:25** Research ask box → off-domain question → **"No grounded answer found in the corpus."** *"The AI is allowed to say nothing."*
5. **1:25–1:30** Close on the one number.

---

## Optional beats — keep for Q&A, not the main 4:30

- **Log action → Evidence Panel** (photo → AI-detected → cited carbon math → server-scored
  points). Impressive, but it's the *student-behavior* side; it dilutes the institutional thesis.
  Pull it out only if a judge asks "what does the student actually do?"
- **Quests** — one sentence if time: *"Quest categories are ranked by the school's top emitter,
  so the footprint analysis decides what students are asked to do — not the other way around."*
- **Privacy Center** — open only if FERPA/COPPA comes up (tenant isolation, consent flow,
  school-level aggregate data, not student PII).

---

## Judge Q&A — anticipated hard questions + grounded answers

- **"Is the school data real?"** → "Representative, shaped to a real school's scale, and labeled
  as such — the demo doesn't need live feeds. The methodology is real: EPA factors, an OLS engine,
  a cited evidence corpus. Drop in a real CSV and nothing else changes."
- **"What stops the AI from hallucinating a number?"** → "It structurally can't. Carbon numbers
  come from a deterministic engine using cited EPA factors; the LLM only drafts language, gated at
  0.75 faithfulness. Below it, you saw it withhold. Want me to re-run the eval?"
- **"How is this different from a ChatGPT wrapper?"** → "A wrapper trusts the model. We don't:
  deterministic math, retrieval-grounded answers, a faithfulness gate, a named human approver, and
  a re-runnable eval harness. Five layers the model never gets to skip."
- **"What's in the evidence corpus?"** → "Curated research on school sustainability, building
  energy, waste, water, and behavior change — not the open web. Say it once; the citation on the
  recommendation card proves it's actually retrieved."
- **"Why should students care about the HVAC schedule?"** → "They shouldn't have to — that's the
  point. The leverage panel shows them where their effort counts and routes the big fixes to staff
  who can act. Students do the high-leverage quests; the school moves the tonnes."
- **"Does this scale beyond one school?"** → "It's school-agnostic. The board is a tenant; the
  pipeline is identical. Enter utility data, get a footprint. A district is N boards."
- **"What's the AI adding over a spreadsheet?"** → "Three things a spreadsheet can't: anomaly
  detection in the readings (z-score), evidence-grounded recommendations with citations, and a
  forecast with a confidence band — all auditable."
- **"Is the injection resistance really 100%?"** → "That's our eval harness's pass rate on the
  injection cases we test — re-runnable, not a guarantee of perfect safety. We report the number
  instead of claiming the model is unbreakable."
- **"What about student privacy (FERPA/COPPA)?"** → "Boards are tenant-isolated, there's a consent
  flow and a privacy center, and the footprint layer is school-level aggregate data, not student
  PII." *(Open the Privacy tab if pressed.)*

---

## If the live demo fails

- **No network / no key** → the app already runs offline; point at the **"DEMO — no model"**
  badge. Nothing is faked; the math, gate, and eval metrics are identical offline.
- **Backend down** → the seed is idempotent; re-run `npm run demo` (data persists in
  `backend/ecorise.db`).
- **The refusal is deterministic** → the Research ask-box off-domain question refuses in both
  live and offline-mock modes; it's the most reliable screen in the demo, so lead with it if
  anything else is flaky.
- **Total failure** → play the recorded fallback video (see [`DEPLOY.md`](DEPLOY.md)).

---

## Pre-demo checklist

- [ ] `npm run demo` running; `http://localhost:5173` loads.
- [ ] Logged in as `demo@ecorise.app`; board **Greenfield High** visible.
- [ ] Baseline **pre-seeded** — footprint shows categories + confidence chip on open.
- [ ] `COACH_ENABLED=true` + `seed:coach` done; **Next step** card shows a real recommendation
      (not the DEV "Demo fixture" placeholder); Research tab shows eval metrics.
- [ ] Refusal rehearsed: Research **"Ask a question…"** box + off-domain prompt
      (`Who won the 2022 World Cup?`) returns **"No grounded answer found in the corpus."**
- [ ] School Footprint open as the cold open.
- [ ] Know your numbers cold: **1.2 kg vs 38 tonnes ≈ 30,000 bike rides**; threshold **0.75**.
- [ ] Rehearse the winner line until it's muscle memory: *"does not compute, award, approve, or publish."*
