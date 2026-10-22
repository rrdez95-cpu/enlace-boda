import type { TemaIA } from './types'

/* ═══ Plantilla creada con IA ═══
   La IA no escribe HTML ni CSS: elige colores, tipografías y piezas de diseño
   de una lista cerrada. Así cualquier plantilla queda bien maquetada y es segura. */

// Tipografías de Google Fonts que puede usar (nombres y títulos)
export const FUENTES_DISPLAY = [
  'Pinyon Script', 'Great Vibes', 'Parisienne', 'Allura', 'Alex Brush', 'Tangerine', 'Sacramento',
  'Dancing Script', 'Satisfy', 'Kaushan Script', 'Pacifico', 'Lobster', 'Petit Formal Script', 'Homemade Apple',
  'Italiana', 'Cinzel', 'Cinzel Decorative', 'Marcellus', 'Poiret One', 'Bodoni Moda', 'Playfair Display',
  'DM Serif Display', 'Abril Fatface', 'Prata', 'Forum', 'Tenor Sans', 'Cormorant Garamond', 'IM Fell English',
  'Amatic SC', 'Caveat', 'Uncial Antiqua', 'MedievalSharp', 'Pirata One', 'Fredericka the Great', 'Monoton',
  'Limelight', 'Rye', 'Righteous', 'Special Elite', 'Josefin Sans', 'Montserrat', 'Quicksand', 'Jost',
] as const

// Tipografías de texto, con las variantes que existen de verdad en Google Fonts
export const ESPEC_TEXTO: Record<string, string> = {
  'Cormorant Garamond': ':ital,wght@0,400;0,500;1,400',
  'EB Garamond': ':ital,wght@0,400;0,500;1,400',
  'Lora': ':ital,wght@0,400;0,500;1,400',
  'Libre Baskerville': ':ital@0;1',
  'Josefin Sans': ':ital,wght@0,300;0,400;1,300',
  'Montserrat': ':ital,wght@0,300;0,400;0,500;1,300',
  'Quicksand': ':wght@400;500',
  'Raleway': ':ital,wght@0,300;0,400;0,500;1,300',
  'Jost': ':ital,wght@0,300;0,400;0,500;1,300',
  'IM Fell English': ':ital@0;1',
  'Crimson Text': ':ital@0;1',
  'Nunito': ':ital,wght@0,400;0,500;1,400',
  'Spectral': ':ital@0;1',
  'Alegreya': ':ital,wght@0,400;0,500;1,400',
  'Special Elite': '',
}
export const FUENTES_TEXTO = Object.keys(ESPEC_TEXTO)

export const SERIF_TEXTO = new Set(['Cormorant Garamond', 'EB Garamond', 'Lora', 'Libre Baskerville', 'IM Fell English', 'Crimson Text', 'Spectral', 'Alegreya'])
export const SCRIPT = new Set(['Pinyon Script', 'Great Vibes', 'Parisienne', 'Allura', 'Alex Brush', 'Tangerine', 'Sacramento',
  'Dancing Script', 'Satisfy', 'Kaushan Script', 'Pacifico', 'Lobster', 'Petit Formal Script', 'Homemade Apple', 'Caveat'])

export const RADIOS = ['recto', 'suave', 'redondo'] as const
export const PORTADAS = ['centrada', 'foto-fondo', 'dividida', 'arco'] as const
export const ORNAMENTOS = ['simbolos', 'linea', 'olivo', 'flores', 'deco', 'acuarela', 'ondas', 'lavanda', 'pampas', 'magnolia', 'huellas', 'espacio'] as const
export const TEXTURAS = ['papel', 'estrellas', 'puntos', 'rayas', 'lisa'] as const
export const FILTROS = ['natural', 'calida', 'fria', 'bn', 'oscura'] as const

