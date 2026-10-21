import { FC } from "react";

/**
 * Visuales vectoriales de alta fidelidad para el carrusel del Hero:
 * Reemplazan los bloques densos de texto por representaciones gráficas interactivas
 * del pipeline de ingeniería e I+D de AlfaCode.
 */

// ---------------------------------------------------------------------------
// FASE 01: PROBLEMA & CONTEXTO (Radar de Diagnóstico y Detección de Anomalías)
// ---------------------------------------------------------------------------
export const PhaseVisual01: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual Diagnóstico y Problema">
    <defs>
      <linearGradient id="p1-grid" x1="0" y1="0" x2="520" y2="240" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0891b2" stopOpacity="0.08" />
        <stop offset="1" stopColor="#06b6d4" stopOpacity="0.02" />
      </linearGradient>
      <radialGradient id="p1-radar-glow" cx="260" cy="120" r="110" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" stopOpacity="0.25" />
        <stop offset="0.6" stopColor="#0891b2" stopOpacity="0.08" />
        <stop offset="1" stopColor="#0891b2" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="p1-sweep" x1="260" y1="120" x2="370" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#22d3ee" stopOpacity="0.8" />
        <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Fondo con micro-rejilla */}
    <rect width="520" height="240" rx="12" fill="url(#p1-grid)" />
    
    {/* Ejes cartesianos */}
    <line x1="40" y1="120" x2="480" y2="120" stroke="#22d3ee" strokeOpacity="0.15" strokeDasharray="4 4" />
    <line x1="260" y1="20" x2="260" y2="220" stroke="#22d3ee" strokeOpacity="0.15" strokeDasharray="4 4" />

    {/* Círculos concéntricos de escaneo */}
    <circle cx="260" cy="120" r="100" stroke="#22d3ee" strokeOpacity="0.2" strokeWidth="1.5" />
    <circle cx="260" cy="120" r="70" stroke="#22d3ee" strokeOpacity="0.3" strokeWidth="1" strokeDasharray="6 4" />
    <circle cx="260" cy="120" r="40" stroke="#22d3ee" strokeOpacity="0.4" strokeWidth="1.5" />
    <circle cx="260" cy="120" r="110" fill="url(#p1-radar-glow)" />

    {/* Haz de radar rotativo */}
    <g className="origin-[260px_120px] animate-[spin_6s_linear_infinite]">
      <path d="M260 120 L360 80 A100 100 0 0 0 260 20 Z" fill="url(#p1-sweep)" opacity="0.35" />
      <line x1="260" y1="120" x2="360" y2="80" stroke="#22d3ee" strokeWidth="1.5" opacity="0.9" />
    </g>

    {/* Nodos de Problema detectados */}
    <g transform="translate(310, 85)">
      <circle cx="0" cy="0" r="8" fill="#ef4444" fillOpacity="0.2" className="animate-ping" />
      <circle cx="0" cy="0" r="4" fill="#f87171" />
      <circle cx="0" cy="0" r="2" fill="#ffffff" />
      <text x="10" y="3" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="600">ANOMALÍA #01 [CRÍTICO]</text>
    </g>

    <g transform="translate(195, 145)">
      <circle cx="0" cy="0" r="6" fill="#f59e0b" fillOpacity="0.2" className="animate-ping" />
      <circle cx="0" cy="0" r="3.5" fill="#fbbf24" />
      <text x="8" y="3" fill="#fde68a" fontSize="8" fontFamily="monospace">BRECHA DE EFICIENCIA</text>
    </g>

    <g transform="translate(295, 165)">
      <circle cx="0" cy="0" r="3" fill="#22d3ee" />
      <text x="7" y="3" fill="#67e8f9" fontSize="8" fontFamily="monospace">REQUERIMIENTO R-04</text>
    </g>

    {/* HUD y Coordenadas Técnicas */}
    <rect x="24" y="24" width="130" height="42" rx="6" fill="#020617" fillOpacity="0.75" stroke="#22d3ee" strokeOpacity="0.3" />
    <text x="32" y="40" fill="#22d3ee" fontSize="8.5" fontFamily="monospace" fontWeight="bold">TELEMETRÍA DE ALCANCE</text>
    <text x="32" y="54" fill="#94a3b8" fontSize="8" fontFamily="monospace">COORD: 11.54° N, 72.90° W</text>

    <rect x="366" y="174" width="130" height="42" rx="6" fill="#020617" fillOpacity="0.75" stroke="#22d3ee" strokeOpacity="0.3" />
    <text x="374" y="190" fill="#34d399" fontSize="8.5" fontFamily="monospace" fontWeight="bold">● DIAGNÓSTICO EN CURSO</text>
    <text x="374" y="204" fill="#94a3b8" fontSize="8" fontFamily="monospace">MATRIZ TRL 01 → 02</text>
  </svg>
);

