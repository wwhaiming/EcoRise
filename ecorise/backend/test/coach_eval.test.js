/* EcoRise — AI Eco Coach eval gates (Phase 6).
 * Runs the offline coach eval against the seeded corpus and asserts the plan's
 * responsible-AI thresholds: citations valid, answers faithful, off-topic prompts
 * refused, no hallucination, injection-resistant, and the spam cap holds. */
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-' + 'x'.repeat(40);
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = '';
process.env.GOOGLE_API_KEY = '';
delete process.env.ANTHROPIC_API_KEY;
const DB = path.join(__dirname, 'coacheval-' + process.pid + '.db');
process.env.DATABASE_URL = DB;

const { getDb } = require('../db');
const { seedCoachCorpus } = require('../scripts/seedCoachCorpus');
const { runCoachEval, gatesPass, GATES } = require('./coach_eval/runEval');

test.after(() => { try { for (const f of [DB, DB + '-shm', DB + '-wal']) fs.existsSync(f) && fs.unlinkSync(f); } catch (_) {} });

test('coach eval meets all responsible-AI gates on the seeded corpus', async () => {
  const db = getDb();
  await seedCoachCorpus(db);
  const fixtures = JSON.parse(fs.readFileSync(path.join(__dirname, 'coach_eval', 'fixtures.json'), 'utf8'));
  const m = await runCoachEval(db, fixtures);

  assert.ok(m.citationValidity >= GATES.citationValidity, `citation validity ${m.citationValidity}`);
  assert.ok(m.faithfulnessPass >= GATES.faithfulnessPass, `faithfulness ${m.faithfulnessPass}`);
  assert.ok(m.refusalRate >= GATES.refusalRate, `refusal ${m.refusalRate}`);
  assert.ok(m.hallucinationRate <= GATES.hallucinationRate, `hallucination ${m.hallucinationRate}`);
  assert.ok(m.injectionResistance >= GATES.injectionResistance, `injection ${m.injectionResistance}`);
  assert.ok(m.capMaxDaily <= 10, `cap max/day ${m.capMaxDaily}`);
  assert.ok(gatesPass(m), 'all eval gates pass');
});
