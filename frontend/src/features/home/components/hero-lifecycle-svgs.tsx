"use client";

import React from "react";

/**
 * Colección de diagramas vectoriales SVG arquitectónicos y de ingeniería
 * para las 7 fases del Ciclo de Vida del Software AlfaCode.
 * Diseñados con estética de laboratorio de investigación, telemetría y C4.
 */

// FASE 01: Problema & Diagnóstico (Matriz de radar, coordenadas, detección de anomalías)
export function SvgPhaseProblem({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Diagnóstico y Problema"
    >
      <defs>
        <radialGradient id="grad-radar" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.25" />
          <stop offset="70%" stopColor="#0891b2" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
        </radialGradient>
        <pattern id="grid-pattern-1" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeOpacity="0.07" strokeWidth="0.8" />
        </pattern>
      </defs>

      {/* Cuadrícula técnica de fondo */}
      <rect width="360" height="210" fill="url(#grid-pattern-1)" className="text-cyan-500 dark:text-cyan-400" />
      <rect x="0.5" y="0.5" width="359" height="209" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Centro del radar */}
      <g transform="translate(180, 105)">
        {/* Resplandor ambiental */}
        <circle r="75" fill="url(#grad-radar)" />

        {/* Anillos de rango métrico */}
        <circle r="80" stroke="currentColor" strokeOpacity="0.12" strokeDasharray="3 3" className="text-cyan-400" />
        <circle r="55" stroke="currentColor" strokeOpacity="0.25" className="text-cyan-400" />
        <circle r="30" stroke="currentColor" strokeOpacity="0.4" className="text-cyan-400" />

        {/* Ejes cartesianos */}
        <line x1="-90" y1="0" x2="90" y2="0" stroke="currentColor" strokeOpacity="0.2" className="text-cyan-400" />
        <line x1="0" y1="-85" x2="0" y2="85" stroke="currentColor" strokeOpacity="0.2" className="text-cyan-400" />

        {/* Aguja de escaneo giratoria (radar sweep) */}
        <g className="origin-center animate-[spin_6s_linear_infinite]">
          <line x1="0" y1="0" x2="65" y2="-45" stroke="#22d3ee" strokeWidth="1.5" strokeOpacity="0.8" />
          <circle cx="65" cy="-45" r="3" fill="#22d3ee" />
        </g>

        {/* Nodos de telemetría de requerimientos / problema */}
        <g className="animate-pulse">
          <circle cx="-42" cy="-28" r="4" fill="#38bdf8" />
          <circle cx="-42" cy="-28" r="9" stroke="#38bdf8" strokeOpacity="0.4" />
          <line x1="-42" y1="-28" x2="0" y2="0" stroke="#38bdf8" strokeOpacity="0.3" strokeDasharray="2 2" />
          <text x="-62" y="-36" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-cyan-300">REQ::01</text>
        </g>

        <g>
          <circle cx="48" cy="32" r="3.5" fill="#f43f5e" />
          <circle cx="48" cy="32" r="8" stroke="#f43f5e" strokeOpacity="0.4" />
          <line x1="48" y1="32" x2="0" y2="0" stroke="#f43f5e" strokeOpacity="0.3" strokeDasharray="2 2" />
          <text x="32" y="48" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-rose-400">GAP::CRIT</text>
        </g>

        <g>
          <circle cx="-25" cy="46" r="3.5" fill="#34d399" />
          <line x1="-25" y1="46" x2="0" y2="0" stroke="#34d399" strokeOpacity="0.3" strokeDasharray="2 2" />
          <text x="-48" y="60" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-emerald-400">DATA::IN</text>
        </g>

        {/* Núcleo central del problema formulado */}
        <circle r="7" fill="#0891b2" stroke="#22d3ee" strokeWidth="2" />
        <circle r="2.5" fill="#ffffff" />
      </g>

      {/* Marcas de coordenadas HUD */}
      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        TELEMETRY::ROOT_PROBLEM
      </text>
      <text x="14" y="38" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-400">
        LAT: 11.5448° N · LON: 72.9072° W
      </text>
      <text x="260" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-cyan-300 font-bold">
        STATUS: ANALYZED
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        SCAN_MATRIX // STAGE 01 // SGPAI-CORE
      </text>
      <text x="274" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-emerald-400 font-semibold">
        CONFIDENCE: 98.4%
      </text>
    </svg>
  );
}

