"use client";

import { Check, ChevronLeft, ChevronRight, Sparkles, User, GraduationCap, Microscope } from "lucide-react";
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
  "IOT",
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
      current.includes(line) ? current.filter((item) => item !== line) : [...current, line]
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
      if (!celular.trim()) errors.celular = "Ingresa tu número celular de contacto.";
    }

    if (currentStep === 2) {
      if (!facultad.trim()) errors.facultad = "Ingresa la facultad.";
      if (!programa.trim()) errors.programa = "Ingresa el programa académico.";
      if (!sede.trim()) errors.sede = "Selecciona la sede.";
      if (!semestreActual.trim()) errors.semestreActual = "Selecciona el semestre actual.";
      if (!promedioAcademico.trim()) errors.promedioAcademico = "Ingresa tu promedio académico acumulado.";
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
      <div className="space-y-6">
        <Alert tone="success">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-emerald-400 shrink-0" />
            <p className="font-semibold text-emerald-200">¡Hoja de Vida y Postulación Recibida!</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-emerald-100/90">
            Hemos registrado tu resumen de hoja de vida para vincularte al semillero <strong>AlfaCode</strong>. La
            coordinación revisará tus antecedentes académicos y perfil investigativo.
          </p>
          <p className="mt-2 text-xs text-emerald-200/80">
            Una vez aprobada, recibirás en tu correo institucional (<strong>{email}</strong>) una contraseña temporal
            segura para acceder a la plataforma.
          </p>
        </Alert>
        <p className="text-center text-sm text-slate-300">
          ¿Ya cuentas con tu clave de acceso?{" "}
          <Link href="/ingresar" className="font-medium text-cyan-400 underline-offset-4 hover:underline">
            Ingresar al HUB
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Indicador de Pasos del Wizard */}
      <div className="space-y-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => step > 1 && setStep(1)}
            className={cn(
              "flex items-center gap-1.5 font-medium transition",
              step === 1 ? "text-cyan-400" : step > 1 ? "text-slate-300 hover:text-white" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-bold border",
                step === 1
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  : step > 1
                    ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-500",
              )}
            >
              {step > 1 ? <Check size={12} /> : "1"}
            </span>
            <span className="hidden sm:inline">Identificación</span>
          </button>

          <div className="h-px flex-1 mx-2 sm:mx-3 bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

          <button
            type="button"
            onClick={() => (step > 2 ? setStep(2) : validateStep(1) && setStep(2))}
            className={cn(
              "flex items-center gap-1.5 font-medium transition",
              step === 2 ? "text-cyan-400" : step > 2 ? "text-slate-300 hover:text-white" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-bold border",
                step === 2
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  : step > 2
                    ? "border-emerald-500/60 bg-emerald-950/60 text-emerald-400"
                    : "border-white/10 bg-white/5 text-slate-500",
              )}
            >
              {step > 2 ? <Check size={12} /> : "2"}
            </span>
            <span className="hidden sm:inline">Académico</span>
          </button>

          <div className="h-px flex-1 mx-2 sm:mx-3 bg-gradient-to-r from-white/10 via-white/20 to-white/10" />

          <button
            type="button"
            onClick={() => validateStep(1) && validateStep(2) && setStep(3)}
            className={cn(
              "flex items-center gap-1.5 font-medium transition",
              step === 3 ? "text-cyan-400" : "text-slate-500",
            )}
          >
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-[11px] font-bold border",
                step === 3
                  ? "border-cyan-400 bg-cyan-950/80 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.3)]"
                  : "border-white/10 bg-white/5 text-slate-500",
              )}
            >
              3
            </span>
            <span className="hidden sm:inline">Investigación</span>
          </button>
        </div>

        {/* Barra de Progreso Fluida */}
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 transition-all duration-300"
            style={{ width: step === 1 ? "33%" : step === 2 ? "66%" : "100%" }}
          />
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {/* PASO 1: IDENTIFICACIÓN Y CONTACTO */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <User size={14} />
            <span>1. Identificación Personal y Contacto</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
            label="Correo institucional (@uniguajira.edu.co) *"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="usuario@uniguajira.edu.co"
            required
            hint="Ahí llegará tu confirmación y clave de acceso institucional."
            error={fieldErrors.email}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField
              label="Documento de identidad *"
              name="documentoIdentidad"
              value={documentoIdentidad}
              onChange={(e) => setDocumentoIdentidad(e.target.value)}
              placeholder="C.C. / T.I. N°..."
              required
              error={fieldErrors.documentoIdentidad}
            />
            <FormField
              label="Fecha de Nacimiento *"
              name="fechaNacimiento"
              type="date"
              value={fechaNacimiento}
              onChange={(e) => setFechaNacimiento(e.target.value)}
              required
              error={fieldErrors.fechaNacimiento}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              label="Teléfono Fijo (opcional)"
              name="telefonoFijo"
              type="tel"
              value={telefonoFijo}
              onChange={(e) => setTelefonoFijo(e.target.value)}
              placeholder="(605) 727..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
            <Button type="button" onClick={handleNext} className="w-full flex items-center justify-center gap-2">
              <span>Continuar a Datos Académicos</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 2: INFORMACIÓN ACADÉMICA */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <GraduationCap size={14} />
            <span>2. Información Académica Uniguajira</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              label="Programa Académico *"
              name="programa"
              value={programa}
              onChange={(e) => setPrograma(e.target.value)}
              placeholder="Ingeniería de Sistemas"
              required
              error={fieldErrors.programa}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Sede *</label>
              <select
                value={sede}
                onChange={(e) => setSede(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              >
                {SEDES_UNIGUAJIRA.map((s) => (
                  <option key={s} value={s} className="bg-slate-900 text-white">
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Semestre Actual *</label>
              <select
                value={semestreActual}
                onChange={(e) => setSemestreActual(e.target.value)}
                className="block w-full rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
              >
                {SEMESTRES.map((sem) => (
                  <option key={sem} value={sem} className="bg-slate-900 text-white">
                    {sem}
                  </option>
                ))}
              </select>
            </div>

            <FormField
              label="Promedio Acumulado *"
              name="promedioAcademico"
              value={promedioAcademico}
              onChange={(e) => setPromedioAcademico(e.target.value)}
              placeholder="Ej. 4.2"
              required
              error={fieldErrors.promedioAcademico}
            />
          </div>

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrev}
              className="flex-1 flex items-center justify-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              className="flex-[2] flex items-center justify-center gap-2"
            >
              <span>Continuar a Perfil Investigativo</span>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* PASO 3: TRAYECTORIA E INTERÉS INVESTIGATIVO */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <Microscope size={14} />
            <span>3. Perfil e Interés Investigativo</span>
          </div>

          {/* Líneas de Investigación de Interés */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Líneas de Investigación de tu interés en AlfaCode
            </label>
            <div className="flex flex-wrap gap-2">
              {RESEARCH_LINES.map((line) => {
                const isSelected = selectedLines.includes(line);
                return (
                  <button
                    key={line}
                    type="button"
                    onClick={() => toggleLine(line)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-all",
                      isSelected
                        ? "border-cyan-400 bg-cyan-950/70 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.25)]"
                        : "border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20 hover:text-slate-200",
                    )}
                  >
                    <span>{isSelected ? "✓" : "+"}</span>
                    <span>{line}</span>
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={lineasAdicionales}
              onChange={(e) => setLineasAdicionales(e.target.value)}
              placeholder="Otras líneas o tecnologías de interés..."
              className="block w-full rounded-xl border border-white/10 bg-slate-900/90 px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/70"
            />
          </div>

          <TextAreaField
            label="Experiencia Investigativa y Proyectos"
            name="experienciaInvestigativa"
            value={experienciaInvestigativa}
            onChange={(e) => setExperienciaInvestigativa(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Proyectos de aula, ferias científicas, semilleros previos o desarrollo independiente..."
          />

          <TextAreaField
            label="Áreas y/o Temáticas de Estudio"
            name="areasEstudio"
            value={areasEstudio}
            onChange={(e) => setAreasEstudio(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Temas de computación que más te apasionan o en los que deseas profundizar..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <TextAreaField
              label="Publicaciones recientes (si aplica)"
              name="publicaciones"
              value={publicaciones}
              onChange={(e) => setPublicaciones(e.target.value)}
              rows={2}
              maxLength={800}
              placeholder="Artículos, ponencias o posters..."
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

          <TextAreaField
            label="Mensaje o motivación para el semillero (opcional)"
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="¿Por qué te gustaría formar parte del semillero AlfaCode?"
          />

          <div className="pt-2 flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handlePrev}
              disabled={pending}
              className="flex-1 flex items-center justify-center gap-1.5"
            >
              <ChevronLeft size={16} />
              <span>Atrás</span>
            </Button>
            <Button
              type="submit"
              pending={pending}
              pendingLabel="Enviando postulación…"
              className="flex-[2] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
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
