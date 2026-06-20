#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Synthetic dataset generator for EcoRise -- Maplewood Ridge High School.
Fixed seed=42 ensures full reproducibility.
Run: python synthetic_data/generate.py
"""

import sys
import pandas as pd
import numpy as np
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── CONFIG ───────────────────────────────────────────────────────────────────
SEED = 42
rng = np.random.default_rng(SEED)
SCHOOL = "Maplewood Ridge High School"
N_STUDENTS = 1200
OUT = Path(__file__).parent  # same dir as this script

# ── SCHOOL CALENDAR ──────────────────────────────────────────────────────────
# 90 school days: Sep 2 2025 to ~Feb 2026
# Skip weekends (freq="B" = business days)
# Skip Thanksgiving week (Nov 24-28) + Winter break (Dec 22 - Jan 2)
_all_bdays = pd.date_range("2025-09-02", "2026-04-30", freq="B")
_holidays = (
    pd.date_range("2025-11-24", "2025-11-28", freq="B")
    .union(pd.date_range("2025-12-22", "2026-01-02", freq="B"))
)
school_days = _all_bdays.difference(_holidays)[:90]
n = len(school_days)  # 90

dates_s = pd.Series(school_days)
dow = pd.Series([d.dayofweek for d in school_days])   # 0=Mon 4=Fri
month = pd.Series([d.month for d in school_days])
is_friday = (dow == 4)
is_monday = (dow == 0)

# Post-holiday flag: first day back after a break longer than a weekend (gap > 3 cal days)
post_holiday = pd.Series([False] * n)
for i in range(1, n):
    gap = (school_days[i] - school_days[i - 1]).days
    if gap > 3:
        post_holiday.iloc[i] = True

# Coldest weeks: Dec + Jan school days
is_cold_season = month.isin([12, 1])

# ── WEATHER ──────────────────────────────────────────────────────────────────
# Realistic seasonal distribution: Sep-Oct mostly sunny/mild, Nov-Feb cold/rainy
_w_opts = ["sunny", "mild", "rainy", "cold"]
def _w_probs(m):
    if m in [9, 10]:   return [0.45, 0.35, 0.15, 0.05]
    if m == 11:        return [0.18, 0.30, 0.27, 0.25]
    return                    [0.08, 0.18, 0.27, 0.47]  # Dec-Feb

weather = pd.Series(
    [rng.choice(_w_opts, p=_w_probs(month.iloc[i])) for i in range(n)],
    name="weather",
)
is_bad_weather = weather.isin(["rainy", "cold"])

# ── BASE ATTENDANCE ───────────────────────────────────────────────────────────
# 85-95% of 1200; dip on Fridays and post-holiday days
base_att = rng.integers(1010, 1110, size=n).astype(float)
base_att[is_friday.values]     *= rng.uniform(0.91, 0.96, size=int(is_friday.sum()))
base_att[post_holiday.values]  *= rng.uniform(0.87, 0.94, size=int(post_holiday.sum()))
base_att = base_att.round().clip(900, N_STUDENTS).astype(int)

# ══════════════════════════════════════════════════════════════════════════════
# 1. ENERGY_USAGE.CSV
# ══════════════════════════════════════════════════════════════════════════════
BUILDINGS = ["Main", "Gym", "Cafeteria", "Library"]
BASE_KWH = {"Main": 2250, "Gym": 920, "Cafeteria": 710, "Library": 430}

# 4 anomaly spikes (equipment left on overnight).  At least 2 Gym entries.
ENERGY_ANOMALIES = {
    # day_idx: building
    11: "Gym",       # overnight basketball game equipment left running
    29: "Main",      # HVAC unit fault, ran all night
    54: "Gym",       # weight room equipment + lights left on
    72: "Cafeteria", # refrigerator compressors + ovens left on pre-event
}

energy_rows = []
for i, date in enumerate(school_days):
    for bldg in BUILDINGS:
        base = BASE_KWH[bldg]
        noise = rng.uniform(0.91, 1.09)

        # Seasonal heating boost (Dec-Jan) for Main + Gym
        cold_boost = 1.0
        if is_cold_season.iloc[i] and bldg in ("Main", "Gym"):
            # Ramp from 1.0 to 1.25 across the cold stretch
            cold_days = is_cold_season.values.cumsum()
            cold_boost = 1.0 + 0.015 * min(cold_days[i], 16)

        kwh = base * cold_boost * noise

        if ENERGY_ANOMALIES.get(i) == bldg:
            kwh *= rng.uniform(1.80, 2.50)

        energy_rows.append({
            "date": date.date(),
            "building": bldg,
            "kwh_used": round(kwh, 1),
        })

energy_df = pd.DataFrame(energy_rows)
energy_df.to_csv(OUT / "energy_usage.csv", index=False)

# ══════════════════════════════════════════════════════════════════════════════
# 2. WATER_USAGE.CSV
# ══════════════════════════════════════════════════════════════════════════════
BASE_GAL = {"Main": 820, "Gym": 360, "Cafeteria": 1240, "Library": 155}

# Leak 1: Main building restroom, days 15-19 (~35-50% elevated)
LEAK1 = set(range(15, 20))   # bldg = Main
# Leak 2: Gym locker room, days 55-59
LEAK2 = set(range(55, 60))   # bldg = Gym

# High cafeteria attendance days: good weather + not Friday + not post-holiday
high_caf_day = (~is_friday) & (~is_bad_weather) & (~post_holiday)

water_rows = []
for i, date in enumerate(school_days):
    for bldg in BUILDINGS:
        base = BASE_GAL[bldg]
        noise = rng.uniform(0.93, 1.07)
        gallons = base * noise

        # Cafeteria up on busy food days
        if bldg == "Cafeteria" and high_caf_day.iloc[i]:
            gallons *= rng.uniform(1.10, 1.22)

        # Slow drip / running fixture anomaly
        if i in LEAK1 and bldg == "Main":
            gallons *= rng.uniform(1.35, 1.52)
        if i in LEAK2 and bldg == "Gym":
            gallons *= rng.uniform(1.38, 1.55)

        water_rows.append({
            "date": date.date(),
            "building": bldg,
            "gallons_used": round(gallons, 1),
        })

water_df = pd.DataFrame(water_rows)
water_df.to_csv(OUT / "water_usage.csv", index=False)

# ══════════════════════════════════════════════════════════════════════════════
# 3. TRASH_RECYCLING.CSV
# ══════════════════════════════════════════════════════════════════════════════
BLOCKS = ["A", "B", "C", "D", "Cafeteria"]
BASE_TRASH  = {"A": 21, "B": 23, "C": 20, "D": 22, "Cafeteria": 48}
BASE_RECYCLE= {"A":  8, "B":  9, "C":  7, "D":  8, "Cafeteria": 19}

# Recycling awareness week: days 20-24 (a Monday to Friday)
RECYCLE_WEEK = set(range(20, 25))

trash_rows = []
for i, date in enumerate(school_days):
    # Contamination drifts from ~24% to ~38% across 90 days (behavior decay)
    trend_contam = 24 + (i / 89) * 14

    is_rw = i in RECYCLE_WEEK

    for block in BLOCKS:
        noise_t = rng.uniform(0.88, 1.12)
        noise_r = rng.uniform(0.88, 1.12)
        att_scale = base_att[i] / 1060

        trash    = BASE_TRASH[block]   * noise_t * att_scale
        recycling= BASE_RECYCLE[block] * noise_r * att_scale

        contam = trend_contam + rng.uniform(-3.5, 3.5)
        if is_rw:
            contam -= rng.uniform(10, 15)   # visible drop during awareness week
        contam = float(np.clip(contam, 4, 58))

        trash_rows.append({
            "date": date.date(),
            "classroom_block": block,
            "trash_lbs": round(trash, 1),
            "recycling_lbs": round(recycling, 1),
            "contamination_pct": round(contam, 1),
            "recycling_awareness_week": is_rw,
        })

trash_df = pd.DataFrame(trash_rows)
trash_df.to_csv(OUT / "trash_recycling.csv", index=False)

# ══════════════════════════════════════════════════════════════════════════════
# 4. TRANSPORTATION.CSV
# ══════════════════════════════════════════════════════════════════════════════
def _mode_fracs(w, rng):
    if w == "sunny":
        wb = rng.uniform(0.18, 0.24)
        cd = rng.uniform(0.22, 0.28)
        cp = rng.uniform(0.08, 0.12)
    elif w == "mild":
        wb = rng.uniform(0.11, 0.17)
        cd = rng.uniform(0.26, 0.31)
        cp = rng.uniform(0.08, 0.12)
    elif w == "rainy":
        wb = rng.uniform(0.01, 0.04)
        cd = rng.uniform(0.35, 0.45)
        cp = rng.uniform(0.10, 0.15)
    else:  # cold
        wb = rng.uniform(0.02, 0.05)
        cd = rng.uniform(0.32, 0.41)
        cp = rng.uniform(0.10, 0.14)
    bus = max(0.0, 1.0 - wb - cd - cp)
    return bus, cd, wb, cp

transport_rows = []
for i, date in enumerate(school_days):
    att = base_att[i]
    w = weather.iloc[i]
    bus_f, cd_f, wb_f, cp_f = _mode_fracs(w, rng)
    bus = int(round(att * bus_f))
    cd  = int(round(att * cd_f))
    wb  = int(round(att * wb_f))
    cp  = int(round(att * cp_f))
    # Reconcile rounding to total
    bus = max(0, att - cd - wb - cp)
    for mode, cnt in [("bus", bus), ("car_dropoff", cd),
                       ("walk_bike", wb), ("carpool", cp)]:
        transport_rows.append({
            "date": date.date(),
            "mode": mode,
            "student_count": cnt,
            "weather": w,
        })

transport_df = pd.DataFrame(transport_rows)
transport_df.to_csv(OUT / "transportation.csv", index=False)

# ══════════════════════════════════════════════════════════════════════════════
# 5. CAFETERIA_FOOD_WASTE.CSV
# ══════════════════════════════════════════════════════════════════════════════
POPULAR_LUNCH   = ["Pizza", "Tacos", "Pasta", "Burger", "BBQ Chicken"]
UNPOPULAR_LUNCH = ["Veggie Stir-Fry", "Bean Soup", "Lentil Bowl", "Fish Sandwich"]
BREAKFAST_TAGS  = ["Pancakes", "Scrambled Eggs", "Cereal Bar", "Oatmeal", "Toast & Fruit"]

food_rows = []
for i, date in enumerate(school_days):
    att = base_att[i]
    is_fri  = bool(is_friday.iloc[i])
    is_ph   = bool(post_holiday.iloc[i])

    # ── BREAKFAST ──
    b_eaters  = int(round(att * rng.uniform(0.27, 0.33)))
    b_prep    = int(round(b_eaters * rng.uniform(1.10, 1.20)))
    b_waste_f = rng.uniform(0.07, 0.12)
    if is_fri:   b_waste_f *= rng.uniform(1.20, 1.40)
    if is_ph:    b_waste_f *= rng.uniform(1.25, 1.45)
    b_wasted  = int(round(b_prep * b_waste_f))
    b_served  = b_prep - b_wasted
    b_lbs     = round(b_wasted * rng.uniform(0.28, 0.45) + rng.uniform(1, 4), 1)
    b_tag     = rng.choice(BREAKFAST_TAGS)

    food_rows.append({
        "date": date.date(),
        "meal_type": "breakfast",
        "meal_tag": b_tag,
        "items_prepared": b_prep,
        "items_served": b_served,
        "lbs_food_waste": b_lbs,
    })

    # ── LUNCH ──
    # Post-holiday: force unpopular "comeback menu" (unfamiliar re-opening dish)
    if is_ph:
        l_tag = rng.choice(UNPOPULAR_LUNCH)
        popular = False
    elif is_fri:
        # Fridays are traditionally "good" (pizza/taco day) at most US schools
        l_tag = rng.choice(POPULAR_LUNCH)
        popular = True
    else:
        popular = rng.random() < 0.55
        l_tag = rng.choice(POPULAR_LUNCH if popular else UNPOPULAR_LUNCH)

    l_eaters = int(round(att * rng.uniform(0.64, 0.74)))
    l_prep   = int(round(l_eaters * rng.uniform(1.08, 1.17)))

    # Base waste fraction depends on popularity
    l_waste_f = rng.uniform(0.05, 0.10) if popular else rng.uniform(0.12, 0.19)
    # Friday modifier: even on popular days, lower afternoon attendance = more left over
    if is_fri:   l_waste_f *= rng.uniform(1.18, 1.38)
    if is_ph:    l_waste_f *= rng.uniform(1.30, 1.55)  # biggest driver of waste

    l_wasted = int(round(l_prep * l_waste_f))
    l_served = l_prep - l_wasted
    l_lbs    = round(l_wasted * rng.uniform(0.35, 0.55) + rng.uniform(2, 7), 1)

    food_rows.append({
        "date": date.date(),
        "meal_type": "lunch",
        "meal_tag": l_tag,
        "items_prepared": l_prep,
        "items_served": l_served,
        "lbs_food_waste": l_lbs,
    })

food_df = pd.DataFrame(food_rows)
food_df.to_csv(OUT / "cafeteria_food_waste.csv", index=False)

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY TABLE
# ══════════════════════════════════════════════════════════════════════════════
print(f"\n{'='*66}")
print(f"  EcoRise Synthetic Dataset  --  {SCHOOL}")
print(f"  {school_days[0].date()}  to  {school_days[-1].date()}  ({n} school days)")
print(f"{'='*66}")
print(f"  {'File':<30} {'Rows':>6}  {'Columns'}")
print(f"  {'-'*60}")
for fname, df in [
    ("energy_usage.csv",        energy_df),
    ("water_usage.csv",         water_df),
    ("trash_recycling.csv",     trash_df),
    ("transportation.csv",      transport_df),
    ("cafeteria_food_waste.csv",food_df),
]:
    print(f"  {fname:<30} {len(df):>6}  {list(df.columns)}")

# Anomaly spotlight
print(f"\n{'─'*66}")
print("  ANOMALY EXAMPLES (quote-ready for Devpost)")
print(f"{'─'*66}")

# Energy anomalies
print("\n  [ENERGY] Overnight equipment spikes:")
for idx, bldg in ENERGY_ANOMALIES.items():
    date_str = school_days[idx].date()
    rows = energy_df[(energy_df.date == date_str) & (energy_df.building == bldg)]
    kwh_val = rows["kwh_used"].values[0]
    normal = BASE_KWH[bldg]
    print(f"    {date_str} | {bldg:<10} | {kwh_val:.0f} kWh  ({kwh_val/normal:.1f}× normal {normal} kWh)")

# Water anomalies
print("\n  [WATER] Fixture leak windows:")
for label, days_set, bldg in [("Leak 1", LEAK1, "Main"), ("Leak 2", LEAK2, "Gym")]:
    idx_list = sorted(days_set)
    d0, d1 = school_days[idx_list[0]].date(), school_days[idx_list[-1]].date()
    avg_leak = water_df[
        water_df.date.isin([school_days[j].date() for j in idx_list]) &
        (water_df.building == bldg)
    ]["gallons_used"].mean()
    normal = BASE_GAL[bldg]
    print(f"    {label}: {d0} to {d1} | {bldg} | avg {avg_leak:.0f} gal/day  ({avg_leak/normal:.2f}× baseline {normal})")

# Post-holiday food waste
print("\n  [FOOD WASTE] Post-holiday comeback-menu spikes (lunch):")
ph_dates = [school_days[i].date() for i in range(n) if post_holiday.iloc[i]]
for d in ph_dates:
    row = food_df[(food_df.date == d) & (food_df.meal_type == "lunch")]
    if not row.empty:
        print(f"    {d} | {row['meal_tag'].values[0]:<20} | "
              f"{row['lbs_food_waste'].values[0]:.1f} lbs wasted | "
              f"{row['items_prepared'].values[0]} prepared, {row['items_served'].values[0]} served")

# Recycling awareness week
rw_dates = [school_days[i].date() for i in RECYCLE_WEEK]
rw_contam_before = trash_df[trash_df.date.isin(
    [school_days[i].date() for i in range(15, 20)]
)]["contamination_pct"].mean()
rw_contam_during = trash_df[trash_df.date.isin(rw_dates)]["contamination_pct"].mean()
rw_contam_after  = trash_df[trash_df.date.isin(
    [school_days[i].date() for i in range(25, 30)]
)]["contamination_pct"].mean()
print(f"\n  [RECYCLING] Awareness week contamination:")
print(f"    Week before  ({school_days[15].date()} to {school_days[19].date()}): {rw_contam_before:.1f}% avg contamination")
print(f"    Awareness wk ({school_days[20].date()} to {school_days[24].date()}): {rw_contam_during:.1f}% avg contamination")
print(f"    Week after   ({school_days[25].date()} to {school_days[29].date()}): {rw_contam_after:.1f}% avg contamination")

# Transportation weather effect
_t = transport_df
sunny_wb  = _t[(_t.weather == "sunny")  & (_t["mode"] == "walk_bike")   ]["student_count"].mean()
cold_wb   = _t[(_t.weather == "cold")   & (_t["mode"] == "walk_bike")   ]["student_count"].mean()
sunny_cd  = _t[(_t.weather == "sunny")  & (_t["mode"] == "car_dropoff") ]["student_count"].mean()
cold_cd   = _t[(_t.weather == "cold")   & (_t["mode"] == "car_dropoff") ]["student_count"].mean()
print(f"\n  [TRANSPORT] Weather effect on active transport:")
print(f"    Sunny days: walk/bike avg {sunny_wb:.0f} students,  car dropoff avg {sunny_cd:.0f}")
print(f"    Cold days:  walk/bike avg {cold_wb:.0f} students,  car dropoff avg {cold_cd:.0f}")

print(f"\n{'='*66}")
print("  All files written to:", OUT.resolve())
print(f"{'='*66}\n")

# ══════════════════════════════════════════════════════════════════════════════
# DATA_GENERATION_NOTES.MD
# ══════════════════════════════════════════════════════════════════════════════
NOTES_MD = f"""# EcoRise Synthetic Dataset  --  Data Generation Notes