// FASE 02: Marco & Investigación (Grafo de conocimiento, citas indexadas, análisis bibliométrico)
export function SvgPhaseResearch({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Investigación y Estado del Arte"
    >
      <rect width="360" height="210" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Red de nodos bibliométricos interconectados */}
      <g stroke="currentColor" strokeOpacity="0.25" strokeWidth="1" className="text-cyan-400">
        <line x1="80" y1="60" x2="180" y2="90" />
        <line x1="180" y1="90" x2="280" y2="55" />
        <line x1="180" y1="90" x2="130" y2="150" />
        <line x1="180" y1="90" x2="240" y2="155" />
        <line x1="80" y1="60" x2="130" y2="150" />
        <line x1="280" y1="55" x2="240" y2="155" />
        <line x1="130" y1="150" x2="240" y2="155" />
      </g>

      {/* Ondas radiales en nodo central de tesis */}
      <circle cx="180" cy="90" r="28" stroke="#38bdf8" strokeOpacity="0.15" />
      <circle cx="180" cy="90" r="18" fill="#0369a1" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="180" cy="90" r="6" fill="#38bdf8" />
      <text x="180" y="118" textAnchor="middle" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-white font-bold">
        STATE_OF_ART::CORE
      </text>

      {/* Nodo IEEE / Scopus */}
      <g>
        <circle cx="80" cy="60" r="14" fill="#0e7490" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1.2" />
        <text x="80" y="63" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">IEEE</text>
        <text x="80" y="82" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-slate-400">Q1 · Index</text>
      </g>

      {/* Nodo Scopus / Springer */}
      <g>
        <circle cx="280" cy="55" r="14" fill="#0e7490" fillOpacity="0.3" stroke="#22d3ee" strokeWidth="1.2" />
        <text x="280" y="58" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace" fontWeight="bold">SCOPUS</text>
        <text x="280" y="77" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-slate-400">Citations: 42</text>
      </g>

      {/* Nodo MinCiencias */}
      <g>
        <circle cx="130" cy="150" r="13" fill="#047857" fillOpacity="0.25" stroke="#34d399" strokeWidth="1.2" />
        <text x="130" y="153" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="bold">CVLAC</text>
        <text x="130" y="172" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-slate-400">GrupLAC A1</text>
      </g>

      {/* Nodo Algoritmos / Viabilidad */}
      <g>
        <circle cx="240" cy="155" r="13" fill="#6366f1" fillOpacity="0.25" stroke="#a5b4fc" strokeWidth="1.2" />
        <text x="240" y="158" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="bold">MATH</text>
        <text x="240" y="176" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-slate-400">p &lt; 0.001</text>
      </g>

      {/* Encabezado y badges */}
      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        KNOWLEDGE_GRAPH::LITERATURE
      </text>
      <text x="270" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-emerald-400 font-bold">
        VIABILITY: PASS
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        BIBLIOMETRIC_SYNTHESIS // STAGE 02
      </text>
    </svg>
  );
}

