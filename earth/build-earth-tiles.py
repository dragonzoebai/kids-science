"""Reproject the existing equirectangular Earth texture to local XYZ tiles.

Run: python earth/build-earth-tiles.py (requires Pillow).
"""
import math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = Image.open(ROOT / 'threejs/textures/2k_earth_daymap.webp').convert('RGB')
size = 2048

def source_y(y):
    latitude = math.atan(math.sinh(math.pi * (1 - 2 * y / size)))
    return (0.5 - latitude / math.pi) * source.height

# Each output row maps to its true latitude, rather than stretching the
# equirectangular picture as if it were already in Web Mercator.
mesh = []
for y in range(size):
    top, bottom = source_y(y), source_y(y + 1)
    mesh.append(((0, y, size, y + 1),
                 (0, top, 0, bottom, source.width, bottom, source.width, top)))
mercator = source.transform((size, size), Image.Transform.MESH, mesh, Image.Resampling.BICUBIC)
output = ROOT / 'earth/earth-tiles'
for zoom in range(4):
    count = 2 ** zoom
    level = mercator.resize((256 * count, 256 * count), Image.Resampling.LANCZOS)
    for x in range(count):
        folder = output / str(zoom) / str(x)
        folder.mkdir(parents=True, exist_ok=True)
        for y in range(count):
            level.crop((x * 256, y * 256, (x + 1) * 256, (y + 1) * 256)).save(
                folder / f'{y}.webp', quality=88, method=6)
print(f'Generated {sum(4 ** z for z in range(4))} tiles in {output}')
