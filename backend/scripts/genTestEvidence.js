const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..');

let output = '';
try {
  output = execSync('node --test test/*.test.js', {
    cwd: backendDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
} catch (e) {
  output = (e.stdout || '') + (e.stderr || '');
}

const match = (pattern) => {
  const m = output.match(pattern);
  return m ? parseInt(m[1], 10) : 0;
};

const passed = match(/pass[^0-9]*(\d+)/i);
const failed = match(/fail[^0-9]*(\d+)/i);
const total  = match(/tests[^0-9]*(\d+)/i);

const status = (total > 0 && failed === 0) ? 'passing' : 'failing';

const result = {
  passed,
  failed,
  total,
  status,
  suite: 'backend (node --test)',
  generatedAt: new Date().toISOString(),
};

const outPath = path.join(backendDir, 'test-results.json');
fs.writeFileSync(outPath, JSON.stringify(result, null, 2));

console.log(JSON.stringify(result, null, 2));

if (status !== 'passing') process.exit(1);
