/* EcoRise — robust JSON extraction tests.
 * Guards the single parser every aiClient model-response site now uses: code
 * fences, surrounding prose, trailing commas, and nested braces inside strings. */
const test = require('node:test');
const assert = require('node:assert');
const { extractJson } = require('../utils/jsonExtract');

test('parses clean JSON', () => {
  assert.deepEqual(extractJson('{"a":1,"b":"x"}'), { a: 1, b: 'x' });
});

test('strips ```json code fences', () => {
  assert.deepEqual(extractJson('```json\n{"ok":true}\n```'), { ok: true });
});

test('ignores leading/trailing prose around the object', () => {
  assert.deepEqual(extractJson('Sure! Here you go:\n{"score": 7}\nHope that helps.'), { score: 7 });
});

test('tolerates trailing commas', () => {
  assert.deepEqual(extractJson('{"a":1,"b":2,}'), { a: 1, b: 2 });
});

test('handles arrays and braces inside string values', () => {
  assert.deepEqual(extractJson('prefix [{"t":"a }{ b"}] suffix'), [{ t: 'a }{ b' }]);
});

test('throws on input with no JSON', () => {
  assert.throws(() => extractJson('no json here'));
  assert.throws(() => extractJson(null));
});

