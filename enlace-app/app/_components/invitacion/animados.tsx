'use client'

import { useId, type CSSProperties } from 'react'
import type { IconoMomento } from '@/lib/invitacion'

/* ═══ Animaciones de la invitación ═══
   SVG dibujados aquí mismo para poder animar sus piezas con CSS (clases iv-a-*).
   Con «reducir movimiento» del sistema se quedan quietos. */

const T = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

function useClip() {
  return 'ivc' + useId().replace(/[^a-zA-Z0-9]/g, '')
}

function Destello({ x, y, r = 3, d = 0 }: { x: number; y: number; r?: number; d?: number }) {
  return (
    <path className="iv-a-tw" style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` } as CSSProperties}
      d={`M${x} ${y - r}L${x + r * 0.3} ${y - r * 0.3}L${x + r} ${y}L${x + r * 0.3} ${y + r * 0.3}L${x} ${y + r}L${x - r * 0.3} ${y + r * 0.3}L${x - r} ${y}L${x - r * 0.3} ${y - r * 0.3}Z`}
      fill="currentColor" stroke="none" />
  )
}

/** Bola de discoteca que gira y lanza destellos */
function Discoteca() {
  const id = useClip()
  return (
    <svg viewBox="0 0 64 64" className="iv-anim iv-anim-disco" aria-hidden="true">
      <path d="M32 2v14" {...T} strokeWidth={1.5} />
      <defs><clipPath id={id}><circle cx="32" cy="36" r="16" /></clipPath></defs>
      <circle cx="32" cy="36" r="16" fill="currentColor" opacity=".12" />
      <g clipPath={`url(#${id})`}>
        <g className="iv-a-gira">
          {Array.from({ length: 16 }, (_, i) => <path key={i} d={`M${8 + i * 4} 18v36`} stroke="currentColor" strokeWidth={1} opacity=".55" />)}
          {[0, 1, 2, 3, 4, 5].map(i => (
            <rect key={i} className="iv-a-brilla" style={{ animationDelay: `${i * 0.35}s` }}
              x={12 + i * 7} y={24 + (i % 3) * 8} width="4" height="4" fill="currentColor" />
          ))}
        </g>
        {[26, 31, 36, 41, 46].map(y => <path key={y} d={`M14 ${y}h36`} stroke="currentColor" strokeWidth={1} opacity=".45" />)}
      </g>
      <circle cx="32" cy="36" r="16" {...T} />
      <Destello x={9} y={20} r={4} />
      <Destello x={55} y={24} r={3.5} d={0.6} />
      <Destello x={52} y={56} r={3} d={1.1} />
      <Destello x={11} y={52} r={3} d={1.6} />
    </svg>
  )
}

function Anillos() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <g className="iv-a-bote">
        <circle cx="25" cy="38" r="13" {...T} />
        <circle cx="39" cy="38" r="13" {...T} />
        <path d="M39 25l-4-5 4-4 4 4z" {...T} strokeWidth={1.6} />
      </g>
      <Destello x={48} y={14} r={4} />
      <Destello x={16} y={16} r={2.6} d={0.9} />
    </svg>
  )
}

function Copas() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <g className="iv-a-copa-i">
        <path d="M14 10h12l-1 13a5 5 0 0 1-10 0z M20 28v20 M15 48h10" {...T} />
        <circle className="iv-a-burbuja" cx="20" cy="20" r="1.2" fill="currentColor" stroke="none" />
      </g>
      <g className="iv-a-copa-d">
        <path d="M38 10h12l-1 13a5 5 0 0 1-10 0z M44 28v20 M39 48h10" {...T} />
        <circle className="iv-a-burbuja" style={{ animationDelay: '.7s' }} cx="44" cy="20" r="1.2" fill="currentColor" stroke="none" />
      </g>
      <g className="iv-a-chin"><Destello x={32} y={8} r={4} /></g>
    </svg>
  )
}

function Cubiertos() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <circle cx="32" cy="34" r="14" {...T} opacity=".5" />
      <g className="iv-a-tenedor"><path d="M10 12v12a4 4 0 0 0 8 0V12 M14 12v44" {...T} /></g>
      <g className="iv-a-cuchillo"><path d="M54 12c-4 3-5 9-5 16h5v28" {...T} /></g>
    </svg>
  )
}

function Musica() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <path d="M22 46V16l26-5v30" {...T} />
      <circle cx="17" cy="46" r="5" {...T} />
      <circle cx="43" cy="41" r="5" {...T} />
      {[0, 1, 2].map(i => (
        <text key={i} className="iv-a-nota" style={{ animationDelay: `${i * 0.9}s` }} x={50 - i * 14} y="20" fontSize="12" fill="currentColor">♪</text>
      ))}
    </svg>
  )
}

