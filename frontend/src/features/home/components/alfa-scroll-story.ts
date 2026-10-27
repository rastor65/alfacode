import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { PARTICLE_FORMS } from "./alfa-particle-forms";

export type ParticleScene = {
  x: number; y: number; size: number; opacity: number;
  rotationX: number; rotationY: number; rotationZ: number;
  spread: number; captionOpacity: number;
  formA: number; formB: number; morph: number; energy: number;
};
type Pose = Omit<ParticleScene, "formA" | "formB" | "morph" | "energy"> & { form: number };
type Frame = Pose & { scroll: number };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
// Time-aware Hermite tangents: irregular scroll intervals keep the same velocity at a join.
function curve(a: Frame, b: Frame, c: Frame, d: Frame, key: keyof Pose, t: number) {
  const span = c.scroll - b.scroll;
  const first = (c[key] - a[key]) / Math.max(1, c.scroll - a.scroll) * span;
  const second = (d[key] - b[key]) / Math.max(1, d.scroll - b.scroll) * span;
  return (2 * t ** 3 - 3 * t ** 2 + 1) * b[key] + (t ** 3 - 2 * t ** 2 + t) * first
    + (-2 * t ** 3 + 3 * t ** 2) * c[key] + (t ** 3 - t ** 2) * second;
}
export function initialParticleScene(): ParticleScene {
  return { x: 0, y: 0, size: 600, opacity: 1, rotationX: 0, rotationY: 0, rotationZ: 0, spread: 0, captionOpacity: 1, formA: 0, formB: 0, morph: 0, energy: 0 };
}

