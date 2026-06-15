/* EcoRise — Rate limiting middleware for AI endpoints */

// In-memory store: { [userId]: { count, resetAt } }
const limits = new Map();
const MAX_PER_DAY = 20;

function aiRateLimit(req, res, next) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'Auth required' });

  const now = Date.now();
  let entry = limits.get(userId);

  if (!entry || now > entry.resetAt) {
    // Reset at midnight
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

module.exports = { aiRateLimit };
