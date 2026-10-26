"""Build the decorative cortex point cloud. Standard library only; no runtime mesh decoder.

Source: fsaverage5 pial surfaces redistributed by Nilearn. See the generated NOTICE.
The resulting quantized particle surface is a modified visualization asset.
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


def download(url, name):
    target = CACHE / name
    if not target.exists():
        urllib.request.urlretrieve(url, target)
    return target.read_bytes()


def gifti(name):
    tree = ET.fromstring(gzip.decompress(download(BASE + name, name)))
    result = []
    for element in tree.findall("DataArray"):
        raw = zlib.decompress(base64.b64decode(element.findtext("Data")))
        values = array.array("f" if element.attrib["DataType"] == "NIFTI_TYPE_FLOAT32" else "i")
        values.frombytes(raw)
        if (element.attrib.get("Endian", "LittleEndian") == "LittleEndian") != (sys.byteorder == "little"):
            values.byteswap()
        dims = [int(element.attrib[f"Dim{i}"]) for i in range(int(element.attrib["Dimensionality"]))]
        result.append([tuple(values[i:i + 3]) for i in range(0, len(values), 3)] if len(dims) == 2 else list(values))
    return result


def normalize(v):
    length = math.sqrt(sum(x * x for x in v)) or 1
    return tuple(x / length for x in v)


def rotate(v):
    x, y, z = v
    angle = 0.68
    x, z = x * math.cos(angle) + z * math.sin(angle), -x * math.sin(angle) + z * math.cos(angle)
    angle = -0.1
    return x, y * math.cos(angle) - z * math.sin(angle), y * math.sin(angle) + z * math.cos(angle)


def main():
    CACHE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    vertices, faces, curvature = [], [], []
    for side in ("left", "right"):
        points, triangles = gifti(f"pial_{side}.gii.gz")
        offset = len(vertices)
        # Source RAS: X left/right, Y anterior/posterior, Z superior/inferior.
        vertices.extend((p[0], p[2], p[1]) for p in points)
        # Swapping source axes reverses winding.
        faces.extend((t[0] + offset, t[2] + offset, t[1] + offset) for t in triangles)
        curvature.extend(gifti(f"curv_{side}.gii.gz")[0])
    low = [min(p[i] for p in vertices) for i in range(3)]
    high = [max(p[i] for p in vertices) for i in range(3)]
    center = [(low[i] + high[i]) / 2 for i in range(3)]
    scale = 5.05 / max(high[i] - low[i] for i in range(3))
    normals = [[0.0, 0.0, 0.0] for _ in vertices]
    cumulative, total = [], 0.0
    for a, b, c in faces:
        u = [vertices[b][i] - vertices[a][i] for i in range(3)]
        v = [vertices[c][i] - vertices[a][i] for i in range(3)]
        n = (u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0])
        total += math.sqrt(sum(x * x for x in n)) / 2
        cumulative.append(total)
        for index in (a, b, c):
            for i in range(3):
                normals[index][i] += n[i]
    normals = [normalize(n) for n in normals]
    rng = random.Random(27041998)
    count = 16000
    output = bytearray(b"ACB2" + struct.pack("<I", count))
    for _ in range(count):
        triangle = faces[bisect.bisect_left(cumulative, rng.random() * total)]
        r = math.sqrt(rng.random())
        s = rng.random()
        weights = (1 - r, r * (1 - s), r * s)
        point = rotate(tuple((sum(vertices[triangle[j]][i] * weights[j] for j in range(3)) - center[i]) * scale for i in range(3)))
        normal = normalize(rotate(tuple(sum(normals[triangle[j]][i] * weights[j] for j in range(3)) for i in range(3))))
        curv = sum(curvature[triangle[j]] * weights[j] for j in range(3))
        shade = round(max(0, min(1, 0.62 - curv * 1.9)) * 255)
        output.extend(struct.pack("<hhhbbbB", *(round(max(-1, min(1, x / 3)) * 32767) for x in point), *(round(x * 127) for x in normal), shade))
    target = OUTPUT / "alfacode-cortex.bin"
    target.write_bytes(output)
    # A static vector fallback from the same cortex, for reduced motion / no WebGL.
    transformed = [rotate(tuple((p[i] - center[i]) * scale for i in range(3))) for p in vertices]
    clusters = {}
    vertex_clusters = []
    for index, point in enumerate(transformed):
        key = tuple(round(v / 0.18) for v in point)
        vertex_clusters.append(key)
        clusters.setdefault(key, []).append(index)
    simplified = {key: tuple(sum(transformed[j][i] for j in indices) / len(indices) for i in range(3)) for key, indices in clusters.items()}
    seen = set()
    polygons = []
    light = normalize((-0.55, 0.85, 1.0))
    for face in faces:
        keys = [vertex_clusters[j] for j in face]
        if len(set(keys)) < 3 or tuple(sorted(keys)) in seen:
            continue
        seen.add(tuple(sorted(keys)))
        normal = normalize(rotate(tuple(sum(normals[j][i] for j in face) for i in range(3))))
        if normal[2] < 0:
            continue
        brightness = 0.2 + max(0, sum(normal[i] * light[i] for i in range(3))) * 0.8
        color = tuple(round(a + (b - a) * brightness) for a, b in zip((2, 40, 57), (148, 238, 254)))
        points = " ".join(f"{simplified[key][0] * 100:.0f},{-simplified[key][1] * 100:.0f}" for key in keys)
        fill = "#" + "".join(f"{v:02x}" for v in color)
        polygons.append((sum(transformed[j][2] for j in face), f'<path d="M{points}Z" fill="{fill}"/>'))
    polygons.sort(key=lambda item: item[0])
    svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -230 600 460" role="img"><title>Superficie cortical de AlfaCode</title>'
    svg += "".join(item[1] for item in polygons) + "</svg>"
    (OUTPUT / "alfacode-cortex.svg").write_text(svg, encoding="utf-8")
    freesurfer = download("https://raw.githubusercontent.com/freesurfer/freesurfer/dev/LICENSE.txt", "FreeSurfer-LICENSE.txt").decode()
    nilearn = download(f"https://raw.githubusercontent.com/nilearn/nilearn/{COMMIT}/LICENSE", "Nilearn-LICENSE.txt").decode()
    notice = f"""AlfaCode decorative cortex particle asset — MODIFIED DATA

