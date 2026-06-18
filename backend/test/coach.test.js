/* EcoRise — AI Eco Coach tests (Phases 0-5).
 * Gating, roles, retrieval, cited question generation, capped scoring (no cap
 * bypass / no re-farming), guidance, and daily tips. Fully hermetic: no API keys,
 * deterministic offline embeddings + mock generation, so the correct answer of a
 * generated MCQ is choices[0]. */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-' + 'x'.repeat(40);
process.env.NODE_ENV = 'test';
delete process.env.ANTHROPIC_API_KEY;
process.env.GEMINI_API_KEY = '';
process.env.GOOGLE_API_KEY = '';
process.env.OPENAI_API_KEY = '';  // hermetic: keep getClient()/embeddings on the offline mock path even if ../.env holds a live key
const DB = path.join(__dirname, 'coach-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { getDb } = require('../db');
const { signToken } = require('../middleware/auth');
const { seedCoachCorpus } = require('../scripts/seedCoachCorpus');
const { retrieve } = require('../utils/coachRetrieval');
const coach = require('../routes/coach');

const auth = (t) => ['Authorization', `Bearer ${t}`];
let seq = 0;
async function newUser(name) {
  const email = `coach${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'password123', name });
  assert.equal(r.status, 200, 'signup ok: ' + JSON.stringify(r.body));
  return { id: r.body.user.id, token: signToken(r.body.user.id) };
}
async function makeBoard(u, name) {
  return (await request(app).post('/api/leaderboards').set(...auth(u.token)).send({ name })).body;
}

test.after(() => { try { for (const f of [DB, DB + '-shm', DB + '-wal']) fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {} });

test('coach surface is 404 when COACH_ENABLED is off', async () => {
  process.env.COACH_ENABLED = 'false';
  const u = await newUser('Off');
  const r = await request(app).get('/api/coach/status').set(...auth(u.token));
  assert.equal(r.status, 404);
  assert.equal(r.body.enabled, false);
});

test('eval-report serves the real harness output (not hardcoded) when enabled', async () => {
  process.env.COACH_ENABLED = 'true';
  const u = await newUser('EvalCard');
  const r = await request(app).get('/api/coach/eval-report').set(...auth(u.token));
  assert.equal(r.status, 200);
  // results.json is produced by `npm run test:coach-eval` and committed; when present it
  // must carry real numeric metrics + a gate verdict, never hand-typed values.
  if (r.body.available) {
    assert.equal(typeof r.body.metrics.faithfulnessPass, 'number');
    assert.equal(typeof r.body.metrics.injectionResistance, 'number');
    assert.equal(typeof r.body.pass, 'boolean');
    assert.equal(typeof r.body.generatedAt, 'string');
  }
});

test('status reports role and enabled state', async () => {
  process.env.COACH_ENABLED = 'true';
  const u = await newUser('Stat');
  const r = await request(app).get('/api/coach/status').set(...auth(u.token));
  assert.equal(r.status, 200);
  assert.equal(r.body.enabled, true);
  assert.equal(r.body.role, 'user');
});

test('only teacher/admin can register and approve a source', async () => {
  process.env.COACH_ENABLED = 'true';
  const u = await newUser('Reg');
  const denied = await request(app).post('/api/coach/sources').set(...auth(u.token)).send({ title: 'My Source', provenance: 'open_access' });
  assert.equal(denied.status, 403);
  getDb().prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', u.id);
  const ok = await request(app).post('/api/coach/sources').set(...auth(u.token)).send({ title: 'My Source', provenance: 'open_access' });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.status, 'pending');
  const approve = await request(app).post(`/api/coach/sources/${ok.body.id}/approve`).set(...auth(u.token)).send({});
  assert.equal(approve.status, 200);
  assert.equal(approve.body.status, 'approved');
});

test('phase 1: seeded corpus is approved, embedded, idempotent, and retrievable', async () => {
  const db = getDb();
  const r1 = await seedCoachCorpus(db);
  assert.ok(r1.sources >= 2 && r1.chunks >= 4, 'seeds sources + chunks');
  assert.equal(r1.embedded, r1.chunks, 'all chunks embedded');
  const chunks1 = db.prepare("SELECT COUNT(*) c FROM eco_source_chunks").get().c;
  const r2 = await seedCoachCorpus(db);
  const chunks2 = db.prepare("SELECT COUNT(*) c FROM eco_source_chunks").get().c;
  assert.equal(chunks2, chunks1, 're-seeding does not duplicate');

  const hits = await retrieve(db, 'single-use plastic bottle waste', { k: 3 });
  assert.ok(hits.length >= 1, 'retrieval returns chunks');
  assert.ok(hits.slice(0, 2).some(h => /plastic|bottle/i.test(h.text)), 'a top hit is about plastic/bottles');
});

test('phase 2: GET /question returns a cited, schema-valid question and hides the answer', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Learner');
  const r = await request(app).get('/api/coach/question').set(...auth(u.token));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  const q = r.body.question;
  assert.ok(q.id && q.prompt && Array.isArray(q.choices) && q.choices.length >= 2, 'well-formed MCQ');
  assert.equal(q.correct, undefined, 'the correct answer must NOT be sent to the client');
  assert.ok(q.sources.length >= 1, 'question is cited');
});

test('phase 3: a wrong answer earns 0 points', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Wrong');
  const q = (await request(app).get('/api/coach/question').set(...auth(u.token))).body.question;
  const r = await request(app).post(`/api/coach/question/${q.id}/answer`).set(...auth(u.token))
    .send({ answer: 'this is clearly not the cited statement', msToAnswer: 5000 });
  assert.equal(r.status, 200);
  assert.equal(r.body.correct, false);
  assert.equal(r.body.points, 0);
});

test('phase 3: a question can only be answered once (no re-farming)', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Once');
  const board = await makeBoard(u, 'Once Cup');
  const q = (await request(app).get('/api/coach/question').set(...auth(u.token))).body.question;
  const first = await request(app).post(`/api/coach/question/${q.id}/answer`).set(...auth(u.token))
    .send({ answer: q.choices[0], msToAnswer: 5000, leaderboardId: board.id });
  assert.equal(first.status, 200);
  assert.equal(first.body.correct, true);
  const again = await request(app).post(`/api/coach/question/${q.id}/answer`).set(...auth(u.token))
    .send({ answer: q.choices[0], msToAnswer: 5000, leaderboardId: board.id });
  assert.equal(again.status, 409, 'second answer to same question is rejected');
});

test('phase 3: daily coach cap is never exceeded', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Capper');
  const board = await makeBoard(u, 'Cap Cup');
  for (let i = 0; i < 8; i++) {
    const q = (await request(app).get('/api/coach/question').set(...auth(u.token))).body.question;
    const a = await request(app).post(`/api/coach/question/${q.id}/answer`).set(...auth(u.token))
      .send({ answer: q.choices[0], msToAnswer: 5000, leaderboardId: board.id });
    assert.equal(a.status, 200, JSON.stringify(a.body));
    assert.equal(a.body.correct, true, 'mock correct answer is choices[0]');
  }
  const member = getDb().prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, u.id).points;
  assert.ok(member <= 10, 'daily coach cap holds');
  assert.equal(member, 10, 'cap reached exactly (2+3 first, then 2,2,1)');
  const ledger = getDb().prepare("SELECT COALESCE(SUM(points),0) s FROM point_events WHERE user_id=? AND source='coach_question'").get(u.id).s;
  assert.equal(ledger, member, 'ledger sum equals member coach points');
});

test('phase 3: a too-fast answer is flagged and earns 0', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Bot');
  const board = await makeBoard(u, 'Bot Cup');
  const q = (await request(app).get('/api/coach/question').set(...auth(u.token))).body.question;
  const r = await request(app).post(`/api/coach/question/${q.id}/answer`).set(...auth(u.token))
    .send({ answer: q.choices[0], msToAnswer: 100, leaderboardId: board.id });
  assert.equal(r.status, 200);
  assert.equal(r.body.correct, true);
  assert.equal(r.body.points, 0, 'too-fast answer earns nothing');
  assert.equal(r.body.cap.flagged, true);
});

test('phase 4: GET /guidance returns a cited recommendation tied to a category', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Guided');
  const r = await request(app).get('/api/coach/guidance').set(...auth(u.token));
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.guidance.recommendation, 'has a recommendation');
  assert.ok(r.body.guidance.action, 'has a concrete action');
  assert.ok(r.body.guidance.sources.length >= 1, 'guidance is cited');
});

test('phase 5: preferences + cited daily tip + opportunistic delivery', async () => {
  process.env.COACH_ENABLED = 'true';
  await seedCoachCorpus(getDb());
  const u = await newUser('Tipped');
  const pref = await request(app).post('/api/coach/preferences').set(...auth(u.token)).send({ optedIn: true, cadence: 1 });
  assert.equal(pref.status, 200);
  assert.equal(pref.body.preferences.optedIn, true);

  const tip = await request(app).get('/api/coach/tip').set(...auth(u.token));
  assert.equal(tip.status, 200);
  assert.ok(tip.body.tip && tip.body.tip.body, 'a tip is returned');
  assert.ok(tip.body.tip.sources.length >= 1, 'tip is cited');

  const db = getDb();
  const d1 = await coach.runDueCoachTips(db, u.id);
  assert.equal(d1.delivered, true, 'opted-in user gets one delivery');
  const d2 = await coach.runDueCoachTips(db, u.id);
  assert.equal(d2.delivered, false);
  assert.equal(d2.reason, 'cadence_reached', 'cadence respected (1/day)');
  const notifs = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND type='coach_tip'").get(u.id).c;
  assert.equal(notifs, 1, 'exactly one tip notification delivered');
});

test('phase 5: quiet-hours logic (incl. midnight wrap)', () => {
  assert.equal(coach.inQuietHours(23, 22, 7), true);
  assert.equal(coach.inQuietHours(3, 22, 7), true);
  assert.equal(coach.inQuietHours(12, 22, 7), false);
  assert.equal(coach.inQuietHours(10, null, null), false);
});

