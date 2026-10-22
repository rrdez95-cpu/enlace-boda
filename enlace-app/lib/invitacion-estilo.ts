import type { InvitacionTema, PersonalInvitacion, TemaIA } from './types'
import { ESPEC_TEXTO, SCRIPT, SERIF_TEXTO, contraste, legible, luminancia, mezclar, rgba } from './plantilla-ia'

/* ═══ Estilo de la invitación por piezas ═══
   Cada plantilla es una combinación de piezas: colores, letras, portada, adornos,
   marco de fotos, efecto, fondo, franjas y apertura. Los novios pueden cambiar
   cualquiera de ellas sin perder el resto, así que de 11 plantillas salen cientos. */

/* ─── colores ─── */
export type Colores = {
  paper: string; paper2: string; ink: string; ink2: string
  accent: string; accent2: string; accent3: string
  title: string; btnBg: string; btnFg: string
  /** Fondo detrás de la carta (portada «Postal») */
  desk?: string
  /** Franjas oscuras: fondo y color de los detalles */
  oscuro?: string; oscuroAcento?: string
}
export type Paleta = { id: string; label: string; c: Colores }

const C = (paper: string, paper2: string, ink: string, ink2: string, accent: string, accent2: string, accent3: string,
  title: string, btnBg: string, btnFg: string, extra: Partial<Colores> = {}): Colores =>
  ({ paper, paper2, ink, ink2, accent, accent2, accent3, title, btnBg, btnFg, ...extra })

