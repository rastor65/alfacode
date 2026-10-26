import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

import { AlfaCodeLogo } from "@/components/brand/alfacode-logo";
import type { Project, ResearchLine } from "@/types/domain";

import AlfaConstellation from "./alfa-constellation";
import { AlfaLandingExperience } from "./alfa-landing-experience";
import { AlfaLandingHeader } from "./alfa-landing-header";
import "./alfa-landing.css";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-alfa-landing" });

const lineCopy: Record<string, { title: string; text: string }> = {
  software: { title: "Desarrollo de software", text: "Arquitectura y productos digitales para problemas concretos." },
  ai: { title: "Inteligencia artificial", text: "Modelos, agentes y nuevas maneras de trabajar con el conocimiento." },
  iot: { title: "Internet de las cosas", text: "Sensores y sistemas que conectan el mundo físico con los datos." },
  "applied-research": { title: "Investigación aplicada", text: "Preguntas del entorno que se convierten en soluciones verificables." },
};

const projectCopy: Record<string, { title: string; summary: string }> = {
  "wellness-monitoring": {
    title: "Datos que ayudan a entender el bienestar.",
    summary: "Plataforma para capturar, analizar y visualizar señales asociadas al bienestar físico.",
  },
  "hotel-management": {
    title: "Una nueva forma de gestionar la información hotelera.",
    summary: "Solución web para administrar información operativa, reservas y recursos hoteleros.",
  },
  "gamified-learning": {
    title: "Aprender también puede ser un reto.",
    summary: "Entorno educativo con dinámicas de progreso, retos y retroalimentación para estudiantes.",
  },
};

const statuses: Record<string, string> = {
  RESEARCH: "En investigación", DESIGN: "En diseño", DEVELOPMENT: "En desarrollo",
  VALIDATION: "En validación", COMPLETED: "Finalizado", PROPOSED: "Propuesta",
};

function ResearchConnections() {
  return <div className="alfa-connections" aria-hidden="true">
    <svg viewBox="0 0 560 520" fill="none">
      <defs><linearGradient id="alfa-research-path" x1="50" y1="100" x2="480" y2="420"><stop stopColor="#0382a1" stopOpacity=".15" /><stop offset=".6" stopColor="#94eefe" stopOpacity=".7" /><stop offset="1" stopColor="#0382a1" stopOpacity=".2" /></linearGradient></defs>
      <path d="M80 110C245 110 130 260 280 260S315 410 480 410M80 410C235 410 135 260 280 260S325 110 480 110M80 260H480" stroke="url(#alfa-research-path)" strokeWidth="1" />
      <path d="M280 56V464" stroke="#0382a1" strokeOpacity=".2" strokeDasharray="2 8" />
      {[[80, 110], [480, 110], [80, 410], [480, 410], [80, 260], [480, 260]].map(([cx, cy], i) => <g key={i}><circle cx={cx} cy={cy} r="5" fill="#000" stroke="#469eb4" /><circle cx={cx} cy={cy} r="1.5" fill="#94eefe" /></g>)}
      <circle cx="280" cy="260" r="38" fill="#000" stroke="#0382a1" strokeOpacity=".55" />
      <circle cx="280" cy="260" r="5" fill="#94eefe" />
      <text x="80" y="84">SOFTWARE</text><text x="432" y="84">IA</text><text x="80" y="446">IoT</text><text x="352" y="446">INVESTIGACIÓN</text>
      <text x="222" y="330" className="alfa-connection-center-label">Una idea conecta todo.</text>
    </svg>
    <span className="alfa-connections-caption">Distintas disciplinas. Un mismo impulso.</span>
  </div>;
}

