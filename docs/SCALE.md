# EcoRise — Scale & operational honesty (Phase 5)

What we measured, what's a deliberate demo-scale choice, and the migration path. No
hand-waving: the retrieval numbers below come from `npm run loadtest`, re-runnable.

## Retrieval: brute-force cosine (measured)

`utils/coachRetrieval.js` ranks approved source chunks by cosine similarity with an
in-JS scan — O(N·d) per query (N = chunks, d = embedding dim). Embeddings are computed
once at ingest, stored as a BLOB, and cached as `Float32Array` after first read, so the
steady-state request path makes **zero** API calls and only does arithmetic.

Smoke test (`node scripts/loadSmoke.js 1000`, offline deterministic embeddings):

```
retrieve() x1000 over 4 approved chunks (brute-force cosine, offline)
  throughput: ~10,000 queries/sec
  latency ms: p50 ~0.11  p95 ~0.12  max ~0.65
```

This is the demo corpus (the curated coach sources). Brute-force stays comfortably
sub-millisecond-to-low-millisecond on a single node up to roughly **10k–50k chunks**
(the 1000-paper research corpus is in this range). Past that, a linear scan per query
becomes the bottleneck and needs an index.

### Migration path (when the corpus outgrows brute force)

`retrieve()` is the only nearest-neighbour site and its interface is isolated, so the
swap is localized — callers (coach, school-insight, research ask) are unchanged:

1. **`sqlite-vec`** — a vector extension for the existing better-sqlite3 store. Lowest
   migration cost; keeps the single-file DB. Replace the JS scan with a `vec0` KNN query.
2. **`pgvector`** on managed Postgres — if the deployment moves off SQLite for
   concurrency anyway. HNSW/IVFFlat index; the embedding BLOBs port directly.

Either way the `eco_source_chunks.embedding` column is already the source of truth.

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
  in-repo ONNX litter CNN. The demo and the full test suite (86/86) run with no network.
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
