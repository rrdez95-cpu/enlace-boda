import type { Bus, BodaData, Evento } from './types'

/* Momentos del día que se rellenan en el Resumen y pasan al Cronograma.
   - Automáticos: se crean solos al poner la hora (los propios de la boda).
   - Manuales: solo se crean con el botón "Añadir al Cronograma" (autobuses, fin de fiesta),
     para no gastar los momentos del plan gratuito en cosas que no siempre se quieren ver.
   Cada evento creado así lleva origen "resumen:<id>" y se actualiza si cambia el Resumen. */

type R = Record<string, string>

export const LIMITE_MOMENTOS_GRATIS = 5

export function hayCoche(r: R): boolean {
  if (r.tCoche) return r.tCoche === '1'
  return !!(r.horaCoche || r.cocheNupcial || r.trayecto || r.costeCoche)
}
export function hayBus(r: R): boolean {
  return r.tBus === '1'
}

type Momento = {
  id: string
  hora: string
  claves: string[]
  cat: string
  emoji: string
  manual?: boolean
  activo?: (r: R) => boolean
  activoClave?: string
  nombre: (r: R) => string
  duracion?: (r: R) => string
  desc?: (r: R) => string
}

export const MOMENTOS_RESUMEN: Momento[] = [
  {
    id: 'coche', hora: 'horaCoche', claves: ['trayecto'], cat: 'otro', emoji: '🚗',
    activo: hayCoche, activoClave: 'tCoche',
    nombre: () => 'Recogida en coche nupcial', desc: r => r.trayecto || '',
  },
  {
    id: 'bus-ida', hora: 'horaBusIda', claves: ['puntoBusIda', 'horaBusVuelta', 'empresaBus', 'plazasBus', 'puntoBusVuelta'],
    cat: 'autobus', emoji: '🚌', manual: true, activo: hayBus, activoClave: 'tBus',
    nombre: () => 'Autobús de invitados', desc: r => (r.puntoBusIda ? `Recogida en ${r.puntoBusIda}` : ''),
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
    id: 'fin', hora: 'horaFin', claves: [], cat: 'otro', emoji: '✨', manual: true,
    nombre: () => 'Fin de fiesta',
  },
  {
    id: 'traslado', hora: 'horaTraslado', claves: ['destinoTraslado'], cat: 'otro', emoji: '🚕',
    nombre: () => 'Salida de los novios', desc: r => r.destinoTraslado || '',
  },
  {
    id: 'bus-vuelta', hora: 'horaBusVuelta', claves: ['puntoBusVuelta', 'finca'], cat: 'otro', emoji: '🚌',
    manual: true, activo: hayBus, activoClave: 'tBus',
    nombre: () => 'Autobús de vuelta',
    desc: r => {
      const desde = r.puntoBusVuelta || r.finca
      return desde ? `Sale desde ${desde}` : ''
    },
  },
]

const HORA = /^\d{2}:\d{2}$/
const BUS_ID = 'resumen-bus'

// Las horas de madrugada van al final del día
function minutos(h: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(h || '')
  if (!m) return 9999
  let v = Number(m[1]) * 60 + Number(m[2])
  if (v < 6 * 60) v += 24 * 60
  return v
}

function datosEvento(m: Momento, r: R, hora: string) {
  return {
    nombre: m.nombre(r), hora, duracion: m.duracion?.(r) ?? '', cat: m.cat,
    desc: m.desc?.(r) ?? '', emoji: m.emoji, origen: `resumen:${m.id}`,
  }
}

function busDesdeResumen(r: R, anterior?: Bus): Bus {
  return {
    id: BUS_ID,
    nombre: r.empresaBus ? `Autobús ${r.empresaBus}` : 'Autobús de invitados',
    cap: parseInt(r.plazasBus || '') || anterior?.cap || 50,
    horaIda: r.horaBusIda || '',
    horaVuelta: r.horaBusVuelta || '',
    punto: r.puntoBusIda || '',
    empresa: r.empresaBus || '',
    passengerIds: anterior?.passengerIds || [],
    activeDir: anterior?.activeDir || 'ida',
  }
}

