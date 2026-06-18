/* EcoRise — deterministic demo seeder for judging.
 *
 *   node scripts/seedDemo.js        (or: npm run seed)
 *
 * Creates a ready-to-demo board with a known login, a populated leaderboard,
 * a few feed posts, and today's AI-style quests — so a judge can open the app
 * and immediately see the full experience without clicking through setup. Safe
 * to re-run: it wipes and rebuilds only the demo board + demo users.
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { calcNextReset } = require('../utils/seasons');

const INVITE = 'DEMOECO';
const DEMO_EMAIL = 'demo@ecorise.app';
const DEMO_DOMAIN = '@demo.ecorise.app';
// Random per run (override with DEMO_PASSWORD) — never ship a hardcoded login.
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || ('demo-' + crypto.randomBytes(4).toString('hex'));

const BOTS = [
  { name: 'Maya Chen',     handle: '@mayagrows', avatar: 'https://i.pravatar.cc/200?img=47', points: 4820, streak: 12 },
  { name: 'Devon Park',    handle: '@devonp',    avatar: 'https://i.pravatar.cc/200?img=12', points: 4610, streak: 9  },
  { name: 'Aria Nasser',   handle: '@ariaeco',   avatar: 'https://i.pravatar.cc/200?img=45', points: 4390, streak: 7  },
  { name: 'Leo Martins',   handle: '@leomar',    avatar: 'https://i.pravatar.cc/200?img=15', points: 3980, streak: 5  },
  { name: 'Priya Rao',     handle: '@priyar',    avatar: 'https://i.pravatar.cc/200?img=32', points: 3740, streak: 4  },
];

const POSTS = [
  { action_type: 'Transport', action_desc: 'Biked to campus instead of driving', co2: 2.4, points: 60, caption: 'Morning ride was unreal 🚲' },
  { action_type: 'Waste',     action_desc: 'Refilled 5 bottles at the station',  co2: 0.9, points: 25, caption: 'Single-use is so last season 💧' },
  { action_type: 'Food',      action_desc: "Composted this week's food scraps",  co2: 1.6, points: 40, caption: 'Dorm compost bin is thriving 🌱' },
  { action_type: 'Cleanup',   action_desc: 'Picked up litter at Riverside Park', co2: 0.5, points: 35, caption: 'Filled two bags before lunch 🧤' },
];

const QUESTS = [
  { title: 'Two-Wheel Tuesday', description: 'Log a bike or walk commute', action_type: 'transportation', points_base: 60, goal: 1, progress: 1 },
  { title: 'Zero-Waste Lunch',  description: 'Post a meal with no single-use plastic', action_type: 'waste', points_base: 40, goal: 1, progress: 0 },
  { title: 'Bottle Streak',     description: 'Refill a reusable bottle 3 times', action_type: 'waste', points_base: 45, goal: 3, progress: 2 },
  { title: 'Spot the Trash',    description: 'Report one litter hotspot near you', action_type: 'nature', points_base: 50, goal: 1, progress: 0 },
  { title: 'Bring a Friend',    description: 'Invite someone to your leaderboard', action_type: 'community', points_base: 75, goal: 1, progress: 0 },
];

function seed() {
  // Never seed a known-credential account into a production database.
  if ((process.env.NODE_ENV || '').toLowerCase() === 'production') {
    throw new Error('Refusing to seed demo data with NODE_ENV=production.');
  }
  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const pwHash = bcrypt.hashSync(DEMO_PASSWORD, 12);

  db.transaction(() => {
    // Demo organizer user — upsert and (re)set its password to THIS run's value.
    let demo = db.prepare('SELECT id FROM users WHERE email = ?').get(DEMO_EMAIL);
    if (demo) {
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(pwHash, demo.id);
    } else {
      const id = uuid();
      db.prepare('INSERT INTO users (id, email, password_hash, name, handle, avatar) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, DEMO_EMAIL, pwHash, 'You', '@you', 'https://i.pravatar.cc/200?img=68');
      demo = { id };
    }

    // Wipe ONLY the prior demo board owned by this demo user (never a real board
    // that merely shares the invite code), and only demo-domain bot users — so a
    // misconfigured DATABASE_URL can't clobber real accounts by handle.
    const prev = db.prepare('SELECT id FROM leaderboards WHERE invite_code = ? AND organizer_id = ?').get(INVITE, demo.id);
    if (prev) db.prepare('DELETE FROM leaderboards WHERE id = ?').run(prev.id);
    for (const b of BOTS) db.prepare('DELETE FROM users WHERE email = ?').run(`${b.handle.slice(1)}${DEMO_DOMAIN}`);

    // Board owned by the demo user.
    const boardId = uuid();
    // consent_mode='demo' opens the board for judging: the demo path has no real
    // student PII, so the consent gate (default 'classroom') is intentionally relaxed
    // here. A real class board defaults to requiring recorded consent.
    db.prepare(`INSERT INTO leaderboards (id, name, reset_interval, prize, include_self, invite_code, organizer_id, next_reset, consent_mode)
      VALUES (?, ?, 'weekly', ?, 1, ?, ?, ?, 'demo')`)
      .run(boardId, 'Greenfield High', '$250 campus store + a tree planted', INVITE, demo.id, calcNextReset('weekly'));

    // Demo user as an organizer-member with their own standing.
    db.prepare("INSERT INTO leaderboard_members (leaderboard_id, user_id, role, points, streak, last_action_date) VALUES (?, ?, 'organizer', ?, ?, ?)")
      .run(boardId, demo.id, 3610, 6, today);

    // Bot members + their feed posts.
    const insUser = db.prepare('INSERT INTO users (id, email, password_hash, name, handle, avatar) VALUES (?, ?, ?, ?, ?, ?)');
    const insMember = db.prepare('INSERT INTO leaderboard_members (leaderboard_id, user_id, role, points, streak, last_action_date) VALUES (?, ?, ?, ?, ?, ?)');
    const insPost = db.prepare(`INSERT INTO posts (id, user_id, leaderboard_id, action_type, action_desc, co2_saved, points, caption)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
    BOTS.forEach((b, i) => {
      const uid = uuid();
      insUser.run(uid, `${b.handle.slice(1)}${DEMO_DOMAIN}`, bcrypt.hashSync(uuid(), 4), b.name, b.handle, b.avatar);
      insMember.run(boardId, uid, 'member', b.points, b.streak, today);
      const p = POSTS[i % POSTS.length];
      insPost.run(uuid(), uid, boardId, p.action_type, p.action_desc, p.co2, p.points, p.caption);
    });

    // Today's quests for the demo user (so the Quests tab is populated).
    const insQuest = db.prepare(`INSERT INTO quests (id, user_id, title, description, action_type, target_details, points_base, goal, progress, date)
      VALUES (?, ?, ?, ?, ?, '', ?, ?, ?, ?)`);
    db.prepare('DELETE FROM quests WHERE user_id = ? AND date = ?').run(demo.id, today);
    for (const q of QUESTS) insQuest.run(uuid(), demo.id, q.title, q.description, q.action_type, q.points_base, q.goal, q.progress, today);
  })();

  console.log('\n🌱 EcoRise demo seeded.');
  console.log('   Login:  ' + DEMO_EMAIL + '  /  ' + DEMO_PASSWORD);
  console.log('   Board:  Greenfield High   Invite code: ' + INVITE);
  console.log('   Open the app, log in, and you land on a populated board.\n');
}

try {
  seed();
  process.exit(0);
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
}

