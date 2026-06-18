/* EcoRise — Rate limiting middleware */
const rateLimit = require('express-rate-limit');

// Per-user daily cap on AI analyses (in-memory; swap for Redis in production).
const limits = new Map();
const MAX_PER_DAY = Number(process.env.AI_MAX_PER_DAY || 20);

// Evict expired per-user counters so the map does not grow unbounded for every user
// that ever called an AI endpoint. unref() so this never keeps the process alive
// (e.g. under the test runner).
const _sweep = setInterval(() => {
  const now = Date.now();
  for (const [k, v] of limits) if (now > v.resetAt) limits.delete(k);
}, 60 * 60 * 1000);
if (_sweep.unref) _sweep.unref();

function aiRateLimit(req, res, next) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Auth required' });

  const now = Date.now();
  let entry = limits.get(userId);
  if (!entry || now > entry.resetAt) {
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    entry = { count: 0, resetAt: tomorrow.getTime() };
  }
  if (entry.count >= MAX_PER_DAY) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Maximum ${MAX_PER_DAY} AI analyses per day. Resets at midnight.`,
      remaining: 0,
    });
  }
  entry.count++;
  limits.set(userId, entry);
  req.aiRemaining = MAX_PER_DAY - entry.count;
  next();
}

// Brute-force guard for auth endpoints (per IP).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: Number(process.env.AUTH_MAX_PER_WINDOW || 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Try again later.' },
});

module.exports = { aiRateLimit, authLimiter, _limits: limits };

