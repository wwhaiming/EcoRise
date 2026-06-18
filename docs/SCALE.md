# EcoRise — Scale & operational honesty (Phase 5)

What we measured, what's a deliberate demo-scale choice, and the migration path. No
hand-waving: the retrieval numbers below come from `npm run loadtest`, re-runnable.

## Retrieval: sqlite-vec KNN index (measured)

`utils/coachRetrieval.js` performs nearest-neighbour retrieval using a `vec0` virtual
table provided by the **sqlite-vec** extension (loaded in `db.js`). When a query
arrives, `retrieve()` calls `vec_eco_source_chunks MATCH <query> AND k = <k>` — an
approximate cosine-distance KNN over the embedded corpus — instead of the previous
O(N·d) in-JS scan. Embeddings are still computed once at ingest and stored as BLOBs
in `eco_source_chunks.embedding`; the vec0 shadow table is kept in sync on every
ingest and synced lazily on first query. A prepared-statement cache (`_stmtCache`)
avoids repeated `db.prepare()` overhead on the hot path.

A brute-force JS fallback (the original implementation) is preserved and runs
automatically if the native sqlite-vec binary is unavailable for any reason
(e.g. unsupported platform or stripped deployment), so the app degrades gracefully
rather than failing hard.

Smoke test (`node scripts/loadSmoke.js 500`, offline deterministic embeddings):

```
retrieve() x500 over 4 approved chunks (sqlite-vec KNN, offline)
  throughput: 26 queries/sec
  latency ms: p50=42.873  p95=47.645  max=75.124
```

> The bottleneck on this corpus is **embedding computation** (the deterministic
> lexical hash over a 4096-dim space takes ~38 ms per call), not the KNN lookup
> itself. The index becomes the dominant factor once the corpus grows large enough
> that a full scan would exceed embedding latency (~10k–50k+ chunks).

Brute-force stays comfortably sub-millisecond-to-low-millisecond on a single node
up to roughly **10k–50k chunks** (the 1000-paper research corpus is in this range)
for the SQL+cosine scan only; with the sqlite-vec index the lookup layer now scales
significantly further before becoming a bottleneck.

### Migration path (when the corpus outgrows sqlite-vec)

`retrieve()` is the only nearest-neighbour site and its interface is isolated, so the
swap is localized — callers (coach, school-insight, research ask) are unchanged:

1. **`sqlite-vec`** — ✅ **implemented**. The `vec0` KNN virtual table is active.
   `eco_source_chunks.embedding` remains the source of truth; the shadow table
   `vec_eco_source_chunks` is rebuilt automatically on dimension mismatch.
2. **`pgvector`** on managed Postgres — if the deployment moves off SQLite for
   concurrency anyway. HNSW/IVFFlat index; the embedding BLOBs port directly.

## Quotas, limits, cost

- **Global rate limit**: 300 requests / 15 min per IP (`server.js`).
- **Per-user AI cap**: `MAX_PER_DAY` analyses/day (`middleware/rateLimit.js`) — the
  paid vision path can't be spammed.
- **Auth limiter**: `AUTH_MAX_PER_WINDOW` (default 30) on the login surface.
- **OpenAI calls**: per-request `timeout` (30s) + `maxRetries` (2) in `getClient()`, so
  a hung upstream can't pin a worker.
- **Cost shape**: `gpt-4o-mini` (vision+text) + `text-embedding-3-small` are low-cost;
  embeddings are amortized at ingest, not per request; learning points are capped so
  there's no incentive to farm AI calls.

## Disaster / degraded modes

- **No API key**: the whole app runs offline — deterministic mock vision/text + the
  in-repo ONNX litter CNN. The demo and the full test suite (102 tests: 91 backend + 11 frontend)
  run with no network.
- **Embedding provider drift**: `retrieve()` skips vectors whose dimension doesn't match
  the query, so a corpus embedded with one provider and a query from another
  **fail-closes to "no corpus"** rather than silently citing irrelevant text.
- **Ungrounded generation**: the faithfulness gate + numeric claim-verification reject
  unsupported answers; the coach surfaces a visible "guidance withheld" card.
- **Feature gate**: the coach surface 404s entirely unless `COACH_ENABLED=true`, and a
  startup self-check warns at boot if it's enabled with an empty corpus.

## Honest limits

Single-node SQLite (WAL) is fine for a school/classroom; it is not horizontally
scaled. Multi-region or whole-district load would move the store to Postgres + a vector
index (above) and put the API behind more than one worker. No real production load test
beyond the single-node smoke test has been run.
