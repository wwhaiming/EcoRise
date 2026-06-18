/* EcoRise — AI Eco Coach retrieval.
 *
 * retrieve() ranks APPROVED source chunks against a query by nearest-neighbour
 * cosine similarity and returns the top-k with their source citation metadata.
 * ingestSourceChunks() computes and stores embeddings for any chunks of a source
 * that lack them (called by the seeder and on source approval).
 *
 * When sqlite-vec is available (loaded in db.js) retrieve() uses the vec0 virtual
 * table KNN index for O(log N) approximate nearest-neighbour search instead of the
 * O(N·d) brute-force JS scan. The fallback to brute-force is preserved for
 * environments where the native extension is unavailable. Callers are unchanged.
 * (see docs/SCALE.md — vector-store migration path)
 */
const { embed, cosineSim, toBlob, fromBlob } = require('./coachEmbed');

// chunkId -> deserialized Float32Array. Used only by the brute-force fallback path;
// avoids re-allocating + re-parsing every chunk's embedding BLOB on every call.
// Invalidated on re-ingest below.
const _embCache = new Map();

// Module-level state for the vec0 virtual table.
// _hasSqliteVec: null = not yet probed, true/false = cached result.
// _initializedDim: the embedding dimension the current virtual table was built for.
// _stmtCache: Map<cacheKey, prepared-statement> for KNN queries to avoid re-PREPARE.
let _hasSqliteVec = null;
let _initializedDim = null;
const _stmtCache = new Map();

function _checkSqliteVec(db) {
  if (_hasSqliteVec !== null) return _hasSqliteVec;
  try {
    db.prepare('SELECT vec_version()').get();
    _hasSqliteVec = true;
  } catch (_) {
    _hasSqliteVec = false;
  }
  return _hasSqliteVec;
}

function _invalidateStmtCache() {
  _stmtCache.clear();
}

function _knnStmt(db, hasCourseId) {
  const key = hasCourseId ? 'knn_course' : 'knn_global';
  if (_stmtCache.has(key)) return _stmtCache.get(key);

  let sql = `
    SELECT c.id, c.text, c.source_id, s.title, s.url, s.pub_year, s.institution, v.distance
    FROM vec_eco_source_chunks v
    JOIN eco_source_chunks c ON c.id = v.id
    JOIN eco_sources s ON s.id = c.source_id
    WHERE v.embedding MATCH ?
      AND v.k = ?
      AND v.id IN (
        SELECT c2.id
        FROM eco_source_chunks c2
        JOIN eco_sources s2 ON s2.id = c2.source_id
        WHERE s2.status = 'approved'
  `;
  if (hasCourseId) sql += " AND (s2.course_id = ? OR s2.course_id = '')";
  sql += ')';

  const stmt = db.prepare(sql);
  _stmtCache.set(key, stmt);
  return stmt;
}

function ensureVectorTable(db, dim, forceSync = false) {
  if (_initializedDim === dim && !forceSync) return;
  if (!_checkSqliteVec(db)) return;

  const row = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'vec_eco_source_chunks'").get();
  let currentDim = null;
  if (row && row.sql) {
    const match = row.sql.match(/embedding float\[(\d+)\]/);
    if (match) currentDim = parseInt(match[1], 10);
  }

  if (currentDim !== dim) {
    // Dimension mismatch (e.g. switching from offline 4096-dim lexical to 1536-dim
    // OpenAI embeddings, or vice versa). Drop and rebuild the virtual table, then
    // bulk-insert all currently-embedded chunks.
    db.prepare('DROP TABLE IF EXISTS vec_eco_source_chunks').run();
    db.prepare(`
      CREATE VIRTUAL TABLE vec_eco_source_chunks USING vec0(
        id TEXT PRIMARY KEY,
        embedding float[${dim}] distance_metric=cosine
      )
    `).run();
    _invalidateStmtCache();

    const chunks = db.prepare('SELECT id, embedding FROM eco_source_chunks WHERE embedding IS NOT NULL').all();
    const insert = db.prepare('INSERT INTO vec_eco_source_chunks(id, embedding) VALUES(?, ?)');
    db.transaction((rows) => { for (const c of rows) insert.run(c.id, c.embedding); })(chunks);
  } else if (forceSync) {
    // Prune rows orphaned by CASCADE deletes outside ingestSourceChunks
    db.prepare('DELETE FROM vec_eco_source_chunks WHERE id NOT IN (SELECT id FROM eco_source_chunks)').run();

    // Back-fill any chunks that were added without going through ingestSourceChunks
    const missing = db.prepare(`
      SELECT c.id, c.embedding FROM eco_source_chunks c
      LEFT JOIN vec_eco_source_chunks v ON v.id = c.id
      WHERE c.embedding IS NOT NULL AND v.id IS NULL
    `).all();
    if (missing.length > 0) {
      const insert = db.prepare('INSERT INTO vec_eco_source_chunks(id, embedding) VALUES(?, ?)');
      db.transaction((rows) => { for (const c of rows) insert.run(c.id, c.embedding); })(missing);
    }
  }

  _initializedDim = dim;
}

