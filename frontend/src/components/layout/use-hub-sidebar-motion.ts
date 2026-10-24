"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const EASE = "hub-out";
const DURATION = 0.3;

/**
 * Hook de animación cuántica y cinemática para la transición Aside -> Contenido.
 * Implementa una arquitectura visual completa inspirada en interfaces holográficas de alta fidelidad:
 * 1. Nodo emisor de fotones en el borde del enlace activo (Spark + Ring pulse).
 * 2. Haz láser de alta velocidad con núcleo hiperbrillante y aura difusa (Laser Waveguide).
 * 3. Cono de iluminación volumétrica ambiental que baña el lienzo del contenido.
 * 4. Píldora activa deslizante con estiramiento elástico en el aside.
 * 5. Reacción lumínica en la red de circuitos SVG del aside.
 * 6. Síntesis direccional del contenido con enfoque óptico dinámico (Blur-to-Clear).
 * 7. Escaneo holográfico superficial (Sheen) y micro-stagger en cascada.
 * 8. Respeto absoluto de accesibilidad (prefers-reduced-motion).
 */
export function useHubSidebarMotion(sidebarCollapsed = false) {
  const pathname = usePathname();
  const sidebarContainerRef = useRef<HTMLElement | null>(null);
  const sidebarDeckRef = useRef<HTMLDivElement | null>(null);
  const navListRef = useRef<HTMLUListElement | null>(null);
  const activePillRef = useRef<HTMLSpanElement | null>(null);
  const emitterRef = useRef<HTMLDivElement | null>(null);
  const beamRef = useRef<HTMLDivElement | null>(null);
  const ambientConeRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousPathRef = useRef<string>(pathname);
  const isFirstRender = useRef(true);

  // Registro del ease CustomEase optimizado para interfaces cinemáticas
  useEffect(() => {
    gsap.registerPlugin(CustomEase);
    try {
      CustomEase.create(EASE, "0.23,1,0.32,1");
    } catch {
      // Ya registrado previamente
    }
  }, []);

  // Sincroniza la posición de la píldora activa con estiramiento elástico y ancho dinámico
  const syncActivePill = useCallback((instant = false) => {
    const list = navListRef.current;
    const pill = activePillRef.current;
    if (!list || !pill) return;

    const activeItem = list.querySelector<HTMLElement>(".hub-sidebar-item-active");
    if (!activeItem || activeItem.offsetParent === null) {
      gsap.to(pill, { opacity: 0, duration: 0.15, overwrite: true });
      return;
    }

    const offsetParentIsList = activeItem.offsetParent === list;
    const itemTop = activeItem.offsetTop + (offsetParentIsList ? list.offsetTop : 0);
    const itemLeft = activeItem.offsetLeft + (offsetParentIsList ? list.offsetLeft : 0);
    const itemHeight = activeItem.offsetHeight;
    const itemWidth = activeItem.offsetWidth;

    if (itemWidth === 0 || itemHeight === 0) {
      return;
    }

    if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.killTweensOf(pill);
      gsap.set(pill, {
        y: itemTop,
        x: itemLeft,
        width: itemWidth,
        height: itemHeight,
        opacity: 1,
      });
      return;
    }

    const currentTop = (gsap.getProperty(pill, "y") as number) || itemTop;
    const distance = Math.abs(itemTop - currentTop);

    gsap.killTweensOf(pill);

    // Si hay una distancia apreciable entre items, aplica micro-estiramiento táctil (Squash & Stretch)
    if (distance > 24) {
      const isMovingDown = itemTop > currentTop;
      const stretch = Math.min(8, Math.round(distance * 0.08));
      const tl = gsap.timeline({ defaults: { ease: EASE, overwrite: true } });
      tl.to(pill, {
        y: isMovingDown ? currentTop + distance * 0.45 : itemTop + stretch,
        height: itemHeight + stretch,
        x: itemLeft,
        width: itemWidth,
        duration: 0.12,
        opacity: 1,
      }).to(pill, {
        y: itemTop,
        height: itemHeight,
        x: itemLeft,
        width: itemWidth,
        duration: 0.16,
        ease: EASE,
      });
    } else {
      gsap.to(pill, {
        y: itemTop,
        x: itemLeft,
        width: itemWidth,
        height: itemHeight,
        opacity: 1,
        duration: 0.22,
        ease: EASE,
        overwrite: true,
      });
    }
  }, []);

  // Dispara el sistema integral de animación cuántica Aside -> Contenido
  const triggerTransition = useCallback(() => {
    const content = contentRef.current;
    const list = navListRef.current;
    const emitter = emitterRef.current;
    const beam = beamRef.current;
    const cone = ambientConeRef.current;
    const sheen = sheenRef.current;
    const sidebar = sidebarContainerRef.current || sidebarDeckRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      if (content) {
        gsap.killTweensOf(content);
        gsap.fromTo(content, { opacity: 0.4 }, { opacity: 1, duration: 0.16, ease: "power1.out", clearProps: "all" });
      }
      return;
    }

    // 1. Detección visual y física milimétrica de la altura del enlace activo
    let relativeY = 80;
    if (list && sidebar) {
      const activeItem = list.querySelector<HTMLElement>(".hub-sidebar-item-active");
      if (activeItem) {
        const itemRect = activeItem.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();
        relativeY = itemRect.top - sidebarRect.top + itemRect.height / 2;

        // Pulso electromagnético en la red de circuitos SVG del aside
        const svg = sidebar.querySelector<SVGElement>(".hub-sidebar-network");
        if (svg) {
          svg.classList.add("hub-network-active");
          setTimeout(() => svg.classList.remove("hub-network-active"), 360);
        }
      }
    }

    // 2. Chispazo cuántico del emisor (Spark flare + Ring expansion)
    if (emitter) {
      gsap.killTweensOf(emitter);
      gsap.set(emitter, { top: relativeY, opacity: 1 });
      const spark = emitter.querySelector(".hub-motion-emitter-spark");
      const ring = emitter.querySelector(".hub-motion-emitter-ring");

      if (spark) {
        gsap.killTweensOf(spark);
        gsap.fromTo(
          spark,
          { scale: 0.2, opacity: 1 },
          { scale: 2.2, opacity: 0, duration: 0.32, ease: EASE, clearProps: "transform" }
        );
      }
      if (ring) {
        gsap.killTweensOf(ring);
        gsap.fromTo(
          ring,
          { scale: 0.25, opacity: 1 },
          { scale: 3.0, opacity: 0, duration: 0.40, ease: "power2.out", clearProps: "transform" }
        );
      }
    }

    // 3. Proyección del Haz Láser de alta velocidad (Laser Waveguide)
    if (beam) {
      gsap.killTweensOf(beam);
      gsap.set(beam, { top: relativeY, opacity: 1, scaleX: 0.1, x: 0 });
      gsap.fromTo(
        beam,
        { scaleX: 0.1, x: 0, opacity: 1 },
        { scaleX: 1.35, x: 180, opacity: 0, duration: 0.38, ease: EASE, overwrite: true }
      );
    }

    // 4. Cono de iluminación volumétrica ambiental proyectado sobre el contenido
    if (cone) {
      gsap.killTweensOf(cone);
      gsap.set(cone, { top: relativeY, opacity: 0, scaleX: 0.4, scaleY: 0.4 });
      gsap.fromTo(
        cone,
        { opacity: 0.85, scaleX: 0.4, scaleY: 0.4 },
        { opacity: 0, scaleX: 1.35, scaleY: 1.25, duration: 0.46, ease: "power2.out", overwrite: true }
      );
    }

    // 5. Escaneo holográfico superficial en el contenido (Sheen Scanline)
    if (sheen) {
      gsap.killTweensOf(sheen);
      gsap.fromTo(
        sheen,
        { xPercent: -100, opacity: 0.85 },
        { xPercent: 240, opacity: 0, duration: 0.48, ease: "power2.out", overwrite: true }
      );
    }

    // 6. Síntesis y revelado dimensional del contenido con Blur-to-Clear
    if (content) {
      gsap.killTweensOf(content);
      gsap.fromTo(
        content,
        {
          opacity: 0.15,
          x: -24,
          filter: "blur(8px)",
          scale: 0.993,
          transformOrigin: "left center",
        },
        {
          opacity: 1,
          x: 0,
          filter: "blur(0px)",
          scale: 1,
          duration: DURATION,
          ease: EASE,
          clearProps: "all",
        }
      );

      // Micro-stagger orquestado en los elementos directos del contenido
      const firstContainer = content.firstElementChild as HTMLElement | null;
      const targetElements = (firstContainer && firstContainer.children.length > 0
        ? Array.from(firstContainer.children)
        : Array.from(content.children)
      )
        .filter((el) => !el.classList.contains("hub-content-sheen"))
        .slice(0, 5) as HTMLElement[];

      if (targetElements.length > 0) {
        gsap.killTweensOf(targetElements);
        gsap.fromTo(
          targetElements,
          { opacity: 0, y: 10, filter: "blur(4px)" },
          {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: 0.28,
            ease: EASE,
            stagger: 0.034,
            delay: 0.03,
            clearProps: "all",
          }
        );
      }
    }
  }, []);

  // Observa cambios en pathname para ejecutar la transición
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      syncActivePill(true);
      return;
    }

    if (previousPathRef.current !== pathname) {
      previousPathRef.current = pathname;
      requestAnimationFrame(() => {
        syncActivePill();
        triggerTransition();
      });
    }
  }, [pathname, syncActivePill, triggerTransition]);

  // Sincroniza píldora en redimensionamiento de pantalla
  useEffect(() => {
    const onResize = () => syncActivePill(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [syncActivePill]);

  // Sincroniza dinámicamente la píldora activa cuando el aside se expande o comprime (en tiempo real durante los 200ms)
  useEffect(() => {
    let animId: number;
    const startTime = performance.now();
    const duration = 260; // Cubre la transición CSS de 200ms con margen de estabilización

    const step = (now: number) => {
      syncActivePill(true);
      if (now - startTime < duration) {
        animId = requestAnimationFrame(step);
      } else {
        syncActivePill(true);
      }
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [sidebarCollapsed, syncActivePill]);

  // Garantiza alineación final exacta cuando concluye la transición CSS de ancho del contenedor
  useEffect(() => {
    const container = sidebarContainerRef.current;
    if (!container) return;

    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === container && e.propertyName === "width") {
        syncActivePill(true);
      }
    };

    container.addEventListener("transitionend", onTransitionEnd);
    return () => container.removeEventListener("transitionend", onTransitionEnd);
  }, [syncActivePill]);

  // Observa cambios dimensionales en la lista de navegación
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const list = navListRef.current;
    if (!list) return;

    const observer = new ResizeObserver(() => {
      syncActivePill(true);
    });

    observer.observe(list);
    return () => observer.disconnect();
  }, [syncActivePill]);

  return {
    sidebarContainerRef,
    sidebarDeckRef,
    navListRef,
    activePillRef,
    emitterRef,
    beamRef,
    ambientConeRef,
    sheenRef,
    contentRef,
    syncActivePill,
    triggerTransition,
  };
}
