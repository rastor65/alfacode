"use client";

import {
  Award,
  BookOpen,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  GraduationCap,
  IdCard,
  Mail,
  MapPin,
  Microscope,
  Phone,
  PhoneCall,
  Sparkles,
  User,
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

const RESEARCH_LINES = [
  "Inteligencia Artificial",
  "Desarrollo de Software",
  "Internet de las Cosas (IoT)",
  "Ciencia de Datos",
  "Ciberseguridad",
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
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // 1. Identificación
  const [fechaElaboracion, setFechaElaboracion] = useState(() => new Date().toISOString().split("T")[0]);
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [nacionalidad, setNacionalidad] = useState("Colombiana");
  const [documentoIdentidad, setDocumentoIdentidad] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [telefonoFijo, setTelefonoFijo] = useState("");

  // 2. Académico
  const [facultad, setFacultad] = useState("Facultad de Ingeniería");
  const [programa, setPrograma] = useState("Ingeniería de Sistemas");
  const [sede, setSede] = useState("Riohacha (Sede Principal)");
  const [semestreActual, setSemestreActual] = useState("5° Semestre");
  const [promedioAcademico, setPromedioAcademico] = useState("");

  // 3. Trayectoria e Interés
  const [selectedLines, setSelectedLines] = useState<string[]>(["Inteligencia Artificial", "Desarrollo de Software"]);
  const [lineasAdicionales, setLineasAdicionales] = useState("");
  const [experienciaInvestigativa, setExperienciaInvestigativa] = useState("");
  const [areasEstudio, setAreasEstudio] = useState("");
  const [publicaciones, setPublicaciones] = useState("");
  const [practicasPasantias, setPracticasPasantias] = useState("");
  const [message, setMessage] = useState("");

  function toggleLine(line: string) {
    setSelectedLines((current) =>
      current.includes(line) ? current.filter((item) => item !== line) : [...current, line],
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
        errors.email = "Solo se admiten correos oficiales @uniguajira.edu.co.";
      }
      if (!documentoIdentidad.trim()) errors.documentoIdentidad = "Ingresa tu documento de identidad.";
      if (!fechaNacimiento) errors.fechaNacimiento = "Selecciona tu fecha de nacimiento.";
      if (!celular.trim()) errors.celular = "Ingresa tu número celular de contacto.";
    }

    if (currentStep === 2) {
      if (!facultad.trim()) errors.facultad = "Ingresa la facultad a la que perteneces.";
      if (!programa.trim()) errors.programa = "Ingresa el programa académico en curso.";
      if (!sede.trim()) errors.sede = "Selecciona la sede universitaria.";
      if (!semestreActual.trim()) errors.semestreActual = "Selecciona tu semestre actual.";
      if (!promedioAcademico.trim()) errors.promedioAcademico = "Ingresa tu promedio acumulado (ej. 4.2).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleNext() {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 3) as Step);
    }
  }

  function handlePrev() {
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

  if (done) {
    return (
      <div className="space-y-6 py-2">
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-emerald-500/10 via-emerald-500/5 to-transparent p-5 sm:p-6 text-center shadow-lg">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <CheckCircle2 size={30} className="stroke-[2.5]" />
          </div>

          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            ¡Hoja de Vida y Postulación Recibida!
          </h3>

          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300 max-w-md mx-auto">
            Hemos registrado tu resumen de hoja de vida para vincularte al semillero <strong>AlfaCode</strong>. La
            coordinación revisará tus antecedentes académicos y perfil investigativo.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <Mail size={14} className="shrink-0" />
            <span>Notificación enviada a: <strong>{email}</strong></span>
          </div>

          <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
            Una vez aprobada tu vinculación, recibirás tus credenciales de acceso temporal para ingresar al HUB.
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/ingresar"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-500/25 transition hover:from-cyan-500 hover:to-teal-400 hover:shadow-cyan-500/40"
          >
            <span>Ir a Iniciar Sesión</span>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* STEPPER ELEGANTE Y MULTI-ETAPA                       */}
      {/* ---------------------------------------------------- */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] p-2 sm:p-2.5 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {/* PASO 1 TAB */}
          <button
            type="button"
            onClick={() => step > 1 && setStep(1)}
            className={cn(
              "group relative flex items-center justify-center sm:justify-start gap-2 rounded-xl px-2 sm:px-3 py-2 text-left transition-all duration-200 cursor-pointer",
              step === 1
                ? "bg-white dark:bg-cyan-950/60 border border-cyan-500/40 shadow-sm text-cyan-800 dark:text-cyan-300"
                : step > 1
                  ? "bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                  : "text-slate-400 dark:text-slate-500 opacity-70",
            )}
          >
            <span
              className={cn(
                "flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                step === 1
                  ? "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-xs"
                  : step > 1
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400",
              )}
            >
              {step > 1 ? <Check size={13} className="stroke-[3]" /> : <User size={13} />}
            </span>
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] font-bold leading-tight truncate">1. Identificación</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">Datos básicos</p>
            </div>
          </button>

          {/* PASO 2 TAB */}
          <button
            type="button"
            onClick={() => (step > 2 ? setStep(2) : validateStep(1) && setStep(2))}
            className={cn(
              "group relative flex items-center justify-center sm:justify-start gap-2 rounded-xl px-2 sm:px-3 py-2 text-left transition-all duration-200 cursor-pointer",
              step === 2
                ? "bg-white dark:bg-cyan-950/60 border border-cyan-500/40 shadow-sm text-cyan-800 dark:text-cyan-300"
                : step > 2
                  ? "bg-emerald-500/10 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
                  : "text-slate-400 dark:text-slate-500 opacity-70",
            )}
          >
            <span
              className={cn(
                "flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                step === 2
                  ? "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-xs"
                  : step > 2
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400",
              )}
            >
              {step > 2 ? <Check size={13} className="stroke-[3]" /> : <GraduationCap size={13} />}
            </span>
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] font-bold leading-tight truncate">2. Académico</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">Sede y carrera</p>
            </div>
          </button>

          {/* PASO 3 TAB */}
          <button
            type="button"
            onClick={() => validateStep(1) && validateStep(2) && setStep(3)}
            className={cn(
              "group relative flex items-center justify-center sm:justify-start gap-2 rounded-xl px-2 sm:px-3 py-2 text-left transition-all duration-200 cursor-pointer",
              step === 3
                ? "bg-white dark:bg-cyan-950/60 border border-cyan-500/40 shadow-sm text-cyan-800 dark:text-cyan-300"
                : "text-slate-400 dark:text-slate-500 opacity-70",
            )}
          >
            <span
              className={cn(
                "flex size-6 sm:size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-all",
                step === 3
                  ? "bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-xs"
                  : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400",
              )}
            >
              <Microscope size={13} />
            </span>
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] font-bold leading-tight truncate">3. Investigación</p>
              <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">Líneas e interés</p>
            </div>
          </button>
        </div>

        {/* Barra de progreso continua con acento institucional */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-[#0382a1] to-teal-400 transition-all duration-300 rounded-full"
            style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          />
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ---------------------------------------------------- */}
      {/* PASO 1: IDENTIFICACIÓN PERSONAL Y CONTACTO           */}
      {/* ---------------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-3 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                <User size={14} />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  1. Identificación Personal y Contacto
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Tus datos de identidad y canales de contacto directo.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Paso 1 de 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <FormField
              label="Nombres *"
              name="nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Ej. Juan Carlos"
              icon={<User size={15} />}
              required
              error={fieldErrors.nombres}
            />
            <FormField
              label="Apellidos *"
              name="apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Ej. Pérez Gómez"
              icon={<User size={15} />}
              required
              error={fieldErrors.apellidos}
            />
          </div>

          <FormField
            label="Correo institucional (@uniguajira.edu.co) *"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@uniguajira.edu.co"
            icon={<Mail size={15} />}
            hint="Solo se admiten correos oficiales de la Universidad de La Guajira."
            required
            error={fieldErrors.email}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <FormField
              label="Documento de identidad *"
              name="documentoIdentidad"
              value={documentoIdentidad}
              onChange={(e) => setDocumentoIdentidad(e.target.value)}
              placeholder="C.C. / T.I. N°..."
              icon={<IdCard size={15} />}
              required
              error={fieldErrors.documentoIdentidad}
            />
            <FormField
              label="Fecha de Nacimiento *"
              name="fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              icon={<Calendar size={15} />}
              required
              error={fieldErrors.fechaNacimiento}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <FormField
              label="Celular de contacto *"
              name="celular"
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="300 123 4567"
              icon={<Phone size={15} />}
              required
              error={fieldErrors.celular}
            />
            <FormField
              label="Teléfono Fijo (opcional)"
              name="telefonoFijo"
              type="tel"
              value={telefonoFijo}
              onChange={(e) => setTelefonoFijo(e.target.value)}
              placeholder="(605) 727..."
              icon={<PhoneCall size={15} />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <FormField
              label="Nacionalidad"
              name="nacionalidad"
              value={nacionalidad}
              onChange={(e) => setNacionalidad(e.target.value)}
              placeholder="Colombiana"
              icon={<Globe size={15} />}
            />
            <FormField
              label="Fecha de elaboración"
              name="fechaElaboracion"
              type="date"
              value={fechaElaboracion}
              onChange={(e) => setFechaElaboracion(e.target.value)}
              icon={<Calendar size={15} />}
            />
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0382a1] via-cyan-600 to-teal-500 hover:from-[#026b85] hover:via-cyan-700 hover:to-teal-600 text-white font-semibold py-2.5 px-4 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 active:scale-[0.99] transition-all duration-200 cursor-pointer"
            >
              <span>Continuar a Datos Académicos</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 2: INFORMACIÓN ACADÉMICA UNIGUAJIRA             */}
      {/* ---------------------------------------------------- */}
      {step === 2 && (
        <div className="space-y-3 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                <GraduationCap size={14} />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  2. Información Académica Uniguajira
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Programa de pregrado, sede de estudio y rendimiento actual.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Paso 2 de 3
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <FormField
              label="Facultad *"
              name="facultad"
              value={facultad}
              onChange={(e) => setFacultad(e.target.value)}
              placeholder="Facultad de Ingeniería"
              icon={<Building2 size={15} />}
              required
              error={fieldErrors.facultad}
            />
            <FormField
              label="Programa Académico *"
              name="programa"
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
              placeholder="Ingeniería de Sistemas"
              icon={<BookOpen size={15} />}
              required
              error={fieldErrors.programa}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {/* SELECT SEDE ELEGANTE */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-hub-soft">
                Sede *
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 dark:text-cyan-400/70">
                  <MapPin size={15} />
                </div>
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="peer block w-full appearance-none rounded-xl border border-hub-input-border bg-hub-input pl-10 pr-8 py-2 sm:py-2.5 text-sm text-hub-text shadow-sm shadow-slate-900/5 transition-all duration-200 hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 cursor-pointer"
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

            {/* SELECT SEMESTRE ELEGANTE */}
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-hub-soft">
                Semestre Actual *
              </label>
              <div className="relative group">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center text-slate-400 dark:text-cyan-400/70">
                  <GraduationCap size={15} />
                </div>
                <select
                  value={semestreActual}
                  onChange={(e) => setSemestreActual(e.target.value)}
                  className="peer block w-full appearance-none rounded-xl border border-hub-input-border bg-hub-input pl-10 pr-8 py-2 sm:py-2.5 text-sm text-hub-text shadow-sm shadow-slate-900/5 transition-all duration-200 hover:border-cyan-500/40 focus:border-cyan-500 focus:outline-none focus:ring-4 focus:ring-cyan-500/15 cursor-pointer"
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

            <FormField
              label="Promedio Acumulado *"
              name="promedioAcademico"
              value={promedioAcademico}
              onChange={(e) => setPromedioAcademico(e.target.value)}
              placeholder="Ej. 4.2"
              icon={<Award size={15} />}
              required
              error={fieldErrors.promedioAcademico}
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 shadow-xs transition-all duration-200 cursor-pointer text-sm"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0382a1] via-cyan-600 to-teal-500 hover:from-[#026b85] hover:via-cyan-700 hover:to-teal-600 text-white font-semibold py-2.5 px-4 shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 active:scale-[0.99] transition-all duration-200 cursor-pointer text-sm"
            >
              <span>Continuar a Perfil Investigativo</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 3: TRAYECTORIA E INTERÉS INVESTIGATIVO          */}
      {/* ---------------------------------------------------- */}
      {step === 3 && (
        <div className="space-y-3 animate-in fade-in-50 duration-300">
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                <Microscope size={14} />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  3. Perfil e Interés Investigativo
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Líneas de investigación en AlfaCode, experiencia y motivación.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              Paso 3 de 3
            </span>
          </div>

          {/* Líneas de Investigación como Badges Interactivas */}
          <div className="space-y-1.5 rounded-xl border border-slate-200/80 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02] p-2.5 sm:p-3">
            <label className="block text-xs font-semibold text-slate-700 dark:text-hub-soft">
              Líneas de Investigación de Interés (Selecciona una o más):
            </label>
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {RESEARCH_LINES.map((line) => {
                const isSelected = selectedLines.includes(line);
                return (
                  <button
                    key={line}
                    type="button"
                    onClick={() => toggleLine(line)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-200 cursor-pointer",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/15 text-cyan-800 dark:text-cyan-200 shadow-xs font-semibold"
                        : "border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 hover:border-cyan-400/50 hover:bg-cyan-500/5",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-full text-[10px]",
                        isSelected ? "bg-cyan-600 text-white" : "bg-slate-200 dark:bg-white/10 text-slate-500",
                      )}
                    >
                      {isSelected ? <Check size={10} className="stroke-[3]" /> : "+"}
                    </span>
                    <span>{line}</span>
                  </button>
                );
              })}
            </div>
            <div className="pt-1">
              <input
                type="text"
                value={lineasAdicionales}
                onChange={(e) => setLineasAdicionales(e.target.value)}
                placeholder="Otras temáticas o líneas de interés adicionales..."
                className="block w-full rounded-xl border border-hub-input-border bg-hub-input px-3 py-1.5 text-xs text-hub-text placeholder:text-slate-400 dark:placeholder:text-hub-muted shadow-xs transition-all focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <TextAreaField
              label="Experiencia Investigativa"
              name="experienciaInvestigativa"
              value={experienciaInvestigativa}
              onChange={(e) => setExperienciaInvestigativa(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Proyectos de aula, ferias científicas, semilleros previos..."
            />
            <TextAreaField
              label="Áreas de Estudio"
              name="areasEstudio"
              value={areasEstudio}
              onChange={(e) => setAreasEstudio(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Temas tecnológicos o áreas que más te apasionan..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
            <TextAreaField
              label="Publicaciones recientes (si aplica)"
              name="publicaciones"
              value={publicaciones}
              onChange={(e) => setPublicaciones(e.target.value)}
              rows={1}
              maxLength={800}
              placeholder="Artículos, posters, ponencias universitarias..."
            />
            <TextAreaField
              label="Prácticas o pasantías (si aplica)"
              name="practicasPasantias"
              value={practicasPasantias}
              onChange={(e) => setPracticasPasantias(e.target.value)}
              rows={1}
              maxLength={800}
              placeholder="Empresas, laboratorios o proyectos externos..."
            />
          </div>

          <TextAreaField
            label="Mensaje o motivación (opcional)"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="¿Por qué te gustaría formar parte del semillero AlfaCode?"
          />

          {/* Mini Tarjeta de Confirmación de Postulación */}
          <div className="flex items-center justify-between rounded-xl border border-cyan-500/25 bg-gradient-to-r from-cyan-500/10 via-cyan-500/5 to-transparent p-2.5 sm:p-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-700 dark:text-cyan-300">
                <CheckCircle2 size={16} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {nombres.trim() || "Estudiante"} {apellidos.trim()}
                </p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {email || "correo@uniguajira.edu.co"} · {programa} ({sede})
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold text-cyan-800 dark:text-cyan-300 shrink-0">
              Listo para enviar
            </span>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold py-2.5 px-4 shadow-xs transition-all duration-200 cursor-pointer text-sm"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Enviando postulación…"
              className="flex-[2] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0382a1] via-cyan-600 to-teal-500 hover:from-[#026b85] hover:via-cyan-700 hover:to-teal-600 text-white font-semibold py-2.5 px-4 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 text-sm cursor-pointer"
            >
              <span>Enviar Hoja de Vida</span>
              <Sparkles size={16} className="text-cyan-200" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
