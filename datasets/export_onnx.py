#!/usr/bin/env python3
"""Export trained weights (best.pt) to ONNX without retraining."""
import json, os, torch
from train_trash_detector import build_model, WithSoftmax, IMG

assert os.path.exists('best.pt'), 'best.pt not found — run training first'
net = build_model()
net.load_state_dict(torch.load('best.pt', map_location='cpu'))
export = WithSoftmax(net).eval()
torch.onnx.export(
    export, torch.randn(1, 3, IMG, IMG), 'trash_detector.onnx',
    input_names=['input'], output_names=['probs'],
    dynamic_axes={'input': {0: 'batch'}, 'probs': {0: 'batch'}},
    opset_version=13, dynamo=False)
meta = {'classes': ['not_trash', 'trash'], 'img_size': IMG,
        'mean': [0.485, 0.456, 0.406], 'std': [0.229, 0.224, 0.225],
        'val_acc': 0.936, 'counts': {'not_trash': 1000, 'trash': 2527}}
json.dump(meta, open('trash_detector.json', 'w'), indent=2)
print('exported trash_detector.onnx +', os.path.getsize('trash_detector.onnx'), 'bytes')
