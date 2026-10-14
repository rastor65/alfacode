"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
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
  const [selectedLines, setSelectedLines] = useState<string[]>(["Inteligencia Artificial"]);
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
      if (!nombres.trim()) errors.nombres = "Ingresa tus nombres.";
      if (!apellidos.trim()) errors.apellidos = "Ingresa tus apellidos.";
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
      if (!semestreActual.trim()) errors.semestreActual = "Selecciona el semestre.";
      if (!promedioAcademico.trim()) errors.promedioAcademico = "Ingresa tu promedio acumulado.";
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
      <div className="space-y-4 py-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Check size={24} className="stroke-[2.5]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Postulación recibida con éxito
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Hemos registrado tu resumen de hoja de vida para vincularte a <strong>AlfaCode</strong>. La coordinación revisará tu información institucional.
          </p>
        </div>

        <p className="text-xs text-slate-400">
          Notificación enviada a: <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
        </p>

        <div className="pt-2">
          <Link
            href="/ingresar"
            className="inline-flex h-9 items-center justify-center rounded-lg bg-cyan-600 px-4 text-xs font-medium text-white transition hover:bg-cyan-500"
          >
            Ir a inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* STEPPER MINIMALISTA TIPO LINEAR / APPLE             */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-2 pb-1">
        <div className="flex items-center justify-between text-xs font-medium">
          <button
            type="button"
            onClick={() => step > 1 && setStep(1)}
            className={cn(
              "flex items-center gap-1.5 transition-colors cursor-pointer",
              step === 1
                ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                : step > 1
                  ? "text-slate-700 dark:text-slate-300 hover:text-cyan-600"
                  : "text-slate-400 dark:text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                step === 1
                  ? "bg-cyan-500 text-white"
                  : step > 1
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400",
              )}
            >
              {step > 1 ? <Check size={11} className="stroke-[3]" /> : "1"}
            </span>
            <span>Identificación</span>
          </button>

          <div className="h-px flex-1 mx-3 bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => (step > 2 ? setStep(2) : validateStep(1) && setStep(2))}
            className={cn(
              "flex items-center gap-1.5 transition-colors cursor-pointer",
              step === 2
                ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                : step > 2
                  ? "text-slate-700 dark:text-slate-300 hover:text-cyan-600"
                  : "text-slate-400 dark:text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                step === 2
                  ? "bg-cyan-500 text-white"
                  : step > 2
                    ? "bg-emerald-500 text-white"
                    : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400",
              )}
            >
              {step > 2 ? <Check size={11} className="stroke-[3]" /> : "2"}
            </span>
            <span>Académico</span>
          </button>

          <div className="h-px flex-1 mx-3 bg-slate-200 dark:bg-white/10" />

          <button
            type="button"
            onClick={() => validateStep(1) && validateStep(2) && setStep(3)}
            className={cn(
              "flex items-center gap-1.5 transition-colors cursor-pointer",
              step === 3
                ? "text-cyan-600 dark:text-cyan-400 font-semibold"
                : "text-slate-400 dark:text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                step === 3
                  ? "bg-cyan-500 text-white"
                  : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400",
              )}
            >
              3
            </span>
            <span>Investigación</span>
          </button>
        </div>

        {/* Línea delgada minimalista de progreso */}
        <div className="h-0.5 w-full bg-slate-200 dark:bg-white/10 overflow-hidden rounded-full">
          <div
            className="h-full bg-cyan-500 transition-all duration-300 ease-out"
            style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          />
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* ---------------------------------------------------- */}
      {/* PASO 1: IDENTIFICACIÓN                               */}
      {/* ---------------------------------------------------- */}
      {step === 1 && (
        <div className="space-y-3 pt-0.5 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField
              label="Nombres *"
              name="nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              placeholder="Ej. Juan Carlos"
              required
              error={fieldErrors.nombres}
            />
            <FormField
              label="Apellidos *"
              name="apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              placeholder="Ej. Pérez Gómez"
              required
              error={fieldErrors.apellidos}
            />
          </div>

          <FormField
            label="Correo institucional *"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@uniguajira.edu.co"
            hint="Debe pertenecer al dominio institucional @uniguajira.edu.co"
            required
            error={fieldErrors.email}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField
              label="Documento de identidad *"
              name="documentoIdentidad"
              value={documentoIdentidad}
              onChange={(e) => setDocumentoIdentidad(e.target.value)}
              placeholder="C.C. / T.I. N°"
              required
              error={fieldErrors.documentoIdentidad}
            />
            <FormField
              label="Fecha de nacimiento *"
              name="fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
              error={fieldErrors.fechaNacimiento}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField
              label="Celular de contacto *"
              name="celular"
              type="tel"
              value={celular}
              onChange={(e) => setCelular(e.target.value)}
              placeholder="300 123 4567"
              required
              error={fieldErrors.celular}
            />
            <FormField
              label="Teléfono fijo (opcional)"
              name="telefonoFijo"
              type="tel"
              value={telefonoFijo}
              onChange={(e) => setTelefonoFijo(e.target.value)}
              placeholder="(605) 727..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

          <div className="pt-2">
            <button
              type="button"
              onClick={handleNext}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs"
            >
              <span>Continuar a datos académicos</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 2: INFORMACIÓN ACADÉMICA                        */}
      {/* ---------------------------------------------------- */}
      {step === 2 && (
        <div className="space-y-3 pt-0.5 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <FormField
              label="Facultad *"
              name="facultad"
              value={facultad}
              onChange={(e) => setFacultad(e.target.value)}
              placeholder="Facultad de Ingeniería"
              required
              error={fieldErrors.facultad}
            />
            <FormField
              label="Programa académico *"
              name="programa"
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
              placeholder="Ingeniería de Sistemas"
              required
              error={fieldErrors.programa}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-hub-soft">
                Sede *
              </label>
              <div className="relative">
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-hub-input-border bg-hub-input px-3.5 pr-8 py-2 text-sm text-hub-text shadow-2xs transition-colors duration-150 hover:border-slate-400 dark:hover:border-white/20 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
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

            <div className="space-y-1.5">
              <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-hub-soft">
                Semestre actual *
              </label>
              <div className="relative">
                <select
                  value={semestreActual}
                  onChange={(e) => setSemestreActual(e.target.value)}
                  className="block w-full appearance-none rounded-xl border border-hub-input-border bg-hub-input px-3.5 pr-8 py-2 text-sm text-hub-text shadow-2xs transition-colors duration-150 hover:border-slate-400 dark:hover:border-white/20 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
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
              label="Promedio acumulado *"
              name="promedioAcademico"
              value={promedioAcademico}
              onChange={(e) => setPromedioAcademico(e.target.value)}
              placeholder="Ej. 4.2"
              required
              error={fieldErrors.promedioAcademico}
            />
          </div>

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-[2] h-10 flex items-center justify-center gap-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs"
            >
              <span>Continuar a investigación</span>
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PASO 3: TRAYECTORIA E INTERÉS INVESTIGATIVO          */}
      {/* ---------------------------------------------------- */}
      {step === 3 && (
        <div className="space-y-3 pt-0.5 animate-in fade-in-50 duration-200">
          <div className="space-y-1.5">
            <label className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-hub-soft">
              Líneas de investigación de interés
            </label>
            <div className="flex flex-wrap gap-1.5">
              {RESEARCH_LINES.map((line) => {
                const isSelected = selectedLines.includes(line);
                return (
                  <button
                    key={line}
                    type="button"
                    onClick={() => toggleLine(line)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-all duration-150 cursor-pointer border",
                      isSelected
                        ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-medium"
                        : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-white/20",
                    )}
                  >
                    {isSelected && <Check size={12} className="stroke-[2.5]" />}
                    <span>{line}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={lineasAdicionales}
              onChange={(e) => setLineasAdicionales(e.target.value)}
              placeholder="Otras líneas o temáticas de interés..."
              className="block w-full rounded-xl border border-hub-input-border bg-hub-input px-3.5 py-1.5 text-xs text-hub-text placeholder:text-slate-400 dark:placeholder:text-hub-muted shadow-2xs transition-colors focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <TextAreaField
              label="Experiencia investigativa"
              name="experienciaInvestigativa"
              value={experienciaInvestigativa}
              onChange={(e) => setExperienciaInvestigativa(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Proyectos de aula, ferias, etc."
            />
            <TextAreaField
              label="Áreas de estudio"
              name="areasEstudio"
              value={areasEstudio}
              onChange={(e) => setAreasEstudio(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Temas que más te apasionan..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <TextAreaField
              label="Publicaciones recientes (si aplica)"
              name="publicaciones"
              value={publicaciones}
              onChange={(e) => setPublicaciones(e.target.value)}
              rows={1}
              maxLength={800}
              placeholder="Artículos, ponencias..."
            />
            <TextAreaField
              label="Prácticas o pasantías (si aplica)"
              name="practicasPasantias"
              value={practicasPasantias}
              onChange={(e) => setPracticasPasantias(e.target.value)}
              rows={1}
              maxLength={800}
              placeholder="Empresas, laboratorios..."
            />
          </div>

          <TextAreaField
            label="Mensaje o motivación (opcional)"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={1}
            maxLength={1000}
            placeholder="¿Por qué te gustaría formar parte del semillero AlfaCode?"
          />

          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 font-medium text-sm transition-all duration-150 cursor-pointer"
            >
              <ChevronLeft size={15} />
              <span>Atrás</span>
            </button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Enviando..."
              className="flex-[2] h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-medium text-sm transition-all duration-150 cursor-pointer shadow-xs"
            >
              <span>Enviar hoja de vida</span>
              <Sparkles size={14} className="ml-1 text-cyan-200" />
            </Button>
          </div>
        </div>
      )}
    </form>
  );
}
