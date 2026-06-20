/* EcoRise — School Footprint Insights Engine
 *
 * Three AI reasoning capabilities:
 *   1. detectAnomalies  — rolling-14-day z-score on energy + water per building
 *   2. predictCafeteria — OLS linear regression (day-of-week dummies + post_holiday)
 *   3. rankRecommendations — rank top 3 actions by estimated impact from this week's data
 */

const { estimateTransport } = require('./carbonEngine');

// EPA eGRID 2023 US average: 0.386 kg CO2e/kWh (grid electricity, source: EPA eGRID)
const KG_CO2E_PER_KWH = 0.386;
// EPA WARM: food scraps to landfill avoided ~0.43 kg CO2e/lb (source: EPA WARM model)
const KG_CO2E_PER_LB_FOOD_WASTE = 0.43;
// School year operational days
const SCHOOL_DAYS_PER_YEAR = 180;

// ── 1. Minimal OLS solver (normal equations via Gaussian elimination) ──
// X: row-major Float64 array of shape [n, p]; y: length-n array; returns β: length-p array.
function solveOLS(X, y, p) {
  const n = y.length;
  const XtX = new Array(p * p).fill(0);
  const Xty = new Array(p).fill(0);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < p; j++) {
      Xty[j] += X[i * p + j] * y[i];
      for (let k = 0; k < p; k++) {
        XtX[j * p + k] += X[i * p + j] * X[i * p + k];
      }
    }
  }

  // Augmented matrix [XtX | Xty], solved by Gaussian elimination with partial pivoting.
  const aug = [];
  for (let i = 0; i < p; i++) {
    aug.push([...XtX.slice(i * p, (i + 1) * p), Xty[i]]);
  }
  for (let col = 0; col < p; col++) {
    let maxRow = col;
    for (let row = col + 1; row < p; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];
    if (Math.abs(aug[col][col]) < 1e-12) continue;
    for (let row = col + 1; row < p; row++) {
      const f = aug[row][col] / aug[col][col];
      for (let k = col; k <= p; k++) aug[row][k] -= f * aug[col][k];
    }
  }
  const beta = new Array(p).fill(0);
  for (let i = p - 1; i >= 0; i--) {
    beta[i] = aug[i][p];
    for (let j = i + 1; j < p; j++) beta[i] -= aug[i][j] * beta[j];
    beta[i] /= aug[i][i] || 1;
  }
  return beta;
}

const DOW_NAMES = { 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday' };

// ── 2. Anomaly detection ──
// Returns anomaly objects for energy and water rows that exceed
// rolling-14-day mean + 1.5 * std (only includes anomalies in last 21 days).
function detectAnomalies(db) {
  const anomalies = [];
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 21);
  const recentCutoff = cutoff.toISOString().slice(0, 10);

  function scanMetric(rows, metric, unit) {
    // Group by building
    const byBuilding = {};
    for (const row of rows) {
      const key = row.building;
      if (!byBuilding[key]) byBuilding[key] = [];
      byBuilding[key].push({ date: row.date, value: row[metric] });
    }
    for (const [building, pts] of Object.entries(byBuilding)) {
      pts.sort((a, b) => a.date.localeCompare(b.date));
      for (let i = 14; i < pts.length; i++) {
        const window = pts.slice(i - 14, i).map(p => p.value);
        const mean = window.reduce((s, v) => s + v, 0) / window.length;
        const variance = window.reduce((s, v) => s + (v - mean) ** 2, 0) / window.length;
        const std = Math.sqrt(variance);
        const cur = pts[i];
        if (std < 1 || cur.date < recentCutoff) continue;
        const sigmas = (cur.value - mean) / std;
        if (sigmas >= 1.5) {
          anomalies.push({
            type: metric === 'kwh' ? 'energy' : 'water',
            building,
            date: cur.date,
            value: Math.round(cur.value),
            mean: Math.round(mean),
            std: Math.round(std),
            sigmas: parseFloat(sigmas.toFixed(2)),
            pctAbove: Math.round(((cur.value - mean) / mean) * 100),
            unit,
          });
        }
      }
    }
  }

  const energyRows = db.prepare('SELECT date, building, kwh FROM fp_energy ORDER BY date').all();
  const waterRows  = db.prepare('SELECT date, building, gallons FROM fp_water ORDER BY date').all();
  scanMetric(energyRows, 'kwh', 'kWh');
  scanMetric(waterRows, 'gallons', 'gal');

  return anomalies
    .sort((a, b) => b.sigmas - a.sigmas)
    .slice(0, 6);
}

