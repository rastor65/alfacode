"""Generate a lateral particle brain, not a solid mesh. Python standard library only.

Cortex: modified fsaverage5 average template redistributed by Nilearn (see NOTICE).
Cerebellum and stem: decorative procedural approximations, not anatomical datasets.
"""
import array
import base64
import bisect
import gzip
import hashlib
import json
import math
from pathlib import Path
import random
import struct
import sys
import urllib.request
import xml.etree.ElementTree as ET
from xml.sax.saxutils import escape
import zlib

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "frontend/out/landing-polish/fsaverage5"
OUTPUT = ROOT / "frontend/public/visuals"
COMMIT = "4354a8f2aa9619743d1623a5166d3816ecaa7f5d"
BASE = f"https://raw.githubusercontent.com/nilearn/nilearn/{COMMIT}/nilearn/datasets/data/fsaverage5/"


def cached(url, name):
    path = CACHE / name
    if not path.exists():
        urllib.request.urlretrieve(url, path)
    return path.read_bytes()


def gifti(name):
    tree = ET.fromstring(gzip.decompress(cached(BASE + name, name)))
    result = []
    for node in tree.findall("DataArray"):
        values = array.array("f" if node.attrib["DataType"] == "NIFTI_TYPE_FLOAT32" else "i")
        values.frombytes(zlib.decompress(base64.b64decode(node.findtext("Data"))))
        if (node.attrib.get("Endian", "LittleEndian") == "LittleEndian") != (sys.byteorder == "little"):
            values.byteswap()
        dims = int(node.attrib["Dimensionality"])
        result.append([tuple(values[i:i + 3]) for i in range(0, len(values), 3)] if dims == 2 else list(values))
    return result


