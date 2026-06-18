/* GeoRise — short-lived eco-action analysis cache.
 *
 * Why: the eco-action flow is two calls — first to analyze (so the UI can ask a
 * follow-up like "how many miles?"), then to create the post once the user
 * confirms. Without a cache the server would run the (paid, non-deterministic)
 * vision model TWICE for the same photo and could even reach a different verdict
 * the second time. Caching the verified analysis by (userId, imageHash) for a few
 * minutes makes the create step reuse the SAME server-derived result — never a
 * client-supplied one — so it is both cheaper and tamper-proof.
 */

const TTL_MS = Number(process.env.ANALYSIS_TTL_MS || 10 * 60 * 1000); // 10 min
const MAX_ENTRIES = 5000;
const store = new Map();

const keyOf = (userId, hash) => `${userId}:${hash}`;

function prune() {
  const now = Date.now();
  for (const [k, v] of store) if (v.expires <= now) store.delete(k);
}

// Reclaim expired entries on roughly the TTL cadence instead of only when the map
// hits MAX_ENTRIES, so memory stays bounded under steady low-volume traffic.
// unref() so it never holds the process open (e.g. under the test runner).
const _sweep = setInterval(prune, TTL_MS);
if (_sweep.unref) _sweep.unref();

function get(userId, hash) {
  if (!userId || !hash) return null;
  const e = store.get(keyOf(userId, hash));
  if (!e) return null;
  if (e.expires <= Date.now()) { store.delete(keyOf(userId, hash)); return null; }
  return e.result;
}

function set(userId, hash, result) {
  if (!userId || !hash) return;
  if (store.size >= MAX_ENTRIES) {
    prune();
    // Hard cap: if a burst of >MAX_ENTRIES live (unexpired) keys means prune reclaimed
    // nothing, evict oldest-first (Map preserves insertion order) so size never grows
    // unbounded — the MAX_ENTRIES invariant holds even under sustained load.
    while (store.size >= MAX_ENTRIES) {
      const oldest = store.keys().next().value;
      if (oldest === undefined) break;
      store.delete(oldest);
    }
  }
  store.set(keyOf(userId, hash), { result, expires: Date.now() + TTL_MS });
}

function clear(userId, hash) {
  store.delete(keyOf(userId, hash));
}

module.exports = { get, set, clear };

