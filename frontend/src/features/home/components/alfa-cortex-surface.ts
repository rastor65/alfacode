import type { IUniform } from "three";

const VERTEX = `
  attribute float aCurvature;
  uniform vec3 uRotation;
  uniform float uScale;
  uniform float uEnergy;
  uniform float uTime;
  uniform vec2 uCenter;
  varying vec3 vNormal;
  varying float vCurvature;
  void main() {
    vec3 p = position;
    vec3 n = normal;
    float pitch = uRotation.x + uEnergy * 0.025;
    float turn = uRotation.y + sin(uTime * 0.10) * 0.035 + uEnergy * 0.045;
    mat2 rx = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch));
    mat2 ry = mat2(cos(turn), -sin(turn), sin(turn), cos(turn));
    mat2 rz = mat2(cos(uRotation.z), -sin(uRotation.z), sin(uRotation.z), cos(uRotation.z));
    p.yz = rx * p.yz; n.yz = rx * n.yz;
    p.xz = ry * p.xz; n.xz = ry * n.xz;
    p.xy = rz * p.xy; n.xy = rz * n.xy;
    p.xy /= max(0.7, 1.0 - p.z * 0.075);
    vec4 viewPosition = modelViewMatrix * vec4(p * uScale, 1.0);
    viewPosition.xy += uCenter;
    gl_Position = projectionMatrix * viewPosition;
    vNormal = n;
    vCurvature = aCurvature;
  }
`;
const FRAGMENT = `
  uniform float uResolve;
  uniform vec2 uPointer;
  uniform float uPointerInfluence;
  varying vec3 vNormal;
  varying float vCurvature;
  void main() {
    vec3 n = normalize(vNormal);
    vec3 key = normalize(vec3(-0.65 + uPointer.x * uPointerInfluence * 0.07, 0.95, 1.15));
    float diffuse = max(dot(n, key), 0.0);
    float fill = max(dot(n, normalize(vec3(0.8, -0.1, 0.75))), 0.0);
    float folds = smoothstep(0.28, 0.85, vCurvature);
    float light = (0.065 + pow(diffuse, 1.3) * 0.79 + fill * 0.09) * (0.30 + folds * 0.70);
    vec3 color = mix(vec3(0.001, 0.012, 0.024), vec3(0.18, 0.67, 0.83), light);
    float rim = pow(1.0 - max(n.z, 0.0), 3.0);
    color += vec3(0.08, 0.28, 0.35) * rim * 0.08;
    gl_FragColor = vec4(color, uResolve);
    #include <colorspace_fragment>
  }
`;

/** Indexed cortex for legibility. The particle cloud still carries every morph. */
export async function loadCortexSurface(THREE: typeof import("three"), shared: Record<string, IUniform>, signal: AbortSignal) {
  const response = await fetch("/visuals/alfacode-cortex-surface.bin", { signal });
  if (!response.ok) throw new Error("Surface unavailable");
  const data = new DataView(await response.arrayBuffer());
  signal.throwIfAborted();
  if (data.byteLength < 12 || data.getUint32(0, false) !== 0x41435331) throw new Error("Invalid surface");
  const count = data.getUint32(4, true), faces = data.getUint32(8, true);
  if (!count || count > 65535 || !faces || data.byteLength !== 12 + count * 10 + faces * 6) throw new Error("Invalid surface size");
  const positions = new Float32Array(count * 3), normals = new Float32Array(count * 3), curvature = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const offset = 12 + i * 10;
    for (let axis = 0; axis < 3; axis++) {
      positions[i * 3 + axis] = data.getInt16(offset + axis * 2, true) / 32767 * 3;
      normals[i * 3 + axis] = data.getInt8(offset + 6 + axis) / 127;
    }
    curvature[i] = data.getUint8(offset + 9) / 255;
  }
  const indices = new Uint16Array(faces * 3);
  for (let i = 0; i < indices.length; i++) {
    indices[i] = data.getUint16(12 + count * 10 + i * 2, true);
    if (indices[i] >= count) throw new Error("Invalid surface index");
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute("aCurvature", new THREE.BufferAttribute(curvature, 1));
  geometry.setIndex(new THREE.BufferAttribute(indices, 1));
  const resolve = { value: 0 };
  const material = new THREE.ShaderMaterial({
    uniforms: { ...shared, uResolve: resolve }, vertexShader: VERTEX, fragmentShader: FRAGMENT,
    transparent: true, depthWrite: true, depthTest: true,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  return { mesh, material, resolve, dispose: () => { geometry.dispose(); material.dispose(); } };
}
