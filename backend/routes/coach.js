/* EcoRise — AI Eco Coach routes (Phases 0-5).
 *
 * See docs/AI_ECO_COACH_PLAN.md. The retrieval-augmented learning layer:
 *   - the whole surface is dark unless COACH_ENABLED=true,
 *   - source ingestion/approval is teacher/admin only,
 *   - the model only DRAFTS questions/guidance from retrieved approved chunks;
 *     deterministic code validates citations, runs the faithfulness gate, grades
 *     answers, and awards small CAPPED points through the idempotent ledger.
 * The LLM never awards points and never asserts an uncited claim.
 */
const express = require('express');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { body } = require('../utils/validate');
const { retrieve, ingestSourceChunks } = require('../utils/coachRetrieval');
const { gate, coverage, deterministicFaithfulness, SIM_FLOOR } = require('../utils/coachFaithfulness');
const { computeGrant } = require('../utils/coachScoring');
const { generateCoachQuestion, generateCoachGuidance, answerFromSources, summarizePaper, paperVisual } = require('../utils/aiClient');
const { estimateFootprint, actionLeverage } = require('../utils/footprintModel');
const { awardPoints } = require('../utils/pointsEngine');
const fs = require('fs');
const path = require('path');
const EVAL_RESULTS = path.join(__dirname, '..', 'test', 'coach_eval', 'results.json');

const router = express.Router();
const CATEGORIES = ['transportation', 'waste', 'food', 'energy', 'nature'];

// Hard feature gate. Read per-request so it can be flipped without a restart; when
// off the whole surface 404s as if it does not exist.
router.use((req, res, next) => {
  if (process.env.COACH_ENABLED !== 'true') {
    return res.status(404).json({ error: 'AI Eco Coach is not enabled', enabled: false });
  }
  next();
});

function requireRole(...roles) {
  return (req, res, next) => {
    const u = getDb().prepare('SELECT role FROM users WHERE id = ?').get(req.userId);
    if (!u || !roles.includes(u.role || 'user')) {
      return res.status(403).json({ error: `Requires ${roles.join(' or ')} role` });
    }
    next();
  };
}

const PROVENANCE = ['upload', 'open_access', 'agency', 'synthetic_demo'];

// ── Status (also the opportunistic daily-tip trigger) ──
router.get('/status', authMiddleware, async (req, res) => {
  const db = getDb();
  const role = db.prepare('SELECT role FROM users WHERE id = ?').get(req.userId)?.role || 'user';
  const approved = db.prepare("SELECT COUNT(*) c FROM eco_sources WHERE status = 'approved'").get().c;
  await runDueCoachTips(db, req.userId).catch(() => {}); // fail open; never block status
  res.json({ enabled: true, role, approvedSources: approved, awardsPoints: true });
});

// ── AI report card: serves the latest REAL eval-harness output (never hardcoded). ──
// Regenerate with `npm run test:coach-eval`, which writes results.json. Honest about
// being illustrative fixtures (the responsible-AI properties), not a third-party benchmark.
router.get('/eval-report', authMiddleware, (req, res) => {
  try {
    if (!fs.existsSync(EVAL_RESULTS)) return res.json({ available: false });
    res.json({ available: true, ...JSON.parse(fs.readFileSync(EVAL_RESULTS, 'utf8')) });
  } catch (_) {
    res.json({ available: false });
  }
});

// ── Sources (teacher/admin) ──
router.get('/sources', authMiddleware, (req, res) => {
  const rows = getDb().prepare(
    "SELECT id, title, authors, institution, url, provenance, pub_year, topic_tags, status FROM eco_sources WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100"
  ).all();
  res.json({ sources: rows.map(r => ({ ...r, topic_tags: safeTags(r.topic_tags) })) });
});

router.post('/sources', authMiddleware, requireRole('teacher', 'admin'), (req, res) => {
  const { title, authors, institution, url, provenance, license, pubYear, topicTags, courseId } = req.body || {};
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({ error: 'A source title (>= 3 chars) is required' });
  }
  const prov = PROVENANCE.includes(provenance) ? provenance : 'upload';
  const id = uuid();
  getDb().prepare(`INSERT INTO eco_sources
    (id, title, authors, institution, url, provenance, license, pub_year, topic_tags, owner_user_id, course_id, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`).run(
    id, title.trim(), str(authors), str(institution), str(url), prov, str(license),
    Number.isFinite(Number(pubYear)) ? Number(pubYear) : null,
    JSON.stringify(Array.isArray(topicTags) ? topicTags.slice(0, 12) : []),
    req.userId, str(courseId),
  );
  res.json({ success: true, id, status: 'pending' });
});

