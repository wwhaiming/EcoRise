# Eco-action gate eval harness

The eco-action **vision gate** decides whether a photo earns points. The core app
depends on it, so we measure it rather than asserting "we prompt strictly."

## What it reports
- accuracy
- false-positive rate (non-eco photos wrongly accepted → fake points)
- false-negative rate (real eco photos wrongly rejected → frustrated users)
- adversarial-rejection rate (decoys that *should* be rejected)
- per-class precision / recall
- confidence calibration (does a high-confidence verdict actually hold up?)

The metric math lives in `../../utils/evalMetrics.js` and is unit-tested in
`../evalMetrics.test.js`, so the numbers can't silently drift.

## Run it

```bash
# Offline — recorded illustrative fixtures (runs in CI, no key needed)
npm run test:eval

# Live — real model over your labeled images (needs ANTHROPIC_API_KEY)
node test/eco_eval/runEval.js --live
```

## Add real data (for a defensible number)
1. Drop labeled images under `images/positive`, `images/negative`, `images/adversarial`.
2. Add one entry per image to `manifest.json`
   (`imagePath`, `expectedIsEcoAction`, `expectedActionType` for positives,
   `adversarialTag` for decoys).
3. Aim for ≥200 images. Report the real number — exposed weakness with a threshold
   beats an unmeasured claim.

> `fixtures.json` is an **illustrative sample of recorded predictions** so the
> harness runs without a key or image corpus. It is not a published benchmark.

