"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Escena 3D WebGL de grado cinematográfico para el portal de acceso de AlfaCode HUB.
 * Renderiza un núcleo cuántico holográfico (geometría poliedral dual + anillos orbitales)
 * rodeado de una constelación neuronal de partículas y sinapsis dinámicas que reaccionan
 * suavemente al movimiento del cursor mediante interpolación física (damping).
 *
 * Optimizaciones:
 * - Detección de prefers-reduced-motion.
 * - Pausa del render loop en pestañas inactivas (Page Visibility API).
 * - Pixel ratio limitado a Math.min(devicePixelRatio, 2) para proteger GPUs móviles.
 * - Limpieza estricta de geometrías, materiales y texturas al desmontar.
 */
export function Auth3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Respetar preferencias de accesibilidad del sistema
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Dimensiones
    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Escena, Cámara y Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050b14, 0.045);

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.set(0, 0, 11);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Luces
    const ambientLight = new THREE.AmbientLight(0x061826, 3.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x22d3ee, 8, 30);
    pointLight.position.set(2, 3, 5);
    scene.add(pointLight);

    const secondaryLight = new THREE.PointLight(0x0382a1, 5, 25);
    secondaryLight.position.set(-3, -2, 4);
    scene.add(secondaryLight);

    // 3. Grupo Central (Núcleo Cuántico AlfaCode)
    const coreGroup = new THREE.Group();
    scene.add(coreGroup);

    // 3.1. Núcleo Interno (Octaedro facetado con material estándar reflectivo)
    const innerGeometry = new THREE.OctahedronGeometry(1.6, 0);
    const innerMaterial = new THREE.MeshStandardMaterial({
      color: 0x0382a1,
      emissive: 0x003d52,
      roughness: 0.15,
      metalness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.88,
    });
    const innerCore = new THREE.Mesh(innerGeometry, innerMaterial);
    coreGroup.add(innerCore);

    // 3.2. Jaula Holográfica Externa (Icosaedro wireframe flotante)
    const cageGeometry = new THREE.IcosahedronGeometry(2.4, 1);
    const cageMaterial = new THREE.MeshBasicMaterial({
      color: 0x67e8f9,
      wireframe: true,
      transparent: true,
      opacity: 0.32,
    });
    const outerCage = new THREE.Mesh(cageGeometry, cageMaterial);
    coreGroup.add(outerCage);

    // 3.3. Anillos Giroscópicos Orbitales (Torus)
    const ring1Geometry = new THREE.TorusGeometry(3.3, 0.025, 16, 120);
    const ring1Material = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
    });
    const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    coreGroup.add(ring1);

    const ring2Geometry = new THREE.TorusGeometry(2.9, 0.02, 16, 120);
    const ring2Material = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.45,
    });
    const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    coreGroup.add(ring2);

    // 4. Constelación Neuronal (Nodos + Conexiones Dinámicas)
    const particleCount = width < 768 ? 90 : 160;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities: THREE.Vector3[] = [];
    const spread = 9;

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * spread * 1.5;
      const y = (Math.random() - 0.5) * spread;
      const z = (Math.random() - 0.5) * spread * 0.8;

      particlePositions[i * 3] = x;
      particlePositions[i * 3 + 1] = y;
      particlePositions[i * 3 + 2] = z;

      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.006,
          (Math.random() - 0.5) * 0.004,
        ),
      );
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    // Textura circular suave generada por Canvas
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      gradient.addColorStop(0, "rgba(225, 254, 255, 1)");
      gradient.addColorStop(0.3, "rgba(103, 232, 249, 0.8)");
      gradient.addColorStop(0.7, "rgba(3, 130, 161, 0.2)");
      gradient.addColorStop(1, "rgba(3, 130, 161, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(32, 32, 32, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xa5f3fc,
      size: 0.28,
      map: particleTexture,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 4.1. Líneas de Conexión Neuronal (Synapses)
    const maxConnections = particleCount * 4;
    const linePositions = new Float32Array(maxConnections * 6);
    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", new THREE.BufferAttribute(linePositions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x0382a1,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // 5. Interacción del Cursor (Parallax con Inercia)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (event: MouseEvent) => {
      // Normalizar coordenadas (-1 a 1)
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      mouseX = (x / rect.width) * 2 - 1;
      mouseY = -(y / rect.height) * 2 + 1;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    // 6. Resize Observer
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);

    // 7. Loop de Animación
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let isTabVisible = !document.hidden;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        clock.getDelta(); // reset delta
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const connectionDistance = 2.4;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Suavizado del cursor (damping)
      const motionScale = prefersReducedMotion ? 0.15 : 1;
      targetX += (mouseX * 0.45 * motionScale - targetX) * 0.04;
      targetY += (mouseY * 0.35 * motionScale - targetY) * 0.04;

      // Rotaciones de la estructura central
      const rotSpeed = prefersReducedMotion ? 0.1 : 1;
      innerCore.rotation.x += 0.25 * delta * rotSpeed;
      innerCore.rotation.y += 0.4 * delta * rotSpeed;

      outerCage.rotation.x -= 0.15 * delta * rotSpeed;
      outerCage.rotation.y -= 0.2 * delta * rotSpeed;

      ring1.rotation.z += 0.35 * delta * rotSpeed;
      ring2.rotation.z -= 0.4 * delta * rotSpeed;

      // Inclinación de la escena por cursor
      coreGroup.rotation.y = targetX * 0.8 + Math.sin(elapsed * 0.5) * 0.1;
      coreGroup.rotation.x = -targetY * 0.6 + Math.cos(elapsed * 0.4) * 0.08;

      // Pulsación lumínica sutil
      pointLight.intensity = 7 + Math.sin(elapsed * 2) * 2;

      // Movimiento de partículas
      const positions = particleGeometry.attributes.position.array as Float32Array;
      const lPositions = lineGeometry.attributes.position.array as Float32Array;
      let lineIndex = 0;

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        const v = particleVelocities[i];

        if (!prefersReducedMotion) {
          positions[i3] += v.x;
          positions[i3 + 1] += v.y;
          positions[i3 + 2] += v.z;

          // Rebotar o envolver suavemente en los límites
          if (Math.abs(positions[i3]) > spread * 0.75) v.x *= -1;
          if (Math.abs(positions[i3 + 1]) > spread * 0.55) v.y *= -1;
          if (Math.abs(positions[i3 + 2]) > spread * 0.45) v.z *= -1;
        }

        // Conectar con nodos cercanos para formar la red
        for (let j = i + 1; j < particleCount; j++) {
          const j3 = j * 3;
          const dx = positions[i3] - positions[j3];
          const dy = positions[i3 + 1] - positions[j3 + 1];
          const dz = positions[i3 + 2] - positions[j3 + 2];
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < connectionDistance * connectionDistance && lineIndex < maxConnections * 6 - 6) {
            lPositions[lineIndex++] = positions[i3];
            lPositions[lineIndex++] = positions[i3 + 1];
            lPositions[lineIndex++] = positions[i3 + 2];

            lPositions[lineIndex++] = positions[j3];
            lPositions[lineIndex++] = positions[j3 + 1];
            lPositions[lineIndex++] = positions[j3 + 2];
          }
        }
      }

      particleGeometry.attributes.position.needsUpdate = true;

      // Limpiar el resto del buffer de líneas
      for (let k = lineIndex; k < linePositions.length; k++) {
        lPositions[k] = 0;
      }
      lineGeometry.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Limpieza estricta
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();

      innerGeometry.dispose();
      innerMaterial.dispose();
      cageGeometry.dispose();
      cageMaterial.dispose();
      ring1Geometry.dispose();
      ring1Material.dispose();
      ring2Geometry.dispose();
      ring2Material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
