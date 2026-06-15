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
      next_reset TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS leaderboard_members (
      leaderboard_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_action_date TEXT,
      joined_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (leaderboard_id, user_id),
      FOREIGN KEY (leaderboard_id) REFERENCES leaderboards(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      leaderboard_id TEXT,
      image TEXT DEFAULT '',
      action_type TEXT NOT NULL,
      action_desc TEXT NOT NULL,
      co2_saved REAL DEFAULT 0,
      points INTEGER DEFAULT 0,
      caption TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      reported INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
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
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS trash_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      leaderboard_id TEXT,
      image TEXT DEFAULT '',
      severity INTEGER DEFAULT 0,
      description TEXT DEFAULT '',
      estimated_items TEXT DEFAULT '',
      location TEXT DEFAULT '',
      points INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      badge_type TEXT NOT NULL,
      earned_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

module.exports = { getDb };
