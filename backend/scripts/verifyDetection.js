/* GeoRise — verify live trash detection through the real aiClient.
 * Loads the same .env the server uses; runs several photos through
 * rateTrashSeverity and prints verdicts. Never prints the API key.
 * Run: node scripts/verifyDetection.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { rateTrashSeverity } = require('../utils/aiClient');

const IMGS = {
  'NON-garbage (bicycle)':        'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=800&q=60',
  'NON-garbage (recycling bins)': 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&q=60',
  'litter candidate A':           'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&q=60',
  'litter candidate B':           'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=60',
  'litter candidate C':           'https://images.unsplash.com/photo-1567393528677-d6adae7d4a0a?w=800&q=60',
};

async function toDataUrl(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`fetch ${r.status}`);
  const b = Buffer.from(await r.arrayBuffer());
  return 'data:image/jpeg;base64,' + b.toString('base64');
}

(async () => {
  console.log('OPENAI key present:', !!process.env.OPENAI_API_KEY, '| model:', process.env.ECO_MODEL || '(default gpt-4o-mini)');
  for (const [label, url] of Object.entries(IMGS)) {
    try {
      const dataUrl = await toDataUrl(url);
      const r = await rateTrashSeverity(dataUrl);
      console.log(`\n[${label}]`);
      console.log('  isTrash:', r.isTrash, '| score:', r.score, '| confidence:', r.confidence, '| source:', r.source);
      console.log('  desc:', String(r.description || '').slice(0, 170));
    } catch (e) {
      console.log(`\n[${label}] skipped: ${e.message}`);
    }
  }
})().catch(e => { console.error('VERIFY ERROR:', e.message); process.exit(1); });

