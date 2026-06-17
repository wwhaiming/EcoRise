/* GeoRise — Express API Server */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { getDb } = require('./db');
const { csrfGuard } = require('./middleware/csrf');
const { authLimiter } = require('./middleware/rateLimit');
const { runDueResets } = require('./utils/seasons');

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
console.log('✅ Database initialized');

app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/coach', require('./routes/coach'));   // gated behind COACH_ENABLED (see docs/AI_ECO_COACH_PLAN.md)
app.use('/api/leaderboards', require('./routes/leaderboard'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/trash', require('./routes/trashspotter'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, next) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'Payload too large' });
  if (err?.message?.includes('Invalid file type')) return res.status(400).json({ error: err.message });
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🌱 GeoRise API running on http://localhost:${PORT}`);
    const aiMode = process.env.ANTHROPIC_API_KEY ? 'LIVE (Claude)'
      : (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) ? `LIVE (Gemini ${process.env.GEMINI_MODEL || 'gemini-2.0-flash'})`
      : 'MOCK / local model';
    console.log(`   AI mode: ${aiMode}`);
  });
  const interval = setInterval(() => {
    try { runDueResets(getDb()); } catch (e) { console.error('reset job error:', e.message); }
  }, 60 * 1000);
  interval.unref();
}

module.exports = app;
