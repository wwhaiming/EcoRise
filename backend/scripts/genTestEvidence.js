/* EcoRise — generate machine test evidence.
 *
 *   node scripts/genTestEvidence.js   (or: npm run test:evidence)
 *
 * Runs the real backend suite and writes test-results.json (passed/failed/total +
 * timestamp). The /api/coach/insights "Judge evidence" panel reads this file, so the
 * test count shown to judges is generated from an actual run, not a hardcoded string.
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

let out = '';
try {
  out = execSync('node --test test/*.test.js', { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
} catch (e) {
  out = `${e.stdout || ''}${e.stderr || ''}`; // node --test exits non-zero on failures; still parse counts
}

const num = (re) => { const m = out.match(re); return m ? Number(m[1]) : 0; };
const passed = num(/pass (\d+)/);
const failed = num(/fail (\d+)/);
const total = num(/tests (\d+)/);
const rec = {
  passed, failed, total,
  status: (total > 0 && failed === 0) ? 'passing' : 'failing',
  suite: 'backend (node --test)',
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(path.join(__dirname, '..', 'test-results.json'), `${JSON.stringify(rec, null, 2)}\n`);
console.log('test-results.json:', JSON.stringify(rec));
if (rec.status !== 'passing') process.exit(1);
