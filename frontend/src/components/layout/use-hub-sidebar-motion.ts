"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";

const EASE = "hub-out";
const DURATION = 0.26;

/**
 * Hook de animación fluida para el Aside y la transición hacia el Contenido principal.
 * Diseñado bajo los principios de consistencia espacial y rendimiento GPU de Emil Kowalski:
 * - Movimiento direccional que emerge desde el aside hacia el contenido.
 * - Haz de pulso luminoso (energy beam) en el límite del enlace activo.
 * - Deslizamiento físico de la píldora activa dentro del aside.
 * - Stagger sutil en las secciones de entrada del contenido.
 * - Respeta estrictamente prefers-reduced-motion.
 */
export function useHubSidebarMotion() {
  const pathname = usePathname();
  const sidebarDeckRef = useRef<HTMLDivElement | null>(null);
  const navListRef = useRef<HTMLUListElement | null>(null);
  const activePillRef = useRef<HTMLSpanElement | null>(null);
  const beamRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const previousPathRef = useRef<string>(pathname);
  const isFirstRender = useRef(true);

  // Registro del ease una sola vez
  useEffect(() => {
    gsap.registerPlugin(CustomEase);
    try {
      CustomEase.create(EASE, "0.23,1,0.32,1");
    } catch {
      // Ya registrado por el topbar u otra llamada
    }
  }, []);

  // Sincroniza la posición de la píldora activa dentro del aside
  const syncActivePill = useCallback((instant = false) => {
    const list = navListRef.current;
    const pill = activePillRef.current;
    if (!list || !pill) return;

    const activeItem = list.querySelector<HTMLElement>(".hub-sidebar-item-active");
    if (!activeItem) {
      gsap.to(pill, { opacity: 0, duration: 0.15, overwrite: true });
      return;
    }

    const itemTop = activeItem.offsetTop;
    const itemHeight = activeItem.offsetHeight;

    if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.killTweensOf(pill);
      gsap.set(pill, {
        y: itemTop,
        height: itemHeight,
        opacity: 1,
      });
      return;
    }

    gsap.to(pill, {
      y: itemTop,
      height: itemHeight,
      opacity: 1,
      duration: 0.22,
      ease: EASE,
      overwrite: true,
    });
  }, []);

  // Dispara la animación que viaja desde el aside hasta el contenido
  const triggerTransition = useCallback(() => {
    const content = contentRef.current;
    const list = navListRef.current;
    const beam = beamRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // 1. Haz de luz electromagnético que brota desde el enlace activo hacia el contenido
    if (beam && list && !reducedMotion) {
      const activeItem = list.querySelector<HTMLElement>(".hub-sidebar-item-active");
      if (activeItem) {
        const itemRect = activeItem.getBoundingClientRect();
        const sidebarRect = sidebarDeckRef.current?.getBoundingClientRect();
        if (sidebarRect) {
          const relativeY = itemRect.top - sidebarRect.top + itemRect.height / 2;
          gsap.killTweensOf(beam);
          gsap.set(beam, {
            top: relativeY,
            scaleX: 0,
            opacity: 1,
            transformOrigin: "left center",
          });

          gsap.to(beam, {
            scaleX: 1,
            opacity: 0,
            x: 90,
            duration: 0.34,
            ease: EASE,
            overwrite: true,
          });
        }
      }
    }

    // 2. Animación direccional del contenido
    if (content) {
      gsap.killTweensOf(content);

      if (reducedMotion) {
        gsap.fromTo(
          content,
          { opacity: 0.5 },
          { opacity: 1, duration: 0.16, ease: "power1.out", clearProps: "opacity" }
        );
      } else {
        // El contenido emerge deslizándose desde el aside hacia la derecha
        gsap.fromTo(
          content,
          {
            opacity: 0,
            x: -18,
            scale: 0.995,
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: DURATION,
            ease: EASE,
            clearProps: "transform,opacity",
          }
        );

        // Micro-stagger de entrada en las secciones directas del contenido
        const firstContainer = content.firstElementChild as HTMLElement | null;
        const targetElements = (firstContainer && firstContainer.children.length > 0
          ? Array.from(firstContainer.children)
          : Array.from(content.children)
        ).slice(0, 4) as HTMLElement[];

        if (targetElements.length > 0) {
          gsap.killTweensOf(targetElements);
          gsap.fromTo(
            targetElements,
            { opacity: 0, y: 7 },
            {
              opacity: 1,
              y: 0,
              duration: 0.22,
              ease: EASE,
              stagger: 0.035,
              delay: 0.04,
              clearProps: "transform,opacity",
            }
          );
        }
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
      // Pequeño microtask para permitir que el DOM renderice el nuevo estado activo
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

  return {
    sidebarDeckRef,
    navListRef,
    activePillRef,
    beamRef,
    contentRef,
    syncActivePill,
    triggerTransition,
  };
}
