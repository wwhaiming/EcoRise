/* GeoRise — School Hidden-Footprint Model.
 *
 * WHY THIS EXISTS:
 * Direction B is about a school's HIDDEN footprint — the emissions a school does not
 * see — not the CO2 students save by logging eco-actions. carbonEngine.js handles the
 * latter (avoided emissions per action). This module estimates the former: a coarse,
 * Scope-style institutional footprint from a small baseline the teacher enters, so the
 * coach can point at the biggest real emitter and compare it to student action leverage.
 *
 * HONESTY CONTRACT (read before trusting a number):
 *  - Defaults are COARSE NATIONAL AVERAGES, not this school's real data. Every category
 *    returns a confidence + explicit assumptions + a low/high range + a cited factor.
 *  - These are ESTIMATES. The accurate path is a teacher entering real utility bills /
 *    bus miles / meals; provided inputs raise confidence and replace the default.
 *  - Pure + deterministic so it is unit-testable and the same baseline always yields the
 *    same audited number. No LLM, no invented precision.
 *
 * SOURCES (per-factor citation below):
 *  - EPA eGRID (electricity), EPA GHG Emission Factors Hub (natural gas, commuting):
 *      https://www.epa.gov/egrid · https://www.epa.gov/climateleadership/ghg-emission-factors-hub
 *  - EPA WARM (landfilled mixed MSW): https://www.epa.gov/warm
 *  - Our World in Data / Poore & Nemecek 2018 (food): https://ourworldindata.org/environmental-impacts-of-food
 */

const round = (n, d = 1) => { const f = 10 ** d; return Math.round((Number(n) || 0) * f) / f; };

// Published, citable factors. value = central estimate; low/high = uncertainty band.
// These are intentionally coarse; confidence is downgraded when a default is used.
const FACTORS = {
  electricity_kwh: {
    id: 'epa-egrid-kwh', factorName: 'Grid electricity (US avg)', value: 0.40, low: 0.20, high: 0.62, unit: 'kg CO2e / kWh',
    source: 'EPA eGRID (US national average)', sourceUrl: 'https://www.epa.gov/egrid', sourceYear: 2024,
  },
  natural_gas_therm: {
    id: 'epa-ghg-therm', factorName: 'Natural gas combustion', value: 5.3, low: 5.2, high: 5.4, unit: 'kg CO2e / therm',
    source: 'EPA GHG Emission Factors Hub', sourceUrl: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub', sourceYear: 2025,
  },
  vehicle_mile: {
    id: 'epa-vehicle-mile', factorName: 'Average passenger vehicle', value: 0.40, low: 0.28, high: 0.52, unit: 'kg CO2e / mile',
    source: 'EPA GHG Emission Factors Hub', sourceUrl: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub', sourceYear: 2025,
  },
  school_meal: {
    id: 'owid-school-meal', factorName: 'Average mixed (meat-inclusive) meal', value: 2.0, low: 1.0, high: 4.5, unit: 'kg CO2e / meal',
    source: 'Our World in Data (Poore & Nemecek, 2018) — meal-level approximation', sourceUrl: 'https://ourworldindata.org/environmental-impacts-of-food', sourceYear: 2018,
  },
  landfill_kg: {
    id: 'epa-warm-msw-landfill', factorName: 'Landfilled mixed municipal solid waste', value: 0.58, low: 0.30, high: 1.00, unit: 'kg CO2e / kg waste',
    source: 'EPA WARM (mixed MSW, landfilled)', sourceUrl: 'https://www.epa.gov/warm', sourceYear: 2024,
  },
  water_m3: {
    id: 'water-supply-treatment', factorName: 'Water supply + treatment', value: 0.40, low: 0.20, high: 0.70, unit: 'kg CO2e / m3',
    source: 'Water-sector LCA literature (coarse approximation)', sourceUrl: 'https://ourworldindata.org/environmental-impacts-of-food', sourceYear: 2020,
  },
};