// ---------------------------------------------------------------------------
// FASE 02: INVESTIGACIÓN & ESTADO DEL ARTE (Grafo Científico de Conocimiento)
// ---------------------------------------------------------------------------
export const PhaseVisual02: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual Investigación y Estado del Arte">
    <defs>
      <linearGradient id="p2-line" x1="60" y1="40" x2="460" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" stopOpacity="0.6" />
        <stop offset="0.5" stopColor="#818cf8" stopOpacity="0.5" />
        <stop offset="1" stopColor="#34d399" stopOpacity="0.6" />
      </linearGradient>
      <radialGradient id="p2-node-glow" cx="260" cy="115" r="70" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" stopOpacity="0.3" />
        <stop offset="1" stopColor="#818cf8" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Fondo tenue */}
    <rect width="520" height="240" rx="12" fill="#030712" fillOpacity="0.3" />
    <circle cx="260" cy="115" r="70" fill="url(#p2-node-glow)" />

    {/* Aristas del grafo de literatura científica */}
    <path d="M120 70 L260 115 L380 65 L440 140 L360 185 L260 115 L160 170 Z" stroke="url(#p2-line)" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M120 70 L160 170 L260 115 L440 140" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
    <line x1="260" y1="115" x2="260" y2="40" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.5" strokeDasharray="2 2" />

    {/* Nodo Central: Hipótesis de Investigación */}
    <g transform="translate(260, 115)">
      <circle cx="0" cy="0" r="22" fill="#1e1b4b" stroke="#818cf8" strokeWidth="2" />
      <circle cx="0" cy="0" r="14" fill="#312e81" className="animate-pulse" />
      <circle cx="0" cy="0" r="5" fill="#a5b4fc" />
      <text x="0" y="34" fill="#c7d2fe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ESTADO DEL ARTE</text>
    </g>

    {/* Nodos Satélite de Literatura (IEEE, Scopus, Benchmark) */}
    <g transform="translate(120, 70)">
      <circle cx="0" cy="0" r="14" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="4" fill="#7dd3fc" />
      <text x="-8" y="-18" fill="#7dd3fc" fontSize="8" fontFamily="monospace">IEEE Xplore</text>
    </g>

    <g transform="translate(380, 65)">
      <circle cx="0" cy="0" r="14" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="4" fill="#6ee7b7" />
      <text x="8" y="-16" fill="#6ee7b7" fontSize="8" fontFamily="monospace">Scopus Q1/Q2</text>
    </g>

    <g transform="translate(440, 140)">
      <circle cx="0" cy="0" r="12" fill="#1e293b" stroke="#94a3b8" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="3.5" fill="#cbd5e1" />
      <text x="14" y="4" fill="#94a3b8" fontSize="8" fontFamily="monospace">Benchmark</text>
    </g>

    <g transform="translate(360, 185)">
      <circle cx="0" cy="0" r="13" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="4" fill="#d8b4fe" />
      <text x="14" y="16" fill="#d8b4fe" fontSize="8" fontFamily="monospace">Viabilidad</text>
    </g>

    <g transform="translate(160, 170)">
      <circle cx="0" cy="0" r="13" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="0" cy="0" r="4" fill="#a7f3d0" />
      <text x="-48" y="18" fill="#a7f3d0" fontSize="8" fontFamily="monospace">Evidencia Empírica</text>
    </g>

    <g transform="translate(260, 40)">
      <circle cx="0" cy="0" r="9" fill="#111827" stroke="#22d3ee" strokeWidth="1" />
      <circle cx="0" cy="0" r="3" fill="#22d3ee" />
      <text x="12" y="3" fill="#67e8f9" fontSize="8" fontFamily="monospace">Taxonomía</text>
    </g>

    {/* Badges de soporte */}
    <rect x="24" y="184" width="105" height="32" rx="6" fill="#020617" fillOpacity="0.75" stroke="#818cf8" strokeOpacity="0.3" />
    <text x="32" y="198" fill="#818cf8" fontSize="8" fontFamily="monospace" fontWeight="bold">ANÁLISIS CIENCIOMÉTRICO</text>
    <text x="32" y="209" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">METODOLOGÍA RIGUROSA</text>
  </svg>
);

