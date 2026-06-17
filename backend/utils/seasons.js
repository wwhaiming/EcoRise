/* GeoRise — leaderboard reset + season archiving. */
const { v4: uuid } = require('uuid');

function calcNextReset(interval) {
  const now = new Date();
  switch (interval) {
    case 'daily':   return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    case 'monthly': return new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    case 'weekly':
    default:        return new Date(now.getFullYear(), now.getMonth(), now.getDate() + (7 - now.getDay() || 7)).toISOString();
  }
}

// Archive standings + reset points + bump season, atomically, if the board is due.
function resetIfDue(db, board) {
  if (!board.next_reset || new Date(board.next_reset) > new Date()) return board;
  const members = db.prepare(
    'SELECT lm.user_id, u.name, lm.points FROM leaderboard_members lm JOIN users u ON u.id = lm.user_id WHERE lm.leaderboard_id = ? ORDER BY lm.points DESC'
  ).all(board.id);
  const standings = members.map((m, i) => ({ userId: m.user_id, name: m.name, points: m.points, rank: i + 1 }));
  const winner = standings[0]?.userId || null;
  const next = calcNextReset(board.reset_interval);
  db.transaction(() => {
    db.prepare('INSERT INTO leaderboard_seasons (id, leaderboard_id, season, winner_user_id, standings) VALUES (?, ?, ?, ?, ?)')
      .run(uuid(), board.id, board.season || 1, winner, JSON.stringify(standings));
    db.prepare('UPDATE leaderboard_members SET points = 0 WHERE leaderboard_id = ?').run(board.id);
    db.prepare('UPDATE leaderboards SET season = season + 1, next_reset = ? WHERE id = ?').run(next, board.id);
  })();
  board.season = (board.season || 1) + 1;
  board.next_reset = next;
  return board;
}

function runDueResets(db) {
  // Compare in JS: next_reset is stored as an ISO string (toISOString), which
  // does not collate correctly against SQLite's datetime('now') text.
  const boards = db.prepare('SELECT * FROM leaderboards WHERE next_reset IS NOT NULL').all();
  const now = new Date();
  let n = 0;
  for (const b of boards) {
    if (new Date(b.next_reset) <= now) { resetIfDue(db, b); n++; }
  }
  return n;
}

module.exports = { calcNextReset, resetIfDue, runDueResets };

