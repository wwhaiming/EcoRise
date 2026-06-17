/* EcoRise — AI Eco Coach text chunker.
 * Splits source text into overlapping, sentence-aware chunks of ~maxWords words so
 * each chunk is a retrievable, citable unit. Pure and deterministic. */

function chunkText(text, { maxWords = 180, overlapWords = 30 } = {}) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) || [clean];

  const chunks = [];
  let cur = [];
  let count = 0;
  for (const raw of sentences) {
    const s = raw.trim();
    if (!s) continue;
    const words = s.split(/\s+/).length;
    if (count + words > maxWords && cur.length) {
      chunks.push(cur.join(' ').trim());
      const flat = cur.join(' ').split(/\s+/);
      cur = flat.slice(Math.max(0, flat.length - overlapWords)); // carry overlap
      count = cur.length;
    }
    cur.push(s);
    count += words;
  }
  if (cur.length) chunks.push(cur.join(' ').trim());

  return chunks
    .filter(Boolean)
    .map((t, ord) => ({ ord, text: t, tokenCount: Math.round(t.split(/\s+/).length * 1.3) }));
}

module.exports = { chunkText };
