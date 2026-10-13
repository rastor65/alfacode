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
    camera.position.set(0, 0, 9.4);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    // 2. Luces de estudio cinematográficas para resaltar el clearcoat y biseles PBR
    const ambientLight = new THREE.AmbientLight(0x071e2e, 3.0);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 4.5);
    keyLight.position.set(5, 6, 8);
    scene.add(keyLight);

    const rimDirectionalLight = new THREE.DirectionalLight(0x00e5ff, 4.0);
    rimDirectionalLight.position.set(-5, 3, -5);
    scene.add(rimDirectionalLight);

    const cyanPointLight = new THREE.PointLight(0x38bdf8, 7, 30);
    cyanPointLight.position.set(-3, 3, 5);
    scene.add(cyanPointLight);

    const bottomGlowLight = new THREE.PointLight(0x0382a1, 6, 20);
    bottomGlowLight.position.set(0, -3.5, 2);
    scene.add(bottomGlowLight);

    // 3. Grupo Principal del Logotipo 3D Oficial
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    try {
      const logoMeshGroup = create3DAlfaCodeLogo();
      logoGroup.add(logoMeshGroup);
    } catch (err) {
      console.error("Error al instanciar el logotipo 3D:", err);
    }

    // 4. Anillos Giroscópicos Holográficos Duales y Baliza Orbital
    const orbitRingGeometry = new THREE.TorusGeometry(3.9, 0.02, 16, 120);
    const orbitRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.42,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
    orbitRing.rotation.x = Math.PI / 3.2;
    orbitRing.rotation.y = Math.PI / 6;
    logoGroup.add(orbitRing);

    // Anillo exterior de contrapunto holográfico
    const outerRingGeometry = new THREE.TorusGeometry(4.8, 0.012, 16, 140);
    const outerRingMaterial = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.22,
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.rotation.x = -Math.PI / 2.8;
    outerRing.rotation.z = Math.PI / 4;
    logoGroup.add(outerRing);

    // Baliza orbital luminosa
    const beaconGeometry = new THREE.SphereGeometry(0.065, 16, 16);
    const beaconMaterial = new THREE.MeshBasicMaterial({
      color: 0xe0f2fe,
    });
    const beacon = new THREE.Mesh(beaconGeometry, beaconMaterial);
    logoGroup.add(beacon);

    // 4.1. Campo estelar de partículas sutiles
    const particleCount = 75;
    const particlePositions = new Float32Array(particleCount * 3);
    const spread = 8;

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
      opacity: 0.65,
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

      // Suavizado del cursor (amortiguación progresiva)
      const motionScale = prefersReducedMotion ? 0.1 : 1;
      targetX += (mouseX * 0.5 * motionScale - targetX) * 0.05;
      targetY += (mouseY * 0.4 * motionScale - targetY) * 0.05;

      // Oscilación armónica orgánica del logotipo (siempre de frente, sin invertirse)
      const swayY = Math.sin(elapsed * 0.75) * 0.22;
      const swayX = Math.cos(elapsed * 0.6) * 0.08;

      logoGroup.position.y = Math.sin(elapsed * 1.4) * 0.16;
      logoGroup.rotation.y = swayY + targetX * 0.45;
      logoGroup.rotation.x = -0.04 + swayX - targetY * 0.35;
      logoGroup.rotation.z = targetX * 0.12;

      // Rotación suave de los anillos orbitales
      orbitRing.rotation.z += 0.22 * delta;
      outerRing.rotation.z -= 0.16 * delta;

      // Movimiento orbital de la baliza luminosa
      const beaconAngle = elapsed * 1.1;
      beacon.position.x = Math.cos(beaconAngle) * 3.9;
      beacon.position.z = Math.sin(beaconAngle) * 3.9;
      beacon.position.y = Math.sin(beaconAngle * 2) * 0.45;

      // Luz puntual dinámica que hace deslizar brillos metálicos sobre los biseles
      cyanPointLight.position.x = Math.sin(elapsed * 0.8) * 3.5 - 1.5;
      cyanPointLight.position.y = Math.cos(elapsed * 0.6) * 2 + 2.5;

      // Rotación sutil del campo estelar
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
      outerRingGeometry.dispose();
      outerRingMaterial.dispose();
      beaconGeometry.dispose();
      beaconMaterial.dispose();
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
