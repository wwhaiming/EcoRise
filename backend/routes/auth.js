/* EcoRise — Auth routes */
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDb } = require('../db');
const { signToken, authMiddleware } = require('../middleware/auth');
const { issueCsrf } = require('../middleware/csrf');
const { body } = require('../utils/validate');

const router = express.Router();
// Well-formed bcrypt hash compared against on the "user not found" / password-less
// path so login timing is the same whether or not the email exists. A malformed
// placeholder (e.g. zero-padded) makes bcrypt.compare short-circuit in microseconds,
// which leaks account existence by timing — defeating the whole purpose.
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('ecorise-timing-equalizer-not-a-real-password', 12);
const BASE_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
};
const PERSISTENT_COOKIE = { ...BASE_COOKIE, maxAge: 7 * 24 * 60 * 60 * 1000 };
const CLEAR_COOKIE = { ...BASE_COOKIE };
const CLEAR_CSRF_COOKIE = { httpOnly: false, secure: BASE_COOKIE.secure, sameSite: BASE_COOKIE.sameSite };

function setSession(res, userId, rememberMe = false) {
  res.cookie('token', signToken(userId), rememberMe ? PERSISTENT_COOKIE : BASE_COOKIE);
  issueCsrf(res);
}

router.post('/signup', body('signup'), async (req, res) => {
  try {
    const { email, password, name } = req.valid;
    const db = getDb();
    // Do not emit a distinctive "email already registered" response — that is a
    // noise-free account-enumeration oracle that undoes the login path's timing
    // hardening. Mirror the login surface instead: if the email already exists, log
    // the user in when they prove ownership with the correct password; otherwise
    // return the same generic error a failed login gives. A genuinely new email falls
    // through to account creation below.
    const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (existing) {
      const ok = await bcrypt.compare(password, existing.password_hash || DUMMY_PASSWORD_HASH);
      if (!ok) return res.status(401).json({ error: 'Invalid email or password' });
      setSession(res, existing.id, !!req.valid.rememberMe);
      return res.json({ user: { id: existing.id, email: existing.email, name: existing.name, handle: existing.handle, avatar: existing.avatar } });
    }
    const id = uuid();
    const passwordHash = await bcrypt.hash(password, 12);
    const base = '@' + (name || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const displayName = name || email.split('@')[0];
    let handle = base, attempt = 0;
    while (db.prepare('SELECT id FROM users WHERE handle = ?').get(handle)) handle = base + (++attempt);

    db.prepare('INSERT INTO users (id, email, password_hash, name, handle) VALUES (?, ?, ?, ?, ?)')
      .run(id, email, passwordHash, displayName, handle);

    setSession(res, id, !!req.valid.rememberMe);
    res.json({ user: { id, email, name: displayName, handle, avatar: '' } });
  } catch (err) {
    console.error('Signup error:', err && err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', body('login'), async (req, res) => {
  try {
    const { email, password } = req.valid;
    const db = getDb();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Constant-ish: always run a compare to reduce user-enumeration timing.
    const ok = await bcrypt.compare(password, (user && user.password_hash) || DUMMY_PASSWORD_HASH);
    if (!user || !ok) return res.status(401).json({ error: 'Invalid email or password' });

    setSession(res, user.id, !!req.valid.rememberMe);
    res.json({ user: { id: user.id, email: user.email, name: user.name, handle: user.handle, avatar: user.avatar } });
  } catch (err) {
    console.error('Login error:', err && err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', CLEAR_COOKIE);
  res.clearCookie('csrf', CLEAR_CSRF_COOKIE);
  res.json({ success: true });
});

router.get('/me', authMiddleware, (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT id, email, name, handle, avatar, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  issueCsrf(res); // refresh CSRF token on session bootstrap
  res.json({ user });
});

module.exports = router;