// ---------------------------------------------------------------------------
// FASE 03: DISEÑO & ARQUITECTURA (Capas Isométricas C4 & Modelado)
// ---------------------------------------------------------------------------
export const PhaseVisual03: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual Diseño y Arquitectura C4">
    <defs>
      <linearGradient id="p3-plane-ui" x1="160" y1="40" x2="360" y2="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" stopOpacity="0.25" />
        <stop offset="1" stopColor="#0284c7" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="p3-plane-api" x1="160" y1="90" x2="360" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" stopOpacity="0.25" />
        <stop offset="1" stopColor="#4f46e5" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="p3-plane-db" x1="160" y1="140" x2="360" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" stopOpacity="0.25" />
        <stop offset="1" stopColor="#059669" stopOpacity="0.08" />
      </linearGradient>
    </defs>

    {/* Plano 3: Base de Datos & Persistencia (Fondo) */}
    <polygon points="260,150 410,185 260,220 110,185" fill="url(#p3-plane-db)" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.6" />
    <text x="260" y="190" fill="#a7f3d0" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PERSISTENCE LAYER · TYPEORM &amp; MIGRATIONS</text>

    {/* Conectores verticales capa 3 a 2 */}
    <line x1="170" y1="145" x2="170" y2="170" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="260" y1="150" x2="260" y2="120" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="350" y1="145" x2="350" y2="170" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />

    {/* Plano 2: Capa de Negocio / NestJS Monolith */}
    <polygon points="260,100 410,135 260,170 110,135" fill="url(#p3-plane-api)" stroke="#818cf8" strokeWidth="1.5" strokeOpacity="0.7" />
    <text x="260" y="140" fill="#c7d2fe" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">CORE API · MODULAR DOMAIN SERVICES</text>

    {/* Conectores verticales capa 2 a 1 */}
    <line x1="170" y1="95" x2="170" y2="120" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="350" y1="95" x2="350" y2="120" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" />

    {/* Plano 1: Capa de Presentación / Next.js UI */}
    <polygon points="260,50 410,85 260,120 110,85" fill="url(#p3-plane-ui)" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
    <text x="260" y="90" fill="#bae6fd" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PRESENTATION · NEXT.JS APP ROUTER</text>

    {/* Puntos y anotaciones técnicas a los lados */}
    <g transform="translate(30, 75)">
      <rect width="70" height="24" rx="4" fill="#020617" fillOpacity="0.8" stroke="#38bdf8" strokeOpacity="0.4" />
      <text x="35" y="15" fill="#38bdf8" fontSize="8" fontFamily="monospace" textAnchor="middle">CLIENT UI</text>
    </g>
    <path d="M100 87 L110 85" stroke="#38bdf8" strokeWidth="1.5" />

    <g transform="translate(30, 125)">
      <rect width="70" height="24" rx="4" fill="#020617" fillOpacity="0.8" stroke="#818cf8" strokeOpacity="0.4" />
      <text x="35" y="15" fill="#818cf8" fontSize="8" fontFamily="monospace" textAnchor="middle">REST / RBAC</text>
    </g>
    <path d="M100 137 L110 135" stroke="#818cf8" strokeWidth="1.5" />

    <g transform="translate(30, 175)">
      <rect width="70" height="24" rx="4" fill="#020617" fillOpacity="0.8" stroke="#34d399" strokeOpacity="0.4" />
      <text x="35" y="15" fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="middle">DATABASE</text>
    </g>
    <path d="M100 187 L110 185" stroke="#34d399" strokeWidth="1.5" />

    <g transform="translate(420, 130)">
      <rect width="80" height="30" rx="4" fill="#020617" fillOpacity="0.8" stroke="#22d3ee" strokeOpacity="0.3" />
      <text x="40" y="14" fill="#22d3ee" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">C4 SPEC</text>
      <text x="40" y="24" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">DECOUPLED</text>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// FASE 04: DESARROLLO & PROTOTIPADO (Editor de Código + Flujo Git CI)
