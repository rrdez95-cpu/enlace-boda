import type { TemaIA } from './types'
import { limpiarTemaIA } from './plantilla-ia'

/* ═══ «Crea la vuestra» sin coste ═══
   Lee lo que escriben los novios (temas, aficiones, estación, colores) y compone
   una plantilla combinando piezas ya diseñadas. Funciona en el navegador, al momento
   y sin servicios externos. Cada vez que se pide «otra versión» cambia la combinación. */

type Paleta = {
  paper: string; paper2: string; ink: string; ink2: string
  accent: string; accent2: string; accent3: string; title: string; btnBg: string
}

type Motivo = {
  id: string
  tipo: 'estacion' | 'tema'
  claves: RegExp
  nombre: string        // «Primavera», «Galaxia»…
  adj: string           // «primaveral», «galáctica»…
  paletas: Paleta[]
  fNames: string[]; fTitle: string; fBody: string
  portadas: TemaIA['portada'][]
  ornamento: TemaIA['ornamento']
  /** Adorno que identifica el tema: gana aunque la paleta venga de otro motivo */
  ornamentoPropio?: boolean
  simbolos: string
  textura: TemaIA['textura']
  fotoFiltro: TemaIA['fotoFiltro']
  radius: TemaIA['radius']
  kickers: string[]
  frase: string
}

const P = (paper: string, paper2: string, ink: string, ink2: string, accent: string, accent2: string, accent3: string, title = accent, btnBg = accent): Paleta =>
  ({ paper, paper2, ink, ink2, accent, accent2, accent3, title, btnBg })