// ── 3. Cafeteria food-waste prediction ──
// Model: y = β₀ + β₁·isTue + β₂·isWed + β₃·isThu + β₄·isFri + β₅·post_holiday
// Monday is the reference category (intercept).
// Returns predictions for the next 5 school days (Mon-Fri of next week).
function predictCafeteria(db) {
  const rows = db.prepare(
    'SELECT day_of_week, meals_served, food_waste_lbs, post_holiday FROM fp_cafeteria ORDER BY date'
  ).all();

  if (rows.length < 10) return { predictions: [], model: null };

  const p = 6;
  const X = [];
  const y = [];

  for (const r of rows) {
    const dow = r.day_of_week;
    // Features: [intercept, isTue, isWed, isThu, isFri, post_holiday]
    X.push(
      1,
      dow === 2 ? 1 : 0,
      dow === 3 ? 1 : 0,
      dow === 4 ? 1 : 0,
      dow === 5 ? 1 : 0,
      r.post_holiday
    );
    // Predict raw lbs (not per-meal, since meals_served is ~constant)
    y.push(r.food_waste_lbs);
  }

  const beta = solveOLS(X, y, p);

  // Compute in-sample RMSE for confidence band
  const n = y.length;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const xi = X.slice(i * p, (i + 1) * p);
    const pred = beta.reduce((s, b, j) => s + b * xi[j], 0);
    sse += (y[i] - pred) ** 2;
  }
  const rmse = Math.sqrt(sse / n);
  const avgWaste = y.reduce((s, v) => s + v, 0) / n;
  const confidencePct = Math.round((rmse / avgWaste) * 100);

  // Next week = find next Monday from today
  const today = new Date('2026-06-19');
  // Advance to next Monday
  const daysUntilMon = (8 - today.getDay()) % 7 || 7;
  const nextMon = new Date(today);
  nextMon.setDate(today.getDate() + daysUntilMon);

  const predictions = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(nextMon);
    d.setDate(nextMon.getDate() + i);
    const dow = d.getDay(); // 1=Mon … 5=Fri
    const xi = [
      1,
      dow === 2 ? 1 : 0,
      dow === 3 ? 1 : 0,
      dow === 4 ? 1 : 0,
      dow === 5 ? 1 : 0,
      0, // assume no post-holiday next week
    ];
    const predicted = beta.reduce((s, b, j) => s + b * xi[j], 0);
    predictions.push({
      date: d.toISOString().slice(0, 10),
      dayName: DOW_NAMES[dow] || `Day ${dow}`,
      predictedLbs: Math.max(0, Math.round(predicted * 10) / 10),
      lowerLbs: Math.max(0, Math.round((predicted - rmse) * 10) / 10),
      upperLbs: Math.round((predicted + rmse) * 10) / 10,
    });
  }

  return {
    predictions,
    model: {
      beta: beta.map(b => parseFloat(b.toFixed(3))),
      rmse: parseFloat(rmse.toFixed(2)),
      confidencePct,
      trainingRows: n,
      features: ['intercept', 'is_Tuesday', 'is_Wednesday', 'is_Thursday', 'is_Friday', 'post_holiday'],
    },
  };
}

