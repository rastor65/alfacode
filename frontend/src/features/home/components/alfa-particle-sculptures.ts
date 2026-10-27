/** Original procedural surfaces. All sampling happens once, never in the render loop. */
type V3 = [number, number, number];
type Random = () => number;
type Sample = { point: V3; normal: V3 };
type Surface = { area: number; sample: (random: Random) => Sample };
const TAU = Math.PI * 2;
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (v: V3, s: number): V3 => [v[0] * s, v[1] * s, v[2] * s];
const subtract = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const length = (v: V3) => Math.hypot(...v);
const unit = (v: V3): V3 => scale(v, 1 / (length(v) || 1));
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function basis(direction: V3) {
  const tangent = unit(direction);
  const normal = unit(cross(tangent, Math.abs(tangent[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]));
  return { tangent, normal, binormal: cross(tangent, normal) };
}

function cylinder(a: V3, b: V3, radius: number, endRadius = radius): Surface {
  const delta = subtract(b, a);
  const distance = length(delta);
  const { tangent, normal, binormal } = basis(delta);
  return {
    area: Math.PI * (radius + endRadius) * distance + Math.PI * (radius ** 2 + endRadius ** 2),
    sample(random) {
      const theta = random() * TAU;
      const radial = add(scale(normal, Math.cos(theta)), scale(binormal, Math.sin(theta)));
      if (random() < 0.1) {
        const end = random() < 0.5;
        return { point: add(end ? b : a, scale(radial, Math.sqrt(random()) * (end ? endRadius : radius))), normal: scale(tangent, end ? 1 : -1) };
      }
      const t = random();
      return {
        point: add(add(a, scale(delta, t)), scale(radial, radius + (endRadius - radius) * t)),
        normal: unit(add(radial, scale(tangent, (radius - endRadius) / distance))),
      };
    },
  };
}

function sphere(center: V3, radii: V3): Surface {
  return {
    area: 4 * Math.PI * ((radii[0] * radii[1] + radii[1] * radii[2] + radii[0] * radii[2]) / 3),
    sample(random) {
      const y = random() * 2 - 1;
      const theta = random() * TAU;
      const ring = Math.sqrt(1 - y * y);
      const n: V3 = [Math.cos(theta) * ring, y, Math.sin(theta) * ring];
      return { point: add(center, n.map((v, i) => v * radii[i]) as V3), normal: unit(n.map((v, i) => v / radii[i]) as V3) };
    },
  };
}

function box(center: V3, half: V3, bevel = 0.06): Surface {
  const weights = [half[1] * half[2], half[0] * half[2], half[0] * half[1]];
  const total = weights.reduce((a, b) => a + b, 0);
  return {
    area: total * 8,
    sample(random) {
      const select = random() * total;
      const axis = select < weights[0] ? 0 : select < weights[0] + weights[1] ? 1 : 2;
      const p = half.map((v) => (random() * 2 - 1) * v) as V3;
      p[axis] = half[axis] * (random() < 0.5 ? -1 : 1);
      const core = p.map((v, i) => Math.max(-half[i] + bevel, Math.min(half[i] - bevel, v))) as V3;
      const normal = unit(subtract(p, core));
      return { point: add(center, add(core, scale(normal, bevel))), normal };
    },
  };
}

function tube(path: (t: number) => V3, radius: number): Surface {
  let distance = 0;
  for (let i = 1; i <= 48; i++) distance += length(subtract(path(i / 48), path((i - 1) / 48)));
  return {
    area: TAU * radius * distance,
    sample(random) {
      const t = random();
      const { normal, binormal } = basis(subtract(path(t + 0.0001), path(t - 0.0001)));
      const angle = random() * TAU;
      const radial = add(scale(normal, Math.cos(angle)), scale(binormal, Math.sin(angle)));
      return { point: add(path(t), scale(radial, radius)), normal: radial };
    },
  };
}

function sampler(surfaces: Surface[], random: Random) {
  let total = 0;
  const cumulative = surfaces.map((surface) => (total += surface.area));
  return () => {
    const value = random() * total;
    let low = 0, high = cumulative.length - 1;
    while (low < high) { const middle = (low + high) >>> 1; if (value < cumulative[middle]) high = middle; else low = middle + 1; }
    return surfaces[low].sample(random);
  };
}

/** A readable brain emblem: open folds and two hemispheres, built from the same tubes as the other figures. */
export function createBrainSampler(random: Random) {
  const surfaces: Surface[] = [];
  const curve = (points: [V3, V3, V3, V3], radius: number) => {
    surfaces.push(tube((t) => {
      const s = 1 - t;
      return [0, 1, 2].map((axis) => s ** 3 * points[0][axis] + 3 * s ** 2 * t * points[1][axis] + 3 * s * t ** 2 * points[2][axis] + t ** 3 * points[3][axis]) as V3;
    }, radius));
  };
  const outline = [
    [[-0.17, 1.57], [-0.17, 2.13], [-0.94, 2.27], [-1.17, 1.85]],
    [[-1.17, 1.85], [-1.70, 2.04], [-2.07, 1.60], [-1.87, 1.21]],
    [[-1.87, 1.21], [-2.38, 1.17], [-2.55, 0.55], [-2.18, 0.24]],
    [[-2.18, 0.24], [-2.55, -0.16], [-2.30, -0.82], [-1.97, -0.86]],
    [[-1.97, -0.86], [-2.05, -1.42], [-1.26, -1.79], [-0.95, -1.49]],
    [[-0.95, -1.49], [-0.63, -1.83], [-0.17, -1.58], [-0.17, -1.10]],
    [[-0.17, -1.10], [-0.12, -0.25], [-0.22, 0.85], [-0.17, 1.57]],
  ];
  const folds = [
    [[-0.17, 1.12], [-0.73, 1.49], [-1.43, 1.18], [-1.28, 0.70]],
    [[-1.28, 0.70], [-1.20, 0.38], [-0.79, 0.43], [-0.74, 0.68]],
    [[-1.87, 1.21], [-1.52, 0.82], [-1.91, 0.16], [-2.18, 0.24]],
    [[-0.17, 0.13], [-0.81, 0.52], [-1.56, 0.04], [-1.24, -0.46]],
    [[-1.97, -0.86], [-1.83, -0.32], [-1.14, -0.94], [-0.99, -0.65]],
    [[-0.17, -1.10], [-0.64, -1.44], [-1.12, -1.08], [-0.95, -0.82]],
  ];
  for (const side of [-1, 1]) {
    for (const [paths, radius] of [[outline, 0.105], [folds, 0.085]] as const) {
      for (const path of paths) {
        const points = path.map(([x, y]) => [x * side, y, 0.18 + 0.18 * Math.cos(y * 0.9) * Math.cos(x * 0.65)] as V3) as [V3, V3, V3, V3];
        curve(points, radius);
      }
    }
  }
  curve([[-0.18, -1.60, 0.12], [-0.24, -2.12, 0.06], [0.24, -2.12, 0.06], [0.18, -1.60, 0.12]], 0.095);
  return sampler(surfaces, random);
}

export function createSculptureSamplers(random: Random) {
  const software: Surface[] = [
    cylinder([-1.25, 1.3, 0], [-2.45, 0, 0.1], 0.115),
    cylinder([-2.45, 0, 0.1], [-1.25, -1.3, 0], 0.115),
    sphere([-2.45, 0, 0.1], [0.115, 0.115, 0.115]),
    cylinder([1.25, 1.3, 0], [2.45, 0, -0.1], 0.115),
    cylinder([2.45, 0, -0.1], [1.25, -1.3, 0], 0.115),
    sphere([2.45, 0, -0.1], [0.115, 0.115, 0.115]),
    cylinder([0.62, 1.88, 0.2], [-0.62, -1.88, 0.2], 0.095),
  ];

  const ai: Surface[] = [
    box([0, 1.32, 0], [1.38, 0.105, 0.22], 0.08), box([0, -1.32, 0], [1.38, 0.105, 0.22], 0.08),
    box([1.32, 0, 0], [0.105, 1.38, 0.22], 0.08), box([-1.32, 0, 0], [0.105, 1.38, 0.22], 0.08),
    box([0, 0, 0.22], [0.62, 0.62, 0.28], 0.09),
    box([0, 0, 0.52], [0.47, 0.47, 0.045], 0.03),
  ];
  for (let i = -2; i <= 2; i++) {
    const pitch = i * 0.47;
    for (const side of [-1, 1]) {
      ai.push(cylinder([pitch, side * 1.4, -0.03], [pitch, side * 2, -0.03], 0.055));
      ai.push(cylinder([side * 1.4, pitch, -0.03], [side * 2, pitch, -0.03], 0.055));
    }
  }
  for (const axis of [-1, 1]) {
    for (const offset of [-0.38, 0.38]) {
      ai.push(cylinder([axis * 0.65, offset, 0.23], [axis * 1.24, offset, 0.23], 0.025));
      ai.push(cylinder([offset, axis * 0.65, 0.23], [offset, axis * 1.24, 0.23], 0.025));
    }
  }
  const neurons: V3[] = [[0, 0, 0.68], [-0.3, -0.3, 0.64], [0.3, -0.3, 0.64], [-0.3, 0.3, 0.64], [0.3, 0.3, 0.64]];
  neurons.forEach((node, index) => {
    ai.push(sphere(node, [0.075, 0.075, 0.075]));
    if (index) ai.push(cylinder(node, neurons[0], 0.025));
  });

  const iot: Surface[] = [];
  for (let i = 0; i < 8; i++) {
    const meridian = i * Math.PI / 8;
    iot.push(tube((t) => [Math.cos(t * TAU) * Math.cos(meridian) * 1.65, Math.sin(t * TAU) * 1.65, Math.cos(t * TAU) * Math.sin(meridian) * 1.65], 0.022));
  }
  for (let i = -2; i <= 2; i++) {
    const latitude = i * 0.43;
    iot.push(tube((t) => [Math.cos(t * TAU) * Math.cos(latitude) * 1.65, Math.sin(latitude) * 1.65, Math.sin(t * TAU) * Math.cos(latitude) * 1.65], 0.022));
  }
  for (const [index, tilt] of [-0.62, 0.87].entries()) {
    const path = (t: number): V3 => [Math.cos(t * TAU) * 2.5, Math.sin(t * TAU) * Math.cos(tilt) * 2.25, Math.sin(t * TAU) * Math.sin(tilt) * 2.25];
    iot.push(tube(path, 0.026));
    for (const fraction of [0.12 + index * 0.14, 0.63 + index * 0.11]) iot.push(sphere(path(fraction), [0.12, 0.12, 0.12]));
  }

  const research: Surface[] = [
    box([0, -1.78, 0], [1.53, 0.13, 0.63], 0.1),
    tube((t) => { const angle = -Math.PI / 2 + t * Math.PI; return [0.2 + Math.cos(angle) * 1.14, -0.4 + Math.sin(angle) * 1.2, -0.28]; }, 0.19),
    cylinder([0.44, 1.43, 0], [-0.48, 0.26, 0], 0.28),
    cylinder([0.44, 1.43, 0], [0.79, 1.9, 0], 0.19),
    cylinder([0.73, 1.81, 0], [0.85, 1.97, 0], 0.24),
    cylinder([-0.48, 0.26, 0], [-0.71, -0.07, 0], 0.25, 0.11),
    cylinder([-0.39, 0.24, 0.16], [-0.48, -0.02, 0.33], 0.09),
    cylinder([-0.5, 0.24, -0.15], [-0.82, 0.08, -0.26], 0.075),
    box([-0.35, -0.39, 0.04], [1.0, 0.07, 0.51], 0.05),
    cylinder([0.45, -0.45, -0.25], [0.45, -1.66, -0.25], 0.13),
    cylinder([1.17, -0.22, -0.25], [1.17, -0.22, 0.2], 0.22),
    cylinder([1.17, -0.22, 0.18], [1.17, -0.22, 0.31], 0.27),
    box([-0.42, -0.29, 0.1], [0.36, 0.025, 0.18], 0.015),
  ];
  return { brain: createBrainSampler(random), software: sampler(software, random), ai: sampler(ai, random), iot: sampler(iot, random), research: sampler(research, random) };
}

/** Octahedral encoding packs six surface normals into three vec4 vertex attributes. */
export function encodeSurfaceNormal(x: number, y: number, z: number): [number, number] {
  const inverse = 1 / (Math.abs(x) + Math.abs(y) + Math.abs(z) || 1);
  x *= inverse; y *= inverse;
  if (z < 0) return [(1 - Math.abs(y)) * (x < 0 ? -1 : 1), (1 - Math.abs(x)) * (y < 0 ? -1 : 1)];
  return [x, y];
}
