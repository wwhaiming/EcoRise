# Research Paper Dataset

1000 environmental / sustainability research papers fetched from [OpenAlex](https://openalex.org)
(open metadata, no API key). Powers the GeoRise AI Eco Coach's research features:

- **Ask the research** — `GET /api/coach/ask?q=` retrieves the most relevant paper
  abstracts by embedding similarity and answers the question grounded ONLY in them,
  with citations (the answer is pulled out of the papers, never invented).
- **AI summary** — `GET /api/coach/papers/:id/summary` plain-language TL;DR + key points.
- **AI visual** — `GET /api/coach/papers/:id/visual` structured infographic data the
  frontend renders as a clean, easy-to-understand visual.

## Files
- `papers.json` — `{ source, count, papers: [...] }`. Each paper:
  `openalexId, topic, title, abstract, authors[], year, doi, url, venue, openAccess, citedByCount`.

## Topics (matched to GeoRise action categories)
transportation · food · waste · energy · climate_ed · sustainability · footprint · nature

## Ingest into the Coach corpus
```
cd backend && node scripts/ingestResearchCorpus.js     # or: npm run seed:research
```
Inserts each paper as an APPROVED `eco_sources` row (provenance `research_dataset`)
with one abstract chunk, and batch-embeds via OpenAI `text-embedding-3-small`.
Idempotent: only ever rebuilds rows whose provenance is `research_dataset`.
