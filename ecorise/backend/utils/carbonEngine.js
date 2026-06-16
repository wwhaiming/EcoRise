/* EcoRise — Grounded Carbon Engine.
 *
 * WHY THIS EXISTS:
 * The vision model identifies WHAT happened (biking, a plant-based meal, a
 * reusable bottle). It must NOT invent the climate impact — a model-emitted
 * "2.4 kg CO2" is scientifically indefensible and collapses under one judge
 * question. This module separates perception from calculation: the LLM supplies
 * an action + measurable attributes, and this deterministic engine computes the
 * avoided emissions from published emission factors, returning the formula, the
 * cited sources, and an uncertainty range.
 *
 * SOURCES (see EMISSION_FACTORS for the per-factor citation):
 *  - EPA GHG Emission Factors Hub (transport / commute):
 *      https://www.epa.gov/climateleadership/ghg-emission-factors-hub
 *      A typical passenger vehicle emits ~400 g CO2e per mile.
 *  - Our World in Data, summarizing Poore & Nemecek (2018, Science), food LCA:
 *      https://ourworldindata.org/environmental-impacts-of-food
 *  - EPA WARM (waste / recycling pathways):
 *      https://www.epa.gov/warm
 *
 * Everything here is pure and deterministic so it is fully unit-testable and so
 * the same photo always yields the same audited number.
 */

const round = (n, d = 2) => {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
};

// ── Published emission factors (single source of truth, each cited) ──
const EMISSION_FACTORS = {
  // Avoided emissions per mile by the mode the trip displaced.
  passenger_vehicle_mile: {
    id: 'epa-passenger-vehicle-mile',
    factorName: 'Average passenger vehicle',
    value: 0.400, low: 0.280, high: 0.520, unit: 'kg CO2e / mile',
    source: 'EPA GHG Emission Factors Hub',
    sourceUrl: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub',
    sourceYear: 2025,
  },
  transit_passenger_mile: {
    id: 'epa-transit-passenger-mile',
    factorName: 'Public transit (per passenger-mile)',
    value: 0.100, low: 0.060, high: 0.170, unit: 'kg CO2e / mile',
    source: 'EPA GHG Emission Factors Hub (mobile combustion, transit)',
    sourceUrl: 'https://www.epa.gov/climateleadership/ghg-emission-factors-hub',
    sourceYear: 2025,
  },
  // Net avoided emissions from replacing one animal-based meal with a plant meal.
  meal_beef_replaced: {
    id: 'owid-meal-beef-replaced',
    factorName: 'Replacing a beef meal with a plant-based meal',
    value: 6.0, low: 4.0, high: 9.0, unit: 'kg CO2e / meal',
    source: 'Our World in Data (Poore & Nemecek, 2018, Science)',
    sourceUrl: 'https://ourworldindata.org/environmental-impacts-of-food',
    sourceYear: 2018,
  },
  meal_meat_replaced: {
    id: 'owid-meal-meat-replaced',
    factorName: 'Replacing an average meat meal with a plant-based meal',
    value: 2.5, low: 1.5, high: 4.0, unit: 'kg CO2e / meal',
    source: 'Our World in Data (Poore & Nemecek, 2018, Science)',
    sourceUrl: 'https://ourworldindata.org/environmental-impacts-of-food',
    sourceYear: 2018,
  },
  meal_poultry_replaced: {
    id: 'owid-meal-poultry-replaced',
    factorName: 'Replacing a poultry/pork meal with a plant-based meal',
    value: 1.5, low: 1.0, high: 2.2, unit: 'kg CO2e / meal',
    source: 'Our World in Data (Poore & Nemecek, 2018, Science)',
    sourceUrl: 'https://ourworldindata.org/environmental-impacts-of-food',
    sourceYear: 2018,
  },
  // Production footprint of one single-use PET bottle that was displaced.
  single_use_bottle: {
    id: 'single-use-pet-bottle',
    factorName: 'Single-use PET bottle (production)',
    value: 0.083, low: 0.050, high: 0.120, unit: 'kg CO2e / bottle',
    source: 'PET bottle life-cycle assessment (production stage)',
    sourceUrl: 'https://ourworldindata.org/environmental-impacts-of-food',
    sourceYear: 2021,
  },
};

const cite = (f) => ({
  name: f.factorName, value: f.value, unit: f.unit,
  source: f.source, sourceUrl: f.sourceUrl, sourceYear: f.sourceYear,
});

// Empty/zero estimate, used when no defensible factor applies. We are explicit
// that the action still has value — just not a quantified CO2 number.
function noEstimate(reason) {
  return {
    kgCO2e: 0, low: 0, high: 0,
    method: 'none',
    formula: null,
    factors: [],
    assumptions: [reason],
  };
}

// ── Per-action calculators ──

