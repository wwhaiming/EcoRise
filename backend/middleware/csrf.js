/* GeoRise — CSRF protection (double-submit cookie).
 * Enforced for ANY state-changing request that carries a session cookie. A
 * Bearer-token request that also happens to send a cookie is still protected,
 * because a cross-site attacker cannot set the X-CSRF-Token header. Auth routes
 * are exempt (login/signup/logout establish a session; that is not a CSRF risk). */
const crypto = require('crypto');

function issueCsrf(res) {
  const token = crypto.randomBytes(24).toString('hex');
  res.cookie('csrf', token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

function csrfGuard(req, res, next) {
  if (req.path.startsWith('/api/auth/')) return next();
  const mutating = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const hasCookieSession = !!req.cookies?.token;
  if (mutating && hasCookieSession) {
    const header = req.headers['x-csrf-token'];
    const cookie = req.cookies?.csrf;
    if (!header || !cookie || header !== cookie) {
      return res.status(403).json({ error: 'CSRF token missing or invalid' });
    }
  }
  next();
}

module.exports = { issueCsrf, csrfGuard };

