"use client";

import { useState } from "react";
import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Mail,
  MapPin,
  Send,
  Sparkles,
  User,
} from "lucide-react";

import { GithubIcon } from "@/components/icons/github-icon";
import { siteConfig } from "@/config/site";

export function ContactPage() {
  const [copied, setCopied] = useState(false);
  const [formSent, setFormSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    topic: "VINCULACION",
    message: "",
  });

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(siteConfig.links.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    setFormSent(true);
  };

  return (
    <div className="w-full">
      {/* Encabezado */}
      <div className="max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-[0.24em] text-cyan-200">
          <Mail size={14} className="text-cyan-400" aria-hidden="true" />
          Canales Oficiales &amp; Vinculación
        </span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          Contacto &amp; Colaboración
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-300 sm:text-lg">
          Punto de contacto para proyectos de grado, alianzas de investigación y vinculación al semillero AlfaCode.
        </p>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        {/* Columna Izquierda: Información de Contacto y Canales */}
        <div className="scroll-reveal space-y-6 lg:col-span-5">
          {/* Tarjeta de Correo Directo */}
          <div className="glass-card-interactive rounded-xl p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.25)]">
                <Mail size={20} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-xs font-mono uppercase tracking-wider text-cyan-300">
                  Correo de Dirección
                </span>
                <span className="block text-sm font-semibold text-white">
                  R. Damian Quintero
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Para consultas de gobernanza, propuestas de investigación y solicitudes de vinculación académica.
            </p>

            <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 p-2.5">
              <span className="font-mono text-xs text-slate-200 truncate pr-2">
                {siteConfig.links.email}
              </span>
              <button
                type="button"
                onClick={handleCopyEmail}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-300 transition-colors hover:border-cyan-400/40 hover:text-white"
                title="Copiar correo electrónico"
                aria-label="Copiar correo electrónico"
              >
                {copied ? (
                  <Check size={14} className="text-emerald-400" aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
              </button>
            </div>

            <div className="mt-4">
              <a
                href={siteConfig.links.contact}
                className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-cyan-300 transition-colors hover:text-white"
              >
                <span>Abrir en cliente de correo</span>
                <ExternalLink size={13} aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Tarjeta de Repositorio GitHub */}
          <div className="glass-card-interactive rounded-xl p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.25)]">
                <GithubIcon size={20} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-xs font-mono uppercase tracking-wider text-cyan-300">
                  Código &amp; Repositorios
                </span>
                <span className="block text-sm font-semibold text-white">
                  GitHub Organization
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Explora los repositorios públicos y proyectos de código abierto impulsados por AlfaCode.
            </p>

            <div className="mt-5">
              <a
                href={siteConfig.links.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/30 bg-cyan-950/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition-all hover:border-cyan-400/60 hover:bg-cyan-900/50 hover:text-white"
              >
                <GithubIcon size={15} aria-hidden="true" />
                <span>github.com/rastor65/alfacode</span>
                <ExternalLink size={12} className="opacity-70" aria-hidden="true" />
              </a>
            </div>
          </div>

          {/* Tarjeta de Ubicacion Institucional */}
          <div className="glass-card-interactive rounded-xl p-6 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-lg border border-cyan-400/30 bg-cyan-950/60 text-cyan-200 shadow-[0_0_15px_rgba(70,158,180,0.25)]">
                <MapPin size={20} aria-hidden="true" />
              </span>
              <div>
                <span className="block text-xs font-mono uppercase tracking-wider text-cyan-300">
                  Ubicación Académica
                </span>
                <span className="block text-sm font-semibold text-white">
                  Universidad de La Guajira
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-300">
              Facultad de Ingeniería · Programa de Ingeniería de Sistemas.
              <br />
              Km 5 Vía a Maicao · Riohacha, La Guajira, Colombia.
            </p>
          </div>
        </div>

        {/* Columna Derecha: Formulario Interactivo de Contacto */}
        <div className="scroll-reveal stagger-2 lg:col-span-7">
          <div className="glass-panel relative rounded-xl border border-cyan-400/25 p-7 sm:p-10 shadow-2xl">
            <div className="mb-6">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                <Sparkles size={14} className="text-cyan-400" aria-hidden="true" />
                Envía tu Consulta o Propuesta
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Mensaje Directo al Semillero
              </h2>
              <p className="mt-2 text-xs text-slate-400">
                Completa este formulario para coordinar reuniones, solicitar información técnica o iniciar tu postulación.
              </p>
            </div>

            {formSent ? (
              <div className="rounded-lg border border-emerald-400/30 bg-emerald-950/30 p-8 text-center backdrop-blur-md">
                <div className="mx-auto flex size-14 items-center justify-center rounded-lg border border-emerald-400/40 bg-emerald-500/20 text-emerald-300">
                  <CheckCircle2 size={28} aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-xl font-bold text-white">
                  ¡Mensaje Registrado con Éxito!
                </h3>
                <p className="mt-2 text-sm text-slate-300">
                  Gracias por escribir a AlfaCode. Nos pondremos en contacto contigo a través del correo proporcionado a la mayor brevedad.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFormSent(false);
                    setFormData({ name: "", email: "", topic: "VINCULACION", message: "" });
                  }}
                  className="mt-6 inline-flex rounded-lg border border-emerald-400/40 bg-emerald-900/40 px-5 py-2 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-800/50"
                >
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="contact-name"
                    className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                  >
                    Nombre y Apellidos
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ej. Juan Pérez"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-email"
                    className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                  >
                    Correo Electrónico (Institucional o Personal)
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="ejemplo@uniguajira.edu.co"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-topic"
                    className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                  >
                    Motivo de Contacto
                  </label>
                  <select
                    id="contact-topic"
                    value={formData.topic}
                    onChange={(e) =>
                      setFormData({ ...formData, topic: e.target.value })
                    }
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 px-4 py-2.5 text-sm text-white transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  >
                    <option value="VINCULACION" className="bg-slate-900 text-white">
                      Postulación / Vinculación como Estudiante, Investigador o Desarrollador
                    </option>
                    <option value="INVESTIGACION" className="bg-slate-900 text-white">
                      Alianza de Investigación / Colaboración Científica
                    </option>
                    <option value="PROYECTO_GRADO" className="bg-slate-900 text-white">
                      Propuesta de Proyecto de Grado
                    </option>
                    <option value="CONSULTA_GENERAL" className="bg-slate-900 text-white">
                      Consulta General o Asistencia Técnica
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-mono font-medium uppercase tracking-wider text-slate-300"
                  >
                    Detalle del Mensaje
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    placeholder="Describe brevemente tu interés, propuesta o antecedentes..."
                    className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900/60 p-4 text-sm text-white placeholder-slate-500 transition-colors focus:border-cyan-400/60 focus:bg-slate-900/90 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 resize-y"
                  />
                </div>

                <button
                  type="submit"
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-400/40 bg-gradient-to-r from-cyan-600 via-cyan-500 to-cyan-600 py-3 text-sm font-semibold text-slate-950 shadow-[0_0_20px_rgba(70,158,180,0.35)] transition-all duration-200 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 cursor-pointer"
                >
                  <Send size={16} aria-hidden="true" />
                  Enviar Mensaje Directo
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