// FASE 03: Diseño & Arquitectura (Diagrama C4, microservicios, gateway de datos)
export function SvgPhaseArchitecture({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Arquitectura y Diseño C4"
    >
      <rect width="360" height="210" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Bloque 1: Client Layer */}
      <rect x="20" y="60" width="70" height="90" rx="6" fill="#082f49" fillOpacity="0.4" stroke="#0284c7" strokeWidth="1.2" />
      <text x="55" y="80" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="monospace" fontWeight="bold">CLIENT</text>
      <rect x="30" y="92" width="50" height="18" rx="3" fill="#0284c7" fillOpacity="0.3" />
      <text x="55" y="104" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace">Next.js UI</text>
      <rect x="30" y="116" width="50" height="18" rx="3" fill="#0284c7" fillOpacity="0.3" />
      <text x="55" y="128" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace">Tailwind</text>

      {/* Flecha conectora 1 */}
      <path d="M 90 105 L 126 105" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
      <polygon points="126,102 132,105 126,108" fill="#38bdf8" />

      {/* Bloque 2: API Gateway & Auth */}
      <rect x="135" y="45" width="90" height="120" rx="6" fill="#164e63" fillOpacity="0.35" stroke="#22d3ee" strokeWidth="1.2" />
      <text x="180" y="65" textAnchor="middle" fill="#22d3ee" fontSize="8" fontFamily="monospace" fontWeight="bold">API GATEWAY</text>
      <rect x="145" y="76" width="70" height="20" rx="3" fill="#0891b2" fillOpacity="0.3" />
      <text x="180" y="89" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace">Auth / JWT</text>
      <rect x="145" y="102" width="70" height="20" rx="3" fill="#0891b2" fillOpacity="0.3" />
      <text x="180" y="115" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace">Rate Limiter</text>
      <rect x="145" y="128" width="70" height="20" rx="3" fill="#0891b2" fillOpacity="0.3" />
      <text x="180" y="141" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace">NestJS Core</text>

      {/* Flechas conectoras 2 */}
      <path d="M 225 90 L 260 75" stroke="#34d399" strokeWidth="1.5" />
      <polygon points="258,72 265,74 260,78" fill="#34d399" />
      <path d="M 225 120 L 260 135" stroke="#34d399" strokeWidth="1.5" />
      <polygon points="260,132 265,136 258,138" fill="#34d399" />

      {/* Bloque 3: Storage & Database */}
      <rect x="268" y="55" width="72" height="42" rx="5" fill="#064e3b" fillOpacity="0.35" stroke="#10b981" strokeWidth="1.2" />
      <text x="304" y="73" textAnchor="middle" fill="#34d399" fontSize="7.5" fontFamily="monospace" fontWeight="bold">POSTGRES</text>
      <text x="304" y="86" textAnchor="middle" fill="#a7f3d0" fontSize="6.5" fontFamily="monospace">ACID Schema</text>

      <rect x="268" y="115" width="72" height="42" rx="5" fill="#831843" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="1.2" />
      <text x="304" y="133" textAnchor="middle" fill="#fb7185" fontSize="7.5" fontFamily="monospace" fontWeight="bold">REDIS CACHE</text>
      <text x="304" y="146" textAnchor="middle" fill="#fbcfe8" fontSize="6.5" fontFamily="monospace">sub-millisecond</text>

      {/* Título de la vista arquitectónica */}
      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        SYSTEM_MODEL::C4_ARCHITECTURE
      </text>
      <text x="264" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-cyan-300 font-bold">
        CLEAN ARCH
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        MODULAR_DESIGN // STAGE 03 // LAYERED_TOPOLOGY
      </text>
    </svg>
  );
}

