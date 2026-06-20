/* EcoRise — Usage Forecast Engine (Direction B AI reasoning layer).
 *
 * Predictive modelling: projects NEXT month's electricity/gas/water from the school's own
 * history using the same weather-and-occupancy OLS model the anomaly engine learns, given
 * the upcoming month's school days + forecast degree-days. Returns a central estimate plus
 * an 80% band (±1.28 residual std) so the number is never shown as false precision, and a
 * trend vs the trailing 12-month average. Pure + deterministic.
 *
 * HONESTY: a forecast is a projection under "schedules unchanged" assumptions, not a
 * guarantee; the band communicates uncertainty and confidence drops on short history.
 */
const { ols, SPEC } = require('./anomalyEngine');

const round = (n, d = 1) => { const x = Number(n); if (!Number.isFinite(x)) return 0; const f = 10 ** d; return Math.round(x * f) / f; };
const Z80 = 1.2816; // ~80% prediction interval

function designRow(reading, predictors) {
  return [1, ...predictors.map(k => Number(reading[k]) || 0)];
}

/* forecastNextMonth(series, upcoming) -> { category: {...} }
 * upcoming: { schoolDays, hdd, cdd } expected predictors for the month being forecast. */
function forecastNextMonth(series, upcoming = {}) {
  const result = {};
  if (!Array.isArray(series) || series.length < 4) return result;

  for (const [category, spec] of Object.entries(SPEC)) {
    const rows = series.filter(r => Number.isFinite(+r[spec.field]));
    if (rows.length < spec.predictors.length + 2) continue;
    const X = rows.map(r => designRow(r, spec.predictors));
    const y = rows.map(r => +r[spec.field]);
    let beta = ols(X, y);
    if (!beta) { const mean = y.reduce((s, v) => s + v, 0) / y.length; beta = [mean, ...spec.predictors.map(() => 0)]; }
    const pred = X.map(row => row.reduce((s, v, i) => s + v * beta[i], 0));
    const resid = y.map((v, i) => v - pred[i]);
    const dof = Math.max(1, rows.length - (spec.predictors.length + 1));
    const std = Math.sqrt(resid.reduce((s, e) => s + e * e, 0) / dof);

    const row = designRow(upcoming, spec.predictors);
    const point = Math.max(0, row.reduce((s, v, i) => s + v * beta[i], 0));
    const lo = Math.max(0, point - Z80 * std);
    const hi = point + Z80 * std;
    const trailing = y.slice(-12);
    const avg = trailing.reduce((s, v) => s + v, 0) / trailing.length;

    result[category] = {
      unit: spec.unit,
      predicted: round(point),
      low: round(lo),
      high: round(hi),
      predictedKgCO2e: round(spec.kgPerUnit(point)),
      lowKgCO2e: round(spec.kgPerUnit(lo)),
      highKgCO2e: round(spec.kgPerUnit(hi)),
      trendPctVsTrailingAvg: avg > 0 ? round(((point - avg) / avg) * 100) : null,
      confidence: rows.length >= 12 ? 'medium' : 'low',
      assumption: 'Projection assumes current schedules/operations are unchanged; band is an 80% interval from past variability.',
    };
  }
  return result;
}

module.exports = { forecastNextMonth };
