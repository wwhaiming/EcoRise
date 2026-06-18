/* GeoRise — Privacy / FERPA-COPPA helpers (Phase 2).
 *
 * GeoRise serves minors, so privacy is a first-class engine, not a setting:
 *   - Consent is recorded per (board, member) and ENFORCED before any photo of a
 *     student is accepted. The board's consent_mode decides what "consented" means.
 *   - Image retention is minimized by default: after the AI analyzes a photo we keep
 *     only a small thumbnail (or nothing) plus the derived label — never the
 *     full-resolution original, unless a teacher explicitly opts the board in.
 *   - Every privacy-relevant action is written to a tamper-evident audit_log.
 *
 * These helpers take the db handle as an argument (rather than importing getDb) so
 * they are trivially unit-testable against an in-memory database.
 */
const { v4: uuid } = require('uuid');

// jimp is already a dependency (imageHash.js, localTrashModel.js). If absent, the
// thumbnail step degrades to "store nothing" — which only makes us MORE private.
let Jimp = null;
try { ({ Jimp } = require('jimp')); } catch (_) { /* optional */ }

const CONSENT_MODES = ['demo', 'classroom', 'parent'];
const RETENTION_MODES = ['minimize', 'standard', '24h', 'do_not_store'];

// UTC 'YYYY-MM-DD HH:MM:SS' to match SQLite's datetime('now'), so lexical string
// comparison in purgeExpiredImages() is correct without a datetime() wrapper.
function sqlDateTimePlus(ms) {
  return new Date(Date.now() + ms).toISOString().replace('T', ' ').slice(0, 19);
}

// ── Consent ────────────────────────────────────────────────────────────────
function boardPrivacy(db, leaderboardId) {
  if (!leaderboardId) return null; // board-less (personal) posts have no school context
  const b = db.prepare('SELECT consent_mode, retention_mode, review_required, display_mode FROM leaderboards WHERE id = ?').get(leaderboardId);
  if (!b) return null;
  return {
    consentMode: CONSENT_MODES.includes(b.consent_mode) ? b.consent_mode : 'classroom',
    retentionMode: RETENTION_MODES.includes(b.retention_mode) ? b.retention_mode : 'minimize',
    reviewRequired: !!b.review_required,
    displayMode: ['names', 'initials'].includes(b.display_mode) ? b.display_mode : 'names',
  };
}

