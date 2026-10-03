/* Plantillas de tarjetas de mesa (seating).
   Todo se dibuja en un lienzo lógico de 1000 × 1414 (proporción A5) con un aleatorio
   con semilla, así la miniatura y el PDF salen idénticos. */

export type Ctx = CanvasRenderingContext2D
export const W = 1000
export const H = 1414

export type Plantilla = {
  id: string
  nombre: string
  fondo: string
  tituloColor: string
  textoColor: string
  acento: string
  fTitulo: string
  pesoTitulo: number
  italicaTitulo?: boolean
  escalaTitulo: number
  fTexto: string
  pesoTexto: number
  italicaTexto?: boolean
  linea?: boolean
  zona: { tituloY: number; top: number; bottom: number; ancho: number }
  decorar: (ctx: Ctx) => void
}

export const FUENTES_URL = 'https://fonts.googleapis.com/css2?' + [
  'family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400',
  'family=Marcellus', 'family=Lora:wght@400', 'family=Great+Vibes', 'family=EB+Garamond:wght@400',
  'family=Pinyon+Script', 'family=Poiret+One', 'family=Josefin+Sans:wght@300;400',
  'family=Playfair+Display:ital,wght@1,400', 'family=Montserrat:wght@300;400',
  'family=Italiana', 'family=Parisienne',
].join('&') + '&display=swap'

/* ═══ utilidades ═══ */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type P = { x: number; y: number }
function bez(a: P, b: P, c: P, d: P, t: number): P {
  const u = 1 - t
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  }
}
function bezAng(a: P, b: P, c: P, d: P, t: number): number {
  const u = 1 - t
  const dx = 3 * u * u * (b.x - a.x) + 6 * u * t * (c.x - b.x) + 3 * t * t * (d.x - c.x)
  const dy = 3 * u * u * (b.y - a.y) + 6 * u * t * (c.y - b.y) + 3 * t * t * (d.y - c.y)
  return Math.atan2(dy, dx)
}
const elegir = <T,>(r: () => number, l: T[]) => l[Math.floor(r() * l.length)]

function tallo(ctx: Ctx, a: P, b: P, c: P, d: P, color: string, grosor: number) {
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = grosor; ctx.lineCap = 'round'; ctx.globalAlpha = 0.8
  ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.bezierCurveTo(b.x, b.y, c.x, c.y, d.x, d.y); ctx.stroke()
  ctx.restore()
}

// Hoja alargada con efecto acuarela (varias capas transparentes)
function hojaLarga(ctx: Ctx, x: number, y: number, largo: number, ancho: number, ang: number, c1: string, c2: string, alfa = 0.8) {
  ctx.save()
  ctx.translate(x, y); ctx.rotate(ang)
  for (let k = 0; k < 3; k++) {
    const e = 1 + k * 0.05
    const g = ctx.createLinearGradient(0, 0, largo, 0)
    g.addColorStop(0, c2); g.addColorStop(0.6, c1); g.addColorStop(1, c1)
    ctx.fillStyle = g
    ctx.globalAlpha = alfa * (k === 0 ? 0.6 : 0.28)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(largo * 0.45 * e, -ancho * e, largo * e, 0)
    ctx.quadraticCurveTo(largo * 0.5 * e, ancho * 0.9 * e, 0, 0)
    ctx.fill()
  }
  ctx.globalAlpha = alfa * 0.35; ctx.strokeStyle = c2; ctx.lineWidth = 1.4
  ctx.beginPath(); ctx.moveTo(largo * 0.06, 0); ctx.quadraticCurveTo(largo * 0.5, -ancho * 0.12, largo * 0.92, 0); ctx.stroke()
  ctx.restore()
}

