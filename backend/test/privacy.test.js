/* EcoRise — Privacy / FERPA-COPPA integration tests (Phase 2).
 * Run: npm test
 *
 * Proves the compliance surface end-to-end: the consent gate blocks uploads,
 * consent unblocks them, image retention minimizes what we store, the teacher
 * review queue holds + reverses posts, cross-board access is denied, and the
 * data-subject export/delete rights work. Hermetic (no key, mock AI path). */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-' + 'x'.repeat(40);
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = '';
process.env.GOOGLE_API_KEY = '';
process.env.OPENAI_API_KEY = '';                 // mock vision/embeddings path
process.env.MOCK_ECO_ALWAYS_PASS = 'true';       // let eco posts pass so we can test the gate, not the classifier
const DB = path.join(__dirname, 'test-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const request = require('supertest');
const app = require('../server');
const { getDb } = require('../db');
const { signToken } = require('../middleware/auth');
const P = require('../utils/privacy');

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
function png(seed) { return PNG.slice(0, -8) + (seed.toString(36).padStart(6, '0')) + '=='; }
const auth = (t) => ['Authorization', `Bearer ${t}`];

let seq = 0;
async function newUser(name) {
  const email = `priv${++seq}_${Date.now()}@test.dev`;
  const r = await request(app).post('/api/auth/signup').send({ email, password: 'password123', name });
  assert.equal(r.status, 200, 'signup ok');
  return { id: r.body.user.id, token: signToken(r.body.user.id), email };
}
async function makeBoard(u, name) {
  return (await request(app).post('/api/leaderboards').set(...auth(u.token)).send({ name })).body;
}
async function joinBoard(u, board) {
  return request(app).post(`/api/leaderboards/${board.id}/join`).set(...auth(u.token)).send({ inviteCode: board.inviteCode });
}
async function setPrivacy(u, board, body) {
  return request(app).post(`/api/privacy/boards/${board.id}/privacy`).set(...auth(u.token)).send(body);
}

test.after(() => { try { for (const f of [DB, DB + '-shm', DB + '-wal']) fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {} });

test('new board defaults to classroom consent; a joined member is blocked from posting', async () => {
  const teacher = await newUser('Teacher'); const student = await newUser('Student');
  const board = await makeBoard(teacher, 'Bio 101');
  await joinBoard(student, board);

  const c = await request(app).get(`/api/privacy/consent?leaderboardId=${board.id}`).set(...auth(student.token));
  assert.equal(c.status, 200);
  assert.equal(c.body.board.consentMode, 'classroom');
  assert.equal(c.body.satisfied, false, 'student has no consent yet');

  const blocked = await request(app).post('/api/posts').set(...auth(student.token)).send({ image: png(1), leaderboardId: board.id, miles: 5 });
  assert.equal(blocked.status, 403, 'upload blocked without consent');
  assert.equal(blocked.body.reason, 'needs_consent');
});

test('self-attested classroom consent unblocks the student; organizer can grant for a student', async () => {
  const teacher = await newUser('T2'); const s1 = await newUser('S1'); const s2 = await newUser('S2');
  const board = await makeBoard(teacher, 'Chem');
  await joinBoard(s1, board); await joinBoard(s2, board);

  // s1 self-attests
  const att = await request(app).post('/api/privacy/consent').set(...auth(s1.token)).send({ leaderboardId: board.id, status: 'attested' });
  assert.equal(att.status, 200);
  assert.equal(att.body.satisfied, true);
  const ok = await request(app).post('/api/posts').set(...auth(s1.token)).send({ image: png(2), leaderboardId: board.id, miles: 5 });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.accepted, true, 'consented student can post');

  // teacher grants for s2; a non-organizer cannot grant for someone else
  const stolen = await request(app).post('/api/privacy/consent').set(...auth(s1.token)).send({ leaderboardId: board.id, userId: s2.id, status: 'granted' });
  assert.equal(stolen.status, 403, 'a student cannot grant consent for another student');
  const grant = await request(app).post('/api/privacy/consent').set(...auth(teacher.token)).send({ leaderboardId: board.id, userId: s2.id, status: 'granted', method: 'parent form on file' });
  assert.equal(grant.status, 200);
  assert.equal(grant.body.satisfied, true);
});

test('retention: do_not_store keeps no image; default minimize never stores the original', async () => {
  const teacher = await newUser('T3');
  const board = await makeBoard(teacher, 'Retention');           // organizer is auto-consented
  await setPrivacy(teacher, board, { retentionMode: 'do_not_store' });
  const r1 = await request(app).post('/api/posts').set(...auth(teacher.token)).send({ image: png(3), leaderboardId: board.id, miles: 5 });
  assert.equal(r1.status, 200); assert.equal(r1.body.accepted, true);
  const row1 = getDb().prepare('SELECT image, derived_label, retention_mode FROM posts WHERE id = ?').get(r1.body.postId);
  assert.equal(row1.image, '', 'do_not_store keeps no image');
  assert.equal(row1.retention_mode, 'do_not_store');
  assert.ok(row1.derived_label && row1.derived_label.length > 0, 'derived label retained for the feed tile');

  const board2 = await makeBoard(teacher, 'Minimize');           // default retention = minimize
  const r2 = await request(app).post('/api/posts').set(...auth(teacher.token)).send({ image: png(4), leaderboardId: board2.id, miles: 5 });
  const row2 = getDb().prepare('SELECT image FROM posts WHERE id = ?').get(r2.body.postId);
  assert.notEqual(row2.image, png(4), 'the full-resolution original is never stored');
  assert.ok(row2.image === '' || row2.image.startsWith('data:image/jpeg'), 'minimize stores a thumbnail or nothing');
});

test('teacher review: pending posts are hidden from the feed; reject reverses points', async () => {
  const teacher = await newUser('T4');
  const board = await makeBoard(teacher, 'Reviewed');
  await setPrivacy(teacher, board, { reviewRequired: true });

  const before = getDb().prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, teacher.id).points;
  const post = await request(app).post('/api/posts').set(...auth(teacher.token)).send({ image: png(11), leaderboardId: board.id, miles: 5 });
  assert.equal(post.status, 200);
  assert.equal(post.body.pendingReview, true, 'post is held for review');

  const feed = await request(app).get(`/api/posts?leaderboardId=${board.id}`).set(...auth(teacher.token));
  assert.ok(!feed.body.posts.some(p => p.id === post.body.postId), 'pending post is not in the feed');

  const queue = await request(app).get(`/api/privacy/boards/${board.id}/review-queue`).set(...auth(teacher.token));
  assert.ok(queue.body.pending.some(p => p.id === post.body.postId), 'post appears in the review queue');

  const rej = await request(app).post(`/api/privacy/posts/${post.body.postId}/review`).set(...auth(teacher.token)).send({ decision: 'reject', reason: 'not eco' });
  assert.equal(rej.status, 200);
  assert.equal(rej.body.reversedPoints, post.body.points, 'rejected post claws back exactly the points it awarded');
  const after = getDb().prepare('SELECT points FROM leaderboard_members WHERE leaderboard_id=? AND user_id=?').get(board.id, teacher.id).points;
  assert.equal(after, before, 'member points restored after rejection');
});

