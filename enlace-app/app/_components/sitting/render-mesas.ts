import type { BodaData } from '@/lib/types'
import { FUENTES_URL, PLANTILLAS, W, H, type Ctx, type Plantilla } from './plantillas'

/* Tarjetas de mesa: una por mesa, tamaño A5 vertical.
   Se dibujan en canvas y se guardan en un PDF sin librerías externas. */

export type MesaTarjeta = { num: number; nombre: string; invitados: string[] }

export function mesasConInvitados(data: BodaData, conApellido: boolean): MesaTarjeta[] {
  return data.mesas
    .map((m, i) => ({
      num: i + 1,
      nombre: m.nombre || '',
      invitados: data.guests
        .filter(g => g.mesaId === m.id)
        .map(g => (conApellido ? `${g.nombre} ${g.apellido || ''}` : g.nombre).trim())
        .filter(Boolean),
    }))
    .filter(m => m.invitados.length > 0)
}

/* ─── tipografías ─── */
let fuentesListas: Promise<void> | null = null
export function cargarFuentes(): Promise<void> {
  if (fuentesListas) return fuentesListas
  fuentesListas = (async () => {
    if (!document.querySelector('link[data-sitting-fuentes]')) {
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = FUENTES_URL
      l.dataset.sittingFuentes = '1'
      document.head.appendChild(l)
      await new Promise(r => { l.onload = r; l.onerror = r; setTimeout(r, 5000) })
    }
    const pedidas = new Set<string>()
    for (const p of PLANTILLAS) {
      pedidas.add(`${p.italicaTitulo ? 'italic ' : ''}${p.pesoTitulo} 80px "${p.fTitulo}"`)
      pedidas.add(`${p.italicaTexto ? 'italic ' : ''}${p.pesoTexto} 36px "${p.fTexto}"`)
    }
    await Promise.all([...pedidas].map(f => document.fonts.load(f).catch(() => undefined)))
  })()
  return fuentesListas
}

const fuente = (fam: string, px: number, peso: number, italica?: boolean) =>
  `${italica ? 'italic ' : ''}${peso} ${Math.round(px)}px "${fam}", Georgia, serif`

function encajar(ctx: Ctx, texto: string, maxW: number, fam: string, px: number, peso: number, italica?: boolean, min = 14) {
  let s = px
  ctx.font = fuente(fam, s, peso, italica)
  while (s > min && ctx.measureText(texto).width > maxW) {
    s -= 1
    ctx.font = fuente(fam, s, peso, italica)
  }
}

/* ─── una tarjeta ─── */
export function pintarTarjeta(ctx: Ctx, p: Plantilla, mesa: MesaTarjeta, escala: number) {
  ctx.save()
  ctx.scale(escala, escala)
  ctx.fillStyle = p.fondo
  ctx.fillRect(0, 0, W, H)
  p.decorar(ctx)

  const z = p.zona
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.globalAlpha = 1

  const propio = mesa.nombre.trim() && !/^mesa\s*\d+$/i.test(mesa.nombre.trim())
  const titulo = propio ? mesa.nombre.trim() : `Mesa ${mesa.num}`

  if (propio) {
    ctx.fillStyle = p.textoColor
    ctx.globalAlpha = 0.75
    ctx.font = fuente(p.fTexto, 30, p.pesoTexto, p.italicaTexto)
    ctx.fillText(`Mesa ${mesa.num}`, W / 2, z.tituloY - 100 * p.escalaTitulo)
    ctx.globalAlpha = 1
  }

  ctx.fillStyle = p.tituloColor
  encajar(ctx, titulo, z.ancho + 140, p.fTitulo, 92 * p.escalaTitulo, p.pesoTitulo, p.italicaTitulo, 40)
  ctx.fillText(titulo, W / 2, z.tituloY)

  if (p.linea) {
    ctx.strokeStyle = p.acento
    ctx.lineWidth = 1.6
    ctx.globalAlpha = 0.8
    ctx.beginPath(); ctx.moveTo(W / 2 - 45, z.tituloY + 38); ctx.lineTo(W / 2 + 45, z.tituloY + 38); ctx.stroke()
    ctx.globalAlpha = 1
  }

  const n = mesa.invitados.length
  const alto = z.bottom - z.top
  const lineaH = Math.min(80, alto / Math.max(n, 1))
  const tam = Math.min(42, lineaH * 0.6)
  ctx.fillStyle = p.textoColor
  mesa.invitados.forEach((nom, i) => {
    encajar(ctx, nom, z.ancho, p.fTexto, tam, p.pesoTexto, p.italicaTexto, 16)
    ctx.fillText(nom, W / 2, z.top + lineaH * (i + 0.72))
  })
  ctx.restore()
}