/** A spatial score tied to real content anchors. Native scrolling remains in control. */
export function createScrollStory(root: HTMLElement, scene: ParticleScene, onUpdate: () => void) {
  gsap.registerPlugin(ScrollTrigger);
  const hero = root.querySelector<HTMLElement>(".alfa-hero-art");
  const brain = root.querySelector<HTMLElement>(".alfa-story-brain-anchor");
  const steps = Array.from(root.querySelectorAll<HTMLElement>(".alfa-research-step"));
  const projects = Array.from(root.querySelectorAll<HTMLElement>(".alfa-project"));
  if (!hero || !brain || !steps.length) return () => {};
  const initialHash = window.location.hash;
  root.dataset.scrollStory = "true";
  let animation: gsap.core.Tween | null = null;
  let trigger: ScrollTrigger | null = null;
  let resizeCall: gsap.core.Tween | null = null;
  let disposed = false;
  let active = -2;
  let zone = "";
  const checkpointNodes = new Set<HTMLElement>();
  const rect = (element: HTMLElement) => {
    const r = element.getBoundingClientRect();
    return { x: r.left, y: r.top + window.scrollY, width: r.width, height: r.height };
  };
  const mark = (element: HTMLElement, scroll: number, form: number) => {
    element.dataset.scrollCheckpoint = String(Math.max(0, Math.round(scroll)));
    element.dataset.form = PARTICLE_FORMS[form];
    checkpointNodes.add(element);
  };

  function build() {
    if (disposed) return;
    trigger?.kill(); animation?.kill();
    const height = window.innerHeight, width = window.innerWidth;
    const mobile = width < 700;
    const frames: Frame[] = [];
    const defaults: Pose = { x: width / 2, y: height / 2, size: 600, form: 0, opacity: 1, rotationX: 0, rotationY: 0, rotationZ: 0, spread: 0, captionOpacity: 1 };
    const push = (scroll: number, pose: Pose) => frames.push({ ...pose, scroll: Math.max(frames.length ? frames[frames.length - 1].scroll + 1 : 0, scroll) });
    const logo = rect(hero!);
    const logoPose = { ...defaults, x: logo.x + logo.width / 2, y: logo.y + logo.height / 2, size: Math.min(logo.width, logo.height) };
    push(0, logoPose);
    const logoRest = Math.max(1, logoPose.y - height * 0.54);
    push(logoRest, { ...logoPose, y: logoPose.y - logoRest, rotationY: 0.08 });
    const knowledge = rect(brain!);
    const brainScroll = knowledge.y + (mobile ? height * 0.02 : knowledge.height / 2 - height / 2);
    const brainPose: Pose = { ...defaults, x: knowledge.x + knowledge.width / 2, y: height * (mobile ? 0.23 : 0.48), size: mobile ? Math.min(width * 0.94, height * 0.42) : Math.min(knowledge.width * 1.16, height * 0.7), form: 1, rotationY: -0.1, rotationZ: -0.04 };
    push(mix(logoRest, brainScroll, 0.47), { ...logoPose, x: width * (mobile ? 0.57 : 0.57), y: height * (mobile ? 0.32 : 0.29), size: brainPose.size * 0.72, rotationX: -0.28, rotationY: 0.6, rotationZ: -0.18, spread: 0.85, captionOpacity: 0 });
    push(brainScroll, brainPose);
    mark(brain!, brainScroll, 1);
    push(brainScroll + height * 0.27, { ...brainPose, x: brainPose.x - width * 0.025, y: height * (mobile ? 0.18 : 0.4), size: brainPose.size * 0.91, rotationX: 0.08, rotationY: 0.16, rotationZ: 0.035 });

    let researchStart = Infinity, researchEnd = Infinity, projectStart = Infinity, methodStart = Infinity, closingStart = Infinity;
    const addChapter = (element: HTMLElement, form: number, index: number, category: string) => {
      const anchor = element.querySelector<HTMLElement>("[data-particle-anchor]") ?? element;
      const bounds = rect(anchor);
      const checkpoint = bounds.y + bounds.height / 2 - height * (mobile ? 0.25 : 0.48);
      const side = bounds.x + bounds.width / 2 < width / 2 ? -1 : 1;
      const center = mobile ? width * (index % 2 ? 0.46 : 0.54) : bounds.x + bounds.width / 2;
      const size = mobile ? Math.min(width * 0.93, height * 0.4) : Math.min(bounds.width * 1.12, height * 0.68);
      const pitch = form === 3 ? 0.1 : form === 5 ? -0.04 : -0.08;
      const yaw = form === 3 ? 0.30 : form === 5 ? 0.26 : 0.20;
      const pose: Pose = { ...defaults, x: center, y: height * (mobile ? 0.24 : 0.48), size, form, rotationX: pitch, rotationY: side * yaw, rotationZ: side * 0.035 };
      const entry = checkpoint - height * (mobile ? 0.17 : 0.25);
      const previous = frames[frames.length - 1];
      if (entry > previous.scroll + height * 0.18) {
        push((previous.scroll + entry) / 2, { ...pose, form: previous.form, x: width * (mobile ? 0.5 + side * 0.1 : 0.5), y: height * (index % 2 ? 0.24 : 0.28), size: size * 0.64, rotationX: -0.35, rotationY: -side * 0.55, rotationZ: side * 0.24, spread: 1.15, captionOpacity: 0, opacity: 0.86 });
      }
      push(entry, { ...pose, x: center - side * size * 0.065, y: height * (mobile ? 0.28 : 0.58), size: size * 0.88, rotationY: -side * 0.28, rotationZ: -side * 0.065, captionOpacity: 0.65 });
      push(checkpoint, pose);
      push(checkpoint + height * (mobile ? 0.19 : 0.26), { ...pose, x: center + side * size * 0.055, y: height * (mobile ? 0.19 : 0.37), size: size * 0.92, rotationX: 0.12, rotationY: side * 0.32, rotationZ: side * 0.08, captionOpacity: 0.7 });
      mark(element, checkpoint, form);
      if (category === "research") {
        if (researchStart === Infinity) researchStart = entry - height * 0.15;
        researchEnd = frames[frames.length - 1].scroll + height * 0.2;
      } else if (category === "projects" && projectStart === Infinity) projectStart = entry;
      return checkpoint;
    };
    steps.forEach((step, index) => addChapter(step, index + 2, index, "research"));
    projects.forEach((project, index) => addChapter(project, Number(project.dataset.projectForm) || 2, index + 4, "projects"));
    const method = root.querySelector<HTMLElement>(".alfa-method-stage");
    if (method) methodStart = addChapter(method, 2, 7, "method") - height * 0.2;
    const invitation = root.querySelector<HTMLElement>(".alfa-invitation-stage");
    if (invitation) {
      const bounds = rect(invitation);
      const checkpoint = bounds.y + bounds.height / 2 - height * 0.25;
      closingStart = checkpoint - height * 0.3;
      const pose: Pose = { ...defaults, form: 0, x: bounds.x + bounds.width / 2, y: height * 0.25, size: Math.min(bounds.width * 0.87, height * 0.38), rotationY: 0.06 };
      const previous = frames[frames.length - 1];
      push((previous.scroll + closingStart) / 2, { ...pose, x: width * 0.7, y: height * 0.3, size: pose.size * 0.85, form: previous.form, spread: 1.2, rotationY: -0.65, rotationZ: -0.16, captionOpacity: 0 });
      push(checkpoint, pose);
      mark(invitation, checkpoint, 0);
      push(checkpoint + height * 0.32, { ...pose, y: height * 0.1, size: pose.size * 0.7, rotationY: -0.18, rotationZ: 0.06, captionOpacity: 0, opacity: 0.7 });
    }
    const previous = frames[frames.length - 1];
    const maxScroll = document.documentElement.scrollHeight - height;
    const exit = Math.min(previous.scroll + height * 0.42, Math.max(previous.scroll + 1, maxScroll - 24));
    push(exit, { ...previous, y: -height * 0.12, size: previous.size * 0.65, opacity: 0, captionOpacity: 0 });
    const end = frames[frames.length - 1].scroll;
    const cursor = { scroll: 0 };
    const scalars = ["size", "opacity", "rotationX", "rotationY", "rotationZ", "spread", "captionOpacity"] as const;
    const update = () => {
      const scroll = cursor.scroll;
      let index = 0;
      while (index < frames.length - 2 && frames[index + 1].scroll < scroll) index++;
      const a = frames[Math.max(0, index - 1)], b = frames[index], c = frames[index + 1], d = frames[Math.min(frames.length - 1, index + 2)];
      const t = clamp((scroll - b.scroll) / (c.scroll - b.scroll), 0, 1);
      const eased = t * t * (3 - 2 * t);
      scene.x = clamp(curve(a, b, c, d, "x", t), width * 0.12, width * 0.88);
      scene.y = curve(a, b, c, d, "y", t);
      for (const key of scalars) scene[key] = curve(a, b, c, d, key, t);
      scene.size = Math.max(80, scene.size);
      scene.opacity = clamp(scene.opacity, 0, 1);
      scene.captionOpacity = clamp(scene.captionOpacity, 0, 1);
      scene.spread = Math.max(0, scene.spread);
      scene.formA = b.form; scene.formB = c.form; scene.morph = b.form === c.form ? 0 : eased;
      const form = scene.morph < 0.5 ? b.form : c.form;
      root.dataset.particleForm = PARTICLE_FORMS[form];
      const nextZone = scroll >= closingStart ? "closing" : scroll >= methodStart ? "method" : scroll >= projectStart ? "projects" : scroll >= researchStart && scroll <= researchEnd ? "research" : "intro";
      if (zone !== nextZone) { zone = nextZone; root.dataset.storyZone = zone; }
      const next = zone === "research" ? clamp(form - 2, 0, steps.length - 1) : -1;
      if (next !== active) {
        active = next;
        steps.forEach((step, i) => { step.dataset.active = String(i === active); });
        root.querySelectorAll<HTMLElement>("[data-story-link]").forEach((link, i) => {
          if (i === active) link.setAttribute("aria-current", "step"); else link.removeAttribute("aria-current");
        });
      }
      onUpdate();
    };
    animation = gsap.to(cursor, { scroll: end, duration: 1, ease: "none", paused: true, onUpdate: update });
    trigger = ScrollTrigger.create({ start: 0, end, animation, scrub: mobile ? 0.16 : 0.24, onUpdate: (self) => { scene.energy = clamp(self.getVelocity() / 3000, -1, 1); } });
    animation.progress(trigger.progress);
    root.dataset.storyEnd = String(Math.round(end));
    update();
  }
  const onResize = () => { resizeCall?.kill(); resizeCall = gsap.delayedCall(0.18, build); };
  const onSelect = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest<HTMLAnchorElement>("[data-story-link]");
    if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const target = document.getElementById(link.hash.slice(1));
    if (!target || !root.contains(target)) return;
    event.preventDefault();
    window.history.pushState(null, "", link.hash);
    target.focus({ preventScroll: true });
    window.scrollTo({ top: Number(target.dataset.scrollCheckpoint), behavior: "smooth" });
  };
  root.addEventListener("click", onSelect);
  window.addEventListener("resize", onResize, { passive: true });
  build();
  void document.fonts.ready.then(() => {
    if (disposed) return;
    build();
    if (initialHash && initialHash === window.location.hash) {
      const destination = document.getElementById(initialHash.slice(1));
      if (destination && root.contains(destination)) {
        if (destination.dataset.scrollCheckpoint) window.scrollTo({ top: Number(destination.dataset.scrollCheckpoint), behavior: "instant" });
        else destination.scrollIntoView({ behavior: "instant" });
      }
    }
  });
  return () => {
    disposed = true; resizeCall?.kill(); trigger?.kill(); animation?.kill();
    root.removeEventListener("click", onSelect); window.removeEventListener("resize", onResize);
    for (const key of ["data-scroll-story", "data-particle-form", "data-story-end", "data-story-zone"]) root.removeAttribute(key);
    checkpointNodes.forEach((node) => { delete node.dataset.scrollCheckpoint; delete node.dataset.form; });
    steps.forEach((step) => { delete step.dataset.active; });
    root.querySelectorAll<HTMLElement>("[data-story-link]").forEach((link) => link.removeAttribute("aria-current"));
  };
}
