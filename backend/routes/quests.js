/* GeoRise — Quest routes */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { generateDailyQuests } = require('../utils/aiClient');
const { body } = require('../utils/validate');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);
    let quests = db.prepare('SELECT * FROM quests WHERE user_id = ? AND date = ?').all(req.userId, today);

    if (quests.length === 0) {
      // Personalize from the user's real last-30-day behavior: push them toward
      // categories they have neglected, build on their strongest habit.
      const recentActions = db.prepare(`
        SELECT action_type AS actionType, COUNT(*) AS count, MAX(created_at) AS lastDoneAt
        FROM posts WHERE user_id = ? AND created_at > datetime('now','-30 days')
        GROUP BY action_type ORDER BY count DESC`).all(req.userId);
      const ALL_CATS = ['transportation', 'waste', 'energy', 'food', 'nature'];
      const done = new Set(recentActions.map(r => r.actionType));
      const weakSpots = ALL_CATS.filter(c => !done.has(c));
      const topCategory = recentActions[0]?.actionType || null;
      const generated = await generateDailyQuests({ userId: req.userId, recentActions, weakSpots, topCategory });
      const insert = db.prepare(`
        INSERT INTO quests (id, user_id, title, description, action_type, target_details, points_base, goal, progress, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);
      const insertMany = db.transaction((items) => {
        for (const q of items) insert.run(uuid(), req.userId, q.title, q.description, q.actionType, q.targetDetails || '', q.pointsBase || 50, 1, today);
      });
      insertMany(generated.slice(0, 5));
      quests = db.prepare('SELECT * FROM quests WHERE user_id = ? AND date = ?').all(req.userId, today);
    }
    res.json({ quests });
  } catch (err) {
    console.error('Get quests error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/quests/:id/progress — advance progress / mark complete.
// ANTI-CHEAT: this endpoint never mints leaderboard points. Quest rewards (2x)
// are granted only by logging a real matching action via POST /api/posts, which
// the server verifies with the AI gate. This stops "complete a quest" point farming.
router.post('/:id/progress', authMiddleware, body('questProgress'), (req, res) => {
  try {
    const db = getDb();
    const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (quest.completed) return res.json({ message: 'Quest already completed', quest, bonusPoints: 0, bonusApplied: false });

    // Advance progress only. Never set completed here — completion requires a
    // verified action (logging the matching eco photo), which also grants the 2x.
    const newProgress = Math.min(quest.goal, quest.progress + 1);
    db.prepare('UPDATE quests SET progress = ? WHERE id = ?').run(newProgress, quest.id);

    res.json({
      quest: { ...quest, progress: newProgress, completed: 0 },
      justCompleted: false,
      bonusPoints: 0,
      bonusApplied: false,
      note: 'Log the matching eco action (with a photo) to complete this quest and earn the 2x bonus.',
    });
  } catch (err) {
    console.error('Quest progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