test('cross-board isolation: a member cannot read another board\'s audit or set its policy', async () => {
  const t1 = await newUser('Owner1'); const t2 = await newUser('Owner2');
  const b1 = await makeBoard(t1, 'Board One'); const b2 = await makeBoard(t2, 'Board Two');

  const audit = await request(app).get(`/api/privacy/audit?leaderboardId=${b2.id}`).set(...auth(t1.token));
  assert.equal(audit.status, 403, 'outsider cannot read another board\'s audit log');
  const setOther = await setPrivacy(t1, b2, { retentionMode: 'standard' });
  assert.equal(setOther.status, 403, 'outsider cannot change another board\'s privacy policy');
  // the real organizer can read its own audit (board.create wrote a consent.granted row)
  const own = await request(app).get(`/api/privacy/audit?leaderboardId=${b1.id}`).set(...auth(t1.token));
  assert.equal(own.status, 200);
  assert.ok(Array.isArray(own.body.audit));
});

test('data-subject rights: export returns everything, delete cascades and ends the session', async () => {
  const u = await newUser('Exporter');
  const board = await makeBoard(u, 'Mine');
  await request(app).post('/api/posts').set(...auth(u.token)).send({ image: png(21), leaderboardId: board.id, miles: 5 });

  const ex = await request(app).get('/api/privacy/export').set(...auth(u.token));
  assert.equal(ex.status, 200);
  assert.equal(ex.body.user.id, u.id);
  assert.equal(ex.body.organizes.length, 1, 'export lists boards the user organizes');
  assert.ok(ex.body.posts.length >= 1 && Array.isArray(ex.body.consent));

  const badConfirm = await request(app).post('/api/privacy/account/delete').set(...auth(u.token)).send({});
  assert.equal(badConfirm.status, 400, 'delete requires explicit confirm:true');

  const del = await request(app).post('/api/privacy/account/delete').set(...auth(u.token)).send({ confirm: true });
  assert.equal(del.status, 200);
  assert.ok(del.body.deleted.organizedBoards >= 1);
  assert.equal(getDb().prepare('SELECT 1 FROM users WHERE id = ?').get(u.id), undefined, 'user row erased');
  assert.equal(getDb().prepare('SELECT 1 FROM leaderboards WHERE id = ?').get(board.id), undefined, 'organized board erased');
  const me = await request(app).get('/api/auth/me').set(...auth(u.token));
  assert.equal(me.status, 404, 'session no longer resolves to a user');
});