const MOTIVOS: Motivo[] = [
  /* ─── estaciones y ambientes de luz ─── */
  {
    id: 'primavera', tipo: 'estacion', claves: /primaver|flor|floral|almendro|cerezo|abril|marzo|mayo|jardin|petal/,
    nombre: 'Primavera', adj: 'en flor',
    paletas: [P('#FBF6F3', '#F4E9E6', '#3E3438', '#7A6A6F', '#C9718A', '#86A98A', '#E9B8C4', '#B25E78'),
      P('#F8F8F1', '#EEF2E6', '#33402F', '#6C7766', '#7FA06B', '#D98CA0', '#F2D27A', '#5E7F4E')],
    fNames: ['Great Vibes', 'Parisienne'], fTitle: 'Parisienne', fBody: 'EB Garamond',
    portadas: ['centrada', 'arco'], ornamento: 'flores', simbolos: '❀', textura: 'papel', fotoFiltro: 'natural', radius: 'redondo',
    kickers: ['Nos casamos en primavera', 'Florece lo nuestro'],
    frase: 'Lo celebraremos en plena primavera, rodeados de flores.',
  },
  {
    id: 'verano', tipo: 'estacion', claves: /verano|playa|mar\b|costa|cadiz|ibiza|menorca|mallorca|canarias|tropical|sol\b|julio|agosto|atardecer/,
    nombre: 'Atardecer', adj: 'junto al mar',
    paletas: [P('#FBF7EE', '#E8F2F0', '#1F4650', '#4F7078', '#D9694C', '#2A8C8A', '#F2C38F', '#1F5560'),
      P('#FFF9F0', '#FBEBD8', '#3B2F2A', '#7A675C', '#E0874F', '#3E8FA8', '#F6D49A', '#C0603A')],
    fNames: ['Sacramento', 'Dancing Script'], fTitle: 'DM Serif Display', fBody: 'Quicksand',
    portadas: ['centrada', 'dividida'], ornamento: 'ondas', simbolos: '☀', textura: 'papel', fotoFiltro: 'calida', radius: 'redondo',
    kickers: ['Nos casamos junto al mar', 'Nos vemos con los pies en la arena'],
    frase: 'Traed ganas de sol, de brisa y de celebrar hasta que se ponga.',
  },
  {
    id: 'otono', tipo: 'estacion', claves: /otono|hojas|bosque|septiembre|octubre|noviembre|setas|castan|rustic|campo|madera|montan/,
    nombre: 'Otoño', adj: 'del bosque',
    paletas: [P('#F6F0E6', '#ECE2D2', '#3A3026', '#6E6253', '#B5653F', '#5E7350', '#D6A35B', '#8E4A2C'),
      P('#F3EFE6', '#E5E3D3', '#2E3A2C', '#5F6B5A', '#3F6B4A', '#B5653F', '#C9A45C', '#2F5D40')],
    fNames: ['Alex Brush', 'Allura'], fTitle: 'Cormorant Garamond', fBody: 'Cormorant Garamond',
    portadas: ['arco', 'centrada'], ornamento: 'olivo', simbolos: '❦', textura: 'papel', fotoFiltro: 'calida', radius: 'suave',
    kickers: ['Nos casamos este otoño', 'Entre hojas y promesas'],
    frase: 'Será una celebración con olor a bosque y a tarde de otoño.',
  },
  {
    id: 'invierno', tipo: 'estacion', claves: /invierno|navidad|nieve|diciembre|enero|febrero|frio|chimenea/,
    nombre: 'Invierno', adj: 'de invierno',
    paletas: [P('#F7F7F5', '#ECEEF0', '#23303B', '#5E6A74', '#8E2C38', '#2F5D50', '#C2A26B', '#7B2230'),
      P('#F5F7FA', '#E7EDF3', '#1F2D3D', '#5A6878', '#5C7FA3', '#A8B4C2', '#C9A24B', '#2F4A66')],
    fNames: ['Pinyon Script', 'Petit Formal Script'], fTitle: 'Cinzel', fBody: 'EB Garamond',
    portadas: ['centrada', 'foto-fondo'], ornamento: 'simbolos', simbolos: '❄', textura: 'puntos', fotoFiltro: 'fria', radius: 'suave',
    kickers: ['Nos casamos en invierno', 'Un sí que da calor'],
    frase: 'Abrigaos bien: lo de dentro lo ponemos nosotros.',
  },

  /* ─── temas y aficiones ─── */
  {
    id: 'espacio', tipo: 'tema', claves: /ciencia ficcion|sci.?fi|espacio|galax|estrell|planeta|nave|astronaut|universo|futur|cosmo|star ?wars|star ?trek|marte/,
    nombre: 'Galaxia', adj: 'galáctica',
    paletas: [P('#14162B', '#1B1E38', '#ECEAF6', '#B3B2CC', '#8FD3E8', '#A88BEB', '#F2D27A', '#B9A6F2', '#6E57C9'),
      P('#F4F3FA', '#E9E7F5', '#26244A', '#5F5D85', '#5B4BC4', '#2FA3B8', '#E8B64C', '#3C318F')],
    fNames: ['Italiana', 'Poiret One'], fTitle: 'Josefin Sans', fBody: 'Jost',
    portadas: ['foto-fondo', 'centrada'], ornamento: 'espacio', ornamentoPropio: true, simbolos: '✦✧✦', textura: 'estrellas', fotoFiltro: 'fria', radius: 'redondo',
    kickers: ['Rumbo a nuestro para siempre', 'Despegamos juntos', 'En esta galaxia y en todas'],
    frase: 'Preparad el traje espacial: os queremos a bordo en este viaje.',
  },
  {
    id: 'perros', tipo: 'tema', claves: /perr|mascota|cachorr|peludo|gato|gatit|huella|animal/,
    nombre: 'Huellas', adj: 'con huellas',
    paletas: [P('#FAF5EE', '#F1E6D8', '#3B2E25', '#71604F', '#B7794A', '#7C9A86', '#E1B887', '#8A5634')],
    fNames: ['Dancing Script', 'Satisfy'], fTitle: 'Quicksand', fBody: 'Nunito',
    portadas: ['centrada', 'arco'], ornamento: 'huellas', ornamentoPropio: true, simbolos: '♡', textura: 'puntos', fotoFiltro: 'calida', radius: 'redondo',
    kickers: ['Nos casamos (y ellos también vienen)', 'Con el permiso de nuestros peludos'],
    frase: 'Nuestros peludos ya están avisados y os esperan moviendo la cola.',
  },
  {
    id: 'magia', tipo: 'tema', claves: /magi|castillo|hechiz|brujo|bruja|varita|harry|hogwarts|velas|encantad|hada/,
    nombre: 'Noche mágica', adj: 'mágica',
    paletas: [P('#1B1A2E', '#232238', '#EDE6D3', '#B8B0C8', '#D4AF37', '#8B2635', '#E8D9A8', '#D4AF37', '#8B2635'),
      P('#F3EBDD', '#E8DCC8', '#2A2233', '#5E5266', '#7B2230', '#C9A24B', '#2F4A3A', '#7B2230')],
    fNames: ['Cinzel Decorative', 'Pinyon Script'], fTitle: 'Cinzel', fBody: 'Crimson Text',
    portadas: ['foto-fondo', 'arco'], ornamento: 'simbolos', ornamentoPropio: true, simbolos: '✦☾✦', textura: 'estrellas', fotoFiltro: 'oscura', radius: 'recto',
    kickers: ['Se ha escrito en las estrellas', 'Un hechizo para siempre'],
    frase: 'Habrá algo de magia en el aire, y queremos que la viváis con nosotros.',
  },
  {
    id: 'medieval', tipo: 'tema', claves: /medieval|fantas|dragon|elfo|trono|caballer|anillos|reino|leyenda|cuento/,
    nombre: 'Leyenda', adj: 'de leyenda',
    paletas: [P('#F3EBDD', '#E9DCC6', '#3A2A1E', '#6E5845', '#2F5D50', '#9B6B3E', '#C9A45C')],
    fNames: ['Uncial Antiqua', 'MedievalSharp'], fTitle: 'Uncial Antiqua', fBody: 'EB Garamond',
    portadas: ['dividida', 'arco'], ornamento: 'olivo', simbolos: '⚜', textura: 'rayas', fotoFiltro: 'calida', radius: 'suave',
    kickers: ['Érase una vez', 'Comienza nuestra leyenda'],
    frase: 'Nuestra historia merece un capítulo épico, y vosotros estáis en él.',
  },
  {
    id: 'deco', tipo: 'tema', claves: /anos 20|art deco|gatsby|charleston|glamur|glam|retro chic|jazz/,
    nombre: 'Gran noche', adj: 'de los años 20',
    paletas: [P('#141414', '#1C1C1C', '#F1E9D6', '#BDB29A', '#CDB27A', '#8C7A52', '#E6D4A6', '#CDB27A', '#CDB27A')],
    fNames: ['Limelight', 'Poiret One'], fTitle: 'Poiret One', fBody: 'Josefin Sans',
    portadas: ['foto-fondo'], ornamento: 'deco', ornamentoPropio: true, simbolos: '◆', textura: 'rayas', fotoFiltro: 'bn', radius: 'recto',
    kickers: ['Nos casamos a lo grande', 'Una noche de champán'],
    frase: 'Sacad las lentejuelas y la pajarita: será una noche para recordar.',
  },
  {
    id: 'toscana', tipo: 'tema', claves: /toscana|itali|limon|amalfi|sicilia|capri|olivo|aceite/,
    nombre: 'Limonero', adj: 'italiana',
    paletas: [P('#FBF8EF', '#F3EEDB', '#23324F', '#5A6683', '#2B4C9B', '#E3B23C', '#7C8748', '#2B4C9B')],
    fNames: ['Parisienne', 'Allura'], fTitle: 'Marcellus', fBody: 'Lora',
    portadas: ['arco', 'dividida'], ornamento: 'olivo', simbolos: '✺', textura: 'papel', fotoFiltro: 'calida', radius: 'suave',
    kickers: ['La dolce vita empieza aquí', 'Nos casamos'],
    frase: 'Habrá sobremesa larga, buen vino y mucho que brindar.',
  },
  {
    id: 'vino', tipo: 'tema', claves: /vino|vinedo|bodega|rioja|ribera|uva|vendimia/,
    nombre: 'Vendimia', adj: 'entre viñedos',
    paletas: [P('#F7F1EA', '#EFE3D8', '#3A2328', '#6E5459', '#7B2230', '#7C8748', '#C9A24B')],
    fNames: ['Petit Formal Script', 'Great Vibes'], fTitle: 'Cormorant Garamond', fBody: 'Cormorant Garamond',
    portadas: ['dividida', 'centrada'], ornamento: 'olivo', simbolos: '❦', textura: 'papel', fotoFiltro: 'calida', radius: 'suave',
    kickers: ['Brindemos por nosotros', 'Nos casamos entre viñas'],
    frase: 'Tenemos una buena reserva guardada para brindar con vosotros.',
  },
  {
    id: 'musica', tipo: 'tema', claves: /musica|rock|concierto|vinilo|guitarr|festival|indie|punk|cancion/,
    nombre: 'Gran concierto', adj: 'en concierto',
    paletas: [P('#161616', '#1F1F1F', '#F2EDE4', '#B8B0A4', '#E0533D', '#E8B64C', '#F2EDE4', '#E0533D', '#E0533D'),
      P('#F6F2EA', '#ECE5D8', '#1E1E1E', '#5E5A54', '#C0392B', '#1E1E1E', '#E8B64C', '#1E1E1E', '#C0392B')],
    fNames: ['Righteous', 'Kaushan Script'], fTitle: 'Righteous', fBody: 'Jost',
    portadas: ['foto-fondo', 'dividida'], ornamento: 'simbolos', ornamentoPropio: true, simbolos: '♪♫♪', textura: 'lisa', fotoFiltro: 'bn', radius: 'recto',
    kickers: ['Nuestro mejor directo', 'Sube el volumen: nos casamos'],
    frase: 'Habrá música hasta que nos echen, así que venid con energía.',
  },
  {
    id: 'cine', tipo: 'tema', claves: /cine\b|pelicula|hollywood|palomitas|oscars?\b/,
    nombre: 'Estreno', adj: 'de película',
    paletas: [P('#121212', '#1B1B1B', '#F3EEE3', '#BDB6A8', '#D9B45A', '#B23A3A', '#F3E2B3', '#D9B45A', '#B23A3A')],
    fNames: ['Limelight', 'Abril Fatface'], fTitle: 'Abril Fatface', fBody: 'Montserrat',
    portadas: ['foto-fondo'], ornamento: 'simbolos', simbolos: '★', textura: 'lisa', fotoFiltro: 'bn', radius: 'recto',
    kickers: ['Próximamente: nuestra boda', 'Una historia de película'],
    frase: 'Tenemos reservada la mejor butaca para vosotros.',
  },
  {
    id: 'viajes', tipo: 'tema', claves: /viaj|mundo|avion|aventura|mapa|pasaporte|mochil|vuelta al mundo/,
    nombre: 'Gran viaje', adj: 'viajera',
    paletas: [P('#F4EDE0', '#EADFCB', '#22313F', '#5B6774', '#1F4E79', '#C0603A', '#C9A24B', '#1F4E79')],
    fNames: ['Homemade Apple', 'Caveat'], fTitle: 'Special Elite', fBody: 'Lora',
    portadas: ['dividida', 'centrada'], ornamento: 'linea', simbolos: '✈', textura: 'papel', fotoFiltro: 'calida', radius: 'suave',
    kickers: ['Nuestro mejor viaje empieza aquí', 'Próximo destino: el altar'],
    frase: 'Hemos recorrido mucho juntos, pero este destino lo queremos con vosotros.',
  },
  {
    id: 'libros', tipo: 'tema', claves: /libro|lectur|biblioteca|novela|poesia|literat|cafe/,
    nombre: 'Nuestra historia', adj: 'de novela',
    paletas: [P('#F5EFE3', '#EBE2D0', '#2F2A24', '#665C51', '#6B4A2E', '#4E6A86', '#B08A4E')],
    fNames: ['Homemade Apple', 'Pinyon Script'], fTitle: 'IM Fell English', fBody: 'IM Fell English',
    portadas: ['centrada', 'dividida'], ornamento: 'linea', simbolos: '❧', textura: 'papel', fotoFiltro: 'calida', radius: 'recto',
    kickers: ['Capítulo uno: nos casamos', 'Y vivieron felices'],
    frase: 'Empieza el capítulo más bonito de nuestra historia.',
  },
  {
    id: 'andalucia', tipo: 'tema', claves: /andalu|sevill|feria|flamenc|cortijo|granada|cordoba|malaga|azahar/,
    nombre: 'Cortijo', adj: 'andaluza',
    paletas: [P('#FBF7EF', '#F3EADB', '#2E2A26', '#6A6157', '#B23A3A', '#2D6C8C', '#E3B23C', '#9B2F2F')],
    fNames: ['Alex Brush', 'Great Vibes'], fTitle: 'Marcellus', fBody: 'Lora',
    portadas: ['arco'], ornamento: 'olivo', simbolos: '✺', textura: 'papel', fotoFiltro: 'calida', radius: 'suave',
    kickers: ['Nos casamos con mucho arte', 'Nos casamos'],
    frase: 'Traed ganas de bailar, que la noche va a ser larga.',
  },
  {
    id: 'boho', tipo: 'tema', claves: /boho|hippie|pampas|terracota|desierto|macrame|natural/,
    nombre: 'Boho', adj: 'boho',
    paletas: [P('#F4ECE2', '#EBDDCD', '#4A3428', '#7A6052', '#B5653F', '#C7A07A', '#7E8560', '#9C5434')],
    fNames: ['Alex Brush'], fTitle: 'Tenor Sans', fBody: 'Cormorant Garamond',
    portadas: ['arco'], ornamento: 'pampas', ornamentoPropio: true, simbolos: '☀', textura: 'papel', fotoFiltro: 'calida', radius: 'redondo',
    kickers: ['Nos casamos', 'Bajo el mismo sol'],
    frase: 'Será una celebración sencilla, libre y llena de cariño.',
  },
  {
    id: 'minimal', tipo: 'tema', claves: /minimal|modern|sencill|limpi|blanco y negro|elegant|sobri/,
    nombre: 'Esencial', adj: 'esencial',
    paletas: [P('#FFFFFF', '#F5F4F1', '#1C1C1C', '#6B6B6B', '#1C1C1C', '#A3A3A3', '#1C1C1C')],
    fNames: ['Bodoni Moda', 'Italiana'], fTitle: 'Bodoni Moda', fBody: 'Jost',
    portadas: ['centrada', 'dividida'], ornamento: 'linea', simbolos: '—', textura: 'lisa', fotoFiltro: 'bn', radius: 'recto',
    kickers: ['Nos casamos', 'Sí, quiero'],
    frase: 'Sin artificios: solo nosotros, vosotros y una gran fiesta.',
  },
  {
    id: 'romantico', tipo: 'tema', claves: /romant|amor|corazon|rosas|blush|delicad|vintage/,
    nombre: 'Rosa antiguo', adj: 'romántica',
    paletas: [P('#FBF4F2', '#F6E6E3', '#4A2D37', '#86656E', '#C46F7E', '#6F8B68', '#D9A75A', '#B25E6E')],
    fNames: ['Pinyon Script', 'Great Vibes'], fTitle: 'Pinyon Script', fBody: 'Cormorant Garamond',
    portadas: ['centrada', 'arco'], ornamento: 'flores', simbolos: '♡', textura: 'papel', fotoFiltro: 'calida', radius: 'redondo',
    kickers: ['Nos casamos', 'Para siempre empieza aquí'],
    frase: 'Queremos compartir con vosotros el día más bonito de nuestra vida.',
  },
  {
    id: 'deporte', tipo: 'tema', claves: /futbol|deport|correr|running|montana|escalad|surf|ski|bici|padel|tenis/,
    nombre: 'Gran final', adj: 'campeona',
    paletas: [P('#F6F5F0', '#E9ECE4', '#1F2A24', '#5A665E', '#2F6B4A', '#E0874F', '#C9A24B', '#1F4A33')],
    fNames: ['Kaushan Script', 'Satisfy'], fTitle: 'Josefin Sans', fBody: 'Montserrat',
    portadas: ['dividida', 'centrada'], ornamento: 'linea', simbolos: '✦', textura: 'rayas', fotoFiltro: 'natural', radius: 'suave',
    kickers: ['Fichamos para siempre', 'La mejor jugada: nos casamos'],
    frase: 'Venid con zapatillas para la pista de baile: aquí no se descansa.',
  },
]

