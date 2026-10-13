"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { useTheme } from "@/components/theme/theme-provider";
import { create3DAlfaCodeLogo } from "./alfacode-3d-logo";

function subscribeSystemTheme(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getSystemThemeSnapshot() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemThemeServerSnapshot() {
  return true;
}

/**
 * Escena 3D WebGL con el logotipo oficial tridimensional de AlfaCode:
 * - Geometría extruida con biseles a partir de los trazos vectoriales originales.
 * - Iluminación y materiales PBR adaptativos para modo claro y oscuro.
 * - Anillo orbital holográfico y aura estelar sutil.
 * - Reactivo al movimiento del cursor mediante interpolación suave (damping).
 * - Compatible con prefers-reduced-motion y selector de tema en tiempo real.
 */
export function Auth3DScene() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const systemIsDark = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemThemeSnapshot,
    getSystemThemeServerSnapshot,
  );

  const isLight = theme === "light" || (theme === "system" && !systemIsDark);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = container.clientWidth;
    let height = container.clientHeight;

    // 1. Escena, Cámara y Renderer
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isLight ? 0.92 : 1.08;
    container.appendChild(renderer.domElement);

    // 1.1 Entorno de iluminación física (Softbox Studio Reflection Map)
    // Garantiza que los biseles PBR reflejen luz de estudio con tinte azul/cian suave, eliminando facetas grises
    const envCanvas = document.createElement("canvas");
    envCanvas.width = 128;
    envCanvas.height = 64;
    const envCtx = envCanvas.getContext("2d");
    if (envCtx) {
      const envGrad = envCtx.createLinearGradient(0, 0, 0, 64);
      if (isLight) {
        envGrad.addColorStop(0, "#bae6fd");
        envGrad.addColorStop(0.35, "#e0f2fe");
        envGrad.addColorStop(0.7, "#f0f9ff");
        envGrad.addColorStop(1, "#cffafe");
      } else {
        envGrad.addColorStop(0, "#083344");
        envGrad.addColorStop(0.35, "#042f2e");
        envGrad.addColorStop(0.7, "#02121e");
        envGrad.addColorStop(1, "#01080e");
      }
      envCtx.fillStyle = envGrad;
      envCtx.fillRect(0, 0, 128, 64);

      // Softbox cenital celeste para reflejos lúcidos y saturados
      const softbox = envCtx.createRadialGradient(64, 16, 0, 64, 16, 32);
      softbox.addColorStop(0, isLight ? "rgba(56, 189, 248, 0.45)" : "rgba(34, 211, 238, 0.5)");
      softbox.addColorStop(1, "rgba(255, 255, 255, 0)");
      envCtx.fillStyle = softbox;
      envCtx.fillRect(0, 0, 128, 64);
    }
    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = envTexture;

    // 2. Luces de estudio cinematográficas calibradas para realzar el azul profundo y cian del isotipo
    const ambientLight = new THREE.AmbientLight(isLight ? 0xdbeafe : 0x071e2e, isLight ? 0.45 : 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xf8fafc, isLight ? 1.25 : 3.0);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(isLight ? 0x0284c7 : 0x00e5ff, isLight ? 0.85 : 3.2);
    fillLight.position.set(-5, 2, 4);
    scene.add(fillLight);

    const cyanPointLight = new THREE.PointLight(isLight ? 0x0284c7 : 0x38bdf8, isLight ? 1.4 : 5.0, 30);
    cyanPointLight.position.set(-3, 3, 5);
    scene.add(cyanPointLight);

    const bottomGlowLight = new THREE.PointLight(0x0382a1, isLight ? 1.2 : 4.5, 20);
    bottomGlowLight.position.set(0, -3.5, 2);
    scene.add(bottomGlowLight);

    // 3. Grupo Principal del Logotipo 3D Oficial
    const logoGroup = new THREE.Group();
    scene.add(logoGroup);

    try {
      const logoMeshGroup = create3DAlfaCodeLogo({ isLight });
      logoGroup.add(logoMeshGroup);
    } catch (err) {
      console.error("Error al instanciar el logotipo 3D:", err);
    }

    // 4. Anillos Giroscópicos Holográficos PBR de Alta Definición y Balizas Satelitales Duales
    const orbitRingGeometry = new THREE.TorusGeometry(3.0, isLight ? 0.018 : 0.022, 16, 120);
    const orbitRingMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0x0284c7 : 0x38bdf8,
      roughness: 0.2,
      metalness: 0.85,
      emissive: isLight ? 0x0369a1 : 0x0ea5e9,
      emissiveIntensity: isLight ? 0.25 : 0.65,
      transparent: true,
      opacity: isLight ? 0.55 : 0.75,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeometry, orbitRingMaterial);
    orbitRing.rotation.x = Math.PI / 3.2;
    orbitRing.rotation.y = Math.PI / 6;
    logoGroup.add(orbitRing);

    // Anillo exterior de contrapunto holográfico con radio optimizado para cero recorte lateral
    const outerRingGeometry = new THREE.TorusGeometry(3.65, isLight ? 0.013 : 0.017, 16, 140);
    const outerRingMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0x0369a1 : 0x06b6d4,
      roughness: 0.25,
      metalness: 0.8,
      emissive: isLight ? 0x0284c7 : 0x0891b2,
      emissiveIntensity: isLight ? 0.20 : 0.45,
      transparent: true,
      opacity: isLight ? 0.45 : 0.6,
    });
    const outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
    outerRing.rotation.x = -Math.PI / 2.8;
    outerRing.rotation.z = Math.PI / 4;
    logoGroup.add(outerRing);

    // Balizas satelitales orbitales duales
    const beaconGeometry = new THREE.SphereGeometry(isLight ? 0.05 : 0.065, 16, 16);
    const beaconMaterial = new THREE.MeshStandardMaterial({
      color: isLight ? 0x38bdf8 : 0xe0f2fe,
      emissive: isLight ? 0x0284c7 : 0x22d3ee,
      emissiveIntensity: 0.85,
      roughness: 0.1,
      metalness: 0.9,
    });
    const beacon1 = new THREE.Mesh(beaconGeometry, beaconMaterial);
    const beacon2 = new THREE.Mesh(beaconGeometry, beaconMaterial);
    logoGroup.add(beacon1);
    logoGroup.add(beacon2);

    // 4.1. Campo estelar de partículas sutiles (limpio e invisible en modo claro para máxima pureza visual)
    const particleCount = isLight ? 0 : 75;
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
      opacity: isLight ? 0 : 0.65,
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
    let lastTime = performance.now();
    let elapsed = 0;
    let isTabVisible = !document.hidden;

    const onVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return;

      const now = performance.now();
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      elapsed += delta;

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

      // Movimiento orbital de las balizas luminosas duales
      const beaconAngle = elapsed * 1.1;
      beacon1.position.x = Math.cos(beaconAngle) * 3.0;
      beacon1.position.z = Math.sin(beaconAngle) * 3.0;
      beacon1.position.y = Math.sin(beaconAngle * 2) * 0.4;

      beacon2.position.x = Math.cos(beaconAngle + Math.PI) * 3.0;
      beacon2.position.z = Math.sin(beaconAngle + Math.PI) * 3.0;
      beacon2.position.y = -Math.sin(beaconAngle * 2) * 0.4;

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
      envTexture.dispose();

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
  }, [isLight]);

  return (
    <div
      ref={containerRef}
      className="relative size-full flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    />
  );
}
