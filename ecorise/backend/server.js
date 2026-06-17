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

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);

const ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173').split(',');
app.use(cors({ origin: ORIGINS, credentials: true }));
app.use(express.json({ limit: '9mb' }));
app.use(express.urlencoded({ extended: true, limit: '9mb' }));
app.use(cookieParser());
app.use(csrfGuard);

app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false }));

getDb();
console.log('✅ Database initialized');

app.use('/api/auth', authLimiter, require('./routes/auth'));
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
    console.log(`🌱 EcoRise API running on http://localhost:${PORT}`);
    console.log(`   AI mode: ${process.env.OPENAI_API_KEY ? 'LIVE (GPT-4o-mini)' : 'MOCK / local model'}`);
  });
  const interval = setInterval(() => {
    try { runDueResets(getDb()); } catch (e) { console.error('reset job error:', e.message); }
  }, 60 * 1000);
  interval.unref();
}

module.exports = app;
