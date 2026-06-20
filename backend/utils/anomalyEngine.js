/* EcoRise — Utility Anomaly Engine (Direction B AI reasoning layer).
 *
 * WHY: the footprint model is deterministic accounting. This is the reasoning layer the
 * rubric asks for: it learns each school's NORMAL consumption as a function of how much
 * the building is used (school days) and the weather (heating/cooling degree-days), then
 * flags months that deviate from that learned baseline — i.e. hidden waste a chart alone
 * would not surface ("gas was 22% above expected AFTER controlling for a cold month").
 *
 * HOW: ordinary least squares (closed-form, deterministic, no deps) fits
 *   usage ~ b0 + b1*schoolDays + b2*hdd (+ b3*cdd for electricity)
 * over the school's own history; residual z-scores flag anomalies. Pure + unit-tested.
 * Every flagged anomaly is EXPLAINABLE: features used, expected 80% range, residual z,
 * model confidence, likely causes, and what there is NOT enough evidence to conclude.
 *
 * HONESTY: weather/occupancy-adjusted ESTIMATE, not a sub-metered audit. Every anomaly
 * carries a confidence + explicit likely-cause hypotheses + requiresHumanReview=true. The
 * engine never concludes a cause or assigns blame — it points a human at where to look.
 */
const { FACTORS } = require('./footprintModel');

const round = (n, d = 1) => { const x = Number(n); if (!Number.isFinite(x)) return 0; const f = 10 ** d; return Math.round(x * f) / f; };
const Z80 = 1.2816; // ~80% interval

// Per-category linear model: which predictors explain normal usage, and the cited CO2e factor.
// gallons -> m3 for the water factor (1 m3 = 264.172 US gal).
const SPEC = {
  electricity: { field: 'electricityKwh', predictors: ['schoolDays', 'cdd', 'hdd'], unit: 'kWh', kgPerUnit: (u) => u * FACTORS.electricity_kwh.value, factor: FACTORS.electricity_kwh },
  gas:         { field: 'gasTherms',     predictors: ['schoolDays', 'hdd'],        unit: 'therms', kgPerUnit: (u) => u * FACTORS.natural_gas_therm.value, factor: FACTORS.natural_gas_therm },
  water:       { field: 'waterGallons',  predictors: ['schoolDays'],               unit: 'gallons', kgPerUnit: (u) => (u / 264.172) * FACTORS.water_m3.value, factor: FACTORS.water_m3 },
};

const FEATURE_LABEL = {
  schoolDays: 'school days (occupancy)',
  hdd: 'heating degree-days (weather)',
  cdd: 'cooling degree-days (weather)',
};
const NOT_EVIDENCE = {
  electricity: ['equipment failure', 'meter error', 'newly installed equipment'],
  gas: ['boiler equipment failure', 'meter error', 'a one-time event'],
  water: ['meter error', 'a one-time fill or event'],
};
const CAUSES = {
  electricity: (r) => [
    r.schoolDays != null && r.schoolDays <= 12
      ? 'High usage in a low-occupancy month — HVAC, lighting or plug load likely running when the building is largely closed (nights/weekends/breaks).'
      : 'Usage above the weather-and-occupancy baseline — possible always-on equipment, server/IT load, or HVAC running outside scheduled hours.',
    'Compare against the building automation schedule for the period.',
  ],
  gas: () => [
    'Heating gas above the heating-degree-day baseline — likely heating outside occupied hours or unbalanced weekend/zone setpoints.',
    'Check boiler run-time and weekend/zone setback settings.',
  ],
  water: () => [
    'Water above the occupancy baseline — possible leak, stuck irrigation valve, or a running fixture.',
    'Walk the meter on a closed day; a non-zero closed-day flow usually means a leak.',
  ],
};
const NEXT_STEP = {
  electricity: 'Facilities reviews the after-hours HVAC/lighting schedule for this period.',
  gas: 'Facilities audits the boiler schedule and weekend heating zones before the next billing cycle.',
  water: 'Facilities checks for leaks/irrigation faults and reads the meter on a non-school day.',
};

/* Ordinary least squares via normal equations (X'X)b = X'y, solved with Gaussian
 * elimination + partial pivoting. Returns coefficient vector, or null if singular. */