function horaValida(m: Momento, r: R): string {
  const hora = (r[m.hora] || '').trim()
  if (!HORA.test(hora)) return ''
  if (m.activo && !m.activo(r)) return ''
  return hora
}

/** Crea, actualiza o quita los momentos afectados por los campos que han cambiado */
export function sincronizarMomentos(d: BodaData, cambiados: string[]): BodaData {
  const r = d.resumen || {}
  let eventos: Evento[] = [...(d.eventos || [])]
  let eventosBuses = { ...(d.eventosBuses || {}) }
  let eid = d.eid
  let cambio = false

  for (const m of MOMENTOS_RESUMEN) {
    const disparador = cambiados.includes(m.hora) || (!!m.activoClave && cambiados.includes(m.activoClave))
    if (!disparador && !m.claves.some(k => cambiados.includes(k))) continue

    const idx = eventos.findIndex(e => e.origen === `resumen:${m.id}`)
    const hora = horaValida(m, r)

    // Sin hora (o desactivado): si lo han borrado, se quita del Cronograma
    if (!hora) {
      if (disparador && idx >= 0) {
        delete eventosBuses[String(eventos[idx].id)]
        eventos.splice(idx, 1)
        cambio = true
      }
      continue
    }
    // Los manuales nunca se crean solos; los automáticos solo al poner la hora
    if (idx < 0 && (m.manual || !disparador)) continue

    if (idx >= 0) {
      eventos[idx] = { ...eventos[idx], ...datosEvento(m, r, hora) }
      if (m.id === 'bus-ida') {
        const key = String(eventos[idx].id)
        const lista = eventosBuses[key] || []
        const ant = lista.find(b => b.id === BUS_ID)
        eventosBuses[key] = ant
          ? lista.map(b => (b.id === BUS_ID ? busDesdeResumen(r, b) : b))
          : [...lista, busDesdeResumen(r)]
      }
    } else {
      eventos.push({ id: eid, ...datosEvento(m, r, hora) })
      eid++
    }
    cambio = true
  }

  if (!cambio) return d
  eventos = eventos.sort((a, b) => minutos(a.hora) - minutos(b.hora))
  return { ...d, eventos, eventosBuses, eid }
}

/** Botón "Añadir al Cronograma" de los momentos manuales */
export function anadirMomento(d: BodaData, id: string): BodaData {
  const m = MOMENTOS_RESUMEN.find(x => x.id === id)
  if (!m) return d
  const r = d.resumen || {}
  const hora = horaValida(m, r)
  if (!hora) return d
  if (momentoEnCronograma(d, id)) return sincronizarMomentos(d, [m.hora])

  const nuevo: Evento = { id: d.eid, ...datosEvento(m, r, hora) }
  const eventosBuses = { ...(d.eventosBuses || {}) }
  if (id === 'bus-ida') eventosBuses[String(d.eid)] = [busDesdeResumen(r)]
  const eventos = [...(d.eventos || []), nuevo].sort((a, b) => minutos(a.hora) - minutos(b.hora))
  return { ...d, eventos, eventosBuses, eid: d.eid + 1 }
}

export function momentoEnCronograma(d: BodaData, id: string): boolean {
  return (d.eventos || []).some(e => e.origen === `resumen:${id}`)
}

export function horaMomento(d: BodaData, id: string): string {
  const m = MOMENTOS_RESUMEN.find(x => x.id === id)
  return m ? horaValida(m, d.resumen || {}) : ''
}

/** Horas automáticas puestas en el Resumen que todavía no están en el Cronograma */
export function momentosSinPasar(d: BodaData): number {
  const r = d.resumen || {}
  return MOMENTOS_RESUMEN.filter(m => !m.manual && horaValida(m, r) && !momentoEnCronograma(d, m.id)).length
}

/** Campos de hora de los momentos automáticos (para el botón "Añadir las que faltan") */
export const HORAS_AUTOMATICAS = MOMENTOS_RESUMEN.filter(m => !m.manual).map(m => m.hora)
