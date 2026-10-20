"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevPathnameRef = useRef(pathname);

  // Iniciar la barra de carga con respuesta instantánea
  const startLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setIsFading(false);
    setVisible(true);
    setProgress(35);

    // Incremento ágil y optimizado
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev < 75) return prev + Math.random() * 18;
        if (prev < 92) return prev + Math.random() * 6;
        return prev;
      });
    }, 70);

    // Timeout de seguridad reducido a 3.5 segundos
    timeoutRef.current = setTimeout(() => {
      finishLoading();
    }, 3500);
  };

  // Finalizar y desvanecer la barra de carga rápidamente
  const finishLoading = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    setProgress(100);

    // Transición rápida y fluida
    setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
        setIsFading(false);
      }, 160);
    }, 70);
  };

  // Detectar cambios en la ruta (navegación completada)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      finishLoading();
    }
  }, [pathname]);

  // Escuchar clics en enlaces internos para iniciar la barra
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Ignorar clics que no sean con el botón izquierdo o con teclas modificadoras
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }

      // Buscar el elemento <a> más cercano
      const anchor = (e.target as Element)?.closest("a");
      if (!anchor || !anchor.href) return;

      // Ignorar si tiene target="_blank" o atributo download
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) {
        return;
      }

      try {
        const targetUrl = new URL(anchor.href, window.location.href);

        // Ignorar enlaces externos
        if (targetUrl.origin !== window.location.origin) {
          return;
        }

        // Ignorar anclas en la misma página (#)
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search &&
          targetUrl.hash
        ) {
          return;
        }

        // Ignorar clics en la misma ruta exacta
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }

        // Si es una navegación a una ruta distinta, encender la barra superior
        startLoading();
      } catch {
        // Enlace no parseable, no hacer nada
      }
    };

    // Escuchar también eventos de retroceso/avance del navegador
    const handlePopState = () => {
      startLoading();
    };

    document.addEventListener("click", handleClick, { capture: true });
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
      window.removeEventListener("popstate", handlePopState);
      if (timerRef.current) clearInterval(timerRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[99999] h-[2.5px] pointer-events-none overflow-hidden bg-transparent"
      role="progressbar"
      aria-label="Cargando página"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-cyan-400 via-[#469eb4] to-cyan-300 shadow-[0_0_12px_#22d3ee,0_0_6px_#06b6d4]"
        style={{
          width: `${progress}%`,
          opacity: isFading ? 0 : 1,
          transitionProperty: "width, opacity",
          transitionDuration: isFading ? "160ms, 160ms" : "120ms, 120ms",
          transitionTimingFunction: "cubic-bezier(0.2, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
