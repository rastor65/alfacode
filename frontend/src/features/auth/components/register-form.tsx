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

interface ResearchLineItem {
  id: string;
  title: string;
  icon: typeof Brain;
}

const RESEARCH_LINES: ResearchLineItem[] = [
  { id: "Inteligencia Artificial", title: "Inteligencia Artificial", icon: Brain },
  { id: "Desarrollo de Software", title: "Desarrollo de Software", icon: Code2 },
  { id: "Internet de las Cosas (IoT)", title: "Internet de las Cosas (IoT)", icon: Cpu },
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
  const [showMetadataCustomizer, setShowMetadataCustomizer] = useState(false);

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
      <div className="space-y-4 py-4 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={32} className="stroke-[2.2]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            Postulación Registrada
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed">
            Tu hoja de vida institucional fue enviada con éxito para la vinculación al semillero <strong>AlfaCode</strong>.
          </p>
        </div>

        <div className="mx-auto max-w-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/60 dark:bg-white/[0.03] p-3 text-left text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Postulante:</span>
            <span className="font-semibold text-slate-900 dark:text-white">{nombres} {apellidos}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Correo:</span>
            <span className="font-mono text-cyan-600 dark:text-cyan-300">{email}</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/5 pb-1.5">
            <span className="text-slate-500 dark:text-slate-400">Programa:</span>
            <span className="text-slate-700 dark:text-slate-200">{programa}</span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-500 dark:text-slate-400">Enfoque:</span>
            <span className="font-medium text-teal-600 dark:text-teal-300">{selectedLines.join(", ")}</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/ingresar"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 text-xs font-semibold text-white shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-150 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98]"
          >
            <span>Ir a iniciar sesión</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* PROGRESS TRACKER MINIMALISTA (ESTILO APPLE / LINEAR) */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-2 pb-1">
        {/* 3 Hairline Progress Bars */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => goToStep(1)}
            aria-label="Ir a paso 1: Identificación"
            className="group flex flex-col gap-1.5 text-left cursor-pointer transition-opacity"
          >
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                step >= 1
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  : "bg-slate-200 dark:bg-white/10",
              )}
            />
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-medium tracking-tight transition-colors truncate",
                step === 1
                  ? "text-cyan-600 dark:text-cyan-300 font-semibold"
                  : step > 1
                    ? "text-slate-700 dark:text-slate-300 group-hover:text-cyan-500"
                    : "text-slate-400 dark:text-slate-500",
              )}
            >
              01 Identificación
            </span>
          </button>

          <button
            type="button"
            onClick={() => goToStep(2)}
            aria-label="Ir a paso 2: Académico"
            className="group flex flex-col gap-1.5 text-left cursor-pointer transition-opacity"
          >
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                step >= 2
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  : "bg-slate-200 dark:bg-white/10",
              )}
            />
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-medium tracking-tight transition-colors truncate",
                step === 2
                  ? "text-cyan-600 dark:text-cyan-300 font-semibold"
                  : step > 2
                    ? "text-slate-700 dark:text-slate-300 group-hover:text-cyan-500"
                    : "text-slate-400 dark:text-slate-500",
              )}
            >
              02 Académico
            </span>
          </button>

          <button
            type="button"
            onClick={() => goToStep(3)}
            aria-label="Ir a paso 3: Investigación"
            className="group flex flex-col gap-1.5 text-left cursor-pointer transition-opacity"
          >
            <div
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                step >= 3
                  ? "bg-gradient-to-r from-cyan-500 to-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                  : "bg-slate-200 dark:bg-white/10",
              )}
            />
            <span
              className={cn(
                "text-[10px] sm:text-[11px] font-medium tracking-tight transition-colors truncate",
                step === 3
                  ? "text-cyan-600 dark:text-cyan-300 font-semibold"
                  : "text-slate-400 dark:text-slate-500",
              )}
            >
              03 Investigación
            </span>
          </button>
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
              <span className="font-mono text-[10px] font-semibold text-cyan-600 dark:text-cyan-400">
                @uniguajira.edu.co
              </span>
            }
            hint="Solo se admiten correos institucionales de Uniguajira."
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

          {/* Pie sutil de emisión institucional */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-1.5 rounded-full bg-cyan-500" />
              <span>Nacionalidad: <strong className="text-slate-700 dark:text-slate-300 font-medium">{nacionalidad}</strong></span>
              <span>·</span>
              <span>Fecha: <strong className="text-slate-700 dark:text-slate-300 font-medium">{fechaElaboracion}</strong></span>
            </div>
            <button
              type="button"
              onClick={() => setShowMetadataCustomizer((v) => !v)}
              className="text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              {showMetadataCustomizer ? "Ocultar" : "Editar"}
            </button>
          </div>

          {showMetadataCustomizer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 animate-in fade-in-50 duration-150">
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
              className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_28px_rgba(6,182,212,0.4)] transition-all duration-150 cursor-pointer"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Custom Select Sede */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Sede Uniguajira *
              </label>
              <div className="relative group">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400"
                  aria-hidden="true"
                >
                  <MapPin size={15} />
                </div>
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="block w-full h-10.5 sm:h-11 appearance-none rounded-xl border border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 pl-9 pr-8 text-xs sm:text-sm text-slate-900 dark:text-hub-text shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-150 hover:border-slate-400 dark:hover:border-white/25 focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900/90 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none cursor-pointer"
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
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Semestre actual *
              </label>
              <div className="relative group">
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-slate-400 dark:text-slate-500 transition-colors group-focus-within:text-cyan-600 dark:group-focus-within:text-cyan-400"
                  aria-hidden="true"
                >
                  <GraduationCap size={15} />
                </div>
                <select
                  value={semestreActual}
                  onChange={(e) => setSemestreActual(e.target.value)}
                  className="block w-full h-10.5 sm:h-11 appearance-none rounded-xl border border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 pl-9 pr-8 text-xs sm:text-sm text-slate-900 dark:text-hub-text shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all duration-150 hover:border-slate-400 dark:hover:border-white/25 focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900/90 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none cursor-pointer"
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
          </div>

          <FormField
            label="Promedio acumulado actual *"
            name="promedioAcademico"
            value={promedioAcademico}
            onChange={(e) => setPromedioAcademico(e.target.value)}
            placeholder="Ej. 4.2"
            icon={<Award size={15} aria-hidden="true" />}
            hint="En escala de 0.0 a 5.0 según tu certificado institucional."
            required
            error={fieldErrors.promedioAcademico}
          />

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] h-11 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_28px_rgba(6,182,212,0.4)] transition-all duration-150 cursor-pointer"
            >
              <span>Continuar a perfil investigativo</span>
              <ChevronRight size={15} />
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
            "space-y-3 pt-0.5 animate-in fade-in-50 duration-200",
            direction === "next" ? "slide-in-from-right-2" : "slide-in-from-left-2",
          )}
        >
          {/* Líneas de Investigación en Pills Minimalistas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Líneas de investigación en AlfaCode
              </label>
              <span className="text-[11px] text-slate-400">
                Selecciona las de tu interés
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {RESEARCH_LINES.map((item) => {
                const isSelected = selectedLines.includes(item.id);
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleLine(item.id)}
                    className={cn(
                      "group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150 cursor-pointer border active:scale-[0.98]",
                      isSelected
                        ? "border-cyan-500 dark:border-cyan-400/80 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.2)] ring-1 ring-cyan-500/30"
                        : "border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-white/25",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-lg transition-colors",
                        isSelected
                          ? "bg-cyan-500 text-white"
                          : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400 group-hover:text-cyan-400",
                      )}
                    >
                      <IconComponent size={12} />
                    </span>
                    <span>{item.title}</span>
                    {isSelected && <Check size={12} className="stroke-[2.5] text-cyan-600 dark:text-cyan-300" />}
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={lineasAdicionales}
              onChange={(e) => setLineasAdicionales(e.target.value)}
              placeholder="Otras temáticas o tecnologías (ej. Ciberseguridad, Blockchain, React)..."
              className="block w-full h-9 rounded-xl border border-slate-300/80 dark:border-white/12 bg-slate-100/70 dark:bg-slate-900/60 px-3 text-xs text-slate-900 dark:text-hub-text placeholder:text-slate-400 dark:placeholder:text-hub-muted shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] transition-all focus:border-cyan-500 dark:focus:border-cyan-400 focus:bg-white dark:focus:bg-slate-900/90 focus:ring-4 focus:ring-cyan-500/15 focus:outline-none"
            />
          </div>

          {/* Textareas para experiencia y áreas de estudio */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
              label="Temas o áreas de mayor interés"
              name="areasEstudio"
              value={areasEstudio}
              onChange={(e) => setAreasEstudio(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Lenguajes, marcos de trabajo o algoritmos..."
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

          {/* Progressive disclosure: Publicaciones y pasantías avanzadas */}
          <div className="pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvancedCV((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              <span>{showAdvancedCV ? "Ocultar publicaciones y pasantías" : "+ ¿Tienes publicaciones o pasantías previas?"}</span>
            </button>

            {showAdvancedCV && (
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in-50 duration-150">
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

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 h-11 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300/80 dark:border-white/12 hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] text-slate-700 dark:text-slate-300 font-medium text-xs sm:text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft size={15} />
              <span>Atrás</span>
            </button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Enviando postulación..."
              className="flex-[2] h-11 rounded-xl bg-gradient-to-r from-cyan-600 via-cyan-500 to-teal-500 hover:from-cyan-500 hover:to-teal-400 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm shadow-[0_0_24px_rgba(6,182,212,0.3)] hover:shadow-[0_0_32px_rgba(6,182,212,0.5)] transition-all duration-150 cursor-pointer"
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