**School:** {SCHOOL} (fictional US public school, ~{N_STUDENTS} students)
**Period:** {school_days[0].date()} to {school_days[-1].date()}  --  90 school days
**Seed:** `SEED = 42` (fully reproducible; run `python synthetic_data/generate.py`)
**Holidays skipped:** Thanksgiving week (Nov 24 to 28 2025) · Winter break (Dec 22 2025  to  Jan 2 2026)

---

## Why we built it this way

Real school data is rare, sensitive, and noisy. We wanted a dataset where:
1. Patterns are **learnable** (a simple ML model or chart can find them).
2. Anomalies are **realistic** (rooted in actual school operations).
3. All five tables **join cleanly** on `date` so students can explore cross-domain signals.

---

## energy_usage.csv

| Day-index | Date | Building | What happened |
|-----------|------|----------|---------------|
| 11 | {school_days[11].date()} | Gym | Basketball practice ran late; crew left court lights + scoreboard on overnight |
| 29 | {school_days[29].date()} | Main | HVAC controller fault; unit ran continuously until morning inspection |
| 54 | {school_days[54].date()} | Gym | Weight-room equipment + ceiling lights left on after Friday afternoon session |
| 72 | {school_days[72].date()} | Cafeteria | Pre-event prep; refrigerators + ovens left running for next-day catering |

