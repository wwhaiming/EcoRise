/* GeoRise — AI Eco Coach scoring + caps.
 *
 * Computes how many leaderboard points a correct answer may grant, enforcing daily
 * and weekly caps so learning can NEVER out-earn verified real-world action. Caps
 * are read from the point_events ledger (the source of truth), so they hold even
 * across retries and concurrent answers. Pure given a db handle — fully testable.
 */
const DAILY_CAP = Number(process.env.COACH_DAILY_CAP || 10);
const WEEKLY_CAP = Number(process.env.COACH_WEEKLY_CAP || 40);
const BASE_POINTS = 2;
const FIRST_CORRECT_BONUS = 3;
const MIN_MS = Number(process.env.COACH_MIN_MS || 1500); // faster than this => automation, no points

function coachPointsUsed(db, userId) {
  const today = db.prepare(
    "SELECT COALESCE(SUM(points),0) s FROM point_events WHERE user_id = ? AND source = 'coach_question' AND date(created_at) = date('now')"
  ).get(userId).s;
  const week = db.prepare(
    "SELECT COALESCE(SUM(points),0) s FROM point_events WHERE user_id = ? AND source = 'coach_question' AND strftime('%Y-%W', created_at) = strftime('%Y-%W','now')"
  ).get(userId).s;
  return { today, week };
}

function isFirstCorrectToday(db, userId) {
  const c = db.prepare(
    "SELECT COUNT(*) c FROM coach_answers WHERE user_id = ? AND correct = 1 AND date(created_at) = date('now')"
  ).get(userId).c;
  return c === 0;
}

// Decide the grant for an answer. Does NOT write anything.
function computeGrant(db, userId, { correct, msToAnswer }) {
  if (!correct) return { candidate: 0, grant: 0, flagged: false, reason: 'incorrect' };
  const ms = Number(msToAnswer);
  if (Number.isFinite(ms) && ms >= 0 && ms < MIN_MS) {
    return { candidate: 0, grant: 0, flagged: true, reason: 'too_fast' };
  }
  const firstToday = isFirstCorrectToday(db, userId);
  const candidate = BASE_POINTS + (firstToday ? FIRST_CORRECT_BONUS : 0);
  const { today, week } = coachPointsUsed(db, userId);
  const remaining = Math.max(0, Math.min(DAILY_CAP - today, WEEKLY_CAP - week));
  const grant = Math.max(0, Math.min(candidate, remaining));
  return {
    candidate, grant, flagged: false,
    reason: grant < candidate ? 'cap_reached' : 'ok',
    dailyUsed: today, weeklyUsed: week, dailyCap: DAILY_CAP, weeklyCap: WEEKLY_CAP,
    firstCorrectToday: firstToday,
  };
}

module.exports = {
  computeGrant, coachPointsUsed, isFirstCorrectToday,
  DAILY_CAP, WEEKLY_CAP, BASE_POINTS, FIRST_CORRECT_BONUS, MIN_MS,
};

