/* EcoRise — notification writer.
 *
 * The notifications feature (bell + dropdown + REST endpoints in routes/users.js)
 * was fully wired on the read side but nothing ever produced a row. This is the
 * single producer: call it whenever a real event should reach the user's bell.
 *
 * Best-effort by design — a notification is a side effect of the primary action
 * (logging a post, completing a quest). It must never throw into, or roll back,
 * that action. Callers can fire-and-forget.
 */
const { v4: uuid } = require('uuid');

const VALID_TYPES = new Set([
  'points',     // earned points for a logged action
  'quest',      // quest progressed / completed
  'badge',      // badge earned
  'rank',       // moved up/down the leaderboard
  'team',       // team / school milestone
  'social',     // like, comment, new member, invite accepted
  'system',     // welcome, resets, announcements
]);

/**
 * Insert one notification for a user. Returns the row id, or null on failure.
 *
 * @param {object} db       better-sqlite3 handle (from getDb())
 * @param {object} n
 * @param {string} n.userId
 * @param {string} n.type    one of VALID_TYPES (falls back to 'system')
 * @param {string} n.message human-readable text shown in the dropdown
 * @param {string} [n.link]  optional in-app route the notification deep-links to
 * @param {string} [n.createdAt] optional sqlite datetime (defaults to now); used by the seeder to backdate
 */
function createNotification(db, { userId, type, message, link = '', createdAt } = {}) {
  try {
    if (!db || !userId || !message) return null;
    const safeType = VALID_TYPES.has(type) ? type : 'system';
    const id = uuid();
    if (createdAt) {
      db.prepare(
        'INSERT INTO notifications (id, user_id, type, message, link, read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)'
      ).run(id, userId, safeType, String(message).slice(0, 300), link, createdAt);
    } else {
      db.prepare(
        'INSERT INTO notifications (id, user_id, type, message, link) VALUES (?, ?, ?, ?, ?)'
      ).run(id, userId, safeType, String(message).slice(0, 300), link);
    }
    return id;
  } catch (err) {
    // Never let a bell write break the action that triggered it.
    console.error('createNotification failed:', err.message);
    return null;
  }
}

module.exports = { createNotification, VALID_TYPES };
