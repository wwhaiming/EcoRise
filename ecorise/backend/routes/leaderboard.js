/* EcoRise — Leaderboard routes */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { calcNextReset, resetIfDue } = require('../utils/seasons');
const { body } = require('../utils/validate');

const router = express.Router();

function genInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 7; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
function isMemberOrOrganizer(db, board, userId) {
  if (board.organizer_id === userId) return true;
  return !!db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(board.id, userId);
}

router.post('/', authMiddleware, body('createLeaderboard'), (req, res) => {
  try {
    const { name, resetInterval, prize, includeSelf } = req.valid;
    const db = getDb();
    const id = uuid();
    const inviteCode = genInviteCode();
    const nextReset = calcNextReset(resetInterval || 'weekly');
    db.transaction(() => {
      db.prepare(`INSERT INTO leaderboards (id, name, reset_interval, prize, include_self, invite_code, organizer_id, next_reset)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, name, resetInterval || 'weekly', prize || '', includeSelf !== false ? 1 : 0, inviteCode, req.userId, nextReset);
      // Organizer is always a member (so they can view/manage). includeSelf only
      // governs whether they are ranked among competitors (role marks them).
      db.prepare("INSERT INTO leaderboard_members (leaderboard_id, user_id, role) VALUES (?, ?, 'organizer')").run(id, req.userId);
    })();
    res.json({ id, name, inviteCode, invite_code: inviteCode, nextReset });
  } catch (err) {
    console.error('Create leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    let board = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Leaderboard not found' });
    if (!isMemberOrOrganizer(db, board, req.userId)) return res.status(403).json({ error: 'Join this leaderboard to view it' });

    board = resetIfDue(db, board);

    // NOTE: email is intentionally NOT selected (no PII leak to other members).
    const members = db.prepare(`
      SELECT lm.leaderboard_id, lm.user_id, lm.role, lm.points, lm.streak, u.name, u.handle, u.avatar
      FROM leaderboard_members lm JOIN users u ON u.id = lm.user_id
      WHERE lm.leaderboard_id = ? ORDER BY lm.points DESC
    `).all(req.params.id);
    const ranked = members.map((m, i) => ({ ...m, rank: i + 1, isYou: m.user_id === req.userId }));
    res.json({ leaderboard: board, members: ranked });
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join — requires a valid invite code (the invite link carries it). Joining by
// raw board id is only allowed for the organizer (who already owns the board).
router.post('/:id/join', authMiddleware, body('join'), (req, res) => {
  try {
    const db = getDb();
    const { inviteCode } = req.valid;
    const board = inviteCode
      ? db.prepare('SELECT * FROM leaderboards WHERE invite_code = ?').get(inviteCode)
      : db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Leaderboard not found' });
    if (!inviteCode && board.organizer_id !== req.userId) {
      return res.status(403).json({ error: 'A valid invite code is required to join.' });
    }
    const existing = db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(board.id, req.userId);
    if (existing) return res.json({ message: 'Already a member', leaderboardId: board.id });
    db.prepare('INSERT INTO leaderboard_members (leaderboard_id, user_id) VALUES (?, ?)').run(board.id, req.userId);
    res.json({ message: 'Joined successfully', leaderboardId: board.id, name: board.name });
  } catch (err) {
    console.error('Join leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', authMiddleware, body('updateLeaderboard'), (req, res) => {
  try {
    const db = getDb();
    const board = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Not found' });
    if (board.organizer_id !== req.userId) return res.status(403).json({ error: 'Only the organizer can edit' });
    const { name, resetInterval, prize, includeSelf } = req.valid;
    db.prepare('UPDATE leaderboards SET name = ?, reset_interval = ?, prize = ?, include_self = ? WHERE id = ?')
      .run(name || board.name, resetInterval || board.reset_interval, prize ?? board.prize,
        includeSelf !== undefined ? (includeSelf ? 1 : 0) : board.include_self, req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Update leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/seasons', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const board = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Not found' });
    if (!isMemberOrOrganizer(db, board, req.userId)) return res.status(403).json({ error: 'Forbidden' });
    const seasons = db.prepare('SELECT * FROM leaderboard_seasons WHERE leaderboard_id = ? ORDER BY season DESC').all(req.params.id);
    res.json({ seasons: seasons.map(s => ({ ...s, standings: JSON.parse(s.standings || '[]') })) });
  } catch (err) {
    console.error('Get seasons error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List boards the user is a member of OR organizes (so organizers never lose theirs).
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const boards = db.prepare(`
      SELECT l.* FROM leaderboards l WHERE l.organizer_id = ?
      UNION
      SELECT l.* FROM leaderboards l JOIN leaderboard_members lm ON lm.leaderboard_id = l.id WHERE lm.user_id = ?
    `).all(req.userId, req.userId);
    res.json({ leaderboards: boards });
  } catch (err) {
    console.error('List leaderboards error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
