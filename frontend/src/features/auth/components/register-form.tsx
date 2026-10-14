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
  Code2,
  Cpu,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  School,
  Sparkles,
  Tag,
  User,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { type FormEvent, useState } from "react";

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
  description: string;
  icon: typeof Brain;
  gradient: string;
}

const RESEARCH_LINES: ResearchLineItem[] = [
  {
    id: "Inteligencia Artificial",
    title: "Inteligencia Artificial",
    description: "Machine Learning, Modelos de Lenguaje (LLMs), Computer Vision y Agentes Autónomos.",
    icon: Brain,
    gradient: "from-cyan-500/20 to-sky-500/10 border-cyan-500/40 text-cyan-400",
  },
  {
    id: "Desarrollo de Software",
    title: "Desarrollo de Software",
    description: "Arquitectura Cloud, Fullstack moderno, APIs reactivas, TypeScript y DevOps.",
    icon: Code2,
    gradient: "from-blue-500/20 to-cyan-500/10 border-blue-500/40 text-blue-400",
  },
  {
    id: "Internet de las Cosas (IoT)",
    title: "Internet de las Cosas (IoT)",
    description: "Sistemas embebidos, Sensores inteligentes, Automatización y Robótica aplicada.",
    icon: Cpu,
    gradient: "from-teal-500/20 to-emerald-500/10 border-teal-500/40 text-teal-400",
  },
];

const SEDES_UNIGUAJIRA = [
  { id: "Riohacha (Sede Principal)", name: "Riohacha", detail: "Sede Principal" },
  { id: "Maicao", name: "Maicao", detail: "Sede Provincial" },
  { id: "Fonseca", name: "Fonseca", detail: "Sede Provincial Sur" },
  { id: "Villanueva", name: "Villanueva", detail: "Sede Provincial Sur" },
];

const SEMESTRES = [
  { num: 1, label: "1° Semestre", cycle: "Ciclo Básico" },
  { num: 2, label: "2° Semestre", cycle: "Ciclo Básico" },
  { num: 3, label: "3° Semestre", cycle: "Fundamentación" },
  { num: 4, label: "4° Semestre", cycle: "Ciclo Profesional" },
  { num: 5, label: "5° Semestre", cycle: "Ciclo Profesional" },
  { num: 6, label: "6° Semestre", cycle: "Ciclo Profesional" },
  { num: 7, label: "7° Semestre", cycle: "Ciclo Profesional" },
  { num: 8, label: "8° Semestre", cycle: "Ciclo Avanzado" },
  { num: 9, label: "9° Semestre", cycle: "Énfasis y Grado" },
  { num: 10, label: "10° Semestre", cycle: "Práctica / Grado" },
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
];

const PROMEDIO_PRESETS = ["3.8", "4.0", "4.2", "4.5"];

