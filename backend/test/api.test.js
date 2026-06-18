/* GeoRise — backend integration tests (node:test + supertest).
 * Run: npm test */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

// Test env MUST be set before requiring the app/auth (which enforce JWT_SECRET).
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-' + 'x'.repeat(40);
process.env.NODE_ENV = 'test';
delete process.env.ANTHROPIC_API_KEY;        // force mock / local model
// Hermetic: server.js loads ../.env, which may hold a live GEMINI_API_KEY. Pin these
// to '' BEFORE requiring the app — dotenv never overrides an already-set var, so an
// empty (falsy) value keeps getClient() on the mock path and off the live network.
process.env.GEMINI_API_KEY = '';
process.env.GOOGLE_API_KEY = '';
process.env.OPENAI_API_KEY = '';              // same: keep eco/trash vision + embeddings on the mock path
process.env.TRASH_PROB_THRESHOLD = '1.1';     // trash detector rejects everything (deterministic)
process.env.MOCK_ECO_ALWAYS_PASS = 'true';    // let eco posts succeed so we can test points/ledger logic
process.env.MOCK_TRASH_ALWAYS_PASS = 'false'; // hermetic: ignore any local .env that flips trash to demo-pass
const DB = path.join(__dirname, 'test-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { getDb } = require('../db');
const { signToken } = require('../middleware/auth');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
function png(seed) { return PNG.slice(0, -8) + (seed.toString(36).padStart(6, '0')) + '=='; }

let seq = 0;
async function newUser(name) {
  const email = `u${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'password123', name });
  assert.equal(r.status, 200, 'signup ok: ' + JSON.stringify(r.body));
  return { id: r.body.user.id, token: signToken(r.body.user.id), email };
}
const auth = (t) => ['Authorization', `Bearer ${t}`];
async function makeBoard(u, name) {
  return (await request(app).post('/api/leaderboards').set(...auth(u.token)).send({ name })).body;
}
async function joinBoard(u, board) {
  return request(app).post(`/api/leaderboards/${board.id}/join`).set(...auth(u.token)).send({ inviteCode: board.inviteCode });
}

test.after(() => { try { for (const f of [DB, DB + '-shm', DB + '-wal']) fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {} });

test('health', async () => {
  const r = await request(app).get('/api/health');
  assert.equal(r.status, 200); assert.equal(r.body.status, 'ok');
});

test('signup rejects weak password (validation)', async () => {
  const r = await request(app).post('/api/auth/signup').send({ email: 'a@b.dev', password: 'short' });
  assert.equal(r.status, 400);
  assert.equal(r.body.details?.[0]?.message, 'Password must be at least 8 characters');
});

test('login does not leak token in body; cookie set', async () => {
  const u = await newUser('Cookie');
  const r = await request(app).post('/api/auth/login').send({ email: u.email, password: 'password123' });
  assert.equal(r.status, 200);
  assert.equal(r.body.token, undefined, 'token must NOT be in response body');
  assert.ok(String(r.headers['set-cookie'] || '').includes('token='), 'httpOnly token cookie set');
});

test('CSRF: cookie-auth mutation without token is blocked, with token allowed', async () => {
  const agent = request.agent(app);
  const email = `csrf_${Date.now()}@test.dev`;
  const su = await agent.post('/api/auth/signup').send({ email, password: 'password123', name: 'C' });
  const cookies = su.headers['set-cookie'] || [];
  const csrf = (cookies.find(c => c.startsWith('csrf=')) || '').split('=')[1]?.split(';')[0];
  const blocked = await agent.post('/api/leaderboards').send({ name: 'X' });
  assert.equal(blocked.status, 403, 'cookie mutation without CSRF header must be 403');
  const ok = await agent.post('/api/leaderboards').set('X-CSRF-Token', csrf || '').send({ name: 'CSRF Board' });
  assert.equal(ok.status, 200, 'cookie mutation with CSRF header should pass: ' + JSON.stringify(ok.body));
});

test('leaderboard: membership required to view; no email leak', async () => {
  const a = await newUser('Org'); const b = await newUser('Outsider');
  const board = await makeBoard(a, 'Eco Cup');
  const denied = await request(app).get(`/api/leaderboards/${board.id}`).set(...auth(b.token));
  assert.equal(denied.status, 403, 'non-member cannot view');
  await joinBoard(b, board);
  const view = await request(app).get(`/api/leaderboards/${board.id}`).set(...auth(b.token));
  assert.equal(view.status, 200);
  for (const m of view.body.members) assert.equal(m.email, undefined, 'member objects must not include email');
});

test('join requires a valid invite code (cannot join by raw board id)', async () => {
  const a = await newUser('Owner'); const b = await newUser('Sneaker');
  const board = await makeBoard(a, 'Private Cup');
  const noCode = await request(app).post(`/api/leaderboards/${board.id}/join`).set(...auth(b.token)).send({});
  assert.equal(noCode.status, 403, 'joining by id without invite code must be forbidden');
  const withCode = await request(app).post(`/api/leaderboards/${board.id}/join`).set(...auth(b.token)).send({ inviteCode: board.inviteCode });
  assert.equal(withCode.status, 200, 'joining with the invite code works');
});

test('unscoped global feed does not leak private-board posts', async () => {
  const a = await newUser('Poster'); const b = await newUser('Snoop');
  const board = await makeBoard(a, 'Secret Cup');
  const post = await request(app).post('/api/posts').set(...auth(a.token)).send({ image: png(555), leaderboardId: board.id, miles: 5 });
  const pid = post.body.postId;
  const feed = await request(app).get('/api/posts').set(...auth(b.token));
  assert.equal(feed.status, 200);
  assert.ok(!feed.body.posts.some(p => p.id === pid), 'non-member must not see a private-board post in the global feed');
});

test('non-member cannot read a board feed or trash list', async () => {
  const a = await newUser('Inside'); const b = await newUser('Outside');
  const board = await makeBoard(a, 'Closed Cup');
  const feed = await request(app).get(`/api/posts?leaderboardId=${board.id}`).set(...auth(b.token));
  assert.equal(feed.status, 403, 'non-member feed read must be 403');
  const trash = await request(app).get(`/api/trash?leaderboardId=${board.id}`).set(...auth(b.token));
  assert.equal(trash.status, 403, 'non-member trash read must be 403');
});

test('eco post awards points, writes ledger; ledger == member points', async () => {
  const a = await newUser('Eco');
  const board = await makeBoard(a, 'Ledger Cup');
  const r = await request(app).post('/api/posts').set(...auth(a.token))
    .send({ image: png(1), leaderboardId: board.id, miles: 5, caption: 'biked' });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.points > 0, 'points awarded');
  const db = getDb();
  const member = db.prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, a.id);
  const ledger = db.prepare('SELECT COALESCE(SUM(points),0) s FROM point_events WHERE user_id=? AND leaderboard_id=?').get(a.id, board.id).s;
  assert.equal(member.points, ledger, 'member points must equal ledger sum');
});

test('duplicate image is rejected (409)', async () => {
  const a = await newUser('Dup');
  const board = await makeBoard(a, 'Dup Cup');
  const img = png(42);
  const first = await request(app).post('/api/posts').set(...auth(a.token)).send({ image: img, leaderboardId: board.id, miles: 5 });
  assert.equal(first.status, 200);
  const second = await request(app).post('/api/posts').set(...auth(a.token)).send({ image: img, leaderboardId: board.id, miles: 5 });
  assert.equal(second.status, 409, 'duplicate image must be 409');
});

test('tagging does NOT mint points for tagged users but notifies them', async () => {
  const a = await newUser('Tagger'); const b = await newUser('Tagged');
  const board = await makeBoard(a, 'Tag Cup');
  await joinBoard(b, board);
  await request(app).post('/api/posts').set(...auth(a.token)).send({ image: png(7), leaderboardId: board.id, miles: 5, tags: JSON.stringify([b.id]) });
  const db = getDb();
  const bPoints = db.prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, b.id).points;
  assert.equal(bPoints, 0, 'tagged user must NOT receive points');
  const notif = db.prepare("SELECT COUNT(*) c FROM notifications WHERE user_id=? AND type='tag'").get(b.id).c;
  assert.ok(notif >= 1, 'tagged user gets a notification');
});

test('direct quest progress does NOT mint points (anti-cheat)', async () => {
  const a = await newUser('Quester');
  const board = await makeBoard(a, 'Quest Cup');
  const quests = (await request(app).get('/api/quests').set(...auth(a.token))).body.quests;
  const q = quests[0];
  const before = getDb().prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, a.id).points;
  const p1 = await request(app).post(`/api/quests/${q.id}/progress`).set(...auth(a.token)).send({ leaderboardId: board.id });
  assert.equal(p1.status, 200);
  assert.equal(p1.body.justCompleted, false, 'progress endpoint must NOT complete a quest (needs a verified action)');
  assert.equal(p1.body.quest.completed, 0, 'completed stays 0 so the verified path can still award it');
  assert.equal(p1.body.bonusApplied, false, 'direct progress must not mint points');
  assert.equal(p1.body.bonusPoints, 0);
  const after = getDb().prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, a.id).points;
  assert.equal(after, before, 'no points minted via the progress endpoint');
});

test('leaderboard reset archives a season and zeroes points', async () => {
  const a = await newUser('Seasoner');
  const board = await makeBoard(a, 'Season Cup');
  await request(app).post('/api/posts').set(...auth(a.token)).send({ image: png(99), leaderboardId: board.id, miles: 5 });
  const db = getDb();
  db.prepare('UPDATE leaderboards SET next_reset = ? WHERE id=?').run(new Date(Date.now() - 3600000).toISOString(), board.id);
  const view = await request(app).get(`/api/leaderboards/${board.id}`).set(...auth(a.token));
  assert.equal(view.status, 200);
  const pts = db.prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, a.id).points;
  assert.equal(pts, 0, 'points reset to 0');
  const seasons = db.prepare('SELECT COUNT(*) c FROM leaderboard_seasons WHERE leaderboard_id=?').get(board.id).c;
  assert.ok(seasons >= 1, 'a season was archived');
});

test('authz: only owner/organizer can hide a post; only organizer resolves', async () => {
  const a = await newUser('Owner2'); const b = await newUser('Rando');
  const board = await makeBoard(a, 'Mod Cup');
  await joinBoard(b, board);
  const post = await request(app).post('/api/posts').set(...auth(a.token)).send({ image: png(123), leaderboardId: board.id, miles: 5 });
  const pid = post.body.postId;
  const delDenied = await request(app).delete(`/api/posts/${pid}`).set(...auth(b.token));
  assert.equal(delDenied.status, 403, 'random member cannot hide a post');
  const resolveDenied = await request(app).post(`/api/posts/${pid}/resolve`).set(...auth(b.token));
  assert.equal(resolveDenied.status, 403, 'random member cannot resolve reports');
  const delOk = await request(app).delete(`/api/posts/${pid}`).set(...auth(a.token));
  assert.equal(delOk.status, 200, 'owner can hide own post');
});

test('users cannot edit each other', async () => {
  const a = await newUser('A'); const b = await newUser('B');
  const r = await request(app).put(`/api/users/${b.id}`).set(...auth(a.token)).send({ name: 'hacked' });
  assert.equal(r.status, 403);
});

test('non-trash image is rejected (no false-positive points)', async () => {
  const a = await newUser('Trasher');
  const board = await makeBoard(a, 'Trash Cup');
  const r = await request(app).post('/api/trash').set(...auth(a.token)).send({ image: png(5), leaderboardId: board.id });
  assert.equal(r.status, 200);
  assert.equal(r.body.accepted, false, 'non-trash must be rejected');
  assert.equal(r.body.points, 0);
});

test('eco post requires an image (no client-supplied scoring)', async () => {
  const a = await newUser('NoImg');
  const r = await request(app).post('/api/posts').set(...auth(a.token)).send({ actionType: 'transportation', co2Saved: 9999, miles: 5 });
  assert.equal(r.status, 400, 'must reject image-less manual scoring');
});

test('offline (no key) eco action is rejected without the demo flag', async () => {
  const a = await newUser('NoKey');
  const board = await makeBoard(a, 'NoKey Cup');
  const prev = process.env.MOCK_ECO_ALWAYS_PASS;
  process.env.MOCK_ECO_ALWAYS_PASS = 'false';
  try {
    const r = await request(app).post('/api/posts').set(...auth(a.token)).send({ image: png(321), leaderboardId: board.id, miles: 5 });
    assert.equal(r.status, 200);
    assert.equal(r.body.accepted, false, 'offline eco must be rejected (no fabricated points)');
    assert.equal(r.body.points, 0);
  } finally { process.env.MOCK_ECO_ALWAYS_PASS = prev; }
});

test('organizer keeps their board in the list even with includeSelf:false', async () => {
  const a = await newUser('Solo');
  const board = (await request(app).post('/api/leaderboards').set(...auth(a.token)).send({ name: 'Solo Cup', includeSelf: false })).body;
  const list = await request(app).get('/api/leaderboards').set(...auth(a.token));
  assert.equal(list.status, 200);
  assert.ok(list.body.leaderboards.some(l => l.id === board.id), 'organizer must see their own board');
});

test('ledger is idempotent per source (no double-credit on replay)', async () => {
  const a = await newUser('Idem');
  const board = await makeBoard(a, 'Idem Cup');
  const { awardPoints } = require('../utils/pointsEngine');
  const r1 = awardPoints(a.id, board.id, 50, { source: 'test', sourceId: 'fixed-source-1' });
  const r2 = awardPoints(a.id, board.id, 50, { source: 'test', sourceId: 'fixed-source-1' });
  assert.equal(r1.applied, true);
  assert.equal(r2.applied, false, 'replayed award for same source must be a no-op');
  const pts = getDb().prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, a.id).points;
  assert.equal(pts, 50, 'points credited exactly once');
});

test('join by invite code via /join (no board id): bad/missing code rejected, valid works', async () => {
  const a = await newUser('CodeOwner'); const b = await newUser('CodeJoiner');
  const board = await makeBoard(a, 'Code Cup');
  const bad = await request(app).post('/api/leaderboards/join').set(...auth(b.token)).send({ inviteCode: 'NOPE' });
  assert.equal(bad.status, 404, 'invalid invite code must be 404');
  const missing = await request(app).post('/api/leaderboards/join').set(...auth(b.token)).send({});
  assert.equal(missing.status, 400, 'missing invite code must be 400');
  const ok = await request(app).post('/api/leaderboards/join').set(...auth(b.token)).send({ inviteCode: board.inviteCode });
  assert.equal(ok.status, 200, 'valid invite code joins');
  assert.equal(ok.body.leaderboardId, board.id);
});

test('eco post response carries AI evidence (integrity + breakdown)', async () => {
  const a = await newUser('Evidence');
  const board = await makeBoard(a, 'Evidence Cup');
  const r = await request(app).post('/api/posts').set(...auth(a.token)).send({ image: png(2025), leaderboardId: board.id, miles: 5 });
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.ok(r.body.integrity, 'evidence integrity object present');
  assert.equal(r.body.integrity.checks.serverScored, 'passed', 'server-scored gate reported');
  assert.equal(r.body.integrity.checks.aiVisionGate, 'verified', 'AI gate reported as verified');
  assert.ok(Array.isArray(r.body.breakdown), 'point breakdown present for the evidence panel');
});

