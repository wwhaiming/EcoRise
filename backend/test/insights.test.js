/* EcoRise — Direction B AI reasoning layer tests: anomaly + forecast + recommendation
 * engines (pure) and the /api/coach/insights endpoints (integration via supertest). */
process.env.JWT_SECRET = process.env.JWT_SECRET || ('insights-test-secret-' + 'x'.repeat(24));
process.env.COACH_ENABLED = 'true';
process.env.NODE_ENV = 'test';

const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');

const { detectAnomalies, baselineSeries, ols } = require('../utils/anomalyEngine');
const { forecastNextMonth } = require('../utils/forecastEngine');
const { recommend } = require('../utils/interventionModel');
const { estimateFootprint } = require('../utils/footprintModel');
const LINCOLN = require('../data/lincolnHigh');

// ── Engine unit tests (pure, deterministic) ──────────────────────────────────
test('ols recovers known linear coefficients exactly', () => {
  const X = [[1, 1, 1], [1, 2, 1], [1, 1, 2], [1, 3, 2], [1, 2, 3], [1, 4, 1], [1, 1, 4]];
  const y = X.map(r => 5 + 2 * r[1] + 3 * r[2]);
  const b = ols(X, y).map(v => Math.round(v * 100) / 100);
  assert.deepStrictEqual(b, [5, 2, 3]);
});

test('detectAnomalies flags a planted gas spike, attributes it to heating, requires human review', () => {
  const an = detectAnomalies(LINCOLN.series, { zThresh: 2 });
  assert.ok(an.length >= 1, 'should flag at least one anomaly in the seeded data');
  const gas = an.find(a => a.category === 'gas' && a.month === '2026-01');
  assert.ok(gas, 'should flag the planted Jan-2026 gas spike');
  assert.ok(gas.percentAboveExpected > 5, 'spike is meaningfully above expected');
  assert.strictEqual(gas.requiresHumanReview, true);
  assert.ok(gas.excessKgCO2ePerMonth > 0 && gas.source, 'excess kg + cited factor present');
  assert.ok(/boiler|weekend|heating/i.test(gas.likelyCauses.join(' ')));
});

test('detectAnomalies returns nothing on clean (on-model) data and never flags savings', () => {
  // perfectly-on-model gas: usage = 50 + 4*schoolDays + 1.1*hdd, varying predictors
  const sd = [20, 18, 21, 19, 16, 22, 15, 17, 20, 21, 19, 18];
  const hdd = [120, 300, 420, 380, 210, 60, 520, 460, 90, 260, 410, 180];
  const series = sd.map((d, i) => ({ month: 'M' + i, schoolDays: d, hdd: hdd[i], cdd: 50, gasTherms: 50 + 4 * d + 1.1 * hdd[i] }));
  const an = detectAnomalies(series, { zThresh: 2 });
  assert.strictEqual(an.length, 0, 'no anomalies on clean data');
  // a month FAR BELOW expected (savings) must not be flagged as waste
  series[5].gasTherms = Math.round(series[5].gasTherms * 0.5);
  assert.strictEqual(detectAnomalies(series, { zThresh: 2 }).filter(a => a.month === 'M5').length, 0);
});

test('forecastNextMonth returns a valid 80% band (low <= predicted <= high, non-negative)', () => {
  const fc = forecastNextMonth(LINCOLN.series, LINCOLN.upcoming);
  assert.ok(fc.gas && fc.electricity && fc.water, 'forecasts all three utilities');
  for (const k of ['gas', 'electricity', 'water']) {
    const f = fc[k];
    assert.ok(f.low >= 0 && f.low <= f.predicted + 1e-6 && f.predicted <= f.high + 1e-6, `band must bracket ${k}`);
    assert.ok(f.predictedKgCO2e >= 0 && f.unit, `${k} carries kg + unit`);
  }
});

test('recommend ranks env interventions, boosts anomaly-addressing ones, all require approval', () => {
  const fp = estimateFootprint(LINCOLN.baseline);
  const an = detectAnomalies(LINCOLN.series, { zThresh: 2 });
  const recs = recommend(fp, an, { budget: 'any', maxItems: 3 });
  assert.strictEqual(recs.length, 3);
  assert.ok(recs.every(r => r.requiresApproval === true && r.approver), 'human approver on every rec');
  // gas anomaly present -> a gas/HVAC intervention should rank #1
  assert.ok(['hvac_setback', 'boiler_weekend_zones'].includes(recs[0].key), 'anomaly-addressing rec ranks first');
  assert.ok(recs.every(r => !/food|cafeteria|meal/i.test(JSON.stringify(r))), 'no food interventions');
});