function consentStatus(db, leaderboardId, userId) {
  if (!leaderboardId) return null;
  return db.prepare('SELECT * FROM consent_records WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, userId) || null;
}

/**
 * Is this member cleared to upload a photo to this board?
 *   - board-less / demo mode  -> always (synthetic or personal context, no minor PII at stake)
 *   - classroom mode          -> a teacher-attested OR parent-granted record (and not revoked)
 *   - parent mode             -> a parent-granted record only (strictest)
 */
function consentSatisfied(db, leaderboardId, userId) {
  const priv = boardPrivacy(db, leaderboardId);
  if (!priv) return true;                 // board-less personal post
  if (priv.consentMode === 'demo') return true;
  const rec = consentStatus(db, leaderboardId, userId);
  if (!rec || rec.status === 'revoked' || rec.status === 'none') return false;
  if (priv.consentMode === 'parent') return rec.status === 'granted';
  // classroom
  return rec.status === 'attested' || rec.status === 'granted';
}

function recordConsent(db, { leaderboardId, userId, tier, status, attestedBy = null, method = '', note = '', documentName = '', documentData = '' }) {
  if (!CONSENT_MODES.includes(tier)) throw new Error(`invalid consent tier: ${tier}`);
  const valid = ['none', 'attested', 'granted', 'revoked'];
  if (!valid.includes(status)) throw new Error(`invalid consent status: ${status}`);
  const existing = consentStatus(db, leaderboardId, userId);
  if (existing) {
    db.prepare(`UPDATE consent_records SET tier = ?, status = ?, attested_by = ?, method = ?, note = ?, document_name = ?, document_data = ?, updated_at = datetime('now')
      WHERE leaderboard_id = ? AND user_id = ?`).run(tier, status, attestedBy, method, note, documentName, documentData, leaderboardId, userId);
  } else {
    db.prepare(`INSERT INTO consent_records (id, leaderboard_id, user_id, tier, status, attested_by, method, note, document_name, document_data)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(uuid(), leaderboardId, userId, tier, status, attestedBy, method, note, documentName, documentData);
  }
  auditLog(db, {
    actorUserId: attestedBy || userId, action: 'consent.' + status, targetType: 'user',
    targetId: userId, leaderboardId, detail: { tier, hasDocument: !!documentData },
  });
  return consentStatus(db, leaderboardId, userId);
}

// ── Image retention ──────────────────────────────────────────────────────────
// Downscale to a small thumbnail (longest side <= maxPx) so the feed can still show
// the verified action without storing a recognizable, full-resolution photo of a
// minor. Returns '' on any failure or when jimp is unavailable (fails private).
async function makeThumbnail(image, maxPx = 128) {
  if (!Jimp || !image || typeof image !== 'string') return '';
  const b64 = image.includes(',') ? image.split(',')[1] : image;
  if (!b64) return '';
  try {
    const img = await Jimp.fromBuffer(Buffer.from(b64, 'base64'));
    const { width, height } = img.bitmap;
    if (!width || !height) return '';
    const scale = Math.min(1, maxPx / Math.max(width, height));
    img.resize({ w: Math.max(1, Math.round(width * scale)), h: Math.max(1, Math.round(height * scale)) });
    return await img.getBase64('image/jpeg');
  } catch (_) {
    return '';
  }
}

/**
 * Decide what (if anything) of a student's photo we persist, per the board's mode.
 * Returns { storedImage, expiresAt, retentionMode }. The caller computes the human
 * derived_label separately (it has the AI action label).
 *   minimize (default) -> small thumbnail only, kept indefinitely
 *   standard           -> full image kept (teacher opt-in; warned)
 *   24h                -> full image, auto-purged after 24h by purgeExpiredImages
 *   do_not_store       -> nothing kept (label + hash only)
 */
async function applyRetention(mode, image) {
  const retentionMode = RETENTION_MODES.includes(mode) ? mode : 'minimize';
  switch (retentionMode) {
    case 'standard':
      return { storedImage: image, expiresAt: null, retentionMode };
    case '24h':
      return { storedImage: image, expiresAt: sqlDateTimePlus(24 * 60 * 60 * 1000), retentionMode };
    case 'do_not_store':
      return { storedImage: '', expiresAt: null, retentionMode };
    case 'minimize':
    default:
      return { storedImage: await makeThumbnail(image), expiresAt: null, retentionMode };
  }
}

// Null out any stored image whose retention window has elapsed (24h mode). Lexical
// compare is valid because expiry is written in SQLite's own datetime format (UTC).
function purgeExpiredImages(db) {
  const now = sqlDateTimePlus(0);
  const posts = db.prepare(
    "UPDATE posts SET image = '' WHERE image_expires_at IS NOT NULL AND image_expires_at != '' AND image_expires_at <= ? AND image != ''"
  ).run(now).changes;
  const trash = db.prepare(
    "UPDATE trash_reports SET image = '' WHERE image_expires_at IS NOT NULL AND image_expires_at != '' AND image_expires_at <= ? AND image != ''"
  ).run(now).changes;
  return { posts, trash };
}

// ── Audit log ────────────────────────────────────────────────────────────────
function auditLog(db, { actorUserId = null, action, targetType = '', targetId = '', leaderboardId = null, detail = null }) {
  db.prepare(`INSERT INTO audit_log (id, actor_user_id, action, target_type, target_id, leaderboard_id, detail)
    VALUES (?, ?, ?, ?, ?, ?, ?)`).run(
    uuid(), actorUserId, action, targetType || '', targetId || '', leaderboardId || null,
    detail == null ? '' : JSON.stringify(detail)
  );
}

// ── Data-subject rights: export + delete ──────────────────────────────────────
function exportUserData(db, userId) {
  const get = (sql, ...a) => db.prepare(sql).all(...a);
  const user = db.prepare('SELECT id, email, name, handle, avatar, role, created_at FROM users WHERE id = ?').get(userId);
  return {
    exportedAt: new Date().toISOString(),
    user,
    memberships: get('SELECT leaderboard_id, role, points, streak, joined_at FROM leaderboard_members WHERE user_id = ?', userId),
    organizes: get('SELECT id, name, created_at FROM leaderboards WHERE organizer_id = ?', userId),
    posts: get('SELECT id, leaderboard_id, action_type, action_desc, co2_saved, points, caption, status, retention_mode, derived_label, created_at FROM posts WHERE user_id = ?', userId),
    trashReports: get('SELECT id, leaderboard_id, severity, description, location, points, created_at FROM trash_reports WHERE user_id = ?', userId),
    comments: get('SELECT id, post_id, text, created_at FROM comments WHERE user_id = ?', userId),
    pointEvents: get('SELECT leaderboard_id, source, source_id, points, created_at FROM point_events WHERE user_id = ?', userId),
    consent: get('SELECT leaderboard_id, tier, status, method, note, document_name, document_data, created_at, updated_at FROM consent_records WHERE user_id = ?', userId),
    badges: get('SELECT badge_type, earned_at FROM badges WHERE user_id = ?', userId),
    coachAnswers: get('SELECT question_id, correct, points, created_at FROM coach_answers WHERE user_id = ?', userId),
    notifications: get('SELECT type, message, read, created_at FROM notifications WHERE user_id = ?', userId),
  };
}

/**
 * Erase a user and everything that cascades from them. Boards the user organizes are
 * deleted first (no ON DELETE cascade on leaderboards.organizer_id), which cascades
 * those boards' members/posts/trash/seasons. The audit row is written BEFORE the
 * delete and survives it (audit_log has no FK on the actor). Irreversible.
 */
function deleteUserData(db, userId) {
  const run = db.transaction(() => {
    const organized = db.prepare('SELECT id FROM leaderboards WHERE organizer_id = ?').all(userId).map(r => r.id);
    const counts = {
      organizedBoards: organized.length,
      posts: db.prepare('SELECT COUNT(*) c FROM posts WHERE user_id = ?').get(userId).c,
      trashReports: db.prepare('SELECT COUNT(*) c FROM trash_reports WHERE user_id = ?').get(userId).c,
    };
    auditLog(db, { actorUserId: userId, action: 'account.delete', targetType: 'user', targetId: userId, detail: counts });
    for (const id of organized) db.prepare('DELETE FROM leaderboards WHERE id = ?').run(id); // cascades members/posts/trash/seasons
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);                                // cascades the rest
    return counts;
  });
  return run();
}

// ── Pseudonymous display (minors): "Maya Chen" -> "M.C." + blank handle/avatar ──
function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Anon';
  return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('.') + '.';
}
// Mask a joined user row on a pseudonymous board. Never masks the viewer's own row.
function maskDisplay(row, { mode, isSelf, nameKey = 'user_name', handleKey = 'user_handle', avatarKey = 'user_avatar' } = {}) {
  if (mode !== 'initials' || isSelf || !row) return row;
  return { ...row, [nameKey]: initials(row[nameKey]), [handleKey]: '', [avatarKey]: '' };
}

module.exports = {
  CONSENT_MODES, RETENTION_MODES, initials, maskDisplay,
  boardPrivacy, consentStatus, consentSatisfied, recordConsent,
  makeThumbnail, applyRetention, purgeExpiredImages,
  auditLog, exportUserData, deleteUserData,
};
