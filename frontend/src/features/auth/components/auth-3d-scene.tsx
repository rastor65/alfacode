"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { create3DAlfaCodeLogo } from "./alfacode-3d-logo";

/**
 * Escena 3D WebGL con el logotipo oficial tridimensional de AlfaCode:
 * - Geometría extruida con biseles a partir de los trazos vectoriales originales.
 * - Materiales reflectivos duales: cian metalizado (#0382a1) y cian luminiscente (#94eefe).
 * - Anillo orbital holográfico y aura estelar sutil (sin telarañas caóticas).
 * - Reactivo al movimiento del cursor mediante interpolación suave (damping).
 * - Compatible con prefers-reduced-motion y pausa en pestañas en segundo plano.
 */
export function Auth3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Escena, Cámara y Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Luces de estudio para resaltar los biseles metálicos del logo
    const ambientLight = new THREE.AmbientLight(0x0a1c2e, 2.5);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
    keyLight.position.set(5, 5, 8);
    scene.add(keyLight);

    const cyanPointLight = new THREE.PointLight(0x00e5ff, 6, 25);
    cyanPointLight.position.set(-3, 3, 5);
    scene.add(cyanPointLight);

    const rimPointLight = new THREE.PointLight(0x0382a1, 5, 20);
    rimPointLight.position.set(0, -3, -3);
    scene.add(rimPointLight);

    // 3. Grupo Principal del Logotipo 3D Oficial
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    try {
      const logoMeshGroup = create3DAlfaCodeLogo();
      logoGroup.add(logoMeshGroup);
    } catch (err) {
      console.error("Error al instanciar el logotipo 3D:", err);
    }

    // 4. Anillo Orbital Holográfico y Aura Estelar
    const orbitRingGeometry = new THREE.TorusGeometry(3.6, 0.02, 16, 120);
    const orbitRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
    orbitRing.rotation.x = Math.PI / 3.5;
    orbitRing.rotation.y = Math.PI / 6;
    logoGroup.add(orbitRing);

    // 4.1. Aura de partículas suaves (sin líneas de telaraña)
    const particleCount = 70;
    const particlePositions = new Float32Array(particleCount * 3);
    const spread = 7;

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * spread;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * spread * 0.8;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * spread * 0.6;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));

    // Textura de partículas suave
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, "rgba(225, 254, 255, 1)");
      gradient.addColorStop(0.4, "rgba(103, 232, 249, 0.7)");
      gradient.addColorStop(1, "rgba(3, 130, 161, 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(16, 16, 16, 0, Math.PI * 2);
      ctx.fill();
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMaterial = new THREE.PointsMaterial({
      color: 0x94eefe,
      size: 0.22,
      map: particleTexture,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // 5. Interacción del Cursor (Parallax con Amortiguación)
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (event: MouseEvent) => {
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
      if (isTabVisible) clock.getDelta();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Suavizado del cursor
      const motionScale = prefersReducedMotion ? 0.1 : 1;
      targetX += (mouseX * 0.4 * motionScale - targetX) * 0.04;
      targetY += (mouseY * 0.3 * motionScale - targetY) * 0.04;

      // Rotación suave del logo
      const rotSpeed = prefersReducedMotion ? 0.08 : 0.35;
      logoGroup.rotation.y += rotSpeed * delta;

      // Flotación armónica y reacción al cursor
      logoGroup.position.y = Math.sin(elapsed * 1.6) * 0.12;
      logoGroup.rotation.x = -targetY * 0.5 + Math.sin(elapsed * 0.8) * 0.05;
      logoGroup.rotation.z = targetX * 0.2;

      // Rotación sutil del anillo
      orbitRing.rotation.z += 0.25 * delta;

      // Rotación sutil de las partículas de fondo
      particles.rotation.y = elapsed * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // 8. Limpieza estricta de recursos
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      resizeObserver.disconnect();

      orbitRingGeometry.dispose();
      orbitRingMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      particleTexture.dispose();

      // Recorrer y liberar geometrías y materiales del logo
      logoGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });

      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative size-full flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    />
  );
}
