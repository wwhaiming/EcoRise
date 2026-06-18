/* EcoRise — School hidden-footprint model unit tests (pure, hermetic, no DB/env). */
const test = require('node:test');
const assert = require('node:assert');
const { estimateFootprint, actionLeverage, FACTORS } = require('../utils/footprintModel');

test('estimate is deterministic for the same input', () => {
  const a = estimateFootprint({ students: 800 });
  const b = estimateFootprint({ students: 800 });
  assert.deepStrictEqual(a, b);
});

test('defaults produce all six categories, sorted desc, total = sum, low confidence', () => {
  const f = estimateFootprint({});
  assert.strictEqual(f.categories.length, 6);
  assert.strictEqual(f.isEstimate, true);
  assert.strictEqual(f.overallConfidence, 'low');           // no provided inputs
  // sorted descending by kg/mo
  for (let i = 1; i < f.categories.length; i++) {
    assert.ok(f.categories[i - 1].kgCO2ePerMonth >= f.categories[i].kgCO2ePerMonth, 'categories must be sorted desc');
  }
  assert.strictEqual(f.biggestEmitter, f.categories[0]);
  const sum = f.categories.reduce((s, c) => s + c.kgCO2ePerMonth, 0);
  assert.ok(Math.abs(sum - f.totalKgPerMonth) < 0.5, 'total must equal the category sum');
});

test('every category carries honest metadata: confidence, assumptions, a valid band, a citation', () => {
  const f = estimateFootprint({ students: 600 });
  for (const c of f.categories) {
    assert.ok(['low', 'medium', 'high'].includes(c.confidence), `bad confidence for ${c.category}`);
    assert.ok(Array.isArray(c.assumptions) && c.assumptions.length >= 1, `missing assumptions for ${c.category}`);
    assert.ok(c.low <= c.kgCO2ePerMonth + 1e-6 && c.kgCO2ePerMonth <= c.high + 1e-6, `band must bracket value for ${c.category}`);
    assert.ok(c.sourceId && c.source && c.sourceUrl, `missing citation for ${c.category}`);
  }
});

test('provided real inputs are flagged and lift overall confidence to medium', () => {
  const def = estimateFootprint({ students: 800 });
  assert.strictEqual(def.categories.filter(c => c.provided).length, 0);
  const real = estimateFootprint({ students: 800, monthlyKwh: 60000, monthlyGasTherms: 1200, dailyMealsServed: 600, landfillBagsPerWeek: 40 });
  assert.strictEqual(real.categories.filter(c => c.provided).length, 4);
  assert.strictEqual(real.overallConfidence, 'medium');     // >=4 provided
});

test('more electricity raises the electricity estimate (monotonic in input)', () => {
  const lo = estimateFootprint({ students: 500, monthlyKwh: 10000 });
  const hi = estimateFootprint({ students: 500, monthlyKwh: 90000 });
  const e = (f) => f.categories.find(c => c.category === 'electricity').kgCO2ePerMonth;
  assert.ok(e(hi) > e(lo));
  // and it equals kWh * the cited factor
  assert.ok(Math.abs(e(hi) - 90000 * FACTORS.electricity_kwh.value) < 1);
});

test('actionLeverage computes ratio vs the biggest emitter', () => {
  const f = estimateFootprint({ students: 800 });
  const top = f.biggestEmitter;
  const weekly = top.kgCO2ePerMonth / 4.33;
  const lev = actionLeverage(weekly / 2, f, 'week');  // saved = half the weekly emitter
  assert.strictEqual(lev.topEmitter.category, top.category);
  assert.ok(Math.abs(lev.ratioPct - 50) < 2, `expected ~50%, got ${lev.ratioPct}`);
});

test('actionLeverage refuses (null emitter) when there is no footprint baseline', () => {
  const lev = actionLeverage(18, { biggestEmitter: null });
  assert.strictEqual(lev.topEmitter, null);
  assert.strictEqual(lev.ratioPct, null);
  assert.ok(/baseline/i.test(lev.message));
});

test('negative or garbage savings clamp to zero', () => {
  const f = estimateFootprint({ students: 300 });
  assert.strictEqual(actionLeverage(-5, f).saved, 0);
  assert.strictEqual(actionLeverage('nope', f).saved, 0);
});
