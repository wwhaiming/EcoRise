/* EcoRise — Points Engine
 * Orchestrates: AI extraction → rubric → DB update → return results
 */
const { getDb } = require('../db');
const { calculatePoints } = require('./rubric');
const { v4: uuid } = require('uuid');

/**
 * Award points to a user in a leaderboard
 */
function awardPoints(userId, leaderboardId, points) {
  const db = getDb();

  // Update leaderboard member points
  if (leaderboardId) {
    const member = db.prepare('SELECT * FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, userId);
    if (member) {
      const today = new Date().toISOString().slice(0, 10);
      const lastDate = member.last_action_date || '';
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

      let newStreak = member.streak;
      if (lastDate === today) {
        // Same day, no streak change
      } else if (lastDate === yesterday) {
        newStreak++;
      } else {
        newStreak = 1;
      }

      db.prepare(
        'UPDATE leaderboard_members SET points = points + ?, streak = ?, last_action_date = ? WHERE leaderboard_id = ? AND user_id = ?'
      ).run(points, newStreak, today, leaderboardId, userId);
    }
  }

  return { success: true, pointsAwarded: points };
}

/**
 * Get user context for multiplier calculations
 */
function getUserContext(userId, leaderboardId) {
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);

  // Check if first action today
  const todayPosts = db.prepare(
    'SELECT COUNT(*) as count FROM posts WHERE user_id = ? AND date(created_at) = ?'
  ).get(userId, today);
  const isFirstActionToday = (todayPosts?.count || 0) === 0;

  // Get streak
  let streak = 0;
  if (leaderboardId) {
    const member = db.prepare(
      'SELECT streak FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?'
    ).get(leaderboardId, userId);
    streak = member?.streak || 0;
  }

  return { isFirstActionToday, streak, isQuestCompletion: false, taggedFriends: [] };
}

/**
 * Process a full eco action: calculate points, create post, award points
 */
function processEcoAction({ userId, leaderboardId, aiResult, miles, caption, image, taggedUserIds }) {
  const db = getDb();
  const userContext = getUserContext(userId, leaderboardId);

  if (taggedUserIds && taggedUserIds.length > 0) {
    userContext.taggedFriends = taggedUserIds;
  }

  const result = calculatePoints({
    actionType: aiResult.actionType,
    specificAction: aiResult.specificAction,
    milesIfApplicable: miles,
    co2Saved: aiResult.estimatedCO2Saved || 0,
    aiExtractedData: aiResult,
    userContext,
  });

  // Create post
  const postId = uuid();
  db.prepare(`
    INSERT INTO posts (id, user_id, leaderboard_id, image, action_type, action_desc, co2_saved, points, caption, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    postId, userId, leaderboardId || null, image || '',
    aiResult.actionType, aiResult.specificAction,
    aiResult.estimatedCO2Saved || 0, result.points,
    caption || '', JSON.stringify(taggedUserIds || [])
  );

  // Award points
  awardPoints(userId, leaderboardId, result.points);

  // Award points to tagged users too
  if (taggedUserIds) {
    for (const tagId of taggedUserIds.slice(0, 3)) {
      awardPoints(tagId, leaderboardId, result.points);
    }
  }

  // Check badges
  checkAndAwardBadges(userId, leaderboardId);

  return {
    postId,
    points: result.points,
    breakdown: result.breakdown,
    explanation: result.explanation,
    multiplier: result.multiplier,
    bonuses: result.bonuses,
  };
}

/**
 * Check and award badges
 */
function checkAndAwardBadges(userId, leaderboardId) {
  const db = getDb();

  const existingBadges = db.prepare('SELECT badge_type FROM badges WHERE user_id = ?').all(userId).map(b => b.badge_type);

  const postCount = db.prepare('SELECT COUNT(*) as c FROM posts WHERE user_id = ?').get(userId)?.c || 0;
  const trashCount = db.prepare('SELECT COUNT(*) as c FROM trash_reports WHERE user_id = ?').get(userId)?.c || 0;

  const badgesToCheck = [
    { type: 'first_action', condition: postCount >= 1 },
    { type: 'trash_hero', condition: trashCount >= 3 },
    { type: 'ten_actions', condition: postCount >= 10 },
  ];

  if (leaderboardId) {
    const member = db.prepare('SELECT streak FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, userId);
    badgesToCheck.push({ type: 'seven_day_streak', condition: (member?.streak || 0) >= 7 });

    // Check if top 3
    const ranked = db.prepare('SELECT user_id FROM leaderboard_members WHERE leaderboard_id = ? ORDER BY points DESC LIMIT 3').all(leaderboardId);
    const isTop3 = ranked.some(r => r.user_id === userId);
    badgesToCheck.push({ type: 'top_three', condition: isTop3 });
  }

  for (const badge of badgesToCheck) {
    if (badge.condition && !existingBadges.includes(badge.type)) {
      db.prepare('INSERT INTO badges (id, user_id, badge_type) VALUES (?, ?, ?)').run(uuid(), userId, badge.type);
    }
  }
}

module.exports = { awardPoints, getUserContext, processEcoAction, checkAndAwardBadges };