const CATEGORY_LABELS = {
  electricity: 'Electricity', natural_gas: 'Heating (natural gas)', commuting: 'Student/staff commuting',
  cafeteria_food: 'Cafeteria food', landfill_waste: 'Landfill waste', water: 'Water',
};

const WEEKS_PER_MONTH = 4.33;
const SCHOOL_DAYS_PER_MONTH = 20;

function band(kg, f) {
  // Scale the central kg into a low/high using the factor's relative uncertainty.
  const rel = (v) => (f.value > 0 ? v / f.value : 1);
  return { low: round(kg * rel(f.low)), high: round(kg * rel(f.high)) };
}

/* baseline: optional teacher inputs. Any omitted field falls back to a labeled default
 * derived from `students`, and that category's confidence drops to 'low'. */
function estimateFootprint(baseline = {}) {
  const students = Math.max(1, Number(baseline.students) || 500);
  const cats = [];
  const push = (category, kg, factor, confidence, assumptions, provided) => {
    const c = round(kg);
    cats.push({
      category, label: CATEGORY_LABELS[category] || category,
      kgCO2ePerMonth: c, ...band(c, factor), unit: 'kg CO2e / month',
      confidence, provided: !!provided, assumptions,
      factorName: factor.factorName, source: factor.source, sourceUrl: factor.sourceUrl, sourceYear: factor.sourceYear, sourceId: factor.id,
    });
  };

  // Electricity: real monthly kWh if given, else ~6 kWh/student/school-day default.
  const kwh = Number.isFinite(+baseline.monthlyKwh) ? +baseline.monthlyKwh : students * 6 * SCHOOL_DAYS_PER_MONTH;
  push('electricity', kwh * FACTORS.electricity_kwh.value, FACTORS.electricity_kwh,
    baseline.monthlyKwh ? 'medium' : 'low',
    [baseline.monthlyKwh ? `Provided ${kwh} kWh/month` : `Default ~6 kWh/student/day × ${students} students × ${SCHOOL_DAYS_PER_MONTH} days`, 'US-average grid intensity; real value varies sharply by region'],
    baseline.monthlyKwh);

  // Natural gas heating: therms if given, else ~0.5 therm/student/month default.
  const therms = Number.isFinite(+baseline.monthlyGasTherms) ? +baseline.monthlyGasTherms : students * 0.5;
  push('natural_gas', therms * FACTORS.natural_gas_therm.value, FACTORS.natural_gas_therm,
    baseline.monthlyGasTherms ? 'medium' : 'low',
    [baseline.monthlyGasTherms ? `Provided ${therms} therms/month` : `Default ~0.5 therm/student/month × ${students} students`, 'Heating load swings with climate + building envelope'],
    baseline.monthlyGasTherms);

  // Commuting: bus miles/week + a coarse car-commute estimate.
  const busMiles = Number.isFinite(+baseline.busMilesPerWeek) ? +baseline.busMilesPerWeek : students * 1.5;
  const carShare = Number.isFinite(+baseline.pctDrivenStudents) ? +baseline.pctDrivenStudents / 100 : 0.4;
  const carMiles = students * carShare * 4 * 2 * SCHOOL_DAYS_PER_MONTH; // round-trip 4mi avg
  const commuteMonthlyMiles = busMiles * WEEKS_PER_MONTH + carMiles;
  push('commuting', commuteMonthlyMiles * FACTORS.vehicle_mile.value, FACTORS.vehicle_mile,
    (baseline.busMilesPerWeek || baseline.pctDrivenStudents) ? 'medium' : 'low',
    [`Bus ${round(busMiles)} mi/wk + ~${Math.round(carShare * 100)}% of ${students} students driven ~8 mi round-trip`, 'Bus per-passenger allocation simplified to vehicle-mile factor'],
    !!(baseline.busMilesPerWeek || baseline.pctDrivenStudents));

  // Cafeteria food: meals/day if given, else 1 meal/student/day.
  const mealsDay = Number.isFinite(+baseline.dailyMealsServed) ? +baseline.dailyMealsServed : students;
  const mealsMonth = mealsDay * SCHOOL_DAYS_PER_MONTH;
  push('cafeteria_food', mealsMonth * FACTORS.school_meal.value, FACTORS.school_meal,
    baseline.dailyMealsServed ? 'medium' : 'low',
    [baseline.dailyMealsServed ? `Provided ${mealsDay} meals/day` : `Default 1 meal/student/day × ${students}`, 'Per-meal factor is a coarse mixed-diet average; menu mix dominates'],
    baseline.dailyMealsServed);

  // Landfill waste: bags/week → ~5 kg/bag default mass.
  const bags = Number.isFinite(+baseline.landfillBagsPerWeek) ? +baseline.landfillBagsPerWeek : Math.ceil(students / 25);
  const wasteKgMonth = bags * 5 * WEEKS_PER_MONTH;
  push('landfill_waste', wasteKgMonth * FACTORS.landfill_kg.value, FACTORS.landfill_kg,
    baseline.landfillBagsPerWeek ? 'medium' : 'low',
    [`${round(bags)} bags/wk × ~5 kg/bag`, 'WARM landfill factor depends on waste composition + landfill gas capture'],
    baseline.landfillBagsPerWeek);

  // Water: m3/month if given, else ~0.3 m3/student/month.
  const water = Number.isFinite(+baseline.monthlyWaterM3) ? +baseline.monthlyWaterM3 : students * 0.3;
  push('water', water * FACTORS.water_m3.value, FACTORS.water_m3,
    baseline.monthlyWaterM3 ? 'medium' : 'low',
    [baseline.monthlyWaterM3 ? `Provided ${water} m3/month` : `Default ~0.3 m3/student/month × ${students}`, 'Embodied energy of supply + treatment; coarse literature value'],
    baseline.monthlyWaterM3);

  cats.sort((a, b) => b.kgCO2ePerMonth - a.kgCO2ePerMonth);
  const totalKgPerMonth = round(cats.reduce((s, c) => s + c.kgCO2ePerMonth, 0));
  const providedCount = cats.filter(c => c.provided).length;
  return {
    students,
    totalKgPerMonth,
    overallConfidence: providedCount >= 4 ? 'medium' : 'low',
    isEstimate: true,
    disclaimer: providedCount === 0
      ? 'Coarse national-average estimate from student count only. Enter real utility bills, bus miles, and meals served to make this your school\'s actual footprint.'
      : `${providedCount}/6 categories use your real inputs; the rest are labeled estimates.`,
    biggestEmitter: cats[0] || null,
    categories: cats,
  };
}

