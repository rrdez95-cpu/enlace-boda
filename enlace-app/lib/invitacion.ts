import type {
  BodaData, InvitacionConfig, InvitacionContacto, InvitacionLugar, InvitacionTema,
  SeccionInvitacion, TemaIA, VariantesInvitacion,
} from './types'
import { fontUrlIA } from './plantilla-ia'

/* ═══ ESTILOS ═══
   'ia' es la plantilla que se crea escribiendo lo que queréis; el resto están hechas a mano */
export type TemaInfo = {
  id: InvitacionTema; label: string; desc: string
  color: string; ring?: string
  // Para la miniatura del selector
  fondo: string; tinta: string; fuente: string
}

export const TEMAS: TemaInfo[] = [
  { id: 'ia', label: 'Crea la vuestra', desc: 'Escribid cómo la imagináis y la diseñamos al momento', color: '#B8965A', fondo: '#F5EFE6', tinta: '#5B4A2E', fuente: "'Great Vibes',cursive" },
  { id: 'acuarela', label: 'Acuarela', color: '#8FA9BA', desc: 'Las fotos se funden con el papel como si estuvieran pintadas', fondo: '#FAFAF7', tinta: '#5E7D92', fuente: "'Pinyon Script',cursive" },
  { id: 'carta', label: 'Carta', color: '#7B2230', desc: 'Se abre como un sobre con lacre y vuestras iniciales', fondo: '#F1E7D3', tinta: '#7B2230', fuente: "'Homemade Apple',cursive" },
  { id: 'mediterraneo', label: 'Mediterráneo', color: '#2D6C8C', desc: 'Arcos encalados, azul mar y ramas de olivo', fondo: '#F7F6F2', tinta: '#1E394B', fuente: "'Marcellus',serif" },
  { id: 'noche', label: 'Noche', color: '#0F2925', ring: '#CDB27A', desc: 'Art déco en verde esmeralda y dorado', fondo: '#0F2925', tinta: '#CDB27A', fuente: "'Poiret One',sans-serif" },
  { id: 'jardin', label: 'Jardín', color: '#C46F7E', desc: 'Guirnaldas de flores y tonos peonía', fondo: '#FBF4F2', tinta: '#B25E6E', fuente: "'Great Vibes',cursive" },
  { id: 'minimalista', label: 'Minimalista', color: '#1C1C1C', desc: 'Blanco, negro y tipografía. Nada sobra', fondo: '#FFFFFF', tinta: '#1C1C1C', fuente: "'Bodoni Moda',serif" },
  { id: 'boho', label: 'Boho', color: '#B5653F', desc: 'Terracota, pampas y un sol de tarde', fondo: '#F4ECE2', tinta: '#9C5434', fuente: "'Alex Brush',cursive" },
  { id: 'magnolia', label: 'Magnolias', color: '#21392D', ring: '#C2A26B', desc: 'Verde botánico, magnolias y detalles dorados', fondo: '#21392D', tinta: '#E9DFC8', fuente: "'Petit Formal Script',cursive" },
  { id: 'lavanda', label: 'Lavanda', color: '#8C7BB0', desc: 'Campos de la Provenza en lila y salvia', fondo: '#F7F4FA', tinta: '#6E5D96', fuente: "'Parisienne',cursive" },
  { id: 'playa', label: 'Playa', color: '#2A8C8A', ring: '#E9876B', desc: 'Arena, olas, palmeras y atardecer coral', fondo: '#FBF7EE', tinta: '#1F5560', fuente: "'Sacramento',cursive" },
]

