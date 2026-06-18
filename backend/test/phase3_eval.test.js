/* EcoRise — Phase 3 eval-rigor unit tests (pure, hermetic).
 * Retrieval metrics (Recall@k / MRR / Precision@k) + the numeric claim-verification
 * layer that backs the semantic-entailment gate. No DB, no env, no network. */
const test = require('node:test');
const assert = require('node:assert');
const { retrievalMetrics } = require('../utils/evalMetrics');
const { unsupportedNumbers, gate } = require('../utils/coachFaithfulness');

test('retrievalMetrics: empty set is zeroed, never NaN', () => {
  const m = retrievalMetrics([], 5);
  assert.deepStrictEqual(m, { n: 0, k: 5, recallAtK: 0, mrr: 0, precisionAtK: 0 });
});

test('retrievalMetrics: perfect top-1 retrieval = recall 1, MRR 1', () => {
  const m = retrievalMetrics([{ relevantRanks: [1] }, { relevantRanks: [1] }], 5);
  assert.strictEqual(m.recallAtK, 1);
  assert.strictEqual(m.mrr, 1);
});

test('retrievalMetrics: MRR uses the FIRST relevant rank; recall counts any-in-k', () => {
  // case A: first relevant at rank 2 -> rr .5 ; case B: nothing in top-k -> rr 0, miss
  const m = retrievalMetrics([{ relevantRanks: [2, 4] }, { relevantRanks: [] }], 5);
  assert.strictEqual(m.recallAtK, 0.5);          // 1 of 2 queries had a hit
  assert.strictEqual(m.mrr, 0.25);               // (1/2 + 0) / 2
});

test('retrievalMetrics: ranks beyond k do not count as recall hits', () => {
  const m = retrievalMetrics([{ relevantRanks: [9] }], 5);
  assert.strictEqual(m.recallAtK, 0);
  assert.strictEqual(m.mrr, 0);
});

test('unsupportedNumbers: flags a figure absent from evidence, passes a supported one', () => {
  assert.deepStrictEqual(unsupportedNumbers('cuts emissions by 80%', 'biking avoids tailpipe emissions'), ['80%']);
  assert.deepStrictEqual(unsupportedNumbers('about 40 percent less', 'transit emits 40 percent less per passenger-mile'), []);
});

test('numeric gate compares VALUES not digit-substrings (surface-form equiv accepted; 5 != 50)', () => {
  assert.deepStrictEqual(unsupportedNumbers('cuts emissions 15%', 'reduces emissions by 15 percent'), []);
  assert.deepStrictEqual(unsupportedNumbers('the factor is 0.40', 'emission factor 0.4 per mile'), []);
  assert.deepStrictEqual(unsupportedNumbers('holds 5 liters', 'holds 50 liters'), ['5']); // no false-accept via substring
});

test('gate: rejects a fabricated numeric claim even when lexical coverage passes', () => {
  const chunks = [{ id: 'c1', text: 'Replacing a beef meal with a plant-based meal lowers the per-meal footprint substantially.' }];
  const supported = { sourceIds: ['c1'], correct: 'plant-based meal', explanation: 'Replacing a beef meal with a plant-based meal lowers the per-meal footprint substantially.' };
  const fabricated = { sourceIds: ['c1'], correct: 'plant-based meal', explanation: 'Replacing a beef meal with a plant-based meal lowers the per-meal footprint by 73%.' };
  assert.strictEqual(gate(supported, chunks).ok, true);
  const bad = gate(fabricated, chunks);
  assert.strictEqual(bad.ok, false);
  assert.strictEqual(bad.reason, 'unsupported_number');
});
