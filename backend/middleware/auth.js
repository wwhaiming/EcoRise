/* GeoRise — JWT authentication middleware */
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error(
    'JWT_SECRET must be set to a strong random value (>= 32 chars). ' +
    'Refusing to start with a weak/default secret. Generate one with: ' +
    "node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
}
const JWT_EXPIRY = '7d';

function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// Prefer a Bearer token when present so API/test clients are authenticated via
// the header (not the cookie). This keeps the CSRF model sound: a cookie is the
// credential ONLY when there is no Authorization header.
function getToken(req) {
  const h = req.headers.authorization;
  if (h && h.startsWith('Bearer ')) return { token: h.slice(7), via: 'bearer' };
  if (req.cookies?.token) return { token: req.cookies.token, via: 'cookie' };
  return { token: null, via: null };
}

function authMiddleware(req, res, next) {
  const { token, via } = getToken(req);
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId;
    req.authVia = via;
    next();
  } catch (_) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function optionalAuth(req, res, next) {
  const { token, via } = getToken(req);
  if (token) {
    try { req.userId = jwt.verify(token, JWT_SECRET).userId; req.authVia = via; } catch (_) { /* ignore */ }
  }
  next();
}

module.exports = { signToken, authMiddleware, optionalAuth, getToken };