alfacode-cortex.bin contains {count} area-weighted surface samples, with normals and
curvature shading, derived from the FreeSurfer fsaverage5 average cortical template
as redistributed by Nilearn. Both hemispheres were resampled, centered, rotated,
scaled and quantized for a decorative WebGL illustration. This modified asset is
not the original surface dataset. No individual participant data are included.
alfacode-cortex.svg is a simplified, shaded projection of those same surfaces.

Source: https://github.com/nilearn/nilearn/tree/{COMMIT}/nilearn/datasets/data/fsaverage5
Files: pial_left.gii.gz, pial_right.gii.gz, curv_left.gii.gz, curv_right.gii.gz
Generator: scripts/generate-landing-cortex.py
SHA256: {hashlib.sha256(output).hexdigest()}

All or portions of this licensed product (such portions are the "Software") have
been obtained under license from The General Hospital Corporation "MGH" and are
subject to the following terms and conditions:

{freesurfer}

Nilearn redistribution notice:
{nilearn}
"""
    (OUTPUT / "cortex-NOTICE.txt").write_text(notice, encoding="utf-8")
    (OUTPUT / "alfacode-cortex.svg").write_text(svg.replace("<title>", f"<metadata>{escape(notice)}</metadata><title>", 1), encoding="utf-8")
    print(json.dumps({"samples": count, "bytes": len(output), "sha256": hashlib.sha256(output).hexdigest()}))


if __name__ == "__main__":
    main()
