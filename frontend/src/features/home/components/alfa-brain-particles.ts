/** Quantized lateral surface samples, with independent visibility and curvature. No solid mesh. */
export async function loadBrainParticles(signal: AbortSignal) {
  const response = await fetch("/visuals/alfacode-brain.bin", { signal });
  if (!response.ok) throw new Error("Brain unavailable");
  const data = new DataView(await response.arrayBuffer());
  signal.throwIfAborted();
  if (data.byteLength < 8 || data.getUint32(0, false) !== 0x41434233) throw new Error("Invalid brain");
  const count = data.getUint32(4, true);
  if (!count || count > 65535 || data.byteLength !== 8 + count * 11) throw new Error("Invalid brain size");
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const style = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const offset = 8 + i * 11;
    for (let axis = 0; axis < 3; axis++) {
      positions[i * 3 + axis] = data.getInt16(offset + axis * 2, true) / 32767 * 3;
      normals[i * 3 + axis] = data.getInt8(offset + 6 + axis) / 127;
    }
    style[i * 2] = data.getUint8(offset + 10) / 255;
    style[i * 2 + 1] = data.getUint8(offset + 9) / 255;
  }
  // Keep the full silhouette on phones too; only the hidden morph carriers are reduced.
  const indices = Array.from({ length: count }, (_, i) => i);
  const order = new Uint16Array([...indices.filter((i) => style[i * 2] > 0), ...indices.filter((i) => style[i * 2] === 0)]);
  return { count, positions, normals, style, order };
}
