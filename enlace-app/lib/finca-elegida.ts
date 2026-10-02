import type { BodaData, Finca, FincaExtra } from './types'
import { sincronizarMomentos } from './momentos'

/* Elegir una finca del comparador:
   - El menú, la ceremonia y el sonido pasan a sus apartados del Resumen.
   - El resto (alquiler, ampliación, menús infantiles y de staff, exclusividades, corners y extras)
     se calcula en directo desde la finca y aparece en el Presupuesto como "Extras de la finca". */

const num = (f: Finca, k: string) => parseFloat(f.campos?.[k] || '0') || 0

function importeExtra(x: FincaExtra, invitados: number): number {
  const c = parseFloat(x.coste) || 0
  return x.tipoPrecio === 'porPersona' ? c * invitados : c
}

export type LineaExtra = { concepto: string; importe: number; detalle?: string }

export function lineasExtrasFinca(f: Finca, invitados: number): LineaExtra[] {
  const lineas: LineaExtra[] = []
  const add = (concepto: string, importe: number, detalle?: string) => {
    if (importe > 0) lineas.push({ concepto, importe, detalle })
  }
  add('Alquiler de la finca', num(f, 'alquiler'))
  add('Ampliación de horario', num(f, 'ampliacionCoste'), f.campos?.ampliacionHoras || undefined)
  const inf = num(f, 'numMenuInfantil'), pInf = num(f, 'costeMenuInfantil')
  add('Menús infantiles', inf * pInf, inf && pInf ? `${inf} × ${pInf} €` : undefined)
  const stf = num(f, 'numMenuStaff'), pStf = num(f, 'costeMenuStaff')
  add('Menús de staff', stf * pStf, stf && pStf ? `${stf} × ${pStf} €` : undefined)

  const grupos: [FincaExtra[] | undefined, string][] = [
    [f.exclusividades, 'Exclusividad'], [f.cornersExtra, 'Corner'], [f.sonidoExtras, 'Extra de sonido'],
  ]
  for (const [lista, tipo] of grupos) {
    for (const x of lista || []) {
      const c = parseFloat(x.coste) || 0
      const detalle = x.tipoPrecio === 'porPersona' && c
        ? `${c} € × ${invitados || 0} invitados` : undefined
      add(x.nombre?.trim() || tipo, importeExtra(x, invitados), detalle)
    }
  }
  return lineas
}

export function costeCeremoniaFinca(f: Finca): number {
  return num(f, 'costeCeremoniaF') + num(f, 'tasasCeremonia') + num(f, 'costeSillaExtra') * num(f, 'numSillaExtra')
}

export function costeTotalFinca(f: Finca, invitados: number): number {
  const extras = lineasExtrasFinca(f, invitados).reduce((s, l) => s + l.importe, 0)
  return num(f, 'costeMenu') * invitados + costeCeremoniaFinca(f) + num(f, 'costeSonido') + extras
}

/** Lo que cambiaría en el Resumen: para avisar antes de sobrescribir */
export function conflictosAlElegir(d: BodaData, f: Finca): string[] {
  const r = d.resumen || {}
  const nuevos: [string, string, number][] = [
    ['precioPax', 'el precio del menú', num(f, 'costeMenu')],
    ['costeCeremonia', 'el coste de la ceremonia', costeCeremoniaFinca(f)],
    ['costeDJ', 'el coste del sonido', num(f, 'costeSonido')],
  ]
  return nuevos
    .filter(([k, , v]) => v > 0 && (r[k] || '').trim() !== '' && parseFloat(r[k]) !== v)
    .map(([, texto]) => texto)
}

export function aplicarFinca(d: BodaData, f: Finca): BodaData {
  const r: Record<string, string> = { ...(d.resumen || {}) }
  const invitados = parseInt(r.totalInv || '') || 0

  r.fincaElegida = f.id
  r.finca = f.nombre
  if (num(f, 'costeMenu')) r.precioPax = String(num(f, 'costeMenu'))
  if (!r.numPax && r.totalInv) r.numPax = r.totalInv
  if (costeCeremoniaFinca(f)) r.costeCeremonia = String(costeCeremoniaFinca(f))
  if (num(f, 'costeSonido')) r.costeDJ = String(num(f, 'costeSonido'))
  if (!r.lugarCeremonia && f.campos?.espacioCeremonia) r.lugarCeremonia = f.campos.espacioCeremonia
  if (!r.horasBarra && f.campos?.horasBarra) r.horasBarra = f.campos.horasBarra

  // La finca entra en el directorio de proveedores
  const proveedores = [...(d.proveedores || [])]
  let pvid = d.pvid
  const contacto = [f.visita?.contacto, f.visita?.telefono].filter(Boolean).join(' · ')
  const precio = Math.round(costeTotalFinca(f, invitados))
  const i = proveedores.findIndex(p => p.tipo === 'Finca / Espacio')
  if (i >= 0) proveedores[i] = { ...proveedores[i], nombre: f.nombre, contacto: contacto || proveedores[i].contacto, precio, status: 'confirmado' }
  else { proveedores.push({ id: pvid, tipo: 'Finca / Espacio', nombre: f.nombre, contacto, precio, status: 'confirmado', notas: '' }); pvid++ }

  // Si ya hay invitación empezada y no tiene lugar de celebración, se rellena
  let invitacion = d.invitacion
  if (invitacion?.celebracion) {
    invitacion = {
      ...invitacion,
      celebracion: {
        ...invitacion.celebracion,
        lugar: invitacion.celebracion.lugar || f.nombre,
        direccion: invitacion.celebracion.direccion || f.campos?.direccion || '',
      },
    }
  }

  return sincronizarMomentos({ ...d, resumen: r, proveedores, pvid, invitacion }, ['lugarCeremonia', 'horasBarra'])
}

export function quitarEleccion(d: BodaData): BodaData {
  return { ...d, resumen: { ...(d.resumen || {}), fincaElegida: '' } }
}
