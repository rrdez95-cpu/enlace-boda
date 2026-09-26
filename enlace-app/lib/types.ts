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
  tipoPrecio: 'total' | 'porPersona'
  nota: number | null
}

export type Finca = {
  id: string
  nombre: string
  notaEsperada: number | null
  notaReal: number | null
  campos: Record<string, string>
  notas: Record<string, number>
  exclusividades: FincaExtra[]
  cornersExtra: FincaExtra[]
  sonidoExtras: FincaExtra[]
}

/* ═══ INVITACIONES ═══ */
export type InvitacionTema = 'marfil' | 'jardin' | 'marino' | 'rosa' | 'grafito'

export type InvitacionConfig = {
  activa: boolean
  codigo: string
  tema: InvitacionTema
  mensaje: string
  fotoPortada?: string   // URL pública de Supabase Storage
  foto2?: string
  fechaLimiteRsvp?: string
}

export type RsvpResponse = {
  id: string
  nombre: string
  apellido?: string
  asiste: boolean
  num_acomp: number
  nombre_acomp?: string
  intolerancia?: string
  necesita_bus: boolean
  ruta_bus?: string
  importado: boolean
  created_at: string
}

/* ═══ BODA DATA ═══ */
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
  invitacion?: InvitacionConfig
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