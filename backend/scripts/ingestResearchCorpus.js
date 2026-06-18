/* EcoRise — Research corpus ingester.
 *
 *   node scripts/ingestResearchCorpus.js      (or: npm run seed:research)
 *
 * Loads research-paper-dataset/papers.json (1000 OpenAlex papers) and inserts each
 * as an APPROVED eco_sources row (provenance 'research_dataset') with one abstract
 * chunk, then BATCH-embeds every chunk via OpenAI text-embedding-3-small so the Coach
 * can retrieve cited answers from real research.
 *
 * Idempotent + safe: only ever deletes/rebuilds rows whose provenance is
 * 'research_dataset' — never touches uploaded sources or the synthetic_demo corpus.
 * Embeddings are batched (array input) so 1000 papers cost ~8 requests, not 1000.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { toBlob } = require('../utils/coachEmbed');

const DATA = path.join(__dirname, '..', '..', 'research-paper-dataset', 'papers.json');
const PROVENANCE = 'research_dataset';
const EMBED_MODEL = process.env.OPENAI_EMBED_MODEL || 'text-embedding-3-small';
const BATCH = 256;

function normalize(arr) {
  const v = Float32Array.from(arr);
  let n = 0;
  for (let i = 0; i < v.length; i++) n += v[i] * v[i];
  n = Math.sqrt(n) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= n;
  return v;
}

async function embedBatch(client, texts) {
  const r = await client.embeddings.create({ model: EMBED_MODEL, input: texts.map(t => String(t || '').slice(0, 8000)) });
  return r.data.map(d => normalize(d.embedding));
}

async function ingest(db) {
  const { papers } = require(DATA);
  if (!Array.isArray(papers) || !papers.length) throw new Error('no papers in dataset');

  // Reset ONLY this dataset's rows (never uploaded / synthetic_demo sources).
  const reset = db.transaction(() => {
    const old = db.prepare("SELECT id FROM eco_sources WHERE provenance = ?").all(PROVENANCE);
    const delC = db.prepare('DELETE FROM eco_source_chunks WHERE source_id = ?');
    for (const s of old) delC.run(s.id);
    db.prepare("DELETE FROM eco_sources WHERE provenance = ?").run(PROVENANCE);
  });
  reset();

  const insSrc = db.prepare(`INSERT INTO eco_sources
    (id, title, authors, institution, url, provenance, license, pub_year, topic_tags, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')`);
  const insChunk = db.prepare(`INSERT INTO eco_source_chunks
    (id, source_id, ord, text, token_count, topic_tags) VALUES (?, ?, 0, ?, ?, ?)`);

  // One chunk per paper = "<title>. <abstract>" (title gives retrieval + citation context).
  const chunkRows = []; // { id, text }
  const insertAll = db.transaction(() => {
    for (const p of papers) {
      const sid = uuid();
      const cid = uuid();
      const tags = JSON.stringify([p.topic].filter(Boolean));
      const text = `${p.title || ''}. ${p.abstract || ''}`.trim().slice(0, 4000);
      insSrc.run(sid, p.title || 'Untitled', (p.authors || []).join(', '),
        p.venue || '', p.url || p.doi || '', PROVENANCE, p.openAccess ? 'open-access' : '',
        Number.isFinite(Number(p.year)) ? Number(p.year) : null, tags);
      insChunk.run(cid, sid, text, Math.round(text.split(/\s+/).length * 1.3), tags);
      chunkRows.push({ id: cid, text });
    }
  });
  insertAll();

  // Batch-embed every chunk and store normalized Float32 blobs.
  const hasKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'));
  const client = hasKey ? new (require('openai'))({ apiKey: process.env.OPENAI_API_KEY }) : null;
  const { deterministicEmbed } = require('../utils/coachEmbed');
  const upd = db.prepare('UPDATE eco_source_chunks SET embedding = ? WHERE id = ?');
  let embedded = 0;

  let useLexicalFallback = !client;
  if (client) {
    try {
      for (let i = 0; i < chunkRows.length; i += BATCH) {
        const slice = chunkRows.slice(i, i + BATCH);
        const vecs = await embedBatch(client, slice.map(r => r.text));
        const writeBatch = db.transaction(() => {
          slice.forEach((r, j) => { upd.run(toBlob(vecs[j]), r.id); embedded++; });
        });
        writeBatch();
        process.stderr.write(`  embedded ${embedded}/${chunkRows.length}\r`);
      }
    } catch (err) {
      console.warn('\n⚠️  Batch embedding failed, falling back to offline lexical embeddings:', err.message);
      useLexicalFallback = true;
    }
  }

  if (useLexicalFallback) {
    // Deterministic offline embedding fallback
    const writeBatch = db.transaction(() => {
      for (const r of chunkRows) {
        const v = deterministicEmbed(r.text);
        upd.run(toBlob(v), r.id);
        embedded++;
      }
    });
    writeBatch();
  }

  // Force virtual table sync for sqlite-vec
  const { syncVectorTable } = require('../utils/coachRetrieval');
  const { fromBlob } = require('../utils/coachEmbed');
  if (chunkRows.length > 0) {
    const firstChunk = db.prepare('SELECT embedding FROM eco_source_chunks WHERE id = ?').get(chunkRows[0].id);
    if (firstChunk && firstChunk.embedding) {
      const v = fromBlob(firstChunk.embedding);
      if (v) syncVectorTable(db, v.length);
    }
  }

  return { sources: papers.length, chunks: chunkRows.length, embedded };
}

if (require.main === module) {
  (async () => {
    const hasKey = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-'));
    if (!hasKey) {
      console.log('⚠️  OPENAI_API_KEY not set or invalid SK format. Using offline deterministic lexical embeddings.');
    }
    const r = await ingest(getDb());
    console.log(`\n📚 Research corpus ingested: ${r.sources} approved sources, ${r.chunks} chunks, ${r.embedded} embedded.`);
  })().then(() => process.exit(0)).catch((e) => { console.error('\nIngest failed:', e.message); process.exit(1); });
}

module.exports = { ingest };
