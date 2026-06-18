/* GeoRise — AI Eco Coach faithfulness gate.
 *
 * Turns a generated question + the chunks it was generated from into an accept/
 * reject decision. This is the core responsible-AI mechanism: a question is only
 * trusted if every citation is real (came from the retrieved set) AND the answer
 * is lexically supported by the cited chunk text. Deterministic and offline; an
 * optional LLM judge (Gate 3) can raise confidence in the eval, but is never
 * required to ship a question. See docs/AI_ECO_COACH_PLAN.md section 11.
 */
const SIM_FLOOR = Number(process.env.COACH_SIM_FLOOR || 0.35);
const { judgeEntailment } = require('./aiClient');


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

// Numeric / percentage figures asserted by the answer that do NOT appear in the cited
// evidence. A deterministic claim-verification layer ALONGSIDE the lexical coverage
// gate: token-overlap can pass an answer that invented a number ("cuts emissions 80%")
// while reusing supported words. This catches that fabricated-figure class. It is a
// heuristic entailment PROXY, not a learned NLI model — labeled honestly as such.
// Parse figures as {value, pct}. Strips thousands commas; treats a trailing % OR the
// word "percent" as a percentage. "2,000"->2000; "15%"/"15 percent"->{15,pct}.
function parseNumbers(s) {
  const text = String(s || '').toLowerCase().replace(/(\d),(?=\d{3}\b)/g, '$1');
  const out = [];
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(%|percent)?/g)) {
    out.push({ value: parseFloat(m[1]), pct: !!m[2] });
  }
  return out;
}
// Numeric figures the answer asserts that NO same-kind figure in the evidence supports
// (by VALUE, not digit-substring). Catches invented figures while accepting equivalent
// surface forms (15% == "15 percent", 0.40 == 0.4); avoids "5" matching "50". Deduped.
function unsupportedNumbers(claim, evidence) {
  const ev = parseNumbers(evidence);
  const bad = [];
  for (const c of parseNumbers(claim)) {
    const ok = ev.some(e => e.pct === c.pct && Math.abs(e.value - c.value) <= Math.max(0.01, Math.abs(c.value) * 0.001));
    if (!ok) bad.push(c.pct ? `${c.value}%` : `${c.value}`);
  }
  return [...new Set(bad)];
}
function numericClaims(s) {
  return parseNumbers(s).map(n => (n.pct ? `${n.value}%` : `${n.value}`));
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
async function gate(q, retrievedChunks, { simFloor = SIM_FLOOR } = {}) {
  if (!q || q.refusal) return { ok: false, reason: 'refusal', faithfulness: 0 };
  const retrievedIds = retrievedChunks.map(c => c.id);
  if (!validateCitations(q.sourceIds, retrievedIds)) {
    return { ok: false, reason: 'bad_citation', faithfulness: 0 };
  }
  const f = deterministicFaithfulness(q, retrievedChunks);
  if (f < simFloor) return { ok: false, reason: 'unsupported', faithfulness: f };
  // Claim-verification layer (entailment proxy): reject answers asserting a numeric
  // figure absent from the cited evidence, even if lexical coverage passed.
  const cited = retrievedChunks.filter(c => Array.isArray(q.sourceIds) && q.sourceIds.includes(c.id));
  const evidence = cited.map(c => c.text).join(' ');
  const unsupported = unsupportedNumbers(`${q.correct || ''} ${q.explanation || ''}`, evidence);
  if (unsupported.length) return { ok: false, reason: 'unsupported_number', faithfulness: f, unsupportedNumbers: unsupported };

  // Learned Semantic Entailment Gate
  const judgeResult = await judgeEntailment(`${q.correct || ''} ${q.explanation || ''}`, evidence);
  if (!judgeResult.entailment) {
    return { ok: false, reason: 'semantic_contradiction', faithfulness: judgeResult.score, details: judgeResult.reasoning };
  }

  return { ok: true, reason: 'ok', faithfulness: judgeResult.score !== undefined ? judgeResult.score : f, reasoning: judgeResult.reasoning };
}

module.exports = { gate, deterministicFaithfulness, validateCitations, coverage, unsupportedNumbers, numericClaims, SIM_FLOOR };

