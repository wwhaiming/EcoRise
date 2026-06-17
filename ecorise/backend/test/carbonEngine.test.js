/* EcoRise — carbon engine unit tests (pure, deterministic).
 * Proves the grounded CO2 math: no model hallucination, cited factors, ranges. */
const test = require('node:test');
const assert = require('node:assert');
const {
  computeCarbon, estimateTransport, estimatePlantBasedMeal,
  estimateReusableBottle, estimateCleanup, EMISSION_FACTORS,
} = require('../utils/carbonEngine');

test('transport: car displacement uses the EPA per-mile factor + range', () => {
  const r = estimateTransport({ distanceMiles: 5, replacedMode: 'car' });
  assert.equal(r.kgCO2e, 2.0);          // 5 * 0.400
  assert.equal(r.low, 1.4);             // 5 * 0.280
  assert.equal(r.high, 2.6);            // 5 * 0.520
  assert.equal(r.method, 'distance_based_transport');
  assert.match(r.formula, /5 mi/);
  assert.equal(r.factors[0].source, 'EPA GHG Emission Factors Hub');
  assert.ok(r.factors[0].sourceUrl.startsWith('https://'));
});

test('transport: transit displacement scores lower than a car', () => {
  const r = estimateTransport({ distanceMiles: 5, replacedMode: 'transit' });
  assert.equal(r.kgCO2e, 0.5);          // 5 * 0.100
  assert.equal(r.low, 0.3);
  assert.equal(r.high, 0.85);
});

test('transport: unknown mode assumes car but widens the lower bound to transit', () => {
  const r = estimateTransport({ distanceMiles: 5, replacedMode: 'unknown' });
  assert.equal(r.kgCO2e, 2.0);          // central = car
  assert.equal(r.low, 0.5);             // lower bound = transit (5 * 0.100)
  assert.equal(r.high, 2.6);
});

test('transport: no distance => not credited (no fabricated CO2)', () => {
  for (const d of [null, undefined, 0, -3, NaN]) {
    const r = estimateTransport({ distanceMiles: d, replacedMode: 'car' });
    assert.equal(r.kgCO2e, 0);
    assert.equal(r.method, 'none');
  }
});

test('transport: model-supplied distance is clamped to 500 mi (anti-injection)', () => {
  const r = estimateTransport({ distanceMiles: 999999, replacedMode: 'car' });
  assert.equal(r.kgCO2e, 200);   // 500 * 0.400, not ~400000
});

test('transport: garbage replacedMode is treated as unknown', () => {
  const r = estimateTransport({ distanceMiles: 5, replacedMode: 'rocket' });
  assert.equal(r.kgCO2e, 2.0);   // central = car
  assert.equal(r.low, 0.5);      // unknown -> lower bound at transit
});

test('meal: beef/poultry/average and conservative unknown', () => {
  assert.equal(estimatePlantBasedMeal({ mealCategory: 'beef_replacement' }).kgCO2e, 6.0);
  assert.equal(estimatePlantBasedMeal({ mealCategory: 'poultry_replacement' }).kgCO2e, 1.5);
  assert.equal(estimatePlantBasedMeal({ mealCategory: 'meat_replacement' }).kgCO2e, 2.5);
  const unknown = estimatePlantBasedMeal({ mealCategory: 'vegan' });
  assert.equal(unknown.kgCO2e, 0);      // baseline unknown -> no CO2 claimed (honest, not a 1.0 guess)
  assert.equal(unknown.low, 0);         // a salad that replaced nothing earns nothing
  assert.equal(unknown.high, 4.0);      // upper bound = one average meat meal displaced
});

test('meal: servings scale and are clamped', () => {
  assert.equal(estimatePlantBasedMeal({ mealCategory: 'beef_replacement', servings: 2 }).kgCO2e, 12.0);
  assert.equal(estimatePlantBasedMeal({ mealCategory: 'beef_replacement', servings: 999 }).kgCO2e, 60.0); // clamp 10
});

test('bottle: credits only displaced bottles; 0 => no CO2', () => {
  assert.equal(estimateReusableBottle({ displacedCount: 3 }).kgCO2e, 0.25); // 3 * 0.083
  assert.equal(estimateReusableBottle({ displacedCount: 0 }).kgCO2e, 0);
  assert.equal(estimateReusableBottle({ displacedCount: 0 }).method, 'none');
});

test('cleanup: credited as community impact, not CO2, and cites EPA WARM', () => {
  const r = estimateCleanup();
  assert.equal(r.kgCO2e, 0);
  assert.equal(r.method, 'community_impact');
  assert.equal(r.factors[0].source, 'EPA WARM');
});

test('computeCarbon dispatches by action type', () => {
  assert.equal(computeCarbon('transportation', { distanceMiles: 10, replacedMode: 'car' }).kgCO2e, 4.0);
  assert.equal(computeCarbon('food', { mealCategory: 'beef_replacement' }).kgCO2e, 6.0);
  assert.equal(computeCarbon('waste', { displacedCount: 1 }).kgCO2e, 0.08); // round(0.083, 2)
  assert.equal(computeCarbon('nature', {}).method, 'community_impact');
  assert.equal(computeCarbon('energy', {}).method, 'none');
  assert.equal(computeCarbon('mystery', {}).method, 'none');
});

test('every grounded estimate carries a low<=central<=high range and assumptions', () => {
  const samples = [
    computeCarbon('transportation', { distanceMiles: 7, replacedMode: 'car' }),
    computeCarbon('food', { mealCategory: 'beef_replacement' }),
    computeCarbon('waste', { displacedCount: 4 }),
  ];
  for (const s of samples) {
    assert.ok(s.low <= s.kgCO2e && s.kgCO2e <= s.high, `range ordered for ${s.method}`);
    assert.ok(Array.isArray(s.assumptions) && s.assumptions.length >= 1, 'assumptions stated');
    assert.ok(s.factors.length >= 1 && s.factors[0].source, 'factor cited');
  }
});

test('emission factors are sane and cited', () => {
  for (const [k, f] of Object.entries(EMISSION_FACTORS)) {
    assert.ok(f.value > 0, `${k} has a positive factor`);
    assert.ok(f.low <= f.value && f.value <= f.high, `${k} range ordered`);
    assert.ok(f.source && f.sourceUrl && f.sourceYear, `${k} fully cited`);
  }
});