// Approving a source embeds its chunks so they become retrievable.
router.post('/sources/:id/approve', authMiddleware, requireRole('teacher', 'admin'), async (req, res) => {
  const db = getDb();
  const src = db.prepare('SELECT id FROM eco_sources WHERE id = ?').get(req.params.id);
  if (!src) return res.status(404).json({ error: 'Source not found' });
  const status = req.body && req.body.reject ? 'rejected' : 'approved';
  db.prepare('UPDATE eco_sources SET status = ? WHERE id = ?').run(status, req.params.id);
  let embedded = 0;
  if (status === 'approved') embedded = await ingestSourceChunks(db, req.params.id).catch(() => 0);
  res.json({ success: true, id: req.params.id, status, embedded });
});

// ── Questions ──
router.get('/question', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const topic = pickTopic(db, req);
    const difficulty = Math.max(1, Math.min(5, parseInt(req.query.difficulty, 10) || 2));

    // Reuse a cached, approved question on this topic the user has NOT answered yet
    // (so we don't pay generation on every fetch — mirrors analysisCache).
    const cached = db.prepare(`SELECT * FROM coach_questions q WHERE q.approved = 1 AND q.topic = ?
      AND NOT EXISTS (SELECT 1 FROM coach_answers a WHERE a.question_id = q.id AND a.user_id = ?)
      ORDER BY q.created_at DESC LIMIT 1`).get(topic, req.userId);
    if (cached) {
      return res.json({ question: sanitizeQuestion(cached, snippetsForChunks(db, safeJsonArr(cached.source_ids))) });
    }

    const chunks = await retrieve(db, topic, { k: 6 });
    if (!chunks.length) return res.status(503).json({ error: 'No approved learning sources yet', reason: 'no_corpus' });

    const draft = await generateCoachQuestion(chunks, { topic, difficulty });
    const v = validateGenerated(draft);
    if (!v.ok) return res.status(502).json({ error: 'Could not generate a valid question', reason: v.reason });
    const g = gate(draft, chunks);                  // citation + faithfulness gate
    if (!g.ok) return res.status(502).json({ error: 'Question failed the faithfulness gate', reason: g.reason });

    const id = uuid();
    db.prepare(`INSERT INTO coach_questions
      (id, topic, difficulty, kind, prompt, choices, correct, explanation, source_ids, learning_objective, faithfulness, approved, is_mock)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`).run(
      id, topic, difficulty, draft.kind, draft.prompt, JSON.stringify(draft.choices || []),
      draft.correct, draft.explanation, JSON.stringify(draft.sourceIds), str(draft.learningObjective),
      g.faithfulness, draft.isMock ? 1 : 0,
    );
    const stored = db.prepare('SELECT * FROM coach_questions WHERE id = ?').get(id);
    res.json({ question: sanitizeQuestion(stored, snippetsForChunks(db, draft.sourceIds)) });
  } catch (err) {
    console.error('coach /question error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/question/:id/answer', authMiddleware, body('coachAnswer'), (req, res) => {
  try {
    const db = getDb();
    const q = db.prepare('SELECT * FROM coach_questions WHERE id = ?').get(req.params.id);
    if (!q) return res.status(404).json({ error: 'Question not found' });

    // One graded attempt per question (DB-enforced too). No re-farming.
    if (db.prepare('SELECT 1 FROM coach_answers WHERE user_id = ? AND question_id = ?').get(req.userId, req.params.id)) {
      return res.status(409).json({ error: 'You already answered this question', reason: 'already_answered', accepted: false, points: 0 });
    }

    const { answer, msToAnswer, leaderboardId } = req.valid;
    const correct = gradeAnswer(q, answer);
    const info = computeGrant(db, req.userId, { correct, msToAnswer });

    // A grant only lands on a board the user actually belongs to (awardPoints also
    // no-ops otherwise); with no board target we record the attempt and award nothing.
    let board = null;
    if (info.grant > 0 && leaderboardId &&
        db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(leaderboardId, req.userId)) {
      board = leaderboardId;
    }

    const out = db.transaction(() => {
      const answerId = uuid();
      const grant = board ? info.grant : 0;
      db.prepare('INSERT INTO coach_answers (id, user_id, question_id, answer, correct, points, ms_to_answer) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(answerId, req.userId, q.id, String(answer).slice(0, 300), correct ? 1 : 0, grant, Number.isFinite(Number(msToAnswer)) ? Number(msToAnswer) : 0);
      if (grant > 0) awardPoints(req.userId, board, grant, { source: 'coach_question', sourceId: answerId });
      return { grant };
    })();

    res.json({
      accepted: true, correct, points: out.grant,
      correctAnswer: q.correct, explanation: q.explanation,
      sources: snippetsForChunks(db, safeJsonArr(q.source_ids)),
      cap: {
        dailyUsed: info.dailyUsed ?? null, dailyCap: info.dailyCap ?? null,
        weeklyUsed: info.weeklyUsed ?? null, weeklyCap: info.weeklyCap ?? null,
        reason: info.reason, flagged: !!info.flagged, awardedToBoard: !!board,
      },
    });
  } catch (err) {
    console.error('coach /answer error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Guidance (cited, tied to a weak action category) ──
router.get('/guidance', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const category = pickWeakCategory(db, req.userId);
    const chunks = await retrieve(db, category, { k: 5 });
    if (!chunks.length) return res.status(503).json({ error: 'No approved learning sources yet', reason: 'no_corpus' });
    const draft = await generateCoachGuidance(chunks, { category });
    if (!draft || draft.refusal) return res.status(502).json({ error: 'No grounded guidance available', reason: (draft && draft.refusal) || 'empty' });
    const ids = new Set(chunks.map(c => c.id));
    const sids = Array.isArray(draft.sourceIds) ? draft.sourceIds.filter(id => ids.has(id)) : [];
    if (!sids.length) return res.status(502).json({ error: 'Guidance was not properly cited', reason: 'uncited' });
    // Same faithfulness gate the /question path uses: a real citation id is not enough,
    // the guidance text itself must be lexically supported by the cited chunks. Without
    // this a model could cite a valid chunk while emitting unsupported advice.
    const f = deterministicFaithfulness(
      { correct: draft.action, explanation: `${draft.recommendation || ''} ${draft.explanation || ''}`, sourceIds: sids },
      chunks,
    );
    if (f < SIM_FLOOR) return res.status(502).json({ error: 'Guidance not supported by cited sources', reason: 'unsupported' });
    res.json({
      guidance: {
        recommendation: String(draft.recommendation || ''),
        action: String(draft.action || ''),
        explanation: String(draft.explanation || ''),
        category: draft.category || category,
        sources: snippetsForChunks(db, sids),
      },
    });
  } catch (err) {
    console.error('coach /guidance error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── Daily tip + preferences ──
router.get('/tip', authMiddleware, async (req, res) => {
  try {
    const tip = await ensureDailyTip(getDb(), req.userId);
    if (!tip) return res.json({ tip: null, reason: 'no_corpus' });
    res.json({ tip });
  } catch (err) {
    console.error('coach /tip error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/preferences', authMiddleware, body('coachPrefs'), (req, res) => {
  const db = getDb();
  upsertPrefs(db, req.userId, req.valid);
  res.json({ success: true, preferences: getPrefs(db, req.userId) });
});

// ── Research library (1000-paper corpus) ──
const RESEARCH_PROVENANCE = 'research_dataset';
// Memoize per-paper summary/visual (deterministic-ish, paid model calls) for the
// process lifetime so re-opening a paper card doesn't re-bill the model.
const _paperCache = new Map(); // `${kind}:${sourceId}` -> result

// Ask a free-form question; the answer is pulled out of the most relevant papers.
router.get('/ask', authMiddleware, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 4) return res.status(400).json({ error: 'Ask a question (at least 4 characters).' });
    const db = getDb();
    const chunks = await retrieve(db, q, { k: 6 });
    if (!chunks.length) return res.status(503).json({ error: 'No approved learning sources yet', reason: 'no_corpus' });
    const draft = await answerFromSources(q, chunks);
    if (!draft || draft.refusal) {
      return res.json({ answer: null, reason: draft && draft.refusal ? 'no_answer_in_corpus' : 'empty',
        message: 'The research corpus does not contain a grounded answer to that. Try rephrasing toward an environmental topic.' });
    }
    const ids = new Set(chunks.map(c => c.id));
    const used = Array.isArray(draft.usedSourceIds) ? draft.usedSourceIds.filter(id => ids.has(id)) : [];
    // Fall back to the top retrieved chunk if the model cited nothing valid, so the
    // answer is always shown WITH its source (never an uncited claim).
    const citeIds = used.length ? used : [chunks[0].id];
    res.json({ answer: String(draft.answer || ''), isMock: !!draft.isMock, sources: snippetsForChunks(db, citeIds) });
  } catch (err) {
    console.error('coach /ask error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Browse / search the ingested research papers.
router.get('/papers', authMiddleware, (req, res) => {
  const db = getDb();
  const q = String(req.query.q || '').trim().slice(0, 80);
  const topic = String(req.query.topic || '').trim().slice(0, 30);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 20));
  const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
  const where = ["status = 'approved'", 'provenance = ?'];
  const params = [RESEARCH_PROVENANCE];
  if (q) { where.push('title LIKE ?'); params.push(`%${q}%`); }
  if (topic) { where.push('topic_tags LIKE ?'); params.push(`%"${topic}"%`); }
  const sql = `FROM eco_sources WHERE ${where.join(' AND ')}`;
  const total = db.prepare(`SELECT COUNT(*) c ${sql}`).get(...params).c;
  const rows = db.prepare(`SELECT id, title, authors, institution, url, pub_year, topic_tags
    ${sql} ORDER BY pub_year DESC, title ASC LIMIT ? OFFSET ?`).all(...params, limit, offset);
  res.json({
    total, limit, offset,
    papers: rows.map(r => ({ id: r.id, title: r.title, authors: r.authors, year: r.pub_year,
      venue: r.institution, url: r.url, topic: safeTags(r.topic_tags)[0] || '' })),
  });
});

function loadPaper(db, id) {
  const src = db.prepare("SELECT id, title FROM eco_sources WHERE id = ? AND provenance = ?").get(id, RESEARCH_PROVENANCE);
  if (!src) return null;
  const chunk = db.prepare('SELECT text FROM eco_source_chunks WHERE source_id = ? ORDER BY ord LIMIT 1').get(id);
  return { title: src.title, abstract: chunk ? chunk.text : src.title };
}

// AI plain-language summary of one paper.
router.get('/papers/:id/summary', authMiddleware, async (req, res) => {
  try {
    const key = `summary:${req.params.id}`;
    if (_paperCache.has(key)) return res.json({ summary: _paperCache.get(key) });
    const paper = loadPaper(getDb(), req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    const summary = await summarizePaper(paper);
    _paperCache.set(key, summary);
    res.json({ summary });
  } catch (err) {
    console.error('coach /summary error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// AI structured infographic for one paper (frontend renders it as a clean visual).
router.get('/papers/:id/visual', authMiddleware, async (req, res) => {
  try {
    const key = `visual:${req.params.id}`;
    if (_paperCache.has(key)) return res.json({ visual: _paperCache.get(key) });
    const paper = loadPaper(getDb(), req.params.id);
    if (!paper) return res.status(404).json({ error: 'Paper not found' });
    const visual = await paperVisual(paper);
    _paperCache.set(key, visual);
    res.json({ visual });
  } catch (err) {
    console.error('coach /visual error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── School hidden-footprint (Direction B core) ──
// Lazily ensure the additive baseline table; isolated from db.js init, no migration.
function ensureFootprintTable(db) {
  db.prepare("CREATE TABLE IF NOT EXISTS school_baselines (leaderboard_id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT DEFAULT (datetime('now')))").run();
}
function boardForUser(db, req) {
  const lb = String(req.query.leaderboardId || req.body?.leaderboardId || '').trim();
  if (!lb) return null;
  const isMember = db.prepare('SELECT 1 FROM leaderboard_members WHERE leaderboard_id = ? AND user_id = ?').get(lb, req.userId);
  const isOrg = db.prepare('SELECT 1 FROM leaderboards WHERE id = ? AND organizer_id = ?').get(lb, req.userId);
  return (isMember || isOrg) ? lb : null;
}
// Map a footprint category to a retrieval query for the grounded recommendation.
const FOOTPRINT_QUERY = {
  electricity: 'school electricity energy conservation emissions reduction',
  natural_gas: 'building heating energy efficiency emissions',
  commuting: 'school commuting transportation emissions active travel',
  cafeteria_food: 'cafeteria food waste plant-based diet emissions reduction',
  landfill_waste: 'school waste recycling landfill diversion emissions',
  water: 'water conservation use reduction',
};

// Save a teacher/organizer baseline for the board (only board members/organizers).
router.post('/school-footprint', authMiddleware, async (req, res) => {
  const db = getDb();
  const lb = boardForUser(db, req);
  if (!lb) return res.status(403).json({ error: 'Join or organize this board to set its footprint baseline.' });
  ensureFootprintTable(db);
  const b = req.body || {};
  // Whitelist numeric inputs; everything else falls back to labeled defaults.
  const keys = ['students', 'monthlyKwh', 'monthlyGasTherms', 'busMilesPerWeek', 'pctDrivenStudents', 'dailyMealsServed', 'landfillBagsPerWeek', 'monthlyWaterM3'];
  const baseline = {};
  for (const k of keys) if (Number.isFinite(+b[k])) baseline[k] = +b[k];
  db.prepare("INSERT INTO school_baselines (leaderboard_id, data, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(leaderboard_id) DO UPDATE SET data = excluded.data, updated_at = datetime('now')").run(lb, JSON.stringify(baseline));
  res.json({ success: true, footprint: estimateFootprint(baseline) });
});

// The hidden-footprint digest: biggest institutional emitter + student action leverage +
// a grounded, cited next step. Refuses to cite when the corpus does not support it.
router.get('/school-insight', authMiddleware, async (req, res) => {
  try {
    const db = getDb();
    const lb = boardForUser(db, req);
    ensureFootprintTable(db);
    let baseline = {};
    if (lb) {
      const row = db.prepare('SELECT data FROM school_baselines WHERE leaderboard_id = ?').get(lb);
      if (row) { try { baseline = JSON.parse(row.data) || {}; } catch { baseline = {}; } }
      if (baseline.students == null) {
        const m = db.prepare('SELECT COUNT(*) c FROM leaderboard_members WHERE leaderboard_id = ?').get(lb).c;
        if (m > 0) baseline.students = m;
      }
    }
    const footprint = estimateFootprint(baseline);
    // Student action savings this week on the board (the offsetting side).
    let savedWeek = 0;
    if (lb) savedWeek = db.prepare("SELECT COALESCE(SUM(co2_saved),0) s FROM posts WHERE leaderboard_id = ? AND created_at > datetime('now','-7 day')").get(lb).s || 0;
    const leverage = actionLeverage(savedWeek, footprint, 'week');

    // Grounded, cited recommendation for the biggest emitter — same gate as /guidance.
    let recommendation = null;
    const cat = footprint.biggestEmitter?.category;
    if (cat) {
      const chunks = await retrieve(db, FOOTPRINT_QUERY[cat] || cat, { k: 5 });
      if (chunks.length) {
        const draft = await generateCoachGuidance(chunks, { category: footprint.biggestEmitter.label });
        if (draft && !draft.refusal) {
          const ids = new Set(chunks.map(c => c.id));
          const sids = Array.isArray(draft.sourceIds) ? draft.sourceIds.filter(id => ids.has(id)) : [];
          const f = sids.length ? deterministicFaithfulness({ explanation: draft.explanation || '', sourceIds: sids }, chunks) : 0;
          if (sids.length && f >= SIM_FLOOR) {
            recommendation = { recommendation: String(draft.recommendation || ''), action: String(draft.action || ''), explanation: String(draft.explanation || ''), faithfulness: f, sources: snippetsForChunks(db, sids) };
          }
        }
      }
    }
    res.json({ footprint, leverage, recommendation, hasBaseline: !!lb && Object.keys(baseline).length > 0 });
  } catch (err) {
    console.error('coach /school-insight error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── helpers ──
function pickTopic(db, req) {
  if (req.query.topic && typeof req.query.topic === 'string') return req.query.topic.slice(0, 40);
  const tags = corpusTags(db);
  if (!tags.length) return 'the environment';
  const answered = db.prepare('SELECT COUNT(*) c FROM coach_answers WHERE user_id = ?').get(req.userId).c;
  return tags[answered % tags.length];
}

function corpusTags(db) {
  const rows = db.prepare("SELECT topic_tags FROM eco_sources WHERE status = 'approved'").all();
  return [...new Set(rows.flatMap(r => safeTags(r.topic_tags)))];
}

function pickWeakCategory(db, userId) {
  const all = corpusTags(db);                       // read+parse the corpus tags once
  const filtered = all.filter(t => CATEGORIES.includes(t));
  const pool = filtered.length ? filtered : all;
  if (!pool.length) return 'the environment';
  // One grouped scan of the user's recent posts instead of one LIKE query per tag
  // (the old N+1). Bucket each pool tag by the same 5-char prefix-substring match.
  const rows = db.prepare(
    "SELECT lower(action_type) at, COUNT(*) c FROM posts WHERE user_id = ? AND created_at > datetime('now','-30 day') GROUP BY at"
  ).all(userId);
  const counts = pool.map(t => {
    const prefix = t.slice(0, 5).toLowerCase();
    let c = 0;
    for (const r of rows) if (r.at && r.at.includes(prefix)) c += r.c;
    return { t, c };
  });
  counts.sort((a, b) => a.c - b.c);
  return counts[0].t;
}

function gradeAnswer(q, answer) {
  if (q.kind === 'short') return coverage(q.correct, answer) >= 0.6;
  return String(answer || '').trim().toLowerCase() === String(q.correct || '').trim().toLowerCase();
}

function validateGenerated(q) {
  if (!q || q.refusal) return { ok: false, reason: q && q.refusal ? 'refusal' : 'empty' };
  if (typeof q.prompt !== 'string' || q.prompt.length < 8) return { ok: false, reason: 'bad_prompt' };
  if (!['mcq', 'short'].includes(q.kind)) return { ok: false, reason: 'bad_kind' };
  if (typeof q.correct !== 'string' || !q.correct) return { ok: false, reason: 'bad_correct' };
  if (typeof q.explanation !== 'string' || q.explanation.length < 8) return { ok: false, reason: 'bad_explanation' };
  if (!Array.isArray(q.sourceIds) || !q.sourceIds.length) return { ok: false, reason: 'no_citation' };
  if (q.kind === 'mcq' && (!Array.isArray(q.choices) || q.choices.length < 2)) return { ok: false, reason: 'bad_choices' };
  if (q.kind === 'mcq' && !q.choices.includes(q.correct)) return { ok: false, reason: 'correct_not_in_choices' };
  return { ok: true };
}

function sanitizeQuestion(q, sources) {
  return {
    id: q.id, topic: q.topic, difficulty: q.difficulty, kind: q.kind,
    prompt: q.prompt, choices: safeJsonArr(q.choices), learningObjective: q.learning_objective,
    faithfulness: q.faithfulness, isMock: !!q.is_mock, sources,
  };
}

function snippetsForChunks(db, chunkIds) {
  if (!Array.isArray(chunkIds) || !chunkIds.length) return [];
  const stmt = db.prepare('SELECT c.text, s.title, s.url, s.pub_year, s.institution FROM eco_source_chunks c JOIN eco_sources s ON s.id = c.source_id WHERE c.id = ?');
  const out = [];
  for (const id of chunkIds) {
    const r = stmt.get(id);
    if (r) out.push({ title: r.title, url: r.url, pubYear: r.pub_year, institution: r.institution, snippet: r.text.slice(0, 180) + (r.text.length > 180 ? '…' : '') });
  }
  return out;
}

async function ensureDailyTip(db, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const existing = db.prepare('SELECT id, body, source_ids, topic FROM coach_daily_tips WHERE user_id = ? AND deliver_date = ?').get(userId, today);
  if (existing) return tipShape(db, existing);
  const category = pickWeakCategory(db, userId);
  const chunks = await retrieve(db, category, { k: 3 });
  if (!chunks.length) return null;
  const top = chunks[0];
  const body = top.text.slice(0, 220);
  const id = uuid();
  db.prepare('INSERT INTO coach_daily_tips (id, user_id, body, source_ids, deliver_date, topic) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, body, JSON.stringify([top.id]), today, category);
  return tipShape(db, { id, body, source_ids: JSON.stringify([top.id]), topic: category });
}

function tipShape(db, row) {
  return { id: row.id, body: row.body, topic: row.topic, sources: snippetsForChunks(db, safeJsonArr(row.source_ids)) };
}

// Opportunistic push: deliver at most `cadence` coach_tip notifications/day, never
// in quiet hours, only if opted in. Returns a small status object (never throws to
// the caller path).
async function runDueCoachTips(db, userId) {
  const prefs = db.prepare('SELECT * FROM coach_user_prefs WHERE user_id = ?').get(userId);
  if (!prefs || !prefs.opted_in) return { delivered: false, reason: 'not_opted_in' };
  if (inQuietHours(new Date().getHours(), prefs.quiet_start, prefs.quiet_end)) return { delivered: false, reason: 'quiet_hours' };
  const cadence = Math.max(1, Math.min(3, prefs.cadence || 1));
  const todayCount = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id = ? AND type = 'coach_tip' AND date(created_at) = date('now')").get(userId).c;
  if (todayCount >= cadence) return { delivered: false, reason: 'cadence_reached' };
  const tip = await ensureDailyTip(db, userId);
  if (!tip) return { delivered: false, reason: 'no_corpus' };
  db.prepare('INSERT INTO notifications (id, user_id, type, message, link) VALUES (?, ?, ?, ?, ?)')
    .run(uuid(), userId, 'coach_tip', `Eco tip: ${tip.body.slice(0, 140)}`, '/coach');
  return { delivered: true, tip };
}

function inQuietHours(h, start, end) {
  if (start == null || end == null || start === end) return false;
  return start < end ? (h >= start && h < end) : (h >= start || h < end); // handle midnight wrap
}

function getPrefs(db, userId) {
  const r = db.prepare('SELECT topics, grade_level, cadence, quiet_start, quiet_end, opted_in FROM coach_user_prefs WHERE user_id = ?').get(userId);
  if (!r) return { topics: [], gradeLevel: '', cadence: 1, quietStart: null, quietEnd: null, optedIn: false };
  return { topics: safeJsonArr(r.topics), gradeLevel: r.grade_level, cadence: r.cadence, quietStart: r.quiet_start, quietEnd: r.quiet_end, optedIn: !!r.opted_in };
}

function upsertPrefs(db, userId, p) {
  const cur = db.prepare('SELECT * FROM coach_user_prefs WHERE user_id = ?').get(userId)
    || { topics: '[]', grade_level: '', cadence: 1, quiet_start: null, quiet_end: null, opted_in: 0 };
  const next = {
    user_id: userId,
    topics: p.topics !== undefined ? JSON.stringify(p.topics) : cur.topics,
    grade_level: p.gradeLevel !== undefined ? p.gradeLevel : cur.grade_level,
    cadence: p.cadence !== undefined ? p.cadence : cur.cadence,
    quiet_start: p.quietStart !== undefined ? p.quietStart : cur.quiet_start,
    quiet_end: p.quietEnd !== undefined ? p.quietEnd : cur.quiet_end,
    opted_in: p.optedIn !== undefined ? (p.optedIn ? 1 : 0) : cur.opted_in,
  };
  db.prepare(`INSERT INTO coach_user_prefs (user_id, topics, grade_level, cadence, quiet_start, quiet_end, opted_in)
    VALUES (@user_id, @topics, @grade_level, @cadence, @quiet_start, @quiet_end, @opted_in)
    ON CONFLICT(user_id) DO UPDATE SET topics=@topics, grade_level=@grade_level, cadence=@cadence,
      quiet_start=@quiet_start, quiet_end=@quiet_end, opted_in=@opted_in`).run(next);
}

function str(v) { return typeof v === 'string' ? v : ''; }
function safeTags(t) { return safeJsonArr(t); }
function safeJsonArr(t) { try { const a = JSON.parse(t); return Array.isArray(a) ? a : []; } catch { return []; } }

module.exports = router;
module.exports.runDueCoachTips = runDueCoachTips;
module.exports.inQuietHours = inQuietHours;