// FASE 04: Desarrollo & Prototipado (Pipeline de Git, commit tree, compilación limpia)
export function SvgPhaseDevelopment({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Desarrollo y Prototipado"
    >
      <rect width="360" height="210" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Árbol de Git branches interactivo */}
      <g transform="translate(30, 45)">
        {/* Línea main branch */}
        <line x1="20" y1="35" x2="280" y2="35" stroke="#22d3ee" strokeWidth="2.5" />
        <circle cx="40" cy="35" r="5" fill="#22d3ee" />
        <circle cx="110" cy="35" r="5" fill="#22d3ee" />
        <circle cx="210" cy="35" r="5" fill="#22d3ee" />
        <circle cx="270" cy="35" r="6" fill="#34d399" stroke="#ffffff" strokeWidth="1.5" />
        <text x="40" y="22" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-cyan-300 font-bold">init</text>
        <text x="110" y="22" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-cyan-300 font-bold">v0.1</text>
        <text x="210" y="22" textAnchor="middle" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-cyan-300 font-bold">v0.2</text>
        <text x="270" y="22" textAnchor="middle" fill="#34d399" fontSize="7.5" fontFamily="monospace" fontWeight="bold">MVP 1.0</text>

        {/* Feature branch curva */}
        <path d="M 40 35 C 70 35, 70 85, 100 85 L 180 85 C 200 85, 200 35, 210 35" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" />
        <circle cx="100" cy="85" r="4.5" fill="#f59e0b" />
        <circle cx="140" cy="85" r="4.5" fill="#f59e0b" />
        <circle cx="180" cy="85" r="4.5" fill="#f59e0b" />
        <text x="140" y="102" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace">feat/contracts-types</text>
      </g>

      {/* Terminal de build & testing */}
      <rect x="25" y="125" width="310" height="52" rx="6" fill="#020617" fillOpacity="0.75" stroke="currentColor" strokeOpacity="0.2" className="text-cyan-400" />
      <circle cx="37" cy="135" r="3" fill="#f43f5e" />
      <circle cx="47" cy="135" r="3" fill="#f59e0b" />
      <circle cx="57" cy="135" r="3" fill="#10b981" />
      <text x="70" y="138" fill="currentColor" fontSize="7" fontFamily="monospace" className="text-slate-400">
        bash ~ npm run verify
      </text>
      <text x="35" y="154" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">
        ✓ 43 tests passed (100% assertions) · Typecheck Clean (0 errors)
      </text>
      <text x="35" y="167" fill="#38bdf8" fontSize="8" fontFamily="monospace">
        ✓ Production artifact compiled in 6.5s · Ready for deployment
      </text>

      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        DEV_PIPELINE::CODE_STABLE
      </text>
      <text x="250" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-emerald-400 font-bold">
        BUILD: GREEN ✓
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        CONTINUOUS_INTEGRATION // STAGE 04
      </text>
    </svg>
  );
}

// FASE 05: Inteligencia Artificial & IoT (Transformer attention, tensores, microcontrolador ESP32)
export function SvgPhaseIntelligence({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Inteligencia Artificial y Hardware IoT"
    >
      <rect width="360" height="210" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Lado izquierdo: Hardware IoT ESP32 */}
      <rect x="25" y="55" width="85" height="100" rx="6" fill="#082f49" fillOpacity="0.4" stroke="#06b6d4" strokeWidth="1.2" />
      <text x="67" y="74" textAnchor="middle" fill="#67e8f9" fontSize="8" fontFamily="monospace" fontWeight="bold">ESP32 EDGE</text>
      {/* Pines de chip */}
      <rect x="35" y="85" width="55" height="35" rx="3" fill="#0e7490" fillOpacity="0.5" stroke="#22d3ee" strokeWidth="0.8" />
      <text x="62" y="106" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace">MCU SOC</text>
      <text x="67" y="136" textAnchor="middle" fill="currentColor" fontSize="6.5" fontFamily="monospace" className="text-cyan-300">MQTT / BLE 5.0</text>
      <circle cx="32" cy="144" r="2.5" fill="#34d399" className="animate-ping" />

      {/* Ondas inalámbricas hacia el motor de IA */}
      <path d="M 115 105 Q 140 105 160 105" stroke="#22d3ee" strokeWidth="2" strokeDasharray="3 3" />
      <polygon points="160,102 166,105 160,108" fill="#22d3ee" />

      {/* Lado derecho: Red Neuronal & Attention Transformer */}
      <g transform="translate(175, 45)">
        <rect x="0" y="0" width="160" height="120" rx="8" fill="#1e1b4b" fillOpacity="0.35" stroke="#818cf8" strokeWidth="1.2" />
        <text x="80" y="20" textAnchor="middle" fill="#a5b4fc" fontSize="8" fontFamily="monospace" fontWeight="bold">
          LLM &amp; INFERENCE ENGINE
        </text>

        {/* Nodos de tensores */}
        <g stroke="#818cf8" strokeOpacity="0.35" strokeWidth="1">
          <line x1="25" y1="45" x2="80" y2="40" />
          <line x1="25" y1="45" x2="80" y2="70" />
          <line x1="25" y1="75" x2="80" y2="40" />
          <line x1="25" y1="75" x2="80" y2="70" />
          <line x1="25" y1="75" x2="80" y2="95" />
          <line x1="80" y1="40" x2="135" y2="60" />
          <line x1="80" y1="70" x2="135" y2="60" />
          <line x1="80" y1="95" x2="135" y2="60" />
        </g>

        <circle cx="25" cy="45" r="5" fill="#6366f1" />
        <circle cx="25" cy="75" r="5" fill="#6366f1" />
        <circle cx="80" cy="40" r="5.5" fill="#a855f7" />
        <circle cx="80" cy="70" r="5.5" fill="#a855f7" />
        <circle cx="80" cy="95" r="5.5" fill="#a855f7" />
        <circle cx="135" cy="60" r="7" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
        <text x="135" y="80" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">
          MCP TOOL
        </text>

        <text x="80" y="112" textAnchor="middle" fill="#34d399" fontSize="7" fontFamily="monospace">
          LATENCY: 14ms · TOK/S: 88.5
        </text>
      </g>

      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        NEURAL_EDGE::IOT_INFERENCE
      </text>
      <text x="260" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-cyan-300 font-bold">
        ONLINE: SYNCED
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        MODEL_CONTEXT_PROTOCOL // STAGE 05
      </text>
    </svg>
  );
}

