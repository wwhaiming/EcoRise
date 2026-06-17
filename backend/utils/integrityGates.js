/* GeoRise — Integrity gate scoring.
 *
 * Pure decision logic that turns the adversarial-critique result (from
 * aiClient.adversarialCritique) into an enforcement verdict and a points
 * multiplier. Kept separate from the LLM call so it is deterministic and
 * unit-testable, and so the route reads as: perception -> critique -> verdict.
 *
 *  high suspicion  -> reject (0 points)
 *  low  suspicion  -> reduced (half points, flagged)
 *  none / not run  -> full points
 */

function evaluateAdversarial(critique) {
  if (!critique || !critique.ran) {
    return { verdict: 'full', multiplier: 1, gate: 'n/a', reason: critique?.reasoning || 'Adversarial pass not run.' };
  }
  if (critique.suspicionLevel === 'high') {
    return { verdict: 'reject', multiplier: 0, gate: 'failed', reason: critique.reasoning || 'Image flagged as likely fake (screen/stock/AI-generated).' };
  }
  if (critique.suspicionLevel === 'low') {
    return { verdict: 'reduced', multiplier: 0.5, gate: 'flagged', reason: critique.reasoning || 'Image partially suspicious; points reduced.' };
  }
  return { verdict: 'full', multiplier: 1, gate: 'passed', reason: critique.reasoning || 'Passed the fraud screen.' };
}

module.exports = { evaluateAdversarial };