async function ingestSourceChunks(db, sourceId) {
  const rows = db.prepare('SELECT id, text, embedding FROM eco_source_chunks WHERE source_id = ?').all(sourceId);
  const upd = db.prepare('UPDATE eco_source_chunks SET embedding = ? WHERE id = ?');
  let embedded = 0;
  for (const r of rows) {
    if (r.embedding) {
      // Already embedded — ensure the vec index carries this chunk (idempotent upsert).
      const v = fromBlob(r.embedding);
      if (v && _checkSqliteVec(db)) {
        ensureVectorTable(db, v.length);
        db.prepare('DELETE FROM vec_eco_source_chunks WHERE id = ?').run(r.id);
        db.prepare('INSERT INTO vec_eco_source_chunks(id, embedding) VALUES(?, ?)').run(r.id, r.embedding);
      }
      continue;
    }
    const v = await embed(r.text);
    const blob = toBlob(v);
    upd.run(blob, r.id);
    _embCache.delete(r.id);               // drop any stale cached vector for this chunk

    // Write into the vector index so the chunk is immediately retrievable.
    if (_checkSqliteVec(db)) {
      ensureVectorTable(db, v.length);
      db.prepare('DELETE FROM vec_eco_source_chunks WHERE id = ?').run(r.id);
      db.prepare('INSERT INTO vec_eco_source_chunks(id, embedding) VALUES(?, ?)').run(r.id, blob);
    }

    embedded++;
  }
  return embedded;
}

async function retrieve(db, queryText, { k = 5, courseId = null } = {}) {
  const q = await embed(queryText || '');

  if (_checkSqliteVec(db)) {
    try {
      ensureVectorTable(db, q.length);
      const stmt = _knnStmt(db, !!courseId);
      const params = courseId ? [toBlob(q), k, courseId] : [toBlob(q), k];
      const rows = stmt.all(...params);
      return rows.map(r => ({
        id: r.id,
        text: r.text,
        sourceId: r.source_id,
        title: r.title,
        url: r.url,
        pubYear: r.pub_year,
        institution: r.institution,
        // sqlite-vec returns cosine DISTANCE (0 = identical, 2 = opposite);
        // convert to cosine SIMILARITY so callers get the same [0,1] scale.
        score: 1 - r.distance,
      }));
    } catch (err) {
      console.error('sqlite-vec retrieve failed, falling back to brute-force:', err.message);
    }
  }

  // Brute-force JS fallback — used when sqlite-vec is unavailable or throws.
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
    // Provider drift guard: skip mismatched vectors so retrieval fail-closes to
    // "no corpus" instead of silently citing garbage from a different embedding model.
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

// Exposed for use in ingestResearchCorpus and tests that need to force-sync
// the vec index after bulk-inserting chunks directly into eco_source_chunks.
function syncVectorTable(db, dim) {
  ensureVectorTable(db, dim, true);
}

module.exports = { retrieve, ingestSourceChunks, syncVectorTable };

