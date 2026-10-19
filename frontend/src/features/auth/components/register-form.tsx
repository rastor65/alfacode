"use client";

import {
  Award,
  BookOpen,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Cpu,
  GraduationCap,
  IdCard,
  Layers,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  QrCode,
  ShieldCheck,
  Sparkles,
  Tag,
  User,
  UserCheck,
  Wand2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";

import { AlfaCodeSymbol } from "@/components/brand/alfacode-logo";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField, TextAreaField } from "@/components/ui/form-field";
import { apiRequest } from "@/lib/api/client";
import { describeError, fieldErrorMessages } from "@/lib/api/errors";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

interface ResearchLineItem {
  id: string;
  title: string;
  tagline: string;
  description: string;
  icon: typeof Brain;
  badge: string;
  tags: string[];
}

const RESEARCH_LINES: ResearchLineItem[] = [
  {
    id: "Inteligencia Artificial",
    title: "Inteligencia Artificial",
    tagline: "Machine Learning, LLMs & Visión Artificial",
    description: "Desarrollo de agentes autónomos, modelos generativos, NLP y análisis de datos aplicados.",
    icon: Brain,
    badge: "IA & Data Science",
    tags: ["Python", "PyTorch", "LLMs", "Computer Vision", "FastAPI"],
  },
  {
    id: "Desarrollo de Software",
    title: "Desarrollo de Software",
    tagline: "Cloud Native, Fullstack & Arquitectura",
    description: "Construcción de aplicaciones distribuidas modernas con TypeScript, microservicios, seguridad y DevOps.",
    icon: Code2,
    badge: "Modern Web & Cloud",
    tags: ["Next.js", "TypeScript", "Node.js", "PostgreSQL", "Docker"],
  },
  {
    id: "Internet de las Cosas (IoT)",
    title: "Internet de las Cosas (IoT)",
    tagline: "Sistemas Embebidos, Sensores & Hardware",
    description: "Automatización con microcontroladores (ESP32/Arduino), robótica educativa y monitoreo telemétrico.",
    icon: Cpu,
    badge: "Hardware & Robótica",
    tags: ["ESP32 / Arduino", "Robótica", "MQTT", "Sensores", "C++"],
  },
];

const SEDES_UNIGUAJIRA = [
  { id: "Riohacha (Sede Principal)", name: "Riohacha", detail: "Sede Principal · Km 5 Vía a Maicao" },
  { id: "Maicao", name: "Maicao", detail: "Sede Fronteriza · Km 1" },
  { id: "Fonseca", name: "Fonseca", detail: "Sede Provincial Sur" },
  { id: "Villanueva", name: "Villanueva", detail: "Sede Provincial Sur" },
];

const PROGRAMAS_INGENIERIA = [
  { name: "Ingeniería de Sistemas", short: "Sistemas", icon: "💻" },
  { name: "Ingeniería Industrial", short: "Industrial", icon: "📊" },
  { name: "Ingeniería Mecánica", short: "Mecánica", icon: "⚙️" },
  { name: "Ingeniería Civil", short: "Civil", icon: "🏗️" },
];

const SEMESTRES = [
  { num: 1, label: "1° Semestre", cycle: "Fundamentación", pct: 10 },
  { num: 2, label: "2° Semestre", cycle: "Fundamentación", pct: 20 },
  { num: 3, label: "3° Semestre", cycle: "Básicas de Ingeniería", pct: 30 },
  { num: 4, label: "4° Semestre", cycle: "Ciclo Profesional", pct: 40 },
  { num: 5, label: "5° Semestre", cycle: "Ciclo Profesional", pct: 50 },
  { num: 6, label: "6° Semestre", cycle: "Ciclo Profesional", pct: 60 },
  { num: 7, label: "7° Semestre", cycle: "Ciclo Profesional", pct: 70 },
  { num: 8, label: "8° Semestre", cycle: "Ciclo Avanzado", pct: 80 },
  { num: 9, label: "9° Semestre", cycle: "Énfasis y Grado", pct: 90 },
  { num: 10, label: "10° Semestre", cycle: "Práctica / Grado", pct: 100 },
];

const SUGGESTED_TAGS = [
  "Python",
  "TypeScript",
  "Next.js",
  "PyTorch",
  "FastAPI",
  "Ciberseguridad",
  "Robótica",
  "Bases de Datos",
  "Docker",
  "Microcontroladores",
  "Cloud",
  "Linux",
  "Tailwind CSS",
  "Git / GitHub",
];

const PROMEDIO_PRESETS = ["3.8", "4.0", "4.2", "4.5"];

function ColombiaFlag({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 900 600"
      className={cn("inline-block rounded-[2px] shadow-xs overflow-hidden shrink-0", className)}
      aria-label="Bandera de Colombia"
    >
      <rect width="900" height="300" fill="#FCD116" />
      <rect y="300" width="900" height="150" fill="#003893" />
      <rect y="450" width="900" height="150" fill="#CE1126" />
    </svg>
  );
}

