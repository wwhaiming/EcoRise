/* EcoRise — SQLite database initialization */
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, 'ecorise.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    migrate();
    createIndexes();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      avatar TEXT DEFAULT '',
      google_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS leaderboards (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      reset_interval TEXT DEFAULT 'weekly',
      prize TEXT DEFAULT '',
      include_self INTEGER DEFAULT 1,
      invite_code TEXT UNIQUE,
      organizer_id TEXT NOT NULL,
      season INTEGER DEFAULT 1,
      next_reset TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_members (
      leaderboard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT DEFAULT 'member',
      points INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_action_date TEXT,
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (leaderboard_id, user_id),
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      leaderboard_id TEXT,
      image TEXT DEFAULT '',
      image_hash TEXT,
      action_type TEXT NOT NULL,
      action_desc TEXT NOT NULL,
      co2_saved REAL DEFAULT 0,
      points INTEGER DEFAULT 0,
      caption TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      reported INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      action_type TEXT NOT NULL,
      target_details TEXT DEFAULT '',
      points_base INTEGER DEFAULT 0,
      goal INTEGER DEFAULT 1,
      progress INTEGER DEFAULT 0,
      date TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      awarded INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS trash_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      leaderboard_id TEXT,
      image TEXT DEFAULT '',
      image_hash TEXT,
      severity INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      estimated_items TEXT DEFAULT '',
      location TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT DEFAULT '',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_type TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now')),
      UNIQUE (user_id, badge_type),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS point_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      leaderboard_id TEXT,
      source TEXT NOT NULL,
      source_id TEXT,
      points INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS leaderboard_seasons (
      id TEXT PRIMARY KEY,
      leaderboard_id TEXT NOT NULL,
      season INTEGER NOT NULL,
      winner_user_id TEXT,
      standings TEXT DEFAULT '[]',
      ended_at TEXT DEFAULT (datetime('now')),
      UNIQUE (leaderboard_id, season),
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE CASCADE
    );

    -- AI Eco Coach (plan: docs/AI_ECO_COACH_PLAN.md). Created here so the seed +
    -- source-approval routes have their tables, but the feature stays gated behind
    -- COACH_ENABLED and awards no points until the faithfulness/cap work lands.
    CREATE TABLE IF NOT EXISTS eco_sources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      authors TEXT DEFAULT '',
      institution TEXT DEFAULT '',
      url TEXT DEFAULT '',
      provenance TEXT NOT NULL,            -- upload | open_access | agency | synthetic_demo
      license TEXT DEFAULT '',
      pub_year INTEGER,
      topic_tags TEXT DEFAULT '[]',
      owner_user_id TEXT,
      course_id TEXT DEFAULT '',
      status TEXT DEFAULT 'pending',       -- pending | approved | rejected
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS eco_source_chunks (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      ord INTEGER NOT NULL,
      text TEXT NOT NULL,
      embedding BLOB,
      token_count INTEGER DEFAULT 0,
      topic_tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (source_id) REFERENCES eco_sources(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coach_questions (
      id TEXT PRIMARY KEY,
      topic TEXT NOT NULL,
      difficulty INTEGER DEFAULT 2,
      kind TEXT NOT NULL,                  -- mcq | short
      prompt TEXT NOT NULL,
      choices TEXT DEFAULT '[]',
      correct TEXT NOT NULL,
      explanation TEXT NOT NULL,
      source_ids TEXT NOT NULL,            -- JSON array of eco_source_chunks.id
      learning_objective TEXT DEFAULT '',
      faithfulness REAL DEFAULT 0,
      approved INTEGER DEFAULT 0,
      is_mock INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS coach_answers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      correct INTEGER NOT NULL,
      points INTEGER DEFAULT 0,
      ms_to_answer INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, question_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES coach_questions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coach_daily_tips (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      body TEXT NOT NULL,
      source_ids TEXT NOT NULL DEFAULT '[]',
      deliver_date TEXT NOT NULL,
      topic TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS coach_user_prefs (
      user_id TEXT PRIMARY KEY,
      topics TEXT DEFAULT '[]',
      grade_level TEXT DEFAULT '',
      cadence INTEGER DEFAULT 1,
      quiet_start INTEGER,
      quiet_end INTEGER,
      opted_in INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Privacy / FERPA-COPPA (Phase 2, docs/PRIVACY.md). Consent is recorded per
    -- (board, member): a school's data subjects are its leaderboard members, and
    -- consent / retention policy live on the board (the tenant boundary).
    CREATE TABLE IF NOT EXISTS consent_records (
      id TEXT PRIMARY KEY,
      leaderboard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      tier TEXT NOT NULL,                  -- demo | classroom | parent
      status TEXT NOT NULL DEFAULT 'none', -- none | attested | granted | revoked
      attested_by TEXT,                    -- teacher/organizer who attested (classroom/parent)
      method TEXT DEFAULT '',              -- how consent was obtained (free text)
      note TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE (leaderboard_id, user_id),
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Tamper-evident privacy audit trail. Intentionally has NO foreign key on the
    -- actor: the log must survive an account deletion (we retain who-did-what even
    -- after the user row is gone), so actor_user_id is a free id, nullable.
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT DEFAULT '',
      target_id TEXT DEFAULT '',
      leaderboard_id TEXT,
      detail TEXT DEFAULT '',              -- JSON
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

function migrate() {
  const adds = [
    ['users', 'role', "TEXT DEFAULT 'user'"],   // user | teacher | admin (coach source approval)
    ['leaderboards', 'season', 'INTEGER DEFAULT 1'],
    ['leaderboard_members', 'role', "TEXT DEFAULT 'member'"],
    ['posts', 'image_hash', 'TEXT'],
    ['posts', 'phash', 'TEXT'],
    ['trash_reports', 'image_hash', 'TEXT'],
    ['trash_reports', 'phash', 'TEXT'],
    ['quests', 'awarded', 'INTEGER DEFAULT 0'],
    ['notifications', 'link', "TEXT DEFAULT ''"],
    // Privacy / FERPA-COPPA (Phase 2). Board-level policy + per-post privacy state.
    // A board defaults to the privacy-forward posture (classroom consent required,
    // minimal image retention); the demo board is opened explicitly by the seed.
    ['leaderboards', 'consent_mode', "TEXT DEFAULT 'classroom'"],   // demo | classroom | parent
    ['leaderboards', 'retention_mode', "TEXT DEFAULT 'minimize'"],  // minimize | standard | 24h | do_not_store
    ['leaderboards', 'review_required', 'INTEGER DEFAULT 0'],       // teacher approves before feed/leaderboard
    ['leaderboards', 'display_mode', "TEXT DEFAULT 'names'"],        // names | initials (pseudonymous ranking for minors)
    ['posts', 'status', "TEXT DEFAULT 'published'"],                // published | pending | rejected
    ['posts', 'retention_mode', "TEXT DEFAULT 'standard'"],
    ['posts', 'image_expires_at', 'TEXT'],
    ['posts', 'derived_label', "TEXT DEFAULT ''"],                  // shown when the raw image is not retained
    ['posts', 'reviewed_by', 'TEXT'],
    ['posts', 'reviewed_at', 'TEXT'],
    ['trash_reports', 'retention_mode', "TEXT DEFAULT 'standard'"],
    ['trash_reports', 'image_expires_at', 'TEXT'],
    ['trash_reports', 'derived_label', "TEXT DEFAULT ''"],
  ];
  for (const [table, col, type] of adds) {
    try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`); } catch (_) { /* exists */ }
  }
}

function createIndexes() {
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_posts_board   ON posts(leaderboard_id, hidden, created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_user    ON posts(user_id);
    CREATE INDEX IF NOT EXISTS idx_posts_user_time ON posts(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_hash    ON posts(user_id, image_hash);
    CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_likes_post    ON post_likes(post_id);
    CREATE INDEX IF NOT EXISTS idx_trash_user    ON trash_reports(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_trash_hash    ON trash_reports(user_id, image_hash);
    CREATE INDEX IF NOT EXISTS idx_members_board ON leaderboard_members(leaderboard_id, points DESC);
    CREATE INDEX IF NOT EXISTS idx_members_user  ON leaderboard_members(user_id, leaderboard_id);
    CREATE INDEX IF NOT EXISTS idx_notif_user    ON notifications(user_id, read, created_at);
    CREATE INDEX IF NOT EXISTS idx_quests_user   ON quests(user_id, date);
    CREATE INDEX IF NOT EXISTS idx_ledger_user   ON point_events(user_id, created_at);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_source ON point_events(source, source_id) WHERE source_id IS NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_seasons_unique ON leaderboard_seasons(leaderboard_id, season);
    CREATE INDEX IF NOT EXISTS idx_chunks_source   ON eco_source_chunks(source_id);
    CREATE INDEX IF NOT EXISTS idx_sources_status  ON eco_sources(status, course_id);
    CREATE INDEX IF NOT EXISTS idx_cquestions_topic ON coach_questions(topic, difficulty, approved);
    CREATE INDEX IF NOT EXISTS idx_canswers_user   ON coach_answers(user_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_ctips_date      ON coach_daily_tips(user_id, deliver_date);
    CREATE INDEX IF NOT EXISTS idx_posts_status    ON posts(leaderboard_id, status, created_at);
    CREATE INDEX IF NOT EXISTS idx_posts_co2        ON posts(user_id, leaderboard_id, status, co2_saved);
    CREATE INDEX IF NOT EXISTS idx_posts_expiry    ON posts(image_expires_at) WHERE image_expires_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_trash_expiry    ON trash_reports(image_expires_at) WHERE image_expires_at IS NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_consent_board   ON consent_records(leaderboard_id, user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_board     ON audit_log(leaderboard_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_actor     ON audit_log(actor_user_id, created_at);
  `);
}

module.exports = { getDb };

