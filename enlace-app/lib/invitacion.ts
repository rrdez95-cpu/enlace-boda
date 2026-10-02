import type {
  BodaData, InvitacionConfig, InvitacionContacto, InvitacionLugar, InvitacionTema,
} from './types'

/* ═══ ESTILOS ═══ */
export const TEMAS: { id: InvitacionTema; label: string; color: string; ring?: string; desc: string }[] = [
  { id: 'acuarela', label: 'Acuarela', color: '#8FA9BA', desc: 'Las fotos se funden con el papel como si estuvieran pintadas' },
  { id: 'carta', label: 'Carta', color: '#7B2230', desc: 'Se abre como un sobre con lacre y vuestras iniciales' },
  { id: 'mediterraneo', label: 'Mediterráneo', color: '#2D6C8C', desc: 'Arcos encalados, azul mar y ramas de olivo' },
  { id: 'noche', label: 'Noche', color: '#0F2925', ring: '#CDB27A', desc: 'Art déco en verde esmeralda y dorado' },
  { id: 'jardin', label: 'Jardín', color: '#C46F7E', desc: 'Guirnaldas de flores y tonos peonía' },
]

const F = 'https://fonts.googleapis.com/css2?'
export const FONT_URL: Record<InvitacionTema, string> = {
  acuarela: F + 'family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  carta: F + 'family=Homemade+Apple&family=IM+Fell+English:ital@0;1&family=Pinyon+Script&display=swap',
  mediterraneo: F + 'family=Marcellus&family=Lora:ital,wght@0,400;0,500;1,400&display=swap',
  noche: F + 'family=Poiret+One&family=Josefin+Sans:wght@300;400&family=Cormorant+Garamond:ital@1&display=swap',
  jardin: F + 'family=Great+Vibes&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
}

export const FONDO_TEMA: Record<InvitacionTema, string> = {
  acuarela: '#FAFAF7', carta: '#4A3A2E', mediterraneo: '#F7F6F2', noche: '#0F2925', jardin: '#FBF4F2',
}

/* ═══ NOMBRES ═══
   Acepta "Lorena & Luisfer", "Lorena y Luisfer", "Lorena e Iván" o "Lorena + Luisfer" */
export function parseNames(raw?: string): [string, string] {
  const s = (raw || '').replace(/\s+/g, ' ').trim()
  const parts = s.split(/\s+(?:y|e)\s+|\s*[&+]\s*/i).map(p => p.trim()).filter(Boolean)
  const cap = (x: string) => x.replace(/(^|[\s-])(\S)/g, (_m: string, p: string, c: string) => p + c.toUpperCase())
  if (parts.length >= 2) return [cap(parts[0]), cap(parts.slice(1).join(' '))]
  return [cap(parts[0] || ''), '']
}

export function slugCodigo(novios: string, fecha?: string): string {
  const [a, b] = parseNames(novios)
  const year = fecha && /^\d{4}/.test(fecha) ? fecha.slice(0, 4) : String(new Date().getFullYear())
  const base = [a, b].filter(Boolean).join(' y ') || 'nuestra boda'
  const slug = base.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')
  return `${slug}-${year}`
}

/* ═══ CONFIGURACIÓN ═══
   Rellena los huecos de configuraciones antiguas o incompletas */
const TEMA_IDS = TEMAS.map(t => t.id)

export function normalizeConfig(
  raw: Partial<InvitacionConfig> | undefined | null,
  datos: Pick<BodaData, 'resumen'>,
): InvitacionConfig {
  const r = (raw || {}) as Partial<InvitacionConfig>
  const R = datos.resumen || {}
  const [n1, n2] = parseNames(R.novios)
  const lugar = (x: Partial<InvitacionLugar> | undefined, def: Partial<InvitacionLugar>): InvitacionLugar => ({
    lugar: x?.lugar ?? def.lugar ?? '',
    hora: x?.hora ?? def.hora ?? '',
    direccion: x?.direccion ?? '',
    mapa: x?.mapa ?? '',
    foto: x?.foto,
  })
  return {
    activa: !!r.activa,
    codigo: typeof r.codigo === 'string' ? r.codigo : '',
    tema: TEMA_IDS.includes(r.tema as InvitacionTema) ? (r.tema as InvitacionTema) : 'acuarela',
    saludo: r.saludo ?? 'Querida familia, queridos amigos:',
    mensaje: r.mensaje ?? 'Nos haría muchísima ilusión que estuvierais con nosotros ese día. Sin vosotros no sería lo mismo.',
    fotoPortada: r.fotoPortada,
    ceremonia: lugar(r.ceremonia, { lugar: R.lugarCeremonia, hora: R.horaCeremonia }),
    celebracion: lugar(r.celebracion, { lugar: R.finca, hora: R.horaCoctel }),
    mostrarPrograma: r.mostrarPrograma ?? true,
    regalosTexto: r.regalosTexto ?? 'Lo que más nos importa es que vengáis con ganas de celebrar. Si además queréis tener un detalle, os dejamos nuestra cuenta:',
    iban: r.iban ?? '',
    contactos: Array.isArray(r.contactos) && r.contactos.length
      ? r.contactos
      : [{ nombre: n1, telefono: '' }, { nombre: n2, telefono: '' }].filter(c => c.nombre),
    fechaLimiteRsvp: r.fechaLimiteRsvp,
  }
}