// FASE 06: Solución & Despliegue (Nube, Docker container, balanceador y monitoreo)
export function SvgPhaseDeployment({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Solución y Despliegue en la Nube"
    >
      <rect width="360" height="210" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Contenedor Cloud Cluster */}
      <g transform="translate(30, 45)">
        <rect x="0" y="0" width="300" height="125" rx="8" fill="#082f49" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 2" />
        <text x="18" y="20" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold">
          CLOUD CLUSTER // MULTI-REGION
        </text>

        {/* Pod 1: Ingress Load Balancer */}
        <rect x="15" y="35" width="75" height="70" rx="5" fill="#0f172a" fillOpacity="0.8" stroke="#0ea5e9" strokeWidth="1" />
        <text x="52" y="52" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">INGRESS</text>
        <text x="52" y="65" textAnchor="middle" fill="currentColor" fontSize="6.5" fontFamily="monospace" className="text-slate-400">Reverse Proxy</text>
        <circle cx="52" cy="85" r="8" fill="#0284c7" fillOpacity="0.3" stroke="#38bdf8" />
        <text x="52" y="88" textAnchor="middle" fill="#ffffff" fontSize="7" fontFamily="monospace">SSL</text>

        {/* Pod 2: Docker App Container */}
        <rect x="110" y="35" width="80" height="70" rx="5" fill="#0f172a" fillOpacity="0.8" stroke="#10b981" strokeWidth="1" />
        <text x="150" y="52" textAnchor="middle" fill="#34d399" fontSize="7" fontFamily="monospace" fontWeight="bold">DOCKER POD</text>
        <text x="150" y="65" textAnchor="middle" fill="currentColor" fontSize="6.5" fontFamily="monospace" className="text-slate-400">Next.js + Nest</text>
        <rect x="122" y="78" width="56" height="14" rx="3" fill="#059669" fillOpacity="0.3" />
        <text x="150" y="88" textAnchor="middle" fill="#a7f3d0" fontSize="7" fontFamily="monospace">UPTIME 99.9%</text>

        {/* Pod 3: Observabilidad & Métricas */}
        <rect x="210" y="35" width="75" height="70" rx="5" fill="#0f172a" fillOpacity="0.8" stroke="#a855f7" strokeWidth="1" />
        <text x="247" y="52" textAnchor="middle" fill="#c084fc" fontSize="7" fontFamily="monospace" fontWeight="bold">HEALTH</text>
        <path d="M 218 80 L 228 80 L 234 68 L 242 92 L 250 74 L 256 80 L 275 80" stroke="#34d399" strokeWidth="1.5" fill="none" />
        <text x="247" y="96" textAnchor="middle" fill="currentColor" fontSize="6.5" fontFamily="monospace" className="text-slate-400">0.02% error rate</text>
      </g>

      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        PRODUCTION_CLUSTER::HIGH_AVAILABILITY
      </text>
      <text x="270" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-emerald-400 font-bold">
        STATUS: LIVE
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        CONTINUOUS_DEPLOYMENT // STAGE 06
      </text>
    </svg>
  );
}