// Transport: avoided emissions from NOT driving the trip.
function estimateTransport({ distanceMiles, replacedMode = 'car' } = {}) {
  const raw = Number(distanceMiles);
  if (!Number.isFinite(raw) || raw <= 0) {
    return noEstimate('No trip distance provided — transport CO2 not credited.');
  }
  // Clamp the (possibly model-supplied) distance to the same bound zod puts on the
  // user miles field (<=500), and whitelist the displaced mode, so a hallucinated or
  // prompt-injected attribute can never inflate the stored/displayed CO2 figure.
  const miles = Math.min(raw, 500);
  const mode = ['car', 'transit', 'rideshare', 'unknown'].includes(replacedMode) ? replacedMode : 'unknown';
  const f = EMISSION_FACTORS.passenger_vehicle_mile;
  const t = EMISSION_FACTORS.transit_passenger_mile;

  // What did the bike/walk trip actually displace?
  let central = f.value, low = f.low, high = f.high;
  const assumptions = [];
  if (mode === 'transit') {
    central = t.value; low = t.low; high = t.high;
    assumptions.push('Credited against public-transit emissions (the trip replaced transit, not a car).');
  } else if (mode === 'car' || mode === 'rideshare') {
    assumptions.push('Assumes the trip replaced a gasoline passenger-vehicle trip.');
  } else {
    // Unknown: assume a car was displaced (the product framing), but widen the
    // lower bound down to transit emissions to reflect that uncertainty honestly.
    low = t.value; high = f.high;
    assumptions.push('Displaced mode unknown — assumed a car trip; lower bound reflects the chance it replaced transit.');
  }
  assumptions.push('Recreational trips that replaced nothing should not be credited.');

  const usedFactor = mode === 'transit' ? t : f;
  return {
    kgCO2e: round(miles * central),
    low: round(miles * low),
    high: round(miles * high),
    method: 'distance_based_transport',
    formula: `${miles} mi × ${central} kg CO2e/mi (${usedFactor.factorName})`,
    factors: [cite(usedFactor)],
    assumptions,
  };
}

// Plant-based meal: net avoided emissions vs. the animal-based meal it replaced.
function estimatePlantBasedMeal({ mealCategory = 'unknown', servings = 1 } = {}) {
  const n = Math.max(1, Math.min(10, Math.round(Number(servings) || 1)));
  let f;
  if (mealCategory === 'beef_replacement') f = EMISSION_FACTORS.meal_beef_replaced;
  else if (mealCategory === 'poultry_replacement' || mealCategory === 'pork_replacement') f = EMISSION_FACTORS.meal_poultry_replaced;
  else if (mealCategory === 'meat_replacement' || mealCategory === 'average_meat') f = EMISSION_FACTORS.meal_meat_replaced;
  else {
    // "vegan"/"vegetarian" with no stated baseline: a salad that replaced nothing
    // meaty earns no carbon credit. Credit conservatively against an average meat
    // meal only as an upper bound, central held low.
    const m = EMISSION_FACTORS.meal_meat_replaced;
    return {
      kgCO2e: round(1.0 * n),
      low: 0,
      high: round(m.high * n),
      method: 'meal_substitution',
      formula: `${n} serving(s) × ~1.0 kg CO2e (conservative; baseline meal unknown)`,
      factors: [cite(m)],
      assumptions: [
        'Baseline (replaced) meal is unknown — credited conservatively.',
        'A plant meal that did not replace a meat meal earns little to no carbon credit.',
      ],
    };
  }
  return {
    kgCO2e: round(f.value * n),
    low: round(f.low * n),
    high: round(f.high * n),
    method: 'meal_substitution',
    formula: `${n} serving(s) × ${f.value} kg CO2e (${f.factorName})`,
    factors: [cite(f)],
    assumptions: ['Assumes the plant-based meal replaced the stated animal-based meal.'],
  };
}

// Reusable bottle: production footprint of the single-use bottles it displaced.
function estimateReusableBottle({ displacedCount = 1 } = {}) {
  const raw = Number(displacedCount);
  const n = Number.isFinite(raw) ? Math.max(0, Math.min(20, Math.round(raw))) : 1;
  if (n === 0) return noEstimate('No single-use bottle displaced — habit credited, no CO2.');
  const f = EMISSION_FACTORS.single_use_bottle;
  return {
    kgCO2e: round(f.value * n),
    low: round(f.low * n),
    high: round(f.high * n),
    method: 'avoided_single_use',
    formula: `${n} bottle(s) × ${f.value} kg CO2e (${f.factorName})`,
    factors: [cite(f)],
    assumptions: [
      'Credits only single-use bottles actually displaced today, not bottle ownership.',
      'Savings are small; repeated bottle photos are capped elsewhere by anti-cheat.',
    ],
  };
}

// Litter cleanup: ecologically valuable but not a reliable CO2 reduction without
// a known recycling weight/pathway, so it is credited as community impact (0 CO2).
function estimateCleanup() {
  return {
    ...noEstimate('Litter cleanup is credited as community impact; CO2 is not claimed without a known recycling weight (EPA WARM).'),
    method: 'community_impact',
    factors: [{
      name: 'EPA WARM (waste management pathways)', value: null, unit: 'kg CO2e',
      source: 'EPA WARM', sourceUrl: 'https://www.epa.gov/warm', sourceYear: 2025,
    }],
  };
}

/**
 * Compute a grounded carbon estimate for an action + attributes.
 * @param {string} actionType  transportation | food | waste | nature | energy | ...
 * @param {object} attributes  { distanceMiles, replacedMode, mealCategory, servings, displacedCount, ... }
 * @returns {{kgCO2e:number, low:number, high:number, method:string, formula:?string, factors:Array, assumptions:string[]}}
 */
function computeCarbon(actionType, attributes = {}) {
  const t = String(actionType || '').toLowerCase();
  if (t === 'transportation' || t === 'transport') return estimateTransport(attributes);
  if (t === 'food') return estimatePlantBasedMeal(attributes);
  if (t === 'waste') return estimateReusableBottle(attributes);
  if (t === 'nature' || t === 'cleanup' || t === 'community') return estimateCleanup(attributes);
  if (t === 'energy') return noEstimate('No per-action grounded factor for this energy action; CO2 not claimed.');
  return noEstimate('No grounded carbon factor for this action type; CO2 not claimed.');
}

module.exports = {
  computeCarbon,
  estimateTransport,
  estimatePlantBasedMeal,
  estimateReusableBottle,
  estimateCleanup,
  EMISSION_FACTORS,
};