test('recommend with budget=none excludes capital projects (LED retrofit)', () => {
  const fp = estimateFootprint(LINCOLN.baseline);
  const recs = recommend(fp, [], { budget: 'none', maxItems: 10 });
  assert.ok(recs.every(r => r.costTier === 'none'), 'only no-cost actions when budget=none');
  assert.ok(!recs.find(r => r.key === 'led_retrofit'), 'capital LED retrofit excluded');
});

// ── Endpoint integration tests ───────────────────────────────────────────────
const app = require('../server');
async function signup(email, name) {
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'password12', name });
  const cookie = r.headers['set-cookie'];
  const csrf = (cookie.find(c => c.startsWith('csrf=')) || '').split('=')[1].split(';')[0];
  return { cookie, csrf };
}

test('GET /insights returns the Lincoln High sample when a board has no data', async () => {
  const t = await signup('ins-teacher@t.co', 'Teacher');
  const r = await request(app).get('/api/coach/insights').set('Cookie', t.cookie);
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.sampleData, true);
  assert.strictEqual(r.body.school, 'Lincoln High School');
  assert.ok(r.body.anomalies.length >= 1 && r.body.recommendations.length >= 1);
  assert.ok(typeof r.body.summary === 'string' && r.body.summary.length > 0);
  assert.ok(/never changes building settings|approve/i.test(r.body.humanInLoop));
});

test('load-demo + approve: human-in-the-loop action plan, audit-logged, authz enforced', async () => {
  const t = await signup('ins-org@t.co', 'Organizer');
  const board = await request(app).post('/api/leaderboards').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ name: 'Lincoln' });
  const lb = board.body.id;
  const ld = await request(app).post('/api/coach/insights/load-demo').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb });
  assert.strictEqual(ld.status, 200);
  const ins = await request(app).get('/api/coach/insights?leaderboardId=' + lb).set('Cookie', t.cookie);
  assert.strictEqual(ins.body.sampleData, false, 'now using the board loaded data');
  const key = ins.body.recommendations[0].key;
  const ap = await request(app).post('/api/coach/insights/approve').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key });
  assert.strictEqual(ap.status, 200);
  assert.strictEqual(ap.body.status, 'approved');
  assert.ok(ap.body.verifyBy && ap.body.expectedKgPerMonth >= 0);
  // approval persists into the next insights read
  const ins2 = await request(app).get('/api/coach/insights?leaderboardId=' + lb).set('Cookie', t.cookie);
  assert.strictEqual(ins2.body.recommendations.find(r => r.key === key).status, 'approved');
  // unknown item key -> 404
  const bad = await request(app).post('/api/coach/insights/approve').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: 'nope' });
  assert.strictEqual(bad.status, 404);
  // a non-member cannot approve (AI never auto-approves; only the human organizer can)
  const s = await signup('ins-stranger@t.co', 'Stranger');
  const blocked = await request(app).post('/api/coach/insights/approve').set('Cookie', s.cookie).set('x-csrf-token', s.csrf).send({ leaderboardId: lb, itemKey: key });
  assert.strictEqual(blocked.status, 403);
});

// ── Explainability + payload tests (the 100/100 UX surface) ──────────────────
test('anomaly results are explainable: features, expected band, confidence %, not-enough-evidence', () => {
  const a = detectAnomalies(LINCOLN.series, { zThresh: 2 })[0];
  assert.ok(Array.isArray(a.featuresUsed) && a.featuresUsed.length >= 2);
  assert.ok(a.expectedLow <= a.expected && a.expected <= a.expectedHigh, 'expected within its band');
  assert.ok(a.modelConfidencePct >= 50 && a.modelConfidencePct <= 99);
  assert.ok(Array.isArray(a.notEnoughEvidenceFor) && a.notEnoughEvidenceFor.length >= 1);
});

test('baselineSeries returns observed vs expected + band with the anomaly flagged', () => {
  const bs = baselineSeries(LINCOLN.series, 'gas', { zThresh: 2 });
  assert.ok(bs.length >= 12);
  const p = bs.find(x => x.anomaly);
  assert.ok(p && p.observed > p.high, 'flagged month observed sits above its expected band');
});

test('recommendations carry CTA, verification metric, time-to-impact, cost band', () => {
  const recs = recommend(estimateFootprint(LINCOLN.baseline), detectAnomalies(LINCOLN.series, { zThresh: 2 }), { budget: 'any', maxItems: 3 });
  assert.ok(recs.every(r => r.cta && r.verificationMetric && r.timeToImpactWeeks && r.costBand));
});

test('GET /insights carries the full reasoning payload (pipeline, evidence, scope, responsible-AI)', async () => {
  const t = await signup('ins-rich@t.co', 'Rich');
  const r = await request(app).get('/api/coach/insights').set('Cookie', t.cookie);
  assert.strictEqual(r.body.pipeline.length, 4);
  assert.ok(r.body.evidence.series.length >= 2);
  assert.ok(r.body.scope.excluded.join(' ').toLowerCase().includes('food'), 'scope explicitly excludes food');
  assert.ok(r.body.schoolContext && r.body.schoolContext.district);
  assert.ok(r.body.responsibleAI.length >= 3 && r.body.limitations.length >= 3 && r.body.statusFlow.length === 6);
});