export const PALETAS: Paleta[] = [
  { id: 'acuarela', label: 'Azul acuarela', c: C('#FAFAF7', '#F1F4F3', '#33414A', '#66747C', '#7F9BAD', '#A2B394', '#C9A19C', '#5E7D92', '#33414A', '#FAFAF7') },
  { id: 'carta', label: 'Lacre', c: C('#F1E7D3', '#EADDC4', '#3D2B1F', '#6E5A49', '#7B2230', '#4E6A86', '#B08A4E', '#3D2B1F', '#7B2230', '#F6E9DA', { desk: '#4A3A2E' }) },
  { id: 'mediterraneo', label: 'Azul mar', c: C('#F7F6F2', '#EAF0F1', '#1E394B', '#56707F', '#2D6C8C', '#7C8748', '#C59A47', '#1E394B', '#2D6C8C', '#FFFFFF') },
  { id: 'noche', label: 'Esmeralda y oro', c: C('#0F2925', '#12322D', '#EEE5D0', '#B9B19C', '#CDB27A', '#8FA89E', '#E6D4A6', '#CDB27A', '#CDB27A', '#0F2925', { oscuro: '#081A17', oscuroAcento: '#CDB27A' }) },
  { id: 'jardin', label: 'Peonía', c: C('#FBF4F2', '#F6E6E3', '#4A2D37', '#86656E', '#C46F7E', '#6F8B68', '#D9A75A', '#B25E6E', '#B25E6E', '#FFFFFF') },
  { id: 'minimalista', label: 'Blanco y negro', c: C('#FFFFFF', '#F5F4F1', '#1C1C1C', '#6B6B6B', '#1C1C1C', '#A3A3A3', '#1C1C1C', '#1C1C1C', '#1C1C1C', '#FFFFFF') },
  { id: 'boho', label: 'Terracota', c: C('#F4ECE2', '#EBDDCD', '#4A3428', '#7A6052', '#B5653F', '#C7A07A', '#7E8560', '#9C5434', '#B5653F', '#FBF3EA') },
  { id: 'magnolia', label: 'Verde botánico', c: C('#F5F0E5', '#EAE2D0', '#21392D', '#566A5D', '#9C7A45', '#4F705B', '#C2A26B', '#21392D', '#21392D', '#F5F0E5', { oscuro: '#21392D', oscuroAcento: '#D4B57D' }) },
  { id: 'lavanda', label: 'Lavanda', c: C('#F7F4FA', '#EEE8F4', '#3B3350', '#6A6180', '#7E6CA8', '#8E9C78', '#C7B9DE', '#6E5D96', '#6E5D96', '#FFFFFF') },
  { id: 'playa', label: 'Coral y turquesa', c: C('#FBF7EE', '#E8F2F0', '#1F4650', '#4F7078', '#D9694C', '#2A8C8A', '#F2C38F', '#1F5560', '#D9694C', '#FFFFFF') },
  { id: 'black', label: 'Negro y champán', c: C('#111111', '#1A1A1A', '#F2EFEA', '#B5B0A8', '#D8C3A0', '#8A8A8A', '#EDE3D1', '#F2EFEA', '#F2EFEA', '#111111', { oscuro: '#000000', oscuroAcento: '#D8C3A0' }) },
  { id: 'burdeos', label: 'Burdeos y oro', c: C('#F7F0EB', '#EFE3DC', '#3A1F25', '#6F5459', '#7B2230', '#B08A4E', '#D8B98A', '#7B2230', '#7B2230', '#F7F0EB', { oscuro: '#4A1621', oscuroAcento: '#D8B98A' }) },
  { id: 'marino', label: 'Marino y rosa', c: C('#F6F4F1', '#ECEAE6', '#1F2E45', '#5B677A', '#1F3A5F', '#D39AA4', '#C9A24B', '#1F3A5F', '#1F3A5F', '#FFFFFF', { oscuro: '#1F2E45', oscuroAcento: '#E7B9C0' }) },
  { id: 'salvia', label: 'Salvia', c: C('#F6F6F0', '#E9ECE2', '#2F3A2F', '#667066', '#5E7A5A', '#A9B99A', '#C9B48A', '#5E7A5A', '#5E7A5A', '#FFFFFF') },
  { id: 'rosa', label: 'Rosa empolvado', c: C('#FBF5F4', '#F3E6E4', '#4B3439', '#846B70', '#B47C86', '#9AAE9B', '#E3C3A3', '#A0707A', '#A0707A', '#FFFFFF') },
  { id: 'girasol', label: 'Girasol', c: C('#FBF7EA', '#F4ECCF', '#3A3020', '#6E6250', '#C98E12', '#5E7F4E', '#E8C66A', '#9A6E0A', '#3A3020', '#FBF7EA') },
  { id: 'cielo', label: 'Azul cielo', c: C('#F5F8FA', '#E6EEF3', '#23384A', '#5D7183', '#4F81AC', '#C9A24B', '#B9D2E3', '#3E6A8F', '#3E6A8F', '#FFFFFF') },
  { id: 'medianoche', label: 'Medianoche', c: C('#14162B', '#1B1E38', '#ECEAF6', '#B3B2CC', '#C9B57A', '#8C83C9', '#E9DDB0', '#E2D3A0', '#C9B57A', '#14162B', { oscuro: '#0B0C1C', oscuroAcento: '#E2D3A0' }) },
]

/* ─── letras ─── */
type Tam = [number, number, number] // mínimo px, cqw, máximo px
export type Letras = {
  id: string; label: string
  names: string; title: string; body: string
  fsBody: number; fsNames: Tam; fsTitle: Tam
  namesMayus?: boolean; titleMayus?: boolean; namesItalic?: boolean
  namesLh?: number; titleLh?: number
}