const F = 'https://fonts.googleapis.com/css2?'
const FONT_URL: Record<Exclude<InvitacionTema, 'ia'>, string> = {
  acuarela: F + 'family=Pinyon+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  carta: F + 'family=Homemade+Apple&family=IM+Fell+English:ital@0;1&family=Pinyon+Script&display=swap',
  mediterraneo: F + 'family=Marcellus&family=Lora:ital,wght@0,400;0,500;1,400&display=swap',
  noche: F + 'family=Poiret+One&family=Josefin+Sans:wght@300;400&family=Cormorant+Garamond:ital@1&display=swap',
  jardin: F + 'family=Great+Vibes&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  minimalista: F + 'family=Bodoni+Moda:ital,opsz,wght@0,6..96,400;1,6..96,400&family=Jost:wght@300;400;500&display=swap',
  boho: F + 'family=Alex+Brush&family=Tenor+Sans&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  magnolia: F + 'family=Petit+Formal+Script&family=Cinzel:wght@400;500&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap',
  lavanda: F + 'family=Parisienne&family=Libre+Baskerville:ital@0;1&display=swap',
  playa: F + 'family=Sacramento&family=DM+Serif+Display:ital@0;1&family=Quicksand:wght@400;500&display=swap',
}
/** Todas las tipografías de las miniaturas del selector de estilo */
export const FONT_MINIATURAS = F + 'family=Pinyon+Script&family=Homemade+Apple&family=Marcellus&family=Poiret+One&family=Great+Vibes&family=Bodoni+Moda&family=Alex+Brush&family=Petit+Formal+Script&family=Parisienne&family=Sacramento&display=swap'

const FONDO_TEMA: Record<Exclude<InvitacionTema, 'ia'>, string> = {
  acuarela: '#FAFAF7', carta: '#4A3A2E', mediterraneo: '#F7F6F2', noche: '#0F2925', jardin: '#FBF4F2',
  minimalista: '#FFFFFF', boho: '#F4ECE2', magnolia: '#F5F0E5', lavanda: '#F7F4FA', playa: '#FBF7EE',
}

export function fontUrlInvitacion(d: Pick<InvitacionData, 'tema' | 'temaIA'>): string {
  if (d.tema === 'ia') return d.temaIA ? fontUrlIA(d.temaIA) : FONT_URL.jardin
  return FONT_URL[d.tema]
}
export function fondoInvitacion(d: Pick<InvitacionData, 'tema' | 'temaIA'>): string {
  if (d.tema === 'ia') return d.temaIA?.paper || '#FBF8F3'
  return FONDO_TEMA[d.tema]
}

/* ═══ PARTES Y DISEÑOS ═══ */
export const SECCIONES: { id: SeccionInvitacion; label: string }[] = [
  { id: 'cuenta', label: 'Cuenta atrás' },
  { id: 'carta', label: 'Vuestras palabras' },
  { id: 'lugares', label: 'Dónde y cuándo' },
  { id: 'programa', label: 'Cómo será el día' },
  { id: 'autobuses', label: 'Autobuses' },
  { id: 'regalo', label: 'Regalo' },
  { id: 'contacto', label: 'Contacto' },
]

export const VARIANTES = {
  programa: [
    { id: 'linea', label: 'Línea del tiempo' },
    { id: 'tarjetas', label: 'Tarjetas' },
    { id: 'iconos', label: 'Iconos' },
    { id: 'horario', label: 'Horario' },
    { id: 'mini', label: 'Sencillo' },
  ],
  cuenta: [
    { id: 'numeros', label: 'Números' },
    { id: 'circulos', label: 'Círculos' },
    { id: 'calendario', label: 'Calendario' },
    { id: 'frase', label: 'Una frase' },
  ],
  lugares: [
    { id: 'fotos', label: 'Con fotos' },
    { id: 'tarjetas', label: 'Tarjetas' },
    { id: 'lista', label: 'Lista' },
  ],
} as const

export type ParteConVariantes = keyof typeof VARIANTES

const VARIANTE_DEFECTO: Required<VariantesInvitacion> = { programa: 'linea', cuenta: 'numeros', lugares: 'fotos' }

