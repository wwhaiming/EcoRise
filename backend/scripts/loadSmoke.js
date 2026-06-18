#!/usr/bin/env node
/* EcoRise — retrieval smoke load test.
 *
 *   node scripts/loadSmoke.js [N]     (or: npm run loadtest)
 *
 * Times N retrieve() calls over the seeded coach corpus and reports throughput +
 * latency percentiles. Uses sqlite-vec KNN when the native extension is loaded, and
 * falls back to brute-force cosine otherwise. Fully offline (deterministic embeddings);
 * uses a throwaway DB. This is what backs the honest numbers in docs/SCALE.md —
 * re-run to refresh them. NOT a production benchmark, but a real measurement.
 */
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'load-secret-' + 'x'.repeat(40);
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = '';                 // offline deterministic embeddings
process.env.DATABASE_URL = path.join(__dirname, `loadsmoke-${process.pid}.db`);

const { getDb } = require('../db');
const { retrieve } = require('../utils/coachRetrieval');
const { seedCoachCorpus } = require('./seedCoachCorpus');

const N = Math.max(1, Number(process.argv[2] || 500));
const QUERIES = [
  'plastic bottle waste reduction in a cafeteria',
  'biking instead of driving a short trip',
  'plant-based meal versus beef footprint',
  'reusable bottle displaces single-use plastic',
  'public transit emissions per passenger mile',
];

(async () => {
  const db = getDb();
  await seedCoachCorpus(db);
  const chunks = db.prepare('SELECT COUNT(*) c FROM eco_source_chunks').get().c;

  // warm the embedding cache so we measure steady-state retrieval, not first-touch parse
  await retrieve(db, QUERIES[0], { k: 5 });

  const times = [];
  for (let i = 0; i < N; i++) {
    const t0 = process.hrtime.bigint();
    await retrieve(db, QUERIES[i % QUERIES.length], { k: 5 });
    times.push(Number(process.hrtime.bigint() - t0) / 1e6); // ms
  }
  times.sort((a, b) => a - b);
  const pct = (q) => times[Math.min(times.length - 1, Math.floor(q * times.length))];
  const totalMs = times.reduce((a, b) => a + b, 0);

  const backend = (() => { try { require('../db').getDb().prepare('SELECT vec_version()').get(); return 'sqlite-vec KNN'; } catch (_) { return 'brute-force cosine'; } })();
  console.log(`retrieve() x${N} over ${chunks} approved chunks (${backend}, offline)`);
  console.log(`  throughput: ${(N / (totalMs / 1000)).toFixed(0)} queries/sec`);
  console.log(`  latency ms: p50=${pct(0.5).toFixed(3)}  p95=${pct(0.95).toFixed(3)}  max=${times[times.length - 1].toFixed(3)}`);

  for (const f of [process.env.DATABASE_URL, process.env.DATABASE_URL + '-shm', process.env.DATABASE_URL + '-wal']) {
    try { fs.existsSync(f) && fs.unlinkSync(f); } catch (_) { /* best effort cleanup */ }
  }
})().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