export const LETRAS: Letras[] = [
  { id: 'acuarela', label: 'Caligrafía fina', names: 'Pinyon Script', title: 'Pinyon Script', body: 'Cormorant Garamond', fsBody: 20, fsNames: [54, 10.5, 116], fsTitle: [40, 6, 58] },
  { id: 'jardin', label: 'Caligrafía romántica', names: 'Great Vibes', title: 'Great Vibes', body: 'EB Garamond', fsBody: 19, fsNames: [54, 10.5, 112], fsTitle: [40, 6, 60] },
  { id: 'lavanda', label: 'Caligrafía francesa', names: 'Parisienne', title: 'Parisienne', body: 'Libre Baskerville', fsBody: 16.5, fsNames: [52, 10, 110], fsTitle: [38, 5.6, 54] },
  { id: 'carta', label: 'Escrita a mano', names: 'Homemade Apple', title: 'Homemade Apple', body: 'IM Fell English', fsBody: 19, fsNames: [32, 6.2, 60], fsTitle: [22, 3.4, 30], namesLh: 1.55, titleLh: 1.7 },
  { id: 'manuscrita', label: 'Manuscrita alegre', names: 'Dancing Script', title: 'Dancing Script', body: 'Nunito', fsBody: 17, fsNames: [50, 10, 108], fsTitle: [34, 5, 48] },
  { id: 'playa', label: 'Pincel y serifa', names: 'Sacramento', title: 'DM Serif Display', body: 'Quicksand', fsBody: 17, fsNames: [62, 12.5, 134], fsTitle: [28, 4.4, 42] },
  { id: 'boho', label: 'Pincel y mayúsculas', names: 'Alex Brush', title: 'Tenor Sans', body: 'Cormorant Garamond', fsBody: 20, fsNames: [58, 11.5, 124], fsTitle: [17, 2.4, 22], titleMayus: true },
  { id: 'magnolia', label: 'Formal y romana', names: 'Petit Formal Script', title: 'Cinzel', body: 'EB Garamond', fsBody: 19, fsNames: [38, 7.4, 84], fsTitle: [21, 3, 28], titleMayus: true },
  { id: 'clasica', label: 'Romana clásica', names: 'Cinzel Decorative', title: 'Cinzel', body: 'Cormorant Garamond', fsBody: 19, fsNames: [34, 6.4, 72], fsTitle: [20, 2.8, 26], titleMayus: true },
  { id: 'mediterraneo', label: 'Serifa suave', names: 'Marcellus', title: 'Marcellus', body: 'Lora', fsBody: 18, fsNames: [44, 7.4, 86], fsTitle: [28, 4.2, 40] },
  { id: 'editorial', label: 'Editorial', names: 'Playfair Display', title: 'Playfair Display', body: 'Montserrat', fsBody: 16, fsNames: [46, 9, 104], fsTitle: [30, 4.4, 44], namesItalic: true },
  { id: 'minimalista', label: 'Moderna en mayúsculas', names: 'Bodoni Moda', title: 'Bodoni Moda', body: 'Jost', fsBody: 16.5, fsNames: [38, 7.6, 88], fsTitle: [26, 3.8, 38], namesMayus: true },
  { id: 'noche', label: 'Art déco', names: 'Poiret One', title: 'Poiret One', body: 'Josefin Sans', fsBody: 17, fsNames: [46, 8.6, 100], fsTitle: [28, 4.2, 40] },
  { id: 'moderna', label: 'Fina y ligera', names: 'Italiana', title: 'Josefin Sans', body: 'Jost', fsBody: 16.5, fsNames: [44, 8.4, 96], fsTitle: [17, 2.5, 22], titleMayus: true },
]

/* ─── piezas ─── */
export const PORTADAS_INV = [
  { id: 'centrada', label: 'Clásica' },
  { id: 'retrato', label: 'Foto vertical' },
  { id: 'foto-completa', label: 'Foto completa' },
  { id: 'foto-fija', label: 'Foto siempre de fondo' },
  { id: 'dividida', label: 'Foto a un lado' },
  { id: 'postal', label: 'Carta con sello' },
] as const
export type PortadaInv = typeof PORTADAS_INV[number]['id']

