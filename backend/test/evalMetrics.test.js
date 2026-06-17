/* GeoRise — eval metric math tests.
 * A hand-computed 8-case confusion matrix pins every reported number so the
 * eco-gate eval dashboard cannot silently miscount. */
const test = require('node:test');
const assert = require('node:assert');
const { computeMetrics, formatReport } = require('../utils/evalMetrics');

// tp=3, fn=1 (positives=4); tn=3, fp=1 (negatives=4); 2 adversarial decoys, 1 rejected.
const CASES = [
  { expected: true,  predicted: true,  expectedType: 'transportation', predictedType: 'transportation', confidence: 0.9 },  // tp
  { expected: true,  predicted: true,  expectedType: 'food',           predictedType: 'food',           confidence: 0.85 }, // tp
  { expected: true,  predicted: true,  expectedType: 'waste',          predictedType: 'waste',          confidence: 0.7 },  // tp
  { expected: true,  predicted: false, expectedType: 'transportation',                                  confidence: 0.3 },  // fn
  { expected: false, predicted: false,                                                                  confidence: 0.1 },  // tn
  { expected: false, predicted: false,                                                                  confidence: 0.2 },  // tn
  { expected: false, predicted: false, adversarial: true,                                               confidence: 0.15 }, // tn, decoy rejected
  { expected: false, predicted: true,  adversarial: true, predictedType: 'transportation',              confidence: 0.55 }, // fp, decoy NOT rejected
];

test('confusion matrix + headline rates', () => {
  const m = computeMetrics(CASES);
  assert.equal(m.n, 8);
  assert.deepEqual(m.confusion, { tp: 3, tn: 3, fp: 1, fn: 1 });
  assert.equal(m.accuracy, 75);            // (3+3)/8
  assert.equal(m.falsePositiveRate, 25);   // 1/4 negatives
  assert.equal(m.falseNegativeRate, 25);   // 1/4 positives
  assert.equal(m.adversarialCount, 2);
  assert.equal(m.adversarialRejectionRate, 50); // 1 of 2 decoys rejected
});

test('per-class precision/recall', () => {
  const m = computeMetrics(CASES);
  assert.deepEqual(m.perClass.transportation, { precision: 50, recall: 50, support: 2 });
  assert.deepEqual(m.perClass.food, { precision: 100, recall: 100, support: 1 });
  assert.deepEqual(m.perClass.waste, { precision: 100, recall: 100, support: 1 });
});

test('calibration buckets count and score correctly', () => {
  const m = computeMetrics(CASES);
  const byRange = Object.fromEntries(m.calibration.map(b => [b.range, b]));
  assert.equal(byRange['0.0-0.2'].count, 2);
  assert.equal(byRange['0.0-0.2'].accuracy, 100);
  assert.equal(byRange['0.2-0.4'].count, 2);   // 0.2 (tn) + 0.3 (fn)
  assert.equal(byRange['0.2-0.4'].accuracy, 50);
  assert.equal(byRange['0.8-1.0'].count, 2);
  assert.equal(byRange['0.8-1.0'].accuracy, 100);
});

test('empty input is safe (no divide-by-zero)', () => {
  const m = computeMetrics([]);
  assert.equal(m.n, 0);
  assert.equal(m.accuracy, 0);
  assert.equal(m.falsePositiveRate, 0);
  assert.equal(m.adversarialRejectionRate, 0);
});

test('formatReport renders the headline numbers', () => {
  const r = formatReport(computeMetrics(CASES));
  assert.match(r, /accuracy:\s+75%/);
  assert.match(r, /adversarial rejection:\s+50%/);
  assert.match(r, /tp=3 tn=3 fp=1 fn=1/);
});

