/* EcoRise — image-hash unit tests (the non-LLM near-duplicate fraud primitive).
 * Proves the deterministic distance math and the fail-open guards the post route
 * and the test suite both rely on (tiny/garbage images -> null -> check skipped). */
const test = require('node:test');
const assert = require('node:assert');
const { imageHash, perceptualHash, hammingDistance } = require('../utils/imageHash');

// 1x1 PNG used across the integration tests — must NOT yield a perceptual hash.
const TINY_PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('imageHash: deterministic sha256, null on empty', () => {
  assert.equal(imageHash('data:image/png;base64,AAAA'), imageHash('AAAA'));
  assert.match(imageHash('AAAA'), /^[0-9a-f]{64}$/);
  assert.equal(imageHash(''), null);
  assert.equal(imageHash(null), null);
});

test('hammingDistance: identical = 0, one flipped nibble = 1 bit', () => {
  assert.equal(hammingDistance('ffffffffffffffff', 'ffffffffffffffff'), 0);
  assert.equal(hammingDistance('ffffffffffffffff', 'fffffffffffffffe'), 1); // f(1111) vs e(1110)
  assert.equal(hammingDistance('0000000000000000', 'ffffffffffffffff'), 64); // all bits differ
});

test('hammingDistance: missing/mismatched hashes are treated as "not similar"', () => {
  assert.equal(hammingDistance(null, 'ffffffffffffffff'), Infinity);
  assert.equal(hammingDistance('ff', 'ffff'), Infinity);          // length mismatch
  assert.equal(hammingDistance('zz', 'zz'), Infinity);            // non-hex -> NaN guard
});

test('perceptualHash: fails open to null for empty / tiny / undecodable input', async () => {
  assert.equal(await perceptualHash(null), null);
  assert.equal(await perceptualHash(''), null);
  assert.equal(await perceptualHash(TINY_PNG), null);            // 1x1 < 256px -> skipped
  assert.equal(await perceptualHash('data:image/png;base64,not-a-real-image'), null);
});

