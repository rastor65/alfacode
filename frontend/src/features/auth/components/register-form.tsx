"use client";

import {
  Award,
  BookOpen,
  Brain,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
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

interface ResearchLineOption {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Brain;
}

const RESEARCH_LINE_OPTIONS: ResearchLineOption[] = [
  {
    id: "Inteligencia Artificial",
    title: "Inteligencia Artificial",
    subtitle: "Machine learning, visión artificial, datos y PLN",
    icon: Brain,
  },
  {
    id: "Desarrollo de Software",
    title: "Desarrollo de Software",
    subtitle: "Arquitectura cloud, aplicaciones web y móviles",
    icon: Code2,
  },
  {
    id: "Internet de las Cosas (IoT)",
    title: "Internet de las Cosas (IoT)",
    subtitle: "Sistemas embebidos, sensores y automatización",
    icon: Cpu,
  },
];

const SEDES_UNIGUAJIRA = [
  "Riohacha (Sede Principal)",
  "Maicao",
  "Fonseca",
  "Villanueva",
];

const SEMESTRES = [
  "1° Semestre",
  "2° Semestre",
  "3° Semestre",
  "4° Semestre",
  "5° Semestre",
  "6° Semestre",
  "7° Semestre",
  "8° Semestre",
  "9° Semestre",
  "10° Semestre",
];

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
  const [showMetadataEditor, setShowMetadataEditor] = useState(false);

  // 2. Información académica
  const [facultad, setFacultad] = useState("Facultad de Ingeniería");
  const [programa, setPrograma] = useState("Ingeniería de Sistemas");
  const [sede, setSede] = useState("Riohacha (Sede Principal)");
  const [semestreActual, setSemestreActual] = useState("5° Semestre");
  const [promedioAcademico, setPromedioAcademico] = useState("");

  // 3. Trayectoria y áreas de investigación
  const [selectedLines, setSelectedLines] = useState<string[]>(["Inteligencia Artificial"]);
  const [lineasAdicionales, setLineasAdicionales] = useState("");
  const [experienciaInvestigativa, setExperienciaInvestigativa] = useState("");
  const [areasEstudio, setAreasEstudio] = useState("");
  const [publicaciones, setPublicaciones] = useState("");
  const [practicasPasantias, setPracticasPasantias] = useState("");
  const [message, setMessage] = useState("");
  const [showAdvancedCV, setShowAdvancedCV] = useState(false);

  function toggleLine(lineId: string) {
    setSelectedLines((current) =>
      current.includes(lineId) ? current.filter((item) => item !== lineId) : [...current, lineId],
    );
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

  function handleGoToStep(targetStep: Step) {
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

  // Vista de éxito / postulación confirmada
  if (done) {
    return (
      <div className="space-y-4 py-3 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 border border-emerald-500/30 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.25)]">
          <CheckCircle2 size={30} className="stroke-[2.2]" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            ¡Postulación Registrada con Éxito!
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
            Tu hoja de vida institucional ha sido indexada para el proceso de vinculación a <strong>AlfaCode HUB</strong>. La coordinación del semillero evaluará tu perfil académico e investigativo.
          </p>
        </div>

        {/* Resumen de confirmación estilo tarjeta digital */}
        <div className="mx-auto max-w-md rounded-xl border border-white/10 bg-slate-900/40 p-3.5 text-left text-xs space-y-2 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Estudiante:</span>
            <span className="font-semibold text-white">{nombres} {apellidos}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Correo institucional:</span>
            <span className="font-mono text-cyan-300">{email}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Programa y Sede:</span>
            <span className="text-slate-200">{programa} · {sede.split(" ")[0]}</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-400">Enfoque:</span>
            <span className="text-right font-medium text-teal-300">{selectedLines.join(", ") || "General"}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Hemos enviado un comprobante a tu correo institucional.
        </p>

        <div className="pt-2">
          <Link
            href="/ingresar"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 text-xs font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-150 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98]"
          >
            <span>Ir al inicio de sesión</span>
            <ArrowRightIcon size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* SEGMENTED STEP TRACKER (ESTILO APPLE / LINEAR)       */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-2">
        {/* Encabezado contextual del paso activo */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] sm:text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest">
              Paso 0{step} de 03
            </span>
            <span className="text-slate-400 dark:text-slate-600">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] sm:text-xs truncate max-w-[200px] sm:max-w-xs">
              {step === 1 && "Datos Personales y Contacto"}
              {step === 2 && "Registro Académico Uniguajira"}
              {step === 3 && "Líneas de Investigación e Interés"}
            </span>
          </div>
          <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {step === 1 ? "33%" : step === 2 ? "66%" : "100%"}
          </span>
        </div>

        {/* Segmented capsules bar */}
        <nav aria-label="Progreso de registro" className="grid grid-cols-3 gap-1 rounded-xl bg-slate-200/70 dark:bg-white/[0.04] p-1 border border-slate-300/60 dark:border-white/10 backdrop-blur-md">
          <button
            type="button"
            onClick={() => handleGoToStep(1)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
              step === 1
                ? "bg-white dark:bg-cyan-500/15 text-slate-900 dark:text-cyan-200 font-semibold shadow-xs border border-slate-200/80 dark:border-cyan-400/30"
                : step > 1
                  ? "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  : "text-slate-400 dark:text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[9px] font-bold transition-all",
                step > 1
                  ? "bg-emerald-500 text-white"
                  : step === 1
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-300 dark:bg-white/10 text-slate-600 dark:text-slate-400",
              )}
            >
              {step > 1 ? <Check size={10} className="stroke-[3]" /> : "1"}
            </span>
            <span className="truncate">Identificación</span>
          </button>

          <button
            type="button"
            onClick={() => handleGoToStep(2)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
              step === 2
                ? "bg-white dark:bg-cyan-500/15 text-slate-900 dark:text-cyan-200 font-semibold shadow-xs border border-slate-200/80 dark:border-cyan-400/30"
                : step > 2
                  ? "text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  : "text-slate-400 dark:text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[9px] font-bold transition-all",
                step > 2
                  ? "bg-emerald-500 text-white"
                  : step === 2
                    ? "bg-cyan-500 text-white"
                    : "bg-slate-300 dark:bg-white/10 text-slate-600 dark:text-slate-400",
              )}
            >
              {step > 2 ? <Check size={10} className="stroke-[3]" /> : "2"}
            </span>
            <span className="truncate">Académico</span>
          </button>

          <button
            type="button"
            onClick={() => handleGoToStep(3)}
            className={cn(
              "flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer",
              step === 3
                ? "bg-white dark:bg-cyan-500/15 text-slate-900 dark:text-cyan-200 font-semibold shadow-xs border border-slate-200/80 dark:border-cyan-400/30"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-4 items-center justify-center rounded-full text-[9px] font-bold transition-all",
                step === 3
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-300 dark:bg-white/10 text-slate-600 dark:text-slate-400",
              )}
            >
              3
            </span>
            <span className="truncate">Investigación</span>
          </button>
        </nav>

        {/* Hairline glowing progress indicator */}
        <div className="h-0.5 w-full bg-slate-200 dark:bg-white/10 overflow-hidden rounded-full">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-teal-300 shadow-[0_0_8px_rgba(6,182,212,0.6)] transition-all duration-300 ease-out"
            style={{ width: step === 1 ? "33.33%" : step === 2 ? "66.66%" : "100%" }}
          />
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ---------------------------------------------------- */}
      {/* PASO 1: IDENTIFICACIÓN Y CONTACTO                    */}
      {/* ---------------------------------------------------- */}
      {step === 1 && (
        <div
          className={cn(
            "space-y-3 pt-0.5 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2",
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              <span className="inline-flex items-center rounded-md bg-cyan-500/10 dark:bg-cyan-400/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                @uniguajira.edu.co
              </span>
            }
            hint="Solo se admiten cuentas oficiales de la Universidad de La Guajira."
            required
            error={fieldErrors.email}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField
              label="Documento de identidad *"
              name="documentoIdentidad"
              value={documentoIdentidad}
              onChange={(e) => setDocumentoIdentidad(e.target.value)}
              placeholder="C.C. o T.I. N°"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

          {/* Micro-panel de emisión institucional (Nacionalidad y Fecha de elaboración) */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 transition-all">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="inline-block size-1.5 rounded-full bg-cyan-500" />
                <span>
                  Nacionalidad: <strong className="text-slate-800 dark:text-slate-200 font-medium">{nacionalidad}</strong>
                </span>
                <span className="text-slate-400">·</span>
                <span>
                  Elaboración: <strong className="text-slate-800 dark:text-slate-200 font-medium">{fechaElaboracion}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMetadataEditor((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                <span>{showMetadataEditor ? "Ocultar" : "Modificar"}</span>
                {showMetadataEditor ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {showMetadataEditor && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in-50 duration-150">
                <FormField
                  label="Nacionalidad"
                  name="nacionalidad"
                  value={nacionalidad}
                  onChange={(e) => setNacionalidad(e.target.value)}
                  placeholder="Colombiana"
                />
                <FormField
                  label="Fecha de elaboración"
                  name="fechaElaboracion"
                  type="date"
                  value={fechaElaboracion}
                  onChange={(e) => setFechaElaboracion(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Botón de avance */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="w-full h-10 sm:h-10.5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98] text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-150 cursor-pointer"
            >
              <span>Continuar a información académica</span>
              <ChevronRight size={15} />
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
            "space-y-3 pt-0.5 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2",
          )}
        >
          {/* Badge institucional superior */}
          <div className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2 text-xs text-cyan-800 dark:text-cyan-300">
            <School size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
            <p className="leading-tight">
              Vinculación de estudiantes de pregrado · <strong>Universidad de La Guajira</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Custom Select Sede */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-hub-soft">
                Sede Uniguajira *
              </label>
              <div className="relative group">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400 dark:text-cyan-400/60 transition-colors group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400"
                  aria-hidden="true"
                >
                  <MapPin size={15} />
                </div>
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="block w-full h-10 sm:h-10.5 appearance-none rounded-xl border border-hub-input-border bg-hub-input pl-9 pr-8 text-xs sm:text-sm text-hub-text shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-150 hover:border-slate-400 dark:hover:border-white/25 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none cursor-pointer"
                >
                  {SEDES_UNIGUAJIRA.map((s) => (
                    <option key={s} value={s} className="bg-slate-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-center text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Custom Select Semestre */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-hub-soft">
                Semestre actual *
              </label>
              <div className="relative group">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400 dark:text-cyan-400/60 transition-colors group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400"
                  aria-hidden="true"
                >
                  <GraduationCap size={15} />
                </div>
                <select
                  value={semestreActual}
                  onChange={(e) => setSemestreActual(e.target.value)}
                  className="block w-full h-10 sm:h-10.5 appearance-none rounded-xl border border-hub-input-border bg-hub-input pl-9 pr-8 text-xs sm:text-sm text-hub-text shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none transition-all duration-150 hover:border-slate-400 dark:hover:border-white/25 focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none cursor-pointer"
                >
                  {SEMESTRES.map((sem) => (
                    <option key={sem} value={sem} className="bg-slate-900 text-white">
                      {sem}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex w-8 items-center justify-center text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>

            {/* Promedio Académico */}
            <FormField
              label="Promedio acumulado *"
              name="promedioAcademico"
              value={promedioAcademico}
              onChange={(e) => setPromedioAcademico(e.target.value)}
              placeholder="Ej. 4.2"
              icon={<Award size={15} aria-hidden="true" />}
              required
              error={fieldErrors.promedioAcademico}
            />
          </div>

          {/* Botones de navegación */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 h-10 sm:h-10.5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.97] text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] h-10 sm:h-10.5 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98] text-white font-medium text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all duration-150 cursor-pointer"
            >
              <span>Continuar a perfil investigativo</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 3: TRAYECTORIA Y ENFOQUE INVESTIGATIVO         */}
      {/* ---------------------------------------------------- */}
      {step === 3 && (
        <div
          className={cn(
            "space-y-3 pt-0.5 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2",
          )}
        >
          {/* Selector de líneas de investigación */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-hub-soft">
                Líneas de investigación de tu interés
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Selecciona una o más
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {RESEARCH_LINE_OPTIONS.map((item) => {
                const isSelected = selectedLines.includes(item.id);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLine(item.id)}
                    className={cn(
                      "flex flex-col text-left p-2.5 rounded-xl border transition-all duration-150 active:scale-[0.98] cursor-pointer",
                      isSelected
                        ? "border-cyan-500 dark:border-cyan-400/80 bg-cyan-500/10 text-cyan-900 dark:text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30"
                        : "border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-100/50 dark:hover:bg-white/[0.04]",
                    )}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <div className={cn(
                        "flex size-6 items-center justify-center rounded-lg transition-colors",
                        isSelected ? "bg-cyan-500 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400",
                      )}>
                        <IconComponent size={13} />
                      </div>
                      <div className={cn(
                        "flex size-4 items-center justify-center rounded-full border transition-all",
                        isSelected ? "border-cyan-500 bg-cyan-500 text-white" : "border-slate-300 dark:border-white/20",
                      )}>
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </div>
                    <span className="font-semibold text-xs text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 line-clamp-2">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Input para temáticas o tecnologías adicionales */}
            <input
              type="text"
              value={lineasAdicionales}
              onChange={(e) => setLineasAdicionales(e.target.value)}
              placeholder="Otras tecnologías o temáticas de interés (ej. Blockchain, Ciberseguridad, React)..."
              className="block w-full h-9 rounded-xl border border-hub-input-border bg-hub-input px-3 text-xs text-hub-text placeholder:text-slate-400 dark:placeholder:text-hub-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none transition-all focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none"
            />
          </div>

          {/* Experiencia y áreas de estudio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <TextAreaField
              label="Experiencia investigativa o proyectos"
              name="experienciaInvestigativa"
              value={experienciaInvestigativa}
              onChange={(e) => setExperienciaInvestigativa(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Proyectos de aula, ferias, desarrollo personal o semilleros..."
            />
            <TextAreaField
              label="Áreas de estudio o tecnologías afines"
              name="areasEstudio"
              value={areasEstudio}
              onChange={(e) => setAreasEstudio(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Lenguajes, frameworks o temas que más te apasionan..."
            />
          </div>

          {/* Motivación para unirse */}
          <TextAreaField
            label="Mensaje o motivación para ingresar a AlfaCode (opcional)"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="¿Por qué te gustaría formar parte del semillero AlfaCode y qué esperas aprender o aportar?"
          />

          {/* Progressive disclosure: Publicaciones y pasantías avanzadas */}
          <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 transition-all">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                ¿Tienes publicaciones científicas o pasantías previas?
              </span>
              <button
                type="button"
                onClick={() => setShowAdvancedCV((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
              >
                <span>{showAdvancedCV ? "Ocultar campos" : "+ Agregar detalles"}</span>
                {showAdvancedCV ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            {showAdvancedCV && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in-50 duration-150">
                <TextAreaField
                  label="Publicaciones recientes (si aplica)"
                  name="publicaciones"
                  value={publicaciones}
                  onChange={(e) => setPublicaciones(e.target.value)}
                  rows={2}
                  maxLength={800}
                  placeholder="Artículos, ponencias en congresos, etc."
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

          {/* Botones de acción final */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 h-10 sm:h-10.5 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.97] text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              <span>Atrás</span>
            </button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Enviando hoja de vida..."
              className="flex-[2] h-10 sm:h-10.5 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all duration-150 cursor-pointer"
            >
              <span>Enviar postulación oficial</span>
              <Sparkles size={15} className="ml-1 text-cyan-100" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}

function ArrowRightIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