/* ═══ DATOS PARA PINTAR LA INVITACIÓN ═══ */
export type LugarVista = InvitacionLugar & { foto: string; mapaUrl: string }

export type InvitacionData = {
  tema: InvitacionTema
  nombre1: string
  nombre2: string
  fecha: string
  fechaLarga: string
  fechaCorta: string
  anio: string
  matasellos: string
  inicioISO: string
  sitioPortada: string
  saludo: string
  mensaje: string
  fotoPortada: string
  ceremonia: LugarVista
  celebracion: LugarVista
  programa: { hora: string; titulo: string; nota: string }[]
  buses: { nombre: string; ida: string; vuelta: string; punto: string }[]
  regalosTexto: string
  iban: string
  contactos: InvitacionContacto[]
  fechaLimite: string
}

export const FOTO_DEFECTO = {
  portada: '/invitacion/portada.jpg',
  ceremonia: '/invitacion/ceremonia.jpg',
  celebracion: '/invitacion/celebracion.jpg',
}

const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

function fechaTexto(iso: string | undefined, opts: Intl.DateTimeFormatOptions): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const s = new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...opts }).format(new Date(`${iso}T12:00:00Z`))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Las horas de madrugada (01:30) van al final del día, no al principio
function minutos(h: string): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(h || '')
  if (!m) return 9999
  let v = Number(m[1]) * 60 + Number(m[2])
  if (v < 6 * 60) v += 24 * 60
  return v
}

function mapaUrl(l: InvitacionLugar): string {
  const m = (l.mapa || '').trim()
  if (/^https?:\/\//i.test(m)) return m
  const q = [l.lugar, l.direccion].map(x => (x || '').trim()).filter(Boolean).join(', ')
  return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : ''
}

export function buildInvitacion(datos: BodaData, cfgIn?: InvitacionConfig): InvitacionData {
  const cfg = cfgIn || normalizeConfig(datos.invitacion, datos)
  const R = datos.resumen || {}
  const [nombre1, nombre2] = parseNames(R.novios)
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(R.fecha || '') ? R.fecha : ''
  const [y, mo, da] = iso ? iso.split('-') : ['', '', '']
  const horaInicio = /^\d{2}:\d{2}$/.test(cfg.ceremonia.hora) ? cfg.ceremonia.hora
    : /^\d{2}:\d{2}$/.test(R.horaInicio || '') ? R.horaInicio : '12:00'

  const eventos = [...(datos.eventos || [])].sort((a, b) => minutos(a.hora) - minutos(b.hora))
  const programa = eventos.filter(e => e.nombre)
    .map(e => ({ hora: e.hora || '', titulo: e.nombre, nota: e.desc || '' }))
  const buses = eventos.filter(e => e.cat === 'autobus').flatMap(e =>
    ((datos.eventosBuses || {})[String(e.id)] || []).map(b => ({
      nombre: b.nombre || e.nombre, ida: b.horaIda || '', vuelta: b.horaVuelta || '', punto: b.punto || '',
    })))

  const vista = (l: InvitacionLugar, def: string): LugarVista => ({ ...l, foto: l.foto || def, mapaUrl: mapaUrl(l) })

  return {
    tema: cfg.tema,
    nombre1: nombre1 || 'Nuestra boda',
    nombre2,
    fecha: iso,
    fechaLarga: fechaTexto(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
    fechaCorta: fechaTexto(iso, { day: 'numeric', month: 'long', year: 'numeric' }),
    anio: y,
    matasellos: iso ? `${Number(da)} ${ROMANOS[Number(mo) - 1]} ${y.slice(2)}` : '',
    inicioISO: iso ? `${iso}T${horaInicio}:00` : '',
    sitioPortada: cfg.celebracion.lugar || cfg.ceremonia.lugar,
    saludo: cfg.saludo,
    mensaje: cfg.mensaje,
    fotoPortada: cfg.fotoPortada || FOTO_DEFECTO.portada,
    ceremonia: vista(cfg.ceremonia, FOTO_DEFECTO.ceremonia),
    celebracion: vista(cfg.celebracion, FOTO_DEFECTO.celebracion),
    programa: cfg.mostrarPrograma ? programa : [],
    buses,
    regalosTexto: cfg.regalosTexto,
    iban: cfg.iban.trim(),
    contactos: cfg.contactos.filter(c => (c.telefono || '').trim()),
    fechaLimite: fechaTexto(cfg.fechaLimiteRsvp, { day: 'numeric', month: 'long' }),
  }
}