/* ═══ PROGRAMA ═══
   Del Cronograma solo se enseña lo que interesa a los invitados.
   Lo demás (coche, peluquería, montaje…) es para los novios. */
const NO_BASICO = /coche|maquill|peluq|prepar|vestir|vestido|montaje|proveedor|traslado|recogida|salida de los novios|ensayo|fot[oó]grafo|sesi[oó]n de fotos|autob[uú]s|llegada de/i
const BASICO = /ceremonia|boda|c[oó]ctel|aperitivo|banquete|comida|cena|baile|barra|fiesta|tarta|hora loca|recena|fuegos|brindis|discoteca|concierto|misa|iglesia|ayuntamiento|enlace|bienvenida/i

function esBasico(nombre: string, cat: string): boolean {
  if (cat === 'autobus' || NO_BASICO.test(nombre)) return false
  return ['ceremonia', 'coctel', 'banquete', 'musica'].includes(cat) || BASICO.test(nombre)
}

export type IconoMomento = 'anillos' | 'copas' | 'cubiertos' | 'musica' | 'coctel' | 'tarta' | 'bus' | 'camara' | 'luna' | 'fiesta' | 'coche' | 'reloj'

export function iconoMomento(nombre: string, cat: string): IconoMomento {
  const n = nombre.toLowerCase()
  if (/tarta|pastel/.test(n)) return 'tarta'
  if (/hora loca|fiesta loca|confeti/.test(n)) return 'fiesta'
  if (/barra|copas? libre/.test(n)) return 'coctel'
  if (/fin |fin$|despedida|cierre|recena|fuegos/.test(n)) return 'luna'
  if (/ceremonia|boda|misa|iglesia|ayuntamiento|enlace|s[ií], quiero/.test(n) || cat === 'ceremonia') return 'anillos'
  if (/c[oó]ctel|aperitivo|bienvenida|brindis/.test(n) || cat === 'coctel') return 'copas'
  if (/banquete|comida|cena|men[uú]/.test(n) || cat === 'banquete') return 'cubiertos'
  if (/baile|m[uú]sica|dj|concierto|discoteca/.test(n) || cat === 'musica') return 'musica'
  if (/autob[uú]s/.test(n) || cat === 'autobus') return 'bus'
  if (/coche/.test(n)) return 'coche'
  if (/foto/.test(n)) return 'camara'
  return 'reloj'
}

export type MomentoInvitacion = {
  id: string; hora: string; nombre: string; titulo: string; visible: boolean; basico: boolean; icono: IconoMomento
}