// FASE 07: Impacto & Divulgación (Transferencia científica, publicaciones, open source global)
export function SvgPhaseImpact({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 360 210"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`size-full ${className}`}
      aria-label="Diagrama vectorial de Impacto y Transferencia Científica"
    >
      <rect width="360" height="210" rx="10" stroke="currentColor" strokeOpacity="0.15" className="text-cyan-500 dark:text-cyan-400" />

      {/* Globo de difusión radial */}
      <g transform="translate(180, 105)">
        <circle r="75" stroke="currentColor" strokeOpacity="0.1" strokeDasharray="3 3" className="text-cyan-400" />
        <circle r="50" stroke="currentColor" strokeOpacity="0.2" className="text-cyan-400" />
        <circle r="25" fill="#0369a1" fillOpacity="0.25" stroke="#38bdf8" strokeWidth="1.5" />
        <circle r="6" fill="#22d3ee" />
        <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace" fontWeight="bold">HUB</text>

        {/* Vectores hacia la sociedad, academia y la industria */}
        <g stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.5">
          <line x1="-18" y1="-18" x2="-90" y2="-50" />
          <line x1="18" y1="-18" x2="90" y2="-50" />
          <line x1="0" y1="25" x2="0" y2="60" />
        </g>

        {/* Tarjeta 1: Paper Indexado */}
        <g transform="translate(-130, -75)">
          <rect width="80" height="36" rx="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="1" />
          <text x="40" y="15" textAnchor="middle" fill="#38bdf8" fontSize="7" fontFamily="monospace" fontWeight="bold">CIENCIA</text>
          <text x="40" y="27" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace">Paper Indexado</text>
        </g>

        {/* Tarjeta 2: Open Source GitHub */}
        <g transform="translate(50, -75)">
          <rect width="80" height="36" rx="4" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
          <text x="40" y="15" textAnchor="middle" fill="#34d399" fontSize="7" fontFamily="monospace" fontWeight="bold">OPEN SOURCE</text>
          <text x="40" y="27" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontFamily="monospace">GitHub Repo</text>
        </g>

        {/* Tarjeta 3: Transferencia Territorial */}
        <g transform="translate(-45, 62)">
          <rect width="90" height="26" rx="4" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
          <text x="45" y="16" textAnchor="middle" fill="#fbbf24" fontSize="7" fontFamily="monospace" fontWeight="bold">
            IMPACTO REGIONAL
          </text>
        </g>
      </g>

      <text x="14" y="24" fill="currentColor" fontSize="9" fontFamily="monospace" className="text-cyan-400/90 font-bold tracking-widest">
        RESEARCH_DISSEMINATION::TRANSFER
      </text>
      <text x="250" y="24" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-emerald-400 font-bold">
        REACH: GLOBAL
      </text>
      <text x="14" y="196" fill="currentColor" fontSize="8" fontFamily="monospace" className="text-slate-500">
        SCIENTIFIC_OUTPUT // STAGE 07 // UNIGUAJIRA
      </text>
    </svg>
  );
}

// Mapa de componentes SVG por ID de fase ("01" a "07")
export const lifecycleSvgMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "01": SvgPhaseProblem,
  "02": SvgPhaseResearch,
  "03": SvgPhaseArchitecture,
  "04": SvgPhaseDevelopment,
  "05": SvgPhaseIntelligence,
  "06": SvgPhaseDeployment,
  "07": SvgPhaseImpact,
};