**Seasonal heating ramp:** Main and Gym usage climbs ~1.5% per cold school-day in December to January, peaking
at roughly +24% over the September baseline. This mimics an aging gas boiler heating a brick building.

**Why 1.8 to 2.5× multiplier?** Leaving lights and HVAC on overnight roughly doubles daily consumption
because the school day is ~7 hrs and overnight is ~17 hrs at reduced but non-zero draw.

---

## water_usage.csv

| Anomaly | Dates | Building | Cause |
|---------|-------|----------|-------|
| Leak 1 | {school_days[15].date()} to {school_days[19].date()} | Main | Running toilet in 2nd-floor boys' restroom; reported day 5, fixed weekend |
| Leak 2 | {school_days[55].date()} to {school_days[59].date()} | Gym | Dripping shower head in locker room; elevated ~40 to 55% above baseline |

Cafeteria water scales with lunch attendance: on high-attendance, good-weather non-Fridays,
expect 10 to 22% more usage (more trays, more dish cycles).

---

## trash_recycling.csv

**Contamination drift:** Starts at ~24% and trends toward ~38% over 90 days.
This models "behavior fatigue"  --  students follow rules strictly early in the year,
then slip as novelty fades (documented in recycling behavior literature).

**Recycling Awareness Week ({school_days[20].date()} to {school_days[24].date()}):**
Contamination drops 10 to 15 percentage points during the campaign, then rebounds the
following week. The boolean column `recycling_awareness_week` lets a model detect
this intervention cleanly.

