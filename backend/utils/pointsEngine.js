/* GeoRise — Points Engine
 * AI extraction -> rubric -> transactional DB update + immutable ledger.
 */
const { getDb } = require('../db');
const { calculatePoints } = require('./rubric');
const { v4: uuid } = require('uuid');

function recordLedger(db, { userId, leaderboardId, source, sourceId, points }) {
  db.prepare(
    'INSERT INTO point_events (id, user_id, leaderboard_id, source, source_id, points) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uuid(), userId, leaderboardId || null, source, sourceId || null, points);
}

// The consecutive-day streak this member will have AFTER acting today. Shared by
// getUserContext (so scoring sees the resulting streak) and awardPoints (so the
// stored value matches) — fixes the off-by-one where the 7-day bonus only landed
// on the 8th consecutive day.
function nextStreak(member, today, yesterday) {
  if (!member) return 1;
  if (member.last_action_date === today) return member.streak || 0; // already counted today
  if (member.last_action_date === yesterday) return (member.streak || 0) + 1;
  return 1;
}

/**
 * Award points to a leaderboard member, atomically, and write a ledger event.
 * Idempotent per (source, source_id): a repeated award for the same source is a
 * no-op, so a retry/replay cannot double-credit points.
 */
function awardPoints(userId, leaderboardId, points, opts = {}) {
  const db = getDb();
  if (!leaderboardId || !points) return { applied: false, reason: 'no_board_or_points' };
  const member = db.prepare(
    'SELECT * FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?'
  ).get(leaderboardId, userId);
  if (!member) return { applied: false, reason: 'not_member' };

  if (opts.source && opts.sourceId) {
    const dup = db.prepare('SELECT 1 FROM point_events WHERE source = ? AND source_id = ?').get(opts.source, opts.sourceId);
    if (dup) return { applied: false, reason: 'duplicate_source' };
  }

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const newStreak = nextStreak(member, today, yesterday);

  const apply = db.transaction(() => {
    db.prepare(
      'UPDATE leaderboard_members SET points = points + ?, streak = ?, last_action_date = ? WHERE leaderboard_id = ? AND user_id = ?'
    ).run(points, newStreak, today, leaderboardId, userId);
    recordLedger(db, { userId, leaderboardId, source: opts.source || 'manual', sourceId: opts.sourceId, points });
  });
  apply();
  return { applied: true, pointsAwarded: points };
}

function getUserContext(userId, leaderboardId, isQuestCompletion = false, taggedFriends = []) {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const todayPosts = db.prepare(
    'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND date(created_at) = ?'
  ).get(userId, today);
  const isFirstActionToday = (todayPosts?.count || 0) === 0;
  // Prospective streak (the value this action will produce), so the >=7 bonus in
  // the rubric fires on the real 7th day. awardPoints persists the same value.
  let streak = 0;
  if (leaderboardId) {
    const member = db.prepare(
      'SELECT streak, last_action_date FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?'
    ).get(leaderboardId, userId);
    if (member) streak = nextStreak(member, today, yesterday);
  }
  return { isFirstActionToday, streak, isQuestCompletion: !!isQuestCompletion, taggedFriends: (taggedFriends || []).slice(0, 3) };
}

/**
 * Process a full eco action atomically: score, insert post, award points,
 * notify tagged members, award badges. Points are computed server-side from AI
 * output only (never a client-supplied score).
 */
function processEcoAction(params) {
  const db = getDb();
  const run = db.transaction((p) => {
    const ctx = getUserContext(p.userId, p.leaderboardId, p.isQuestCompletion, p.taggedUserIds || []);

    // Grounded CO2 (from carbonEngine, passed by the route) drives scoring AND
    // storage — never the model's advisory estimate.
    const co2 = (p.co2Saved != null) ? (Number(p.co2Saved) || 0) : (p.aiResult.estimatedCO2Saved || 0);

    const result = calculatePoints({
      actionType: p.aiResult.actionType,
      specificAction: p.aiResult.specificAction,
      milesIfApplicable: p.miles,
      co2Saved: co2,
      aiExtractedData: p.aiResult,
      userContext: ctx,
    });

    // Adversarial-integrity multiplier: a "flagged" (low-suspicion) submission is
    // accepted but earns reduced points. Full = 1, flagged = 0.5.
    const integrityMultiplier = (p.integrityMultiplier != null) ? p.integrityMultiplier : 1;
    const finalPoints = Math.round(result.points * integrityMultiplier);
    if (integrityMultiplier < 1) result.bonuses.push({ label: 'Fraud-screen flag (reduced)', multiplier: integrityMultiplier });

    const postId = uuid();
    db.prepare(`
      INSERT INTO posts (id, user_id, leaderboard_id, image, image_hash, phash, action_type, action_desc, co2_saved, points, caption, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      postId, p.userId, p.leaderboardId || null, p.image || '', p.imageHash || null, p.phash || null,
      p.aiResult.actionType, p.aiResult.specificAction,
      co2, finalPoints,
      p.caption || '', JSON.stringify((p.taggedUserIds || []).slice(0, 3))
    );

    awardPoints(p.userId, p.leaderboardId, finalPoints, { source: 'eco_action', sourceId: postId });

    // Tagging notifies friends; it does NOT mint points for them (anti-inflation).
    const tagger = db.prepare('SELECT name FROM users WHERE id = ?').get(p.userId);
    for (const tagId of (p.taggedUserIds || []).slice(0, 3)) {
      if (tagId && tagId !== p.userId && db.prepare('SELECT 1 FROM users WHERE id = ?').get(tagId)) {
        db.prepare('INSERT INTO notifications (id, user_id, type, message) VALUES (?, ?, ?, ?)')
          .run(uuid(), tagId, 'tag', `${tagger?.name || 'Someone'} tagged you in an eco action`);
      }
    }

    checkAndAwardBadges(p.userId, p.leaderboardId);

    return {
      postId, points: finalPoints, co2Saved: co2, breakdown: result.breakdown,
      explanation: result.explanation, multiplier: result.multiplier, bonuses: result.bonuses,
    };
  });
  return run(params);
}

function checkAndAwardBadges(userId, leaderboardId) {
  const db = getDb();
  const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(userId)?.c || 0;
  const trashCount = db.prepare('SELECT COUNT(*) as c FROM trash_reports WHERE user_id = ?').get(userId)?.c || 0;

  const toCheck = [
    { type: 'first_action', condition: postCount >= 1 },
    { type: 'trash_hero', condition: trashCount >= 3 },
    { type: 'ten_actions', condition: postCount >= 10 },
  ];
  if (leaderboardId) {
    const member = db.prepare('SELECT streak FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, userId);
    toCheck.push({ type: 'seven_day_streak', condition: (member?.streak || 0) >= 7 });
    const top3 = db.prepare('SELECT user_id FROM leaderboard_members WHERE leaderboard_id = ? ORDER BY points DESC LIMIT 3').all(leaderboardId);
    toCheck.push({ type: 'top_three', condition: top3.some(r => r.user_id === userId) });
  }
  const ins = db.prepare('INSERT OR IGNORE INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)');
  for (const b of toCheck) if (b.condition) ins.run(uuid(), userId, b.type);
}

module.exports = { awardPoints, getUserContext, processEcoAction, checkAndAwardBadges, recordLedger };

