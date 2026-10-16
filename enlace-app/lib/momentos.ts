import type { AutobusResumen, Bus, BodaData, Evento } from './types'

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
    id: 'horaloca', hora: 'horaHoraLoca', claves: ['durHoraLoca'], cat: 'musica', emoji: '🎉',
    nombre: () => 'Hora loca', duracion: r => r.durHoraLoca || '',
  },
  {
    id: 'fin', hora: 'horaFin', claves: [], cat: 'otro', emoji: '✨', manual: true,
    nombre: () => 'Fin de fiesta',
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

function datosEvento(m: Momento, r: R, hora: string) {
  return {
    nombre: m.nombre(r), hora, duracion: m.duracion?.(r) ?? '', cat: m.cat,
    desc: m.desc?.(r) ?? '', emoji: m.emoji, origen: `resumen:${m.id}`,
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
    } else {
      eventos.push({ id: eid, ...datosEvento(m, r, hora) })
      eid++
    }
    cambio = true
  }

  let res = cambio
    ? { ...d, eventos: eventos.sort((a, b) => minutos(a.hora) - minutos(b.hora)), eventosBuses, eid }
    : d
  // Activar o quitar los autobuses, o cambiar la finca, afecta a los autobuses del Cronograma
  if (cambiados.includes('tBus') || cambiados.includes('finca')) res = sincronizarBuses(res)
  return res
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
  const eventos = [...(d.eventos || []), nuevo].sort((a, b) => minutos(a.hora) - minutos(b.hora))
  return { ...d, eventos, eid: d.eid + 1 }
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

/* ═══ AUTOBUSES (varios puntos de recogida) ═══
   Cada autobús del Resumen puede pasar al Cronograma con dos momentos manuales:
   "resumen:bus-ida:<id>" (con el autobús para asignar pasajeros) y "resumen:bus-vuelta:<id>". */

export type Tramo = 'ida' | 'vuelta'

export function nuevoAutobus(): AutobusResumen {
  return { id: 'b' + Date.now().toString(36), punto: '', horaIda: '', horaVuelta: '', puntoVuelta: '', empresa: '', plazas: '', coste: '' }
}

/** Pasa el autobús único de versiones anteriores a la lista de autobuses */
export function migrarAutobuses(d: BodaData): BodaData {
  if (d.autobuses) return d
  const r = d.resumen || {}
  const habia = r.tBus === '1' || r.horaBusIda || r.puntoBusIda || r.horaBusVuelta || r.costeBus
  if (!habia) return { ...d, autobuses: [] }
  const b: AutobusResumen = {
    id: 'b1', punto: r.puntoBusIda || '', horaIda: r.horaBusIda || '', horaVuelta: r.horaBusVuelta || '',
    puntoVuelta: r.puntoBusVuelta || '', empresa: r.empresaBus || '', plazas: r.plazasBus || '', coste: r.costeBus || '',
  }
  const eventos = (d.eventos || []).map(e =>
    e.origen === 'resumen:bus-ida' ? { ...e, origen: 'resumen:bus-ida:b1' }
    : e.origen === 'resumen:bus-vuelta' ? { ...e, origen: 'resumen:bus-vuelta:b1' } : e)
  const eventosBuses: Record<string, Bus[]> = {}
  for (const [k, lista] of Object.entries(d.eventosBuses || {})) {
    eventosBuses[k] = lista.map(x => (x.id === 'resumen-bus' ? { ...x, id: 'resumen-bus-b1' } : x))
  }
  return { ...d, autobuses: [b], eventos, eventosBuses }
}

const origenBus = (id: string, tramo: Tramo) => `resumen:bus-${tramo}:${id}`

export function nombreBus(b: AutobusResumen, i: number): string {
  return b.punto.trim() ? `Autobús desde ${b.punto.trim()}` : `Autobús ${i + 1}`
}

function datosEventoBus(b: AutobusResumen, i: number, tramo: Tramo, r: R) {
  if (tramo === 'ida') {
    return {
      nombre: nombreBus(b, i), hora: b.horaIda, duracion: '', cat: 'autobus', emoji: '🚌',
      desc: b.punto.trim() ? `Recogida en ${b.punto.trim()}` : '', origen: origenBus(b.id, 'ida'),
    }
  }
  const desde = b.puntoVuelta.trim() || r.finca || ''
  const hasta = b.punto.trim()
  return {
    nombre: hasta ? `Autobús de vuelta a ${hasta}` : 'Autobús de vuelta', hora: b.horaVuelta, duracion: '', cat: 'otro', emoji: '🚌',
    desc: desde ? `Sale desde ${desde}` : '', origen: origenBus(b.id, 'vuelta'),
  }
}

function busCronograma(b: AutobusResumen, i: number, anterior?: Bus): Bus {
  return {
    id: `resumen-bus-${b.id}`,
    nombre: b.empresa.trim() ? `${nombreBus(b, i)} · ${b.empresa.trim()}` : nombreBus(b, i),
    cap: parseInt(b.plazas) || anterior?.cap || 50,
    horaIda: b.horaIda, horaVuelta: b.horaVuelta, punto: b.punto, empresa: b.empresa,
    passengerIds: anterior?.passengerIds || [],
    activeDir: anterior?.activeDir || 'ida',
  }
}

export function busEnCronograma(d: BodaData, id: string, tramo: Tramo): boolean {
  return (d.eventos || []).some(e => e.origen === origenBus(id, tramo))
}

/** Actualiza o quita del Cronograma los autobuses que ya estaban añadidos */
export function sincronizarBuses(d: BodaData): BodaData {
  const r = d.resumen || {}
  const lista = d.autobuses || []
  const activos = hayBus(r)
  let eventos = [...(d.eventos || [])]
  const eventosBuses = { ...(d.eventosBuses || {}) }
  let cambio = false

  eventos = eventos.flatMap(e => {
    const mm = /^resumen:bus-(ida|vuelta):(.+)$/.exec(e.origen || '')
    if (!mm) return [e]
    const tramo = mm[1] as Tramo
    const i = lista.findIndex(b => b.id === mm[2])
    const b = lista[i]
    const hora = b ? (tramo === 'ida' ? b.horaIda : b.horaVuelta) : ''
    if (!activos || !b || !HORA.test(hora)) {
      delete eventosBuses[String(e.id)]
      cambio = true
      return []
    }
    const nuevo = { ...e, ...datosEventoBus(b, i, tramo, r) }
    if (tramo === 'ida') {
      const key = String(e.id)
      const previos = eventosBuses[key] || []
      const ant = previos.find(x => x.id === `resumen-bus-${b.id}`)
      eventosBuses[key] = ant
        ? previos.map(x => (x.id === ant.id ? busCronograma(b, i, x) : x))
        : [...previos, busCronograma(b, i)]
    }
    cambio = true
    return [nuevo]
  })

  if (!cambio) return d
  return { ...d, eventos: eventos.sort((a, b) => minutos(a.hora) - minutos(b.hora)), eventosBuses }
}

/** Botón "Añadir al Cronograma" de la recogida o la vuelta de un autobús */
export function anadirBus(d: BodaData, id: string, tramo: Tramo): BodaData {
  const lista = d.autobuses || []
  const i = lista.findIndex(b => b.id === id)
  const b = lista[i]
  if (!b || busEnCronograma(d, id, tramo)) return d
  const hora = tramo === 'ida' ? b.horaIda : b.horaVuelta
  if (!HORA.test(hora)) return d
  const nuevo: Evento = { id: d.eid, ...datosEventoBus(b, i, tramo, d.resumen || {}) }
  const eventosBuses = { ...(d.eventosBuses || {}) }
  if (tramo === 'ida') eventosBuses[String(d.eid)] = [busCronograma(b, i)]
  const eventos = [...(d.eventos || []), nuevo].sort((a, c) => minutos(a.hora) - minutos(c.hora))
  return { ...d, eventos, eventosBuses, eid: d.eid + 1 }
}

export function costeAutobuses(d: BodaData): number {
  if (!hayBus(d.resumen || {})) return 0
  return (d.autobuses || []).reduce((s, b) => s + (parseFloat(b.coste) || 0), 0)
}
