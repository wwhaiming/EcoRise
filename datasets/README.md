# EcoRise — Trash Detector Dataset & Training

Trains the offline trash / not-trash classifier used by the backend
(`backend/utils/localTrashModel.js`) when no `ANTHROPIC_API_KEY` is set.

## Contents

```
datasets/
  raw/                         # downloaded source archives (gitignore-able)
    trashnet.zip               # trashnet recyclable images (positives)
    imagenet-samples.tar.gz    # imagenet sample images (negatives)
  trash_detector/
    trash/        2527 imgs    # trashnet: cardboard/glass/metal/paper/plastic/trash
    not_trash/    1000 imgs    # imagenet-sample-images (diverse real-world photos)
  train_trash_detector.py      # training script (PyTorch -> ONNX)
  trash_detector.onnx          # exported model (also copied to backend/model/)
  trash_detector.json          # meta: classes, img_size, mean/std, val_acc
```

Total: **3,527 images**, binary classes (index 0 = `not_trash`, 1 = `trash`).

## Sources

- Positives — trashnet: https://github.com/garythung/trashnet (`data/dataset-resized.zip`)
- Negatives — imagenet-sample-images: https://github.com/EliSchwartz/imagenet-sample-images

Both are fetched from GitHub (the only image hosts reachable from the build sandbox).
TACO (street-litter) was not usable — its images are Flickr-hosted and blocked.

## Reproduce

```bash
# 1. download + organize (see commit history / the commands used)
# 2. train
python3.11 -m venv .venv && ./.venv/bin/pip install torch torchvision onnx pillow
./.venv/bin/python train_trash_detector.py --data trash_detector --epochs 12
# 3. deploy
cp trash_detector.onnx trash_detector.json ../backend/model/
```

## Honest limitations

- trashnet is **studio photos of recyclable items on plain backgrounds**, not
  street litter. The model learns "trash object vs ordinary photo," which is
  enough to stop the false-positive bug (arbitrary non-trash no longer scored as
  trash) but is **not** a robust real-world street-litter detector.
- There are **no severity labels** in the data, so the 0-10 severity is derived
  from the model's confidence, not a true measure of how much litter is present.
- For production: replace positives with a real street-litter dataset
  (e.g. TACO via its own downloader, or a labeled litter set) and add severity
  annotations.

## Note on committing data

`trash_detector/` is ~150 MB. Committing it bloats the repo permanently. Prefer
gitignoring `raw/` and `trash_detector/` and re-downloading via a script, or use
git-lfs. Kept here only because the data was explicitly requested in-repo.