/* ─── colores escritos ─── */
const COLORES: [RegExp, string][] = [
  [/burdeos|granate|vino tinto/, '#7B2230'], [/fucsia/, '#C2185B'], [/rojo/, '#B23A3A'],
  [/rosa palo|rosa empolvado/, '#D9A5AE'], [/rosa/, '#C9718A'], [/coral/, '#E07A5F'], [/naranja/, '#E07A3F'],
  [/terracota|teja/, '#B5653F'], [/mostaza/, '#C99A2E'], [/amarill/, '#E3B23C'], [/dorad|oro\b/, '#C9A24B'],
  [/salvia/, '#8E9C78'], [/oliva/, '#7C8748'], [/esmeralda/, '#1F6E5A'], [/verde/, '#4F7A55'],
  [/turquesa/, '#2A9D8F'], [/celeste|azul cielo/, '#7FB3D5'], [/marino/, '#1F3A5F'], [/cobalto|azulon/, '#2B4C9B'], [/azul/, '#2D5F9A'],
  [/lavanda|lila/, '#8C7BB0'], [/morado|violeta|purpura/, '#5E3C8C'], [/plata|plateado/, '#8C96A0'],
  [/marron|chocolate|cafe con leche/, '#7A5235'], [/negro/, '#1C1C1C'],
]

