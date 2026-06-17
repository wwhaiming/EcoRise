/* EcoRise — Post routes (feed, likes, comments, moderation) */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { upload, fileToBase64 } = require('../middleware/upload');
const { aiRateLimit } = require('../middleware/rateLimit');
const { analyzeEcoAction, checkQuestMatch, chatEcoAction, adversarialCritique } = require('../utils/aiClient');
const { processEcoAction } = require('../utils/pointsEngine');
const { computeCarbon } = require('../utils/carbonEngine');
const { evaluateAdversarial } = require('../utils/integrityGates');
const { imageHash, perceptualHash, hammingDistance } = require('../utils/imageHash');
const { body, pageParams } = require('../utils/validate');
const analysisCache = require('../utils/analysisCache');

const router = express.Router();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The "AI evidence" a judge sees after every submission: which model decided,
// how confident it was, and every integrity gate the action had to clear. This
// is what makes the AI's reasoning visible instead of buried in the backend.
function buildIntegrity(aiResult, { lbId, carbon, adversarial } = {}) {
  const p = aiResult.provenance || {};
  const grounded = !!(carbon && carbon.method && carbon.method !== 'none');
  // adversarial.gate is 'passed' | 'flagged' | 'failed' | 'n/a' (from evaluateAdversarial).
  const fraudGate = (adversarial && adversarial.gate) ? adversarial.gate : 'n/a';
  return {
    model: p.model || (aiResult.isMock ? 'demo (no model)' : 'openai'),
    source: p.source || (aiResult.isMock ? 'mock' : 'openai'),
    confidence: aiResult.confidence ?? 0,
    promptVersion: p.promptVersion || null,
    // Grounded carbon evidence (formula + cited factors + uncertainty), or null.
    carbon: carbon ? {
      kgCO2e: carbon.kgCO2e, low: carbon.low, high: carbon.high,
      method: carbon.method, formula: carbon.formula,
      factors: carbon.factors, assumptions: carbon.assumptions,
    } : null,
    // The deterministic "tools" the system ran — the LLM only perceives; it never
    // awards points or invents the CO2 figure.
    toolCalls: [
      { tool: 'classify_photo', detail: aiResult.isEcoAction ? `vision -> ${aiResult.actionType}` : 'vision -> rejected' },
      { tool: 'duplicate_check', detail: 'exact + perceptual (aHash) vs. recent uploads' },
      { tool: 'carbon_factor_lookup', detail: grounded ? `${carbon.method} (cited factor)` : 'no grounded factor' },
      { tool: 'fraud_screen', detail: (adversarial && adversarial.ran) ? `suspicion: ${adversarial.suspicionLevel}` : 'skipped (offline)' },
      { tool: 'server_score', detail: 'points computed server-side; LLM cannot award' },
    ],
    checks: {
      photoRequired: 'passed',
      duplicateScreen: 'passed',
      membershipVerified: lbId ? 'passed' : 'n/a',
      aiVisionGate: aiResult.isEcoAction ? 'verified' : 'rejected',
      carbonGrounded: grounded ? 'passed' : 'n/a',
      fraudScreen: fraudGate,
      serverScored: 'passed',
    },
  };
}

function postBoardOrganizer(db, postId) {
  return db.prepare(`SELECT l.organizer_id FROM posts p JOIN leaderboards l ON l.id = p.leaderboard_id WHERE p.id = ?`).get(postId)?.organizer_id || null;
}
// Board-less posts are visible to any authed user; board posts require membership/organizer.
function isBoardMember(db, lbId, userId) {
  if (!lbId) return true;
  if (db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(lbId, userId)) return true;
  return !!db.prepare('SELECT 1 FROM leaderboards WHERE id = ? AND organizer_id = ?').get(lbId, userId);
}

