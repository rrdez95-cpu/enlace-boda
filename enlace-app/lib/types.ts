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

export type BodaData = {
  guests: Guest[]
  mesas: Mesa[]
  eventos: Evento[]
  eventosBuses: Record<string, Bus[]>
  proveedores: Proveedor[]
  checklist: ChecklistItem[]
  rItems: Record<string, { id: number; text: string }[]>
  resumen: Record<string, string>
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
  gid: 1, mid: 1, eid: 1, pvid: 1, ckid: 1, riid: 1,
}