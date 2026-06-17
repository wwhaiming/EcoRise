/* GeoRise — backfill real demo photos onto seeded feed posts.
 * Fills posts whose `image` is empty OR a remote http URL (demo placeholder);
 * never overwrites real `data:` uploads. Run: node scripts/seedPostImages.js
 */
const path = require('path');
const Database = require('better-sqlite3');

const DB_PATH = process.env.DATABASE_URL
  ? path.resolve(__dirname, '..', process.env.DATABASE_URL)
  : path.join(__dirname, '..', 'georise.db');

// Curated, reachability-verified Unsplash photo IDs per action category.
const PHOTOS = {
  transport: '1485965120184-e220f721d03e',     // cyclist
  transportation: '1485965120184-e220f721d03e',
  waste: '1610557892470-55d9e80c0bce',          // recycling
  food: '1512621776951-a57141f2eefd',           // plant-based bowl
  energy: '1509391366360-2e959784a276',         // solar panels
  nature: '1532996122724-e3c354a0b15b',         // litter / cleanup
  cleanup: '1532996122724-e3c354a0b15b',
  community: '1593113598332-cd288d649433',       // volunteers
};
const FALLBACK = '1441974231531-c6227db76b6e';   // forest

function urlFor(actionType) {
  const t = String(actionType || '').toLowerCase();
  const k = Object.keys(PHOTOS).find(x => t.includes(x));
  const id = PHOTOS[k] || FALLBACK;
  return `https://images.unsplash.com/photo-${id}?w=800&q=60&auto=format&fit=crop`;
}

const db = new Database(DB_PATH);
const rows = db.prepare("SELECT id, action_type FROM posts WHERE image IS NULL OR image = '' OR image LIKE 'http%'").all();
const update = db.prepare('UPDATE posts SET image = ? WHERE id = ?');

let n = 0;
const run = db.transaction(() => {
  rows.forEach(r => { update.run(urlFor(r.action_type), r.id); n++; });
});
run();

console.log(`Backfilled ${n} post image(s) at ${DB_PATH}`);

