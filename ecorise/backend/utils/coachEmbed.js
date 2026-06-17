/* EcoRise — AI Eco Coach embeddings.
 *
 * embed(text) returns an L2-normalized Float32 vector. If a Gemini/Google key is
 * present it uses text-embedding-004 (same key already wired in aiClient); otherwise
 * it falls back to a deterministic, offline lexical embedding so the demo and the
 * hermetic test suite work with no network. Vectors are normalized on creation, so
 * cosine similarity is just a dot product.
 *
 * Mixed-provider note: a single deployment embeds the corpus and the query through
 * the same path (key present or not), so dimensions match. cosineSim guards length
 * mismatch by returning 0.
 */
// Wide hash space so off-topic text shares almost no buckets with the corpus
// (few collisions) -> near-zero cosine, which lets the relevance floor reliably
// refuse unanswerable prompts. The real eco vocabulary still overlaps strongly.
const DIM = 4096;

function tokenize(text) {
  return String(text || '').toLowerCase().match(/[a-z0-9]{3,}/g) || [];
}

// FNV-1a hash -> bucket index. Deterministic across runs/processes.
function bucket(token) {
  let h = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    h ^= token.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % DIM;
}

function normalize(v) {
  let norm = 0;
  for (let i = 0; i < v.length; i++) norm += v[i] * v[i];
  norm = Math.sqrt(norm) || 1;
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}

// Offline lexical embedding: hashed bag of unigrams + bigrams. Shared vocabulary
// raises cosine similarity, which is enough to retrieve the right chunk in a small
// curated corpus without any model call.
function deterministicEmbed(text) {
  const v = new Float32Array(DIM);
  const toks = tokenize(text);
  for (let i = 0; i < toks.length; i++) {
    v[bucket(toks[i])] += 1;
    if (i > 0) v[bucket(toks[i - 1] + '_' + toks[i])] += 0.5;
  }
  return normalize(v);
}

async function geminiEmbed(text, key) {
  const model = process.env.GEMINI_EMBED_MODEL || 'text-embedding-004';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ model: `models/${model}`, content: { parts: [{ text: String(text || '').slice(0, 8000) }] } }),
  });
  if (!resp.ok) throw new Error(`Gemini embed ${resp.status}`);
  const data = await resp.json();
  const values = data && data.embedding && data.embedding.values;
  if (!Array.isArray(values) || !values.length) throw new Error('empty embedding');
  return normalize(Float32Array.from(values));
}

async function embed(text) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (key) {
    try { return await geminiEmbed(text, key); }
    catch (err) { console.error('coachEmbed: Gemini failed, using lexical fallback:', err.message); }
  }
  return deterministicEmbed(text);
}

// Dot product of two normalized vectors == cosine similarity.
function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

function toBlob(f32) {
  return Buffer.from(f32.buffer, f32.byteOffset, f32.byteLength);
}

function fromBlob(buf) {
  if (!buf || !buf.byteLength) return null;
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  return new Float32Array(ab);
}

module.exports = { embed, deterministicEmbed, cosineSim, toBlob, fromBlob, DIM };
