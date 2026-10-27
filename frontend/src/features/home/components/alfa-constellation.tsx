"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { encodeSurfaceNormal } from "./alfa-particle-sculptures";
import { createParticleForms, PARTICLE_FORMS } from "./alfa-particle-forms";
import { createScrollStory, initialParticleScene } from "./alfa-scroll-story";

const VERTEX = `
  attribute vec3 aLogo;
  attribute vec3 aBrain;
  attribute vec3 aSoftware;
  attribute vec3 aAi;
  attribute vec3 aIot;
  attribute vec3 aResearch;
  attribute vec3 aBarycentric;
  attribute vec4 aNormals0;
  attribute vec4 aNormals1;
  attribute vec4 aNormals2;
  attribute vec4 aColor;
  attribute vec3 aParticle;
  uniform float uTime;
  uniform float uFormA;
  uniform float uFormB;
  uniform float uMorph;
  uniform float uSpread;
  uniform float uEnergy;
  uniform float uPointerInfluence;
  uniform vec3 uRotation;
  uniform float uScale;
  uniform float uOpacity;
  uniform vec2 uCenter;
  uniform vec2 uPointer;
  varying vec3 vBarycentric;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFill;
  vec3 form(float index) {
    if (index < 0.5) return aLogo;
    if (index < 1.5) return aBrain;
    if (index < 2.5) return aSoftware;
    if (index < 3.5) return aAi;
    if (index < 4.5) return aIot;
    return aResearch;
  }
  vec3 surfaceNormal(float index) {
    vec2 encoded;
    if (index < 0.5) encoded = aNormals0.xy;
    else if (index < 1.5) encoded = aNormals0.zw;
    else if (index < 2.5) encoded = aNormals1.xy;
    else if (index < 3.5) encoded = aNormals1.zw;
    else if (index < 4.5) encoded = aNormals2.xy;
    else encoded = aNormals2.zw;
    vec3 n = vec3(encoded, 1.0 - abs(encoded.x) - abs(encoded.y));
    float fold = clamp(-n.z, 0.0, 1.0);
    n.xy += vec2(n.x >= 0.0 ? -fold : fold, n.y >= 0.0 ? -fold : fold);
    return normalize(n);
  }
  vec3 blendNormal(vec3 a, vec3 b, float amount) {
    if (amount < 0.001) return a;
    if (amount > 0.999) return b;
    float cosine = clamp(dot(a, b), -1.0, 1.0);
    if (cosine > 0.999) return normalize(mix(a, b, amount));
    vec3 tangent = b - a * cosine;
    if (dot(tangent, tangent) < 0.00001) tangent = cross(a, abs(a.z) < 0.9 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0));
    tangent = normalize(tangent);
    float angle = acos(cosine) * amount;
    return a * cos(angle) + tangent * sin(angle);
  }
  void main() {
    float morph = clamp(uMorph * 1.1 - aParticle.x * 0.1, 0.0, 1.0);
    vec3 p = mix(form(uFormA), form(uFormB), morph);
    float transition = sin(morph * 3.14159);
    vec3 scatter = vec3(sin(aParticle.x * 113.0), cos(aParticle.x * 67.0), sin(aParticle.x * 91.0));
    p += scatter * (transition * 0.22 + uSpread * 0.15);
    float cortex = (1.0 - step(0.1, abs(uFormA - 1.0))) * (1.0 - uMorph) + (1.0 - step(0.1, abs(uFormB - 1.0))) * uMorph;
    float logo = (1.0 - step(0.1, uFormA)) * (1.0 - uMorph) + (1.0 - step(0.1, uFormB)) * uMorph;
    float sculpture = 1.0 - logo;
    float pitch = uRotation.x + uEnergy * 0.025;
    float turn = uRotation.y + sin(uTime * 0.10) * 0.035 + uEnergy * 0.045;
    vec3 normal = blendNormal(surfaceNormal(uFormA), surfaceNormal(uFormB), morph);
    normal.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * normal.yz;
    normal.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * normal.xz;
    normal.xy = mat2(cos(uRotation.z), -sin(uRotation.z), sin(uRotation.z), cos(uRotation.z)) * normal.xy;
    p.yz = mat2(cos(pitch), -sin(pitch), sin(pitch), cos(pitch)) * p.yz;
    p.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * p.xz;
    p.xy = mat2(cos(uRotation.z), -sin(uRotation.z), sin(uRotation.z), cos(uRotation.z)) * p.xy;
    p.xy += vec2(sin(uTime * 0.24 + aParticle.x * 71.0), cos(uTime * 0.18 + aParticle.x * 43.0)) * 0.025;
    p.xy += vec2(sin(p.y * 1.8 + uTime * 0.2), cos(p.x * 1.6)) * uEnergy * 0.045;
    vec2 cursorDelta = p.xy - uPointer;
    float influence = exp(-dot(cursorDelta, cursorDelta) * 1.1) * uPointerInfluence;
    p.xy += normalize(cursorDelta + vec2(0.001)) * influence * 0.25;
    p.z += influence * 0.35;
    float perspective = 1.0 / max(0.7, 1.0 - p.z * 0.075);
    p.xy *= perspective;
    vec4 viewPosition = modelViewMatrix * vec4(p * uScale, 1.0);
    viewPosition.xy += uCenter;
    float angle = aParticle.x * 6.28318 + uTime * 0.018;
    vec2 glyph = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * position.xy;
    glyph.y *= 1.0 + abs(uEnergy) * 0.4;
    viewPosition.xy += glyph * aParticle.y * uScale * perspective * mix(0.70, 0.85, cortex);
    gl_Position = projectionMatrix * viewPosition;
    vBarycentric = aBarycentric;
    float light = max(0.0, dot(normal, normalize(vec3(-0.55 + uPointer.x * uPointerInfluence * 0.12, 0.8 + uPointer.y * uPointerInfluence * 0.08, 1.1))));
    float rim = pow(1.0 - max(0.0, normal.z), 2.5);
    vec3 corticalColor = mix(vec3(0.004, 0.085, 0.13), vec3(0.30, 0.85, 0.98), clamp(pow(light, 0.65) * 0.87 + rim * 0.13, 0.0, 1.0));
    corticalColor *= 0.72 + aColor.a * 0.4;
    vec3 brandColor = aColor.rgb * (0.65 + 0.35 * smoothstep(-1.5, 1.5, p.z));
    vec3 litColor = aColor.rgb * (0.3 + light * 0.85) + vec3(0.30, 0.85, 0.98) * rim * 0.045;
    float phase = p.y * 0.8 + p.x * 0.25 + p.z * 0.4;
    float packet = pow(0.5 + 0.5 * sin(uTime * 1.2 - phase * 3.0), 16.0);
    litColor += vec3(0.30, 0.85, 0.98) * packet * 0.075;
    vColor = mix(mix(brandColor, litColor, sculpture), corticalColor, cortex);
    float facing = mix(1.0, 0.3 + 0.7 * smoothstep(-0.3, 0.45, normal.z), sculpture);
    facing = mix(facing, 0.03 + 0.97 * smoothstep(-0.1, 0.15, normal.z), cortex);
    vFill = sculpture * 0.14 + cortex * 0.20;
    vAlpha = aParticle.z * uOpacity * facing * (0.92 + 0.08 * sin(uTime * 0.45 + aParticle.x * 91.0));
  }
`;
const FRAGMENT = `
  varying vec3 vBarycentric;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vFill;
  void main() {
    float distanceToEdge = min(vBarycentric.x, min(vBarycentric.y, vBarycentric.z));
    float edge = 1.0 - smoothstep(0.0, fwidth(distanceToEdge) * 1.15, distanceToEdge);
    float alpha = (vFill + edge * (1.0 - vFill)) * vAlpha;
    if (alpha < 0.015) discard;
    gl_FragColor = vec4(vColor, alpha);
    #include <colorspace_fragment>
  }
`;
const descriptions = [
  "AlfaCode. Una idea conecta todo.", "El conocimiento toma forma.",
  "Software. De la idea al código.", "IA. Conexiones que aprenden.",
  "IoT. El mundo está conectado.", "Investigar. Mirar más de cerca.",
];
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