function normalizar(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Busca los motivos en el orden en que aparecen en el texto */
function encontrar(texto: string): Motivo[] {
  return MOTIVOS
    .map(m => ({ m, i: texto.search(m.claves) }))
    .filter(x => x.i >= 0)
    .sort((a, b) => a.i - b.i)
    .map(x => x.m)
}

function colores(texto: string): string[] {
  const hallados: { c: string; i: number }[] = []
  let resto = texto
  for (const [re, c] of COLORES) {
    const m = re.exec(resto)
    if (m) {
      hallados.push({ c, i: m.index })
      resto = resto.slice(0, m.index) + ' '.repeat(m[0].length) + resto.slice(m.index + m[0].length)
    }
  }
  return hallados.sort((a, b) => a.i - b.i).map(x => x.c)
}

const elegir = <T,>(lista: T[], n: number): T => lista[((n % lista.length) + lista.length) % lista.length]

const CLASICO: Motivo = {
  id: 'clasico', tipo: 'tema', claves: /$^/, nombre: 'Clásica', adj: 'clásica',
  paletas: [P('#FBF8F3', '#F2ECE2', '#2E2925', '#6B625A', '#B08A4E', '#8E9C78', '#D9C29A', '#8E6C3A'),
    P('#F7F6F2', '#ECEEEA', '#24302A', '#5D6A62', '#4F7A55', '#B08A4E', '#D9C29A', '#3E5E4A')],
  fNames: ['Great Vibes', 'Pinyon Script'], fTitle: 'Cormorant Garamond', fBody: 'Cormorant Garamond',
  portadas: ['centrada', 'arco'], ornamento: 'linea', simbolos: '✦', textura: 'papel', fotoFiltro: 'natural', radius: 'suave',
  kickers: ['Nos casamos'], frase: '',
}

/**
 * Compone la plantilla. `version` cambia la combinación (otra paleta, otra portada, otra letra…).
 */
export function crearPlantillaLocal(prompt: string, version = 0): { tema: TemaIA; entendido: string[] } {
  const texto = normalizar(prompt)
  const hallados = encontrar(texto)
  const estacion = hallados.find(m => m.tipo === 'estacion')
  const temas = hallados.filter(m => m.tipo === 'tema')
  const principal = temas[0] || estacion || CLASICO
  const segundo = temas[1] || (temas[0] && estacion) || undefined

  // La estación manda en la luz y los colores; el tema, en el carácter (letras, portada, adornos)
  const fuentePaleta = estacion && temas.length ? estacion : principal
  const pal = { ...elegir(fuentePaleta.paletas, version) }
  // De otro motivo se toman los colores de su versión clara u oscura, según el fondo elegido
  const claro = (hex: string) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16) > 384
  const afin = (m: Motivo) => m.paletas.find(p => claro(p.paper) === claro(pal.paper)) || m.paletas[0]
  if (estacion && temas[0]) {
    const pt = afin(temas[0])
    pal.accent = pt.accent
    pal.title = pt.title
    pal.btnBg = pt.btnBg
    pal.accent3 = pt.accent3
  }
  if (segundo && segundo !== fuentePaleta) pal.accent2 = afin(segundo).accent

  // Colores que han escrito: el primero es el acento, el segundo el adorno
  const cols = colores(texto)
  if (cols[0]) { pal.accent = cols[0]; pal.title = cols[0]; pal.btnBg = cols[0] }
  if (cols[1]) pal.accent2 = cols[1]

  const conAdorno = hallados.find(m => m.ornamentoPropio) || principal
  const simbolos = [principal, ...temas.slice(1), estacion].filter(Boolean).map(m => m!.simbolos)
  const sim = Array.from(new Set(simbolos.flatMap(x => Array.from(x)))).slice(0, 3).join('')

  // Nombre: «Primavera galáctica», «Galaxia con huellas»…
  const base = estacion && temas[0] ? estacion : principal
  const adjs = estacion ? temas.slice(0, 2).reverse().map(t => t.adj) : segundo ? [segundo.adj] : []
  const nombre = principal === CLASICO && !estacion ? 'Vuestra plantilla' : [base.nombre, ...adjs].join(' ')

  const frases = [...temas.slice(0, 2), estacion].filter(Boolean).slice(0, 2).map(m => m!.frase).filter(Boolean)
  const mensaje = ['Nos haría muchísima ilusión que estuvierais con nosotros ese día.', ...frases, 'Sin vosotros no sería lo mismo.'].join(' ')

  const raw = {
    nombre,
    ...pal,
    btnFg: '',
    fNames: elegir(principal.fNames, version),
    fTitle: principal.fTitle,
    fBody: principal.fBody,
    radius: principal.radius,
    portada: elegir(principal.portadas, version),
    ornamento: conAdorno.ornamento,
    simbolos: conAdorno.ornamento === 'simbolos' ? conAdorno.simbolos : sim,
    // Un tema con textura propia (estrellas, rayas) la aporta aunque no sea el principal
    textura: temas.find(t => t.textura === 'estrellas')?.textura
      || (principal.textura === 'lisa' && fuentePaleta !== principal ? fuentePaleta.textura : principal.textura),
    fotoFiltro: fuentePaleta.fotoFiltro,
    kicker: elegir(temas[0]?.kickers || base.kickers, version),
    saludo: 'Querida familia, queridos amigos:',
    mensaje,
  }
  const tema = limpiarTemaIA(raw, prompt)
  return { tema, entendido: hallados.map(m => m.nombre) }
}
