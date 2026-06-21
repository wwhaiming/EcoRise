/* EcoRise — Express API Server */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { getDb } = require('./db');
const { csrfGuard } = require('./middleware/csrf');
const { authLimiter } = require('./middleware/rateLimit');
const { runDueResets } = require('./utils/seasons');
const { purgeExpiredImages } = require('./utils/privacy');

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const localDevOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
function allowOrigin(origin, cb) {
  if (!origin) return cb(null, true);
  if (configuredOrigins.includes(origin)) return cb(null, true);
  if (process.env.NODE_ENV !== 'production' && localDevOrigin.test(origin)) return cb(null, true);
  return cb(null, false);
}
app.use(cors({ origin: allowOrigin, credentials: true }));
app.use(express.json({ limit: '9mb' }));
app.use(express.urlencoded({ extended: true, limit: '9mb' }));
app.use(cookieParser());
app.use(csrfGuard);

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

getDb();
// Sweep any retention-expired images on boot (24h-mode photos that lapsed while down).
try {
  const purged = purgeExpiredImages(getDb());
  if (purged.posts || purged.trash) console.log(`🧹 Purged expired images: ${purged.posts} posts, ${purged.trash} trash`);
} catch (e) { console.error('startup purge error:', e.message); }
console.log('✅ Database initialized');

// Auto-seed footprint synthetic data if tables are empty (Direction B demo).
try {
  const fpCount = getDb().prepare('SELECT COUNT(*) as c FROM fp_cafeteria').get();
  if (!fpCount || fpCount.c === 0) {
    require('./scripts/seedFootprint');
    console.log('✅ Footprint seed ran on startup');
  }
} catch (e) { console.error('footprint seed error:', e.message); }

// Hosted interactive demo: seed the demo board + account on boot so a fresh,
// ephemeral host filesystem comes up already populated (same data as `npm run demo`).
// Gated on DEMO_MODE so this never runs on a normal deploy. Idempotent: only seeds
// when the demo account is absent.
if (process.env.DEMO_MODE === 'true') {
  try {
    const { seed: seedDemo, DEMO_EMAIL } = require('./scripts/seedDemo');
    const exists = getDb().prepare('SELECT 1 FROM users WHERE email = ?').get(DEMO_EMAIL);
    if (!exists) {
      seedDemo();
      console.log('✅ Demo board + account seeded on startup (DEMO_MODE)');
    }
  } catch (e) { console.error('demo seed error:', e.message); }
}

// Startup self-check: when the coach is enabled, log (loudly) whether its corpus is
// actually retrievable, so a misconfigured deploy is visible in the boot logs instead
// of failing silently per request. Non-fatal by design — the coach surface 404s
// gracefully when disabled/empty, so we warn rather than refuse to boot.
if (process.env.COACH_ENABLED === 'true' && process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      const { retrieve } = require('./utils/coachRetrieval');
      let hits = await retrieve(getDb(), 'plastic bottle waste', { k: 3 });
      // Auto-seed the demo corpus on boot if it's empty, so a fresh hosted deploy
      // has a retrievable corpus without a manual `npm run seed:coach` shell step.
      if (!hits.length) {
        try {
          const { seedCoachCorpus } = require('./scripts/seedCoachCorpus');
          const r = await seedCoachCorpus(getDb());
          console.log(`✅ Coach corpus seeded on startup: ${r.sources} sources, ${r.chunks} chunks, ${r.embedded} embedded`);
          hits = await retrieve(getDb(), 'plastic bottle waste', { k: 3 });
        } catch (e) { console.error('coach corpus seed-on-boot error:', e.message); }
      }
      console.log(hits.length
        ? `✅ Coach retrieval self-check: ${hits.length} chunks for a probe query`
        : '⚠️  COACH_ENABLED but retrieval returned 0 chunks — run: npm run seed:coach');
    } catch (e) { console.error('coach self-check error:', e.message); }
  })();
}

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/coach', require('./routes/coach'));   // gated behind COACH_ENABLED (see docs/AI_ECO_COACH_PLAN.md)
app.use('/api/footprint', require('./routes/footprint')); // Direction B: School Hidden Footprint Insights
app.use('/api/leaderboards', require('./routes/leaderboard'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/trash', require('./routes/trashspotter'));
app.use('/api/users', require('./routes/users'));
app.use('/api/privacy', require('./routes/privacy'));   // consent, retention policy, review, export/delete, model card

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Single-host hosting: serve the built frontend (frontend/dist) from the same origin
// as the API. Same-origin means the httpOnly session cookie (sameSite=lax) just works,
// with no CORS. Unknown /api/* paths fall through to the JSON 404/error handler; every
// other GET returns index.html so client-side routing works on refresh/deep-link.
{
  const path = require('path');
  const fs = require('fs');
  const distDir = path.join(__dirname, '..', 'frontend', 'dist');
  if (fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
    console.log('✅ Serving frontend from frontend/dist (single-host)');
  } else {
    console.log('ℹ️  frontend/dist not found — API-only mode (run npm run build to serve the UI)');
  }
}

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  if (err?.message?.includes('Invalid file type')) return res.status(400).json({ error: err.message });
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌱 EcoRise API running on http://localhost:${PORT}`);
    const aiMode = process.env.OPENAI_API_KEY ? `LIVE (OpenAI ${process.env.ECO_MODEL || 'gpt-4o-mini'})`
      : 'MOCK / local model';
    console.log(`   AI mode: ${aiMode}`);
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) console.warn('⚠️  OPENAI_API_KEY is set but does not look like a valid key (expected "sk-" prefix)');
  });
  const interval = setInterval(() => {
    try { runDueResets(getDb()); } catch (e) { console.error('reset job error:', e.message); }
    try { purgeExpiredImages(getDb()); } catch (e) { console.error('image purge error:', e.message); }
  }, 60 * 1000);
  interval.unref();
}

module.exports = app;
