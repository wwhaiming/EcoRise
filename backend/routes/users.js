/* EcoRise — User routes */
const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('../utils/validate');

const router = express.Router();

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const user = db.prepare('SELECT id, name, handle, avatar, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const totalPoints = db.prepare('SELECT COALESCE(SUM(points),0) as total FROM leaderboard_members WHERE user_id = ?').get(req.params.id)?.total || 0;
    const badges = db.prepare('SELECT badge_type, earned_at FROM badges WHERE user_id = ?').all(req.params.id);
    const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(req.params.id)?.c || 0;
    const co2Total = db.prepare('SELECT COALESCE(SUM(co2_saved),0) as total FROM posts WHERE user_id = ?').get(req.params.id)?.total || 0;
    res.json({ user: { ...user, totalPoints, badges, postCount, co2Saved: Math.round(co2Total * 10) / 10 } });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, body('updateUser'), (req, res) => {
  try {
    if (req.params.id !== req.userId) return res.status(403).json({ error: 'Cannot edit other users' });
    const db = getDb();
    const { name, handle, avatar } = req.valid;
    if (name) db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.userId);
    if (handle) {
      const norm = handle.startsWith('@') ? handle : '@' + handle;
      const taken = db.prepare('SELECT id FROM users WHERE handle = ? AND id != ?').get(norm, req.userId);
      if (taken) return res.status(409).json({ error: 'Handle already taken' });
      db.prepare('UPDATE users SET handle = ? WHERE id = ?').run(norm, req.userId);
    }
    if (avatar) db.prepare('UPDATE users SET avatar = ? WHERE id = ?').run(avatar, req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/notifications', authMiddleware, (req, res) => {
  try {
    if (req.params.id !== req.userId) return res.status(403).json({ error: "Cannot view others' notifications" });
    const db = getDb();
    const notifications = db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50').all(req.userId);
    const unread = db.prepare('SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND read = 0').get(req.userId)?.c || 0;
    res.json({ notifications, unread });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/:id/notifications/read — mark all read
router.post('/:id/notifications/read', authMiddleware, (req, res) => {
  try {
    if (req.params.id !== req.userId) return res.status(403).json({ error: 'Forbidden' });
    const db = getDb();
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.userId);
    res.json({ success: true });
  } catch (err) {
    console.error('Mark notifications read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