/** Todos los momentos del Cronograma con lo que se enseña de cada uno en la invitación */
export function momentosInvitacion(datos: Pick<BodaData, 'eventos'>, cfg: InvitacionConfig): MomentoInvitacion[] {
  return [...(datos.eventos || [])]
    .filter(e => e.nombre)
    .sort((a, b) => minutos(a.hora) - minutos(b.hora))
    .map(e => {
      const id = `e${e.id}`
      const basico = esBasico(e.nombre, e.cat)
      const titulo = (cfg.programaTitulos[id] || '').trim() || e.nombre
      return {
        id, hora: e.hora || '', nombre: e.nombre, titulo, basico,
        visible: cfg.programaVisibles[id] ?? basico,
        icono: iconoMomento(e.nombre, e.cat),
      }
    })
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
const SECCION_IDS = SECCIONES.map(x => x.id)

function variantes(v: Partial<VariantesInvitacion> | undefined): VariantesInvitacion {
  const r = { ...VARIANTE_DEFECTO }
  for (const k of Object.keys(VARIANTES) as ParteConVariantes[]) {
    const val = v?.[k]
    if (val && VARIANTES[k].some(x => x.id === val)) (r as Record<string, string>)[k] = val
  }
  return r
}
const objeto = <T,>(x: unknown): Record<string, T> =>
  x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, T>) : {}

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
  // Antes solo se podía quitar el programa: se respeta lo que hubiera
  const ocultas: SeccionInvitacion[] = Array.isArray(r.ocultas)
    ? r.ocultas.filter(x => SECCION_IDS.includes(x))
    : r.mostrarPrograma === false ? ['programa'] : []
  return {
    activa: !!r.activa,
    codigo: typeof r.codigo === 'string' ? r.codigo : '',
    tema: TEMA_IDS.includes(r.tema as InvitacionTema) && !(r.tema === 'ia' && !r.temaIA)
      ? (r.tema as InvitacionTema) : 'acuarela',
    saludo: r.saludo ?? 'Querida familia, queridos amigos:',
    mensaje: r.mensaje ?? 'Nos haría muchísima ilusión que estuvierais con nosotros ese día. Sin vosotros no sería lo mismo.',
    fotoPortada: r.fotoPortada,
    ceremonia: lugar(r.ceremonia, { lugar: R.lugarCeremonia, hora: R.horaCeremonia }),
    celebracion: lugar(r.celebracion, { lugar: R.finca, hora: R.horaCoctel }),
    mostrarPrograma: !ocultas.includes('programa'),
    regalosTexto: r.regalosTexto ?? 'Lo que más nos importa es que vengáis con ganas de celebrar. Si además queréis tener un detalle, os dejamos nuestra cuenta:',
    iban: r.iban ?? '',
    contactos: Array.isArray(r.contactos) && r.contactos.length
      ? r.contactos
      : [{ nombre: n1, telefono: '' }, { nombre: n2, telefono: '' }].filter(c => c.nombre),
    fechaLimiteRsvp: r.fechaLimiteRsvp,
    ocultas,
    variantes: variantes(r.variantes),
    programaVisibles: objeto<boolean>(r.programaVisibles),
    programaTitulos: objeto<string>(r.programaTitulos),
    temaIA: r.temaIA,
  }
}

/* ═══ DATOS PARA PINTAR LA INVITACIÓN ═══ */
export type LugarVista = InvitacionLugar & { foto: string; mapaUrl: string }

export type ProgramaItem = { id: string; hora: string; titulo: string; icono: IconoMomento }

export type InvitacionData = {
  tema: InvitacionTema
  temaIA?: TemaIA
  kicker: string
  ocultas: SeccionInvitacion[]
  variantes: Required<VariantesInvitacion>
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
  programa: ProgramaItem[]
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
  const programa: ProgramaItem[] = momentosInvitacion(datos, cfg)
    .filter(m => m.visible)
    .map(m => ({ id: m.id, hora: m.hora, titulo: m.titulo, icono: m.icono }))
  const buses = eventos.filter(e => e.cat === 'autobus').flatMap(e =>
    ((datos.eventosBuses || {})[String(e.id)] || []).map(b => ({
      nombre: b.nombre || e.nombre, ida: b.horaIda || '', vuelta: b.horaVuelta || '', punto: b.punto || '',
    })))

  const vista = (l: InvitacionLugar, def: string): LugarVista => ({ ...l, foto: l.foto || def, mapaUrl: mapaUrl(l) })

  const tema = cfg.tema === 'ia' && !cfg.temaIA ? 'acuarela' : cfg.tema
  return {
    tema,
    temaIA: tema === 'ia' ? cfg.temaIA : undefined,
    kicker: (tema === 'ia' && cfg.temaIA?.kicker) || 'Nos casamos',
    ocultas: cfg.ocultas,
    variantes: { ...VARIANTE_DEFECTO, ...cfg.variantes } as Required<VariantesInvitacion>,
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
    programa,
    buses,
    regalosTexto: cfg.regalosTexto,
    iban: cfg.iban.trim(),
    contactos: cfg.contactos.filter(c => (c.telefono || '').trim()),
    fechaLimite: fechaTexto(cfg.fechaLimiteRsvp, { day: 'numeric', month: 'long' }),
  }
}
