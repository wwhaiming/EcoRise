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

// Startup self-check: when the coach is enabled, log (loudly) whether its corpus is
// actually retrievable, so a misconfigured deploy is visible in the boot logs instead
// of failing silently per request. Non-fatal by design — the coach surface 404s
// gracefully when disabled/empty, so we warn rather than refuse to boot.
if (process.env.COACH_ENABLED === 'true' && process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      const { retrieve } = require('./utils/coachRetrieval');
      const hits = await retrieve(getDb(), 'plastic bottle waste', { k: 3 });
      console.log(hits.length
        ? `✅ Coach retrieval self-check: ${hits.length} chunks for a probe query`
        : '⚠️  COACH_ENABLED but retrieval returned 0 chunks — run: npm run seed:coach');
    } catch (e) { console.error('coach self-check error:', e.message); }
  })();
}

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/coach', require('./routes/coach'));   // gated behind COACH_ENABLED (see docs/AI_ECO_COACH_PLAN.md)
app.use('/api/leaderboards', require('./routes/leaderboard'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/trash', require('./routes/trashspotter'));
app.use('/api/users', require('./routes/users'));
app.use('/api/privacy', require('./routes/privacy'));   // consent, retention policy, review, export/delete, model card

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

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
  });
  const interval = setInterval(() => {
    try { runDueResets(getDb()); } catch (e) { console.error('reset job error:', e.message); }
    try { purgeExpiredImages(getDb()); } catch (e) { console.error('image purge error:', e.message); }
  }, 60 * 1000);
  interval.unref();
}

module.exports = app;