test('action status lifecycle: advance-before-approve 404, organizer advances, invalid 400', async () => {
  const t = await signup('ins-life@t.co', 'Org');
  const board = await request(app).post('/api/leaderboards').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ name: 'Life' });
  const lb = board.body.id;
  await request(app).post('/api/coach/insights/load-demo').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb });
  const ins = await request(app).get('/api/coach/insights?leaderboardId=' + lb).set('Cookie', t.cookie);
  const key = ins.body.recommendations[0].key;
  const pre = await request(app).post('/api/coach/insights/status').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key, status: 'in_progress' });
  assert.strictEqual(pre.status, 404, 'cannot advance status before approval');
  await request(app).post('/api/coach/insights/approve').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key });
  const ok = await request(app).post('/api/coach/insights/status').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key, status: 'in_progress' });
  assert.strictEqual(ok.status, 200);
  assert.strictEqual(ok.body.status, 'in_progress');
  const bad = await request(app).post('/api/coach/insights/status').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key, status: 'hacked' });
  assert.strictEqual(bad.status, 400, 'invalid status rejected');
});

test('GET /insights includes a holdout backtest (model validation)', async () => {
  const t = await signup('ins-eval@t.co', 'E');
  const r = await request(app).get('/api/coach/insights').set('Cookie', t.cookie);
  assert.ok(r.body.evaluation && Array.isArray(r.body.evaluation.perUtility) && r.body.evaluation.perUtility.length >= 1);
  assert.ok(typeof r.body.evaluation.avgMapePct === 'number');
  assert.ok(typeof r.body.dataSource === 'string' && /sample/i.test(r.body.dataSource));
});

test('Real Data Mode: organizer imports utility readings; flips data source; short import rejected', async () => {
  const t = await signup('ins-imp@t.co', 'Org');
  const board = await request(app).post('/api/leaderboards').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ name: 'Real' });
  const lb = board.body.id;
  const imp = await request(app).post('/api/coach/insights/import').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, readings: LINCOLN.series });
  assert.strictEqual(imp.status, 200);
  assert.strictEqual(imp.body.months, LINCOLN.series.length);
  const ins = await request(app).get('/api/coach/insights?leaderboardId=' + lb).set('Cookie', t.cookie);
  assert.strictEqual(ins.body.sampleData, false);
  assert.ok(/real/i.test(ins.body.dataSource));
  const short = await request(app).post('/api/coach/insights/import').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, readings: [{ month: 'x', gasTherms: 5 }] });
  assert.strictEqual(short.status, 400, 'needs >= 4 months');
  // non-member cannot import
  const s = await signup('ins-imp2@t.co', 'S');
  const blocked = await request(app).post('/api/coach/insights/import').set('Cookie', s.cookie).set('x-csrf-token', s.csrf).send({ leaderboardId: lb, readings: LINCOLN.series });
  assert.strictEqual(blocked.status, 403);
});

test('Measured outcome: approve -> verify computes actual % reduction and confirms; guards enforced', async () => {
  const t = await signup('ins-ver@t.co', 'Org');
  const board = await request(app).post('/api/leaderboards').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ name: 'Ver' });
  const lb = board.body.id;
  await request(app).post('/api/coach/insights/load-demo').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb });
  const ins = await request(app).get('/api/coach/insights?leaderboardId=' + lb).set('Cookie', t.cookie);
  const key = ins.body.recommendations[0].key;
  // verify before approve -> 404
  const pre = await request(app).post('/api/coach/insights/verify').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key, before: 18.4, after: 15.9 });
  assert.strictEqual(pre.status, 404);
  await request(app).post('/api/coach/insights/approve').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key });
  const v = await request(app).post('/api/coach/insights/verify').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key, before: 18.4, after: 15.9, metric: 'weekend therms/HDD' });
  assert.strictEqual(v.status, 200);
  assert.strictEqual(v.body.actualPct, 13.6);
  assert.strictEqual(v.body.status, 'confirmed');
  const ins2 = await request(app).get('/api/coach/insights?leaderboardId=' + lb).set('Cookie', t.cookie);
  const rec = ins2.body.recommendations.find(r => r.key === key);
  assert.ok(rec.measured && rec.measured.actualPct === 13.6 && rec.status === 'confirmed');
  // bad before value -> 400
  const badv = await request(app).post('/api/coach/insights/verify').set('Cookie', t.cookie).set('x-csrf-token', t.csrf).send({ leaderboardId: lb, itemKey: key, before: 0, after: 5 });
  assert.strictEqual(badv.status, 400);
});
