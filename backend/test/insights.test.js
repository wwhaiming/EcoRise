/* EcoRise — Direction B AI reasoning layer test suite.
 * Tests: OLS math, anomaly detection, forecast, recommendations, and all /insights HTTP routes.
 * Hermetic: no API key required; runs offline against a temp SQLite DB. */

process.env.JWT_SECRET = process.env.JWT_SECRET || ('insights-test-secret-' + 'x'.repeat(24));
process.env.COACH_ENABLED = 'true';
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = '';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const DB = path.join(__dirname, 'insights-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../middleware/auth');
const { ols, detectAnomalies, baselineSeries } = require('../utils/anomalyEngine');
const { forecastNextMonth } = require('../utils/forecastEngine');
const { recommend } = require('../utils/interventionModel');
const { estimateFootprint } = require('../utils/footprintModel');
const LINCOLN = require('../data/lincolnHigh');

test.after(() => {
  for (const f of [DB, DB + '-shm', DB + '-wal']) {
    try { fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {}
  }
});

const auth = (t) => ['Authorization', `Bearer ${t}`];
let seq = 0;
async function signup(name) {
  const email = `ins${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'pass1234', name });
  assert.equal(r.status, 200, 'signup: ' + JSON.stringify(r.body));
  return { id: r.body.user.id, token: signToken(r.body.user.id) };
}
async function makeBoard(u, name) {
  const r = await request(app).post('/api/leaderboards').set(...auth(u.token)).send({ name });
  assert.equal(r.status, 200, 'makeBoard: ' + JSON.stringify(r.body));
  return r.body.id;
}
async function loadDemo(u, lbId) {
  const r = await request(app).post('/api/coach/insights/load-demo')
    .set(...auth(u.token)).send({ leaderboardId: lbId });
  assert.equal(r.status, 200, 'load-demo: ' + JSON.stringify(r.body));
  return r.body;
}

// ── Unit tests ─────────────────────────────────────────────────────────────────

test('ols recovers linear coefficients', () => {
  // y = 5 + 2*x1 + 3*x2; 7 design rows [1, x1, x2]
  const pairs = [
    [1, 2], [3, 4], [5, 0], [0, 7], [2, 3], [4, 1], [6, 2],
  ];
  const X = pairs.map(([x1, x2]) => [1, x1, x2]);
  const y = pairs.map(([x1, x2]) => 5 + 2 * x1 + 3 * x2);
  const b = ols(X, y);
  assert.ok(b, 'ols returns coefficients');
  const r = (v) => Math.round(v * 100) / 100;
  assert.equal(r(b[0]), 5.00, 'intercept ≈ 5');
  assert.equal(r(b[1]), 2.00, 'β1 ≈ 2');
  assert.equal(r(b[2]), 3.00, 'β2 ≈ 3');
});

test('detectAnomalies flags planted gas spike', () => {
  const anomalies = detectAnomalies(LINCOLN.series, { zThresh: 2 });
  assert.ok(anomalies.length >= 1, 'at least one anomaly');
  const spike = anomalies.find(a => a.category === 'gas' && a.month === '2026-01');
  assert.ok(spike, 'gas spike in 2026-01 found');
  assert.ok(spike.percentAboveExpected > 5, `percentAboveExpected ${spike.percentAboveExpected} > 5`);
  assert.equal(spike.requiresHumanReview, true);
  assert.ok(spike.excessKgCO2ePerMonth > 0, 'excessKgCO2e > 0');
  assert.ok(spike.source, 'source citation present');
  assert.ok(
    spike.likelyCauses.some(c => /boiler|weekend|heating/i.test(c)),
    'likelyCauses mentions boiler/weekend/heating: ' + JSON.stringify(spike.likelyCauses),
  );
});

test('detectAnomalies clean data returns nothing', () => {
  // Perfect on-model gas series → std ≈ 0 → no anomalies
  const clean = Array.from({ length: 8 }, (_, i) => {
    const schoolDays = 15 + i;
    const hdd = 80 + i * 40;
    return { month: `2025-0${i + 1}`, schoolDays, hdd, cdd: 0, gasTherms: 50 + 4 * schoolDays + 1.1 * hdd };
  });
  const none = detectAnomalies(clean, { zThresh: 2 });
  assert.equal(none.length, 0, 'no anomalies in perfectly-modeled series');

  // 50% of predicted in one month → below expected → must NOT be flagged (savings ≠ waste)
  const withSaving = clean.map((r, i) =>
    i === 4 ? { ...r, gasTherms: r.gasTherms * 0.5 } : r
  );
  const savingFlagged = detectAnomalies(withSaving, { zThresh: 2 });
  assert.equal(savingFlagged.length, 0, 'below-expected month not flagged as anomaly');
});

test('forecastNextMonth valid 80% band', () => {
  const fc = forecastNextMonth(LINCOLN.series, LINCOLN.upcoming);
  for (const cat of ['gas', 'electricity', 'water']) {
    const f = fc[cat];
    assert.ok(f, `forecast exists for ${cat}`);
    assert.ok(f.low >= 0, `${cat} low >= 0`);
    assert.ok(f.low <= f.predicted, `${cat} low <= predicted`);
    assert.ok(f.predicted <= f.high, `${cat} predicted <= high`);
    assert.ok(f.predictedKgCO2e >= 0, `${cat} predictedKgCO2e >= 0`);
    assert.ok(f.unit, `${cat} has unit`);
  }
});

test('recommend ranks and requires approval', () => {
  const anomalies = detectAnomalies(LINCOLN.series, { zThresh: 2 });
  const footprint = estimateFootprint(LINCOLN.baseline);
  const recs = recommend(footprint, anomalies, { maxItems: 3, budget: 'any' });
  assert.equal(recs.length, 3);
  for (const r of recs) {
    assert.equal(r.requiresApproval, true, `${r.key} requiresApproval`);
    assert.ok(r.approver, `${r.key} has approver`);
  }
  assert.ok(
    recs[0].key === 'hvac_setback' || recs[0].key === 'boiler_weekend_zones',
    `top rec is hvac_setback or boiler_weekend_zones, got ${recs[0].key}`,
  );
  for (const r of recs) {
    const fields = [r.key, r.label, r.action, ...r.categories].join(' ');
    assert.ok(!/food|cafeteria|meal/i.test(fields), `${r.key} has no food/cafeteria/meal strings`);
  }
});

test('recommend budget=none excludes capital projects', () => {
  const recs = recommend(null, [], { budget: 'none', maxItems: 10 });
  assert.ok(recs.length >= 1, 'at least one zero-cost rec');
  for (const r of recs) {
    assert.equal(r.costTier, 'none', `${r.key} costTier is none`);
  }
  assert.ok(!recs.find(r => r.key === 'led_retrofit'), 'led_retrofit excluded (capital)');
});

test('anomaly explainability', () => {
  const anomalies = detectAnomalies(LINCOLN.series, { zThresh: 2 });
  assert.ok(anomalies.length >= 1, 'at least one anomaly for explainability check');
  const a = anomalies[0];
  assert.ok(a.featuresUsed.length >= 2, 'featuresUsed has >= 2 entries');
  assert.ok(a.expectedLow <= a.expected, 'expectedLow <= expected');
  assert.ok(a.expected <= a.expectedHigh, 'expected <= expectedHigh');
  assert.ok(a.modelConfidencePct >= 50 && a.modelConfidencePct <= 99, `modelConfidencePct ${a.modelConfidencePct} in [50,99]`);
  assert.ok(a.notEnoughEvidenceFor.length >= 1, 'notEnoughEvidenceFor non-empty');
});

test('baselineSeries — flagged month observed > high', () => {
  const bs = baselineSeries(LINCOLN.series, 'gas', { zThresh: 2 });
  assert.ok(bs.length >= 12, `baselineSeries length ${bs.length} >= 12`);
  const flagged = bs.filter(pt => pt.anomaly);
  assert.ok(flagged.length >= 1, 'at least one flagged point');
  for (const pt of flagged) {
    assert.ok(pt.observed > pt.high, `flagged month ${pt.month}: observed ${pt.observed} > high ${pt.high}`);
  }
});

test('recommendations carry CTA fields', () => {
  const anomalies = detectAnomalies(LINCOLN.series, { zThresh: 2 });
  const footprint = estimateFootprint(LINCOLN.baseline);
  const recs = recommend(footprint, anomalies, { maxItems: 5, budget: 'any' });
  for (const r of recs) {
    assert.ok(r.cta, `${r.key} has cta`);
    assert.ok(r.verificationMetric, `${r.key} has verificationMetric`);
    assert.ok(r.timeToImpactWeeks, `${r.key} has timeToImpactWeeks`);
    assert.ok(r.costBand, `${r.key} has costBand`);
  }
});

// ── HTTP tests ────────────────────────────────────────────────────────────────

test('GET /insights returns Lincoln sample', async () => {
  const u = await signup('SampleViewer');
  const r = await request(app).get('/api/coach/insights').set(...auth(u.token));
  assert.equal(r.status, 200);
  assert.equal(r.body.sampleData, true);
  assert.equal(r.body.school, 'Lincoln High School');
  assert.ok(r.body.anomalies.length >= 1, 'has anomalies');
  assert.ok(r.body.recommendations.length >= 1, 'has recommendations');
  assert.ok(typeof r.body.summary === 'string' && r.body.summary.length > 0, 'summary non-empty');
  assert.ok(
    /never changes building settings|approve/i.test(r.body.humanInLoop),
    'humanInLoop mentions never changes settings or approve',
  );
});

test('load-demo + approve lifecycle', async () => {
  const u = await signup('OrgApprove');
  const lbId = await makeBoard(u, 'Approve Board');
  await loadDemo(u, lbId);

  // Data now on board → sampleData false
  const g1 = await request(app).get('/api/coach/insights').query({ leaderboardId: lbId }).set(...auth(u.token));
  assert.equal(g1.status, 200);
  assert.equal(g1.body.sampleData, false);

  const firstKey = g1.body.recommendations[0].key;

  // Approve first recommendation
  const ap = await request(app).post('/api/coach/insights/approve')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey: firstKey });
  assert.equal(ap.status, 200, 'approve: ' + JSON.stringify(ap.body));
  assert.equal(ap.body.status, 'approved');
  assert.ok(ap.body.verifyBy, 'verifyBy present');
  assert.ok(ap.body.expectedKgPerMonth >= 0, 'expectedKgPerMonth >= 0');

  // Re-GET: rec status should be 'approved'
  const g2 = await request(app).get('/api/coach/insights').query({ leaderboardId: lbId }).set(...auth(u.token));
  const approvedRec = g2.body.recommendations.find(r => r.key === firstKey);
  assert.ok(approvedRec, 'rec still present after approval');
  assert.equal(approvedRec.status, 'approved');

  // Unknown key → 404
  const bad = await request(app).post('/api/coach/insights/approve')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey: 'no_such_key_xyz' });
  assert.equal(bad.status, 404);

  // Non-member approve → 403
  const u2 = await signup('NonMember');
  const denied = await request(app).post('/api/coach/insights/approve')
    .set(...auth(u2.token)).send({ leaderboardId: lbId, itemKey: firstKey });
  assert.equal(denied.status, 403);
});

test('GET /insights full reasoning payload', async () => {
  const u = await signup('ReasoningCheck');
  // No leaderboardId → sample mode → schoolContext present
  const r = await request(app).get('/api/coach/insights').set(...auth(u.token));
  assert.equal(r.status, 200);
  assert.equal(r.body.pipeline.length, 4, 'pipeline has 4 steps');
  assert.ok(r.body.evidence.series.length >= 2, 'evidence.series has >= 2 points');
  assert.ok(
    Array.isArray(r.body.scope.excluded) && r.body.scope.excluded.some(s => /food/i.test(s)),
    'scope.excluded mentions food',
  );
  assert.ok(r.body.schoolContext && r.body.schoolContext.district, 'schoolContext.district truthy');
  assert.ok(r.body.responsibleAI.length >= 3, 'responsibleAI >= 3 items');
  assert.ok(r.body.limitations.length >= 3, 'limitations >= 3 items');
  assert.equal(r.body.statusFlow.length, 6, 'statusFlow has 6 stages');
});

test('action status lifecycle', async () => {
  const u = await signup('StatusOrg');
  const lbId = await makeBoard(u, 'Status Board');
  await loadDemo(u, lbId);

  // Advance before approve → 404
  const early = await request(app).post('/api/coach/insights/status')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey: 'hvac_setback', status: 'in_progress' });
  assert.equal(early.status, 404);

  // Approve first
  await request(app).post('/api/coach/insights/approve')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey: 'hvac_setback' });

  // Advance to in_progress
  const adv = await request(app).post('/api/coach/insights/status')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey: 'hvac_setback', status: 'in_progress' });
  assert.equal(adv.status, 200);
  assert.equal(adv.body.status, 'in_progress');

  // Invalid status string → 400
  const inv = await request(app).post('/api/coach/insights/status')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey: 'hvac_setback', status: 'launched_rockets' });
  assert.equal(inv.status, 400);
});

test('GET /insights includes holdout backtest', async () => {
  const u = await signup('BacktestCheck');
  // Sample mode; LINCOLN has 14 months → backtest runs
  const r = await request(app).get('/api/coach/insights').set(...auth(u.token));
  assert.equal(r.status, 200);
  assert.ok(r.body.evaluation.perUtility.length >= 1, 'perUtility has entries');
  assert.ok(typeof r.body.evaluation.avgMapePct === 'number', 'avgMapePct is a number');
  assert.ok(/sample/i.test(r.body.dataSource), `dataSource matches /sample/i: "${r.body.dataSource}"`);
});

test('Real Data Mode import', async () => {
  const u = await signup('ImportOrg');
  const lbId = await makeBoard(u, 'Import Board');

  // Import LINCOLN.series → 200, months === series length
  const imp = await request(app).post('/api/coach/insights/import')
    .set(...auth(u.token)).send({ leaderboardId: lbId, readings: LINCOLN.series });
  assert.equal(imp.status, 200, 'import: ' + JSON.stringify(imp.body));
  assert.equal(imp.body.months, LINCOLN.series.length);

  // Subsequent GET: sampleData false, dataSource matches /real/i
  const g = await request(app).get('/api/coach/insights').query({ leaderboardId: lbId }).set(...auth(u.token));
  assert.equal(g.status, 200);
  assert.equal(g.body.sampleData, false);
  assert.ok(/real/i.test(g.body.dataSource), `dataSource matches /real/i: "${g.body.dataSource}"`);

  // 1-row array → 400 (fewer than 4 months)
  const short = await request(app).post('/api/coach/insights/import')
    .set(...auth(u.token)).send({ leaderboardId: lbId, readings: [{ month: '2025-01', gasTherms: 100 }] });
  assert.equal(short.status, 400);

  // Non-member import → 403
  const u2 = await signup('ImportNonMember');
  const nm = await request(app).post('/api/coach/insights/import')
    .set(...auth(u2.token)).send({ leaderboardId: lbId, readings: LINCOLN.series });
  assert.equal(nm.status, 403);
});

test('verify outcome lifecycle', async () => {
  const u = await signup('VerifyOrg');
  const lbId = await makeBoard(u, 'Verify Board');
  await loadDemo(u, lbId);
  const itemKey = 'hvac_setback';

  // Verify before approve → 404
  const early = await request(app).post('/api/coach/insights/verify')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey, before: 18.4, after: 15.9, metric: 'weekend therms/HDD' });
  assert.equal(early.status, 404);

  // Approve
  await request(app).post('/api/coach/insights/approve')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey });

  // Verify with measured values
  const vr = await request(app).post('/api/coach/insights/verify')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey, before: 18.4, after: 15.9, metric: 'weekend therms/HDD' });
  assert.equal(vr.status, 200, 'verify: ' + JSON.stringify(vr.body));
  assert.equal(vr.body.actualPct, 13.6, `actualPct: ${vr.body.actualPct}`);
  assert.equal(vr.body.status, 'confirmed');

  // Re-GET: rec.measured.actualPct === 13.6, status === 'confirmed'
  const g = await request(app).get('/api/coach/insights').query({ leaderboardId: lbId }).set(...auth(u.token));
  const rec = g.body.recommendations.find(r => r.key === itemKey);
  assert.ok(rec, 'hvac_setback still in recommendations');
  assert.equal(rec.measured.actualPct, 13.6);
  assert.equal(rec.status, 'confirmed');

  // before: 0 → 400
  const zero = await request(app).post('/api/coach/insights/verify')
    .set(...auth(u.token)).send({ leaderboardId: lbId, itemKey, before: 0, after: 15.9, metric: 'weekend therms/HDD' });
  assert.equal(zero.status, 400);
});
