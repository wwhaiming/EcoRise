#!/usr/bin/env node
/* EcoRise — eco-action gate eval runner.
 *
 * The core app depends on the eco-action vision gate, so we measure it instead
 * of claiming "we prompt strictly". This produces accuracy, false-positive /
 * false-negative rates, adversarial-rejection rate, per-class precision/recall,
 * and a confidence-calibration table.
 *
 * Modes:
 *   node test/eco_eval/runEval.js          # fixtures (offline; recorded predictions)
 *   node test/eco_eval/runEval.js --live   # live: needs ANTHROPIC_API_KEY or GEMINI_API_KEY + images in manifest.json
 *
 * The fixtures are a small ILLUSTRATIVE sample of recorded predictions so the
 * harness runs in CI without a key or image corpus. For a real result, drop a
 * labeled image set under ./images, point manifest.json at it, and run --live.
 */
const fs = require('fs');
const path = require('path');
// Load the same .env the server uses (one level above backend) so a single key in
// ecorise/.env powers the live eval — ANTHROPIC_API_KEY or GEMINI_API_KEY/GOOGLE_API_KEY.
try { require('dotenv').config({ path: path.join(__dirname, '..', '..', '..', '.env') }); } catch (_) { /* dotenv optional */ }
const { computeMetrics, formatReport } = require('../../utils/evalMetrics');

const DIR = __dirname;
const live = process.argv.includes('--live');

function fromFixtures() {
  const f = JSON.parse(fs.readFileSync(path.join(DIR, 'fixtures.json'), 'utf8'));
  return f.cases || [];
}

async function fromLive() {
  const hasKey = process.env.ANTHROPIC_API_KEY || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!hasKey) {
    console.error('--live requires ANTHROPIC_API_KEY or GEMINI_API_KEY/GOOGLE_API_KEY; falling back to fixtures.\n');
    return fromFixtures();
  }
  const { analyzeEcoAction } = require('../../utils/aiClient');
  const manifest = JSON.parse(fs.readFileSync(path.join(DIR, 'manifest.json'), 'utf8'));
  const cases = [];
  for (const c of manifest.cases) {
    const abs = path.resolve(DIR, c.imagePath);
    if (!fs.existsSync(abs)) { console.warn('missing image, skipping:', c.imagePath); continue; }
    const buf = fs.readFileSync(abs);
    const ext = (path.extname(abs).slice(1) || 'jpeg').replace('jpg', 'jpeg');
    const dataUri = `data:image/${ext};base64,${buf.toString('base64')}`;
    const r = await analyzeEcoAction(dataUri);
    cases.push({
      expected: c.expectedIsEcoAction === true,
      predicted: r.isEcoAction === true,
      expectedType: c.expectedActionType,
      predictedType: r.actionType,
      adversarial: !!c.adversarialTag,
      confidence: r.confidence,
    });
  }
  return cases;
}

(async () => {
  const cases = live ? await fromLive() : fromFixtures();
  const m = computeMetrics(cases);
  console.log(`Source: ${live ? 'LIVE model run' : 'recorded fixtures (illustrative sample, NOT a benchmark)'}`);
  console.log(formatReport(m));
  // CI gate: only enforce on a real, reasonably sized live run.
  if (live && m.n >= 20 && m.accuracy < 70) {
    console.error('\nEval gate FAILED: accuracy < 70% on >= 20 live cases.');
    process.exit(1);
  }
})().catch((e) => { console.error(e); process.exit(1); });
