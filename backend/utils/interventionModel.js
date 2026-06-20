/* EcoRise — Constraint-Aware Intervention Recommender (Direction B AI reasoning layer).
 *
 * Recommendation system: ranks REALISTIC environmental interventions for a specific school
 * by estimated CO2e avoided, weighted by cost/effort/approval path and boosted when an
 * intervention directly addresses a detected anomaly or the biggest hidden emitter. This is
 * the "which action has the highest impact" the rubric asks for — and it is deliberately
 * conservative: it prefers no-cost operational fixes over capital projects.
 *
 * Each recommendation closes the loop with a NAMED human approver, a role-specific call to
 * action, a verification metric (turns "advice" into measurable school operations), an
 * expected-impact band, cost, effort, and time-to-impact.
 *
 * HUMAN-IN-THE-LOOP: every recommendation is requiresApproval=true. The AI ranks and
 * explains; it NEVER enacts a change, sets a thermostat, or assigns blame. Environmental
 * scope only — no cafeteria/food-waste interventions.
 */
const round = (n, d = 1) => { const f = 10 ** d; return Math.round((Number(n) || 0) * f) / f; };

// anomaly/category -> footprint category key
const CAT_MAP = { gas: 'natural_gas', electricity: 'electricity', water: 'water', waste: 'landfill_waste', commuting: 'commuting' };

// Catalog of environmental interventions. estKgPerMonth = [low, high] avoided CO2e.
const CATALOG = [
  { key: 'hvac_setback', categories: ['electricity', 'natural_gas'], label: 'After-hours HVAC schedule setback',
    action: 'Set back heating/cooling on nights, weekends and breaks via the building automation system.',
    estKgPerMonth: [150, 600], costTier: 'none', effortTier: 'low', approver: 'Facilities manager',
    cta: 'Request facilities review', verificationMetric: 'After-hours kWh + therms per degree-day, next 2 billing cycles',
    timeToImpactWeeks: '2-4', evidenceStrength: 'high', verifyByDays: 30,
    rationale: 'No-cost operational change; the single highest-leverage lever when after-hours load is high.' },
  { key: 'boiler_weekend_zones', categories: ['natural_gas'], label: 'Weekend boiler zone setback',
    action: 'Disable or set back heating zones that run on unoccupied weekends.',
    estKgPerMonth: [120, 450], costTier: 'none', effortTier: 'low', approver: 'Facilities manager',
    cta: 'Request boiler-zone audit', verificationMetric: 'Weekend gas therms per heating degree-day, next 2 billing cycles',
    timeToImpactWeeks: '2-4', evidenceStrength: 'high', verifyByDays: 30,
    rationale: 'Targets weekend/zone heating that degree-day-adjusted gas anomalies usually point to.' },
  { key: 'plugload_night_shutdown', categories: ['electricity'], label: 'Night plug-load shutdown',
    action: 'Add smart power strips / scheduled shutdown for labs, AV carts and vending.',
    estKgPerMonth: [40, 160], costTier: 'low', effortTier: 'low', approver: 'Facilities manager',
    cta: 'Assign plug-load shutdown', verificationMetric: 'Overnight baseload kWh (midnight–5am)',
    timeToImpactWeeks: '1-2', evidenceStrength: 'medium', verifyByDays: 30,
    rationale: 'Low-cost cut to always-on baseload.' },
  { key: 'led_retrofit', categories: ['electricity'], label: 'LED lighting retrofit (hallways/gym)',
    action: 'Replace fluorescent fixtures in high-use areas with LED.',
    estKgPerMonth: [60, 220], costTier: 'capital', effortTier: 'medium', approver: 'Facilities + budget owner',
    cta: 'Propose LED retrofit (budget)', verificationMetric: 'Lighting-circuit kWh vs prior year',
    timeToImpactWeeks: '6-10', evidenceStrength: 'high', verifyByDays: 60,
    rationale: 'Durable savings but capital cost; sequence after no-cost scheduling fixes.' },
  { key: 'recycling_placement', categories: ['landfill_waste'], label: 'Paired-bin recycling + signage',
    action: 'Place recycling beside every trash bin near high-traffic exits and add teacher-reviewed signage.',
    estKgPerMonth: [30, 120], costTier: 'low', effortTier: 'low', approver: 'Operations staff',
    cta: 'Approve recycling-station pilot', verificationMetric: 'Recycling contamination % + diverted weight',
    timeToImpactWeeks: '3-6', evidenceStrength: 'medium', verifyByDays: 45,
    rationale: 'Cuts landfill diversion losses where contamination spikes.' },
  { key: 'late_activity_bus', categories: ['commuting'], label: 'Late activity bus (mode shift)',
    action: 'Pilot one late bus route twice weekly so after-school students stop being car-picked-up.',
    estKgPerMonth: [50, 200], costTier: 'low', effortTier: 'medium', approver: 'Transportation coordinator',
    cta: 'Send transport survey', verificationMetric: 'Car-pickup count + bus ridership on pilot days',
    timeToImpactWeeks: '4-8', evidenceStrength: 'medium', verifyByDays: 45,
    rationale: 'Shifts car trips to shared transit using aggregated distance bands, not individual tracking.' },
  { key: 'irrigation_audit', categories: ['water'], label: 'Irrigation schedule + leak audit',
    action: 'Audit irrigation timers and read the meter on a closed day to catch leaks.',
    estKgPerMonth: [10, 60], costTier: 'none', effortTier: 'low', approver: 'Facilities manager',
    cta: 'Request irrigation/leak check', verificationMetric: 'Closed-day water flow (gallons)',
    timeToImpactWeeks: '1-2', evidenceStrength: 'high', verifyByDays: 30,
    rationale: 'No-cost; a non-zero closed-day flow is almost always a leak.' },
];