export function lienzo(anchoPx: number): { c: HTMLCanvasElement; ctx: Ctx; escala: number } {
  const c = document.createElement('canvas')
  c.width = Math.round(anchoPx)
  c.height = Math.round((anchoPx * H) / W)
  return { c, ctx: c.getContext('2d') as Ctx, escala: anchoPx / W }
}

export async function imagenTarjeta(p: Plantilla, mesa: MesaTarjeta, anchoPx: number): Promise<string> {
  await cargarFuentes()
  const { c, ctx, escala } = lienzo(anchoPx)
  pintarTarjeta(ctx, p, mesa, escala)
  return c.toDataURL('image/jpeg', 0.88)
}

/* ─── PDF: una página A5 por mesa (200 ppp) ─── */
async function aJpeg(c: HTMLCanvasElement): Promise<Uint8Array> {
  const blob = await new Promise<Blob>((ok, ko) => c.toBlob(b => (b ? ok(b) : ko(new Error('jpeg'))), 'image/jpeg', 0.9))
  return new Uint8Array(await blob.arrayBuffer())
}

export async function pdfTarjetas(p: Plantilla, mesas: MesaTarjeta[]): Promise<Blob> {
  await cargarFuentes()
  const enc = new TextEncoder()
  const partes: Uint8Array[] = []
  const offsets: number[] = []
  let pos = 0
  const push = (x: Uint8Array | string) => {
    const b = typeof x === 'string' ? enc.encode(x) : x
    partes.push(b); pos += b.length
  }
  const PW = 419.53, PH = 595.28 // A5 vertical en puntos
  const n = mesas.length
  const total = 2 + n * 3
  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')
  offsets[1] = pos; push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')
  offsets[2] = pos; push(`2 0 obj\n<< /Type /Pages /Kids [${mesas.map((_, i) => `${3 + i * 3} 0 R`).join(' ')}] /Count ${n} >>\nendobj\n`)
  for (let i = 0; i < n; i++) {
    const { c, ctx, escala } = lienzo(1166)
    pintarTarjeta(ctx, p, mesas[i], escala)
    const jpg = await aJpeg(c)
    const pId = 3 + i * 3, imgId = pId + 1, cntId = pId + 2
    offsets[pId] = pos
    push(`${pId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PW} ${PH}] /Resources << /XObject << /Im0 ${imgId} 0 R >> >> /Contents ${cntId} 0 R >>\nendobj\n`)
    offsets[imgId] = pos
    push(`${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${c.width} /Height ${c.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.length} >>\nstream\n`)
    push(jpg)
    push('\nendstream\nendobj\n')
    const contenido = `q ${PW} 0 0 ${PH} 0 0 cm /Im0 Do Q`
    offsets[cntId] = pos
    push(`${cntId} 0 obj\n<< /Length ${contenido.length} >>\nstream\n${contenido}\nendstream\nendobj\n`)
  }
  const xref = pos
  let tabla = `xref\n0 ${total + 1}\n0000000000 65535 f \n`
  for (let i = 1; i <= total; i++) tabla += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  push(tabla)
  push(`trailer\n<< /Size ${total + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`)
  return new Blob(partes as BlobPart[], { type: 'application/pdf' })
}