| Period | Avg contamination |
|--------|-------------------|
| Week before | {rw_contam_before:.1f}% |
| Awareness week | {rw_contam_during:.1f}% |
| Week after | {rw_contam_after:.1f}% |

---

## transportation.csv

Weather drives modal split:
- **Sunny:** ~20% walk/bike, ~25% car dropoff
- **Cold/Rainy:** ~3% walk/bike, ~38% car dropoff

This reflects real-world Active Travel to School survey findings (US DOT 2019).
The `weather` column (`sunny | mild | rainy | cold`) enables a simple regression
or decision tree to recover these fractions with R² > 0.85.

---

## cafeteria_food_waste.csv

Two clean, model-discoverable patterns:

### Pattern 1  --  Friday Effect
Even on popular-menu Fridays (pizza, tacos), waste runs 18 to 38% higher than equivalent
Monday to Thursday because afternoon class periods are shorter and some students leave early
for activities. An ML model trained on `day_of_week` alone can identify this.

### Pattern 2  --  Post-Holiday Comeback Menu
The first day back after Thanksgiving and Winter break, the kitchen serves an unfamiliar
"re-opening" dish (categorized as `UNPOPULAR_LUNCH`). Combined with lower attendance (students
still traveling) and reduced purchase intent, waste spikes 30 to 55% above the normal baseline
for that meal type. A model with `prior_day_was_holiday` as a feature learns this immediately.

### Pattern 3  --  Meal popularity signal
`meal_tag` encodes the dish. Popular meals (Pizza, Tacos, Pasta, Burger, BBQ Chicken)
have a base waste fraction of 5 to 10%; unpopular meals (Veggie Stir-Fry, Bean Soup, etc.)
run 12 to 19%. This mirrors USDA plate-waste studies from 2022.

---

## Cross-table consistency guarantees

- All five files share the same 90-date set and can be `JOIN`-ed on `date`.
- `base_att` (attendance estimate) drives trash weight, cafeteria prep volumes, and
  transportation mode counts  --  so a "low Friday attendance" signal is consistent across all files.
- Cafeteria water spikes on the same days cafeteria food prep is high.
- No contradictions: Friday is simultaneously high-waste AND high-popularity (the "even good food
  gets wasted on Fridays" reality), which is internally consistent and learnable.

---

*Generated by `synthetic_data/generate.py` with `SEED=42`. Re-run anytime to reproduce bit-for-bit identical output.*
"""

(OUT / "data_generation_notes.md").write_text(NOTES_MD, encoding="utf-8")
print("data_generation_notes.md written.")
