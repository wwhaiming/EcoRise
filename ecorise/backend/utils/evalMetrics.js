/* EcoRise — Eval metrics (pure, deterministic).
 *
 * Turns a list of (expected vs. predicted) eco-action gate results into the
 * numbers a judge actually trusts: accuracy, false-positive / false-negative
 * rates, adversarial-rejection rate, per-class precision/recall, and a
 * confidence-calibration table. Kept free of I/O so it is unit-tested directly
 * (see test/evalMetrics.test.js) and reused by the live runner (test/eco_eval/runEval.js).
 *
 * A "positive" = the photo genuinely shows an eco action (expected === true).
 * predicted === the gate's isEcoAction decision.
 */

function pct(n, d) { return d === 0 ? 0 : Math.round((n / d) * 1000) / 10; }

/**
 * @param {Array<{expected:boolean, predicted:boolean, expectedType?:string,
 *   predictedType?:string, adversarial?:boolean, confidence?:number}>} cases
 */
function computeMetrics(cases) {
  const rows = Array.isArray(cases) ? cases : [];
  const n = rows.length;

  let tp = 0, tn = 0, fp = 0, fn = 0;
  for (const c of rows) {
    const exp = c.expected === true;
    const pred = c.predicted === true;
    if (exp && pred) tp++;
    else if (!exp && !pred) tn++;
    else if (!exp && pred) fp++;
    else fn++;
  }

  const positives = tp + fn;          // genuine eco actions
  const negatives = tn + fp;          // non-eco photos
  const correct = tp + tn;

  // Adversarial cases are decoys (expected === false); "rejection" = predicted false.
  const adv = rows.filter(c => c.adversarial);
  const advRejected = adv.filter(c => c.predicted !== true).length;

  // Per action-type precision/recall over the genuine-positive set.
  const perClass = {};
  const types = new Set();
  for (const c of rows) {
    if (c.expectedType) types.add(c.expectedType);
    if (c.predictedType) types.add(c.predictedType);
  }
  for (const type of types) {
    let ctp = 0, cfp = 0, cfn = 0;
    for (const c of rows) {
      const expT = c.expected === true && c.expectedType === type;
      const predT = c.predicted === true && c.predictedType === type;
      if (expT && predT) ctp++;
      else if (!expT && predT) cfp++;
      else if (expT && !predT) cfn++;
    }
    perClass[type] = {
      precision: pct(ctp, ctp + cfp),
      recall: pct(ctp, ctp + cfn),
      support: ctp + cfn,
    };
  }

  // Confidence calibration: 5 buckets, accuracy of the gate decision within each.
  const buckets = [[0, 0.2], [0.2, 0.4], [0.4, 0.6], [0.6, 0.8], [0.8, 1.01]];
  const calibration = buckets.map(([lo, hi]) => {
    const inB = rows.filter(c => typeof c.confidence === 'number' && c.confidence >= lo && c.confidence < hi);
    const right = inB.filter(c => (c.expected === true) === (c.predicted === true)).length;
    return {
      range: `${lo.toFixed(1)}-${hi >= 1 ? '1.0' : hi.toFixed(1)}`,
      count: inB.length,
      accuracy: pct(right, inB.length),
    };
  });

  return {
    n,
    accuracy: pct(correct, n),
    falsePositiveRate: pct(fp, negatives),
    falseNegativeRate: pct(fn, positives),
    adversarialRejectionRate: pct(advRejected, adv.length),
    adversarialCount: adv.length,
    confusion: { tp, tn, fp, fn },
    perClass,
    calibration,
  };
}

// Render a metrics object as a compact text report (for the runner + the demo).
function formatReport(m) {
  const lines = [];
  lines.push(`Eco-action gate eval — ${m.n} labeled cases`);
  lines.push(`  accuracy:                 ${m.accuracy}%`);
  lines.push(`  false-positive rate:      ${m.falsePositiveRate}%  (non-eco photos wrongly accepted)`);
  lines.push(`  false-negative rate:      ${m.falseNegativeRate}%  (real eco photos wrongly rejected)`);
  lines.push(`  adversarial rejection:    ${m.adversarialRejectionRate}%  (${m.adversarialCount} decoys)`);
  lines.push(`  confusion: tp=${m.confusion.tp} tn=${m.confusion.tn} fp=${m.confusion.fp} fn=${m.confusion.fn}`);
  if (Object.keys(m.perClass).length) {
    lines.push('  per-class (precision / recall / support):');
    for (const [t, c] of Object.entries(m.perClass)) {
      lines.push(`    ${t.padEnd(16)} ${c.precision}% / ${c.recall}% / ${c.support}`);
    }
  }
  lines.push('  calibration (confidence bucket -> accuracy):');
  for (const b of m.calibration) {
    if (b.count) lines.push(`    ${b.range}  n=${String(b.count).padStart(3)}  acc=${b.accuracy}%`);
  }
  return lines.join('\n');
}

module.exports = { computeMetrics, formatReport };
