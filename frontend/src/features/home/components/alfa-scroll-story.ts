import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { PARTICLE_FORMS } from "./alfa-particle-forms";

export type ParticleScene = { x: number; y: number; size: number; shape: number; opacity: number };
type StoryFrame = ParticleScene & { scroll: number };

/** Native scrolling drives a single reversible timeline; nothing intercepts wheel or touch. */
export function createScrollStory(root: HTMLElement, scene: ParticleScene, onUpdate: () => void) {
  gsap.registerPlugin(ScrollTrigger);
  const hero = root.querySelector<HTMLElement>(".alfa-hero-art");
  const brain = root.querySelector<HTMLElement>(".alfa-story-brain-anchor");
  const research = root.querySelector<HTMLElement>(".alfa-research-visual");
  const steps = Array.from(root.querySelectorAll<HTMLElement>(".alfa-research-step"));
  if (!hero || !brain || !research || !steps.length) return () => {};

  root.dataset.scrollStory = "true";
  let timeline: gsap.core.Timeline | null = null;
  let trigger: ScrollTrigger | null = null;
  let resizeCall: gsap.core.Tween | null = null;
  let disposed = false;
  let active = -1;
  const rect = (element: HTMLElement) => {
    const bounds = element.getBoundingClientRect();
    return { x: bounds.left, y: bounds.top + window.scrollY, width: bounds.width, height: bounds.height };
  };

  function describe() {
    const form = Math.max(0, Math.min(5, Math.round(scene.shape)));
    root.dataset.particleForm = PARTICLE_FORMS[form];
    const next = form >= 2 ? Math.min(form - 2, steps.length - 1) : -1;
    if (next !== active) {
      active = next;
      steps.forEach((step, index) => { step.dataset.active = String(index === active); });
      root.querySelectorAll<HTMLElement>("[data-story-link]").forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "step");
        else link.removeAttribute("aria-current");
      });
    }
    onUpdate();
  }

  function build() {
    if (disposed) return;
    trigger?.kill();
    timeline?.kill();
    const height = window.innerHeight;
    const mobile = window.matchMedia("(max-width: 699px)").matches;
    const logo = rect(hero!);
    const knowledge = rect(brain!);
    const area = rect(research!);
    const frames: StoryFrame[] = [];
    const push = (scroll: number, target: ParticleScene) => {
      frames.push({ ...target, scroll: Math.max(frames.length ? frames[frames.length - 1].scroll + 1 : 0, scroll) });
    };
    const logoScene: ParticleScene = { x: logo.x + logo.width / 2, y: logo.y + logo.height / 2, size: Math.min(logo.width, logo.height), shape: 0, opacity: 1 };
    push(0, logoScene);
    const logoRest = Math.max(0, logoScene.y - height * 0.52);
    push(logoRest, { ...logoScene, y: logoScene.y - logoRest });
    const brainScene: ParticleScene = {
      x: knowledge.x + knowledge.width / 2,
      y: height * (mobile ? 0.24 : 0.5),
      size: mobile ? Math.min(window.innerWidth * 0.95, height * 0.43) : Math.min(knowledge.width * 1.18, height * 0.74),
      shape: 1, opacity: 1,
    };
    const brainScroll = knowledge.y + (mobile ? height * 0.02 : knowledge.height / 2 - height / 2);
    push(brainScroll, brainScene);
    push(Math.max(brainScroll + height * 0.22, rect(steps[0]).y - height * 0.75), brainScene);

    const chapterScene = { ...brainScene, x: area.x + area.width / 2, size: mobile ? Math.min(window.innerWidth * 0.98, height * 0.4) : Math.min(area.width * 1.2, height * 0.7) };
    steps.forEach((step, index) => {
      const bounds = rect(step);
      const checkpoint = bounds.y + bounds.height / 2 - height / 2;
      const target = { ...chapterScene, shape: index + 2 };
      push(checkpoint, target);
      const next = steps[index + 1];
      if (next) push(rect(next).y + rect(next).height / 2 - height * 0.94, target);
      else push(checkpoint + height * 0.25, target);
    });
    const last = frames[frames.length - 1];
    push(last.scroll + height * 0.6, { ...last, shape: 5, y: height * 0.3, size: last.size * 0.78, opacity: 0 });

    Object.assign(scene, logoScene);
    timeline = gsap.timeline({ paused: true, onUpdate: describe });
    for (let i = 1; i < frames.length; i++) {
      const { scroll, ...target } = frames[i];
      timeline.to(scene, { ...target, duration: scroll - frames[i - 1].scroll, ease: "power2.inOut" }, frames[i - 1].scroll);
    }
    trigger = ScrollTrigger.create({ start: 0, end: last.scroll + height * 0.6, animation: timeline, scrub: 0.55 });
    timeline.progress(trigger.progress);
    root.dataset.storyEnd = String(Math.round(last.scroll + height * 0.6));
    steps.forEach((step, index) => {
      const bounds = rect(step);
      step.dataset.scrollCheckpoint = String(Math.round(bounds.y + bounds.height / 2 - height / 2));
      step.dataset.form = PARTICLE_FORMS[index + 2];
    });
    brain!.dataset.scrollCheckpoint = String(Math.round(brainScroll));
    describe();
  }

  const onResize = () => {
    resizeCall?.kill();
    resizeCall = gsap.delayedCall(0.18, build);
  };
  // Hash navigation has a semantic destination. Align the corresponding illustrated chapter.
  const onSelect = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-story-link]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const step = document.getElementById(link.hash.slice(1));
    if (!step || !root.contains(step)) return;
    event.preventDefault();
    window.history.replaceState(null, "", link.hash);
    step.focus({ preventScroll: true });
    window.scrollTo({ top: Number(step.dataset.scrollCheckpoint), behavior: "smooth" });
  };
  root.addEventListener("click", onSelect);
  window.addEventListener("resize", onResize, { passive: true });
  void document.fonts.ready.then(() => { if (!disposed) build(); });
  build();

  return () => {
    disposed = true;
    resizeCall?.kill();
    trigger?.kill();
    timeline?.kill();
    root.removeEventListener("click", onSelect);
    window.removeEventListener("resize", onResize);
    root.removeAttribute("data-scroll-story");
    root.removeAttribute("data-particle-form");
    root.removeAttribute("data-story-end");
    steps.forEach((step) => { delete step.dataset.active; delete step.dataset.scrollCheckpoint; });
    root.querySelectorAll("[data-story-link]").forEach((link) => link.removeAttribute("aria-current"));
  };
}