def unit(v):
    length = math.sqrt(sum(x * x for x in v)) or 1
    return tuple(x / length for x in v)


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    source, faces = gifti("pial_left.gii.gz")
    curvature = gifti("curv_left.gii.gz")[0]
    # Lateral profile: anterior left, superior up, left hemisphere toward the viewer.
    source = [(-y, z, -x) for x, y, z in source]
    low = [min(p[i] for p in source) for i in range(3)]
    high = [max(p[i] for p in source) for i in range(3)]
    center = [(a + b) / 2 for a, b in zip(low, high)]
    scale = 5.05 / (high[0] - low[0])
    vertices = [tuple((p[i] - center[i]) * scale + (0.35 if i == 1 else 0) for i in range(3)) for p in source]
    normals = [[0., 0., 0.] for _ in vertices]
    cumulative, total = [], 0.
    for a, b, c in faces:
        u = [vertices[b][i] - vertices[a][i] for i in range(3)]
        v = [vertices[c][i] - vertices[a][i] for i in range(3)]
        n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
        total += math.sqrt(sum(x * x for x in n)) / 2
        cumulative.append(total)
        for index in (a, b, c):
            for i in range(3):
                normals[index][i] += n[i]
    normals = [unit(n) for n in normals]
    rng = random.Random(27041998)
    candidates = []
    for _ in range(220000):
        triangle = faces[bisect.bisect_left(cumulative, rng.random() * total)]
        r, s = math.sqrt(rng.random()), rng.random()
        weights = (1 - r, r * (1 - s), r * s)
        point = tuple(sum(vertices[triangle[j]][i] * weights[j] for j in range(3)) for i in range(3))
        normal = unit(tuple(sum(normals[triangle[j]][i] * weights[j] for j in range(3)) for i in range(3)))
        curv = sum(curvature[triangle[j]] * weights[j] for j in range(3))
        candidates.append((point, normal, max(0, min(1, 0.60 - curv * 2.2))))
    for _ in range(23000):
        y, phi = rng.random() * 2 - 1, rng.random() * math.tau
        ring = math.sqrt(1 - y * y)
        n = (math.cos(phi) * ring, y, math.sin(phi) * ring)
        ridge = 1 + 0.045 * math.cos(y * 60)
        point = (1.24 + n[0] * 0.82 * ridge, -1.14 + n[1] * 0.53, -0.26 + n[2] * 0.62 * ridge)
        candidates.append((point, unit((n[0] / 0.82, n[1] / 0.53, n[2] / 0.62)), 0.40 + 0.30 * math.cos(y * 60)))
    for _ in range(8000):
        t, phi = rng.random(), rng.random() * math.tau
        radius = 0.23 - t * 0.12
        point = (0.47 + t * 0.20 + math.cos(phi) * radius, -1.20 - t * 1.10, -0.10 + math.sin(phi) * radius)
        candidates.append((point, unit((math.cos(phi), 0.1, math.sin(phi))), 0.30 + (1 - t) * 0.25))
    # One foreground sample per screen-space cell: separated glyphs, clean silhouette,
    # and no back surface bleeding through the folds. Other points still carry morphs.
    cells = {}
    spacing = 0.063
    for point, normal, shade in candidates:
        if normal[2] < 0.025:
            continue
        key = (round(point[0] / spacing), round(point[1] / spacing))
        if key not in cells or point[2] > cells[key][0][2]:
            cells[key] = (point, normal, shade)
    foreground = [(p, n, shade, 0.18 + 0.82 * max(0, min(1, (p[1] + 2.3) / 0.85))) for p, n, shade in cells.values()]
    count = 16000
    samples = foreground + [(p, n, shade, 0.) for p, n, shade in rng.sample(candidates, count - len(foreground))]
    rng.shuffle(samples)
    output = bytearray(b"ACB3" + struct.pack("<I", count))
    for point, normal, shade, visibility in samples:
        output.extend(struct.pack("<hhhbbbBB", *(round(max(-1, min(1, v / 3)) * 32767) for v in point), *(round(v * 127) for v in normal), round(max(0, min(1, shade)) * 255), round(visibility * 255)))
    (OUTPUT / "alfacode-brain.bin").write_bytes(output)
    freesurfer = cached("https://raw.githubusercontent.com/freesurfer/freesurfer/dev/LICENSE.txt", "FreeSurfer-LICENSE.txt").decode()
    nilearn = cached(f"https://raw.githubusercontent.com/nilearn/nilearn/{COMMIT}/LICENSE", "Nilearn-LICENSE.txt").decode()
    notice = f"""AlfaCode particle brain — MODIFIED VISUALIZATION

The cortex is derived from the FreeSurfer fsaverage5 average template as
redistributed by Nilearn. Left hemisphere, resampled, rotated into lateral view,
scaled and quantized. Foreground samples are spaced to keep glyphs legible.
This is not the original dataset. No individual participant data are included.
The cerebellum and brainstem are original decorative procedural approximations.

Source: https://github.com/nilearn/nilearn/tree/{COMMIT}/nilearn/datasets/data/fsaverage5
Files: pial_left.gii.gz, curv_left.gii.gz
Generator: scripts/generate-landing-brain.py
SHA256: {hashlib.sha256(output).hexdigest()}

All or portions of this licensed product (such portions are the "Software") have
been obtained under license from The General Hospital Corporation "MGH" and are
subject to the following terms and conditions:

{freesurfer}

Nilearn redistribution notice:
{nilearn}
"""
    (OUTPUT / "brain-NOTICE.txt").write_text(notice.rstrip() + "\n", encoding="utf-8")
    groups = {}
    for point, normal, shade, visibility in foreground:
        # Same particle-only silhouette for reduced-motion/no-JavaScript rendering.
        x, y, z = point
        factor = 100 / (1 - z * 0.075)
        cx, cy = x * factor, -y * factor
        radius, angle = (0.018 + rng.random() * 0.035) * 140, rng.random() * math.tau
        light = max(0, sum(a * b for a, b in zip(normal, unit((-0.85, 0.95, 0.45)))))
        light = min(1, light / 0.85)
        light = light * light * (3 - 2 * light)
        region = (0.5 + 0.5 * math.sin(x * 2.1 + y * 1.7 + z * 1.3)) * 0.45
        linear = [(a + (b - a) * light) * (0.55 + shade * 0.45) * (1 - region + region * tint) for a, b, tint in zip((0.002, 0.10, 0.17), (0.72, 0.96, 1.), (0.15, 0.65, 1.))]
        srgb = [(12.92 * v if v <= 0.0031308 else 1.055 * v ** (1 / 2.4) - 0.055) for v in linear]
        color = "#" + "".join(f"{min(255, round(v * 255 / 8) * 8):02x}" for v in srgb)
        opacity = round((0.70 + rng.random() * 0.30) * visibility * 8) / 8
        key = color, opacity
        pts = [(cx + (a * math.cos(angle) - b * math.sin(angle)) * radius, cy + (a * math.sin(angle) + b * math.cos(angle)) * radius) for a, b in ((-.5, -.29), (.5, -.29), (0, .58))]
        groups.setdefault(key, []).append("M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + "Z")
    paths = "".join(f'<path d="{"".join(values)}" stroke="{color}" opacity="{opacity}"/>' for (color, opacity), values in groups.items())
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -240 600 480"><title>Cerebro lateral de particulas AlfaCode</title><metadata>{escape(notice)}</metadata><g fill="none" stroke-width="0.6" stroke-linejoin="round">{paths}</g></svg>'
    (OUTPUT / "alfacode-brain.svg").write_text(svg, encoding="utf-8")
    print(json.dumps({"samples": count, "visible": len(foreground), "bytes": len(output), "sha256": hashlib.sha256(output).hexdigest()}))


if __name__ == "__main__":
    main()
