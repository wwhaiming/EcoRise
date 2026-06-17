/* GeoRise — local trash detector (offline, no API key needed).
 *
 * Loads the CNN trained in datasets/train_trash_detector.py (exported to ONNX)
 * and classifies an image as trash / not-trash. Used by aiClient.rateTrashSeverity
 * when OPENAI_API_KEY is not set, so trash detection works fully offline.
 *
 * Returns null if the runtime or model file is unavailable (caller falls back).
 */
const path = require('path');
const fs = require('fs');

let ort = null;
let Jimp = null;
try {
  ort = require('onnxruntime-node');
  ({ Jimp } = require('jimp'));
} catch (_) {
  // optional deps not installed -> module reports unavailable
}

const MODEL_PATH = process.env.TRASH_MODEL_PATH || path.join(__dirname, '..', 'model', 'trash_detector.onnx');
const META_PATH = MODEL_PATH.replace(/\.onnx$/, '.json');

// Probability of "trash" at/above which we accept the photo.
const TRASH_PROB_THRESHOLD = Number(process.env.TRASH_PROB_THRESHOLD || 0.6);

let session = null;
let meta = null;
let loadAttempted = false;

function isAvailable() {
  return !!ort && !!Jimp && fs.existsSync(MODEL_PATH);
}

async function ensureLoaded() {
  if (session) return session;
  if (loadAttempted) return session;
  loadAttempted = true;
  if (!isAvailable()) return null;
  meta = fs.existsSync(META_PATH)
    ? JSON.parse(fs.readFileSync(META_PATH, 'utf8'))
    : { img_size: 96, mean: [0.485, 0.456, 0.406], std: [0.229, 0.224, 0.225], classes: ['not_trash', 'trash'] };
  session = await ort.InferenceSession.create(MODEL_PATH);
  console.log(`🧠 Local trash model loaded (val_acc ${meta.val_acc ?? '?'}) from ${path.basename(MODEL_PATH)}`);
  return session;
}

/** Returns { pTrash, probs, classes } or null if unavailable / undecodable. */
async function classify(imageBase64) {
  const s = await ensureLoaded();
  if (!s) return null;
  try {
    let b64 = imageBase64;
    const m = imageBase64.match(/^data:(image\/\w+);base64,(.+)$/);
    if (m) b64 = m[2];
    const buf = Buffer.from(b64, 'base64');

    const img = await Jimp.fromBuffer(buf);
    const N = meta.img_size || 96;
    img.resize({ w: N, h: N });

    const { data, width, height } = img.bitmap; // RGBA, 0..255
    const mean = meta.mean, std = meta.std;
    const chw = new Float32Array(3 * N * N);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        for (let c = 0; c < 3; c++) {
          const v = data[i + c] / 255;
          chw[c * N * N + y * N + x] = (v - mean[c]) / std[c];
        }
      }
    }

    const tensor = new ort.Tensor('float32', chw, [1, 3, N, N]);
    const out = await s.run({ [s.inputNames[0]]: tensor });
    const probs = Array.from(out[s.outputNames[0]].data);
    const classes = meta.classes || ['not_trash', 'trash'];
    const idxTrash = Math.max(0, classes.indexOf('trash'));
    return { pTrash: probs[idxTrash], probs, classes };
  } catch (err) {
    console.error('localTrashModel.classify error:', err.message);
    return null;
  }
}

module.exports = { classify, isAvailable, ensureLoaded, TRASH_PROB_THRESHOLD };

