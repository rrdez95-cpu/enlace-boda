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
  shape: 'round' | 'square' | 'rect'
  /** Solo rectangulares: 90 = en vertical */
  rot?: 0 | 90
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
  /** "resumen:ceremonia"… si el momento viene de una hora puesta en el Resumen */
  origen?: string
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

export type FincaVisita = {
  fecha: string
  hora: string
  contacto: string
  telefono: string
  notas: string
}

export type Finca = {
  id: string
  nombre: string
  /** Sin valor = visitada (fincas creadas antes de la agenda) */
  estado?: 'pendiente' | 'visitada'
  visita?: FincaVisita
  notaEsperada: number | null
  notaReal: number | null
  campos: Record<string, string>
  notas: Record<string, number>
  exclusividades: FincaExtra[]
  cornersExtra: FincaExtra[]
  sonidoExtras: FincaExtra[]
}

/* ═══ INVITACIONES ═══ */
export type InvitacionTema =
  | 'ia'
  | 'acuarela' | 'carta' | 'mediterraneo' | 'noche' | 'jardin'
  | 'minimalista' | 'boho' | 'magnolia' | 'lavanda' | 'playa' | 'black'

/** Partes de la invitación que se pueden quitar */
export type SeccionInvitacion = 'cuenta' | 'carta' | 'lugares' | 'programa' | 'autobuses' | 'regalo' | 'contacto'

/** Cómo se pinta cada parte que tiene varios diseños */
export type VariantesInvitacion = {
  programa?: 'linea' | 'tarjetas' | 'iconos' | 'animado' | 'horario' | 'mini'
  cuenta?: 'numeros' | 'circulos' | 'calendario' | 'frase'
  /** Recuadro de la cuenta atrás */
  caja?: 'ninguna' | 'tarjeta' | 'banda' | 'marco'
  lugares?: 'fotos' | 'tarjetas' | 'lista'
  autobuses?: 'tarjetas' | 'ruta'
}

/** Cambios sobre la plantilla elegida (si falta algo, se usa lo de la plantilla) */
export type PersonalInvitacion = {
  paleta?: string
  colores?: { paper: string; ink: string; accent: string }
  letras?: string
  portada?: string
  adorno?: string
  marco?: string
  textura?: string
  efecto?: string
  franjas?: string
  apertura?: string
}

/** Plantilla creada con IA a partir de lo que escriben los novios */
export type TemaIA = {
  nombre: string
  prompt: string
  paper: string; paper2: string; ink: string; ink2: string
  accent: string; accent2: string; accent3: string
  title: string; btnBg: string; btnFg: string
  fNames: string; fTitle: string; fBody: string
  radius: 'recto' | 'suave' | 'redondo'
  portada: 'centrada' | 'foto-fondo' | 'dividida' | 'arco'
  ornamento: 'simbolos' | 'linea' | 'olivo' | 'flores' | 'deco' | 'acuarela' | 'ondas' | 'lavanda' | 'pampas' | 'magnolia' | 'huellas' | 'espacio'
  simbolos: string
  textura: 'papel' | 'estrellas' | 'puntos' | 'rayas' | 'lisa'
  fotoFiltro: 'natural' | 'calida' | 'fria' | 'bn' | 'oscura'
  kicker: string
  saludo?: string
  mensaje?: string
  creada: string
}

export type InvitacionLugar = {
  lugar: string
  hora: string
  direccion: string
  mapa: string
  foto?: string
}

export type InvitacionContacto = {
  nombre: string
  telefono: string
}

export type InvitacionConfig = {
  activa: boolean
  codigo: string
  tema: InvitacionTema
  saludo: string
  mensaje: string
  fotoPortada?: string
  ceremonia: InvitacionLugar
  celebracion: InvitacionLugar
  mostrarPrograma: boolean
  regalosTexto: string
  iban: string
  contactos: InvitacionContacto[]
  fechaLimiteRsvp?: string
  /** Partes quitadas de la invitación */
  ocultas: SeccionInvitacion[]
  variantes: VariantesInvitacion
  /** Momentos del Cronograma que se enseñan (si no está, se decide solo: lo básico sí) */
  programaVisibles: Record<string, boolean>
  /** Nombre que ven los invitados para cada momento */
  programaTitulos: Record<string, string>
  personal: PersonalInvitacion
  temaIA?: TemaIA
}

export type RsvpResponse = {
  id: string
  nombre: string
  apellido?: string | null
  asiste: boolean
  num_acomp: number
  nombre_acomp?: string | null
  intolerancia?: string | null
  necesita_bus: boolean
  ruta_bus?: string | null
  mensaje?: string | null
  importado: boolean
  created_at: string
}

/* ═══ RESUMEN: AUTOBUSES Y GASTOS ═══ */
export type AutobusResumen = {
  id: string
  punto: string        // dónde recoge a los invitados
  horaIda: string
  horaVuelta: string
  puntoVuelta: string  // desde dónde sale de vuelta (vacío = la finca)
  empresa: string
  plazas: string
  coste: string
}

export type GastoExtra = {
  id: string
  nombre: string
  coste: string
  tipoPrecio: 'total' | 'porInvitado'
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
  autobuses?: AutobusResumen[]
  detalles?: GastoExtra[]
  horaLoca?: GastoExtra[]
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