export function RegisterForm() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [copiedRadicado, setCopiedRadicado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 1. Identificación y contacto
  const [tipoDocumento, setTipoDocumento] = useState<"C.C." | "T.I." | "C.E.">("C.C.");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [celular, setCelular] = useState("");
  const [telefonoFijo, setTelefonoFijo] = useState("");
  const [nacionalidad, setNacionalidad] = useState("Colombiana");
  const [fechaElaboracion] = useState(() => new Date().toISOString().split("T")[0]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // 2. Información académica
  const [facultad] = useState("Facultad de Ingeniería");
  const [programa, setPrograma] = useState("Ingeniería de Sistemas");
  const [isCustomPrograma, setIsCustomPrograma] = useState(false);
  const [sede, setSede] = useState("Riohacha (Sede Principal)");
  const [semestreActual, setSemestreActual] = useState("5° Semestre");
  const [promedioAcademico, setPromedioAcademico] = useState("4.2");

  // 3. Trayectoria y áreas de investigación
  const [selectedLines, setSelectedLines] = useState<string[]>(["Inteligencia Artificial"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Python", "TypeScript", "Next.js"]);
  const [lineasAdicionales, setLineasAdicionales] = useState("");
  const [experienciaInvestigativa, setExperienciaInvestigativa] = useState("");
  const [areasEstudio, setAreasEstudio] = useState("");
  const [publicaciones, setPublicaciones] = useState("");
  const [practicasPasantias, setPracticasPasantias] = useState("");
  const [message, setMessage] = useState("");
  const [showAdvancedCV, setShowAdvancedCV] = useState(false);
  const [showCredentialPreview, setShowCredentialPreview] = useState(false);

  // Efecto de celebración con confeti de partículas canvas cuando done = true
  useEffect(() => {
    if (!done) return;
    const canvas = document.getElementById("celebration-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      rotation: number;
      vRot: number;
    }> = [];

    const colors = ["#06b6d4", "#10b981", "#38bdf8", "#0382a1", "#0284c7", "#ffffff"];
    for (let i = 0; i < 70; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 60,
        y: canvas.height / 3 + (Math.random() - 0.5) * 30,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 1.2) * 5.5,
        size: Math.random() * 4.5 + 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 8,
      });
    }

    let animId: number;
    const start = performance.now();
    function animate(time: number) {
      if (time - start > 3500) return;
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.11;
        p.alpha = Math.max(0, 1 - (time - start) / 3500);
        p.rotation += p.vRot;

        if (ctx) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          ctx.restore();
        }
      });
      animId = requestAnimationFrame(animate);
    }
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [done]);

  // Helpers interactivos
  function toggleLine(lineId: string) {
    setSelectedLines((current) =>
      current.includes(lineId) ? current.filter((item) => item !== lineId) : [...current, lineId],
    );
  }

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  function handleEmailDomainAppend() {
    if (!email) {
      setEmail("@uniguajira.edu.co");
    } else if (!email.includes("@")) {
      setEmail(`${email.trim()}@uniguajira.edu.co`);
    } else if (email.endsWith("@")) {
      setEmail(`${email.trim()}uniguajira.edu.co`);
    }
  }

  const isEmailValidDomain = email.toLowerCase().endsWith("@uniguajira.edu.co");
  const activeSemestreObj = SEMESTRES.find((s) => s.label === semestreActual) || SEMESTRES[4];

  // Índice dinámico de afinidad con el semillero
  const affinityScore = Math.min(
    100,
    selectedLines.length * 28 + selectedTags.length * 4 + (experienciaInvestigativa ? 8 : 0) + (areasEstudio ? 6 : 0)
  );

  // Hash determinista para el folio de radicación oficial
  const radicadoFolio = `ALFA-${new Date().getFullYear()}-${Math.abs(
    (email || "uniguajira").split("").reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0) % 90000 + 10000,
  )}`;

  function handleCopyRadicado() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(radicadoFolio);
      setCopiedRadicado(true);
      setTimeout(() => setCopiedRadicado(false), 2500);
    }
  }

  function validateStep(currentStep: Step): boolean {
    const errors: Record<string, string> = {};
    setError(null);

    if (currentStep === 1) {
      if (!nombres.trim()) errors.nombres = "Ingresa tus nombres completos.";
      if (!apellidos.trim()) errors.apellidos = "Ingresa tus apellidos completos.";
      if (!email.trim()) {
        errors.email = "Ingresa tu correo institucional.";
      } else if (!email.toLowerCase().endsWith("@uniguajira.edu.co")) {
        errors.email = "Solo se admiten correos @uniguajira.edu.co.";
      }
      if (!documentoIdentidad.trim()) errors.documentoIdentidad = "Ingresa tu documento de identidad.";
      if (!fechaNacimiento) errors.fechaNacimiento = "Selecciona tu fecha de nacimiento.";
      if (!celular.trim()) errors.celular = "Ingresa tu celular de contacto.";
    }

    if (currentStep === 2) {
      if (!facultad.trim()) errors.facultad = "Ingresa la facultad.";
      if (!programa.trim()) errors.programa = "Ingresa el programa académico.";
      if (!sede.trim()) errors.sede = "Selecciona la sede.";
      if (!semestreActual.trim()) errors.semestreActual = "Selecciona el semestre actual.";
      if (!promedioAcademico.trim()) errors.promedioAcademico = "Ingresa tu promedio acumulado (Ej. 4.2).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function goToStep(targetStep: Step) {
    if (targetStep < step) {
      setDirection("prev");
      setError(null);
      setFieldErrors({});
      setStep(targetStep);
      return;
    }

    if (targetStep === 2 && validateStep(1)) {
      setDirection("next");
      setStep(2);
    } else if (targetStep === 3 && validateStep(1) && validateStep(2)) {
      setDirection("next");
      setStep(3);
    }
  }

  function handleNext() {
    if (validateStep(step)) {
      setDirection("next");
      setStep((s) => Math.min(s + 1, 3) as Step);
    }
  }

  function handlePrev() {
    setDirection("prev");
    setError(null);
    setFieldErrors({});
    setStep((s) => Math.max(s - 1, 1) as Step);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateStep(3)) return;

    setError(null);
    setFieldErrors({});
    setPending(true);

    const allLines = [...selectedLines];
    if (selectedTags.length > 0) {
      allLines.push(`Intereses: ${selectedTags.join(", ")}`);
    }
    if (lineasAdicionales.trim()) {
      allLines.push(lineasAdicionales.trim());
    }

    const docIdentidadCompleto = `${tipoDocumento} ${documentoIdentidad.trim()}`;
    const fullName = `${nombres.trim()} ${apellidos.trim()}`;

    try {
      await apiRequest("/auth/register", {
        method: "POST",
        body: {
          fullName,
          email: email.trim(),
          ...(message.trim() ? { message: message.trim() } : {}),
          cvData: {
            fechaElaboracion,
            apellidos: apellidos.trim(),
            nombres: nombres.trim(),
            fechaNacimiento,
            nacionalidad: nacionalidad.trim() || "Colombiana",
            documentoIdentidad: docIdentidadCompleto,
            celular: celular.trim(),
            ...(telefonoFijo.trim() ? { telefonoFijo: telefonoFijo.trim() } : {}),
            facultad: facultad.trim(),
            programa: programa.trim(),
            sede: sede.trim(),
            semestreActual: semestreActual.trim(),
            promedioAcademico: promedioAcademico.trim(),
            ...(allLines.length > 0 ? { lineasInvestigacion: allLines.join(", ") } : {}),
            ...(experienciaInvestigativa.trim() ? { experienciaInvestigativa: experienciaInvestigativa.trim() } : {}),
            ...(areasEstudio.trim() ? { areasEstudio: areasEstudio.trim() } : {}),
            ...(publicaciones.trim() ? { publicaciones: publicaciones.trim() } : {}),
            ...(practicasPasantias.trim() ? { practicasPasantias: practicasPasantias.trim() } : {}),
          },
        },
      });
      setDone(true);
    } catch (caught) {
      setFieldErrors(fieldErrorMessages(caught, {}));
      setError(describeError(caught));
    } finally {
      setPending(false);
    }
  }

  // Vista de éxito / Credencial digital oficial de postulación
  if (done) {
    return (
      <div className="relative space-y-6 py-4 text-center animate-in fade-in zoom-in-95 duration-250">
        {/* Canvas de celebración de confeti */}
        <canvas
          id="celebration-canvas"
          className="pointer-events-none absolute inset-0 size-full z-20"
        />

        {/* Cabecera de éxito */}
        <div className="space-y-2">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
            <CheckCircle2 size={32} className="stroke-[2.2]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            ¡Postulación Radicada con Éxito!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Tu hoja de vida institucional fue recibida por la coordinación de <strong>AlfaCode HUB</strong>. Se ha generado tu credencial oficial de postulación:
          </p>
        </div>

        {/* Tarjeta Credencial Digital Holográfica de Postulación */}
        <div className="relative mx-auto max-w-md overflow-hidden rounded-3xl border border-cyan-400/35 bg-gradient-to-b from-slate-900/95 via-slate-950 to-slate-950 p-6 text-left shadow-[0_20px_50px_-10px_rgba(3,130,161,0.3)] backdrop-blur-2xl">
          {/* Línea superior con gradiente cian */}
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          {/* Insignia y Folio */}
          <div className="flex items-start justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-950/80 p-1.5 shadow-[0_0_15px_rgba(3,130,161,0.4)]">
                <AlfaCodeSymbol className="size-full" />
              </span>
              <div>
                <span className="text-xs font-black tracking-tight text-white block">
                  Alfa<span className="text-cyan-400">Code</span> <span className="font-mono text-[10px] text-cyan-300">HUB</span>
                </span>
                <span className="text-[10px] text-slate-400 block font-mono">
                  Universidad de La Guajira
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-mono tracking-wider text-slate-400 block">
                Folio de Radicación
              </span>
              <span className="font-mono text-xs font-bold text-cyan-300">
                {radicadoFolio}
              </span>
            </div>
          </div>

          {/* Datos del Postulante */}
          <div className="py-4 space-y-3">
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                Postulante Oficial
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                {nombres} {apellidos}
              </h3>
              <p className="font-mono text-xs text-cyan-400">
                {email}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Programa & Sede
                </span>
                <span className="font-medium text-slate-200">
                  {programa}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Sede {sede.split(" ")[0]}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block">
                  Nivel Académico
                </span>
                <span className="font-medium text-slate-200">
                  {semestreActual}
                </span>
                <span className="text-[11px] font-semibold text-emerald-400 block">
                  Promedio {promedioAcademico} / 5.0
                </span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1">
                Líneas de Investigación Seleccionadas
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedLines.map((l) => (
                  <span
                    key={l}
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-2.5 py-0.5 text-[10px] font-medium text-cyan-200"
                  >
                    <Sparkles size={9} className="text-cyan-400" />
                    {l}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pie de la Credencial con Sello Criptográfico Simulado */}
          <div className="border-t border-white/10 pt-3 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <QrCode size={16} className="text-cyan-400" />
              <span>RADICADO OFICIAL · 2026</span>
            </div>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              EN REVISIÓN
            </span>
          </div>
        </div>

        {/* Acciones de la confirmación */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleCopyRadicado}
            className="w-full sm:w-auto h-11 px-5 inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-slate-900/80 hover:bg-white/10 active:scale-[0.98] text-xs font-semibold text-slate-200 transition-all cursor-pointer"
          >
            {copiedRadicado ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-emerald-300">¡Folio Copiado al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-cyan-400" />
                <span>Copiar Folio de Radicación</span>
              </>
            )}
          </button>

          <Link
            href="/ingresar"
            style={{ color: "#ffffff" }}
            className="w-full sm:w-auto h-11 px-6 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] text-xs font-semibold !text-[#ffffff] shadow-[0_0_24px_rgba(6,182,212,0.3)] transition-all"
          >
            <span className="!text-[#ffffff]">Ir al Portal de Miembros</span>
            <ChevronRight size={15} className="!text-[#ffffff]" />
          </Link>
        </div>
      </div>
    );
  }

  // Indicador de nivel de promedio
  const numPromedio = Number.parseFloat(promedioAcademico);
  const promedioStatus =
    !Number.isNaN(numPromedio) && numPromedio >= 4.5
      ? { label: "⭐ Excelencia Académica", color: "text-emerald-500 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10" }
      : !Number.isNaN(numPromedio) && numPromedio >= 4.0
        ? { label: "✨ Alto Rendimiento", color: "text-cyan-600 dark:text-cyan-400 border-cyan-500/30 bg-cyan-500/10" }
        : !Number.isNaN(numPromedio) && numPromedio >= 3.5
          ? { label: "👍 Buen Desempeño", color: "text-teal-600 dark:text-teal-400 border-teal-500/30 bg-teal-500/10" }
          : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* STEPPER ELEGANTE APPLE / LINEAR (SEGMENTED TABS)     */}
      {/* ---------------------------------------------------- */}
      <nav aria-label="Progreso de postulación" className="space-y-3">
        {/* Estimador de tiempo y porcentaje */}
        <div className="flex items-center justify-between text-xs px-0.5">
          <div className="flex items-center gap-1.5 font-mono text-hub-accent font-semibold">
            <Clock size={13} className="animate-pulse" />
            <span>Tiempo estimado: ~2 minutos</span>
          </div>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-hub-muted bg-hub-subtle px-2.5 py-0.5 rounded-full border border-hub-border">
            <span>Paso {step} de 3</span>
            <span className="text-hub-accent font-mono font-bold">
              ({step === 1 ? "33%" : step === 2 ? "66%" : "100%"})
            </span>
          </span>
        </div>

        {/* 3 Barras segmentadas interactivas */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { s: 1, title: "01 Identificación", icon: User },
            { s: 2, title: "02 Académico", icon: GraduationCap },
            { s: 3, title: "03 Investigación", icon: Sparkles },
          ].map(({ s, title, icon: IconComponent }) => {
            const isCompleted = step > s;
            const isCurrent = step === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => goToStep(s as Step)}
                className={cn(
                  "group relative flex flex-col gap-1.5 rounded-xl p-2 sm:p-2.5 text-left transition-all duration-200 cursor-pointer border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500",
                  isCurrent
                    ? "border-cyan-500/60 bg-cyan-500/10 shadow-xs"
                    : isCompleted
                      ? "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50"
                      : "border-hub-border bg-hub-subtle/50 opacity-60 hover:opacity-100",
                )}
              >
                {/* Track horizontal superior */}
                <div className="h-1 w-full rounded-full bg-hub-border overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      isCompleted
                        ? "w-full bg-emerald-500"
                        : isCurrent
                          ? "w-full bg-gradient-to-r from-cyan-500 to-teal-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"
                          : "w-0",
                    )}
                  />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className={cn(
                      "flex size-4 sm:size-4.5 shrink-0 items-center justify-center rounded-full text-[10px]",
                      isCompleted
                        ? "bg-emerald-500 !text-[#ffffff]"
                        : isCurrent
                          ? "bg-cyan-500 !text-[#ffffff] shadow-xs"
                          : "bg-hub-hover text-hub-muted",
                    )}
                  >
                    {isCompleted ? <Check size={10} className="stroke-[3]" /> : <IconComponent size={10} />}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] sm:text-xs font-bold truncate",
                      isCurrent
                        ? "text-hub-accent"
                        : isCompleted
                          ? "text-hub-text"
                          : "text-hub-muted",
                    )}
                  >
                    {title}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </nav>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ---------------------------------------------------- */}
      {/* PASO 1: IDENTIFICACIÓN Y CONTACTO                    */}
      {/* ---------------------------------------------------- */}
      {step === 1 && (
        <div
          className={cn(
            "space-y-5 pt-1 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3",
          )}
        >
          {/* Subcabecera conversacional del paso */}
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-hub-accent">
              Fase 01 · Identificación Personal
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-hub-text tracking-tight">
              ¿Cómo te llamas y cómo te contactamos?
            </h2>
            <p className="text-xs sm:text-sm text-hub-muted leading-relaxed">
              Datos oficiales requeridos para radicar tu postulación al semillero de investigación.
            </p>
          </div>

          {/* Sección 1: Datos Personales */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 pb-1 border-b border-hub-border text-xs font-bold text-hub-text">
              <User size={14} className="text-hub-accent" />
              <span>Identidad del Postulante</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <FormField
                label="Nombres *"
                name="nombres"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                placeholder="Ej. Juan Carlos"
                icon={<User size={15} aria-hidden="true" />}
                required
                error={fieldErrors.nombres}
              />
              <FormField
                label="Apellidos *"
                name="apellidos"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                placeholder="Ej. Pérez Gómez"
                icon={<UserCheck size={15} aria-hidden="true" />}
                required
                error={fieldErrors.apellidos}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* Documento de Identidad con selector de tipo integrado */}
              <div className="sm:col-span-7 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-hub-text">
                    Documento de identidad *
                  </label>
                  <div className="flex items-center gap-1">
                    {(["C.C.", "T.I.", "C.E."] as const).map((tipo) => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => setTipoDocumento(tipo)}
                        className={cn(
                          "px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer border",
                          tipoDocumento === tipo
                            ? "border-cyan-500 bg-cyan-500 !text-[#ffffff] shadow-xs"
                            : "border-hub-border bg-hub-subtle text-hub-muted hover:text-hub-text hover:bg-hub-hover",
                        )}
                        style={tipoDocumento === tipo ? { color: "#ffffff" } : undefined}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>
                <FormField
                  label=""
                  name="documentoIdentidad"
                  value={documentoIdentidad}
                  onChange={(e) => setDocumentoIdentidad(e.target.value)}
                  placeholder={`Número de ${tipoDocumento}`}
                  icon={<IdCard size={15} aria-hidden="true" />}
                  required
                  error={fieldErrors.documentoIdentidad}
                />
              </div>

              <div className="sm:col-span-5">
                <FormField
                  label="Fecha de nacimiento *"
                  name="fechaNacimiento"
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                  icon={<Calendar size={15} aria-hidden="true" />}
                  required
                  error={fieldErrors.fechaNacimiento}
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Canales de Contacto */}
          <div className="space-y-3.5 pt-2">
            <div className="flex items-center gap-2 pb-1 border-b border-hub-border text-xs font-bold text-hub-text">
              <Mail size={14} className="text-hub-accent" />
              <span>Canales de Contacto Oficial</span>
            </div>

            <FormField
              label="Correo institucional *"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@uniguajira.edu.co"
              icon={<Mail size={15} aria-hidden="true" />}
              badge={
                isEmailValidDomain ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck size={11} className="stroke-[2.5]" /> Dominio Verificado
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleEmailDomainAppend}
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-hub-accent hover:underline cursor-pointer bg-hub-accent-soft px-2 py-0.5 rounded-full border border-hub-border"
                  >
                    <Wand2 size={10} />
                    <span>+ @uniguajira.edu.co</span>
                  </button>
                )
              }
              hint="Solo se admiten correos oficiales @uniguajira.edu.co."
              required
              error={fieldErrors.email}
            />

            <FormField
              label="Celular de contacto *"
              name="celular"
              type="tel"
              inputMode="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="300 123 4567"
              icon={<Phone size={15} aria-hidden="true" />}
              badge={
                <span className="inline-flex items-center gap-1.5 rounded-md bg-hub-subtle border border-hub-border px-2 py-0.5 text-[10px] font-mono font-semibold text-hub-text">
                  <ColombiaFlag className="w-3.5 h-2.5" />
                  <span>+57 COL</span>
                </span>
              }
              hint="Número activo para notificaciones y convocatorias."
              required
              error={fieldErrors.celular}
            />
          </div>

          {/* Fila de campos opcionales secundarios */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowOptionalFields((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-hub-accent hover:underline cursor-pointer font-semibold"
            >
              <span>{showOptionalFields ? "Ocultar teléfono fijo y nacionalidad" : "+ Agregar teléfono fijo o modificar nacionalidad"}</span>
            </button>

            {showOptionalFields && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 rounded-2xl border border-hub-border bg-hub-subtle/50 p-4 animate-in fade-in-50 duration-150">
                <FormField
                  label="Teléfono fijo (opcional)"
                  name="telefonoFijo"
                  type="tel"
                  inputMode="tel"
                  value={telefonoFijo}
                  onChange={(e) => setTelefonoFijo(e.target.value)}
                  placeholder="(605) 727 0000"
                  icon={<PhoneCall size={15} aria-hidden="true" />}
                />
                <FormField
                  label="Nacionalidad"
                  name="nacionalidad"
                  value={nacionalidad}
                  onChange={(e) => setNacionalidad(e.target.value)}
                  placeholder="Colombiana"
                />
              </div>
            )}
          </div>

          <div className="pt-3">
            <button
              type="button"
              onClick={handleNext}
              style={{ color: "#ffffff" }}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] !text-[#ffffff] font-bold text-sm shadow-md shadow-cyan-500/25 transition-all duration-150 cursor-pointer"
            >
              <span className="!text-[#ffffff]">Continuar a información académica</span>
              <ChevronRight size={16} className="!text-[#ffffff]" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 2: INFORMACIÓN ACADÉMICA UNIGUAJIRA             */}
      {/* ---------------------------------------------------- */}
      {step === 2 && (
        <div
          className={cn(
            "space-y-5 pt-1 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3",
          )}
        >
          {/* Subcabecera conversacional del paso */}
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-hub-accent">
              Fase 02 · Trayectoria Académica
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-hub-text tracking-tight">
              Tu trayectoria en Uniguajira
            </h2>
            <p className="text-xs sm:text-sm text-hub-muted leading-relaxed">
              Programa de ingeniería, sede de estudios, semestre y rendimiento acumulado.
            </p>
          </div>

          {/* Selector de Programa de Ingeniería con Cards */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-hub-text">
              Programa académico *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PROGRAMAS_INGENIERIA.map((item) => {
                const isSelected = programa === item.name && !isCustomPrograma;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setPrograma(item.name);
                      setIsCustomPrograma(false);
                    }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl p-3 text-left transition-all duration-150 cursor-pointer border active:scale-[0.98]",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 text-hub-text shadow-xs ring-2 ring-cyan-500/40 font-bold"
                        : "border-hub-border bg-hub-input text-hub-text hover:bg-hub-hover",
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <div className="min-w-0">
                      <span className="text-xs block truncate leading-tight">
                        {item.short}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Input para personalizar o escribir otro programa */}
            <div className="pt-1">
              <FormField
                label="Nombre exacto del programa registrado en Uniguajira"
                name="programa"
                value={programa}
                onChange={(e) => {
                  setPrograma(e.target.value);
                  setIsCustomPrograma(true);
                }}
                placeholder="Ingeniería de Sistemas"
                icon={<BookOpen size={15} aria-hidden="true" />}
                required
                error={fieldErrors.programa}
              />
            </div>
          </div>

          {/* Selector de Sede Uniguajira Interactivo */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-hub-text">
              Sede Uniguajira *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {SEDES_UNIGUAJIRA.map((item) => {
                const isSelected = sede === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSede(item.id)}
                    className={cn(
                      "flex flex-col items-start justify-between rounded-xl p-3 text-left transition-all duration-150 cursor-pointer border active:scale-[0.98]",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 text-hub-text shadow-xs ring-2 ring-cyan-500/40"
                        : "border-hub-border bg-hub-input text-hub-text hover:bg-hub-hover",
                    )}
                  >
                    <div className="flex w-full items-center justify-between mb-1.5">
                      <MapPin
                        size={15}
                        className={isSelected ? "text-hub-accent" : "text-hub-muted"}
                      />
                      {isSelected && (
                        <div className="flex size-4 items-center justify-center rounded-full bg-cyan-500 !text-[#ffffff]">
                          <Check size={10} className="stroke-[3] !text-[#ffffff]" />
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-xs text-hub-text leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-hub-muted truncate w-full">
                      {item.detail}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.sede && (
              <p className="text-xs text-hub-field-error font-medium">{fieldErrors.sede}</p>
            )}
          </div>

          {/* Selector de Semestre Segmentado con Barra de Progreso y Marcadores */}
          <div className="space-y-3 rounded-2xl border border-hub-border bg-hub-subtle/50 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap size={15} className="text-hub-accent" />
                <span className="text-xs font-bold text-hub-text">
                  Semestre en curso *
                </span>
              </div>
              <span className="text-xs font-bold text-hub-accent font-mono">
                {semestreActual}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 pt-1">
              {SEMESTRES.map((sem) => {
                const isSelected = semestreActual === sem.label;
                return (
                  <button
                    key={sem.num}
                    type="button"
                    onClick={() => setSemestreActual(sem.label)}
                    aria-label={`Seleccionar ${sem.label}`}
                    className={cn(
                      "h-10 flex flex-col items-center justify-center rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer border active:scale-[0.98]",
                      isSelected
                        ? "border-cyan-500 bg-gradient-to-b from-cyan-600 to-cyan-500 !text-[#ffffff] shadow-md scale-105"
                        : "border-hub-border bg-hub-input text-hub-text hover:bg-hub-hover",
                    )}
                    style={isSelected ? { color: "#ffffff" } : undefined}
                  >
                    <span className={isSelected ? "!text-[#ffffff]" : undefined}>{sem.num}°</span>
                  </button>
                );
              })}
            </div>

            {/* Barra de progreso de avance curricular */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] text-hub-muted">
                <span>{activeSemestreObj.cycle}</span>
                <span className="font-semibold text-hub-text">~{activeSemestreObj.pct}% avance de carrera</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-hub-border overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 transition-all duration-300"
                  style={{ width: `${activeSemestreObj.pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Promedio Académico con Medidor Interactivo y Presets */}
          <div className="space-y-3 rounded-2xl border border-hub-border bg-hub-subtle/50 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={15} className="text-hub-accent" />
                <span className="text-xs font-bold text-hub-text">
                  Promedio académico acumulado *
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black font-mono text-hub-text">
                  {promedioAcademico || "0.0"}
                </span>
                <span className="text-xs font-mono text-hub-muted">/ 5.0</span>
                {promedioStatus && (
                  <span className={cn("ml-2 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", promedioStatus.color)}>
                    {promedioStatus.label}
                  </span>
                )}
              </div>
            </div>

            {/* Slider interactivo de promedio */}
            <div className="space-y-1 pt-1">
              <input
                type="range"
                min="3.0"
                max="5.0"
                step="0.1"
                value={promedioAcademico || "4.0"}
                onChange={(e) => setPromedioAcademico(e.target.value)}
                className="w-full h-2 rounded-lg bg-hub-border accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-hub-muted font-mono px-0.5">
                <span>3.0</span>
                <span>3.5</span>
                <span>4.0</span>
                <span>4.5</span>
                <span>5.0</span>
              </div>
            </div>

            {/* Botones de sugerencia rápida */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-hub-muted shrink-0">Valores frecuentes:</span>
              {PROMEDIO_PRESETS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPromedioAcademico(val)}
                  className={cn(
                    "flex-1 h-7 rounded-lg border text-xs font-mono font-medium transition-colors cursor-pointer",
                    promedioAcademico === val
                      ? "border-cyan-500 bg-cyan-500/20 text-hub-accent font-bold ring-1 ring-cyan-500/30"
                      : "border-hub-border bg-hub-input text-hub-text hover:border-cyan-500/50",
                  )}
                >
                  {val}
                </button>
              ))}
              <input
                type="text"
                value={promedioAcademico}
                onChange={(e) => setPromedioAcademico(e.target.value)}
                placeholder="Manual"
                className="w-16 h-7 rounded-lg border border-hub-input-border bg-hub-input px-2 text-xs font-mono text-center text-hub-text focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl border border-hub-border bg-hub-input hover:bg-hub-hover active:scale-[0.98] text-hub-text font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer shadow-xs"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              style={{ color: "#ffffff" }}
              className="flex-[2] h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] !text-[#ffffff] font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/25 transition-all duration-150 cursor-pointer"
            >
              <span className="!text-[#ffffff]">Continuar a perfil investigativo</span>
              <ChevronRight size={16} className="!text-[#ffffff]" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 3: TRAYECTORIA Y PERFIL INVESTIGATIVO           */}
      {/* ---------------------------------------------------- */}
      {step === 3 && (
        <div
          className={cn(
            "space-y-5 pt-1 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3",
          )}
        >
          {/* Subcabecera conversacional del paso */}
          <div className="space-y-1">
            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-wider text-hub-accent">
              Fase 03 · Líneas de Investigación
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-hub-text tracking-tight">
              Tus intereses y motivación en AlfaCode
            </h2>
            <p className="text-xs sm:text-sm text-hub-muted leading-relaxed">
              Elige tus líneas de interés y cuéntanos sobre tus pasiones y proyectos.
            </p>
          </div>

          {/* Medidor dinámico de Afinidad Investigativa */}
          <div className="rounded-2xl border border-hub-border bg-hub-subtle/50 p-4 space-y-2 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-hub-text flex items-center gap-1.5">
                <Zap size={14} className="text-hub-accent" />
                <span>Afinidad estimada con AlfaCode</span>
              </span>
              <span className="font-bold font-mono text-hub-accent">{affinityScore}% Match</span>
            </div>
            <div className="h-2 w-full rounded-full bg-hub-border overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${affinityScore}%` }}
              />
            </div>
            <p className="text-[11px] text-hub-muted leading-relaxed">
              {affinityScore >= 80
                ? "🚀 Perfil de alta afinidad: tus intereses coinciden con los proyectos activos del semillero."
                : "💡 Selecciona tus líneas y tecnologías clave para maximizar tu compatibilidad."}
            </p>
          </div>

          {/* Líneas de Investigación Oficiales en Tarjetas Ricas */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-hub-text">
                Líneas oficiales del semillero AlfaCode *
              </label>
              <span className="text-[11px] font-bold text-hub-accent font-mono">
                {selectedLines.length} seleccionada(s)
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {RESEARCH_LINES.map((item) => {
                const isSelected = selectedLines.includes(item.id);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLine(item.id)}
                    className={cn(
                      "group flex items-start gap-3.5 rounded-2xl p-4 text-left transition-all duration-150 cursor-pointer border active:scale-[0.99]",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 shadow-xs ring-2 ring-cyan-500/30"
                        : "border-hub-border bg-hub-input hover:bg-hub-hover",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-11 shrink-0 items-center justify-center rounded-xl transition-all",
                        isSelected
                          ? "bg-gradient-to-tr from-cyan-600 to-cyan-400 !text-[#ffffff] shadow-md"
                          : "bg-hub-subtle text-hub-muted group-hover:text-cyan-500",
                      )}
                      style={isSelected ? { color: "#ffffff" } : undefined}
                    >
                      <IconComponent size={22} className={isSelected ? "!text-[#ffffff]" : undefined} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="font-bold text-xs sm:text-sm text-hub-text">
                            {item.title}
                          </span>
                          <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-hub-accent">
                            · {item.badge}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "flex size-5 items-center justify-center rounded-md border transition-colors shrink-0",
                            isSelected
                              ? "border-cyan-500 bg-cyan-500 !text-[#ffffff]"
                              : "border-hub-border bg-transparent",
                          )}
                          style={isSelected ? { color: "#ffffff" } : undefined}
                        >
                          {isSelected && <Check size={12} className="stroke-[3] !text-[#ffffff]" />}
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-hub-muted leading-relaxed">
                        {item.description}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((t) => (
                          <span
                            key={t}
                            className="rounded px-1.5 py-0.5 text-[9px] font-mono bg-hub-subtle text-hub-muted border border-hub-border"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Interactivos de Tecnologías */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-hub-text">
                Herramientas y tecnologías de interés
              </label>
              <span className="text-[11px] text-hub-muted">
                {selectedTags.length} activas
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all duration-150 cursor-pointer border active:scale-[0.97]",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/20 text-hub-accent font-bold ring-1 ring-cyan-500/40"
                        : "border-hub-border bg-hub-subtle text-hub-text hover:bg-hub-hover",
                    )}
                  >
                    <Tag size={10} className={isSelected ? "text-cyan-500" : "text-hub-muted"} />
                    <span>{tag}</span>
                    {isSelected && <Check size={10} className="stroke-[3]" />}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={lineasAdicionales}
              onChange={(e) => setLineasAdicionales(e.target.value)}
              placeholder="Otras herramientas o áreas de interés (ej. Rust, Ciberseguridad, Redes neuronales)..."
              className="block w-full h-10 rounded-xl border border-hub-input-border bg-hub-input px-3.5 text-xs sm:text-sm text-hub-text placeholder:text-hub-muted shadow-xs transition-all focus:border-cyan-500 focus:bg-hub-input focus:ring-4 focus:ring-cyan-500/15 focus:outline-none"
            />
          </div>

          {/* Textareas para experiencia y áreas de estudio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <TextAreaField
              label="Experiencia o proyectos previos"
              name="experienciaInvestigativa"
              value={experienciaInvestigativa}
              onChange={(e) => setExperienciaInvestigativa(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Proyectos de clase, desarrollos personales, ferias o hackathons..."
            />
            <TextAreaField
              label="Temas o áreas que deseas profundizar"
              name="areasEstudio"
              value={areasEstudio}
              onChange={(e) => setAreasEstudio(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Algoritmos, frameworks, arquitecturas o metodologías..."
            />
          </div>

          <TextAreaField
            label="Motivación para ingresar a AlfaCode (opcional)"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="¿Qué esperas aprender y aportar al semillero de investigación?"
          />

          {/* Progressive disclosure: Publicaciones y pasantías */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvancedCV((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-hub-accent hover:underline cursor-pointer font-semibold"
            >
              <span>{showAdvancedCV ? "Ocultar publicaciones y pasantías" : "+ ¿Tienes publicaciones científicas o pasantías previas?"}</span>
            </button>

            {showAdvancedCV && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3.5 animate-in fade-in-50 duration-150">
                <TextAreaField
                  label="Publicaciones científicas (si aplica)"
                  name="publicaciones"
                  value={publicaciones}
                  onChange={(e) => setPublicaciones(e.target.value)}
                  rows={2}
                  maxLength={800}
                  placeholder="Artículos, posters o ponencias..."
                />
                <TextAreaField
                  label="Prácticas o pasantías (si aplica)"
                  name="practicasPasantias"
                  value={practicasPasantias}
                  onChange={(e) => setPracticasPasantias(e.target.value)}
                  rows={2}
                  maxLength={800}
                  placeholder="Empresas, laboratorios o instituciones..."
                />
              </div>
            )}
          </div>

          {/* Botón para previsualizar Carnet Oficial antes de radicar */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowCredentialPreview((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-hub-accent hover:underline cursor-pointer font-bold"
            >
              <QrCode size={13} />
              <span>{showCredentialPreview ? "Ocultar carnet preliminar" : "👁️ Ver vista previa de tu Credencial de Postulación"}</span>
            </button>

            {showCredentialPreview && (
              <div className="mt-3 rounded-2xl border border-hub-border bg-hub-panel p-4 text-left space-y-2 animate-in fade-in-50 duration-150 shadow-md">
                <div className="flex items-center justify-between border-b border-hub-border pb-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-6 items-center justify-center rounded-lg bg-cyan-500/10 p-1 border border-cyan-500/30">
                      <AlfaCodeSymbol className="size-full" />
                    </span>
                    <span className="text-xs font-bold text-hub-text">AlfaCode HUB · Credencial Preliminar</span>
                  </div>
                  <span className="text-[10px] font-mono text-hub-accent font-bold">PREVIEW</span>
                </div>
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-hub-text text-sm">{nombres || "Estudiante"} {apellidos}</p>
                  <p className="font-mono text-hub-accent text-[11px]">{email || "usuario@uniguajira.edu.co"}</p>
                  <p className="text-hub-muted text-[11px]">{programa} · Sede {sede.split(" ")[0]} · {semestreActual}</p>
                  <p className="text-teal-600 dark:text-teal-400 text-[11px] font-medium">Líneas: {selectedLines.join(", ")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Ficha Pre-Envío Holográfica de Confirmación */}
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-xs text-hub-text space-y-1.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-hub-accent" />
                <span className="font-bold text-hub-text">
                  {nombres || "Estudiante"} {apellidos}
                </span>
                <span className="text-hub-muted">· {programa}</span>
              </div>
              <span className="font-mono text-[10px] text-hub-accent font-bold">Sede {sede.split(" ")[0]}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-hub-muted pt-0.5 border-t border-hub-border">
              <span>{semestreActual} · Promedio {promedioAcademico || "N/A"}</span>
              <span className="text-teal-600 dark:text-teal-300 font-medium">{selectedLines.join(", ")}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl border border-hub-border bg-hub-input hover:bg-hub-hover active:scale-[0.98] text-hub-text font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 shadow-xs"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Radicando postulación..."
              style={{ color: "#ffffff" }}
              className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] !text-[#ffffff] font-bold text-xs sm:text-sm shadow-md shadow-cyan-500/25 transition-all duration-150 cursor-pointer"
            >
              <span className="flex items-center justify-center gap-1.5 !text-[#ffffff]">
                <span className="!text-[#ffffff]">Radicar postulación oficial</span>
                <Sparkles size={16} className="ml-1 text-cyan-100" />
              </span>
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