export function AlfaLanding({ featuredProjects, researchLines }: { featuredProjects: Project[]; researchLines: ResearchLine[] }) {
  const selectedProjects = featuredProjects.filter((project) => project.visibility === "PUBLIC").slice(0, 3);
  return (
    <div className={`alfa-landing ${inter.variable}`} id="inicio">
      <a href="#contenido-landing" className="alfa-landing-skip">Saltar al contenido</a>
      <AlfaLandingExperience>
        <AlfaLandingHeader />
        <main id="contenido-landing" tabIndex={-1}>
          <section className="alfa-hero alfa-container" aria-labelledby="alfa-hero-title">
            <div className="alfa-hero-copy">
              <p className="alfa-eyebrow"><span className="alfa-tiny-node" aria-hidden="true" />SEMILLERO DE INVESTIGACIÓN ALFACODE</p>
              <h1 className="alfa-hero-title" id="alfa-hero-title"><span>Investigar.</span><span>Construir.</span><span>Trascender.</span></h1>
              <p className="alfa-body alfa-hero-description">Conectamos software, inteligencia artificial e investigación para transformar preguntas en soluciones reales.</p>
              <div className="alfa-hero-actions">
                <a href="#proyectos" className="alfa-primary-link">Explorar proyectos <ArrowUpRight size={18} aria-hidden="true" /></a>
                <a href="#manifiesto" className="alfa-text-link">Nuestra forma de pensar <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
            </div>
            <div className="alfa-hero-art"><AlfaConstellation /></div>
            <div className="alfa-hero-bottom"><span>Research & Software Lab</span><a href="#manifiesto" aria-label="Continuar al manifiesto"><ArrowDown size={17} aria-hidden="true" /><span>Hay más por descubrir</span></a><span>La Guajira, Colombia</span></div>
          </section>

          <section className="alfa-section alfa-container alfa-manifesto" id="manifiesto" tabIndex={-1} aria-labelledby="alfa-manifesto-title">
            <div className="alfa-story-brain-anchor" aria-hidden="true"><Image src="/visuals/alfacode-cortex.svg" alt="" width={600} height={460} unoptimized className="alfa-brain-fallback" /></div>
            <div className="alfa-editorial-copy alfa-reveal">
              <p className="alfa-eyebrow">01 / EL PUNTO DE PARTIDA</p>
              <h2 id="alfa-manifesto-title" className="alfa-display">El conocimiento<br />no crece solo.</h2>
              <span className="alfa-section-kicker">CRECE CUANDO LO CONECTAMOS.</span>
              <p className="alfa-body">Una pregunta abre una conversación. La conversación conecta distintas miradas. Y de ese encuentro nace algo que antes no existía.</p>
              <p className="alfa-body">Somos AlfaCode: un espacio para aprender construyendo, investigar en colectivo y explorar lo que la tecnología puede aportar a nuestro entorno.</p>
              <Link href="/equipo" className="alfa-text-link">Conoce a quienes lo hacen posible <ArrowUpRight size={17} aria-hidden="true" /></Link>
            </div>
          </section>

          <section className="alfa-section alfa-container alfa-research alfa-research-narrative" id="investigacion" tabIndex={-1} aria-labelledby="alfa-research-title">
            <div className="alfa-research-intro"><p className="alfa-eyebrow">02 / NUESTRAS LÍNEAS</p><h2 id="alfa-research-title" className="alfa-display">La curiosidad<br />no tiene una<br />sola forma.</h2></div>
            <div className="alfa-research-body">
              <div className="alfa-research-visual"><div className="alfa-research-orbit">
                <ResearchConnections />
                <nav className="alfa-story-index" aria-label="Recorrido por las líneas de investigación">
                  {researchLines.map((line, index) => <a href={`#linea-${line.id}`} data-story-link key={line.id}><span>0{index + 1}</span>{["Software", "IA", "IoT", "Investigación"][index] ?? line.name}<span className="alfa-story-index-track" aria-hidden="true" /></a>)}
                </nav>
              </div></div>
              <div className="alfa-research-steps">{researchLines.map((line, index) => {
                const copy = lineCopy[line.id] ?? { title: line.name, text: line.description };
                const concepts = ["Pensar. Diseñar. Programar.", "Aprender de las conexiones.", "Del mundo físico al mundo digital.", "Observar. Experimentar. Descubrir."];
                return <article id={`linea-${line.id}`} tabIndex={-1} className="alfa-research-step" data-motion-side={index % 2 ? "right" : "left"} key={line.id} aria-labelledby={`titulo-linea-${line.id}`}>
                  <div className="alfa-chapter-stage" data-particle-anchor aria-hidden="true" />
                  <div className="alfa-research-step-copy">
                    <p className="alfa-chapter-eyebrow"><span>0{index + 1}</span> / 0{researchLines.length}<span className="alfa-chapter-rule" aria-hidden="true" /></p>
                    <h3 id={`titulo-linea-${line.id}`}>{copy.title}</h3>
                    <p className="alfa-body">{copy.text}</p>
                    <p className="alfa-chapter-concept">{concepts[index]}</p>
                    <Link href="/investigacion" className="alfa-text-link">Explorar esta línea <ArrowUpRight size={17} aria-hidden="true" /></Link>
                  </div>
                </article>;
              })}</div>
            </div>
          </section>

          <section className="alfa-section alfa-container alfa-projects" id="proyectos" tabIndex={-1} aria-labelledby="alfa-projects-title">
            <div className="alfa-projects-heading alfa-reveal"><div><p className="alfa-eyebrow">03 / IDEAS EN MOVIMIENTO</p><h2 id="alfa-projects-title" className="alfa-display">Preguntas reales.<br />Ideas en marcha.</h2></div><p className="alfa-body">Preguntas que toman forma en código, prototipos y experiencias. Una selección de lo que estamos explorando.</p></div>
            <div className="alfa-project-list">{selectedProjects.map((project, index) => <article className="alfa-project" data-motion-side={index % 2 ? "left" : "right"} data-project-form={[4, 2, 3][index]} key={project.id}>
              <div className="alfa-project-stage" data-particle-anchor aria-hidden="true" />
              <div className="alfa-project-copy">
              <div className="alfa-project-meta"><span className="alfa-index">0{index + 1}</span><span>{statuses[project.status] ?? project.status}</span></div>
              <div className="alfa-project-main"><h3><Link href={`/proyectos/${project.slug}`}>{projectCopy[project.id]?.title ?? project.name}</Link></h3><span className="alfa-project-discipline">{project.researchLines.map((line) => lineCopy[line.id]?.title ?? line.name).join(" / ")}</span></div>
              <div className="alfa-project-description"><p className="alfa-body">{projectCopy[project.id]?.summary ?? project.summary}</p><Link href={`/proyectos/${project.slug}`} className="alfa-text-link" aria-label={`Explorar proyecto: ${project.name}`}>Explorar proyecto <ArrowUpRight size={18} aria-hidden="true" /></Link></div>
              </div>
            </article>)}</div>
            <Link href="/proyectos" className="alfa-text-link alfa-all-projects">Ver todo el portafolio <ArrowRight size={18} aria-hidden="true" /></Link>
          </section>

          <section className="alfa-section alfa-container alfa-method" aria-labelledby="alfa-method-title">
            <div className="alfa-method-copy"><p className="alfa-eyebrow">04 / NUESTRA FORMA DE HACER</p><h2 id="alfa-method-title" className="alfa-display">La mejor manera<br />de aprender<br />es hacer.</h2><ArrowDownRight size={62} strokeWidth={1} className="alfa-method-arrow" aria-hidden="true" /><div className="alfa-method-stage" data-particle-anchor aria-hidden="true" /></div>
            <div className="alfa-method-steps alfa-reveal">{[
              ["Preguntamos.", "Observamos el contexto, escuchamos a las personas y buscamos entender el problema antes de proponer una respuesta."],
              ["Experimentamos.", "Diseñamos, programamos y ponemos a prueba nuestras ideas. Lo que no funciona también nos enseña."],
              ["Compartimos.", "Documentamos el proceso y conectamos los hallazgos con otras personas. El conocimiento se vuelve más útil cuando circula."],
            ].map(([title, text], index) => <div className="alfa-method-step" key={title}><span className="alfa-index">0{index + 1}</span><div><h3>{title}</h3><p className="alfa-body">{text}</p></div></div>)}</div>
          </section>

          <section className="alfa-invitation alfa-container" aria-labelledby="alfa-invitation-title"><div className="alfa-invitation-stage" data-particle-anchor aria-hidden="true" /><p className="alfa-eyebrow">LO QUE VIENE, LO CONSTRUIMOS JUNTOS.</p><h2 id="alfa-invitation-title">Una buena idea<br />empieza con<br /><span>una conversación.</span></h2><Link href="/contacto" className="alfa-primary-link">Conversemos <ArrowUpRight size={18} aria-hidden="true" /></Link></section>
        </main>

        <footer className="alfa-footer alfa-container"><div className="alfa-footer-top"><div><a href="#inicio" aria-label="Volver al inicio de AlfaCode"><AlfaCodeLogo tone="on-blue" width={210} height={63} /></a><p>Investigamos en colectivo.<br />Construimos con propósito.</p></div><nav aria-label="Explora AlfaCode"><span>EXPLORA</span><Link href="/proyectos">Proyectos</Link><Link href="/investigacion">Investigación</Link><Link href="/equipo">Equipo</Link></nav><nav aria-label="Conecta con AlfaCode"><span>CONECTA</span><Link href="/contacto">Hablemos <ArrowUpRight size={14} aria-hidden="true" /></Link><Link href="/ingresar">Entrar al HUB <ArrowUpRight size={14} aria-hidden="true" /></Link><Link href="/publicaciones">Publicaciones</Link></nav></div><div className="alfa-footer-bottom"><span>© {new Date().getUTCFullYear()} AlfaCode.</span><a href="/visuals/cortex-NOTICE.txt" target="_blank" rel="noopener noreferrer">Créditos visuales</a><a href="#inicio">Volver arriba <ArrowUpRight size={13} aria-hidden="true" /></a></div></footer>
      </AlfaLandingExperience>
    </div>
  );
}
