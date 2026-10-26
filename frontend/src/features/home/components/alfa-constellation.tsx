"use client";

import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
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
  attribute vec3 aColor;
  attribute float aSeed;
  attribute float aSize;
  attribute float aAlpha;
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
  vec3 form(float index) {
    if (index < 0.5) return aLogo;
    if (index < 1.5) return aBrain;
    if (index < 2.5) return aSoftware;
    if (index < 3.5) return aAi;
    if (index < 4.5) return aIot;
    return aResearch;
  }
  void main() {
    vec3 p = mix(form(uFormA), form(uFormB), uMorph);
    float transition = sin(uMorph * 3.14159);
    vec3 scatter = vec3(sin(aSeed * 113.0), cos(aSeed * 67.0), sin(aSeed * 91.0));
    p += scatter * (transition * 0.65 + uSpread * 0.32);
    float cortex = (1.0 - step(0.1, abs(uFormA - 1.0))) * (1.0 - uMorph) + (1.0 - step(0.1, abs(uFormB - 1.0))) * uMorph;
    float turn = cortex * 0.2 + uRotation.y + sin(uTime * 0.12) * 0.055;
    p.yz = mat2(cos(uRotation.x), -sin(uRotation.x), sin(uRotation.x), cos(uRotation.x)) * p.yz;
    p.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * p.xz;
    p.xy = mat2(cos(uRotation.z), -sin(uRotation.z), sin(uRotation.z), cos(uRotation.z)) * p.xy;
    p.xy += vec2(sin(uTime * 0.24 + aSeed * 71.0), cos(uTime * 0.18 + aSeed * 43.0)) * 0.025;
    p.x += sin(aSeed * 71.0 + p.y * 2.0) * uEnergy * 0.1;
    vec2 cursorDelta = p.xy - uPointer;
    float influence = exp(-dot(cursorDelta, cursorDelta) * 1.1) * uPointerInfluence;
    p.xy += normalize(cursorDelta + vec2(0.001)) * influence * 0.36;
    p.z += influence * 0.35;
    float perspective = 1.0 / max(0.7, 1.0 - p.z * 0.075);
    p.xy *= perspective;
    vec4 viewPosition = modelViewMatrix * vec4(p * uScale, 1.0);
    viewPosition.xy += uCenter;
    float angle = aSeed * 6.28318 + uTime * 0.018;
    vec2 glyph = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * position.xy;
    glyph.y *= 1.0 + abs(uEnergy) * 0.4;
    viewPosition.xy += glyph * aSize * uScale * perspective;
    gl_Position = projectionMatrix * viewPosition;
    vBarycentric = aBarycentric;
    vColor = aColor * (0.65 + 0.35 * smoothstep(-1.5, 1.5, p.z));
    vAlpha = aAlpha * uOpacity * (0.86 + 0.14 * sin(uTime * 0.6 + aSeed * 91.0));
  }
`;
const FRAGMENT = `
  varying vec3 vBarycentric;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float distanceToEdge = min(vBarycentric.x, min(vBarycentric.y, vBarycentric.z));
    float edge = 1.0 - smoothstep(0.0, fwidth(distanceToEdge) * 1.15, distanceToEdge);
    float alpha = edge * vAlpha;
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
      const count = window.matchMedia("(max-width: 700px)").matches ? 3400 : 7400;
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
      geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(particles.seeds, 1));
      geometry.setAttribute("aSize", new THREE.InstancedBufferAttribute(particles.sizes, 1));
      geometry.setAttribute("aAlpha", new THREE.InstancedBufferAttribute(particles.alphas, 1));
      const colors = new Float32Array(count * 3);
      const palette = ["#0382a1", "#049ebf", "#469eb4", "#94eefe", "#e1feff"].map((color) => new THREE.Color(color));
      for (let i = 0; i < count; i++) {
        const color = palette[Math.floor(particles.seeds[i] * palette.length)];
        colors.set([color.r, color.g, color.b], i * 3);
      }
      geometry.setAttribute("aColor", new THREE.InstancedBufferAttribute(colors, 3));
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
          const y = Math.max(8, Math.min(height - 110, scene.y + scene.size * 0.39));
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