export const ADORNOS = [
  { id: 'ninguno', label: 'Sin adornos' },
  { id: 'acuarela', label: 'Manchas de acuarela' },
  { id: 'guirnalda', label: 'Guirnalda de flores' },
  { id: 'magnolias', label: 'Magnolias' },
  { id: 'lavanda', label: 'Lavanda' },
  { id: 'pampas', label: 'Pampas y sol' },
  { id: 'palmeras', label: 'Palmeras y olas' },
  { id: 'olivo', label: 'Ramas de olivo' },
  { id: 'deco', label: 'Marco art déco' },
  { id: 'estrellas', label: 'Estrellas' },
] as const
export type AdornoInv = typeof ADORNOS[number]['id']

export const MARCOS = [
  { id: 'recto', label: 'Recta' },
  { id: 'redondeado', label: 'Esquinas redondas' },
  { id: 'arco', label: 'Arco' },
  { id: 'ovalo', label: 'Óvalo' },
  { id: 'circulo', label: 'Círculo' },
  { id: 'acuarela', label: 'Pintada en acuarela' },
  { id: 'difuminado', label: 'Bordes difuminados' },
  { id: 'polaroid', label: 'Polaroid' },
  { id: 'cinta', label: 'Pegada con cinta' },
  { id: 'dorado', label: 'Marco fino' },
] as const
export type MarcoInv = typeof MARCOS[number]['id']

export const EFECTOS = [
  { id: 'ninguno', label: 'Sin efecto' },
  { id: 'petalos', label: 'Pétalos cayendo' },
  { id: 'brillos', label: 'Destellos' },
  { id: 'confeti', label: 'Confeti' },
  { id: 'corazones', label: 'Corazones' },
  { id: 'nieve', label: 'Nieve' },
] as const
export type EfectoInv = typeof EFECTOS[number]['id']

export const TEXTURAS_INV = [
  { id: 'papel', label: 'Papel' },
  { id: 'lisa', label: 'Liso' },
  { id: 'cuaderno', label: 'Papel de carta' },
  { id: 'puntos', label: 'Puntitos' },
  { id: 'rayas', label: 'Rayas finas' },
  { id: 'estrellas', label: 'Cielo estrellado' },
] as const
export type TexturaInv = typeof TEXTURAS_INV[number]['id']

export const FRANJAS = [
  { id: 'suaves', label: 'Suaves' },
  { id: 'color', label: 'De color' },
  { id: 'oscuras', label: 'Oscuras' },
] as const
export type FranjasInv = typeof FRANJAS[number]['id']

export const APERTURAS = [
  { id: 'ninguna', label: 'Directa' },
  { id: 'sobre', label: 'Sobre con lacre' },
] as const
export type AperturaInv = typeof APERTURAS[number]['id']

/** Adorno entre secciones que acompaña a cada adorno de portada */
const ORN_DE: Record<AdornoInv, string> = {
  ninguno: 'linea', acuarela: 'acuarela', guirnalda: 'flores', magnolias: 'magnolia', lavanda: 'lavanda',
  pampas: 'pampas', palmeras: 'ondas', olivo: 'olivo', deco: 'deco', estrellas: 'espacio',
}

/* ─── plantillas base ─── */
type Base = {
  paleta: string; letras: string; portada: PortadaInv; adorno: AdornoInv; marco: MarcoInv
  textura: TexturaInv; efecto: EfectoInv; franjas: FranjasInv; apertura: AperturaInv
  /** Adorno entre secciones propio de la plantilla (si no se cambia el adorno) */
  orn?: string
}

