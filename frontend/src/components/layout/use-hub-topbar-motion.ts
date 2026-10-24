"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";

export type InteractionSource = "pointer" | "keyboard";

const ENTER = 0.2;
const EXIT = 0.15;
const EASE = "hub-out";

/** Movimiento acotado al encabezado, reversible y sin retrasos para teclado. */
export function useHubTopbarMotion(
  rootRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
) {
  const contextRef = useRef<gsap.Context | null>(null);
  const pendingClose = useRef<(() => void) | null>(null);
  const source = useRef<InteractionSource>("keyboard");
  const introPlayed = useRef(false);
  const appearanceElement = useRef<HTMLElement | null>(null);

  const position = useCallback((trigger: HTMLElement | null) => {
    const panel = panelRef.current;
    const deck = rootRef.current?.querySelector<HTMLElement>(".hub-bar-deck");
    if (!panel || !deck || !trigger) return;
    if (window.matchMedia("(max-width: 639px)").matches) {
      panel.style.removeProperty("left");
      panel.style.removeProperty("right");
      return;
    }
    const surface = deck.getBoundingClientRect();
    const anchor = trigger.getBoundingClientRect();
    const left = panel.classList.contains("hub-bar-modules-popover")
      ? anchor.left - surface.left
      : anchor.right - surface.left - panel.offsetWidth;
    const boundedLeft = Math.max(8, Math.min(left, surface.width - panel.offsetWidth - 8));
    panel.style.left = `${boundedLeft}px`;
    panel.style.right = "auto";
  }, [rootRef, panelRef]);

  const syncAppearance = useCallback((instant = false) => {
    const group = rootRef.current?.querySelector<HTMLElement>(".hub-bar-theme-options");
    const indicator = group?.querySelector<HTMLElement>(".hub-bar-theme-indicator");
    const selected = group?.querySelector<HTMLElement>('[aria-pressed="true"]');
    if (!indicator || !selected) {
      appearanceElement.current = null;
      return;
    }
    const x = selected.offsetLeft - 4;
    const first = appearanceElement.current !== indicator;
    appearanceElement.current = indicator;
    if (first || instant || source.current === "keyboard" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !contextRef.current) {
      gsap.killTweensOf(indicator);
      gsap.set(indicator, { x });
    } else {
      contextRef.current.add(() => {
        gsap.to(indicator, { x, duration: ENTER, ease: EASE, overwrite: true });
      });
    }
  }, [rootRef]);

  const cancel = useCallback(() => {
    pendingClose.current = null;
    const panel = panelRef.current;
    if (panel) gsap.killTweensOf(panel);
  }, [panelRef]);

  const reveal = useCallback((trigger: HTMLElement | null, interaction: InteractionSource) => {
    const panel = panelRef.current;
    if (!panel) return;
    cancel();
    position(trigger);
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.dataset.motionState = "open";
    if (interaction === "keyboard" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !contextRef.current) {
      gsap.set(panel, { clearProps: "opacity,transform,transformOrigin" });
      return;
    }

    const bounds = panel.getBoundingClientRect();
    const anchor = trigger?.getBoundingClientRect();
    const origin = anchor ? Math.max(16, Math.min(bounds.width - 16, anchor.x + anchor.width / 2 - bounds.x)) : bounds.width / 2;
    contextRef.current.add(() => {
      gsap.fromTo(panel,
        { opacity: 0, y: -6, scale: 0.97, transformOrigin: `${origin}px top` },
        { opacity: 1, y: 0, scale: 1, duration: ENTER, ease: EASE, overwrite: true, clearProps: "opacity,transform" },
      );
      const items = panel.querySelectorAll(".hub-bar-identity, .hub-bar-menu-item, .hub-bar-appearance, .hub-bar-logout, .hub-bar-shortcut-grid .hub-bar-menu-item");
      if (items.length > 0) {
        gsap.fromTo(items,
          { opacity: 0, y: -4 },
          { opacity: 1, y: 0, duration: ENTER, stagger: 0.02, ease: EASE, overwrite: true, clearProps: "opacity,transform" }
        );
      }
    });
  }, [cancel, panelRef, position]);

  const dismiss = useCallback((complete: () => void) => {
    const panel = panelRef.current;
    cancel();
    if (!panel || source.current === "keyboard" || window.matchMedia("(prefers-reduced-motion: reduce)").matches || !contextRef.current) {
      complete();
      return;
    }
    // La salida conserva la superficie visual, pero ya no recibe foco ni interacción.
    panel.inert = true;
    panel.setAttribute("aria-hidden", "true");
    panel.dataset.motionState = "closing";
    pendingClose.current = complete;
    contextRef.current.add(() => {
      gsap.to(panel, {
        opacity: 0, y: -4, scale: 0.98, duration: EXIT, ease: EASE, overwrite: true,
        onComplete: () => {
          const done = pendingClose.current;
          pendingClose.current = null;
          done?.();
        },
      });
    });
  }, [cancel, panelRef]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    gsap.registerPlugin(CustomEase);
    CustomEase.create(EASE, "0.23,1,0.32,1");
    const context = gsap.context(() => {}, root);
    contextRef.current = context;
    root.dataset.motion = "reduced";
    root.dataset.inputSource = "keyboard";
    const media = gsap.matchMedia();
    const pointer = () => { source.current = "pointer"; root.dataset.inputSource = "pointer"; };
    const keyboard = () => { source.current = "keyboard"; root.dataset.inputSource = "keyboard"; };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);

    media.add("(prefers-reduced-motion: no-preference)", () => {
      root.dataset.motion = "enabled";
      if (!introPlayed.current) {
        introPlayed.current = true;
        // Solo se presenta el acabado de la marca; los controles están disponibles desde el inicio.
        const edge = root.querySelector(".hub-bar-edge-highlight");
        const logo = root.querySelector(".hub-bar-logo");
        if (edge) gsap.fromTo(edge, { scaleX: 0, opacity: 0 }, { scaleX: 1, opacity: 1, duration: 0.24, ease: EASE, clearProps: "transform,opacity" });
        if (logo) gsap.fromTo(logo, { opacity: 0.75, scale: 0.98 }, { opacity: 1, scale: 1, duration: 0.24, ease: EASE, clearProps: "transform,opacity" });
      }
      return () => {
        root.dataset.motion = "reduced";
        const panel = panelRef.current;
        if (panel) {
          gsap.killTweensOf(panel);
          gsap.set(panel, { clearProps: "transform,opacity" });
        }
        const done = pendingClose.current;
        pendingClose.current = null;
        done?.();
        syncAppearance(true);
      };
    });

    media.add("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)", (scope) => {
      const group = root.querySelector<HTMLElement>(".hub-bar-utilities");
      const lens = root.querySelector<HTMLElement>(".hub-bar-utility-indicator");
      if (!group || !lens) return;
      const buttons = Array.from(group.querySelectorAll<HTMLElement>("a, button"));
      const xTo = gsap.quickTo(lens, "x", { duration: 0.15, ease: EASE });
      let active = false;
      const enter = (event: Event) => {
        const button = event.currentTarget as HTMLElement;
        const x = button.offsetLeft - 4;
        if (active) xTo(x);
        else gsap.set(lens, { x });
        active = true;
        scope.add(() => { gsap.to(lens, { opacity: 1, duration: 0.125, ease: EASE, overwrite: "auto" }); });
      };
      const leave = () => {
        active = false;
        scope.add(() => { gsap.to(lens, { opacity: 0, duration: 0.125, ease: EASE, overwrite: "auto" }); });
      };
      buttons.forEach((button) => button.addEventListener("pointerenter", enter));
      group.addEventListener("pointerleave", leave);
      group.addEventListener("keydown", leave);
      return () => {
        buttons.forEach((button) => button.removeEventListener("pointerenter", enter));
        group.removeEventListener("pointerleave", leave);
        group.removeEventListener("keydown", leave);
      };
    });

    return () => {
      pendingClose.current = null;
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
      cancel();
      media.revert();
      context.revert();
      contextRef.current = null;
    };
  }, [rootRef, panelRef, cancel, syncAppearance]);

  return { source, reveal, dismiss, cancel, position, syncAppearance };
}