// ---------------------------------------------------------------------------
export const PhaseVisual04: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual Desarrollo y Prototipado">
    {/* Ventana IDE de Código a la izquierda */}
    <rect x="25" y="25" width="280" height="190" rx="8" fill="#020617" fillOpacity="0.9" stroke="#38bdf8" strokeOpacity="0.3" strokeWidth="1.5" />
    
    {/* Botones de ventana */}
    <circle cx="42" cy="40" r="4" fill="#ef4444" />
    <circle cx="54" cy="40" r="4" fill="#f59e0b" />
    <circle cx="66" cy="40" r="4" fill="#10b981" />
    <text x="160" y="43" fill="#64748b" fontSize="8.5" fontFamily="monospace" textAnchor="middle">src/core/pipeline.ts</text>

    {/* Líneas de código simuladas con sintaxis de colores */}
    <text x="40" y="66" fill="#f43f5e" fontSize="9" fontFamily="monospace">export class</text>
    <text x="110" y="66" fill="#38bdf8" fontSize="9" fontFamily="monospace">PipelineRunner</text>
    <text x="195" y="66" fill="#cbd5e1" fontSize="9" fontFamily="monospace">&#123;</text>

    <text x="55" y="84" fill="#818cf8" fontSize="9" fontFamily="monospace">readonly</text>
    <text x="105" y="84" fill="#94a3b8" fontSize="9" fontFamily="monospace">version =</text>
    <text x="160" y="84" fill="#34d399" fontSize="9" fontFamily="monospace">&quot;2.0.0-hub&quot;;</text>

    <text x="55" y="104" fill="#f43f5e" fontSize="9" fontFamily="monospace">async</text>
    <text x="90" y="104" fill="#fbbf24" fontSize="9" fontFamily="monospace">executeBuild</text>
    <text x="160" y="104" fill="#cbd5e1" fontSize="9" fontFamily="monospace">(): Promise&lt;</text>
    <text x="228" y="104" fill="#38bdf8" fontSize="9" fontFamily="monospace">BuildStatus</text>
    <text x="288" y="104" fill="#cbd5e1" fontSize="9" fontFamily="monospace">&gt; &#123;</text>

    <text x="70" y="124" fill="#f43f5e" fontSize="9" fontFamily="monospace">const</text>
    <text x="105" y="124" fill="#cbd5e1" fontSize="9" fontFamily="monospace">res =</text>
    <text x="140" y="124" fill="#f43f5e" fontSize="9" fontFamily="monospace">await</text>
    <text x="175" y="124" fill="#fbbf24" fontSize="9" fontFamily="monospace">turboBuild</text>
    <text x="235" y="124" fill="#cbd5e1" fontSize="9" fontFamily="monospace">();</text>

    <text x="70" y="144" fill="#f43f5e" fontSize="9" fontFamily="monospace">return</text>
    <text x="115" y="144" fill="#cbd5e1" fontSize="9" fontFamily="monospace">res.assertPass();</text>

    <text x="55" y="164" fill="#cbd5e1" fontSize="9" fontFamily="monospace">&#125;</text>
    <text x="40" y="184" fill="#cbd5e1" fontSize="9" fontFamily="monospace">&#125;</text>

    {/* Árbol Git / Pipeline CI a la derecha */}
    <rect x="320" y="25" width="175" height="190" rx="8" fill="#020617" fillOpacity="0.85" stroke="#34d399" strokeOpacity="0.3" strokeWidth="1.5" />
    <text x="335" y="45" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold">GIT TREE &amp; CI/CD</text>

    {/* Ramas main y feature */}
    <line x1="345" y1="65" x2="345" y2="190" stroke="#38bdf8" strokeWidth="2" />
    <path d="M345 90 C375 90, 375 120, 375 140 L375 160 C375 175, 345 175, 345 175" stroke="#a855f7" strokeWidth="2" fill="none" />

    {/* Commits */}
    <circle cx="345" cy="70" r="5" fill="#38bdf8" />
    <text x="358" y="73" fill="#cbd5e1" fontSize="8" fontFamily="monospace">init: scaffold</text>

    <circle cx="375" cy="120" r="4.5" fill="#a855f7" />
    <text x="388" y="123" fill="#d8b4fe" fontSize="8" fontFamily="monospace">feat(core)</text>

    <circle cx="375" cy="150" r="4.5" fill="#a855f7" />
    <text x="388" y="153" fill="#d8b4fe" fontSize="8" fontFamily="monospace">test: 84 pass</text>

    <circle cx="345" cy="180" r="6" fill="#34d399" className="animate-pulse" />
    <text x="358" y="183" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold">merge: release</text>

    {/* Status badge */}
    <rect x="335" y="196" width="145" height="14" rx="3" fill="#10b981" fillOpacity="0.15" />
    <text x="407" y="206" fill="#34d399" fontSize="7" fontFamily="monospace" textAnchor="middle">✓ CI TESTS PASSING (84/84)</text>
  </svg>
);