export function RegisterForm() {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 1. Identificación y contacto
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [email, setEmail] = useState("");
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [celular, setCelular] = useState("");
  const [telefonoFijo, setTelefonoFijo] = useState("");
  const [nacionalidad, setNacionalidad] = useState("Colombiana");
  const [fechaElaboracion, setFechaElaboracion] = useState(() => new Date().toISOString().split("T")[0]);
  const [showMetadataCustomizer, setShowMetadataCustomizer] = useState(false);

  // 2. Información académica
  const [facultad, setFacultad] = useState("Facultad de Ingeniería");
  const [programa, setPrograma] = useState("Ingeniería de Sistemas");
  const [sede, setSede] = useState("Riohacha (Sede Principal)");
  const [semestreActual, setSemestreActual] = useState("5° Semestre");
  const [promedioAcademico, setPromedioAcademico] = useState("");

  // 3. Trayectoria y áreas de investigación
  const [selectedLines, setSelectedLines] = useState<string[]>(["Inteligencia Artificial"]);
  const [selectedTags, setSelectedTags] = useState<string[]>(["Python", "TypeScript"]);
  const [lineasAdicionales, setLineasAdicionales] = useState("");
  const [experienciaInvestigativa, setExperienciaInvestigativa] = useState("");
  const [areasEstudio, setAreasEstudio] = useState("");
  const [publicaciones, setPublicaciones] = useState("");
  const [practicasPasantias, setPracticasPasantias] = useState("");
  const [message, setMessage] = useState("");
  const [showAdvancedCV, setShowAdvancedCV] = useState(false);

  // Helpers de interacción rápida
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
    }
  }

  const isEmailValidDomain = email.toLowerCase().endsWith("@uniguajira.edu.co");

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
            documentoIdentidad: documentoIdentidad.trim(),
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

  // Vista de éxito / confirmación digital de postulación
  if (done) {
    return (
      <div className="space-y-6 py-4 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.25)]">
          <CheckCircle2 size={36} className="stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-0.5 text-xs font-semibold text-emerald-400">
            Postulación Registrada Exitosamente
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            ¡Bienvenido a AlfaCode!
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Tu resumen de hoja de vida institucional ha sido radicado para la vinculación oficial. El comité de investigación revisará tus datos.
          </p>
        </div>

        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-slate-900/60 p-4 text-left text-xs space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400">Postulante:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{nombres} {apellidos}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400">Correo institucional:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-300 font-medium">{email}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400">Programa y Sede:</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{programa} · {sede.split(" ")[0]}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-2">
            <span className="text-slate-500 dark:text-slate-400">Semestre y Promedio:</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">{semestreActual} · Promedio {promedioAcademico}</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-500 dark:text-slate-400">Líneas de interés:</span>
            <span className="font-medium text-teal-600 dark:text-teal-300 text-right">{selectedLines.join(", ")}</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/ingresar"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 px-7 text-xs sm:text-sm font-semibold text-white shadow-[0_0_24px_rgba(6,182,212,0.3)] transition-all duration-150 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98]"
          >
            <span>Ir a iniciar sesión</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  // Indicador de nivel de promedio
  const numPromedio = Number.parseFloat(promedioAcademico);
  const promedioStatus =
    !Number.isNaN(numPromedio) && numPromedio >= 4.5
      ? { label: "⭐ Rendimiento de Excelencia", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" }
      : !Number.isNaN(numPromedio) && numPromedio >= 4.0
        ? { label: "✨ Alto Rendimiento Académico", color: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10" }
        : !Number.isNaN(numPromedio) && numPromedio >= 3.5
          ? { label: "👍 Buen Desempeño", color: "text-teal-400 border-teal-500/30 bg-teal-500/10" }
          : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* STEPPER ELEGANTE APPLE / LINEAR                      */}
      {/* ---------------------------------------------------- */}
      <nav aria-label="Progreso de postulación" className="relative mb-2">
        {/* Línea conectora de fondo */}
        <div className="absolute top-4 left-6 right-6 -translate-y-1/2 h-0.5 bg-slate-200 dark:bg-white/10 -z-0">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-400 transition-all duration-300 ease-out shadow-[0_0_12px_rgba(6,182,212,0.6)]"
            style={{
              width: step === 1 ? "0%" : step === 2 ? "50%" : "100%",
            }}
          />
        </div>

        {/* 3 Nodos interactivos */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Nodo 1 */}
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="group flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                step > 1
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : step === 1
                    ? "bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-4 ring-cyan-500/20"
                    : "border border-white/15 bg-slate-900 text-slate-400",
              )}
            >
              {step > 1 ? <Check size={14} className="stroke-[2.5]" /> : <User size={13} />}
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold tracking-tight transition-colors",
                step === 1
                  ? "text-cyan-600 dark:text-cyan-300"
                  : step > 1
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500",
              )}
            >
              01 Identificación
            </span>
          </button>

          {/* Nodo 2 */}
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="group flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                step > 2
                  ? "bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  : step === 2
                    ? "bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-4 ring-cyan-500/20"
                    : "border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-slate-900 text-slate-400",
              )}
            >
              {step > 2 ? <Check size={14} className="stroke-[2.5]" /> : <GraduationCap size={14} />}
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold tracking-tight transition-colors",
                step === 2
                  ? "text-cyan-600 dark:text-cyan-300"
                  : step > 2
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500",
              )}
            >
              02 Académico
            </span>
          </button>

          {/* Nodo 3 */}
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="group flex flex-col items-center gap-1.5 focus:outline-none cursor-pointer"
          >
            <div
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-200",
                step === 3
                  ? "bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)] ring-4 ring-cyan-500/20"
                  : "border border-slate-300 dark:border-white/15 bg-slate-100 dark:bg-slate-900 text-slate-400",
              )}
            >
              <Sparkles size={13} />
            </div>
            <span
              className={cn(
                "text-[11px] font-semibold tracking-tight transition-colors",
                step === 3
                  ? "text-cyan-600 dark:text-cyan-300"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              03 Investigación
            </span>
          </button>
        </div>
      </nav>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ---------------------------------------------------- */}
      {/* PASO 1: IDENTIFICACIÓN Y CONTACTO                    */}
      {/* ---------------------------------------------------- */}
      {step === 1 && (
        <div
          className={cn(
            "space-y-4 pt-1 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3",
          )}
        >
          {/* Subcabecera conversacional del paso */}
          <div className="border-b border-slate-200 dark:border-white/10 pb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Paso 1 de 3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              ¿Cómo te llamas y cómo te contactamos?
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ingresa tus datos personales y tu correo institucional de la Universidad de La Guajira.
            </p>
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

          {/* Campo de Correo con asistente inteligente de dominio */}
          <div className="space-y-1.5">
            <FormField
              label="Correo electrónico institucional *"
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
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
                    <Check size={10} className="stroke-[3]" /> Dominio Uniguajira
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleEmailDomainAppend}
                    className="text-[10px] font-mono font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                  >
                    + @uniguajira.edu.co
                  </button>
                )
              }
              hint="Solo se admiten cuentas oficiales @uniguajira.edu.co para vincularte al semillero."
              required
              error={fieldErrors.email}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Documento de identidad *"
              name="documentoIdentidad"
              value={documentoIdentidad}
              onChange={(e) => setDocumentoIdentidad(e.target.value)}
              placeholder="Número de C.C. o T.I."
              icon={<IdCard size={15} aria-hidden="true" />}
              required
              error={fieldErrors.documentoIdentidad}
            />
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Celular de contacto *"
              name="celular"
              type="tel"
              inputMode="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="300 123 4567"
              icon={<Phone size={15} aria-hidden="true" />}
              required
              error={fieldErrors.celular}
            />
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
          </div>

          {/* Barra de metadatos institucionales */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/40 px-3.5 py-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Nacionalidad: <strong className="text-slate-700 dark:text-slate-200 font-medium">{nacionalidad}</strong></span>
              <span>·</span>
              <span>Fecha: <strong className="text-slate-700 dark:text-slate-200 font-medium">{fechaElaboracion}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setShowMetadataCustomizer((v) => !v)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium text-[11px]"
            >
              {showMetadataCustomizer ? "Ocultar" : "Modificar"}
            </button>
          </div>

          {showMetadataCustomizer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-in fade-in-50 duration-150">
              <FormField
                label="Nacionalidad"
                name="nacionalidad"
                value={nacionalidad}
                onChange={(e) => setNacionalidad(e.target.value)}
                placeholder="Colombiana"
              />
              <FormField
                label="Fecha de solicitud"
                name="fechaElaboracion"
                type="date"
                value={fechaElaboracion}
                onChange={(e) => setFechaElaboracion(e.target.value)}
              />
            </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] text-white font-semibold text-sm shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] transition-all duration-150 cursor-pointer"
            >
              <span>Continuar a información académica</span>
              <ChevronRight size={16} />
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
            "space-y-4 pt-1 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3",
          )}
        >
          {/* Subcabecera conversacional del paso */}
          <div className="border-b border-slate-200 dark:border-white/10 pb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Paso 2 de 3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Tu trayectoria en la Universidad
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sede institucional, semestre cursado y promedio académico acumulado.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Facultad *"
              name="facultad"
              value={facultad}
              onChange={(e) => setFacultad(e.target.value)}
              placeholder="Facultad de Ingeniería"
              icon={<School size={15} aria-hidden="true" />}
              required
              error={fieldErrors.facultad}
            />
            <FormField
              label="Programa académico *"
              name="programa"
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
              placeholder="Ingeniería de Sistemas"
              icon={<BookOpen size={15} aria-hidden="true" />}
              required
              error={fieldErrors.programa}
            />
          </div>

          {/* Selector de Sede Uniguajira Interactivo */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
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
                        ? "border-cyan-500 dark:border-cyan-400 bg-cyan-500/15 text-slate-900 dark:text-white shadow-[0_0_15px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/40"
                        : "border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/25",
                    )}
                  >
                    <div className="flex w-full items-center justify-between mb-1.5">
                      <MapPin
                        size={15}
                        className={isSelected ? "text-cyan-600 dark:text-cyan-400" : "text-slate-400"}
                      />
                      {isSelected && (
                        <div className="flex size-4 items-center justify-center rounded-full bg-cyan-500 text-white">
                          <Check size={10} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate w-full">
                      {item.detail}
                    </span>
                  </button>
                );
              })}
            </div>
            {fieldErrors.sede && (
              <p className="text-xs text-rose-500 font-medium">{fieldErrors.sede}</p>
            )}
          </div>

          {/* Selector de Semestre Segmentado (1 a 10) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Semestre actual en curso *
              </label>
              <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400">
                {semestreActual}
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
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
                        ? "border-cyan-500 dark:border-cyan-400 bg-gradient-to-b from-cyan-600 to-cyan-500 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)] scale-105"
                        : "border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/25",
                    )}
                  >
                    <span>{sem.num}°</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-0.5">
              <span>Fundamentación (1° - 3°)</span>
              <span>Ciclo Profesional (4° - 7°)</span>
              <span>Avanzado / Grado (8° - 10°)</span>
            </div>
          </div>

          {/* Promedio Académico con Feedback Visual y Presets */}
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <div className="sm:col-span-8">
                <FormField
                  label="Promedio acumulado actual *"
                  name="promedioAcademico"
                  value={promedioAcademico}
                  onChange={(e) => setPromedioAcademico(e.target.value)}
                  placeholder="Ej. 4.2"
                  icon={<Award size={15} aria-hidden="true" />}
                  badge={
                    promedioStatus ? (
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", promedioStatus.color)}>
                        {promedioStatus.label}
                      </span>
                    ) : null
                  }
                  hint="En escala de 0.0 a 5.0 según tu certificado de notas."
                  required
                  error={fieldErrors.promedioAcademico}
                />
              </div>

              {/* Botones de sugerencia rápida de promedio */}
              <div className="sm:col-span-4 flex items-center gap-1.5 pb-2">
                <span className="text-[10px] text-slate-400 shrink-0">Rápido:</span>
                {PROMEDIO_PRESETS.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setPromedioAcademico(val)}
                    className="flex-1 h-8 rounded-lg border border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 text-xs font-medium text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-500 transition-colors cursor-pointer"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] h-12 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] transition-all duration-150 cursor-pointer"
            >
              <span>Continuar a perfil investigativo</span>
              <ChevronRight size={16} />
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
            "space-y-4 pt-1 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-3" : "slide-in-from-left-3",
          )}
        >
          {/* Subcabecera conversacional del paso */}
          <div className="border-b border-slate-200 dark:border-white/10 pb-3">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
              Paso 3 de 3
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Tus intereses y motivación en AlfaCode
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Selecciona tus líneas oficiales de interés y cuéntanos sobre tus pasiones y proyectos.
            </p>
          </div>

          {/* Líneas de Investigación Oficiales en Tarjetas Ricas */}
          <div className="space-y-2.5">
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Líneas oficiales del semillero AlfaCode *
            </label>

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
                      "group flex items-start gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-150 cursor-pointer border active:scale-[0.99]",
                      isSelected
                        ? "border-cyan-500 dark:border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.18)] ring-1 ring-cyan-500/30"
                        : "border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 hover:border-slate-400 dark:hover:border-white/25",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-10 shrink-0 items-center justify-center rounded-xl transition-all",
                        isSelected
                          ? "bg-gradient-to-tr from-cyan-600 to-cyan-400 text-white shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                          : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 group-hover:text-cyan-400",
                      )}
                    >
                      <IconComponent size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {item.title}
                        </span>
                        <div
                          className={cn(
                            "flex size-4.5 items-center justify-center rounded-md border transition-colors",
                            isSelected
                              ? "border-cyan-500 bg-cyan-500 text-white"
                              : "border-slate-300 dark:border-white/20 bg-transparent",
                          )}
                        >
                          {isSelected && <Check size={11} className="stroke-[3]" />}
                        </div>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags Interactivos de Tecnologías / Áreas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Temas y tecnologías que deseas aprender o aportar
              </label>
              <span className="text-[11px] text-slate-400">
                Toca para añadir
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
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-semibold ring-1 ring-cyan-500/40"
                        : "border-slate-300/80 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-white/25",
                    )}
                  >
                    <Tag size={10} className={isSelected ? "text-cyan-500" : "text-slate-400"} />
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
              placeholder="Otras herramientas o áreas de interés (ej. Rust, Redes neuronales, Big Data)..."
              className="block w-full h-10 rounded-xl border border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-hub-text placeholder:text-slate-400 dark:placeholder:text-hub-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900/90 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none"
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
              placeholder="Proyectos de clase, desarrollos personales, ferias..."
            />
            <TextAreaField
              label="Temas o áreas prioritarias de estudio"
              name="areasEstudio"
              value={areasEstudio}
              onChange={(e) => setAreasEstudio(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Algoritmos, arquitecturas, frameworks..."
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
              className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-medium"
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

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 h-12 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Enviando postulación..."
              className="flex-[2] h-12 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] transition-all duration-150 cursor-pointer"
            >
              <span>Enviar postulación oficial</span>
              <Sparkles size={16} className="ml-1 text-cyan-100" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