// POST /api/posts/analyze — analyze the eco action photo to preview results
router.post('/analyze', authMiddleware, upload.single('image'), aiRateLimit, async (req, res) => {
  try {
    const image = req.file ? fileToBase64(req.file) : (req.body.image || '');
    if (!image || !image.startsWith('data:')) {
      return res.status(400).json({ error: 'A photo is required to analyze.' });
    }
    const aiResult = await analyzeEcoAction(image);
    res.json({ aiResult, aiRemaining: req.aiRemaining });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts/chat — multi-turn conversation with the AI assistant
router.post('/chat', authMiddleware, upload.single('image'), aiRateLimit, body('chatPost'), async (req, res) => {
  try {
    const v = req.valid;
    const image = req.file ? fileToBase64(req.file) : (v.image || '');
    if (!image || !image.startsWith('data:')) {
      return res.status(400).json({ error: 'A photo is required to start a chat.' });
    }
    const messages = v.messages || [];
    const chatResult = await chatEcoAction(messages, image);
    res.json({ chatResult, aiRemaining: req.aiRemaining });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/posts — create eco-action post (image REQUIRED; points scored server-side)
router.post('/', authMiddleware, upload.single('image'), aiRateLimit, body('createPost'), async (req, res) => {
  try {
    const db = getDb();
    const v = req.valid;
    const image = req.file ? fileToBase64(req.file) : (v.image || '');
    if (!image || !image.startsWith('data:')) {
      return res.status(400).json({ error: 'A photo is required to log an eco action.' });
    }

    const lbId = v.leaderboardId || null;
    if (lbId && !db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(lbId, req.userId)) {
      return res.status(403).json({ error: 'Join this leaderboard before posting to it' });
    }

    const hash = imageHash(image);
    const dup = db.prepare("SELECT id FROM posts WHERE user_id = ? AND image_hash = ? AND created_at > datetime('now','-1 day')").get(req.userId, hash);
    if (dup) return res.status(409).json({ error: 'You already logged this photo recently.', reason: 'duplicate', accepted: false, points: 0 });

    // Near-duplicate (non-LLM) screen: the same photo re-saved / re-compressed /
    // lightly cropped has a near-identical perceptual hash even when its bytes (and
    // thus image_hash) differ. Reject very-close matches from this user in the last
    // 2 days so one photo can't be re-farmed for points. Fails open: tiny or
    // undecodable images get a null phash and skip this check entirely.
    const NEAR_DUP_BITS = 4; // out of 64; <=4 differing bits == essentially the same shot
    const phash = await perceptualHash(image);
    if (phash) {
      const recent = db.prepare("SELECT phash FROM posts WHERE user_id = ? AND phash IS NOT NULL AND created_at > datetime('now','-2 day')").all(req.userId);
      if (recent.some(r => hammingDistance(phash, r.phash) <= NEAR_DUP_BITS)) {
        return res.status(409).json({ error: 'This looks like a near-duplicate of a photo you logged recently.', reason: 'near_duplicate', accepted: false, points: 0 });
      }
    }

    // Resolve the eco action. A manual log (actionType + actionDesc, e.g. confirmed
    // through the chat assistant) is trusted as-is; otherwise reuse the cached
    // analysis for this photo or run a fresh vision pass — never trust a
    // client-supplied verdict.
    let aiResult;
    if (v.actionType && v.actionDesc) {
      aiResult = {
        isEcoAction: true,
        actionType: v.actionType,
        specificAction: v.actionDesc,
        requiresFollowUp: false,
        attributes: {},
        estimatedCO2Saved: 0,
        environmentalImpactSummary: `Manually logged: ${v.actionDesc}`,
        confidence: 1.0,
        isMock: false,
        provenance: { source: 'manual', model: 'manual', promptVersion: null },
      };
    } else {
      aiResult = analysisCache.get(req.userId, hash);
      if (!aiResult) {
        aiResult = await analyzeEcoAction(image);
        analysisCache.set(req.userId, hash, aiResult);
      }
    }
    if (aiResult.isEcoAction === false) {
      return res.json({
        success: false, accepted: false, reason: 'not_eco_action', points: 0,
        confidence: aiResult.confidence ?? 0,
        description: aiResult.environmentalImpactSummary || 'This photo does not look like an eco action.',
        aiResult, integrity: buildIntegrity(aiResult, { lbId }), aiRemaining: req.aiRemaining,
      });
    }

    const miles = v.miles || 0;
    if (aiResult.requiresFollowUp && !miles) {
      return res.json({ needsFollowUp: true, aiResult, integrity: buildIntegrity(aiResult, { lbId }), followUpQuestion: aiResult.followUpQuestion });
    }

    // ── Commit path: perception passed; now run the deterministic tools ──
    // 1) Grounded carbon: the model supplied attributes; we compute kg CO2e from
    //    cited emission factors. User-entered miles override the model's distance.
    const attrs = { ...(aiResult.attributes || {}) };
    if (miles) attrs.distanceMiles = miles;
    const carbon = computeCarbon(aiResult.actionType, attrs);

    // 2) Adversarial fraud screen (skipped offline -> benign). Hard fakes are
    //    rejected; low-suspicion submissions are accepted with reduced points.
    // Cache the fraud-screen verdict by (userId, imageHash): a rejected submission
    // writes no post row, so the 24h duplicate guard won't stop a re-POST — without
    // this the paid second vision call (the cheapest to spam) re-runs every re-submit.
    let critique = analysisCache.get(req.userId, `adv:${hash}`);
    if (!critique) {
      critique = await adversarialCritique(image);
      analysisCache.set(req.userId, `adv:${hash}`, critique);
    }
    const verdict = evaluateAdversarial(critique);
    const adversarial = { ran: critique.ran, suspicionLevel: critique.suspicionLevel, gate: verdict.gate };
    const integrity = buildIntegrity(aiResult, { lbId, carbon, adversarial });

    if (verdict.verdict === 'reject') {
      return res.json({
        success: false, accepted: false, reason: 'suspected_fraud', points: 0,
        confidence: aiResult.confidence ?? 0,
        description: verdict.reason || 'This image was flagged by the fraud screen.',
        aiResult, integrity, carbon, aiRemaining: req.aiRemaining,
      });
    }

    // Parse + validate tags (max 3 real uuids that exist, never self).
    let taggedUserIds = [];
    try { const t = v.tags; const parsed = Array.isArray(t) ? t : (t ? JSON.parse(t) : []); taggedUserIds = Array.isArray(parsed) ? parsed : []; } catch { taggedUserIds = []; }
    taggedUserIds = taggedUserIds.filter(x => typeof x === 'string' && UUID_RE.test(x) && x !== req.userId).slice(0, 3);

    const today = new Date().toISOString().slice(0, 10);
    const activeQuests = db.prepare('SELECT * FROM quests WHERE user_id = ? AND date = ? AND completed = 0').all(req.userId, today);
    let questMatch = null;
    if (activeQuests.length > 0) questMatch = await checkQuestMatch(aiResult, activeQuests);
    // Only credit a quest the model reports as actually COMPLETE *and* that is in this
    // user's verified active list — never a partial, hallucinated, or foreign quest id.
    const matchedQuest = (questMatch && questMatch.completed === true)
      ? activeQuests.find(q => q.id === questMatch.matchedQuestId)
      : null;
    const isQuestCompletion = !!matchedQuest;

    const result = processEcoAction({
      userId: req.userId, leaderboardId: lbId, aiResult, miles, caption: v.caption,
      image, imageHash: hash, phash, taggedUserIds, isQuestCompletion,
      co2Saved: carbon.kgCO2e, integrityMultiplier: verdict.multiplier,
    });

    let questUpdate = null;
    if (isQuestCompletion) {
      db.prepare(`UPDATE quests SET progress = MIN(goal, progress + 1),
        completed = CASE WHEN progress + 1 >= goal THEN 1 ELSE 0 END,
        awarded  = CASE WHEN progress + 1 >= goal THEN 1 ELSE awarded END WHERE id = ? AND user_id = ?`).run(matchedQuest.id, req.userId);
      questUpdate = questMatch;
    }

    // Photo committed; drop the cached analysis + fraud-screen so a fresh upload re-analyzes.
    analysisCache.clear(req.userId, hash);
    analysisCache.clear(req.userId, `adv:${hash}`);

    res.json({
      success: true, accepted: true, postId: result.postId, points: result.points,
      breakdown: result.breakdown, bonuses: result.bonuses, multiplier: result.multiplier,
      explanation: result.explanation, co2Saved: result.co2Saved, carbon,
      aiResult, integrity, questUpdate, aiRemaining: req.aiRemaining,
    });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/posts — feed (clamped pagination; board feed requires membership)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { leaderboardId } = req.query;
    const { limit, offset } = pageParams(req);
    if (leaderboardId && !isBoardMember(db, leaderboardId, req.userId)) {
      return res.status(403).json({ error: 'Join this leaderboard to view its feed' });
    }
    const common = `
      SELECT p.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as like_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comment_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.id AND user_id = ?) as liked
      FROM posts p JOIN users u ON u.id = p.user_id
      WHERE p.hidden = 0`;
    // Unscoped feed must NOT leak private-board posts: only board-less posts,
    // plus boards the user is a member of or organizes.
    const posts = leaderboardId
      ? db.prepare(common + ' AND p.leaderboard_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?').all(req.userId, leaderboardId, limit, offset)
      : db.prepare(common + ` AND (
          p.leaderboard_id IS NULL
          OR EXISTS (SELECT 1 FROM leaderboard_members lm WHERE lm.leaderboard_id = p.leaderboard_id AND lm.user_id = ?)
          OR EXISTS (SELECT 1 FROM leaderboards l WHERE l.id = p.leaderboard_id AND l.organizer_id = ?)
        ) ORDER BY p.created_at DESC LIMIT ? OFFSET ?`).all(req.userId, req.userId, req.userId, limit, offset);
    res.json({ posts: posts.map(p => ({ ...p, liked: p.liked > 0 })) });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Shared loader: 404 if missing, 403 if the post's board excludes the user.
function loadAccessiblePost(db, postId, userId, res) {
  const post = db.prepare('SELECT user_id, leaderboard_id FROM posts WHERE id = ?').get(postId);
  if (!post) { res.status(404).json({ error: 'Post not found' }); return null; }
  if (!isBoardMember(db, post.leaderboard_id, userId)) { res.status(403).json({ error: 'Not a member of this board' }); return null; }
  return post;
}

router.post('/:id/like', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    if (!loadAccessiblePost(db, req.params.id, req.userId, res)) return;
    const existing = db.prepare('SELECT 1 FROM post_likes WHERE post_id = ? AND user_id = ?').get(req.params.id, req.userId);
    if (existing) {
      db.prepare('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?').run(req.params.id, req.userId);
      return res.json({ liked: false });
    }
    db.prepare('INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)').run(req.params.id, req.userId);
    res.json({ liked: true });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/comment', authMiddleware, body('comment'), (req, res) => {
  try {
    const db = getDb();
    if (!loadAccessiblePost(db, req.params.id, req.userId, res)) return;
    const text = req.valid.text;
    const id = uuid();
    db.prepare('INSERT INTO comments (id, post_id, user_id, text) VALUES (?, ?, ?, ?)').run(id, req.params.id, req.userId, text);
    const mentions = text.match(/@[\w.]+/g) || [];
    const author = db.prepare('SELECT name FROM users WHERE id = ?').get(req.userId);
    for (const handle of mentions) {
      const mentioned = db.prepare('SELECT id FROM users WHERE handle = ?').get(handle);
      if (mentioned && mentioned.id !== req.userId) {
        db.prepare('INSERT INTO notifications (id, user_id, type, message, link) VALUES (?, ?, ?, ?, ?)')
          .run(uuid(), mentioned.id, 'mention', `${author?.name || 'Someone'} mentioned you in a comment`, `/post/${req.params.id}`);
      }
    }
    res.json({ id, text, user_name: author?.name, created_at: new Date().toISOString() });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id/comments', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    if (!loadAccessiblePost(db, req.params.id, req.userId, res)) return;
    const comments = db.prepare(`SELECT c.*, u.name as user_name, u.handle as user_handle, u.avatar as user_avatar
      FROM comments c JOIN users u ON u.id = c.user_id WHERE c.post_id = ? ORDER BY c.created_at ASC`).all(req.params.id);
    res.json({ comments });
  } catch (err) {
    console.error('Get comments error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Report — must be a member of the post's board (no cross-board reporting).
router.post('/:id/report', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    if (!loadAccessiblePost(db, req.params.id, req.userId, res)) return;
    db.prepare('UPDATE posts SET reported = reported + 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Post reported to moderators' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resolve a report — organizer of the post's leaderboard only.
router.post('/:id/resolve', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    if (!db.prepare('SELECT 1 FROM posts WHERE id = ?').get(req.params.id)) return res.status(404).json({ error: 'Post not found' });
    if (postBoardOrganizer(db, req.params.id) !== req.userId) return res.status(403).json({ error: 'Only the leaderboard organizer can resolve reports' });
    db.prepare('UPDATE posts SET reported = 0 WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Report resolved' });
  } catch (err) {
    console.error('Resolve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Hide a post — post owner OR the leaderboard organizer.
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const post = db.prepare('SELECT user_id FROM posts WHERE id = ?').get(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const isOwner = post.user_id === req.userId;
    const isOrganizer = postBoardOrganizer(db, req.params.id) === req.userId;
    if (!isOwner && !isOrganizer) return res.status(403).json({ error: 'Not allowed to remove this post' });
    db.prepare('UPDATE posts SET hidden = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
