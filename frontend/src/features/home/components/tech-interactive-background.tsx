"use client";

import { useEffect, useRef } from "react";

/**
 * Background tecnológico minimalista y muy disimulado para la landing de AlfaCode.
 * - Malla fija de micro-puntos y cruces técnicas con opacidad tenue en reposo.
 * - Reactivo exclusivamente al cursor: los puntos se realzan, aumentan su brillo e intensidad
 *   y tienen un sutil desplazamiento elástico cuando el usuario mueve el cursor por encima.
 * - Sin partículas autónomas en movimiento continuo para máxima serenidad visual y elegancia.
 */
export function TechInteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Posición del cursor interpolada (lerp easing)
    const targetMouse = { x: -1000, y: -1000, active: false };
    const currentMouse = { x: -1000, y: -1000 };

    function resize() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx?.scale(dpr, dpr);
    }

    resize();
    window.addEventListener("resize", resize);

    const onPointerMove = (e: PointerEvent) => {
      targetMouse.x = e.clientX;
      targetMouse.y = e.clientY;
      targetMouse.active = true;
    };

    const onPointerLeave = () => {
      targetMouse.active = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    let lightMode = false;
    const updateThemeMode = () => {
      const publicSite = document.querySelector(".public-site");
      const themeAttr = publicSite?.getAttribute("data-theme");
      if (themeAttr === "light") {
        lightMode = true;
      } else if (themeAttr === "dark") {
        lightMode = false;
      } else {
        lightMode = window.matchMedia("(prefers-color-scheme: light)").matches;
      }
    };
    updateThemeMode();

    const themeObserver = new MutationObserver(updateThemeMode);
    const targetNode = document.querySelector(".public-site") || document.documentElement;
    themeObserver.observe(targetNode, { attributes: true, attributeFilter: ["data-theme"] });

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    mql.addEventListener("change", updateThemeMode);

    const gridSpacing = 42;
    const interactionRadius = 190;

    let isVisible = true;
    const handleVisibility = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    function render() {
      if (!ctx || !isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      const light = lightMode;

      // Suavizado del cursor (easing con lerp para una reacción orgánica)
      if (targetMouse.active) {
        currentMouse.x += (targetMouse.x - currentMouse.x) * 0.1;
        currentMouse.y += (targetMouse.y - currentMouse.y) * 0.1;
      } else {
        currentMouse.x += (-1000 - currentMouse.x) * 0.05;
        currentMouse.y += (-1000 - currentMouse.y) * 0.05;
      }

      // 1. Resplandor sutil focalizado en el cursor
      if (targetMouse.active && currentMouse.x > -400) {
        const glowRadius = 240;
        const radialGradient = ctx.createRadialGradient(
          currentMouse.x,
          currentMouse.y,
          0,
          currentMouse.x,
          currentMouse.y,
          glowRadius
        );

        if (light) {
          radialGradient.addColorStop(0, "rgba(14, 116, 144, 0.06)");
          radialGradient.addColorStop(0.5, "rgba(14, 116, 144, 0.02)");
          radialGradient.addColorStop(1, "rgba(14, 116, 144, 0)");
        } else {
          radialGradient.addColorStop(0, "rgba(34, 211, 238, 0.09)");
          radialGradient.addColorStop(0.5, "rgba(6, 182, 212, 0.03)");
          radialGradient.addColorStop(1, "rgba(6, 182, 212, 0)");
        }

        ctx.fillStyle = radialGradient;
        ctx.beginPath();
        ctx.arc(currentMouse.x, currentMouse.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Malla de micro-puntos y cruces que se realzan bajo el cursor
      const cols = Math.ceil(width / gridSpacing) + 1;
      const rows = Math.ceil(height / gridSpacing) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const originX = c * gridSpacing;
          const originY = r * gridSpacing;

          let posX = originX;
          let posY = originY;
          let proximityFactor = 0;

          // Detección de proximidad al cursor
          if (targetMouse.active) {
            const dx = originX - currentMouse.x;
            const dy = originY - currentMouse.y;
            const dist = Math.hypot(dx, dy);

            if (dist < interactionRadius) {
              // Curva suave cuadrática
              proximityFactor = 1 - dist / interactionRadius;

              // Desplazamiento elástico muy sutil (lente cibernética)
              const angle = Math.atan2(dy, dx);
              const push = Math.sin(proximityFactor * Math.PI) * 3.5;
              posX += Math.cos(angle) * push;
              posY += Math.sin(angle) * push;
            }
          }

          const isCross = (r + c) % 5 === 0;

          if (isCross) {
            // Micro-cruz técnica
            const arm = 2.2;
            const alpha = light
              ? 0.06 + proximityFactor * 0.4
              : 0.08 + proximityFactor * 0.5;

            ctx.strokeStyle = light
              ? `rgba(14, 116, 144, ${alpha})`
              : `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 1;

            ctx.beginPath();
            ctx.moveTo(posX - arm, posY);
            ctx.lineTo(posX + arm, posY);
            ctx.moveTo(posX, posY - arm);
            ctx.lineTo(posX, posY + arm);
            ctx.stroke();
          } else {
            // Punto sutil que se realza en tamaño y brillo
            const radius = 0.8 + proximityFactor * 1.5;
            const alpha = light
              ? 0.05 + proximityFactor * 0.45
              : 0.07 + proximityFactor * 0.55;

            ctx.fillStyle = light
              ? `rgba(14, 116, 144, ${alpha})`
              : `rgba(34, 211, 238, ${alpha})`;

            ctx.beginPath();
            ctx.arc(posX, posY, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("mouseleave", onPointerLeave);
      document.removeEventListener("visibilitychange", handleVisibility);
      themeObserver.disconnect();
      mql.removeEventListener("change", updateThemeMode);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="size-full opacity-90 transition-opacity duration-700"
      />
    </div>
  );
}