// Hoja redonda de eucalipto
function hojaRedonda(ctx: Ctx, x: number, y: number, r: number, ang: number, c1: string, c2: string, alfa = 0.8) {
  ctx.save()
  ctx.translate(x, y); ctx.rotate(ang)
  for (let k = 0; k < 2; k++) {
    const g = ctx.createRadialGradient(r * 0.3, -r * 0.2, r * 0.1, r * 0.6, 0, r * 1.15)
    g.addColorStop(0, c1); g.addColorStop(1, c2)
    ctx.fillStyle = g
    ctx.globalAlpha = alfa * (k === 0 ? 0.65 : 0.3)
    ctx.beginPath(); ctx.ellipse(r * (0.9 + k * 0.04), 0, r * (1 + k * 0.05), r * (0.82 + k * 0.05), 0, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = alfa * 0.25; ctx.strokeStyle = c2; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.7, 0); ctx.stroke()
  ctx.restore()
}

// Rama: tallo + hojas a ambos lados
function rama(ctx: Ctx, pts: [P, P, P, P], n: number, color: string, grosor: number,
  hoja: (x: number, y: number, ang: number, i: number, lado: number) => void, desde = 0.08) {
  tallo(ctx, ...pts, color, grosor)
  for (let i = 0; i < n; i++) {
    const t = desde + (1 - desde) * (i / Math.max(n - 1, 1))
    const p = bez(...pts, t)
    const a = bezAng(...pts, t)
    const lado = i % 2 === 0 ? 1 : -1
    hoja(p.x, p.y, a, i, lado)
  }
}

// Mancha de acuarela de fondo
function mancha(ctx: Ctx, x: number, y: number, r: number, color: string, alfa: number, rand: () => number) {
  ctx.save()
  for (let i = 0; i < 9; i++) {
    const cx = x + (rand() - 0.5) * r * 0.9, cy = y + (rand() - 0.5) * r * 0.7
    const rr = r * (0.35 + rand() * 0.45)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr)
    g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.globalAlpha = alfa * (0.35 + rand() * 0.4)
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

// Motitas doradas
function purpurina(ctx: Ctx, cx: number, cy: number, dx: number, dy: number, n: number, rand: () => number, oro = ['#F0D68A', '#C9A04A', '#B5872E']) {
  ctx.save()
  for (let i = 0; i < n; i++) {
    const x = cx + (rand() + rand() + rand() - 1.5) * dx
    const y = cy + (rand() + rand() + rand() - 1.5) * dy
    const r = rand() < 0.15 ? 4 + rand() * 6 : 1.2 + rand() * 3
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
    g.addColorStop(0, oro[0]); g.addColorStop(0.6, oro[1]); g.addColorStop(1, oro[2])
    ctx.fillStyle = g
    ctx.globalAlpha = 0.75 + rand() * 0.25
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (0.7 + rand() * 0.3), rand() * Math.PI, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function flor5(ctx: Ctx, x: number, y: number, r: number, petalo: string, centro: string, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5)
    ctx.globalAlpha = 0.85; ctx.fillStyle = petalo
    ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.42, r * 0.6, 0, 0, Math.PI * 2); ctx.fill()
    ctx.globalAlpha = 0.25; ctx.strokeStyle = '#C8B8A0'; ctx.lineWidth = 1; ctx.stroke()
  }
  ctx.globalAlpha = 1; ctx.fillStyle = centro
  ctx.beginPath(); ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function peonia(ctx: Ctx, x: number, y: number, r: number, cols: string[], rand: () => number) {
  ctx.save(); ctx.translate(x, y)
  // halo de acuarela
  const halo = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.15)
  halo.addColorStop(0, cols[1]); halo.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.globalAlpha = 0.35; ctx.fillStyle = halo
  ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2); ctx.fill()
  // pétalos de fuera hacia dentro, cada uno con forma de cuchara y borde ondulado
  const capas = 6
  for (let capa = 0; capa < capas; capa++) {
    const n = 11 - capa
    const rad = r * (1 - capa * 0.15)
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + capa * 0.7 + (rand() - 0.5) * 0.5
      const k = 0.8 + rand() * 0.4
      ctx.save(); ctx.rotate(a)
      const largo = rad * 0.75 * k, ancho = rad * 0.42 * k
      const g = ctx.createLinearGradient(0, 0, 0, largo)
      g.addColorStop(0, cols[Math.min(cols.length - 1, capa + 2)])
      g.addColorStop(1, cols[Math.max(0, Math.min(cols.length - 1, capa - 1))])
      ctx.fillStyle = g; ctx.globalAlpha = 0.42 + capa * 0.06
      ctx.beginPath()
      ctx.moveTo(0, rad * 0.08)
      ctx.bezierCurveTo(-ancho, largo * 0.35, -ancho * 0.9, largo * 0.95, -ancho * 0.3, largo)
      ctx.quadraticCurveTo(0, largo * (0.9 + rand() * 0.15), ancho * 0.3, largo)
      ctx.bezierCurveTo(ancho * 0.9, largo * 0.95, ancho, largo * 0.35, 0, rad * 0.08)
      ctx.fill()
      ctx.globalAlpha = 0.18; ctx.strokeStyle = '#B35F72'; ctx.lineWidth = 1.1; ctx.stroke()
      ctx.restore()
    }
  }
  for (let i = 0; i < 10; i++) {
    ctx.globalAlpha = 0.9; ctx.fillStyle = i % 3 ? '#E8C873' : '#C99A3E'
    ctx.beginPath(); ctx.arc((rand() - 0.5) * r * 0.2, (rand() - 0.5) * r * 0.2, 2 + rand() * 2.5, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
}

function espigaLavanda(ctx: Ctx, x: number, y: number, largo: number, ang: number, rand: () => number) {
  const cols = ['#9C88C9', '#7E68B3', '#B7A8DD', '#6A5A9E']
  const a: P = { x, y }
  const d: P = { x: x + Math.cos(ang) * largo, y: y + Math.sin(ang) * largo }
  const curva = (rand() - 0.5) * 60
  const b: P = { x: x + Math.cos(ang) * largo * 0.35 + curva, y: y + Math.sin(ang) * largo * 0.35 }
  const c: P = { x: x + Math.cos(ang) * largo * 0.7 + curva * 0.6, y: y + Math.sin(ang) * largo * 0.7 }
  tallo(ctx, a, b, c, d, '#8DA27A', 2.4)
  for (let i = 0; i < 15; i++) {
    const t = 0.52 + (i / 14) * 0.48
    const p = bez(a, b, c, d, t), an = bezAng(a, b, c, d, t)
    const tam = 1 - (t - 0.52) * 0.9
    for (const lado of [-1, 1]) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(an + lado * 0.45)
      ctx.globalAlpha = 0.7; ctx.fillStyle = elegir(rand, cols)
      ctx.beginPath(); ctx.ellipse(9 * tam, 0, 10 * tam, 6.5 * tam, 0, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
  }
}

function limon(ctx: Ctx, x: number, y: number, L: number, ang: number) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang)
  const g = ctx.createRadialGradient(-L * 0.15, -L * 0.14, L * 0.04, 0, 0, L * 0.55)
  g.addColorStop(0, '#FFF3AE'); g.addColorStop(0.45, '#F4D24A'); g.addColorStop(1, '#D9A520')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.ellipse(0, 0, L / 2, L * 0.35, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(L / 2, 0, L * 0.07, L * 0.06, 0, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse(-L / 2, 0, L * 0.05, L * 0.05, 0, 0, Math.PI * 2); ctx.fill()
  ctx.globalAlpha = 0.35; ctx.fillStyle = '#FFFFFF'
  ctx.beginPath(); ctx.ellipse(-L * 0.14, -L * 0.15, L * 0.12, L * 0.05, -0.3, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function plumero(ctx: Ctx, x: number, y: number, largo: number, ang: number, rand: () => number) {
  const a: P = { x, y }
  const d: P = { x: x + Math.cos(ang) * largo, y: y + Math.sin(ang) * largo }
  const b: P = { x: x + Math.cos(ang) * largo * 0.35 + 25, y: y + Math.sin(ang) * largo * 0.35 }
  const c: P = { x: x + Math.cos(ang) * largo * 0.7 + 30, y: y + Math.sin(ang) * largo * 0.7 }
  tallo(ctx, a, b, c, d, '#B79B76', 2.2)
  ctx.save(); ctx.lineCap = 'round'
  for (let i = 0; i < 120; i++) {
    const t = 0.42 + rand() * 0.58
    const p = bez(a, b, c, d, t), an = bezAng(a, b, c, d, t)
    const lado = rand() < 0.5 ? -1 : 1
    const l = (28 + rand() * 46) * (1.15 - t * 0.7)
    const aa = an + lado * (0.35 + rand() * 0.7) - 0.25
    ctx.strokeStyle = rand() < 0.5 ? '#DCC8A8' : '#C9AE88'
    ctx.globalAlpha = 0.45 + rand() * 0.3; ctx.lineWidth = 1.6 + rand() * 1.4
    ctx.beginPath(); ctx.moveTo(p.x, p.y)
    ctx.quadraticCurveTo(p.x + Math.cos(aa) * l * 0.5 + 6, p.y + Math.sin(aa) * l * 0.5, p.x + Math.cos(aa) * l, p.y + Math.sin(aa) * l)
    ctx.stroke()
  }
  ctx.restore()
}

function marco(ctx: Ctx, color: string, ins = 50, doble = true, grosor = 2) {
  ctx.save()
  ctx.strokeStyle = color; ctx.lineWidth = grosor
  ctx.strokeRect(ins, ins, W - ins * 2, H - ins * 2)
  if (doble) { ctx.globalAlpha = 0.5; ctx.lineWidth = 1; ctx.strokeRect(ins + 13, ins + 13, W - (ins + 13) * 2, H - (ins + 13) * 2) }
  ctx.restore()
}

/* ═══ LAS 8 PLANTILLAS ═══ */
export const PLANTILLAS: Plantilla[] = [
  {
    id: 'eucalipto', nombre: 'Eucalipto', fondo: '#FFFFFF',
    tituloColor: '#3F5F57', textoColor: '#4E605B', acento: '#9DB8AE',
    fTitulo: 'Cormorant Garamond', pesoTitulo: 500, escalaTitulo: 1.05,
    fTexto: 'Cormorant Garamond', pesoTexto: 400,
    zona: { tituloY: 340, top: 430, bottom: 1240, ancho: 540 },
    decorar(ctx) {
      const r = rng(11)
      mancha(ctx, 830, 110, 300, '#BFD6CC', 0.7, r)
      mancha(ctx, 960, 40, 160, '#A9C8BC', 0.6, r)
      const verdes = [['#C3D7CF', '#7FA39A'], ['#B2CBC2', '#6E8F86'], ['#D2E1DB', '#8FB0A6']]
      rama(ctx, [{ x: -20, y: 20 }, { x: 110, y: 90 }, { x: 60, y: 280 }, { x: 150, y: 450 }], 12, '#8E9682', 3,
        (x, y, a, i, l) => { const [c1, c2] = verdes[i % 3]; hojaRedonda(ctx, x, y, 26 + r() * 18, a + l * 1.25, c1, c2) })
      rama(ctx, [{ x: 0, y: 0 }, { x: 130, y: 40 }, { x: 230, y: 30 }, { x: 330, y: 120 }], 8, '#8E9682', 2.4,
        (x, y, a, i, l) => { const [c1, c2] = verdes[(i + 1) % 3]; hojaRedonda(ctx, x, y, 18 + r() * 14, a + l * 1.3, c1, c2) })
      rama(ctx, [{ x: 70, y: -10 }, { x: 30, y: 90 }, { x: 60, y: 180 }, { x: 25, y: 300 }], 6, '#8E9682', 2,
        (x, y, a, _i, l) => hojaLarga(ctx, x, y, 70 + r() * 30, 16, a + l * 0.9, '#C8DAD3', '#7C9C93'))
      rama(ctx, [{ x: 1020, y: 1440 }, { x: 900, y: 1320 }, { x: 890, y: 1180 }, { x: 780, y: 1050 }], 12, '#8E9682', 3,
        (x, y, a, i, l) => { const [c1, c2] = verdes[i % 3]; hojaRedonda(ctx, x, y, 26 + r() * 18, a + l * 1.25, c1, c2) })
      rama(ctx, [{ x: 1010, y: 1300 }, { x: 960, y: 1220 }, { x: 980, y: 1120 }, { x: 930, y: 1020 }], 7, '#8E9682', 2.2,
        (x, y, a, _i, l) => hojaLarga(ctx, x, y, 80 + r() * 40, 18, a + l * 0.85, '#C8DAD3', '#7C9C93'))
      rama(ctx, [{ x: 860, y: 1440 }, { x: 820, y: 1380 }, { x: 760, y: 1360 }, { x: 680, y: 1330 }], 6, '#8E9682', 2,
        (x, y, a, i, l) => { const [c1, c2] = verdes[(i + 2) % 3]; hojaRedonda(ctx, x, y, 16 + r() * 10, a + l * 1.3, c1, c2) })
      purpurina(ctx, 430, 40, 110, 40, 80, r)
      purpurina(ctx, 600, 90, 50, 30, 25, r)
      purpurina(ctx, 230, 1350, 120, 40, 70, r)
      purpurina(ctx, 500, 1390, 60, 20, 20, r)
    },
  },
  {
    id: 'olivo', nombre: 'Olivo', fondo: '#FBFAF4',
    tituloColor: '#4A5530', textoColor: '#545A43', acento: '#8E9B6E',
    fTitulo: 'Marcellus', pesoTitulo: 400, escalaTitulo: 0.9,
    fTexto: 'Lora', pesoTexto: 400, linea: true,
    zona: { tituloY: 380, top: 470, bottom: 1150, ancho: 560 },
    decorar(ctx) {
      const r = rng(22)
      const hoja = (x: number, y: number, a: number, _i: number, l: number) =>
        hojaLarga(ctx, x, y, 62 + r() * 24, 12, a + l * (0.7 + r() * 0.3), '#A7B286', '#5F6B44', 0.85)
      const aceituna = (x: number, y: number) => {
        ctx.save(); const g = ctx.createRadialGradient(x - 4, y - 5, 1, x, y, 14)
        g.addColorStop(0, '#7E8550'); g.addColorStop(1, '#3E4422'); ctx.fillStyle = g; ctx.globalAlpha = 0.9
        ctx.beginPath(); ctx.ellipse(x, y, 10, 13, r(), 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
      const ramas: [P, P, P, P][] = [
        [{ x: 500, y: 190 }, { x: 390, y: 110 }, { x: 240, y: 110 }, { x: 100, y: 210 }],
        [{ x: 500, y: 190 }, { x: 610, y: 110 }, { x: 760, y: 110 }, { x: 900, y: 210 }],
        [{ x: 500, y: 1250 }, { x: 390, y: 1330 }, { x: 240, y: 1330 }, { x: 100, y: 1230 }],
        [{ x: 500, y: 1250 }, { x: 610, y: 1330 }, { x: 760, y: 1330 }, { x: 900, y: 1230 }],
      ]
      for (const pts of ramas) {
        rama(ctx, pts, 14, '#6D6A4E', 2.4, hoja, 0.12)
        for (const t of [0.35, 0.62, 0.85]) { const p = bez(...pts, t); aceituna(p.x + (r() - 0.5) * 20, p.y + 14) }
      }
    },
  },
  {
    id: 'peonias', nombre: 'Peonías', fondo: '#FFFCFA',
    tituloColor: '#B25E6E', textoColor: '#6A4B53', acento: '#E9A3AE',
    fTitulo: 'Great Vibes', pesoTitulo: 400, escalaTitulo: 1.25,
    fTexto: 'EB Garamond', pesoTexto: 400,
    zona: { tituloY: 380, top: 470, bottom: 1150, ancho: 540 },
    decorar(ctx) {
      const r = rng(33)
      const rosas = ['#F7DDE0', '#F2C6CC', '#E9A3AE', '#D98595', '#C96F82']
      mancha(ctx, 150, 120, 320, '#F6D3D8', 0.6, r)
      mancha(ctx, 860, 1300, 340, '#F6D3D8', 0.6, r)
      const verde = (x: number, y: number, a: number) => hojaLarga(ctx, x, y, 120 + r() * 50, 30, a, '#B3C5A6', '#6F8B68', 0.8)
      for (const [x, y, a] of [[200, 170, 0.6], [80, 260, 1.3], [310, 120, 0.1], [40, 120, 1.9], [240, 40, -0.2], [150, 300, 1.0]]) verde(x, y, a)
      for (const [x, y, a] of [[800, 1250, 3.7], [920, 1150, 4.4], [690, 1320, 3.3], [960, 1330, 4.9], [760, 1400, 3.0], [860, 1120, 4.1]]) verde(x, y, a)
      peonia(ctx, 120, 110, 125, rosas, r); peonia(ctx, 300, 50, 78, rosas, r); peonia(ctx, 55, 320, 48, rosas, r)
      peonia(ctx, 880, 1300, 135, rosas, r); peonia(ctx, 700, 1370, 82, rosas, r); peonia(ctx, 965, 1100, 58, rosas, r)
      purpurina(ctx, 450, 60, 80, 30, 30, r)
      purpurina(ctx, 560, 1370, 80, 30, 30, r)
    },
  },
  {
    id: 'lavanda', nombre: 'Lavanda', fondo: '#FCFBFE',
    tituloColor: '#5E4E86', textoColor: '#5A5468', acento: '#9C88C9',
    fTitulo: 'Pinyon Script', pesoTitulo: 400, escalaTitulo: 1.15,
    fTexto: 'Cormorant Garamond', pesoTexto: 500,
    zona: { tituloY: 330, top: 420, bottom: 1120, ancho: 520 },
    decorar(ctx) {
      const r = rng(44)
      mancha(ctx, 160, 1290, 300, '#E2DAF3', 0.7, r)
      mancha(ctx, 850, 1290, 300, '#E2DAF3', 0.7, r)
      mancha(ctx, 900, 80, 220, '#ECE6F7', 0.6, r)
      for (let i = 0; i < 7; i++) espigaLavanda(ctx, 130 + r() * 30, 1450, 380 + r() * 160, (-100 + i * 8) * Math.PI / 180, r)
      for (let i = 0; i < 7; i++) espigaLavanda(ctx, 860 + r() * 30, 1450, 380 + r() * 160, (-80 - i * 8) * Math.PI / 180, r)
      for (let i = 0; i < 4; i++) espigaLavanda(ctx, 1010, -20 + i * 10, 230 + r() * 80, (115 + i * 12) * Math.PI / 180, r)
    },
  },
  {
    id: 'noche', nombre: 'Noche dorada', fondo: '#0F2925',
    tituloColor: '#E6D4A6', textoColor: '#EEE5D0', acento: '#CDB27A',
    fTitulo: 'Poiret One', pesoTitulo: 400, escalaTitulo: 0.95,
    fTexto: 'Josefin Sans', pesoTexto: 300, linea: true,
    zona: { tituloY: 400, top: 490, bottom: 1200, ancho: 560 },
    decorar(ctx) {
      const r = rng(55)
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.45, 800)
      g.addColorStop(0, '#173D36'); g.addColorStop(1, '#0B201C')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      marco(ctx, '#CDB27A', 48, true, 2.5)
      ctx.save(); ctx.strokeStyle = '#CDB27A'; ctx.lineWidth = 1.3; ctx.globalAlpha = 0.9
      for (const [cx, cy, sx, sy] of [[48, 48, 1, 1], [W - 48, 48, -1, 1], [48, H - 48, 1, -1], [W - 48, H - 48, -1, -1]]) {
        for (let a = 0; a <= 90; a += 15) {
          const rad = a * Math.PI / 180
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + sx * Math.cos(rad) * 95, cy + sy * Math.sin(rad) * 95); ctx.stroke()
        }
        ctx.beginPath(); ctx.arc(cx, cy, 95, sx > 0 ? (sy > 0 ? 0 : -Math.PI / 2) : (sy > 0 ? Math.PI / 2 : Math.PI), sx > 0 ? (sy > 0 ? Math.PI / 2 : 0) : (sy > 0 ? Math.PI : Math.PI * 1.5)); ctx.stroke()
      }
      for (let a = 180; a <= 360; a += 10) {
        const rad = a * Math.PI / 180
        ctx.globalAlpha = 0.55
        ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(rad) * 22, 255 + Math.sin(rad) * 22); ctx.lineTo(W / 2 + Math.cos(rad) * 70, 255 + Math.sin(rad) * 70); ctx.stroke()
      }
      ctx.restore()
      purpurina(ctx, 820, 170, 120, 70, 70, r, ['#F6E3A8', '#CDB27A', '#9E8248'])
      purpurina(ctx, 180, 1250, 120, 70, 70, r, ['#F6E3A8', '#CDB27A', '#9E8248'])
    },
  },
  {
    id: 'minimal', nombre: 'Minimal', fondo: '#FFFFFF',
    tituloColor: '#1C1C1C', textoColor: '#2E2E2E', acento: '#B8965A',
    fTitulo: 'Playfair Display', pesoTitulo: 400, italicaTitulo: true, escalaTitulo: 1,
    fTexto: 'Montserrat', pesoTexto: 300, linea: true,
    zona: { tituloY: 430, top: 530, bottom: 1240, ancho: 560 },
    decorar(ctx) {
      marco(ctx, '#1C1C1C', 62, false, 1.5)
      ctx.save(); ctx.fillStyle = '#B8965A'
      ctx.beginPath(); ctx.moveTo(W / 2, 250); ctx.lineTo(W / 2 + 9, 259); ctx.lineTo(W / 2, 268); ctx.lineTo(W / 2 - 9, 259); ctx.closePath(); ctx.fill()
      ctx.restore()
    },
  },
  {
    id: 'pampa', nombre: 'Pampa', fondo: '#F7F0E6',
    tituloColor: '#A4583C', textoColor: '#6A5444', acento: '#C27A5A',
    fTitulo: 'Italiana', pesoTitulo: 400, escalaTitulo: 0.95,
    fTexto: 'Cormorant Garamond', pesoTexto: 500,
    zona: { tituloY: 560, top: 650, bottom: 1230, ancho: 540 },
    decorar(ctx) {
      const r = rng(77)
      ctx.save(); ctx.strokeStyle = '#C27A5A'; ctx.lineWidth = 2.5
      const arco = (ins: number) => {
        ctx.beginPath(); ctx.moveTo(130 + ins, 1300 - ins); ctx.lineTo(130 + ins, 480)
        ctx.arc(W / 2, 480, W / 2 - 130 - ins, Math.PI, 0); ctx.lineTo(W - 130 - ins, 1300 - ins); ctx.closePath(); ctx.stroke()
      }
      arco(0); ctx.globalAlpha = 0.45; ctx.lineWidth = 1; arco(14); ctx.restore()
      for (const [x, y, a] of [[90, 1450, -1.2], [60, 1450, -1.0], [170, 1450, -1.45]]) plumero(ctx, x, y, 560 + r() * 120, a, r)
      for (const [x, y, a] of [[900, 1450, -1.85], [960, 1450, -2.1]]) plumero(ctx, x, y, 520 + r() * 100, a, r)
      for (const [x, y, a] of [[60, 1430, -1.3], [120, 1440, -1.0], [940, 1440, -2.0], [880, 1440, -1.75]])
        hojaLarga(ctx, x, y, 260 + r() * 80, 20, a, '#D08A69', '#A65E40', 0.75)
      for (const [x, y, a] of [[960, -10, 2.2], [1000, 60, 2.6]]) plumero(ctx, x, y, 300, a, r)
    },
  },
  {
    id: 'limones', nombre: 'Limones', fondo: '#FFFFFF',
    tituloColor: '#24508E', textoColor: '#2E4A72', acento: '#24508E',
    fTitulo: 'Parisienne', pesoTitulo: 400, escalaTitulo: 1.15,
    fTexto: 'EB Garamond', pesoTexto: 400,
    zona: { tituloY: 400, top: 490, bottom: 1140, ancho: 540 },
    decorar(ctx) {
      const r = rng(88)
      marco(ctx, '#24508E', 44, true, 2)
      const hoja = (x: number, y: number, a: number, _i: number, l: number) =>
        hojaLarga(ctx, x, y, 90 + r() * 40, 26, a + l * 0.8, '#7DAA5A', '#3F6A2E', 0.9)
      rama(ctx, [{ x: 1010, y: -10 }, { x: 930, y: 80 }, { x: 860, y: 140 }, { x: 700, y: 240 }], 9, '#5E5A3A', 3.5, hoja)
      rama(ctx, [{ x: 1010, y: 160 }, { x: 960, y: 220 }, { x: 940, y: 300 }, { x: 880, y: 380 }], 5, '#5E5A3A', 2.5, hoja)
      limon(ctx, 860, 190, 125, 0.9); limon(ctx, 950, 95, 108, 1.3); limon(ctx, 760, 270, 92, 0.5)
      flor5(ctx, 700, 150, 18, '#FFFFFF', '#E8C34A', 0.3); flor5(ctx, 640, 210, 13, '#FFFFFF', '#E8C34A', 1)
      rama(ctx, [{ x: -10, y: 1424 }, { x: 70, y: 1330 }, { x: 140, y: 1270 }, { x: 300, y: 1170 }], 9, '#5E5A3A', 3.5, hoja)
      rama(ctx, [{ x: -10, y: 1250 }, { x: 40, y: 1190 }, { x: 60, y: 1110 }, { x: 120, y: 1030 }], 5, '#5E5A3A', 2.5, hoja)
      limon(ctx, 140, 1225, 125, -2.3); limon(ctx, 50, 1320, 108, -1.9); limon(ctx, 240, 1145, 92, -2.6)
      flor5(ctx, 300, 1260, 18, '#FFFFFF', '#E8C34A', 0.6); flor5(ctx, 360, 1200, 13, '#FFFFFF', '#E8C34A', 1.4)
    },
  },
]
