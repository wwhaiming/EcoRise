/* EcoRise — Leaderboard routes */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Generate a short invite code
function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Calculate next reset time
function calcNextReset(interval) {
  const now = new Date();
  switch (interval) {
    case 'daily':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    case 'weekly':
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay())).toISOString();
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7).toISOString();
  }
}

// POST /api/leaderboards — create
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, resetInterval, prize, includeSelf } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const db = getDb();
    const id = uuid();
    const inviteCode = genInviteCode();
    const nextReset = calcNextReset(resetInterval || 'weekly');

    db.prepare(`
      INSERT INTO leaderboards (id, name, reset_interval, prize, include_self, invite_code, organizer_id, next_reset)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, resetInterval || 'weekly', prize || '', includeSelf !== false ? 1 : 0, inviteCode, req.userId, nextReset);

    // Auto-join organizer if include_self
    if (includeSelf !== false) {
      db.prepare('INSERT INTO leaderboard_members (leaderboard_id, user_id) VALUES (?, ?)').run(id, req.userId);
    }

    res.json({ id, name, inviteCode, nextReset });
  } catch (err) {
    console.error('Create leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboards/:id — get with ranked members
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const board = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Leaderboard not found' });

    // Check if reset is due
    if (board.next_reset && new Date(board.next_reset) <= new Date()) {
      // Reset all member points
      db.prepare('UPDATE leaderboard_members SET points = 0 WHERE leaderboard_id = ?').run(board.id);
      const nextReset = calcNextReset(board.reset_interval);
      db.prepare('UPDATE leaderboards SET next_reset = ? WHERE id = ?').run(nextReset, board.id);
      board.next_reset = nextReset;
    }

    const members = db.prepare(`
      SELECT lm.*, u.name, u.handle, u.avatar, u.email
      FROM leaderboard_members lm
      JOIN users u ON u.id = lm.user_id
      WHERE lm.leaderboard_id = ?
      ORDER BY lm.points DESC
    `).all(req.params.id);

    const ranked = members.map((m, i) => ({
      ...m,
      rank: i + 1,
      isYou: m.user_id === req.userId,
    }));

    res.json({ leaderboard: board, members: ranked });
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/leaderboards/:id/join — join via invite code
router.post('/:id/join', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { inviteCode } = req.body;
    const board = db.prepare('SELECT * FROM leaderboards WHERE id = ? OR invite_code = ?').get(req.params.id, inviteCode || '');
    if (!board) return res.status(404).json({ error: 'Leaderboard not found' });

    const existing = db.prepare('SELECT * FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(board.id, req.userId);
    if (existing) return res.json({ message: 'Already a member', leaderboardId: board.id });

    db.prepare('INSERT INTO leaderboard_members (leaderboard_id, user_id) VALUES (?, ?)').run(board.id, req.userId);
    res.json({ message: 'Joined successfully', leaderboardId: board.id });
  } catch (err) {
    console.error('Join leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/leaderboards/:id — update settings (organizer only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const board = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Not found' });
    if (board.organizer_id !== req.userId) return res.status(403).json({ error: 'Only the organizer can edit' });

    const { name, resetInterval, prize, includeSelf } = req.body;
    db.prepare(`
      UPDATE leaderboards SET name = ?, reset_interval = ?, prize = ?, include_self = ? WHERE id = ?
    `).run(name || board.name, resetInterval || board.reset_interval, prize ?? board.prize, includeSelf !== undefined ? (includeSelf ? 1 : 0) : board.include_self, req.params.id);

    res.json({ success: true });
  } catch (err) {
    console.error('Update leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/leaderboards — list user's leaderboards
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const boards = db.prepare(`
      SELECT l.* FROM leaderboards l
      JOIN leaderboard_members lm ON lm.leaderboard_id = l.id
      WHERE lm.user_id = ?
    `).all(req.userId);
    res.json({ leaderboards: boards });
  } catch (err) {
    console.error('List leaderboards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