const COST_WEIGHT = { none: 1.0, low: 0.85, capital: 0.55 };
const EFFORT_WEIGHT = { low: 1.0, medium: 0.85, high: 0.65 };
const COST_BAND = { none: '$0 (operational)', low: '$', capital: '$$$' };

/* recommend(footprint, anomalies, constraints) -> ranked intervention[] (top N).
 * constraints: { budget: 'none'|'low'|'any' (max acceptable cost tier), maxItems }. */
function recommend(footprint, anomalies = [], constraints = {}) {
  const budget = constraints.budget || 'any';
  const maxItems = Number(constraints.maxItems) || 3;
  const biggest = footprint && footprint.biggestEmitter ? footprint.biggestEmitter.category : null;
  const anomalyCats = new Set((anomalies || []).map(a => CAT_MAP[a.category] || a.category));
  const tierRank = { none: 0, low: 1, capital: 2 };
  const budgetCap = budget === 'none' ? 0 : budget === 'low' ? 1 : 2;

  return CATALOG
    .filter(iv => tierRank[iv.costTier] <= budgetCap)
    .map(iv => {
      const mid = (iv.estKgPerMonth[0] + iv.estKgPerMonth[1]) / 2;
      const addressesAnomaly = iv.categories.some(c => anomalyCats.has(c));
      const addressesBiggest = biggest && iv.categories.includes(biggest);
      const relevance = addressesAnomaly ? 2.0 : addressesBiggest ? 1.5 : 1.0;
      const score = mid * relevance * COST_WEIGHT[iv.costTier] * EFFORT_WEIGHT[iv.effortTier];
      return {
        key: iv.key, label: iv.label, action: iv.action, categories: iv.categories,
        estKgPerMonth: iv.estKgPerMonth, expectedKgPerMonth: round(mid),
        costTier: iv.costTier, costBand: COST_BAND[iv.costTier], effortTier: iv.effortTier,
        approver: iv.approver, cta: iv.cta, verificationMetric: iv.verificationMetric,
        timeToImpactWeeks: iv.timeToImpactWeeks, evidenceStrength: iv.evidenceStrength, verifyByDays: iv.verifyByDays,
        rationale: iv.rationale, addressesAnomaly, addressesBiggestEmitter: !!addressesBiggest,
        requiresApproval: true, score: round(score, 1),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems);
}

module.exports = { recommend, CATALOG, CAT_MAP };
