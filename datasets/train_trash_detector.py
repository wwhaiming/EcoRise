#!/usr/bin/env python3
"""EcoRise — trash / not-trash detector training.

Trains a compact CNN from scratch (no external pretrained weights, so it runs
inside a restricted sandbox) on:
  positives  = trashnet recyclable images  (datasets/trash_detector/trash)
  negatives  = imagenet sample images      (datasets/trash_detector/not_trash)

Exports an ONNX model the Node backend loads via onnxruntime-node.
Class index order (ImageFolder, alphabetical): 0 = not_trash, 1 = trash.

Usage:
  python train_trash_detector.py --data datasets/trash_detector --epochs 12
"""
import argparse, json, os, random
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

IMG = 96  # input HxW

def build_model():
    # Small VGG-ish CNN; ~ a few hundred K params, trains fast on CPU/MPS.
    return nn.Sequential(
        nn.Conv2d(3, 32, 3, padding=1), nn.BatchNorm2d(32), nn.ReLU(), nn.MaxPool2d(2),   # 48
        nn.Conv2d(32, 64, 3, padding=1), nn.BatchNorm2d(64), nn.ReLU(), nn.MaxPool2d(2),  # 24
        nn.Conv2d(64, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.MaxPool2d(2),# 12
        nn.Conv2d(128, 128, 3, padding=1), nn.BatchNorm2d(128), nn.ReLU(), nn.MaxPool2d(2),# 6
        nn.AdaptiveAvgPool2d(1), nn.Flatten(),
        nn.Dropout(0.3), nn.Linear(128, 64), nn.ReLU(), nn.Linear(64, 2),
    )

class WithSoftmax(nn.Module):
    """Wrapper so the exported ONNX returns probabilities directly."""
    def __init__(self, net): super().__init__(); self.net = net
    def forward(self, x): return F.softmax(self.net(x), dim=1)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True)
    ap.add_argument('--epochs', type=int, default=12)
    ap.add_argument('--batch', type=int, default=64)
    ap.add_argument('--out', default='trash_detector.onnx')
    args = ap.parse_args()

    random.seed(0); torch.manual_seed(0)
    dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
    print(f'device: {dev}')

    norm = transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    train_tf = transforms.Compose([
        transforms.Resize((IMG, IMG)),
        transforms.RandomHorizontalFlip(),
        transforms.ColorJitter(0.2, 0.2, 0.2),
        transforms.RandomRotation(12),
        transforms.ToTensor(), norm,
    ])
    eval_tf = transforms.Compose([transforms.Resize((IMG, IMG)), transforms.ToTensor(), norm])

    full = datasets.ImageFolder(args.data, transform=train_tf)
    print('classes:', full.classes)  # ['not_trash', 'trash']
    n_val = int(len(full) * 0.15)
    n_tr = len(full) - n_val
    tr, va = random_split(full, [n_tr, n_val], generator=torch.Generator().manual_seed(0))
    # eval-transform copy for validation, same split indices
    eval_ds = datasets.ImageFolder(args.data, transform=eval_tf)
    va_eval = torch.utils.data.Subset(eval_ds, va.indices)

    # class weights (2527 trash vs 1000 not_trash -> weight the minority up)
    counts = [0, 0]
    for _, y in full.samples: counts[y] += 1
    w = torch.tensor([sum(counts) / (2 * c) for c in counts], dtype=torch.float32, device=dev)
    print('class counts:', dict(zip(full.classes, counts)), 'weights:', w.tolist())

    dl_tr = DataLoader(tr, batch_size=args.batch, shuffle=True, num_workers=2)
    dl_va = DataLoader(va_eval, batch_size=args.batch, num_workers=2)

    net = build_model().to(dev)
    opt = torch.optim.Adam(net.parameters(), lr=1e-3, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, args.epochs)
    lossf = nn.CrossEntropyLoss(weight=w)

    best = 0.0
    for ep in range(1, args.epochs + 1):
        net.train()
        for x, y in dl_tr:
            x, y = x.to(dev), y.to(dev)
            opt.zero_grad(); loss = lossf(net(x), y); loss.backward(); opt.step()
        sched.step()
        # validate
        net.eval(); correct = 0; total = 0; cm = [[0, 0], [0, 0]]
        with torch.no_grad():
            for x, y in dl_va:
                x, y = x.to(dev), y.to(dev)
                p = net(x).argmax(1)
                correct += (p == y).sum().item(); total += y.numel()
                for t, pr in zip(y.tolist(), p.tolist()): cm[t][pr] += 1
        acc = correct / total
        print(f'epoch {ep:2d}  val_acc {acc:.3f}  cm(rows=true not_trash/trash) {cm}')
        if acc > best:
            best = acc
            torch.save(net.state_dict(), 'best.pt')

    print(f'best val_acc {best:.3f}')
    net.load_state_dict(torch.load('best.pt', map_location=dev))
    export = WithSoftmax(net).to('cpu').eval()
    dummy = torch.randn(1, 3, IMG, IMG)
    torch.onnx.export(
        export, dummy, args.out, input_names=['input'], output_names=['probs'],
        dynamic_axes={'input': {0: 'batch'}, 'probs': {0: 'batch'}}, opset_version=13)
    meta = {'classes': full.classes, 'img_size': IMG,
            'mean': [0.485, 0.456, 0.406], 'std': [0.229, 0.224, 0.225],
            'val_acc': round(best, 4), 'counts': dict(zip(full.classes, counts))}
    with open(os.path.splitext(args.out)[0] + '.json', 'w') as f:
        json.dump(meta, f, indent=2)
    print('exported', args.out, '+ meta json')

if __name__ == '__main__':
    main()