/* Compare student action savings against the school's biggest hidden emitter, so the
 * coach can say "your recycling saved X; switching the cafeteria menu one day saves more". */
function actionLeverage(savedKgThisPeriod, footprint, period = 'week') {
  const saved = Math.max(0, round(Number(savedKgThisPeriod) || 0));
  const top = footprint && footprint.biggestEmitter;
  if (!top) return { saved, period, topEmitter: null, ratioPct: null, message: 'No school baseline yet — add one to compare action impact against the real footprint.' };
  const topPerPeriod = round(period === 'week' ? top.kgCO2ePerMonth / WEEKS_PER_MONTH : top.kgCO2ePerMonth);
  const ratioPct = topPerPeriod > 0 ? round((saved / topPerPeriod) * 100, 2) : 0;
  return {
    saved, period,
    topEmitter: { category: top.category, label: top.label, kgPerPeriod: topPerPeriod, confidence: top.confidence },
    ratioPct,
    message: `Logged actions this ${period} saved ~${saved} kg CO2e — about ${ratioPct}% of the school's estimated ${top.label.toLowerCase()} emissions (~${topPerPeriod} kg/${period}). The biggest lever is institutional, not individual.`,
  };
}

module.exports = { estimateFootprint, actionLeverage, FACTORS, CATEGORY_LABELS };
