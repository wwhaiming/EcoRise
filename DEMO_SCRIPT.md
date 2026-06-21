# EcoRise — Demo Video Script (4:30)

**Format:** screen recording + voiceover. Timestamps are cues, not hard cuts.

---

## Pre-roll setup (not recorded)

```bash
npm run demo
cd backend && COACH_ENABLED=true npm run seed:coach
```

Log in as `demo@ecorise.app`. Open **Learning → AI Coach**. School footprint card visible at top.
Browser at 100% zoom, mobile frame if possible.

---

## [0:00 – 0:30] The problem

**SCREEN:** Learning tab, AI Coach sub-tab. School footprint card fills the frame.
The `~186t CO₂e / mo` headline and category bars are visible. Don't interact yet.

**VO:**
> "Most sustainability apps track what students do. Bike rides. Recycled bottles.
> But Garfield High School emits 186 tonnes of CO₂ every month — from its cafeteria,
> its energy bills, its buses — and nobody was showing students that number.
> We built EcoRise because the problem was never the students. It was the school."

**SCREEN:** Slowly scroll the category bars. Pause on the 🔥 flame icon marking Cafeteria food.

**VO:**
> "The flame marks the biggest single emitter. Right now that's cafeteria food —
> roughly 60 tonnes a month. Below it: electricity and natural gas, both from
> Garfield's real utility bills on Seattle Public Schools' public dashboard."

---

## [0:30 – 1:00] Real data, honest confidence

**SCREEN:** Zoom into the confidence chip (top-right of card). It reads `low confidence`.

**VO:**
> "Two of six categories use Garfield's actual numbers — 143,000 kilowatt-hours
> of electricity and 4,766 therms of gas per month, straight from the district's
> published utility data. The other four fall back to EPA national averages.
> The chip says low confidence, because that's the truth."

**SCREEN:** Tap **Update school data**. Wizard slides open showing labeled fields.
Fields for Electricity and Gas already show the pre-loaded values.

**VO:**
> "A teacher opens the wizard, enters the school's meal counts, bus routes,
> water bills. Every field the model fills in from real inputs it tags as medium confidence.
> Every field still on a national average stays labeled estimate.
> No guessing. No hidden assumptions."

**SCREEN:** Close the wizard without saving.

---

## [1:00 – 1:30] The leverage ratio

**SCREEN:** Scroll to the green **Action leverage** block on the card.

**VO:**
> "Here's the core insight. This week, five students logged actions that saved
> about 7.8 kilograms of CO₂ combined. Garfield's cafeteria emits roughly
> 13,900 kilograms in the same week. Student action is 0.06% of the institutional load.
> It's real — but it's a rounding error until someone changes the menu or
> renegotiates the energy contract. That's what this panel makes visible."

---

## [1:30 – 2:00] AI recommendation + faithfulness gate

**SCREEN:** Scroll to the **Next step** block (sparkle icon, dark navy background).
Hover the ⓘ tip to show the grounding score.

**VO:**
> "The AI generated a recommendation for the biggest emitter.
> It only appears here because it scored above 0.75 on a faithfulness gate —
> a similarity check against a corpus of 1,000 cited research papers.
> The score is shown. The citation is shown. The LLM did not invent a number —
> a deterministic engine computed it from an EPA factor.
> Below the threshold, the coach withholds the answer rather than guess."

**SCREEN:** Click a green leaf source chip. Paper opens in new tab. Cut back.

---

## [2:00 – 2:30] Log an action → Evidence Panel

**SCREEN:** Tap the green **+ FAB**. Log action sheet opens. Upload or select a photo.
Tap submit. Evidence Panel opens automatically.

**VO:**
> "A student logs a bike commute. The vision model identifies the action.
> The carbon math comes from a cited EPA factor — not the AI.
> The points are scored server-side. The LLM cannot award a point."

**SCREEN:** Scroll the Evidence Panel: AI detected → Carbon math (formula + factor + range)
→ Points awarded → AI pipeline tools → Integrity checks.

---

## [2:30 – 3:00] Human-in-the-loop approval gate

**SCREEN:** Bottom nav **Home**. Tap the green **"School Hidden Footprint"** card.
Weekly Insights dashboard opens. Scroll to section **④ AI Recommendations + Human Approval Gate**.

**VO:**
> "Every recommendation the AI makes requires a named staff member to approve it
> before it becomes an active school goal. That's a hard constraint, not a UX choice —
> because wrong decisions here affect 1,500 students."

**SCREEN:** Point at the **Flag as inaccurate** control on a prediction card (section ③).

**VO:**
> "Staff can flag a prediction wrong. Repeated flags surface as a model-review signal.
> They don't just consume AI outputs — they correct the model."

---

## [3:00 – 3:30] AI report card

**SCREEN:** Bottom nav **Learning** → pill toggle to **Research Library** sub-tab.
Scroll to the responsible-AI eval report card.

**VO:**
> "These are live numbers from our eval harness. Faithfulness pass rate.
> Refusal precision — the coach withholds rather than guesses when a question
> can't be grounded. Hallucination rate. Injection resistance.
> Retrieval Recall at k and MRR. Re-run anytime with npm run test:coach-eval."

---

## [3:30 – 4:00] Quests driven by footprint analysis

**SCREEN:** Bottom nav **Home**. Scroll past the leaderboard to the **Quests** section.

**VO:**
> "Quest categories are ranked by the school's top emitter.
> When cafeteria food is the biggest source, food-reduction quests surface first.
> The footprint analysis drives what students are asked to do —
> not the other way around."

---

## [4:00 – 4:30] Who benefits

**SCREEN:** Return to **Learning → AI Coach**, school footprint card.

**VO:**
> "Three groups benefit directly.
> Teachers get an auditable, cited baseline they can hand to a facilities manager —
> not an AI guess.
> Students get quests ranked by actual impact, not engagement optimization.
> Administrators get an approval gate and an eval harness they can point to
> when a parent asks how the AI makes decisions.
>
> This is Garfield High School in Seattle. The same model runs for any school
> that enters its utility data. The hidden footprint becomes visible.
> The leverage ratio becomes actionable."

**SCREEN:** Fade out on the footprint card headline: `~186t CO₂e / mo`.

---

## Data sources

| Field | Value | Source |
|---|---|---|
| Electricity (kWh/mo) | 143,083 | Seattle Public Schools Energy & Utility Dashboard, CY 2023 (1,716,998 kWh ÷ 12) |
| Natural gas (therms/mo) | 4,766 | Same dashboard, CY 2023 (57,189 therms ÷ 12) |
| Enrollment | 1,507 | NCES CCD 2024-25, ID 530771001171 |
| Cafeteria food | ~60t (default) | 1 meal/student/day × 2.0 kg CO₂e (OWID/Poore & Nemecek 2018) |
| Commuting | ~42t (default) | 40% driven × 8 mi round-trip (EPA vehicle factor) |
| Natural gas | ~25t | 4,766 therms × 5.3 kg CO₂e/therm (EPA GHG Factors Hub) |
| Electricity | ~57t | 143,083 kWh × 0.40 kg CO₂e/kWh (EPA eGRID US avg) |
| **Total** | **~186t CO₂e/mo** | |
