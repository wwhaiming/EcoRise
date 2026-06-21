/* EcoRise — audit fix regression test.
 * Footprint recommendation approve/assign are institutional actions: only a
 * teacher/admin or a board organizer may perform them. A plain member cannot.
 * Hermetic: no API key, temp SQLite DB. (Covers backend/routes/footprint.js authz.) */

process.env.JWT_SECRET = process.env.JWT_SECRET || ('fp-authz-test-secret-' + 'x'.repeat(24));
process.env.COACH_ENABLED = 'true';
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = '';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

const DB = path.join(__dirname, 'fp-authz-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { signToken } = require('../middleware/auth');
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

test.after(() => {
  for (const f of [DB, DB + '-shm', DB + '-wal']) {
    try { fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {}
  }
});

const auth = (t) => ['Authorization', `Bearer ${t}`];
let seq = 0;
async function signup(name) {
  const email = `fpauthz${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'pass1234', name });
  assert.equal(r.status, 200, 'signup: ' + JSON.stringify(r.body));
  return { id: r.body.user.id, token: signToken(r.body.user.id) };
}
async function makeBoard(u, name) {
  const r = await request(app).post('/api/leaderboards').set(...auth(u.token)).send({ name });
  assert.equal(r.status, 200, 'makeBoard: ' + JSON.stringify(r.body));
  return r.body.id;
}

function seedRecommendation() {
  const db = getDb();
  const id = uuid();
  db.prepare(
    "INSERT INTO fp_recommendations (id, week_start, category, title, reasoning, estimated_impact, kg_co2e_per_year, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'proposed')"
  ).run(id, '2026-01-05', 'electricity', 'Audit test rec', 'synthetic', '', 0);
  return id;
}

test('footprint approve: board organizer allowed, plain member blocked (403)', async () => {
  const organizer = await signup('FpOrganizer');
  await makeBoard(organizer, 'Authz High'); // creator becomes the board organizer
  const member = await signup('FpMember');   // organizes nothing -> not staff
  const recId = seedRecommendation();

  const denied = await request(app)
    .post(`/api/footprint/recommendations/${recId}/approve`)
    .set(...auth(member.token)).send({});
  assert.equal(denied.status, 403, 'member approve must be blocked: ' + JSON.stringify(denied.body));

  const ok = await request(app)
    .post(`/api/footprint/recommendations/${recId}/approve`)
    .set(...auth(organizer.token)).send({});
  assert.equal(ok.status, 200, 'organizer approve: ' + JSON.stringify(ok.body));
  assert.equal(ok.body.recommendation.status, 'approved');
});

test('footprint unapprove: approved -> proposed, organizer allowed, member blocked (403)', async () => {
  const organizer = await signup('FpOrganizer3');
  await makeBoard(organizer, 'Authz High 3');
  const member = await signup('FpMember3');
  const recId = seedRecommendation();

  // Approve first so there is an active goal to deactivate.
  const approved = await request(app)
    .post(`/api/footprint/recommendations/${recId}/approve`)
    .set(...auth(organizer.token)).send({});
  assert.equal(approved.body.recommendation.status, 'approved');

  const denied = await request(app)
    .post(`/api/footprint/recommendations/${recId}/unapprove`)
    .set(...auth(member.token)).send({});
  assert.equal(denied.status, 403, 'member unapprove must be blocked: ' + JSON.stringify(denied.body));

  const ok = await request(app)
    .post(`/api/footprint/recommendations/${recId}/unapprove`)
    .set(...auth(organizer.token)).send({});
  assert.equal(ok.status, 200, 'organizer unapprove: ' + JSON.stringify(ok.body));
  assert.equal(ok.body.recommendation.status, 'proposed');
  assert.equal(ok.body.recommendation.approved_by, null, 'approved_by cleared');
  assert.equal(ok.body.recommendation.approved_at, null, 'approved_at cleared');
});

test('footprint assign: board organizer allowed, plain member blocked (403)', async () => {
  const organizer = await signup('FpOrganizer2');
  await makeBoard(organizer, 'Authz High 2');
  const member = await signup('FpMember2');
  const recId = seedRecommendation();

  const denied = await request(app)
    .post(`/api/footprint/recommendations/${recId}/assign`)
    .set(...auth(member.token)).send({ assignedTo: 'Facilities' });
  assert.equal(denied.status, 403, 'member assign must be blocked: ' + JSON.stringify(denied.body));

  const ok = await request(app)
    .post(`/api/footprint/recommendations/${recId}/assign`)
    .set(...auth(organizer.token)).send({ assignedTo: 'Facilities' });
  assert.equal(ok.status, 200, 'organizer assign: ' + JSON.stringify(ok.body));
  assert.equal(ok.body.recommendation.assigned_to, 'Facilities');
});