// ---------------------------------------------------------------------------
// FASE 05: INTELIGENCIA ARTIFICIAL & IOT (Red Neuronal + Circuito Borde)
// ---------------------------------------------------------------------------
export const PhaseVisual05: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual IA y IoT">
    <defs>
      <linearGradient id="p5-tensor" x1="60" y1="120" x2="260" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#a855f7" stopOpacity="0.8" />
        <stop offset="1" stopColor="#38bdf8" stopOpacity="0.8" />
      </linearGradient>
    </defs>

    {/* Sección IA: Red Neuronal Multicapa (Izquierda) */}
    <g transform="translate(40, 40)">
      <rect width="210" height="160" rx="8" fill="#020617" fillOpacity="0.85" stroke="#a855f7" strokeOpacity="0.3" />
      <text x="15" y="22" fill="#c084fc" fontSize="9" fontFamily="monospace" fontWeight="bold">NEURAL INFERENCE ENGINE</text>

      {/* Capa de entrada (3 neuronas) */}
      <circle cx="40" cy="50" r="7" fill="#6b21a8" stroke="#c084fc" strokeWidth="1.5" />
      <circle cx="40" cy="90" r="7" fill="#6b21a8" stroke="#c084fc" strokeWidth="1.5" />
      <circle cx="40" cy="130" r="7" fill="#6b21a8" stroke="#c084fc" strokeWidth="1.5" />

      {/* Capa oculta (4 neuronas) */}
      <circle cx="105" cy="40" r="8" fill="#4c1d95" stroke="#a855f7" strokeWidth="1.5" />
      <circle cx="105" cy="75" r="8" fill="#4c1d95" stroke="#a855f7" strokeWidth="1.5" />
      <circle cx="105" cy="105" r="8" fill="#4c1d95" stroke="#a855f7" strokeWidth="1.5" />
      <circle cx="105" cy="140" r="8" fill="#4c1d95" stroke="#a855f7" strokeWidth="1.5" />

      {/* Capa de salida (2 neuronas con glow) */}
      <circle cx="170" cy="65" r="9" fill="#2563eb" stroke="#38bdf8" strokeWidth="2" className="animate-pulse" />
      <circle cx="170" cy="115" r="9" fill="#2563eb" stroke="#38bdf8" strokeWidth="2" className="animate-pulse" />

      {/* Pesos sinápticos */}
      <line x1="47" y1="50" x2="97" y2="40" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="47" y1="50" x2="97" y2="75" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="47" y1="90" x2="97" y2="75" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="47" y1="90" x2="97" y2="105" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.8" />
      <line x1="47" y1="130" x2="97" y2="105" stroke="#a855f7" strokeWidth="1" strokeOpacity="0.4" />
      <line x1="47" y1="130" x2="97" y2="140" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.6" />

      <line x1="113" y1="40" x2="161" y2="65" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.8" />
      <line x1="113" y1="75" x2="161" y2="65" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="113" y1="105" x2="161" y2="115" stroke="#38bdf8" strokeWidth="1.5" strokeOpacity="0.7" />
      <line x1="113" y1="140" x2="161" y2="115" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
    </g>

    {/* Puente de datos: Inferencia a Borde */}
    <path d="M250 120 L280 120" stroke="url(#p5-tensor)" strokeWidth="3" strokeDasharray="4 2" />

    {/* Sección IoT: Microcontrolador ESP32 & Sensores (Derecha) */}
    <g transform="translate(280, 40)">
      <rect width="200" height="160" rx="8" fill="#020617" fillOpacity="0.85" stroke="#38bdf8" strokeOpacity="0.3" />
      <text x="15" y="22" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">EMBEDDED EDGE / ESP32</text>

      {/* Chip SoC */}
      <rect x="55" y="45" width="90" height="80" rx="4" fill="#0f172a" stroke="#22d3ee" strokeWidth="1.5" />
      <text x="100" y="85" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">ESP32-S3</text>
      <text x="100" y="98" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">DUAL CORE 240MHz</text>

      {/* Pines del chip */}
      <line x1="45" y1="60" x2="55" y2="60" stroke="#38bdf8" strokeWidth="2" />
      <line x1="45" y1="75" x2="55" y2="75" stroke="#38bdf8" strokeWidth="2" />
      <line x1="45" y1="90" x2="55" y2="90" stroke="#38bdf8" strokeWidth="2" />
      <line x1="45" y1="105" x2="55" y2="105" stroke="#38bdf8" strokeWidth="2" />

      <line x1="145" y1="60" x2="155" y2="60" stroke="#34d399" strokeWidth="2" />
      <line x1="145" y1="75" x2="155" y2="75" stroke="#34d399" strokeWidth="2" />
      <line x1="145" y1="90" x2="155" y2="90" stroke="#34d399" strokeWidth="2" />
      <line x1="145" y1="105" x2="155" y2="105" stroke="#34d399" strokeWidth="2" />

      {/* Ondas inalámbricas Wi-Fi / MQTT */}
      <path d="M100 35 A 15 15 0 0 1 120 40" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M95 30 A 25 25 0 0 1 125 35" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.5" />

      <text x="100" y="148" fill="#34d399" fontSize="7.5" fontFamily="monospace" textAnchor="middle">● TELEMETRÍA MQTT ACTIVA</text>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// FASE 06: SOLUCIÓN & DESPLIEGUE (Topología Cloud, Contenedores & CI/CD)