export const BASES: Record<Exclude<InvitacionTema, 'ia'>, Base> = {
  acuarela: { paleta: 'acuarela', letras: 'acuarela', portada: 'centrada', adorno: 'acuarela', marco: 'acuarela', textura: 'papel', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna' },
  carta: { paleta: 'carta', letras: 'carta', portada: 'postal', adorno: 'ninguno', marco: 'cinta', textura: 'cuaderno', efecto: 'ninguno', franjas: 'suaves', apertura: 'sobre', orn: 'carta' },
  mediterraneo: { paleta: 'mediterraneo', letras: 'mediterraneo', portada: 'dividida', adorno: 'ninguno', marco: 'arco', textura: 'papel', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna', orn: 'olivo' },
  noche: { paleta: 'noche', letras: 'noche', portada: 'foto-completa', adorno: 'deco', marco: 'difuminado', textura: 'papel', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna' },
  jardin: { paleta: 'jardin', letras: 'jardin', portada: 'centrada', adorno: 'guirnalda', marco: 'ovalo', textura: 'papel', efecto: 'petalos', franjas: 'suaves', apertura: 'ninguna' },
  minimalista: { paleta: 'minimalista', letras: 'minimalista', portada: 'centrada', adorno: 'ninguno', marco: 'recto', textura: 'lisa', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna' },
  boho: { paleta: 'boho', letras: 'boho', portada: 'retrato', adorno: 'pampas', marco: 'arco', textura: 'papel', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna' },
  magnolia: { paleta: 'magnolia', letras: 'magnolia', portada: 'centrada', adorno: 'magnolias', marco: 'dorado', textura: 'papel', efecto: 'ninguno', franjas: 'oscuras', apertura: 'ninguna' },
  lavanda: { paleta: 'lavanda', letras: 'lavanda', portada: 'retrato', adorno: 'lavanda', marco: 'ovalo', textura: 'papel', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna' },
  playa: { paleta: 'playa', letras: 'playa', portada: 'centrada', adorno: 'palmeras', marco: 'polaroid', textura: 'papel', efecto: 'ninguno', franjas: 'suaves', apertura: 'ninguna' },
  black: { paleta: 'black', letras: 'editorial', portada: 'foto-fija', adorno: 'ninguno', marco: 'recto', textura: 'lisa', efecto: 'brillos', franjas: 'suaves', apertura: 'ninguna' },
}

/* ─── estilo final ─── */
export type Estilo = {
  colores: Colores
  letras: Letras
  portada: PortadaInv
  adorno: AdornoInv
  orn: string
  simbolos?: string
  marco: MarcoInv
  textura: TexturaInv
  efecto: EfectoInv
  franjas: FranjasInv
  apertura: AperturaInv
}

const PORTADA_IA: Record<TemaIA['portada'], PortadaInv> = { centrada: 'centrada', 'foto-fondo': 'foto-completa', dividida: 'dividida', arco: 'retrato' }
const ADORNO_IA: Partial<Record<TemaIA['ornamento'], AdornoInv>> = {
  flores: 'guirnalda', magnolia: 'magnolias', lavanda: 'lavanda', pampas: 'pampas', ondas: 'palmeras',
  olivo: 'olivo', deco: 'deco', acuarela: 'acuarela', espacio: 'estrellas',
}

function escala(f: string, n: Tam, display: boolean): Tam {
  const k = SCRIPT.has(f) ? 1 : display ? 0.8 : 0.72
  return [Math.round(n[0] * k), +(n[1] * k).toFixed(1), Math.round(n[2] * k)]
}

/** Lo que aporta una plantilla hecha con «Crea la vuestra» */
function baseIA(t: TemaIA): { base: Base; colores: Colores; letras: Letras } {
  const adorno = ADORNO_IA[t.ornamento] || 'ninguno'
  return {
    base: {
      paleta: '', letras: '', portada: PORTADA_IA[t.portada] || 'centrada', adorno,
      marco: t.portada === 'arco' ? 'arco' : t.radius === 'recto' ? 'recto' : 'redondeado',
      textura: t.textura, efecto: t.textura === 'estrellas' ? 'brillos' : 'ninguno', franjas: 'suaves', apertura: 'ninguna',
      orn: t.ornamento === 'simbolos' ? 'simbolos' : t.ornamento === 'huellas' ? 'huellas' : undefined,
    },
    colores: {
      paper: t.paper, paper2: t.paper2, ink: t.ink, ink2: t.ink2, accent: t.accent, accent2: t.accent2,
      accent3: t.accent3, title: t.title, btnBg: t.btnBg, btnFg: t.btnFg,
    },
    letras: {
      id: 'ia', label: 'De vuestra plantilla', names: t.fNames, title: t.fTitle, body: t.fBody,
      fsBody: SERIF_TEXTO.has(t.fBody) ? 19 : 16.5,
      fsNames: escala(t.fNames, [52, 10, 112], true), fsTitle: escala(t.fTitle, [40, 6, 58], true),
    },
  }
}

/** Colores elegidos a mano: fondo, texto y acento; el resto se deduce */
export function coloresPropios(paper: string, ink: string, accent: string): Colores {
  const tinta = legible(ink, paper, 7)
  const acento = legible(accent, paper, 2.4)
  const btnFg = luminancia(acento) > 0.45 ? '#1d1d1d' : '#ffffff'
  return {
    paper, paper2: mezclar(paper, acento, 0.07), ink: tinta, ink2: legible(mezclar(tinta, paper, 0.35), paper, 4.5),
    accent: acento, accent2: mezclar(acento, tinta, 0.3), accent3: mezclar(acento, paper, 0.45),
    title: legible(acento, paper, 3), btnBg: acento, btnFg: legible(btnFg, acento, 4.5),
  }
}

const porId = <T extends { id: string }>(l: readonly T[], id?: string) => (id ? l.find(x => x.id === id) : undefined)
const valido = <T extends string>(l: readonly { id: string }[], v: unknown): v is T => typeof v === 'string' && l.some(x => x.id === v)

export function baseDe(tema: InvitacionTema, temaIA?: TemaIA): Base & { colores: Colores; letrasObj: Letras } {
  if (tema === 'ia' && temaIA) {
    const b = baseIA(temaIA)
    return { ...b.base, colores: b.colores, letrasObj: b.letras }
  }
  const b = BASES[tema === 'ia' ? 'acuarela' : tema]
  return { ...b, colores: porId(PALETAS, b.paleta)!.c, letrasObj: porId(LETRAS, b.letras)! }
}

export function resolverEstilo(tema: InvitacionTema, p: PersonalInvitacion = {}, temaIA?: TemaIA): Estilo {
  const b = baseDe(tema, temaIA)
  const colores = p.colores && /^#[0-9a-f]{6}$/i.test(p.colores.paper || '')
    ? coloresPropios(p.colores.paper, p.colores.ink, p.colores.accent)
    : porId(PALETAS, p.paleta)?.c || b.colores
  const adorno = valido<AdornoInv>(ADORNOS, p.adorno) ? p.adorno : b.adorno
  return {
    colores,
    letras: porId(LETRAS, p.letras) || b.letrasObj,
    portada: valido<PortadaInv>(PORTADAS_INV, p.portada) ? p.portada : b.portada,
    adorno,
    orn: p.adorno ? ORN_DE[adorno] : b.orn || ORN_DE[adorno],
    simbolos: tema === 'ia' ? temaIA?.simbolos : undefined,
    marco: valido<MarcoInv>(MARCOS, p.marco) ? p.marco : b.marco,
    textura: valido<TexturaInv>(TEXTURAS_INV, p.textura) ? p.textura : b.textura,
    efecto: valido<EfectoInv>(EFECTOS, p.efecto) ? p.efecto : b.efecto,
    franjas: valido<FranjasInv>(FRANJAS, p.franjas) ? p.franjas : b.franjas,
    apertura: valido<AperturaInv>(APERTURAS, p.apertura) ? p.apertura : b.apertura,
  }
}

/* ─── pintar ─── */
const ESPEC_DISPLAY: Record<string, string> = {
  'Bodoni Moda': ':ital,opsz,wght@0,6..96,400;1,6..96,400',
  'Playfair Display': ':ital,wght@0,400;0,500;1,400',
  'Cinzel': ':wght@400;500',
  'DM Serif Display': ':ital@0;1',
  'Josefin Sans': ':wght@300;400',
  'Jost': ':wght@300;400;500',
  'Quicksand': ':wght@400;500',
  'Montserrat': ':wght@300;400;500',
}

const fam = (f: string) => f.replace(/ /g, '+')

export function fontUrlEstilo(l: Letras): string {
  const familias = Array.from(new Set([l.names, l.title, l.body]))
  const partes = familias.map(f => `family=${fam(f)}${f === l.body ? ESPEC_TEXTO[f] ?? ESPEC_DISPLAY[f] ?? '' : ESPEC_DISPLAY[f] ?? ''}`)
  return `https://fonts.googleapis.com/css2?${partes.join('&')}&display=swap`
}

/** Todas las letras de los nombres, para las muestras del editor */
export const FONT_MUESTRAS = `https://fonts.googleapis.com/css2?${Array.from(new Set(LETRAS.map(l => l.names))).map(f => `family=${fam(f)}`).join('&')}&display=swap`

const pila = (f: string) =>
  `'${f}',${SCRIPT.has(f) ? 'cursive' : SERIF_TEXTO.has(f) || /Garamond|Bodoni|Playfair|Prata|Forum|Cinzel|Marcellus|Fell|Serif|Display/.test(f) ? 'Georgia,serif' : 'system-ui,sans-serif'}`

const tam = (t: Tam) => `clamp(${t[0]}px,${t[1]}cqw,${t[2]}px)`

const RUIDO = (a: number) => `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27260%27%3E%3Cfilter%20id%3D%27n%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%27.85%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27/%3E%3CfeColorMatrix%20values%3D%270%200%200%200%200.25%200%200%200%200%200.22%200%200%200%200%200.2%20${a}%200%200%200%200%27/%3E%3C/filter%3E%3Crect%20width%3D%27260%27%20height%3D%27260%27%20filter%3D%27url%28%23n%29%27/%3E%3C/svg%3E")`

function textura(t: TexturaInv, c: Colores): { tex: string; size: string } {
  const oscuro = luminancia(c.paper) < 0.3
  const fino = oscuro ? '#ffffff' : c.ink
  switch (t) {
    case 'lisa': return { tex: 'none', size: 'auto' }
    case 'cuaderno': return { tex: `${RUIDO(0.2)},repeating-linear-gradient(180deg,transparent 0 33px,${rgba(c.accent2, 0.1)} 33px 34px)`, size: 'auto' }
    case 'puntos': return { tex: `radial-gradient(circle,${rgba(c.accent, 0.18)} 0 1.1px,transparent 1.6px)`, size: '22px 22px' }
    case 'rayas': return { tex: `repeating-linear-gradient(135deg,${rgba(fino, 0.035)} 0 2px,transparent 2px 14px)`, size: 'auto' }
    case 'estrellas': return {
      tex: `radial-gradient(circle at 20% 30%,${rgba(c.accent, 0.55)} 0 1px,transparent 1.6px),radial-gradient(circle at 70% 65%,${rgba(c.accent, 0.4)} 0 1.2px,transparent 1.8px),radial-gradient(circle at 45% 85%,${rgba(fino, 0.18)} 0 .8px,transparent 1.3px)`,
      size: '90px 90px',
    }
    default: return { tex: oscuro ? RUIDO(0.08) : RUIDO(0.16), size: 'auto' }
  }
}

/** Colores de una franja: fondo, texto, detalles y botón */
function franja(bg: string, acento: string, c: Colores) {
  const claro = luminancia(bg) > 0.4
  const ink = legible(claro ? c.ink : c.paper, bg, 7)
  const accent = legible(acento, bg, 2.6)
  return {
    bg, ink, ink2: legible(mezclar(ink, bg, 0.3), bg, 4.5), accent,
    title: legible(acento, bg, 3.2), line: rgba(ink, 0.28),
    btnBg: accent, btnFg: legible(luminancia(accent) > 0.45 ? '#1d1d1d' : '#ffffff', accent, 4.5),
  }
}

export function varsEstilo(e: Estilo): Record<string, string> {
  const c = e.colores
  const l = e.letras
  const t = textura(e.textura, c)
  const oscuroBg = c.oscuro || (luminancia(c.paper) > 0.3 ? c.ink : mezclar(c.paper, '#000000', 0.45))
  const fo = franja(oscuroBg, c.oscuroAcento || c.accent3, c)
  const fc = franja(c.accent, contraste(c.paper, c.accent) > 3 ? c.paper : c.ink, c)
  const v: Record<string, string> = {
    '--paper': c.paper, '--paper-2': c.paper2, '--ink': c.ink, '--ink-2': c.ink2,
    '--accent': c.accent, '--accent-2': c.accent2, '--accent-3': c.accent3,
    '--title-color': c.title, '--btn-bg': c.btnBg, '--btn-fg': c.btnFg,
    '--line': rgba(c.ink2, 0.3), '--desk': c.desk || mezclar(c.ink, '#000000', 0.25),
    '--f-names': pila(l.names), '--f-title': pila(l.title), '--f-body': pila(l.body),
    '--fs-body': `${l.fsBody}px`, '--fs-names': tam(l.fsNames), '--fs-title': tam(l.fsTitle),
    '--names-tt': l.namesMayus ? 'uppercase' : 'none', '--names-ls': l.namesMayus ? '.04em' : 'normal',
    '--names-fs': l.namesItalic ? 'italic' : 'normal', '--names-lh': String(l.namesLh || 1.08),
    '--title-tt': l.titleMayus ? 'uppercase' : 'none', '--title-ls': l.titleMayus ? '.2em' : 'normal',
    '--title-lh': String(l.titleLh || 1.18),
    '--tex': t.tex, '--tex-size': t.size,
  }
  for (const [k, f] of [['o', fo], ['c', fc]] as const) {
    v[`--b${k}-bg`] = f.bg; v[`--b${k}-ink`] = f.ink; v[`--b${k}-ink2`] = f.ink2; v[`--b${k}-accent`] = f.accent
    v[`--b${k}-title`] = f.title; v[`--b${k}-line`] = f.line; v[`--b${k}-btn-bg`] = f.btnBg; v[`--b${k}-btn-fg`] = f.btnFg
  }
  return v
}

/* ─── valores guardados ─── */
export function limpiarPersonal(p: unknown): PersonalInvitacion {
  if (!p || typeof p !== 'object') return {}
  const r = p as Record<string, unknown>
  const out: PersonalInvitacion = {}
  if (typeof r.paleta === 'string' && PALETAS.some(x => x.id === r.paleta)) out.paleta = r.paleta
  const col = r.colores as Record<string, unknown> | undefined
  if (col && ['paper', 'ink', 'accent'].every(k => typeof col[k] === 'string' && /^#[0-9a-f]{6}$/i.test(col[k] as string))) {
    out.colores = { paper: col.paper as string, ink: col.ink as string, accent: col.accent as string }
  }
  if (typeof r.letras === 'string' && LETRAS.some(x => x.id === r.letras)) out.letras = r.letras
  if (valido(PORTADAS_INV, r.portada)) out.portada = r.portada as PortadaInv
  if (valido(ADORNOS, r.adorno)) out.adorno = r.adorno as AdornoInv
  if (valido(MARCOS, r.marco)) out.marco = r.marco as MarcoInv
  if (valido(TEXTURAS_INV, r.textura)) out.textura = r.textura as TexturaInv
  if (valido(EFECTOS, r.efecto)) out.efecto = r.efecto as EfectoInv
  if (valido(FRANJAS, r.franjas)) out.franjas = r.franjas as FranjasInv
  if (valido(APERTURAS, r.apertura)) out.apertura = r.apertura as AperturaInv
  return out
}
