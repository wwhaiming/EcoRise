#!/usr/bin/env python3
# ONNX output: backend/utils/trash_detector.onnx (opset 13, softmax-wrapped, 0=not_trash 1=trash)
"""Evaluate the trained detector on the held-out val split: precision/recall and
false-positive rate at the deployed trash-probability threshold (0.6)."""
import json, torch
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split, Subset
from torchvision import datasets, transforms
from train_trash_detector import build_model, IMG

meta = json.load(open('trash_detector.json'))
THR = 0.6
tf = transforms.Compose([transforms.Resize((IMG, IMG)), transforms.ToTensor(),
                         transforms.Normalize(meta['mean'], meta['std'])])
ds = datasets.ImageFolder('trash_detector', transform=tf)  # 0=not_trash, 1=trash
n_val = int(len(ds) * 0.15)
_, va = random_split(ds, [len(ds) - n_val, n_val], generator=torch.Generator().manual_seed(0))
va = Subset(ds, va.indices)

net = build_model(); net.load_state_dict(torch.load('best.pt', map_location='cpu')); net.eval()
tp = fp = tn = fn = 0
with torch.no_grad():
    for x, y in DataLoader(va, batch_size=64):
        p = F.softmax(net(x), 1)[:, 1]
        pred = (p >= THR).long()
        for yi, pi in zip(y.tolist(), pred.tolist()):
            if yi == 1 and pi == 1: tp += 1
            elif yi == 0 and pi == 1: fp += 1
            elif yi == 0 and pi == 0: tn += 1
            else: fn += 1
n = tp + fp + tn + fn
prec = tp / (tp + fp) if tp + fp else 0
rec = tp / (tp + fn) if tp + fn else 0
fpr = fp / (fp + tn) if fp + tn else 0
print(f'held-out val n={n}  threshold={THR}')
print(f'precision(trash)={prec:.3f}  recall(trash)={rec:.3f}  accuracy={(tp+tn)/n:.3f}')
print(f'false-positive rate (non-trash wrongly accepted)={fpr:.3f}')
print(f'confusion: TP={tp} FP={fp} TN={tn} FN={fn}')
