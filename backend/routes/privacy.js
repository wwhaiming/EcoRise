/* EcoRise — Privacy / FERPA-COPPA routes (Phase 2).
 *
 * The compliance surface for a product used by minors:
 *   - consent state (read + record), enforced at upload time by posts/trashspotter
 *   - per-board privacy policy (consent mode, image retention, teacher review)
 *   - teacher review queue: approve/reject a post before it reaches the feed/leaderboard
 *   - data-subject rights: export everything, or delete the account irreversibly
 *   - a public privacy-by-design + model/data card (GET /policy) for judges & parents
 */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('../utils/validate');
const P = require('../utils/privacy');

const router = express.Router();

// Real model-card numbers for the in-repo litter CNN, read from its metadata file so
// the card never drifts from the shipped model. Degrades to limits-only if missing.
let CNN_CARD = null;
try {
  const meta = JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '..', 'model', 'trash_detector.json'), 'utf8'));
  const total = Object.values(meta.counts || {}).reduce((a, b) => a + Number(b || 0), 0);
  CNN_CARD = `Validation accuracy ${meta.val_acc} on ${total} labeled images (${meta.counts?.not_trash ?? '?'} not-litter / ${meta.counts?.trash ?? '?'} litter), ${meta.img_size}px input. Binary litter / not-litter.`;
} catch (_) { /* model card degrades to limits-only */ }

const CLEAR_COOKIE = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax' };
const CLEAR_CSRF_COOKIE = { httpOnly: false, secure: CLEAR_COOKIE.secure, sameSite: 'lax' };

function organizerOf(db, lbId, userId) {
  return !!db.prepare('SELECT 1 FROM leaderboards WHERE id = ? AND organizer_id = ?').get(lbId, userId);
}

// ── Privacy-by-design + model/data card (public; what we collect, retain, and run) ──
router.get('/policy', (_req, res) => {
  res.json({
    product: 'EcoRise',
    audience: 'Students and teachers at a school (minors may participate).',
    updated: '2026-06',
    principles: [
      'Data minimization: we keep the least we can. Photos are downscaled to a thumbnail (or not stored at all) after analysis by default.',
      'Consent before capture: a student cannot upload to a class board until consent is recorded for them.',
      'Tenant isolation: a board is a closed group. You only ever see boards you belong to; member emails are never shown to other members.',
      'Human in the loop: a teacher can require review before any post reaches the feed or leaderboard, and can reverse a wrongly-awarded post.',
      'Transparency: every privacy action is written to an audit log a teacher can read.',
      'Your data is yours: export everything or delete your account at any time.',
    ],
    dataCollected: [
      { item: 'Account', fields: 'email, display name, handle, optional avatar', why: 'sign-in and attribution' },
      { item: 'Eco actions / trash reports', fields: 'AI-derived action label, CO2e estimate, points, optional thumbnail', why: 'scoring and the feed' },
      { item: 'Consent records', fields: 'board, tier, status, who attested', why: 'COPPA/FERPA compliance' },
    ],
    retention: {
      default: 'minimize — only a small thumbnail + derived label are kept; the full-resolution original is discarded.',
      modes: ['minimize (default)', 'standard (full image; teacher opt-in)', '24h (auto-purged after a day)', 'do_not_store (label only, no image)'],
    },
    consentModes: {
      demo: 'Open — synthetic/demo board, no real student PII at stake.',
      classroom: 'A teacher attests roster-level consent before students upload.',
      parent: 'Per-student parent-granted consent required (strictest).',
    },
    models: [
      { name: 'OpenAI gpt-4o-mini (vision + text)', use: 'Perceives the photo and proposes an action label + attributes. It NEVER awards points or computes CO2e.', limits: 'May misclassify unusual photos; gated by a confidence floor + an adversarial fraud screen.' },
      { name: 'text-embedding-3-small', use: 'Embeds the approved research corpus for retrieval (the Eco Coach / Research Library).', limits: 'Retrieval is brute-force cosine over the corpus — a documented demo-scale choice.' },
      { name: 'In-repo ONNX litter CNN', use: 'Offline fallback for trash detection when no API key is present.', metrics: CNN_CARD, limits: 'Trained on a public litter dataset; coarse severity only; class-imbalanced toward litter.' },
    ],
    responsibleAi: 'Perception (the LLM) and calculation (a deterministic carbon engine using cited EPA/OWID factors) are split. The model proposes; the server disposes. Points are computed server-side and capped; the LLM cannot mint them.',
    rights: ['GET /api/privacy/export — download all your data', 'POST /api/privacy/account/delete — erase your account and cascade'],
  });
});