/** One renderer, one instanced draw, six GPU morph targets and a reversible scroll narrative. */
export default function AlfaConstellation() {
  const stageRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const captionRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<{ update: () => void } | null>(null);
  const preferenceRef = useRef({ paused: false, reduced: true });
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const reduced = useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => true);

  useEffect(() => {
    preferenceRef.current = { paused, reduced };
    controllerRef.current?.update();
  }, [paused, reduced]);

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    const caption = captionRef.current;
    const root = host?.closest<HTMLElement>(".alfa-landing");
    if (!host || !stage || !caption || !root) return;
    let disposed = false;
    let release = () => {};
    const abort = new AbortController();
    void (async () => {
      const count = window.matchMedia("(max-width: 700px)").matches ? 6200 : 16000;
      const [THREE, particles] = await Promise.all([import("three"), createParticleForms(count, abort.signal)]);
      if (disposed) return;
      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      renderer.setClearColor(0x000000, 0);
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.domElement.setAttribute("aria-hidden", "true");
      host.appendChild(renderer.domElement);
      const world = new THREE.Scene();
      const camera = new THREE.OrthographicCamera(0, 1000, 1000, 0, 0.1, 10000);
      camera.position.z = 5000;
      const geometry = new THREE.InstancedBufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, -0.29, 0, 0.5, -0.29, 0, 0, 0.58, 0], 3));
      geometry.setAttribute("aBarycentric", new THREE.Float32BufferAttribute([1, 0, 0, 0, 1, 0, 0, 0, 1], 3));
      for (const [index, name] of ["aLogo", "aBrain", "aSoftware", "aAi", "aIot", "aResearch"].entries()) {
        geometry.setAttribute(name, new THREE.InstancedBufferAttribute(particles.forms[PARTICLE_FORMS[index]], 3));
      }
      // Packed parameters leave room for Three.js built-ins on constrained GPUs.
      for (let pair = 0; pair < 3; pair++) {
        const packed = new Float32Array(count * 4);
        for (let i = 0; i < count; i++) {
          for (let side = 0; side < 2; side++) {
            const normals = particles.normals[PARTICLE_FORMS[pair * 2 + side]];
            packed.set(encodeSurfaceNormal(normals[i * 3], normals[i * 3 + 1], normals[i * 3 + 2]), i * 4 + side * 2);
          }
        }
        geometry.setAttribute(`aNormals${pair}`, new THREE.InstancedBufferAttribute(packed, 4));
      }
      const parameters = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) parameters.set([particles.seeds[i], particles.sizes[i], particles.alphas[i]], i * 3);
      geometry.setAttribute("aParticle", new THREE.InstancedBufferAttribute(parameters, 3));
      const colors = new Float32Array(count * 4);
      const palette = ["#0382a1", "#049ebf", "#469eb4", "#94eefe", "#e1feff"].map((color) => new THREE.Color(color));
      for (let i = 0; i < count; i++) {
        const color = palette[Math.floor(particles.seeds[i] * palette.length)];
        colors.set([color.r, color.g, color.b, particles.brainShades[i]], i * 4);
      }
      geometry.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 4));
      geometry.instanceCount = count;
      const material = new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uFormA: { value: 0 }, uFormB: { value: 0 }, uMorph: { value: 0 }, uSpread: { value: 0 }, uEnergy: { value: 0 }, uPointerInfluence: { value: 0 }, uRotation: { value: new THREE.Vector3() }, uScale: { value: 100 }, uOpacity: { value: 1 }, uCenter: { value: new THREE.Vector2() }, uPointer: { value: new THREE.Vector2() } },
        vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.frustumCulled = false;
      world.add(mesh);
      const scene = initialParticleScene();
      let width = 0, height = 0, frame = 0, elapsed = 0;
      let last = performance.now();
      let inView = true, running = false, contextAvailable = true, storytelling = false;
      let endStory = () => {};
      let currentForm = -1;
      const pointer = new THREE.Vector2();
      const cursor = new THREE.Vector2();
      const chapterNav = root.querySelector<HTMLElement>(".alfa-story-index");
      let hasPointer = false;
      const draw = (delta = 1 / 60) => {
        if (disposed || !contextAvailable || !width || !height) return;
        material.uniforms.uTime.value = elapsed;
        material.uniforms.uFormA.value = scene.formA;
        material.uniforms.uFormB.value = scene.formB;
        material.uniforms.uMorph.value = scene.morph;
        material.uniforms.uSpread.value = scene.spread;
        material.uniforms.uRotation.value.set(scene.rotationX, scene.rotationY, scene.rotationZ);
        material.uniforms.uScale.value = scene.size / 6.2;
        material.uniforms.uOpacity.value = scene.opacity;
        material.uniforms.uCenter.value.set(scene.x, height - scene.y);
        if (!preferenceRef.current.reduced && !preferenceRef.current.paused) {
          const blend = 1 - Math.exp(-8 * delta);
          pointer.set((cursor.x - scene.x) / scene.size * 6.2, (scene.y - cursor.y) / scene.size * 6.2);
          const near = hasPointer && pointer.length() < 3.6;
          material.uniforms.uPointer.value.lerp(pointer, blend);
          material.uniforms.uPointerInfluence.value += ((near ? 1 : 0) - material.uniforms.uPointerInfluence.value) * blend;
          material.uniforms.uEnergy.value += (scene.energy - material.uniforms.uEnergy.value) * blend;
          scene.energy *= Math.exp(-5 * delta);
        }
        renderer.render(world, camera);
        if (storytelling) {
          const captionWidth = Math.min(420, window.innerWidth - 48);
          const x = Math.max(24, Math.min(window.innerWidth - captionWidth - 24, scene.x - captionWidth / 2));
          const captionOffset = window.innerWidth < 700 ? 0.29 : 0.39;
          const y = Math.max(8, Math.min(height - 110, scene.y + scene.size * captionOffset));
          const opacity = scene.opacity * scene.captionOpacity;
          caption.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          caption.style.opacity = String(opacity);
          caption.style.visibility = opacity < 0.1 ? "hidden" : "visible";
          if (chapterNav) {
            chapterNav.style.transform = `translate3d(${x}px, ${y + 44}px, 0)`;
            chapterNav.style.opacity = String(opacity);
            chapterNav.style.visibility = opacity > 0.25 && root.dataset.storyZone === "research" ? "visible" : "hidden";
          }
        }
        const form = storytelling ? (scene.morph < 0.5 ? scene.formA : scene.formB) : 0;
        if (form !== currentForm) {
          currentForm = form;
          const label = caption.querySelector("[data-story-caption]");
          if (label) label.textContent = descriptions[form];
          host.setAttribute("aria-label", `Constelación de partículas azules: ${descriptions[form]}`);
        }
        stage.dataset.morph = (scene.formA + (scene.formB - scene.formA) * scene.morph).toFixed(3);
        stage.dataset.x = scene.x.toFixed(1);
        stage.dataset.y = scene.y.toFixed(1);
        stage.dataset.size = scene.size.toFixed(1);
        stage.dataset.pointer = material.uniforms.uPointerInfluence.value.toFixed(2);
      };
      const render = (now: number) => {
        if (disposed || !contextAvailable) return;
        const delta = Math.min((now - last) / 1000, 0.05);
        if (running) elapsed += delta;
        last = now;
        draw(delta);
        if (running) frame = requestAnimationFrame(render);
      };
      const sync = () => {
        const visible = storytelling ? scene.opacity > 0.001 && scene.y + scene.size * 0.6 > 0 && scene.y - scene.size * 0.6 < height : inView;
        const next = contextAvailable && visible && !document.hidden && !preferenceRef.current.paused && !preferenceRef.current.reduced;
        host.dataset.animating = String(next);
        if (next !== running) {
          cancelAnimationFrame(frame);
          running = next;
          last = performance.now();
          if (running) frame = requestAnimationFrame(render);
          else draw();
        } else if (!running) draw();
      };
      const resize = () => {
        if (disposed) return;
        const bounds = host.getBoundingClientRect();
        width = bounds.width; height = bounds.height;
        if (!width || !height) return;
        camera.right = width; camera.top = height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
        if (!storytelling) Object.assign(scene, initialParticleScene(), { x: width / 2, y: height / 2, size: Math.min(width, height) });
        draw();
      };
      const configure = () => {
        const next = !preferenceRef.current.reduced && contextAvailable;
        if (next !== storytelling) {
          endStory();
          storytelling = next;
          if (storytelling) endStory = createScrollStory(root, scene, () => { sync(); });
          else {
            endStory = () => {};
            caption.style.removeProperty("transform");
            caption.style.removeProperty("opacity");
            caption.style.removeProperty("visibility");
            chapterNav?.style.removeProperty("transform");
            chapterNav?.style.removeProperty("opacity");
            chapterNav?.style.removeProperty("visibility");
            material.uniforms.uPointerInfluence.value = 0;
            material.uniforms.uEnergy.value = 0;
          }
          resize();
        }
        sync();
      };
      let shaderFailed = false;
      renderer.debug.onShaderError = () => {
        if (shaderFailed) return;
        shaderFailed = true;
        queueMicrotask(() => {
          if (disposed) return;
          contextAvailable = false;
          configure();
          setReady(false);
        });
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);
      const intersection = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; sync(); }, { threshold: 0.01 });
      intersection.observe(host);
      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse" || preferenceRef.current.reduced || preferenceRef.current.paused) return;
        cursor.set(event.clientX, event.clientY);
        hasPointer = true;
      };
      const onPointerLeave = () => { hasPointer = false; };
      const onLost = (event: Event) => { event.preventDefault(); contextAvailable = false; configure(); setReady(false); };
      const onRestored = () => { contextAvailable = true; configure(); setReady(true); };
      window.addEventListener("pointermove", onPointer, { passive: true });
      document.documentElement.addEventListener("pointerleave", onPointerLeave);
      window.addEventListener("blur", onPointerLeave);
      renderer.domElement.addEventListener("webglcontextlost", onLost);
      renderer.domElement.addEventListener("webglcontextrestored", onRestored);
      document.addEventListener("visibilitychange", sync);
      controllerRef.current = { update: configure };
      release = () => {
        controllerRef.current = null;
        cancelAnimationFrame(frame);
        endStory();
        observer.disconnect(); intersection.disconnect();
        window.removeEventListener("pointermove", onPointer);
        document.documentElement.removeEventListener("pointerleave", onPointerLeave);
        window.removeEventListener("blur", onPointerLeave);
        document.removeEventListener("visibilitychange", sync);
        renderer.domElement.removeEventListener("webglcontextlost", onLost);
        renderer.domElement.removeEventListener("webglcontextrestored", onRestored);
        geometry.dispose(); material.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
      resize(); configure(); draw();
      setReady(true);
    })().catch(() => { release(); if (!disposed) setReady(false); });
    return () => { disposed = true; abort.abort(); release(); };
  }, []);

  return (
    <div ref={stageRef} className="alfa-constellation" data-ready={ready}>
      <div ref={hostRef} className="alfa-constellation-canvas" role="img" aria-label="Constelación de partículas azules que forma el isotipo de AlfaCode">
        <AlfaCodeSymbol className="alfa-constellation-fallback" />
      </div>
      <div ref={captionRef} className="alfa-constellation-caption"><span data-story-caption>AlfaCode. Una idea conecta todo.</span>
        {reduced ? <span>Movimiento reducido</span> : ready && <button type="button" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Reanudar constelación" : "Pausar constelación"} aria-pressed={paused} title="Pausa el movimiento ambiental; las transformaciones siguen tu scroll">
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}<span>{paused ? "Reanudar" : "Pausar"}</span>
        </button>}
      </div>
    </div>
  );
}
