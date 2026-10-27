/** Reproduce the static particle brain from the same original curves as the GPU morph. */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createBrainSampler } from "../frontend/src/features/home/components/alfa-particle-sculptures";

let seed = 27041998;
const random = () => {
  seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
  return (seed >>> 0) / 4294967296;
};
const sample = createBrainSampler(random);
const palette = ["#0382a1", "#049ebf", "#469eb4", "#94eefe", "#e1feff"];
const groups = new Map<string, { color: string; alpha: number; paths: string[] }>();
for (let i = 0; i < 6200; i++) {
  const { point, normal } = sample();
  const color = palette[Math.floor(random() * palette.length)];
  const radius = (0.018 + random() * 0.035) * 70;
  const angle = random() * Math.PI * 2;
  const turn = -0.1, roll = -0.04;
  const x = point[0] * Math.cos(turn) + point[2] * Math.sin(turn);
  const z = -point[0] * Math.sin(turn) + point[2] * Math.cos(turn);
  const perspective = 100 / (1 - z * 0.075);
  const center = [(x * Math.cos(roll) - point[1] * Math.sin(roll)) * perspective, -(x * Math.sin(roll) + point[1] * Math.cos(roll)) * perspective];
  const alpha = (0.45 + random() * 0.55) * (0.3 + 0.7 * Math.max(0, Math.min(1, (normal[2] + 0.3) / 0.75)));
  const points = [[-0.5, -0.29], [0.5, -0.29], [0, 0.58]].map(([a, b]) => `${(center[0] + (a * Math.cos(angle) - b * Math.sin(angle)) * radius).toFixed(1)},${(center[1] + (a * Math.sin(angle) + b * Math.cos(angle)) * radius).toFixed(1)}`).join(" ");
  const opacity = Math.ceil(alpha * 8) / 8;
  const key = `${color}-${opacity}`;
  if (!groups.has(key)) groups.set(key, { color, alpha: opacity, paths: [] });
  groups.get(key)!.paths.push(`M${points.replaceAll(" ", "L")}Z`);
}
const paths = [...groups.values()].map(({ color, alpha, paths }) => `<path d="${paths.join("")}" stroke="${color}" stroke-opacity="${alpha}" fill="${color}" fill-opacity="${(alpha * 0.14).toFixed(2)}"/>`);
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-300 -230 600 460"><title>Cerebro de partículas AlfaCode</title><desc>Dos hemisferios y pliegues abiertos trazados con triángulos azules. Ilustración original de AlfaCode.</desc><g stroke-width="0.5" stroke-linejoin="round">${paths.join("")}</g></svg>`;
writeFileSync(fileURLToPath(new URL("../frontend/public/visuals/alfacode-brain.svg", import.meta.url)), svg);
console.log(JSON.stringify({ particles: 6200, paths: groups.size, bytes: Buffer.byteLength(svg) }));
