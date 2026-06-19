# EcoRise — Real Data Guide (the 92 → 100 step)

The app maxes out at **92/100** on synthetic data. The final 8 points are *real-world
validation* — not more code. This is the exact, ~15-minute path to get there honestly.
Every number must come from a real, citable source. **Never invent or relabel synthetic data
as real — that is disqualifying.**

## What "100" requires (per the rubric's Impact & Insight + Responsible AI)
1. Real school utility data imported.
2. A named facilities/teacher reviewer who confirms the recommendation is plausible.
3. One measured before/after outcome after an approved action.

## Step 1 — Get one school's 12 real monthly utility rows
Public sources that publish genuine monthly school utility data:
- **Minnesota B3 Benchmarking** — https://mn.b3benchmarking.com/Report (MN public schools are
  legally required to enter monthly electricity/gas/water; statute 123B.651). Pick a school,
  read its monthly kWh / therms / gallons.
- **Seattle Public Schools Utility Data Dashboard** —
  https://www.seattleschools.org/departments/resource-conservation/utility-data-dashboard/
  (per-school electricity, natural gas, water, wastewater).
- **BuildSmartDC** (DC public buildings incl. schools) — via
  https://doee.dc.gov/page/energy-benchmarking-data-collection
- Or: email a real school's facilities/energy manager and ask for a 12-month utility export.

Record, per month: `electricityKwh`, `gasTherms`, `waterGallons`. **Redact account numbers.**

## Step 2 — Add weather (degree-days) from NOAA
`hdd` / `cdd` are NOT in utility exports — they come from the school's location:
- NOAA Climate Data Online (https://www.ncdc.noaa.gov/cdo-web/) or https://www.degreedays.net/
- Pull monthly heating degree-days (hdd) and cooling degree-days (cdd) for the same 12 months
  at the nearest station to the school. Base 65F is standard.

## Step 3 — Add school days from the published calendar
`schoolDays` = number of in-session days that month, from the district's public academic calendar.

## Step 4 — Build the CSV (exact header)
```
month,schoolDays,hdd,cdd,electricityKwh,gasTherms,waterGallons
2025-01,19,1080,0,41250,3120,182000
...
```
12 rows minimum. See `docs/sample-utility-import.csv` for the format (that file is a
*format sample*, not real — replace every value with the sourced real numbers).

## Step 5 — Import it
AI tab -> Insights -> **Import real utility data (CSV)** -> pick your file.
`dataMode` flips `synthetic -> real`, and the **Judge Evidence** panel updates to "Real import"
automatically. The OLS baseline, anomalies, forecast, and MAPE now run on real data.

## Step 6 — Approve -> measure -> verify (the measured-outcome loop)
1. In the action plan, the organizer **approves** a recommendation (named adult approver).
2. Implement it (e.g. weekend HVAC setback).
3. Enter the **before/after** measurement in the verify step -> the app computes the real
   % reduction and marks the action **confirmed**.

## Step 7 — Capture the reviewer statement (for the judges)
One line from the facilities/energy manager or teacher sponsor:
> "I reviewed the imported utility data and EcoRise's anomaly/recommendation output for
> [School]. The data source is [export/bills], and the recommended action is plausible for
> human review (not an automated finding)."

## Provenance rule
Keep a short note of where each column came from (utility export URL/date, NOAA station,
calendar URL). If a judge asks "is this real?", you can point to the source for every number.
That is what turns 92 into 100 — and what keeps the entry honest.
