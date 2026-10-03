import type { Mesa } from './types'

/* Geometría de las mesas del plano: tamaño total, tablero y posición de cada asiento.
   La usan el plano interactivo y el PDF descargable. */

export const SEAT_R = 7     // radio del asiento
const SEAT_GAP = 9   // separación entre mesa y asiento
const PAD = SEAT_R * 2 + SEAT_GAP

export type Punto = { x: number; y: number }

/* ═══ GEOMETRÍA DE CADA MESA ═══
   Devuelve el tamaño total (con asientos), el tablero y la posición de cada asiento */
export function geometria(m: Mesa) {
  const cap = Math.max(0, m.cap || 0)

  if (m.shape === 'round') {
    const tableR = Math.max(46, Math.min(80, 30 + cap * 3))
    const orbit = tableR + SEAT_GAP + SEAT_R
    const size = 2 * (orbit + SEAT_R + 2)
    const c = size / 2
    const seats: Punto[] = Array.from({ length: cap }, (_, i) => {
      const a = (i / Math.max(cap, 1)) * 2 * Math.PI - Math.PI / 2
      return { x: c + orbit * Math.cos(a), y: c + orbit * Math.sin(a) }
    })
    return { w: size, h: size, table: { x: c - tableR, y: c - tableR, w: tableR * 2, h: tableR * 2 }, seats }
  }

  if (m.shape === 'square') {
    // Asientos repartidos por los cuatro lados
    const lados = [0, 1, 2, 3].map(i => Math.floor(cap / 4) + (i < cap % 4 ? 1 : 0))
    const maxLado = Math.max(...lados, 1)
    const side = Math.max(96, maxLado * 30 + 20)
    const tx = PAD, ty = PAD
    const seats: Punto[] = []
    lados.forEach((n, lado) => {
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / (n + 1)
        if (lado === 0) seats.push({ x: tx + side * t, y: ty - SEAT_GAP - SEAT_R })
        if (lado === 1) seats.push({ x: tx + side + SEAT_GAP + SEAT_R, y: ty + side * t })
        if (lado === 2) seats.push({ x: tx + side * (1 - t), y: ty + side + SEAT_GAP + SEAT_R })
        if (lado === 3) seats.push({ x: tx - SEAT_GAP - SEAT_R, y: ty + side * (1 - t) })
      }
    })
    return { w: side + PAD * 2, h: side + PAD * 2, table: { x: tx, y: ty, w: side, h: side }, seats }
  }

  // Rectangular: asientos en los lados largos y, si son muchos, uno en cada cabecera
  const cabeceras = cap >= 10 ? 2 : 0
  const enLados = cap - cabeceras
  const arriba = Math.ceil(enLados / 2), abajo = enLados - arriba
  const largo = Math.max(140, arriba * 30 + 20)
  const ancho = 78
  const vertical = m.rot === 90
  const w = vertical ? ancho : largo
  const h = vertical ? largo : ancho
  const tx = PAD, ty = PAD
  const seats: Punto[] = []
  const lado = (n: number, primero: boolean) => {
    for (let i = 0; i < n; i++) {
      const t = (i + 1) / (n + 1)
      if (!vertical) seats.push({ x: tx + largo * t, y: primero ? ty - SEAT_GAP - SEAT_R : ty + ancho + SEAT_GAP + SEAT_R })
      else seats.push({ x: primero ? tx + ancho + SEAT_GAP + SEAT_R : tx - SEAT_GAP - SEAT_R, y: ty + largo * t })
    }
  }
  lado(arriba, true)
  lado(abajo, false)
  if (cabeceras) {
    if (!vertical) {
      seats.push({ x: tx - SEAT_GAP - SEAT_R, y: ty + ancho / 2 })
      seats.push({ x: tx + largo + SEAT_GAP + SEAT_R, y: ty + ancho / 2 })
    } else {
      seats.push({ x: tx + ancho / 2, y: ty - SEAT_GAP - SEAT_R })
      seats.push({ x: tx + ancho / 2, y: ty + largo + SEAT_GAP + SEAT_R })
    }
  }
  return { w: w + PAD * 2, h: h + PAD * 2, table: { x: tx, y: ty, w, h }, seats }
}
