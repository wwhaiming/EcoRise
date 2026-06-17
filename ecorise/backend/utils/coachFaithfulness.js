/* EcoRise — AI Eco Coach faithfulness gate.
 *
 * Turns a generated question + the chunks it was generated from into an accept/
 * reject decision. This is the core responsible-AI mechanism: a question is only
 * trusted if every citation is real (came from the retrieved set) AND the answer
 * is lexically supported by the cited chunk text. Deterministic and offline; an
 * optional LLM judge (Gate 3) can raise confidence in the eval, but is never
 * required to ship a question. See docs/AI_ECO_COACH_PLAN.md section 11.
 */
const SIM_FLOOR = Number(process.env.COACH_SIM_FLOOR || 0.35);

function toks(s) {
  return new Set((String(s || '').toLowerCase().match(/[a-z0-9]{3,}/g) || []));
}

// Fraction of the claim's tokens that appear in the evidence text (0..1).
function coverage(claim, evidence) {
  const c = toks(claim);
  if (!c.size) return 0;
  const e = toks(evidence);
  let hit = 0;
  for (const t of c) if (e.has(t)) hit++;
  return hit / c.size;
}

function validateCitations(sourceIds, retrievedIds) {
  if (!Array.isArray(sourceIds) || sourceIds.length === 0) return false;
  const set = new Set(retrievedIds);
  return sourceIds.every(id => set.has(id));
}

function deterministicFaithfulness(q, retrievedChunks) {
  const cited = retrievedChunks.filter(c => Array.isArray(q.sourceIds) && q.sourceIds.includes(c.id));
  if (!cited.length) return 0;
  const evidence = cited.map(c => c.text).join(' ');
  return coverage(`${q.correct || ''} ${q.explanation || ''}`, evidence);
}

// Accept/reject a generated question against the chunks it was retrieved from.
function gate(q, retrievedChunks, { simFloor = SIM_FLOOR } = {}) {
  if (!q || q.refusal) return { ok: false, reason: 'refusal', faithfulness: 0 };
  const retrievedIds = retrievedChunks.map(c => c.id);
  if (!validateCitations(q.sourceIds, retrievedIds)) {
    return { ok: false, reason: 'bad_citation', faithfulness: 0 };
  }
  const f = deterministicFaithfulness(q, retrievedChunks);
  if (f < simFloor) return { ok: false, reason: 'unsupported', faithfulness: f };
  return { ok: true, reason: 'ok', faithfulness: f };
}

module.exports = { gate, deterministicFaithfulness, validateCitations, coverage, SIM_FLOOR };
