import { createSculptureSamplers } from "./alfa-particle-sculptures";
import { loadBrainParticles } from "./alfa-brain-particles";

/** Equal-size point clouds: the GPU interpolates the same particles between every chapter. */
export const PARTICLE_FORMS = ["logo", "brain", "software", "ai", "iot", "research"] as const;
export type ParticleForm = typeof PARTICLE_FORMS[number];

function seededRandom() {
  let seed = 27041998;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}

async function rasterize(source: string, signal: AbortSignal) {
  const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    signal.throwIfAborted();
    const canvas = document.createElement("canvas");
    canvas.width = 384;
    canvas.height = 288;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("Canvas unavailable");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const points: [number, number][] = [];
    const edges: { point: [number, number]; normal: [number, number, number] }[] = [];
    const alpha = (x: number, y: number) => x < 0 || y < 0 || x >= pixels.width || y >= pixels.height ? 0 : pixels.data[(y * pixels.width + x) * 4 + 3];
    for (let y = 0; y < pixels.height; y++) {
      for (let x = 0; x < pixels.width; x++) {
        if (pixels.data[(y * pixels.width + x) * 4 + 3] > 100) {
          const point: [number, number] = [(x / pixels.width - 0.5) * 6.05, (0.5 - y / pixels.height) * 4.54];
          points.push(point);
          const gx = alpha(x + 2, y) - alpha(x - 2, y);
          const gy = alpha(x, y + 2) - alpha(x, y - 2);
          const gradient = Math.hypot(gx, gy);
          if (gradient > 60) edges.push({ point, normal: [-gx / gradient, gy / gradient, 0] });
        }
      }
    }
    if (!points.length) throw new Error("Empty particle form");
    return { points, edges };
  } finally { URL.revokeObjectURL(url); }
}

export async function createParticleForms(count: number, signal: AbortSignal) {
  const [response, brain] = await Promise.all([
    fetch("/AlfaCode_logos/SVG/AlfaCode_logo_horizontal.svg", { signal }),
    loadBrainParticles(signal),
  ]);
  if (!response.ok) throw new Error("Logo unavailable");
  const xml = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
  const symbol = xml.querySelector('[id="isotipo"]');
  if (!symbol) throw new Error("Symbol unavailable");
  const logo = await rasterize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="215 163 824 618">${symbol.outerHTML}</svg>`, signal);
  signal.throwIfAborted();
  const random = seededRandom();
  const sculptures = createSculptureSamplers(random);
  const forms = Object.fromEntries(PARTICLE_FORMS.map((key) => [key, new Float32Array(count * 3)])) as Record<ParticleForm, Float32Array>;
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const surfaceNormals = Object.fromEntries(PARTICLE_FORMS.map((key) => [key, new Float32Array(count * 3)])) as Record<ParticleForm, Float32Array>;
  const brainStyle = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    seeds[i] = random();
    sizes[i] = 0.018 + random() * 0.035;
    const ambient = i >= count * 0.91;
    alphas[i] = ambient ? 0.08 + random() * 0.18 : 0.45 + random() * 0.55;
    if (ambient) {
      const angle = random() * Math.PI * 2;
      const radius = 3.1 + random() * 1.1;
      const point = [Math.cos(angle) * radius, Math.sin(angle) * radius * 0.78, (random() - 0.5) * 2];
      for (const key of PARTICLE_FORMS) forms[key].set(point, i * 3);
      for (const key of PARTICLE_FORMS) surfaceNormals[key].set([0, 0, 1], i * 3);
      brainStyle.set([alphas[i] * 0.5, 0.2], i * 2);
      continue;
    }
    if (i % 5 === 0 && logo.edges.length) {
      const edge = logo.edges[Math.floor(random() * logo.edges.length)];
      forms.logo.set([edge.point[0], edge.point[1], (random() - 0.5) * 0.42], i * 3);
      surfaceNormals.logo.set(edge.normal, i * 3);
    } else {
      const point = logo.points[Math.floor(random() * logo.points.length)];
      const back = i % 10 === 1;
      forms.logo.set([point[0], point[1], back ? -0.21 : 0.21], i * 3);
      surfaceNormals.logo.set([0, 0, back ? -1 : 1], i * 3);
    }
    const index = brain.order[i % brain.count];
    forms.brain.set(brain.positions.subarray(index * 3, index * 3 + 3), i * 3);
    surfaceNormals.brain.set(brain.normals.subarray(index * 3, index * 3 + 3), i * 3);
    brainStyle.set(brain.style.subarray(index * 2, index * 2 + 2), i * 2);
    for (const key of ["software", "ai", "iot", "research"] as const) {
      const sample = sculptures[key]();
      forms[key].set(sample.point, i * 3);
      surfaceNormals[key].set(sample.normal, i * 3);
    }
  }
  // Match spatial neighborhoods across forms, preserving a particle's sense of place.
  const bodyCount = Math.ceil(count * 0.91);
  const expand = (value: number) => {
    let n = value & 1023;
    n = (n | n << 16) & 0x030000ff;
    n = (n | n << 8) & 0x0300f00f;
    n = (n | n << 4) & 0x030c30c3;
    return (n | n << 2) & 0x09249249;
  };
  for (const key of PARTICLE_FORMS) {
    const source = forms[key].slice();
    const ranks = Array.from({ length: bodyCount }, (_, index) => {
      const q = (axis: number) => Math.max(0, Math.min(1023, Math.floor((source[index * 3 + axis] + 4) / 8 * 1023)));
      return { index, code: (expand(q(0)) | expand(q(1)) << 1 | expand(q(2)) << 2) >>> 0 };
    }).sort((a, b) => a.code - b.code);
    const normals = surfaceNormals[key].slice();
    const style = key === "brain" ? brainStyle.slice() : null;
    ranks.forEach(({ index }, target) => {
      forms[key].set(source.subarray(index * 3, index * 3 + 3), target * 3);
      surfaceNormals[key].set(normals.subarray(index * 3, index * 3 + 3), target * 3);
      if (style) brainStyle.set(style.subarray(index * 2, index * 2 + 2), target * 2);
    });
  }
  return { forms, seeds, sizes, alphas, normals: surfaceNormals, brainStyle };
}
