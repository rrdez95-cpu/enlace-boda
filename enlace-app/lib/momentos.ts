import type { BodaData, Evento } from './types'

/* Momentos del día que se rellenan en el Resumen y se pasan solos al Cronograma.
   Cada evento creado así lleva origen "resumen:<id>" para poder actualizarlo después. */

type R = Record<string, string>

type Momento = {
  id: string
  hora: string        // campo del Resumen con la hora
  claves: string[]    // otros campos que cambian el texto del momento
  cat: string
  emoji: string
  nombre: (r: R) => string
  duracion?: (r: R) => string
  desc?: (r: R) => string
}

export const MOMENTOS_RESUMEN: Momento[] = [
  {
    id: 'coche', hora: 'horaCoche', claves: ['trayecto'], cat: 'otro', emoji: '🚗',
    nombre: () => 'Recogida en coche nupcial', desc: r => r.trayecto || '',
  },
  {
    id: 'ceremonia', hora: 'horaCeremonia', claves: ['tipoCeremonia', 'durCeremonia', 'lugarCeremonia'],
    cat: 'ceremonia', emoji: '⛪',
    nombre: r => {
      const t = (r.tipoCeremonia || '').trim()
      return t && t !== 'Mixta' ? `Ceremonia ${t.toLowerCase()}` : 'Ceremonia'
    },
    duracion: r => r.durCeremonia || '', desc: r => r.lugarCeremonia || '',
  },
  {
    id: 'coctel', hora: 'horaCoctel', claves: ['durCoctel', 'ubiCoctel'], cat: 'coctel', emoji: '🥂',
    nombre: () => 'Cóctel', duracion: r => r.durCoctel || '', desc: r => r.ubiCoctel || '',
  },
  {
    id: 'banquete', hora: 'horaBanquete', claves: ['durBanquete'], cat: 'banquete', emoji: '🍽️',
    nombre: () => 'Banquete', duracion: r => r.durBanquete || '',
  },
  {
    id: 'baile', hora: 'horaBaile', claves: ['primerBaile'], cat: 'musica', emoji: '🎶',
    nombre: () => 'Primer baile', desc: r => r.primerBaile || '',
  },
  {
    id: 'barra', hora: 'horaBarra', claves: ['horasBarra', 'cierreBarra'], cat: 'musica', emoji: '🍸',
    nombre: () => 'Barra libre y fiesta', duracion: r => r.horasBarra || '',
    desc: r => (r.cierreBarra ? `Hasta las ${r.cierreBarra}` : ''),
  },
  {
    id: 'traslado', hora: 'horaTraslado', claves: ['destinoTraslado'], cat: 'otro', emoji: '🚕',
    nombre: () => 'Salida de los novios', desc: r => r.destinoTraslado || '',
  },
]

const HORA = /^\d{2}:\d{2}$/

// Las horas de madrugada van al final del día
function minutos(h: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(h || '')
  if (!m) return 9999
  let v = Number(m[1]) * 60 + Number(m[2])
  if (v < 6 * 60) v += 24 * 60
  return v
}

/** Crea, actualiza o quita los momentos afectados por los campos que han cambiado */
export function sincronizarMomentos(d: BodaData, cambiados: string[]): BodaData {
  const r = d.resumen || {}
  const eventos: Evento[] = [...(d.eventos || [])]
  let eid = d.eid
  let cambio = false

  for (const m of MOMENTOS_RESUMEN) {
    const cambiaHora = cambiados.includes(m.hora)
    if (!cambiaHora && !m.claves.some(k => cambiados.includes(k))) continue

    const origen = `resumen:${m.id}`
    const idx = eventos.findIndex(e => e.origen === origen)
    const hora = (r[m.hora] || '').trim()

    // Sin hora: si la han borrado, se quita del Cronograma
    if (!HORA.test(hora)) {
      if (cambiaHora && idx >= 0) { eventos.splice(idx, 1); cambio = true }
      continue
    }
    // Si solo cambia un texto y el momento no está en el Cronograma, no se crea
    if (idx < 0 && !cambiaHora) continue

    const datos = {
      nombre: m.nombre(r), hora, duracion: m.duracion?.(r) ?? '', cat: m.cat,
      desc: m.desc?.(r) ?? '', emoji: m.emoji, origen,
    }
    if (idx >= 0) eventos[idx] = { ...eventos[idx], ...datos }
    else { eventos.push({ id: eid, ...datos }); eid++ }
    cambio = true
  }

  if (!cambio) return d
  eventos.sort((a, b) => minutos(a.hora) - minutos(b.hora))
  return { ...d, eventos, eid }
}

/** Horas puestas en el Resumen que todavía no están en el Cronograma */
export function momentosSinPasar(d: BodaData): number {
  const r = d.resumen || {}
  return MOMENTOS_RESUMEN.filter(m =>
    HORA.test((r[m.hora] || '').trim()) && !(d.eventos || []).some(e => e.origen === `resumen:${m.id}`)
  ).length
}