// ---------------------------------------------------------------------------
export const PhaseVisual06: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual Solución y Despliegue">
    <defs>
      <linearGradient id="p6-cloud" x1="0" y1="0" x2="520" y2="240" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284c7" stopOpacity="0.15" />
        <stop offset="1" stopColor="#059669" stopOpacity="0.05" />
      </linearGradient>
    </defs>

    <rect width="520" height="240" rx="12" fill="url(#p6-cloud)" />

    {/* Load Balancer en la entrada */}
    <g transform="translate(60, 95)">
      <rect width="80" height="50" rx="8" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      <text x="40" y="24" fill="#38bdf8" fontSize="8.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">TRAFFIC GATEWAY</text>
      <text x="40" y="38" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">LOAD BALANCER</text>
    </g>

    {/* Líneas de distribución a pods */}
    <path d="M140 120 L200 65" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M140 120 L200 120" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M140 120 L200 175" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="3 3" />

    {/* Pod 1: Web Frontend Next.js */}
    <g transform="translate(200, 40)">
      <rect width="130" height="50" rx="6" fill="#020617" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="20" cy="25" r="4" fill="#38bdf8" className="animate-pulse" />
      <text x="35" y="23" fill="#bae6fd" fontSize="8.5" fontFamily="monospace" fontWeight="bold">CONTAINER 01</text>
      <text x="35" y="37" fill="#64748b" fontSize="7.5" fontFamily="monospace">Next.js Edge Cluster</text>
    </g>

    {/* Pod 2: API Backend NestJS */}
    <g transform="translate(200, 95)">
      <rect width="130" height="50" rx="6" fill="#020617" fillOpacity="0.85" stroke="#34d399" strokeWidth="1.5" />
      <circle cx="20" cy="25" r="4" fill="#34d399" className="animate-pulse" />
      <text x="35" y="23" fill="#a7f3d0" fontSize="8.5" fontFamily="monospace" fontWeight="bold">CONTAINER 02</text>
      <text x="35" y="37" fill="#64748b" fontSize="7.5" fontFamily="monospace">NestJS Core API</text>
    </g>

    {/* Pod 3: DB & Storage Worker */}
    <g transform="translate(200, 150)">
      <rect width="130" height="50" rx="6" fill="#020617" fillOpacity="0.85" stroke="#818cf8" strokeWidth="1.5" />
      <circle cx="20" cy="25" r="4" fill="#818cf8" className="animate-pulse" />
      <text x="35" y="23" fill="#c7d2fe" fontSize="8.5" fontFamily="monospace" fontWeight="bold">CONTAINER 03</text>
      <text x="35" y="37" fill="#64748b" fontSize="7.5" fontFamily="monospace">Data Vault &amp; SQLite</text>
    </g>

    {/* Telemetría de disponibilidad y Cloud Metrics */}
    <g transform="translate(365, 55)">
      <rect width="125" height="130" rx="8" fill="#020617" fillOpacity="0.9" stroke="#34d399" strokeOpacity="0.4" strokeWidth="1.5" />
      <text x="62" y="25" fill="#34d399" fontSize="9" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PRODUCTION STATUS</text>
      <line x1="15" y1="35" x2="110" y2="35" stroke="#34d399" strokeOpacity="0.2" />

      <text x="15" y="55" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">UPTIME:</text>
      <text x="110" y="55" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">99.98%</text>

      <text x="15" y="75" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">LATENCY:</text>
      <text x="110" y="75" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">14 ms</text>

      <text x="15" y="95" fill="#94a3b8" fontSize="7.5" fontFamily="monospace">TLS / SSL:</text>
      <text x="110" y="95" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="end">GRADE A+</text>

      <rect x="15" y="108" width="95" height="12" rx="3" fill="#059669" fillOpacity="0.2" />
      <text x="62" y="117" fill="#34d399" fontSize="6.5" fontFamily="monospace" textAnchor="middle">SYSTEM STABLE</text>
    </g>
  </svg>
);

