/** Equal-size point clouds: the GPU interpolates the same particles between every chapter. */
export const PARTICLE_FORMS = ["logo", "brain", "software", "ai", "iot", "research"] as const;
export type ParticleForm = typeof PARTICLE_FORMS[number];

const symbols = {
  software: '<path d="M31 25 8 50l23 25M69 25l23 25-23 25M59 13 41 87"/>',
  ai: '<rect x="25" y="25" width="50" height="50" rx="7"/><path d="M35 10v15m15-15v15m15-15v15M35 75v15m15-15v15m15-15v15M10 35h15m-15 15h15m-15 15h15M75 35h15m-15 15h15m-15 15h15M38 39l24 22M38 61l24-22M38 39v22h24V39Z"/><circle cx="38" cy="39" r="3"/><circle cx="62" cy="61" r="3"/><circle cx="38" cy="61" r="3"/><circle cx="62" cy="39" r="3"/>',
  research: '<path d="m49 10 18 11-23 36-18-11ZM53 12l5-8 12 8-5 8M33 51l-5 9 8 5 6-9M63 37c24 9 23 39-4 43H38M22 67h34M26 88h54M38 80v8M68 79v9"/>',
};

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
    for (let y = 0; y < pixels.height; y++) {
      for (let x = 0; x < pixels.width; x++) {
        if (pixels.data[(y * pixels.width + x) * 4 + 3] > 100) {
          points.push([(x / pixels.width - 0.5) * 6.05, (0.5 - y / pixels.height) * 4.54]);
        }
      }
    }
    if (!points.length) throw new Error("Empty particle form");
    return points;
  } finally { URL.revokeObjectURL(url); }
}

export async function createParticleForms(count: number, signal: AbortSignal) {
  const response = await fetch("/AlfaCode_logos/SVG/AlfaCode_logo_horizontal.svg", { signal });
  if (!response.ok) throw new Error("Logo unavailable");
  const xml = new DOMParser().parseFromString(await response.text(), "image/svg+xml");
  const symbol = xml.querySelector('[id="isotipo"]');
  if (!symbol) throw new Error("Symbol unavailable");
  const brain = document.querySelector<SVGSVGElement>(".alfa-brain-fallback")?.cloneNode(true) as SVGSVGElement | undefined;
  if (!brain) throw new Error("Brain unavailable");
  brain.setAttribute("stroke", "white");
  brain.setAttribute("stroke-width", "0.5");
  brain.setAttribute("preserveAspectRatio", "none");
  brain.removeAttribute("class");
  const folds = '<path d="M8 5c-2 0-3 2-1 3s3 0 3 2-3 2-3 4M5 10c-2 1-2 4 0 4s3-1 4 1-1 4-3 3"/>';
  const brainSource = brain.outerHTML.replace("</svg>", `${folds}<g transform="translate(24 0) scale(-1 1)">${folds}</g></svg>`);
  const masks = await Promise.all([
    rasterize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="215 163 824 618">${symbol.outerHTML}</svg>`, signal),
    ...Object.values(symbols).map((paths) => rasterize(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-14 -2 128 104" fill="none" stroke="white" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`, signal)),
    rasterize(brainSource, signal),
  ]);
  signal.throwIfAborted();
  const random = seededRandom();
  const forms = Object.fromEntries(PARTICLE_FORMS.map((key) => [key, new Float32Array(count * 3)])) as Record<ParticleForm, Float32Array>;
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);

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
      continue;
    }
    for (const [key, mask] of [["logo", masks[0]], ["software", masks[1]], ["ai", masks[2]], ["research", masks[3]]] as const) {
      const point = mask[Math.floor(random() * mask.length)];
      forms[key].set([point[0], point[1], (random() - 0.5) * (key === "logo" ? 1 : 0.35)], i * 3);
    }

    // Two cortical hemispheres, a medial fissure and folded surface; a small brain stem.
    const side = random() < 0.5 ? -1 : 1;
    const u = random();
    const angle = random() * Math.PI * 2;
    const radius = Math.sqrt(1 - u * u);
    const fold = Math.sin(angle * 11 + u * 12) * Math.sin(u * 23 - angle * 3) * 0.09;
    let x = side * (0.1 + u * 2.05);
    let y = Math.sin(angle) * radius * (1.75 + fold);
    let z = Math.cos(angle) * radius * (1.35 + fold * 2);
    x += side * fold;
    if (i % 13 === 0) { x = (random() - 0.5) * 0.58; y = -1.25 - random() * 1.05; z = -0.2 + random() * 0.55; }
    if (i % 3 !== 0) {
      // Denser particles trace the folds of the existing Lucide brain, curved over the volume.
      const foldPoint = masks[4][Math.floor(random() * masks[4].length)];
      x = foldPoint[0] * 1.02;
      y = foldPoint[1];
      z = Math.sqrt(Math.max(0.04, 1 - (x / 2.9) ** 2 - (y / 2.35) ** 2)) * 1.25;
      z += Math.sin(x * 9 + y * 5) * 0.08;
    }
    forms.brain.set([x, y, z], i * 3);

    // A globe with meridians, latitude rings, three data orbits and satellite nodes.
    const t = random() * Math.PI * 2;
    let gx: number, gy: number, gz: number;
    if (i % 10 < 6) {
      if (i % 2) {
        const longitude = (i % 9) * Math.PI / 9;
        gx = Math.cos(t) * Math.cos(longitude) * 1.8;
        gy = Math.sin(t) * 1.8;
        gz = Math.cos(t) * Math.sin(longitude) * 1.8;
      } else {
        const latitude = ((i % 7) - 3) * 0.38;
        gx = Math.cos(t) * Math.cos(latitude) * 1.8;
        gy = Math.sin(latitude) * 1.8;
        gz = Math.sin(t) * Math.cos(latitude) * 1.8;
      }
    } else {
      const orbit = (i % 3) * Math.PI / 3 + 0.35;
      gx = Math.cos(t) * 2.7;
      gy = Math.sin(t) * Math.cos(orbit) * 2.7;
      gz = Math.sin(t) * Math.sin(orbit) * 2.7;
      if (i % 10 === 9) {
        const node = (i % 5) * Math.PI * 0.4;
        gx = Math.cos(node) * 2.7 + (random() - 0.5) * 0.25;
        gy = Math.sin(node) * 2.1 + (random() - 0.5) * 0.25;
        gz = (random() - 0.5) * 0.25;
      }
    }
    forms.iot.set([gx, gy, gz], i * 3);
  }
  return { forms, seeds, sizes, alphas };
}
