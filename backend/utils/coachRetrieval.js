/* GeoRise — AI Eco Coach retrieval.
 *
 * retrieve() ranks APPROVED source chunks against a query by cosine similarity and
 * returns the top-k with their source citation metadata. ingestSourceChunks()
 * computes and stores embeddings for any chunks of a source that lack them (called
 * by the seeder and on source approval). Brute-force cosine in JS — fine for the
 * curated demo corpus (see docs/AI_ECO_COACH_PLAN.md, vector-store decision).
 */
const { embed, cosineSim, toBlob, fromBlob } = require('./coachEmbed');

// chunkId -> deserialized Float32Array. Avoids re-allocating + re-parsing every
// chunk's embedding BLOB on every retrieve() call (the scan is synchronous and on
// the request path). Invalidated on re-ingest below.
const _embCache = new Map();

async function ingestSourceChunks(db, sourceId) {
  const rows = db.prepare('SELECT id, text, embedding FROM eco_source_chunks WHERE source_id = ?').all(sourceId);
  const upd = db.prepare('UPDATE eco_source_chunks SET embedding = ? WHERE id = ?');
  let embedded = 0;
  for (const r of rows) {
    if (r.embedding) continue;            // already embedded
    const v = await embed(r.text);
    upd.run(toBlob(v), r.id);
    _embCache.delete(r.id);               // drop any stale cached vector for this chunk
    embedded++;
  }
  return embedded;
}

async function retrieve(db, queryText, { k = 5, courseId = null } = {}) {
  const q = await embed(queryText || '');
  const base = `SELECT c.id, c.text, c.source_id, c.embedding, s.title, s.url, s.pub_year, s.institution
                FROM eco_source_chunks c JOIN eco_sources s ON s.id = c.source_id
                WHERE s.status = 'approved'`;
  const rows = courseId
    ? db.prepare(base + " AND (s.course_id = ? OR s.course_id = '')").all(courseId)
    : db.prepare(base).all();

  const scored = [];
  for (const r of rows) {
    let v = _embCache.get(r.id);
    if (!v) {
      v = fromBlob(r.embedding);
      if (!v) continue;                   // un-embedded chunk -> not retrievable yet
      _embCache.set(r.id, v);
    }
    // Provider drift guard: a corpus embedded with Gemini (768-dim) and a query
    // that fell back to the lexical path (4096-dim), or vice versa, would otherwise
    // score 0 on every chunk (cosineSim returns 0 on length mismatch) and silently
    // ground generation on irrelevant text. Skip mismatched vectors so retrieval
    // fail-closes to "no corpus" instead of citing garbage.
    if (v.length !== q.length) continue;
    scored.push({
      id: r.id, text: r.text, sourceId: r.source_id,
      title: r.title, url: r.url, pubYear: r.pub_year, institution: r.institution,
      score: cosineSim(q, v),
    });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k);
}

module.exports = { retrieve, ingestSourceChunks };

