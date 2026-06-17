/* EcoRise — image hashing for duplicate / near-duplicate submission detection.
 *
 *  - imageHash():       exact content hash (sha256). Catches identical re-uploads.
 *  - perceptualHash():  average-hash (aHash). Catches the SAME photo re-saved,
 *                       re-compressed, lightly cropped, or screenshotted — the
 *                       common way users try to farm points by re-submitting one
 *                       photo. A non-LLM, deterministic fraud signal that does not
 *                       depend on any API key.
 *  - hammingDistance(): bit-difference between two perceptual hashes.
 */
const crypto = require('crypto');

// jimp is an optional dependency (also used by localTrashModel). If it is not
// installed, perceptualHash degrades to null and the caller simply skips the
// near-duplicate check — exact hashing still works.
let Jimp = null;
try {
  ({ Jimp } = require('jimp'));
} catch (_) {
  // optional — perceptualHash returns null when unavailable
}

function stripB64(dataUriOrB64) {
  if (!dataUriOrB64) return null;
  const b64 = dataUriOrB64.includes(',') ? dataUriOrB64.split(',')[1] : dataUriOrB64;
  return b64 || null;
}

function imageHash(dataUriOrB64) {
  const b64 = stripB64(dataUriOrB64);
  if (!b64) return null;
  return crypto.createHash('sha256').update(b64).digest('hex');
}

// 64-bit average hash -> 16-char hex string, or null if the image can't be decoded
// or is too small to be a real photo (so 1x1 test pixels and icons are skipped).
async function perceptualHash(dataUriOrB64) {
  if (!Jimp) return null;
  const b64 = stripB64(dataUriOrB64);
  if (!b64) return null;
  try {
    const img = await Jimp.fromBuffer(Buffer.from(b64, 'base64'));
    // Real photos only: ignore tiny images (test pixels, icons) to avoid false dups.
    if (img.bitmap.width * img.bitmap.height < 256) return null;

    img.resize({ w: 8, h: 8 }).greyscale();
    const { data } = img.bitmap; // RGBA; after greyscale R==G==B == luma
    const lumas = [];
    for (let i = 0; i < 64; i++) lumas.push(data[i * 4]);
    const avg = lumas.reduce((s, v) => s + v, 0) / 64;

    let bits = '';
    for (let i = 0; i < 64; i++) bits += lumas[i] >= avg ? '1' : '0';
    let hex = '';
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex; // 16 hex chars
  } catch (_) {
    return null; // undecodable -> no perceptual signal (fail open)
  }
}

const POPCOUNT = Array.from({ length: 16 }, (_, n) => (n.toString(2).match(/1/g) || []).length);

// Number of differing bits between two aHash hex strings. Returns Infinity if
// either hash is missing or malformed, so callers treat "unknown" as "not similar".
function hammingDistance(a, b) {
  if (!a || !b || a.length !== b.length) return Infinity;
  let dist = 0;
  for (let i = 0; i < a.length; i++) {
    const na = parseInt(a[i], 16), nb = parseInt(b[i], 16);
    // Non-hex nibble -> NaN. Guard BEFORE the XOR (NaN ^ NaN coerces to 0, which
    // would silently read as "0 bits differ" — a false near-duplicate match).
    if (Number.isNaN(na) || Number.isNaN(nb)) return Infinity;
    dist += POPCOUNT[na ^ nb];
  }
  return dist;
}

module.exports = { imageHash, perceptualHash, hammingDistance };
