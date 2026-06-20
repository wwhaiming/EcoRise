/* EcoRise — School Footprint Insights routes (Direction B).
 *
 * Human-in-the-loop design note:
 *   Decision the AI does NOT make: approving a recommendation for public display
 *   or operational action (e.g. ordering less food, emailing parents, adjusting
 *   schedules). The AI proposes; a named human role — sustainability_coordinator
 *   or cafeteria_manager — must click "Approve" to move the recommendation from
 *   "proposed" to "approved". Only approved recommendations are shown on the
 *   school-wide public leaderboard feed as a school-wide goal.
 *   A human must remain in control here because: the AI's predictions carry
 *   ±15% uncertainty and could cause real operational problems (under-ordering
 *   food leading to hungry students, over-alerting staff) if acted upon
 *   automatically without review.
 */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { detectAnomalies, predictCafeteria, rankRecommendations, weeklyStats } = require('../utils/footprintInsights');
const { generateFootprintSummary } = require('../utils/aiClient');

const router = express.Router();

// Cached insight computation — re-run at most once per hour.
let _cache = null;
let _cacheAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000;

function computeInsights(db) {
  const now = Date.now();
  if (_cache && now - _cacheAt < CACHE_TTL_MS) return _cache;
  const anomalies = detectAnomalies(db);
  const cafeteria = predictCafeteria(db);
  const recommendations = rankRecommendations(db, anomalies, cafeteria);
  _cache = { anomalies, cafeteria, recommendations };
  _cacheAt = now;
  return _cache;
}

// ── GET /api/footprint/insights — main dashboard payload ──
router.get('/insights', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const { anomalies, cafeteria, recommendations } = computeInsights(db);
    const chart = weeklyStats(db);

    // Load or generate AI plain-language summary (cached by current week).
    const weekStart = getMondayISO(new Date());
    let aiSummary = db.prepare('SELECT * FROM fp_ai_summaries WHERE week_start = ?').get(weekStart);
    if (!aiSummary) {
      const result = await generateFootprintSummary({
        anomalies: anomalies.slice(0, 2),
        predictions: cafeteria.predictions.slice(0, 3),
        recommendations,
      });
      const id = uuid();
      db.prepare(
        'INSERT OR REPLACE INTO fp_ai_summaries (id, week_start, summary, is_mock) VALUES (?, ?, ?, ?)'
      ).run(id, weekStart, result.summary, result.isMock ? 1 : 0);
      aiSummary = { id, week_start: weekStart, summary: result.summary, is_mock: result.isMock ? 1 : 0 };
    }

    // Load current recommendations from DB (persisted per week so approvals survive restarts).
    let dbRecs = db.prepare(
      'SELECT * FROM fp_recommendations WHERE week_start = ? ORDER BY created_at'
    ).all(weekStart);

    // If none exist yet for this week, insert the computed ones.
    if (dbRecs.length === 0 && recommendations.length > 0) {
      const ins = db.prepare(
        'INSERT INTO fp_recommendations (id, week_start, category, title, reasoning, estimated_impact, kg_co2e_per_year, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      );
      for (const r of recommendations) {
        ins.run(uuid(), weekStart, r.category, r.title, r.reasoning, r.estimated_impact || '', r.kgCO2ePerYear || 0, 'proposed');
      }
      dbRecs = db.prepare(
        'SELECT * FROM fp_recommendations WHERE week_start = ? ORDER BY created_at'
      ).all(weekStart);
    }

    res.json({
      school: { name: 'Greenfield High', studentCount: 850 },
      anomalies,
      cafeteria,
      recommendations: dbRecs,
      chart,
      aiSummary: {
        text: aiSummary.summary,
        isMock: !!aiSummary.is_mock,
        weekStart: aiSummary.week_start,
      },
    });
  } catch (err) {
    console.error('footprint insights error:', err);
    res.status(500).json({ error: 'Could not compute footprint insights' });
  }
});

// ── POST /api/footprint/recommendations/:id/approve ──
// Two-step gate: proposed → approved. Only the sustainability coordinator role
// (or organizer of the board, approximated by any authenticated user for the demo)
// may approve. A real deploy would add a role check here.
router.post('/recommendations/:id/approve', authMiddleware, (req, res) => {
  const db = getDb();
  const rec = db.prepare('SELECT * FROM fp_recommendations WHERE id = ?').get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
  if (rec.status === 'approved') return res.json({ ok: true, alreadyApproved: true, recommendation: rec });

  db.prepare(
    'UPDATE fp_recommendations SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?'
  ).run('approved', req.userId, new Date().toISOString(), rec.id);

  const updated = db.prepare('SELECT * FROM fp_recommendations WHERE id = ?').get(rec.id);
  res.json({ ok: true, recommendation: updated });
});

// ── POST /api/footprint/recommendations/:id/assign ──
// Assign a recommendation to a named staff role with an optional free-text note.
router.post('/recommendations/:id/assign', authMiddleware, (req, res) => {
  const { assignedTo, note } = req.body || {};
  if (!assignedTo || typeof assignedTo !== 'string') {
    return res.status(400).json({ error: 'assignedTo is required' });
  }
  const db = getDb();
  const rec = db.prepare('SELECT id FROM fp_recommendations WHERE id = ?').get(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Recommendation not found' });

  db.prepare(
    'UPDATE fp_recommendations SET assigned_to = ?, assigned_note = ? WHERE id = ?'
  ).run(
    String(assignedTo).slice(0, 100),
    String(note || '').slice(0, 500),
    rec.id
  );
  const updated = db.prepare('SELECT * FROM fp_recommendations WHERE id = ?').get(rec.id);
  res.json({ ok: true, recommendation: updated });
});

// ── POST /api/footprint/flag — flag any AI-generated insight card as inaccurate ──
// Logs to fp_insight_feedback table (responsible AI / user input validation).
router.post('/flag', authMiddleware, (req, res) => {
  const { insightType, insightRef, reason } = req.body || {};
  if (!insightType || !insightRef) {
    return res.status(400).json({ error: 'insightType and insightRef are required' });
  }
  const db = getDb();
  db.prepare(
    'INSERT INTO fp_insight_feedback (id, insight_type, insight_ref, user_id, reason) VALUES (?, ?, ?, ?, ?)'
  ).run(
    uuid(),
    String(insightType).slice(0, 50),
    String(insightRef).slice(0, 200),
    req.userId || null,
    String(reason || '').slice(0, 1000)
  );
  res.json({ ok: true });
});

// ── DELETE cache bust (for testing) ──
router.post('/refresh', authMiddleware, (req, res) => {
  _cache = null;
  _cacheAt = 0;
  res.json({ ok: true });
});

// Returns the ISO date string for the Monday of the given date's week.
function getMondayISO(d) {
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1 - day);
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return mon.toISOString().slice(0, 10);
}

module.exports = router;
