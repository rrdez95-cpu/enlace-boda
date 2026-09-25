export type Guest = {
  id: number
  nombre: string
  apellido: string
  relacion: string
  mesaId: number | null
  paid: 'pendiente' | 'si' | 'no'
  importe: string
  intolerancia: string
}

export type Mesa = {
  id: number
  nombre: string
  cap: number
  shape: 'round' | 'rect'
  x: number
  y: number
}

export type Evento = {
  id: number
  nombre: string
  hora: string
  duracion: string
  cat: string
  desc: string
  emoji: string
}

export type Bus = {
  id: string
  nombre: string
  cap: number
  horaIda: string
  horaVuelta: string
  punto: string
  empresa: string
  passengerIds: number[]
  activeDir: 'ida' | 'vuelta'
}

export type Proveedor = {
  id: number
  tipo: string
  nombre: string
  contacto: string
  precio: number
  status: 'confirmado' | 'pendiente' | 'buscando'
  notas: string
}

export type ChecklistItem = {
  id: number
  g: string
  c: string
  n: string
  p: 'urgente' | 'pronto' | 'normal'
  nota: string
  done: boolean
}

/* ═══ FINCAS ═══ */

export type FincaExtra = {
  id: string
  nombre: string
  coste: string
}

export type Finca = {
  id: string
  nombre: string
  /** Puntuación de 0-10 antes de visitarla (fotos, dosier) */
  notaEsperada: number | null
  /** Puntuación de 0-10 después de visitarla */
  notaReal: number | null
  /** Valores de texto de cada campo, indexados por clave */
  campos: Record<string, string>
  /** Puntuación 0-10 de cada campo, indexada por la misma clave */
  notas: Record<string, number>
  /** Listas dinámicas con coste */
  exclusividades: FincaExtra[]
  cornersExtra: FincaExtra[]
  sonidoExtras: FincaExtra[]
}

export type BodaData = {
  guests: Guest[]
  mesas: Mesa[]
  eventos: Evento[]
  eventosBuses: Record<string, Bus[]>
  proveedores: Proveedor[]
  checklist: ChecklistItem[]
  rItems: Record<string, { id: number; text: string }[]>
  resumen: Record<string, string>
  fincas: Finca[]
  gid: number
  mid: number
  eid: number
  pvid: number
  ckid: number
  riid: number
}

export const emptyBoda: BodaData = {
  guests: [], mesas: [], eventos: [], eventosBuses: {},
  proveedores: [], checklist: [], rItems: {}, resumen: {},
  fincas: [],
  gid: 1, mid: 1, eid: 1, pvid: 1, ckid: 1, riid: 1,
}