"""Align an imagegen 4x4 character atlas into 192px runtime cells.

Usage: python scripts/prepare-atlas.py SOURCE.png assets/animation/classic.png
Requires Pillow, NumPy, and SciPy for offline asset preparation only.
Connected sprite bounds preserve a complete pose when a hand crosses a grid line.
"""
import sys
from pathlib import Path
import numpy as np
from scipy import ndimage
from PIL import Image

source = Image.open(sys.argv[1]).convert('RGBA')
if source.getchannel('A').getextrema()[0] != 0:
    raise ValueError('Atlas source must contain genuine transparency')
labels, _ = ndimage.label(np.array(source.getchannel('A')) > 40)
areas = np.bincount(labels.ravel())
identities = np.argsort(areas[1:])[-16:] + 1
cell = 192
atlas = Image.new('RGBA', (cell * 4, cell * 4))
occupied = set()
for identity in identities:
    ys, xs = np.where(labels == identity)
    if len(xs) < source.width * source.height * .005:
        raise ValueError('Missing or undersized character; inspect the source sheet')
    col, row = min(3, int(xs.mean() / source.width * 4)), min(3, int(ys.mean() / source.height * 4))
    if (col, row) in occupied:
        raise ValueError(f'Two sprites mapped to cell {col}, {row}; inspect grid alignment')
    occupied.add((col, row))
    bounds = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
    sprite = source.crop(bounds)
    factor = min(cell * .86 / sprite.width, cell * .86 / sprite.height)
    sprite = sprite.resize((round(sprite.width * factor), round(sprite.height * factor)), Image.Resampling.LANCZOS)
    x = col * cell + (cell - sprite.width) // 2
    y = row * cell + round(cell * .94) - sprite.height
    atlas.alpha_composite(sprite, (x, y))
if len(occupied) != 16:
    raise ValueError('Expected exactly 16 sprite cells')
output = Path(sys.argv[2])
output.parent.mkdir(parents=True, exist_ok=True)
atlas.quantize(colors=256, method=Image.Quantize.FASTOCTREE).save(output, optimize=True)
print(f'Packed 16 aligned frames: {output}')