// ── Consent: read my state on a board ────────────────────────────────────────
router.get('/consent', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId } = req.query;
    if (!leaderboardId) return res.status(400).json({ error: 'leaderboardId is required' });
    const priv = P.boardPrivacy(db, leaderboardId);
    if (!priv) return res.status(404).json({ error: 'Leaderboard not found' });
    res.json({
      board: priv,
      consent: P.consentStatus(db, leaderboardId, req.userId),
      satisfied: P.consentSatisfied(db, leaderboardId, req.userId),
    });
  } catch (err) {
    console.error('Get consent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record consent. A member may self-attest (classroom) or revoke their own consent.
// Granting parent-tier consent, or acting on behalf of another member, requires the
// board organizer (the teacher).
router.post('/consent', authMiddleware, body('recordConsent'), (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId, userId, status, method, note } = req.valid;
    const board = db.prepare('SELECT id FROM leaderboards WHERE id = ?').get(leaderboardId);
    if (!board) return res.status(404).json({ error: 'Leaderboard not found' });
    const priv = P.boardPrivacy(db, leaderboardId);
    const target = userId || req.userId;
    const actingForOther = target !== req.userId;
    const grantingParent = status === 'granted';
    const isOrganizer = organizerOf(db, leaderboardId, req.userId);

    if ((actingForOther || grantingParent) && !isOrganizer) {
      return res.status(403).json({ error: 'Only the board organizer (teacher) can grant or attest consent for a student.' });
    }
    // The target must actually belong to the board.
    const isMember = db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, target);
    if (!isMember) return res.status(400).json({ error: 'That user is not a member of this board.' });

    const rec = P.recordConsent(db, {
      leaderboardId, userId: target, tier: priv.consentMode, status,
      attestedBy: req.userId, method: method || '', note: note || '',
    });
    res.json({ consent: rec, satisfied: P.consentSatisfied(db, leaderboardId, target) });
  } catch (err) {
    console.error('Record consent error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Board privacy policy (organizer only) ────────────────────────────────────
router.post('/boards/:id/privacy', authMiddleware, body('setBoardPrivacy'), (req, res) => {
  try {
    const db = getDb();
    const board = db.prepare('SELECT * FROM leaderboards WHERE id = ?').get(req.params.id);
    if (!board) return res.status(404).json({ error: 'Leaderboard not found' });
    if (board.organizer_id !== req.userId) return res.status(403).json({ error: 'Only the organizer can set privacy policy' });
    const { consentMode, retentionMode, reviewRequired, displayMode } = req.valid;
    db.prepare('UPDATE leaderboards SET consent_mode = ?, retention_mode = ?, review_required = ?, display_mode = ? WHERE id = ?').run(
      consentMode || board.consent_mode, retentionMode || board.retention_mode,
      reviewRequired === undefined ? board.review_required : (reviewRequired ? 1 : 0),
      displayMode || board.display_mode || 'names', req.params.id,
    );
    P.auditLog(db, { actorUserId: req.userId, action: 'board.privacy_set', targetType: 'leaderboard', targetId: req.params.id, leaderboardId: req.params.id, detail: { consentMode, retentionMode, reviewRequired, displayMode } });
    res.json({ success: true, board: P.boardPrivacy(db, req.params.id) });
  } catch (err) {
    console.error('Set board privacy error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Teacher review queue ─────────────────────────────────────────────────────
router.get('/boards/:id/review-queue', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    if (!organizerOf(db, req.params.id, req.userId)) return res.status(403).json({ error: 'Only the organizer can review posts' });
    const pending = db.prepare(`
      SELECT p.id, p.user_id, p.action_type, p.action_desc, p.derived_label, p.caption, p.image, p.points, p.created_at,
             u.name as user_name, u.handle as user_handle
      FROM posts p JOIN users u ON u.id = p.user_id
      WHERE p.leaderboard_id = ? AND p.status = 'pending' ORDER BY p.created_at ASC LIMIT 100`).all(req.params.id);
    res.json({ pending });
  } catch (err) {
    console.error('Review queue error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Approve publishes the post; reject hides it AND reverses any points it was awarded.
router.post('/posts/:id/review', authMiddleware, body('reviewPost'), (req, res) => {
  try {
    const db = getDb();
    const post = db.prepare('SELECT id, user_id, leaderboard_id, status FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (!post.leaderboard_id || !organizerOf(db, post.leaderboard_id, req.userId)) {
      return res.status(403).json({ error: 'Only the organizer of this post\'s board can review it' });
    }
    // Only undecided posts are reviewable — prevents an approve-after-reject from leaving
    // the post hidden with its points still clawed back (and vice-versa).
    if (post.status !== 'pending') {
      return res.status(409).json({ error: 'This post has already been reviewed.', status: post.status });
    }
    const { decision, reason } = req.valid;
    const apply = db.transaction(() => {
      if (decision === 'approve') {
        db.prepare("UPDATE posts SET status = 'published', reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?").run(req.userId, req.params.id);
        return { reversedPoints: 0 };
      }
      // reject: hide it and claw back any points credited to the author for this post
      const ev = db.prepare("SELECT user_id, leaderboard_id, points FROM point_events WHERE source IN ('eco_action', 'trash') AND source_id = ?").get(req.params.id);
      let reversedPoints = 0;
      if (ev && ev.leaderboard_id) {
        db.prepare('UPDATE leaderboard_members SET points = MAX(0, points - ?) WHERE leaderboard_id = ? AND user_id = ?').run(ev.points, ev.leaderboard_id, ev.user_id);
        db.prepare("DELETE FROM point_events WHERE source IN ('eco_action', 'trash') AND source_id = ?").run(req.params.id);
        reversedPoints = ev.points;
      }
      db.prepare("UPDATE posts SET status = 'rejected', hidden = 1, reviewed_by = ?, reviewed_at = datetime('now') WHERE id = ?").run(req.userId, req.params.id);
      return { reversedPoints };
    });
    const result = apply();
    P.auditLog(db, { actorUserId: req.userId, action: 'post.' + decision, targetType: 'post', targetId: req.params.id, leaderboardId: post.leaderboard_id, detail: { reason: reason || '', ...result } });
    db.prepare('INSERT INTO notifications (id, user_id, type, message, link) VALUES (?, ?, ?, ?, ?)').run(
      uuid(), post.user_id, 'review',
      decision === 'approve' ? 'Your eco action was approved by your teacher.' : `Your eco action was not approved${reason ? ': ' + reason : '.'}`,
      `/post/${req.params.id}`,
    );
    res.json({ success: true, decision, ...result });
  } catch (err) {
    console.error('Review post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Audit log (organizer transparency) ───────────────────────────────────────
router.get('/audit', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId } = req.query;
    if (!leaderboardId || !organizerOf(db, leaderboardId, req.userId)) {
      return res.status(403).json({ error: 'Only a board organizer can read its audit log' });
    }
    const rows = db.prepare('SELECT action, target_type, target_id, actor_user_id, detail, created_at FROM audit_log WHERE leaderboard_id = ? ORDER BY created_at DESC LIMIT 200').all(leaderboardId);
    res.json({ audit: rows.map(r => ({ ...r, detail: r.detail ? JSON.parse(r.detail) : null })) });
  } catch (err) {
    console.error('Audit read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Data-subject rights ──────────────────────────────────────────────────────
router.get('/export', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const data = P.exportUserData(db, req.userId);
    if (!data.user) return res.status(404).json({ error: 'User not found' });
    P.auditLog(db, { actorUserId: req.userId, action: 'account.export', targetType: 'user', targetId: req.userId });
    res.setHeader('Content-Disposition', 'attachment; filename="ecorise-export.json"');
    res.json(data);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/account/delete', authMiddleware, body('deleteAccount'), (req, res) => {
  try {
    const db = getDb();
    if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(req.userId)) return res.status(404).json({ error: 'User not found' });
    const summary = P.deleteUserData(db, req.userId);
    res.clearCookie('token', CLEAR_COOKIE);
    res.clearCookie('csrf', CLEAR_CSRF_COOKIE);
    res.json({ success: true, deleted: summary });
  } catch (err) {
    console.error('Account delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
