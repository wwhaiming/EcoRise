/* GeoRise — robust JSON extraction for LLM responses.
 *
 * Replaces the brittle ```json fence-stripping with a balanced-brace scanner that
 * tolerates code fences, leading/trailing prose, nested objects, and trailing
 * commas — so a model that wraps or pads its JSON does not crash the parse. The
 * Gemini adapter already requests application/json; this hardens the Anthropic
 * path and any stray text. Single source of truth for every parse site in aiClient.
 */

// Parse, tolerating trailing commas (`{"a":1,}` / `[1,2,]`) that VLMs sometimes emit.
function tryParse(str) {
  try { return JSON.parse(str); }
  catch (_) { return JSON.parse(str.replace(/,(\s*[}\]])/g, '$1')); }
}

function extractJson(text) {
  if (text == null) throw new Error('extractJson: empty input');
  let s = String(text).trim();
  // Strip a leading/trailing markdown code fence if present.
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  // Fast path: already clean JSON (with trailing-comma tolerance).
  try { return tryParse(s); } catch (_) { /* fall through to scan */ }

  // Scan for the first balanced {...} or [...] block, respecting string literals.
  const start = s.search(/[[{]/);
  if (start === -1) throw new Error('extractJson: no JSON object/array found');
  const open = s[start];
  const close = open === '{' ? '}' : ']';
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < s.length; i++) {
    const c = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === '\\') esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === open) depth++;
    else if (c === close) {
      depth--;
      if (depth === 0) return tryParse(s.slice(start, i + 1));
    }
  }
  throw new Error('extractJson: unbalanced JSON');
}

module.exports = { extractJson };