test('pseudonymous board masks other members to initials; you still see yourself', async () => {
  const teacher = await newUser('Teach'); const s1 = await newUser('Maya Chen');
  const board = await makeBoard(teacher, 'Pseudo');
  await joinBoard(s1, board);
  const set = await setPrivacy(teacher, board, { displayMode: 'initials' });
  assert.equal(set.status, 200);
  const view = await request(app).get(`/api/leaderboards/${board.id}`).set(...auth(s1.token));
  assert.equal(view.status, 200);
  const me = view.body.members.find(m => m.isYou);
  const other = view.body.members.find(m => !m.isYou);
  assert.equal(me.name, 'Maya Chen', 'you see your own real name');
  assert.ok(/^[A-Z]\.([A-Z]\.)?$/.test(other.name), `other should be masked to initials, got "${other.name}"`);
  assert.equal(other.handle, '', 'other member handle hidden when pseudonymous');
});

test('pseudonymous board also masks poster names in the FEED (not just the leaderboard)', async () => {
  const teacher = await newUser('Teacher Name'); const s1 = await newUser('Stu One');
  const board = await makeBoard(teacher, 'PseudoFeed');
  await joinBoard(s1, board);
  await setPrivacy(teacher, board, { displayMode: 'initials' });
  const post = await request(app).post('/api/posts').set(...auth(teacher.token)).send({ image: png(31), leaderboardId: board.id, miles: 5 });
  assert.equal(post.body.accepted, true);
  const feed = await request(app).get(`/api/posts?leaderboardId=${board.id}`).set(...auth(s1.token));
  assert.equal(feed.status, 200);
  const tp = feed.body.posts.find(p => p.user_id === teacher.id);
  assert.ok(tp, 'teacher post present in feed');
  assert.ok(/^[A-Z]\.([A-Z]\.)?$/.test(tp.user_name), `feed name should be masked, got "${tp.user_name}"`);
  assert.equal(tp.user_handle, '', 'feed handle hidden when pseudonymous');
});

test('a reviewed post cannot be re-reviewed (no approve-after-reject)', async () => {
  const teacher = await newUser('Rev'); const board = await makeBoard(teacher, 'Rev2');
  await setPrivacy(teacher, board, { reviewRequired: true });
  const post = await request(app).post('/api/posts').set(...auth(teacher.token)).send({ image: png(41), leaderboardId: board.id, miles: 5 });
  assert.equal(post.body.pendingReview, true);
  const rej = await request(app).post(`/api/privacy/posts/${post.body.postId}/review`).set(...auth(teacher.token)).send({ decision: 'reject' });
  assert.equal(rej.status, 200);
  const again = await request(app).post(`/api/privacy/posts/${post.body.postId}/review`).set(...auth(teacher.token)).send({ decision: 'approve' });
  assert.equal(again.status, 409, 'an already-reviewed post must not be re-reviewable');
});

test('public model/data card is served', async () => {
  const r = await request(app).get('/api/privacy/policy');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body.models) && r.body.models.length >= 2, 'lists the AI models with limits');
  assert.ok(r.body.retention && r.body.retention.default.includes('minimize'));
});

test('purgeExpiredImages nulls images past their retention window', async () => {
  const db = getDb();
  const u = await newUser('Purge');
  const { v4: uuid } = require('uuid');
  const id = uuid();
  db.prepare("INSERT INTO posts (id, user_id, image, action_type, action_desc, image_expires_at) VALUES (?, ?, ?, 'food', 'x', '2000-01-01 00:00:00')")
    .run(id, u.id, 'data:image/jpeg;base64,AAAA');
  const res = P.purgeExpiredImages(db);
  assert.ok(res.posts >= 1, 'at least the expired post is purged');
  assert.equal(db.prepare('SELECT image FROM posts WHERE id = ?').get(id).image, '', 'expired image nulled');
});
