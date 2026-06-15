/* EcoRise — Quest routes */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { generateDailyQuests } = require('../utils/aiClient');

const router = express.Router();

// GET /api/quests — get today's quests (generate if none exist)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10);

    let quests = db.prepare('SELECT * FROM quests WHERE user_id = ? AND date = ?').all(req.userId, today);

    if (quests.length === 0) {
      // Generate new quests
      const generated = await generateDailyQuests(req.userId);

      const insert = db.prepare(`
        INSERT INTO quests (id, user_id, title, description, action_type, target_details, points_base, goal, progress, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);

      const insertMany = db.transaction((items) => {
        for (const q of items) {
          const id = uuid();
          insert.run(id, req.userId, q.title, q.description, q.actionType, q.targetDetails || '', q.pointsBase || 50, 1, today);
        }
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

// POST /api/quests/:id/progress — update quest progress
router.post('/:id/progress', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const quest = db.prepare('SELECT * FROM quests WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });
    if (quest.completed) return res.json({ message: 'Quest already completed', quest });

    const newProgress = Math.min(quest.goal, quest.progress + 1);
    const completed = newProgress >= quest.goal ? 1 : 0;

    db.prepare('UPDATE quests SET progress = ?, completed = ? WHERE id = ?').run(newProgress, completed, req.params.id);

    res.json({
      quest: { ...quest, progress: newProgress, completed },
      justCompleted: completed && !quest.completed,
      bonusPoints: completed ? quest.points_base * 2 : 0,
    });
  } catch (err) {
    console.error('Quest progress error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
