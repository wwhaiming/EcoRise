/* EcoRise — "Lincoln High School" sample dataset (Named School Mode, Direction B).
 *
 * A specific, local context so the demo is never "a tool for schools" in the abstract:
 * 14 months of synthetic-but-plausible utility readings for one named school, built from
 * realistic per-school-day + degree-day rates with a DELIBERATELY PLANTED anomaly
 * (Jan 2026 heating gas runs high after a cold snap because weekend boiler zones were left
 * on). The anomaly engine should surface exactly that. All synthetic — no real/private data.
 *
 * Fields per month: schoolDays, hdd (heating degree-days), cdd (cooling degree-days),
 * electricityKwh, gasTherms, waterGallons, busMiles, recyclingRatePct, contaminationPct.
 */
const profile = {
  name: 'Lincoln High School',
  location: 'Columbus, OH',
  students: 820,
  note: 'Synthetic sample data for demonstration. Replace with your school\'s real bills to raise confidence.',
};

// Footprint baseline inputs (representative recent month) so the footprint model shows
// Lincoln-specific numbers instead of national-average defaults.
const baseline = {
  students: 820,
  monthlyKwh: 3400,
  monthlyGasTherms: 580,
  busMilesPerWeek: 1400,
  pctDrivenStudents: 45,
  landfillBagsPerWeek: 90,
  monthlyWaterM3: 83,
};

const series = [
  { month: '2025-05', schoolDays: 20, hdd: 120, cdd: 90,  electricityKwh: 3455, gasTherms: 289, waterGallons: 22120, busMiles: 1480, recyclingRatePct: 41, contaminationPct: 18 },
  { month: '2025-06', schoolDays: 14, hdd: 30,  cdd: 210, electricityKwh: 2861, gasTherms: 167, waterGallons: 16180, busMiles: 1040, recyclingRatePct: 39, contaminationPct: 21 },
  { month: '2025-07', schoolDays: 4,  hdd: 5,   cdd: 320, electricityKwh: 1812, gasTherms: 88,  waterGallons: 6720,  busMiles: 240,  recyclingRatePct: 36, contaminationPct: 24 },
  { month: '2025-08', schoolDays: 8,  hdd: 10,  cdd: 280, electricityKwh: 2244, gasTherms: 109, waterGallons: 10720, busMiles: 560,  recyclingRatePct: 38, contaminationPct: 23 },
  { month: '2025-09', schoolDays: 21, hdd: 60,  cdd: 160, electricityKwh: 3602, gasTherms: 233, waterGallons: 22810, busMiles: 1560, recyclingRatePct: 42, contaminationPct: 17 },
  { month: '2025-10', schoolDays: 22, hdd: 220, cdd: 60,  electricityKwh: 3661, gasTherms: 408, waterGallons: 23980, busMiles: 1600, recyclingRatePct: 44, contaminationPct: 15 },
  { month: '2025-11', schoolDays: 18, hdd: 420, cdd: 10,  electricityKwh: 3170, gasTherms: 615, waterGallons: 20040, busMiles: 1320, recyclingRatePct: 43, contaminationPct: 16 },
  { month: '2025-12', schoolDays: 15, hdd: 560, cdd: 0,   electricityKwh: 2861, gasTherms: 748, waterGallons: 17180, busMiles: 1100, recyclingRatePct: 40, contaminationPct: 19 },
  { month: '2026-01', schoolDays: 19, hdd: 640, cdd: 0,   electricityKwh: 3301, gasTherms: 1065, waterGallons: 21030, busMiles: 1400, recyclingRatePct: 41, contaminationPct: 18 },
  { month: '2026-02', schoolDays: 19, hdd: 520, cdd: 0,   electricityKwh: 3299, gasTherms: 731, waterGallons: 21060, busMiles: 1400, recyclingRatePct: 42, contaminationPct: 17 },
  { month: '2026-03', schoolDays: 21, hdd: 380, cdd: 20,  electricityKwh: 3531, gasTherms: 586, waterGallons: 22980, busMiles: 1560, recyclingRatePct: 45, contaminationPct: 14 },
  { month: '2026-04', schoolDays: 21, hdd: 210, cdd: 70,  electricityKwh: 3559, gasTherms: 399, waterGallons: 22940, busMiles: 1560, recyclingRatePct: 46, contaminationPct: 13 },
  { month: '2026-05', schoolDays: 20, hdd: 120, cdd: 95,  electricityKwh: 3461, gasTherms: 291, waterGallons: 22040, busMiles: 1480, recyclingRatePct: 45, contaminationPct: 14 },
  { month: '2026-06', schoolDays: 14, hdd: 30,  cdd: 215, electricityKwh: 2868, gasTherms: 165, waterGallons: 16220, busMiles: 1040, recyclingRatePct: 43, contaminationPct: 16 },
];

// Expected predictors for the next month to forecast (2026-07, summer break).
const upcoming = { month: '2026-07', schoolDays: 5, hdd: 5, cdd: 330 };

// School Context Packet — makes the analysis unmistakably local + scoped (Direction B).
const context = {
  district: 'Columbus City Schools',
  city: 'Columbus',
  state: 'OH',
  buildingSqFt: 142000,
  gradeLevels: '9-12',
  climateStation: 'NOAA — Columbus/Port Columbus Intl (HDD/CDD basis)',
  schoolCalendarSource: 'District 2025-26 academic calendar',
  scope: {
    included: ['Electricity', 'Heating (natural gas)', 'Water', 'Trash & recycling', 'Transportation / commuting'],
    excluded: ['Food / cafeteria (that is Direction A — food-waste)', 'Procurement', 'Construction'],
    why: "Direction B: My School's Hidden Footprint — operational environmental impact only.",
  },
  transportation: {
    nearestTransitRoutes: ['COTA 31', 'COTA 10'],
    studentDropoffPattern: '~45% car drop-off/pickup; buses cover most rural routes',
    lateActivityBusDays: ['Tue', 'Thu'],
  },
  dataNote: 'Synthetic demonstration dataset modeled on a typical 800-student US high school. Replace with real bills + calendar to raise confidence.',
};

module.exports = { profile, baseline, series, upcoming, context };