// ---------------------------------------------------------------------------
// FASE 07: IMPACTO & DIVULGACIÓN (Red de Transferencia y Repositorio Abierto)
// ---------------------------------------------------------------------------
export const PhaseVisual07: FC = () => (
  <svg viewBox="0 0 520 240" fill="none" className="w-full h-auto max-h-[220px] select-none" aria-label="Visual Impacto y Divulgación">
    <defs>
      <radialGradient id="p7-radiate" cx="260" cy="120" r="100" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" stopOpacity="0.3" />
        <stop offset="0.6" stopColor="#34d399" stopOpacity="0.1" />
        <stop offset="1" stopColor="#0284c7" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ondas radiales de transferencia científica */}
    <circle cx="260" cy="120" r="100" fill="url(#p7-radiate)" />
    <circle cx="260" cy="120" r="90" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.2" strokeDasharray="4 4" />
    <circle cx="260" cy="120" r="60" stroke="#34d399" strokeWidth="1.2" strokeOpacity="0.3" />
    <circle cx="260" cy="120" r="30" stroke="#a855f7" strokeWidth="1.5" strokeOpacity="0.4" />

    {/* Hub Central: AlfaCode Core Transfer */}
    <g transform="translate(260, 120)">
      <circle cx="0" cy="0" r="18" fill="#0f172a" stroke="#22d3ee" strokeWidth="2" />
      <circle cx="0" cy="0" r="8" fill="#38bdf8" className="animate-ping" />
      <circle cx="0" cy="0" r="5" fill="#ffffff" />
    </g>

    {/* Nodos de Transferencia Regional y Global */}
    <g transform="translate(100, 60)">
      <rect width="105" height="36" rx="6" fill="#020617" fillOpacity="0.85" stroke="#38bdf8" strokeWidth="1.2" />
      <text x="52" y="16" fill="#38bdf8" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">PAPER INDEXADO</text>
      <text x="52" y="28" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">REVISTA CIENTÍFICA</text>
    </g>
    <line x1="205" y1="80" x2="245" y2="110" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

    <g transform="translate(320, 60)">
      <rect width="115" height="36" rx="6" fill="#020617" fillOpacity="0.85" stroke="#34d399" strokeWidth="1.2" />
      <text x="57" y="16" fill="#34d399" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">OPEN SOURCE CODE</text>
      <text x="57" y="28" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">GITHUB COMUNIDAD</text>
    </g>
    <line x1="320" y1="80" x2="275" y2="110" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 3" />

    <g transform="translate(90, 160)">
      <rect width="120" height="36" rx="6" fill="#020617" fillOpacity="0.85" stroke="#a855f7" strokeWidth="1.2" />
      <text x="60" y="16" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">TRANSFERENCIA GUUAJIRA</text>
      <text x="60" y="28" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">SECTOR PRODUCTIVO</text>
    </g>
    <line x1="210" y1="170" x2="245" y2="130" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3 3" />

    <g transform="translate(325, 160)">
      <rect width="110" height="36" rx="6" fill="#020617" fillOpacity="0.85" stroke="#fbbf24" strokeWidth="1.2" />
      <text x="55" y="16" fill="#fbbf24" fontSize="8" fontFamily="monospace" fontWeight="bold" textAnchor="middle">TALENTO FORMADO</text>
      <text x="55" y="28" fill="#94a3b8" fontSize="7" fontFamily="monospace" textAnchor="middle">INGENIERÍA APLICADA</text>
    </g>
    <line x1="325" y1="170" x2="275" y2="130" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="3 3" />
  </svg>
);
