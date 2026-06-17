/* GeoRise — AI Eco Coach demo corpus seeder (Phase 0-1).
 *
 *   node scripts/seedCoachCorpus.js     (or: npm run seed:coach)
 *
 * Inserts a tiny, APPROVED, source-cited corpus and embeds its chunks so the Coach
 * can retrieve from trustworthy material without ingesting real papers during a
 * sprint. Embeddings use Gemini text-embedding-004 if a key is present, else a
 * deterministic offline vector (see utils/coachEmbed.js).
 *
 * Safe + idempotent: it only ever deletes and rebuilds rows whose provenance is
 * 'synthetic_demo', so it can never clobber real uploaded sources.
 */
const { v4: uuid } = require('uuid');
const { ingestSourceChunks } = require('../utils/coachRetrieval');

// Short, factually-general passages tied to GeoRise's real action categories.
const SOURCES = [
  {
    title: 'Campus Waste Reduction Guide',
    institution: 'GeoRise Demo Corpus',
    license: 'CC-BY (demo)',
    pubYear: 2024,
    topicTags: ['waste', 'plastic', 'school'],
    chunks: [
      'Single-use plastic bottles require fossil-fuel feedstock and energy to produce, fill, and transport. Replacing them with a refillable bottle avoids that repeated production footprint. In a cafeteria, the largest gains come from displacing the highest-volume disposables such as drink bottles and utensils.',
      'A reusable water bottle reduces plastic waste only for the single-use items it actually displaces. Crediting bottles that were genuinely avoided, rather than bottle ownership, keeps any impact estimate honest and hard to game.',
    ],
  },
  {
    title: 'Everyday Climate Actions Overview',
    institution: 'GeoRise Demo Corpus',
    license: 'CC-BY (demo)',
    pubYear: 2024,
    topicTags: ['transportation', 'food', 'energy'],
    chunks: [
      'Short car trips emit more per mile than longer ones because a cold engine runs less efficiently. Replacing a short solo car trip with biking, walking, or transit avoids those tailpipe emissions, and public transit emits far less per passenger-mile than a single-occupancy car.',
      'Food choices drive a large share of personal emissions. Beef has a much higher per-serving footprint than poultry or plant proteins, so replacing a beef meal with a plant-based meal yields the largest per-meal reduction.',
    ],
  },
];

async function seedCoachCorpus(db) {
  const result = db.transaction(() => {
    // Reset ONLY the synthetic demo corpus (never real uploaded sources).
    const demo = db.prepare("SELECT id FROM eco_sources WHERE provenance = 'synthetic_demo'").all();
    const delChunks = db.prepare('DELETE FROM eco_source_chunks WHERE source_id = ?');
    for (const s of demo) delChunks.run(s.id);
    db.prepare("DELETE FROM eco_sources WHERE provenance = 'synthetic_demo'").run();

    const insSrc = db.prepare(`INSERT INTO eco_sources
      (id, title, authors, institution, url, provenance, license, pub_year, topic_tags, status)
      VALUES (?, ?, '', ?, '', 'synthetic_demo', ?, ?, ?, 'approved')`);
    const insChunk = db.prepare(`INSERT INTO eco_source_chunks
      (id, source_id, ord, text, token_count, topic_tags) VALUES (?, ?, ?, ?, ?, ?)`);

    const sourceIds = [];
    let chunks = 0;
    for (const s of SOURCES) {
      const sid = uuid();
      insSrc.run(sid, s.title, s.institution, s.license, s.pubYear, JSON.stringify(s.topicTags));
      sourceIds.push(sid);
      s.chunks.forEach((text, i) => {
        insChunk.run(uuid(), sid, i, text, Math.round(text.split(/\s+/).length * 1.3), JSON.stringify(s.topicTags));
        chunks++;
      });
    }
    return { sources: sourceIds.length, chunks, sourceIds };
  })();

  // Embed outside the write transaction (embed() may be async/network).
  let embedded = 0;
  for (const sid of result.sourceIds) embedded += await ingestSourceChunks(db, sid);
  return { sources: result.sources, chunks: result.chunks, embedded };
}

module.exports = { seedCoachCorpus };

if (require.main === module) {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
  const { getDb } = require('../db');
  (async () => {
    const r = await seedCoachCorpus(getDb());
    console.log(`\n📚 Coach demo corpus seeded: ${r.sources} approved sources, ${r.chunks} chunks, ${r.embedded} embedded.`);
    console.log('   (enable the feature with COACH_ENABLED=true)\n');
  })().then(() => process.exit(0)).catch((err) => {
    console.error('Coach corpus seed failed:', err.message);
    process.exit(1);
  });
}

