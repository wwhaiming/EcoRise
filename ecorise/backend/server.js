/* EcoRise — Express API Server */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { getDb } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Global rate limit
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ── Initialize database ──
getDb();
console.log('✅ Database initialized');

// ── Routes ──
app.use('/api/auth', require('./routes/auth'));
app.use('/api/leaderboards', require('./routes/leaderboard'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/quests', require('./routes/quests'));
app.use('/api/trash', require('./routes/trashspotter'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  if (err.message?.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──
app.listen(PORT, () => {
  console.log(`🌱 EcoRise API running on http://localhost:${PORT}`);
  console.log(`   AI mode: ${process.env.ANTHROPIC_API_KEY ? 'LIVE (Claude)' : 'MOCK (no API key)'}`);
});
