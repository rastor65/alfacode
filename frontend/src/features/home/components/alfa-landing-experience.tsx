"use client";

import { gsap } from "gsap";
import { useLayoutEffect, useRef, type ReactNode } from "react";

export function AlfaLandingExperience({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const media = gsap.matchMedia();
    media.add("(prefers-reduced-motion: no-preference)", (context) => {
      const headingLines = root.querySelectorAll(".alfa-hero-title > span");
      gsap.fromTo(headingLines, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.09, ease: "power3.out", clearProps: "opacity,transform" });
      const targets = Array.from(root.querySelectorAll<HTMLElement>(".alfa-reveal"));
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          context.add(() => { gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.65, ease: "power3.out", clearProps: "opacity,transform" }); });
          observer.unobserve(entry.target);
        }
      }, { threshold: 0.08 });
      for (const node of targets) {
        if (node.getBoundingClientRect().top <= window.innerHeight) continue;
        gsap.set(node, { opacity: 0, y: 24 });
        observer.observe(node);
      }
      const onFocus = (event: FocusEvent) => {
        const section = (event.target as HTMLElement)?.closest<HTMLElement>(".alfa-reveal");
        if (!section) return;
        observer.unobserve(section);
        gsap.killTweensOf(section);
        gsap.set(section, { clearProps: "opacity,transform" });
      };
      root.addEventListener("focusin", onFocus);
      return () => {
        observer.disconnect();
        root.removeEventListener("focusin", onFocus);
      };
    });
    return () => media.revert();
  }, []);

  return <div ref={rootRef}>{children}</div>;
}