/* ─── colores ─── */
const HEX = /^#[0-9a-f]{6}$/i

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
export function luminancia(hex: string): number {
  const c = rgb(hex).map(v => {
    const x = v / 255
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}
export function mezclar(a: string, b: string, t: number): string {
  const [r1, g1, b1] = rgb(a), [r2, g2, b2] = rgb(b)
  const h = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  return '#' + h(r1 + (r2 - r1) * t) + h(g1 + (g2 - g1) * t) + h(b1 + (b2 - b1) * t)
}
/** Acerca el color al blanco o al negro hasta que se lea bien sobre el fondo */
export function legible(color: string, fondo: string, minimo: number): string {
  if (contraste(color, fondo) >= minimo) return color
  const destino = luminancia(fondo) > 0.4 ? '#000000' : '#ffffff'
  for (let t = 0.1; t <= 1; t += 0.1) {
    const c = mezclar(color, destino, t)
    if (contraste(c, fondo) >= minimo) return c
  }
  return destino
}
export function rgba(hex: string, a: number): string {
  const [r, g, b] = rgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

/* ─── limpiar lo que devuelve la IA ─── */
const txt = (v: unknown, max: number) =>
  typeof v === 'string' ? v.replace(/[<>{}\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, max) : ''
const color = (v: unknown, def: string) => (typeof v === 'string' && HEX.test(v.trim()) ? v.trim() : def)
function de<T extends string>(lista: readonly T[], v: unknown, def: T): T {
  return lista.includes(v as T) ? (v as T) : def
}
function fuente(v: unknown, lista: readonly string[], def: string): string {
  if (typeof v !== 'string') return def
  const f = lista.find(x => x.toLowerCase() === v.trim().toLowerCase())
  return f || def
}

export function limpiarTemaIA(raw: Record<string, unknown>, prompt: string): TemaIA {
  const paper = color(raw.paper, '#FBF8F3')
  const paper2 = color(raw.paper2, paper)
  const oscuro = luminancia(paper) < 0.3
  const ink = legible(color(raw.ink, oscuro ? '#F3EEE4' : '#2B2622'), paper, 7)
  const accent = color(raw.accent, '#B8965A')
  const btnBg = color(raw.btnBg, accent)
  return {
    nombre: txt(raw.nombre, 40) || 'Vuestra plantilla',
    prompt: txt(prompt, 300),
    paper,
    paper2: contraste(ink, paper2) >= 4.5 ? paper2 : paper,
    ink,
    ink2: legible(color(raw.ink2, mezclar(ink, paper, 0.35)), paper, 4.5),
    accent: legible(accent, paper, 2.2),
    accent2: color(raw.accent2, accent),
    accent3: color(raw.accent3, accent),
    title: legible(color(raw.title, accent), paper, 3),
    btnBg,
    btnFg: legible(color(raw.btnFg, luminancia(btnBg) > 0.4 ? '#1d1d1d' : '#ffffff'), btnBg, 4.5),
    fNames: fuente(raw.fNames, FUENTES_DISPLAY, 'Great Vibes'),
    fTitle: fuente(raw.fTitle, FUENTES_DISPLAY, 'Cormorant Garamond'),
    fBody: fuente(raw.fBody, FUENTES_TEXTO, 'Cormorant Garamond'),
    radius: de(RADIOS, raw.radius, 'suave'),
    portada: de(PORTADAS, raw.portada, 'centrada'),
    ornamento: de(ORNAMENTOS, raw.ornamento, 'linea'),
    simbolos: txt(raw.simbolos, 12).replace(/[A-Za-z0-9]/g, '') || '✦',
    textura: de(TEXTURAS, raw.textura, 'papel'),
    fotoFiltro: de(FILTROS, raw.fotoFiltro, 'natural'),
    kicker: txt(raw.kicker, 40) || 'Nos casamos',
    saludo: txt(raw.saludo, 80) || undefined,
    mensaje: typeof raw.mensaje === 'string'
      ? raw.mensaje.replace(/[<>{}\\]/g, '').trim().slice(0, 600) || undefined
      : undefined,
    creada: new Date().toISOString(),
  }
}

/* ─── pintar ─── */
const fam = (f: string) => f.replace(/ /g, '+')

export function fontUrlIA(t: TemaIA): string {
  const display = Array.from(new Set([t.fNames, t.fTitle].filter(f => f !== t.fBody)))
  const partes = [...display.map(f => `family=${fam(f)}`), `family=${fam(t.fBody)}${ESPEC_TEXTO[t.fBody] ?? ''}`]
  return `https://fonts.googleapis.com/css2?${partes.join('&')}&display=swap`
}

const pila = (f: string) =>
  `'${f}',${SCRIPT.has(f) ? 'cursive' : SERIF_TEXTO.has(f) || /Garamond|Bodoni|Playfair|Prata|Forum|Cinzel|Marcellus|Fell|Serif/.test(f) ? 'Georgia,serif' : 'system-ui,sans-serif'}`

function textura(t: TemaIA): string {
  const c = luminancia(t.paper) < 0.3 ? '#ffffff' : t.ink
  switch (t.textura) {
    case 'estrellas':
      return `radial-gradient(circle at 20% 30%,${rgba(t.accent, 0.55)} 0 1px,transparent 1.6px),radial-gradient(circle at 70% 65%,${rgba(t.accent, 0.4)} 0 1.2px,transparent 1.8px),radial-gradient(circle at 45% 85%,${rgba(c, 0.18)} 0 .8px,transparent 1.3px)`
    case 'puntos':
      return `radial-gradient(circle,${rgba(t.accent, 0.16)} 0 1.1px,transparent 1.6px)`
    case 'rayas':
      return `repeating-linear-gradient(135deg,${rgba(c, 0.035)} 0 2px,transparent 2px 14px)`
    case 'lisa':
      return 'none'
    default:
      return `url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%27260%27%20height%3D%27260%27%3E%3Cfilter%20id%3D%27n%27%3E%3CfeTurbulence%20type%3D%27fractalNoise%27%20baseFrequency%3D%27.85%27%20numOctaves%3D%273%27%20stitchTiles%3D%27stitch%27/%3E%3CfeColorMatrix%20values%3D%270%200%200%200%200.25%200%200%200%200%200.22%200%200%200%200%200.2%200.14%200%200%200%200%27/%3E%3C/filter%3E%3Crect%20width%3D%27260%27%20height%3D%27260%27%20filter%3D%27url%28%23n%29%27/%3E%3C/svg%3E")`
  }
}

const FILTRO: Record<TemaIA['fotoFiltro'], string> = {
  natural: 'saturate(.95)',
  calida: 'sepia(.22) saturate(.95) brightness(1.03)',
  fria: 'saturate(.8) hue-rotate(-8deg) brightness(1.02)',
  bn: 'grayscale(1) contrast(1.05)',
  oscura: 'brightness(.82) saturate(.75)',
}

/** Variables CSS de la plantilla, en el mismo formato que las plantillas hechas a mano */
export function varsTemaIA(t: TemaIA): Record<string, string> {
  const escala = SCRIPT.has(t.fNames) ? 1 : 0.78
  const escalaT = SCRIPT.has(t.fTitle) ? 1 : 0.72
  return {
    '--paper': t.paper, '--paper-2': t.paper2, '--ink': t.ink, '--ink-2': t.ink2,
    '--accent': t.accent, '--accent-2': t.accent2, '--accent-3': t.accent3,
    '--line': rgba(t.ink2, 0.3), '--title-color': t.title,
    '--btn-bg': t.btnBg, '--btn-fg': t.btnFg,
    '--radius': t.radius === 'recto' ? '0' : t.radius === 'redondo' ? '999px' : '8px',
    '--f-names': pila(t.fNames), '--f-title': pila(t.fTitle), '--f-body': pila(t.fBody),
    '--fs-body': SERIF_TEXTO.has(t.fBody) ? '19px' : '16.5px',
    '--fs-names': `clamp(${Math.round(52 * escala)}px,${(10 * escala).toFixed(1)}cqw,${Math.round(112 * escala)}px)`,
    '--fs-title': `clamp(${Math.round(40 * escalaT)}px,${(6 * escalaT).toFixed(1)}cqw,${Math.round(58 * escalaT)}px)`,
    '--tex': textura(t),
    '--tex-size': t.textura === 'estrellas' ? '90px 90px' : t.textura === 'puntos' ? '22px 22px' : 'auto',
    '--ph-filter': FILTRO[t.fotoFiltro],
    '--ph-blend': 'normal',
    '--ph-mask': t.portada === 'arco'
      ? 'url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%20800%201000%27%20preserveAspectRatio%3D%27none%27%3E%3Cpath%20d%3D%27M0%201000V400A400%20400%200%200%201%20800%20400V1000Z%27%20fill%3D%27%23fff%27/%3E%3C/svg%3E")'
      : 'none',
    '--ph-radius': t.portada === 'arco' ? '0' : t.radius === 'recto' ? '2px' : t.radius === 'redondo' ? '28px' : '12px',
  }
}

/* ─── qué se le pide a la IA ─── */
export const ESQUEMA_IA = {
  type: 'object',
  properties: {
    nombre: { type: 'string', description: 'Nombre corto y evocador de la plantilla, en español (máx. 4 palabras)' },
    paper: { type: 'string', description: 'Color de fondo principal, #RRGGBB' },
    paper2: { type: 'string', description: 'Fondo de las franjas alternas, cercano a paper, #RRGGBB' },
    ink: { type: 'string', description: 'Color del texto, con mucho contraste sobre paper, #RRGGBB' },
    ink2: { type: 'string', description: 'Texto secundario, #RRGGBB' },
    accent: { type: 'string', description: 'Color de acento principal, #RRGGBB' },
    accent2: { type: 'string', description: 'Segundo acento (adornos), #RRGGBB' },
    accent3: { type: 'string', description: 'Tercer acento (detalles), #RRGGBB' },
    title: { type: 'string', description: 'Color de los títulos, #RRGGBB' },
    btnBg: { type: 'string', description: 'Fondo de los botones, #RRGGBB' },
    btnFg: { type: 'string', description: 'Texto de los botones, #RRGGBB' },
    fNames: { type: 'string', enum: [...FUENTES_DISPLAY], description: 'Tipografía de los nombres de los novios' },
    fTitle: { type: 'string', enum: [...FUENTES_DISPLAY], description: 'Tipografía de los títulos de sección' },
    fBody: { type: 'string', enum: FUENTES_TEXTO, description: 'Tipografía del texto, muy legible' },
    radius: { type: 'string', enum: [...RADIOS] },
    portada: { type: 'string', enum: [...PORTADAS], description: 'centrada: nombres y foto debajo. foto-fondo: foto a pantalla completa oscurecida con los nombres encima. dividida: foto a un lado y texto al otro. arco: foto en forma de arco.' },
    ornamento: { type: 'string', enum: [...ORNAMENTOS], description: 'Adorno entre secciones. simbolos usa los caracteres de "simbolos".' },
    simbolos: { type: 'string', description: 'De 1 a 3 símbolos Unicode tipográficos (no emojis de colores, no letras), por ejemplo ✦ ☾ ✶ ❦ ♡ ✧ ⚘ ☀ ✺ ⚜' },
    textura: { type: 'string', enum: [...TEXTURAS] },
    fotoFiltro: { type: 'string', enum: [...FILTROS] },
    kicker: { type: 'string', description: 'Frase corta sobre los nombres en la portada, en español (máx. 5 palabras), por ejemplo "Nos casamos"' },
    saludo: { type: 'string', description: 'Saludo de la carta a los invitados, en español, con el tono del tema (máx. 10 palabras)' },
    mensaje: { type: 'string', description: 'Texto de invitación de 2 o 3 frases, en español de España, tuteando en plural (vosotros), cálido y con un guiño sutil al tema' },
  },
  required: ['nombre', 'paper', 'paper2', 'ink', 'ink2', 'accent', 'accent2', 'accent3', 'title', 'btnBg', 'btnFg',
    'fNames', 'fTitle', 'fBody', 'radius', 'portada', 'ornamento', 'simbolos', 'textura', 'fotoFiltro', 'kicker', 'saludo', 'mensaje'],
}

export const SISTEMA_IA = `Eres directora de arte de Enlace, una web española para organizar bodas. Diseñas plantillas de invitación digital a partir de lo que piden los novios.

Reglas:
- Traduce la petición a una estética: paleta, tipografías, tipo de portada, adorno y textura. Que se reconozca la temática a la primera, pero que siga siendo una invitación de boda elegante y legible.
- El texto debe leerse perfectamente: contraste alto entre ink y paper, y entre btnFg y btnBg.
- Usa una tipografía decorativa como mucho en nombres y títulos; el texto siempre con una tipografía de lectura.
- Si la petición se basa en una película, libro, serie o marca, inspírate en su ambiente (épocas, lugares, objetos, colores) sin usar nombres de personajes, frases, logotipos ni marcas registradas en ningún texto.
- Los textos en español de España, tuteando en plural (vosotros), sin nombres propios de los novios.
- Si la petición es ofensiva o no tiene nada que ver con un estilo, crea una plantilla clásica y elegante.
- Responde solo llamando a la herramienta crear_plantilla.`