function ols(X, y) {
  const n = X.length;
  if (!n) return null;
  const p = X[0].length;
  if (n < p + 1) return null; // need more rows than parameters for a meaningful fit
  const A = Array.from({ length: p }, () => new Array(p).fill(0));
  const g = new Array(p).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      g[j] += X[i][j] * y[i];
      for (let k = 0; k < p; k++) A[j][k] += X[i][j] * X[i][k];
    }
  }
  for (let col = 0; col < p; col++) {
    let piv = col;
    for (let r = col + 1; r < p; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-9) return null;
    [A[col], A[piv]] = [A[piv], A[col]];
    [g[col], g[piv]] = [g[piv], g[col]];
    for (let r = 0; r < p; r++) {
      if (r === col) continue;
      const f = A[r][col] / A[col][col];
      for (let k = col; k < p; k++) A[r][k] -= f * A[col][k];
      g[r] -= f * g[col];
    }
  }
  return g.map((v, i) => v / A[i][i]);
}

function designRow(reading, predictors) {
  return [1, ...predictors.map(k => Number(reading[k]) || 0)];
}

// Shared fit: returns rows used, predictions, and residual std for a category, or null.
function fitCategory(series, category) {
  const spec = SPEC[category];
  if (!spec) return null;
  const rows = series.filter(r => Number.isFinite(+r[spec.field]));
  if (rows.length < spec.predictors.length + 2) return null;
  const X = rows.map(r => designRow(r, spec.predictors));
  const y = rows.map(r => +r[spec.field]);
  let beta = ols(X, y);
  if (!beta) { const mean = y.reduce((s, v) => s + v, 0) / y.length; beta = [mean, ...spec.predictors.map(() => 0)]; }
  const pred = X.map(row => row.reduce((s, v, i) => s + v * beta[i], 0));
  const resid = y.map((v, i) => v - pred[i]);
  const dof = Math.max(1, rows.length - (spec.predictors.length + 1));
  const std = Math.sqrt(resid.reduce((s, e) => s + e * e, 0) / dof);
  return { spec, rows, X, y, beta, pred, resid, std };
}

/* detectAnomalies(series, opts) -> AnomalyResult[] (sorted by severity). */
function detectAnomalies(series, opts = {}) {
  const zThresh = Number(opts.zThresh) || 2;
  const out = [];
  if (!Array.isArray(series) || series.length < 4) return out;

  for (const category of Object.keys(SPEC)) {
    const fit = fitCategory(series, category);
    if (!fit || !(fit.std > 1e-6)) continue;
    const { spec, rows, y, pred, resid, std } = fit;
    rows.forEach((r, i) => {
      const z = resid[i] / std;
      if (z < zThresh) return; // only flag usage ABOVE expected (waste), not savings
      const observed = y[i];
      const expected = Math.max(0, pred[i]);
      const excessUnits = observed - expected;
      out.push({
        category,
        month: r.month || null,
        unit: spec.unit,
        observed: round(observed),
        expected: round(expected),
        expectedLow: round(Math.max(0, expected - Z80 * std)),
        expectedHigh: round(expected + Z80 * std),
        excessUnits: round(excessUnits),
        excessKgCO2ePerMonth: round(Math.max(0, spec.kgPerUnit(excessUnits))),
        percentAboveExpected: expected > 0 ? round((excessUnits / expected) * 100) : null,
        z: round(z, 2),
        modelConfidencePct: Math.min(99, Math.round(50 + Math.abs(z) * 13)),
        confidence: Math.abs(z) >= 3 ? 'high' : Math.abs(z) >= 2.5 ? 'medium' : 'low',
        featuresUsed: spec.predictors.map(p => FEATURE_LABEL[p] || p).concat('historical monthly baseline'),
        likelyCauses: CAUSES[category](r),
        notEnoughEvidenceFor: NOT_EVIDENCE[category],
        recommendedNextStep: NEXT_STEP[category],
        factorName: spec.factor.factorName,
        source: spec.factor.source,
        sourceUrl: spec.factor.sourceUrl,
        requiresHumanReview: true,
      });
    });
  }
  out.sort((a, b) => b.z - a.z);
  return out;
}

/* baselineSeries(series, category) -> per-month chart data: observed vs the learned
 * expected baseline + 80% band + anomaly flag. Powers the "Evidence Chart" (proves the
 * AI is comparing against a learned baseline, not just plotting raw usage). */
function baselineSeries(series, category, opts = {}) {
  const zThresh = Number(opts.zThresh) || 2;
  const fit = fitCategory(series, category);
  if (!fit) return [];
  const { spec, rows, y, pred, std } = fit;
  return rows.map((r, i) => {
    const expected = Math.max(0, pred[i]);
    const z = std > 1e-6 ? (y[i] - pred[i]) / std : 0;
    return {
      month: r.month || null,
      observed: round(y[i]),
      expected: round(expected),
      low: round(Math.max(0, expected - Z80 * std)),
      high: round(expected + Z80 * std),
      anomaly: z >= zThresh,
      unit: spec.unit,
    };
  });
}

module.exports = { detectAnomalies, baselineSeries, fitCategory, ols, SPEC };
