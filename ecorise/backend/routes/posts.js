/* EcoRise — Post routes (feed, likes, comments, reports) */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { upload, fileToBase64 } = require('../middleware/upload');
const { aiRateLimit } = require('../middleware/rateLimit');
const { analyzeEcoAction, checkQuestMatch } = require('../utils/aiClient');
const { processEcoAction } = require('../utils/pointsEngine');

const router = express.Router();

// POST /api/posts — create post with image upload + AI analysis
router.post('/', authMiddleware, upload.single('image'), aiRateLimit, async (req, res) => {
  try {
    const { caption, leaderboardId, tags, miles } = req.body;
    const image = req.file ? fileToBase64(req.file) : (req.body.image || '');

    // AI analysis
    let aiResult;
    if (image && image.startsWith('data:')) {
      aiResult = await analyzeEcoAction(image);
    } else {
      // No image — use manual action data
      aiResult = {
        actionType: req.body.actionType || 'other',
        specificAction: req.body.actionDesc || 'Eco action',
        estimatedCO2Saved: parseFloat(req.body.co2Saved) || 0,
        requiresFollowUp: false,
      };
    }

    // If AI needs follow-up and no miles provided, return the question
    if (aiResult.requiresFollowUp && !miles) {
      return res.json({
        needsFollowUp: true,
        aiResult,
        followUpQuestion: aiResult.followUpQuestion,
      });
    }

    // Process action through points engine
    const taggedUserIds = tags ? JSON.parse(tags) : [];
    const result = processEcoAction({
      userId: req.userId,
      leaderboardId,
      aiResult,
      miles: parseFloat(miles) || 0,
      caption,
      image,
      taggedUserIds,
    });

    // Check quest match
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    const activeQuests = db.prepare(
      'SELECT * FROM quests WHERE user_id = ? AND date = ? AND completed = 0'
    ).all(req.userId, today);

    let questUpdate = null;
    if (activeQuests.length > 0) {
      const match = await checkQuestMatch(aiResult, activeQuests);
      if (match.matchedQuestId) {
        db.prepare(
          'UPDATE quests SET progress = MIN(goal, progress + 1), completed = CASE WHEN progress + 1 >= goal THEN 1 ELSE 0 END WHERE id = ?'
        ).run(match.matchedQuestId);
        questUpdate = match;
      }
    }

    res.json({
      success: true,
      postId: result.postId,
      points: result.points,
      breakdown: result.breakdown,
      explanation: result.explanation,
      aiResult,
      questUpdate,
      aiRemaining: req.aiRemaining,
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts — get feed
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId, limit = 20, offset = 0 } = req.query;

    let posts;
    if (leaderboardId) {
      posts = db.prepare(`
        SELECT p.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked
        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.leaderboard_id = ? AND p.hidden = 0
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.userId, leaderboardId, parseInt(limit), parseInt(offset));
    } else {
      posts = db.prepare(`
        SELECT p.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked
        FROM posts p
        JOIN users u ON u.id = p.user_id
        WHERE p.hidden = 0
        ORDER BY p.created_at DESC
        LIMIT ? OFFSET ?
      `).all(req.userId, parseInt(limit), parseInt(offset));
    }

    res.json({ posts: posts.map(p => ({ ...p, liked: p.liked > 0 })) });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/like — toggle like
router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.userId);
      res.json({ liked: false });
    } else {
      db.prepare('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.userId);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/comment
router.post('/:id/comment', authMiddleware, (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Comment text required' });

    const db = getDb();
    const id = uuid();
    db.prepare('INSERT INTO comments (id, post_id, user_id, text) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.userId, text.trim());

    // Check for @mentions and create notifications
    const mentions = text.match(/@[\w.]+/g) || [];
    for (const mention of mentions) {
      const handle = mention;
      const mentioned = db.prepare('SELECT id FROM users WHERE handle = ?').get(handle);
      if (mentioned) {
        const user = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
        db.prepare('INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)').run(
          uuid(), mentioned.id, 'mention',
          `${user?.name || 'Someone'} mentioned you in a comment`
        );
      }
    }

    res.json({ id, text: text.trim() });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts/:id/comments
router.get('/:id/comments', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const comments = db.prepare(`
      SELECT c.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar
      FROM comments c JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(req.params.id);
    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/report
router.post('/:id/report', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE posts SET reported = reported + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Post reported to moderators' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/:id/resolve — dismiss report (reset reported to 0)
router.post('/:id/resolve', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE posts SET reported = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Post report resolved' });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/posts/:id — organizer removes post
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE posts SET hidden = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
