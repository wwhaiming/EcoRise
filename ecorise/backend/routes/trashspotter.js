/* EcoRise — Trash Spotter routes */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { upload, fileToBase64 } = require('../middleware/upload');
const { aiRateLimit } = require('../middleware/rateLimit');
const { rateTrashSeverity } = require('../utils/aiClient');
const { awardPoints } = require('../utils/pointsEngine');

const router = express.Router();

// POST /api/trash — upload trash photo + AI severity rating
router.post('/', authMiddleware, upload.single('image'), aiRateLimit, async (req, res) => {
  try {
    const { location, leaderboardId } = req.body;
    const image = req.file ? fileToBase64(req.file) : (req.body.image || '');

    // AI severity analysis
    let severity;
    if (image && image.startsWith('data:')) {
      severity = await rateTrashSeverity(image);
    } else {
      severity = { score: 5, description: 'Moderate litter accumulation.', estimatedItems: '10-15 items', isMock: true };
    }

    const points = 35 + severity.score * 5;
    const id = uuid();
    const db = getDb();

    db.prepare(`
      INSERT INTO trash_reports (id, user_id, leaderboard_id, image, severity, description, estimated_items, location, points)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.userId, leaderboardId || null, image, severity.score, severity.description, severity.estimatedItems || '', location || '', points);

    // Also create a post for the feed
    const postId = uuid();
    db.prepare(`
      INSERT INTO posts (id, user_id, leaderboard_id, image, action_type, action_desc, co2_saved, points, caption)
      VALUES (?, ?, ?, ?, 'nature', 'Trash report', 0.5, ?, ?)
    `).run(postId, req.userId, leaderboardId || null, image, points, `Trash spotted${location ? ' at ' + location : ''} — severity ${severity.score}/10`);

    // Award points
    awardPoints(req.userId, leaderboardId, points);

    res.json({
      success: true,
      reportId: id,
      postId,
      severity: severity.score,
      description: severity.description,
      estimatedItems: severity.estimatedItems,
      points,
      aiRemaining: req.aiRemaining,
    });
  } catch (err) {
    console.error('Trash report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/trash — get trash reports
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId } = req.query;

    let reports;
    if (leaderboardId) {
      reports = db.prepare(`
        SELECT tr.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar
        FROM trash_reports tr JOIN users u ON u.id = tr.user_id
        WHERE tr.leaderboard_id = ?
        ORDER BY tr.created_at DESC
      `).all(leaderboardId);
    } else {
      reports = db.prepare(`
        SELECT tr.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar
        FROM trash_reports tr JOIN users u ON u.id = tr.user_id
        WHERE tr.user_id = ?
        ORDER BY tr.created_at DESC
      `).all(req.userId);
    }

    res.json({ reports });
  } catch (err) {
    console.error('Get trash reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