function Tarta() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <path d="M12 54h40 M14 54V40h36v14 M20 40V30h24v10 M32 30v-8" {...T} />
      <path d="M14 47c3 2 6 2 9 0s6-2 9 0 6 2 9 0 6-2 9 0" {...T} strokeWidth={1.5} />
      <path className="iv-a-llama" d="M32 21c-3-3-3-6 0-10 3 4 3 7 0 10z" fill="currentColor" stroke="none" />
    </svg>
  )
}

function Bus() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <g className="iv-a-bache">
        <rect x="12" y="14" width="40" height="32" rx="6" {...T} />
        <path d="M12 30h40 M18 20h28" {...T} strokeWidth={1.5} />
        <circle cx="21" cy="46" r="4" {...T} /><circle cx="43" cy="46" r="4" {...T} />
      </g>
      <g className="iv-a-carretera"><path d="M0 57h10M18 57h10M36 57h10M54 57h10M72 57h10" {...T} strokeWidth={1.5} /></g>
    </svg>
  )
}

function Coche() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <g className="iv-a-bache">
        <path d="M8 42v-8l6-11h34l6 11v8z M14 23l4 9h28l4-9" {...T} />
        <circle cx="19" cy="42" r="5" {...T} /><circle cx="45" cy="42" r="5" {...T} />
        <path className="iv-a-lazo" d="M30 12c-4-4-8 0-2 3 6-3 2-7-2-3z" {...T} strokeWidth={1.4} />
      </g>
      <g className="iv-a-carretera"><path d="M0 55h10M18 55h10M36 55h10M54 55h10M72 55h10" {...T} strokeWidth={1.5} /></g>
    </svg>
  )
}

function Luna() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <path className="iv-a-luna" d="M44 40A18 18 0 1 1 26 14a14 14 0 0 0 18 26z" {...T} />
      <Destello x={46} y={14} r={4} />
      <Destello x={54} y={30} r={2.6} d={0.8} />
      <Destello x={38} y={6} r={2.2} d={1.5} />
    </svg>
  )
}

function Camara() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <path d="M8 22a4 4 0 0 1 4-4h8l4-6h16l4 6h8a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4z" {...T} />
      <circle cx="32" cy="33" r="9" {...T} />
      <g className="iv-a-flash"><Destello x={50} y={8} r={6} /></g>
    </svg>
  )
}

function Reloj() {
  return (
    <svg viewBox="0 0 64 64" className="iv-anim" aria-hidden="true">
      <circle cx="32" cy="32" r="22" {...T} />
      <path className="iv-a-aguja" d="M32 32V16" {...T} />
      <path d="M32 32l9 5" {...T} />
    </svg>
  )
}

export function IconoAnimado({ n }: { n: IconoMomento }) {
  switch (n) {
    case 'coctel':
    case 'fiesta': return <Discoteca />
    case 'anillos': return <Anillos />
    case 'copas': return <Copas />
    case 'cubiertos': return <Cubiertos />
    case 'musica': return <Musica />
    case 'tarta': return <Tarta />
    case 'bus': return <Bus />
    case 'coche': return <Coche />
    case 'luna': return <Luna />
    case 'camara': return <Camara />
    default: return <Reloj />
  }
}

/** Autobús que va de la parada a la finca y vuelve */
export function RutaBus({ desde, hasta, ida, vuelta }: { desde: string; hasta: string; ida: string; vuelta: string }) {
  return (
    <div className="iv-ruta">
      <div className="iv-ruta-pts">
        <span><b>{ida ? `${ida} h` : 'Ida'}</b>{desde || 'Punto de salida'}</span>
        <span><b>{vuelta ? `${vuelta} h` : 'Vuelta'}</b>{hasta || 'La celebración'}</span>
      </div>
      <div className="iv-ruta-via">
        <span className="iv-ruta-a" /><span className="iv-ruta-b" />
        <span className="iv-ruta-bus"><span className="iv-ruta-giro"><Bus /></span></span>
      </div>
    </div>
  )
}

/** Partículas sobre la portada */
export function Efecto({ tipo }: { tipo: string }) {
  if (tipo === 'ninguno') return null
  const n = tipo === 'brillos' ? 16 : 18
  return (
    <div className={`iv-fx iv-fx-${tipo}`} aria-hidden="true">
      {Array.from({ length: n }, (_, i) => (
        <span key={i} style={{
          left: `${(i * 37 + 11) % 100}%`,
          top: tipo === 'brillos' ? `${(i * 53 + 7) % 92}%` : undefined,
          animationDelay: `-${((i * 1.7) % 9).toFixed(1)}s`,
          animationDuration: `${(tipo === 'brillos' ? 2.2 : 8) + ((i * 3) % 6) * (tipo === 'brillos' ? 0.35 : 1)}s`,
          ['--s' as string]: `${0.6 + ((i * 7) % 5) * 0.18}`,
          ['--dx' as string]: `${((i * 29) % 60) - 30}px`,
        } as CSSProperties} />
      ))}
    </div>
  )
}