// ── 4. Recommendation ranking ──
// Produces up to 3 action recommendations ranked by estimated impact.
// Every recommendation includes a one-sentence reasoning string.
function rankRecommendations(db, anomalies, cafeteria) {
  const candidates = [];

  // Rec A — cafeteria: reduce over-prep on highest-waste predicted day
  const { predictions = [] } = cafeteria;
  const highDay = [...predictions].sort((a, b) => b.predictedLbs - a.predictedLbs)[0];
  if (highDay) {
    const cut = Math.round(highDay.predictedLbs * 0.12);
    const cafCO2 = Math.round(cut * KG_CO2E_PER_LB_FOOD_WASTE * SCHOOL_DAYS_PER_YEAR);
    candidates.push({
      category: 'cafeteria',
      title: `Reduce ${highDay.dayName} lunch prep by 12%`,
      reasoning: `Model predicts ${highDay.predictedLbs} lbs of waste on ${highDay.dayName} — a 12% prep reduction is estimated to cut ${cut} lbs based on the day-of-week overcooking pattern learned from ${cafeteria.model?.trainingRows ?? '?'} days of cafeteria records.`,
      estimated_impact: `−${cut} lbs food waste/day · −${cafCO2} kg CO₂e/yr (EPA WARM)`,
      kgCO2ePerYear: cafCO2,
      impactScore: cut,
    });
  }

  // Rec B — energy: audit the building with the largest recent anomaly
  const energyAnomaly = anomalies.find(a => a.type === 'energy');
  if (energyAnomaly) {
    const excess = energyAnomaly.value - energyAnomaly.mean;
    const dollars = Math.round(excess * 0.13);
    const energyCO2 = Math.round(excess * KG_CO2E_PER_KWH * SCHOOL_DAYS_PER_YEAR);
    candidates.push({
      category: 'energy',
      title: `Audit ${energyAnomaly.building} HVAC schedule this week`,
      reasoning: `${energyAnomaly.building} used ${energyAnomaly.pctAbove}% more electricity than its 14-day rolling average on ${energyAnomaly.date} (${energyAnomaly.sigmas}σ above normal) — likely a mis-scheduled thermostat or equipment left running, worth ~$${dollars} if resolved.`,
      estimated_impact: `−${Math.round(excess)} kWh/day (~$${dollars}) · −${energyCO2} kg CO₂e/yr (EPA eGRID)`,
      kgCO2ePerYear: energyCO2,
      impactScore: excess * 0.5,
    });
  }

  // Rec C — transportation: carpool initiative based on this week's car counts
  const lastWeek = db.prepare(
    'SELECT car_riders, total_students FROM fp_transportation ORDER BY date DESC LIMIT 5'
  ).all();
  if (lastWeek.length > 0) {
    const avgCar = Math.round(lastWeek.reduce((s, r) => s + r.car_riders, 0) / lastWeek.length);
    if (avgCar > 200) {
      const convertible = Math.round(avgCar * 0.10);
      const perTripKg = estimateTransport({ distanceMiles: 8, replacedMode: 'car' }).kgCO2e;
      const co2cut = Math.round(convertible * perTripKg);
      const transCO2Year = Math.round(co2cut * SCHOOL_DAYS_PER_YEAR);
      candidates.push({
        category: 'transportation',
        title: 'Launch a Carpool Monday challenge this week',
        reasoning: `An average of ${avgCar} students arrived by single-occupancy car last week — converting 10% to carpools would eliminate ~${convertible} solo car trips daily and cut an estimated ${co2cut} kg CO₂e per school day (EPA GHG Factors Hub, 8-mile commute × 0.4 kg CO₂e/mile).`,
        estimated_impact: `−${co2cut} kg CO₂e/day · −${transCO2Year} kg CO₂e/yr (EPA)`,
        kgCO2ePerYear: transCO2Year,
        impactScore: co2cut,
      });
    }
  }

  // Rec D — water: flag anomalous water building
  const waterAnomaly = anomalies.find(a => a.type === 'water');
  if (waterAnomaly) {
    candidates.push({
      category: 'water',
      title: `Inspect ${waterAnomaly.building} for leaks or scheduling errors`,
      reasoning: `${waterAnomaly.building} used ${waterAnomaly.pctAbove}% more water than its 14-day average on ${waterAnomaly.date} — a single stuck valve or overnight irrigation mis-schedule is the most common cause at this deviation level (${waterAnomaly.sigmas}σ).`,
      estimated_impact: `~${Math.round((waterAnomaly.value - waterAnomaly.mean))} gal/day saved if resolved`,
      kgCO2ePerYear: 0,
      impactScore: (waterAnomaly.value - waterAnomaly.mean) * 0.01,
    });
  }

  // Return top 3 by impact score
  return candidates
    .sort((a, b) => b.impactScore - a.impactScore)
    .slice(0, 3)
    .map(({ impactScore: _dropped, kgCO2ePerYear = 0, ...rest }) => ({ ...rest, kgCO2ePerYear }));
}

// ── 5. Current-week summary stats for raw data chart ──
function weeklyStats(db) {
  const rows = db.prepare(`
    SELECT e.date,
           SUM(e.kwh) AS total_kwh,
           (SELECT SUM(w2.gallons) FROM fp_water w2 WHERE w2.date = e.date) AS total_gallons,
           (SELECT t.food_waste_lbs FROM fp_cafeteria t WHERE t.date = e.date) AS waste_lbs,
           (SELECT tr.car_riders FROM fp_transportation tr WHERE tr.date = e.date) AS car_riders
    FROM fp_energy e
    GROUP BY e.date
    ORDER BY e.date DESC
    LIMIT 10
  `).all();
  return rows.reverse();
}

module.exports = { detectAnomalies, predictCafeteria, rankRecommendations, weeklyStats };
