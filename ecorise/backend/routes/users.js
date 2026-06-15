/* EcoRise — User routes */
const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/users/:id — get user profile
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, handle, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Get total points across all leaderboards
    const totalPoints = db.prepare('SELECT COALESCE(SUM(points), 0) as total FROM leaderboard_members WHERE user_id = ?').get(req.params.id)?.total || 0;

    // Get badges
    const badges = db.prepare('SELECT badge_type, earned_at FROM badges WHERE user_id = ?').all(req.params.id);

    // Get post count
    const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(req.params.id)?.c || 0;

    // Get total CO2 saved
    const co2Total = db.prepare('SELECT COALESCE(SUM(co2_saved), 0) as total FROM posts WHERE user_id = ?').get(req.params.id)?.total || 0;

    res.json({
      user: {
        ...user,
        totalPoints,
        badges,
        postCount,
        co2Saved: Math.round(co2Total * 10) / 10,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id — update profile
router.put('/:id', authMiddleware, (req, res) => {
  try {
    if (req.params.id !== req.userId) return res.status(403).json({ error: 'Cannot edit other users' });

    const db = getDb();
    const { name, handle, avatar } = req.body;

    if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.userId);
    if (handle) db.prepare('UPDATE users SET handle = ? WHERE id = ?').run(handle, req.userId);
    if (avatar) db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.userId);

    res.json({ success: true });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id/notifications
router.get('/:id/notifications', authMiddleware, (req, res) => {
  try {
    if (req.params.id !== req.userId) return res.status(403).json({ error: 'Cannot view others\' notifications' });

    const db = getDb();
    const notifs = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
    res.json({ notifications: notifs });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
