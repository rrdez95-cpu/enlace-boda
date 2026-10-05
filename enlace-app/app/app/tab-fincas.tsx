'use client'

import './tab-fincas.css'

import { useState } from 'react'
import { BodaData, Finca, FincaExtra, FincaVisita } from '@/lib/types'
import { aplicarFinca, quitarEleccion, conflictosAlElegir } from '@/lib/finca-elegida'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
  isPro: boolean
  onPaywall: () => void
}

/* ═══ CONFIGURACIÓN DE CAMPOS ═══ */

type Campo = {
  k: string
  label: string
  ph?: string
  coste?: 'total' | 'porInvitado'
  xCampo?: string
  tipo?: 'texto' | 'numero'
  planB?: string
}

const GRUPOS: { id: string; icon: string; titulo: string; campos: Campo[] }[] = [
  {
    id: 'finca', icon: '🌿', titulo: 'Finca',
    campos: [
      { k: 'alquiler', label: 'Alquiler de la finca (€)', ph: '0 si va incluido', coste: 'total', tipo: 'numero' },
      { k: 'minPersonas', label: 'Mínimo de personas', ph: '100', tipo: 'numero' },
      { k: 'horarios', label: 'Horario de la finca', ph: '12:00 a 01:00', planB: 'planBHorario' },
      { k: 'ampliacionHoras', label: 'Ampliación de horario', ph: '2 h hasta las 03:00' },
      { k: 'ampliacionCoste', label: 'Coste de la ampliación (€)', ph: '600', coste: 'total', tipo: 'numero' },
      { k: 'habitacionNovios', label: 'Habitación para los novios', ph: 'Suite incluida / 200 € aparte', planB: 'planBHabitacion' },
      { k: 'coordinacion', label: 'Coordinación incluida', ph: 'Sí, coordinadora el día B' },
      { k: 'parking', label: 'Parking', ph: '80 plazas, iluminado', planB: 'planBParking' },
      { k: 'ropero', label: 'Ropero / guardarropa', ph: 'Sí, con personal' },
    ],
  },
  {
    id: 'menu', icon: '🍽️', titulo: 'Menú y catering',
    campos: [
      { k: 'costeMenu', label: 'Coste del menú por persona (€)', ph: '95', coste: 'porInvitado', tipo: 'numero' },
      { k: 'minPersonasMenu', label: 'Mínimo de comensales', ph: '100', tipo: 'numero' },
      { k: 'numMenuInfantil', label: 'Nº de menús infantiles', ph: '8', tipo: 'numero' },
      { k: 'costeMenuInfantil', label: 'Coste menú infantil (€)', ph: '45', coste: 'total', xCampo: 'numMenuInfantil', tipo: 'numero' },
      { k: 'numMenuStaff', label: 'Nº de menús de staff', ph: '6', tipo: 'numero' },
      { k: 'costeMenuStaff', label: 'Coste menú staff (€)', ph: '35', coste: 'total', xCampo: 'numMenuStaff', tipo: 'numero' },
      { k: 'barraLibre', label: 'Barra libre incluida', ph: 'Sí, marcas premium' },
      { k: 'horasBarra', label: 'Horas de barra incluidas', ph: '4 h' },
      { k: 'estacionBienvenida', label: 'Estación de bienvenida', ph: 'Vermut y encurtidos' },
      { k: 'menaje', label: 'Menaje y mantelería', ph: 'Incluido, mantel blanco' },
      { k: 'coctelFrios', label: 'Referencias frías del cóctel', ph: '8 referencias' },
      { k: 'coctelCalientes', label: 'Referencias calientes del cóctel', ph: '6 referencias' },
      { k: 'cornersIncluidos', label: 'Corners / estaciones incluidas', ph: 'Jamón y quesos' },
      { k: 'protocolo', label: 'Protocolo, minutas y centros', ph: 'Incluido' },
      { k: 'degustacion', label: 'Degustación de menú', ph: 'Sí, gratuita' },
      { k: 'degustacionPax', label: 'Personas en la degustación', ph: '4', tipo: 'numero' },
    ],
  },
  {
    id: 'sonido', icon: '🎶', titulo: 'Sonido y DJ',
    campos: [
      { k: 'costeSonido', label: 'Coste del sonido / DJ (€)', ph: '900', coste: 'total', tipo: 'numero' },
      { k: 'sonidoExclusividad', label: '¿Hay exclusividad de DJ?', ph: 'Sí, DJ de la casa obligatorio' },
      { k: 'sonidoCeremonia', label: 'Incluye música en la ceremonia', ph: 'Sí, equipo y micros' },
      { k: 'sonidoBanquete', label: 'Incluye música en el banquete', ph: 'Sí, hilo musical' },
      { k: 'limitador', label: 'Limitador de sonido (dB)', ph: '95 dB' },
    ],
  },
  {
    id: 'ceremonia', icon: '⛪', titulo: 'Ceremonia',
    campos: [
      { k: 'costeCeremoniaF', label: 'Coste del montaje (€)', ph: '800', coste: 'total', tipo: 'numero' },
      { k: 'espacioCeremonia', label: 'Espacio de la ceremonia', ph: 'Jardín exterior con pérgola', planB: 'planBCeremonia' },
      { k: 'asientosCeremonia', label: 'Nº de asientos incluidos', ph: '120', tipo: 'numero' },
      { k: 'numSillaExtra', label: 'Nº de sillas extra necesarias', ph: '30', tipo: 'numero' },
      { k: 'costeSillaExtra', label: 'Coste por silla extra (€)', ph: '4', coste: 'total', xCampo: 'numSillaExtra', tipo: 'numero' },
      { k: 'tasasCeremonia', label: 'Tasas de ceremonia (€)', ph: '150', coste: 'total', tipo: 'numero' },
      { k: 'floresCeremonia', label: 'Flores y decoración incluidas', ph: 'Arco floral incluido' },
    ],
  },
]

const UBICACION: Campo[] = [
  { k: 'direccion', label: 'Dirección', ph: 'Carretera M-600, km 8, San Lorenzo de El Escorial' },
  { k: 'distancia', label: 'Distancia desde casa (km)', ph: '45', tipo: 'numero' },
  { k: 'tiempo', label: 'Tiempo en coche (min)', ph: '30', tipo: 'numero' },
]

const VISITA_VACIA: FincaVisita = { fecha: '', hora: '', contacto: '', telefono: '', notas: '' }

const CONTRATO: Campo[] = [
  { k: 'formaReserva', label: 'Forma de reserva', ph: 'Señal de 2.000 € no reembolsable' },
  { k: 'formaPago', label: 'Calendario de pagos', ph: '50% a 6 meses, resto 15 días antes' },
]

/* ═══ COMPONENTE PRINCIPAL ═══ */

export default function TabFincas({ data, setData, showToast, isPro, onPaywall }: Props) {
  const fincas = data.fincas || []
  const [selId, setSelId] = useState<string | null>(fincas[0]?.id ?? null)
  const invitados = parseInt(data.resumen?.totalInv || '0') || 0

  const sel = fincas.find(f => f.id === selId) || null
  const elegidaId = data.resumen?.fincaElegida || ''
  const pendientes = fincas.filter(esPendiente).sort((a, b) => claveVisita(a).localeCompare(claveVisita(b)))
  const visitadas = fincas.filter(f => !esPendiente(f))

  // Comparador de hasta 3 fincas visitadas (plan completo)
  const [comparando, setComparando] = useState(false)
  const [compIds, setCompIds] = useState<string[]>([])
  function abrirComparador() {
    if (!isPro) { onPaywall(); return }
    const validas = compIds.filter(id => visitadas.some(f => f.id === id))
    const base = validas.length >= 2 ? validas
      : [...new Set([elegidaId, ...visitadas.map(f => f.id)].filter(id => id && visitadas.some(f => f.id === id)))].slice(0, 3)
    setCompIds(base)
    setComparando(true)
  }

  function addFinca() {
    const id = 'f' + Date.now()
    const nueva: Finca = {
      id, nombre: `Finca ${fincas.length + 1}`,
      notaEsperada: null, notaReal: null,
      campos: {}, notas: {},
      exclusividades: [], cornersExtra: [], sonidoExtras: [],
      estado: 'pendiente', visita: { ...VISITA_VACIA },
    }
    setData(d => ({ ...d, fincas: [...(d.fincas || []), nueva] }))
    setSelId(id)
    showToast('Finca añadida')
  }

  function updFinca(id: string, patch: Partial<Finca>) {
    setData(d => ({ ...d, fincas: (d.fincas || []).map(f => f.id === id ? { ...f, ...patch } : f) }))
  }

  function setVisita(id: string, patch: Partial<FincaVisita>) {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f =>
        f.id === id ? { ...f, visita: { ...VISITA_VACIA, ...(f.visita || {}), ...patch } } : f),
    }))
  }

  function setEstado(id: string, estado: 'pendiente' | 'visitada') {
    updFinca(id, { estado })
    showToast(estado === 'visitada'
      ? 'Marcada como visitada. Ya puedes apuntar precios y puntuarla'
      : 'Marcada como pendiente de visitar')
  }

  // Elegir finca: sus datos pasan al Resumen y los extras al Presupuesto
  function elegir(f: Finca) {
    const otra = elegidaId && elegidaId !== f.id ? fincas.find(x => x.id === elegidaId) : null
    const cambios = conflictosAlElegir(data, f)
    const avisos = [
      otra ? `Dejará de estar elegida ${otra.nombre}.` : '',
      cambios.length ? `En el Resumen se sustituirá ${cambios.join(', ')}.` : '',
    ].filter(Boolean)
    if (avisos.length && !window.confirm(`${avisos.join(' ')} ¿Continuar?`)) return
    setData(d => aplicarFinca(d, f))
    showToast(elegidaId === f.id ? 'Datos actualizados en el Resumen' : `¡${f.nombre} elegida! Sus datos ya están en el Resumen`)
  }

  function quitar() {
    setData(d => quitarEleccion(d))
    showToast('Ya no hay finca elegida. Los datos del Resumen se mantienen')
  }

  function delFinca(id: string) {
    setData(d => ({ ...d, fincas: (d.fincas || []).filter(f => f.id !== id) }))
    setSelId(fincas.find(f => f.id !== id)?.id ?? null)
  }

  function setCampo(id: string, k: string, v: string) {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f =>
        f.id === id ? { ...f, campos: { ...f.campos, [k]: v } } : f),
    }))
  }

  function setNota(id: string, k: string, n: number) {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f => {
        if (f.id !== id) return f
        const notas = { ...f.notas }
        if (notas[k] === n && n !== 0) delete notas[k]
        else notas[k] = n
        return { ...f, notas }
      }),
    }))
  }

  function addExtra(id: string, lista: 'exclusividades' | 'cornersExtra' | 'sonidoExtras') {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f => f.id === id
        ? { ...f, [lista]: [...f[lista], { id: 'x' + Date.now(), nombre: '', coste: '', tipoPrecio: 'total', nota: null }] }
        : f),
    }))
  }

  function updExtra(id: string, lista: 'exclusividades' | 'cornersExtra' | 'sonidoExtras',
                    xid: string, patch: Partial<FincaExtra>) {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f => f.id === id
        ? { ...f, [lista]: f[lista].map(x => x.id === xid ? { ...x, ...patch } : x) }
        : f),
    }))
  }

  function delExtra(id: string, lista: 'exclusividades' | 'cornersExtra' | 'sonidoExtras', xid: string) {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f => f.id === id
        ? { ...f, [lista]: f[lista].filter(x => x.id !== xid) }
        : f),
    }))
  }

  return (
    <div className="screen">
      {/* LISTA LATERAL */}
      <aside className="fincas-side">
        <div className="fincas-side-head">
          <div className="fincas-side-title">Fincas</div>
          <div className="fincas-side-actions">
            {visitadas.length >= 2 && (
              <button className={`btn-comparar ${comparando ? 'on' : ''}`} onClick={abrirComparador}>
                ⚖ Comparar{!isPro && ' 🔒'}
              </button>
            )}
            <button className="btn-new-finca" onClick={addFinca}>+ Añadir</button>
          </div>
        </div>

        {invitados === 0 && (
          <div className="fincas-warn">
            Pon el nº de invitados en <strong>Resumen → Fecha y datos</strong> para calcular el coste por persona.
          </div>
        )}

        {!isPro && (
          <div className="fincas-pro-badge" onClick={onPaywall}>
            🔒 Puntuaciones disponibles en el plan completo
          </div>
        )}

        <div className="fincas-list">
          {fincas.length === 0 ? (
            <div className="fincas-empty">Añade la primera finca<br />que queráis ver</div>
          ) : (
            <>
              {pendientes.length > 0 && <div className="fincas-group">Por visitar</div>}
              {pendientes.map(f => {
                const cita = textoVisita(f.visita)
                return (
                  <div key={f.id}
                    className={`finca-item pendiente ${selId === f.id ? 'active' : ''}`}
                    onClick={() => { setSelId(f.id); setComparando(false) }}>
                    <div className="finca-item-name">{f.nombre || 'Sin nombre'}</div>
                    <div className={`finca-item-cita ${cita.pasada ? 'pasada' : ''}`}>{cita.texto}</div>
                    {distanciaTexto(f) && <div className="finca-item-total">{distanciaTexto(f)}</div>}
                  </div>
                )
              })}
              {pendientes.length > 0 && visitadas.length > 0 && <div className="fincas-group">Visitadas</div>}
              {visitadas.map(f => {
                const total = calcTotal(f, invitados)
                const porInv = invitados > 0 ? total / invitados : 0
                const media = notaMedia(f)
                return (
                  <div key={f.id}
                    className={`finca-item ${selId === f.id ? 'active' : ''} ${elegidaId === f.id ? 'elegida' : ''}`}
                    onClick={() => { setSelId(f.id); setComparando(false) }}>
                    <div className="finca-item-name">
                      {f.nombre || 'Sin nombre'}
                      {elegidaId === f.id && <span className="finca-item-tag">Elegida</span>}
                    </div>
                    <div className="finca-item-row">
                      <span className="finca-item-price">
                        {porInv > 0 ? `${Math.round(porInv).toLocaleString('es-ES')} €` : '— €'}
                        <span className="finca-item-unit">/inv</span>
                      </span>
                      {isPro && (
                        <span className={`finca-item-score ${scoreClass(media)}`}>
                          {media !== null ? media.toFixed(1) : '—'}
                        </span>
                      )}
                    </div>
                    <div className="finca-item-total">
                      Total {total > 0 ? `${Math.round(total).toLocaleString('es-ES')} €` : '—'}
                      {distanciaTexto(f) && <> · {distanciaTexto(f)}</>}
                    </div>
                  </div>
                )
              })}
            </>
          )}
        </div>
      </aside>

      {/* DETALLE */}
      <div className="fincas-main">
        {comparando ? (
          <Comparador
            fincas={visitadas}
            ids={compIds}
            setIds={setCompIds}
            invitados={invitados}
            elegidaId={elegidaId}
            onElegir={elegir}
            onVer={id => { setSelId(id); setComparando(false) }}
            onCerrar={() => setComparando(false)}
          />
        ) : !sel ? (
          <div className="fincas-none">
            <div className="fincas-none-icon">🌿</div>
            <div className="fincas-none-title">Compara tus fincas sin Excel</div>
            <p className="fincas-none-text">
              Apunta las fincas que queréis ver y organiza las visitas en tu calendario.
              Después de cada una, rellena lo que os cuenten y puntúa cada apartado:
              Enlace calcula el coste real por invitado y te dice cuál sale mejor.
            </p>
            <button className="btn-new-finca big" onClick={addFinca}>
              + Añadir primera finca
            </button>
          </div>
        ) : (
          <FincaDetalle
            finca={sel}
            invitados={invitados}
            isPro={isPro}
            onPaywall={onPaywall}
            onNombre={v => updFinca(sel.id, { nombre: v })}
            onEstado={e => setEstado(sel.id, e)}
            elegida={elegidaId === sel.id}
            onElegir={() => elegir(sel)}
            onQuitar={quitar}
            onVisita={p => setVisita(sel.id, p)}
            onDel={() => { delFinca(sel.id); showToast('Finca eliminada') }}
            onCampo={(k, v) => setCampo(sel.id, k, v)}
            onNota={(k, n) => setNota(sel.id, k, n)}
            onNotaGlobal={(campo, n) => updFinca(sel.id, { [campo]: n } as Partial<Finca>)}
            onAddExtra={l => addExtra(sel.id, l)}
            onUpdExtra={(l, xid, p) => updExtra(sel.id, l, xid, p)}
            onDelExtra={(l, xid) => delExtra(sel.id, l, xid)}
          />
        )}
      </div>
    </div>
  )
}

/* ═══ COMPARADOR ═══ */

type FilaComp = {
  label: string
  valor: (f: Finca) => string
  num?: (f: Finca) => number | null
  mejor?: 'min' | 'max'
  nota?: (f: Finca) => number | null
}

const euros = (n: number) => (n > 0 ? `${Math.round(n).toLocaleString('es-ES')} €` : '—')
const texto = (f: Finca, k: string) => (f.campos[k] || '').trim() || '—'
const numero = (f: Finca, k: string) => parseFloat(f.campos[k] || '') || 0
const notaDe = (k: string) => (f: Finca) => {
  const n = f.notas[k]
  return n && n > 0 ? n : null
}
const sumaExtras = (lista: FincaExtra[] | undefined, invitados: number) =>
  (lista || []).reduce((s, x) => s + (parseFloat(x.coste) || 0) * (x.tipoPrecio === 'porPersona' ? invitados : 1), 0)

function seccionesComparador(invitados: number): { titulo: string; filas: FilaComp[] }[] {
  const PLANES_B = ['planBHorario', 'planBHabitacion', 'planBParking', 'planBCeremonia']
  return [
    {
      titulo: 'De un vistazo',
      filas: [
        { label: 'Coste por invitado', num: f => (invitados ? calcTotal(f, invitados) / invitados : null), valor: f => (invitados ? euros(calcTotal(f, invitados) / invitados) : '—'), mejor: 'min' },
        { label: 'Coste total', num: f => calcTotal(f, invitados), valor: f => euros(calcTotal(f, invitados)), mejor: 'min' },
        { label: 'Puntuación media', num: f => notaMedia(f), valor: f => { const m = notaMedia(f); return m !== null ? m.toFixed(1) : '—' }, mejor: 'max' },
        { label: 'Primera impresión → al visitarla', valor: f => (f.notaEsperada || f.notaReal ? `${f.notaEsperada ?? '—'} → ${f.notaReal ?? '—'}` : '—') },
        { label: 'Distancia', num: f => numero(f, 'distancia') || null, valor: f => distanciaTexto(f) || '—', mejor: 'min', nota: notaDe('distancia') },
      ],
    },
    {
      titulo: 'Puntuación por apartado',
      filas: [
        { label: 'Ubicación', keys: UBICACION.map(c => c.k) },
        ...GRUPOS.map(g => ({ label: g.titulo, keys: g.campos.map(c => c.k) })),
      ].map(({ label, keys }) => ({
        label,
        num: (f: Finca) => { const v = grupoNota(f, keys); return v ? parseFloat(v) : null },
        valor: (f: Finca) => grupoNota(f, keys) || '—',
        mejor: 'max' as const,
      })),
    },
    {
      titulo: 'Finca',
      filas: [
        { label: 'Alquiler', num: f => numero(f, 'alquiler') || null, valor: f => euros(numero(f, 'alquiler')), mejor: 'min', nota: notaDe('alquiler') },
        { label: 'Mínimo de personas', valor: f => texto(f, 'minPersonas'), nota: notaDe('minPersonas') },
        { label: 'Horario', valor: f => texto(f, 'horarios'), nota: notaDe('horarios') },
        { label: 'Ampliación de horario', valor: f => [texto(f, 'ampliacionHoras'), numero(f, 'ampliacionCoste') ? euros(numero(f, 'ampliacionCoste')) : ''].filter(x => x && x !== '—').join(' · ') || '—', nota: notaDe('ampliacionHoras') },
        { label: 'Habitación para los novios', valor: f => texto(f, 'habitacionNovios'), nota: notaDe('habitacionNovios') },
        { label: 'Coordinación', valor: f => texto(f, 'coordinacion'), nota: notaDe('coordinacion') },
        { label: 'Parking', valor: f => texto(f, 'parking'), nota: notaDe('parking') },
        { label: 'Plan B si llueve', valor: f => { const n = PLANES_B.filter(k => (f.campos[k] || '').trim()).length; return n ? `Sí, en ${n} ${n === 1 ? 'espacio' : 'espacios'}` : '—' } },
        { label: 'Exclusividades', num: f => sumaExtras(f.exclusividades, invitados) || null, valor: f => { const l = f.exclusividades || []; return l.length ? `${l.length} · ${euros(sumaExtras(l, invitados))}` : 'Ninguna' }, mejor: 'min' },
      ],
    },
    {
      titulo: 'Menú y catering',
      filas: [
        { label: 'Menú por persona', num: f => numero(f, 'costeMenu') || null, valor: f => euros(numero(f, 'costeMenu')), mejor: 'min', nota: notaDe('costeMenu') },
        { label: 'Barra libre', valor: f => [texto(f, 'barraLibre'), texto(f, 'horasBarra')].filter(x => x !== '—').join(' · ') || '—', nota: notaDe('barraLibre') },
        { label: 'Estación de bienvenida', valor: f => texto(f, 'estacionBienvenida'), nota: notaDe('estacionBienvenida') },
        { label: 'Cóctel', valor: f => [texto(f, 'coctelFrios'), texto(f, 'coctelCalientes')].filter(x => x !== '—').join(' · ') || '—', nota: notaDe('coctelFrios') },
        { label: 'Corners incluidos', valor: f => texto(f, 'cornersIncluidos'), nota: notaDe('cornersIncluidos') },
        { label: 'Corners extra', num: f => sumaExtras(f.cornersExtra, invitados) || null, valor: f => euros(sumaExtras(f.cornersExtra, invitados)), mejor: 'min' },
        { label: 'Degustación', valor: f => texto(f, 'degustacion'), nota: notaDe('degustacion') },
      ],
    },
    {
      titulo: 'Sonido y ceremonia',
      filas: [
        { label: 'Sonido / DJ', num: f => numero(f, 'costeSonido') || null, valor: f => euros(numero(f, 'costeSonido')), mejor: 'min', nota: notaDe('costeSonido') },
        { label: 'Limitador de sonido', valor: f => texto(f, 'limitador'), nota: notaDe('limitador') },
        { label: 'Coste de la ceremonia', num: f => (numero(f, 'costeCeremoniaF') + numero(f, 'tasasCeremonia') + numero(f, 'costeSillaExtra') * numero(f, 'numSillaExtra')) || null, valor: f => euros(numero(f, 'costeCeremoniaF') + numero(f, 'tasasCeremonia') + numero(f, 'costeSillaExtra') * numero(f, 'numSillaExtra')), mejor: 'min', nota: notaDe('costeCeremoniaF') },
        { label: 'Espacio de la ceremonia', valor: f => texto(f, 'espacioCeremonia'), nota: notaDe('espacioCeremonia') },
      ],
    },
    {
      titulo: 'Contrato',
      filas: [
        { label: 'Reserva', valor: f => texto(f, 'formaReserva'), nota: notaDe('formaReserva') },
        { label: 'Pagos', valor: f => texto(f, 'formaPago'), nota: notaDe('formaPago') },
      ],
    },
  ]
}

function Comparador({ fincas, ids, setIds, invitados, elegidaId, onElegir, onVer, onCerrar }: {
  fincas: Finca[]
  ids: string[]
  setIds: (ids: string[]) => void
  invitados: number
  elegidaId: string
  onElegir: (f: Finca) => void
  onVer: (id: string) => void
  onCerrar: () => void
}) {
  const sel = ids.map(id => fincas.find(f => f.id === id)).filter(Boolean) as Finca[]
  const secciones = seccionesComparador(invitados)

  function alternar(id: string) {
    if (ids.includes(id)) setIds(ids.filter(x => x !== id))
    else if (ids.length < 3) setIds([...ids, id])
  }

  function mejores(fila: FilaComp): Set<string> {
    if (!fila.num || !fila.mejor) return new Set()
    const vals = sel.map(f => ({ id: f.id, v: fila.num!(f) })).filter(x => x.v !== null && x.v > 0) as { id: string; v: number }[]
    if (vals.length < 2) return new Set()
    const objetivo = fila.mejor === 'min' ? Math.min(...vals.map(x => x.v)) : Math.max(...vals.map(x => x.v))
    if (vals.every(x => x.v === objetivo)) return new Set()
    return new Set(vals.filter(x => x.v === objetivo).map(x => x.id))
  }

  return (
    <div className="fc">
      <div className="fc-head">
        <div>
          <div className="fc-title">Comparador de fincas</div>
          <div className="fc-sub">Elige hasta 3. En verde, la que sale mejor en cada fila.</div>
        </div>
        <button className="fc-cerrar" onClick={onCerrar}>Volver a las fincas</button>
      </div>

      <div className="fc-chips">
        {fincas.map(f => {
          const on = ids.includes(f.id)
          return (
            <button key={f.id} className={`fc-chip ${on ? 'on' : ''}`} onClick={() => alternar(f.id)}
              disabled={!on && ids.length >= 3} aria-pressed={on}>
              {on ? '✓ ' : ''}{f.nombre || 'Sin nombre'}
            </button>
          )
        })}
      </div>

      {sel.length < 2 ? (
        <p className="fc-vacio">Elige al menos dos fincas para compararlas.</p>
      ) : (
        <div className="fc-scroll">
          <table className="fc-tabla" style={{ ['--cols' as string]: sel.length }}>
            <thead>
              <tr>
                <th className="fc-label" />
                {sel.map(f => (
                  <th key={f.id} className="fc-col">
                    <div className="fc-nombre">{f.nombre || 'Sin nombre'}</div>
                    {elegidaId === f.id
                      ? <span className="fc-elegida">✓ Vuestra finca</span>
                      : <button className="fc-elegir" onClick={() => onElegir(f)}>Elegir esta</button>}
                    <button className="fc-ver" onClick={() => onVer(f.id)}>Ver ficha</button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {secciones.map(sec => {
                const filas = sec.filas.filter(fila => sel.some(f => fila.valor(f) !== '—'))
                if (!filas.length) return null
                return [
                  <tr key={sec.titulo} className="fc-sec"><td colSpan={sel.length + 1}>{sec.titulo}</td></tr>,
                  ...filas.map(fila => {
                    const best = mejores(fila)
                    return (
                      <tr key={sec.titulo + fila.label}>
                        <td className="fc-label">{fila.label}</td>
                        {sel.map(f => {
                          const n = fila.nota?.(f) ?? null
                          return (
                            <td key={f.id} className={best.has(f.id) ? 'fc-mejor' : ''}>
                              <span>{fila.valor(f)}</span>
                              {n !== null && <span className={`fc-nota ${scoreClass(n)}`}>{n}</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  }),
                ]
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ═══ DETALLE ═══ */

function FincaDetalle({
  finca, invitados, isPro, onPaywall, onNombre, onEstado, elegida, onElegir, onQuitar, onVisita, onDel, onCampo, onNota,
  onNotaGlobal, onAddExtra, onUpdExtra, onDelExtra,
}: {
  finca: Finca
  invitados: number
  isPro: boolean
  onPaywall: () => void
  onNombre: (v: string) => void
  onEstado: (e: 'pendiente' | 'visitada') => void
  elegida: boolean
  onElegir: () => void
  onQuitar: () => void
  onVisita: (p: Partial<FincaVisita>) => void
  onDel: () => void
  onCampo: (k: string, v: string) => void
  onNota: (k: string, n: number) => void
  onNotaGlobal: (campo: 'notaEsperada' | 'notaReal', n: number) => void
  onAddExtra: (l: 'exclusividades' | 'cornersExtra' | 'sonidoExtras') => void
  onUpdExtra: (l: 'exclusividades' | 'cornersExtra' | 'sonidoExtras', xid: string, p: Partial<FincaExtra>) => void
  onDelExtra: (l: 'exclusividades' | 'cornersExtra' | 'sonidoExtras', xid: string) => void
}) {
  const total = calcTotal(finca, invitados)
  const porInv = invitados > 0 ? total / invitados : 0
  const media = notaMedia(finca)
  const esp = finca.notaEsperada
  const real = finca.notaReal
  const dif = esp !== null && real !== null ? +(real - esp).toFixed(1) : null

  const pendiente = esPendiente(finca)

  const cabecera = (
    <>
      <div className="finca-head">
        <input className="finca-name-input" value={finca.nombre}
          placeholder="Nombre de la finca" onChange={e => onNombre(e.target.value)} />
        <button className="finca-del" onClick={onDel}>Eliminar</button>
      </div>
      <div className="finca-estado">
        <div className="finca-estado-seg" role="group" aria-label="Estado de la visita">
          <button type="button" aria-pressed={pendiente} onClick={() => onEstado('pendiente')}>Por visitar</button>
          <button type="button" aria-pressed={!pendiente} onClick={() => onEstado('visitada')}>Visitada</button>
        </div>
        {pendiente && <span className="finca-estado-hint">Cuando la visitéis, márcala como visitada para apuntar precios y puntuarla.</span>}
      </div>
    </>
  )

  const ubicacion = (
    <div className="finca-block">
      <div className="finca-block-head">
        <span className="fb-icon">📍</span>
        <span className="fb-title">Ubicación</span>
        {isPro && !pendiente && <span className="fb-score">{grupoNota(finca, UBICACION.map(c => c.k))}</span>}
      </div>
      <div className="finca-block-body">
        {UBICACION.map(c => (
          <CampoRow key={c.k}
            campo={c}
            valor={finca.campos[c.k] || ''}
            nota={finca.notas[c.k] ?? null}
            isPro={isPro && !pendiente}
            onValor={v => onCampo(c.k, v)}
            onNota={n => onNota(c.k, n)}
          />
        ))}
        {(finca.campos.direccion || finca.nombre) && (
          <div className="fv-links">
            <a href={mapaFinca(finca, false)} target="_blank" rel="noopener noreferrer">Ver en el mapa</a>
            <a href={mapaFinca(finca, true)} target="_blank" rel="noopener noreferrer">Cómo llegar desde donde estoy</a>
          </div>
        )}
      </div>
    </div>
  )

  if (pendiente) {
    return (
      <>
        {cabecera}
        <VisitaBlock finca={finca} isPro={isPro} onVisita={onVisita}
          onNotaEsperada={n => onNotaGlobal('notaEsperada', n)} />
        {ubicacion}
      </>
    )
  }

  return (
    <>
      {cabecera}

      <div className={`finca-elegir ${elegida ? 'on' : ''}`}>
        {elegida ? (
          <>
            <div className="fe-txt">
              <b>✓ Es vuestra finca</b>
              <span>El menú, la ceremonia y el sonido están en el Resumen, y el resto de extras en el Presupuesto. Si cambias algo aquí, los extras se actualizan solos.</span>
            </div>
            <div className="fe-actions">
              <button type="button" className="fe-btn ghost" onClick={onElegir}>Volver a pasar precios</button>
              <button type="button" className="fe-link" onClick={onQuitar}>Quitar</button>
            </div>
          </>
        ) : (
          <>
            <div className="fe-txt">
              <b>¿Es la vuestra?</b>
              <span>Al elegirla, sus precios pasan al Resumen y empezáis a ver el presupuesto final con todos los extras.</span>
            </div>
            <button type="button" className="fe-btn" onClick={onElegir}>Elegir esta finca</button>
          </>
        )}
      </div>

      {/* Resumen de costes */}
      <div className="finca-summary">
        <SumItem label="Coste por invitado"
          val={porInv > 0 ? `${Math.round(porInv).toLocaleString('es-ES')} €` : '— €'}
          sub={invitados > 0 ? `Para ${invitados} invitados` : 'Falta el nº de invitados'} />
        <div className="fsum-sep" />
        <SumItem label="Coste total"
          val={total > 0 ? `${Math.round(total).toLocaleString('es-ES')} €` : '— €'}
          sub="Suma de todos los conceptos" />
        {isPro && (
          <>
            <div className="fsum-sep" />
            <SumItem label="Puntuación media"
              val={media !== null ? media.toFixed(1) : '—'}
              valClass={scoreClass(media)}
              sub={`${Object.keys(finca.notas).filter(k => finca.notas[k] > 0).length} apartados puntuados`} />
          </>
        )}
      </div>

      {/* Esperado vs real — solo PRO */}
      {isPro ? (
        <div className="finca-block">
          <div className="finca-block-head">
            <span className="fb-icon">⭐</span>
            <span className="fb-title">Lo que esperabas y lo que viste</span>
          </div>
          <div className="finca-block-body">
            <div className="expect-grid">
              <div className="expect-col">
                <div className="expect-label">Antes de visitarla</div>
                <div className="expect-hint">Según fotos, web y dosier</div>
                <Score value={esp} onChange={n => onNotaGlobal('notaEsperada', n)} />
              </div>
              <div className="expect-col">
                <div className="expect-label">Después de visitarla</div>
                <div className="expect-hint">Tu impresión real en persona</div>
                <Score value={real} onChange={n => onNotaGlobal('notaReal', n)} />
              </div>
            </div>

            {dif !== null && (
              <div className={`expect-verdict ${dif > 0 ? 'up' : dif < 0 ? 'down' : 'same'}`}>
                {dif > 1.5 && <>Sorpresa muy positiva — supera lo que esperabais <strong>(+{dif})</strong></>}
                {dif > 0 && dif <= 1.5 && <>Mejor en persona que en fotos <strong>(+{dif})</strong></>}
                {dif === 0 && <>Justo lo que esperabais. Las fotos eran fieles</>}
                {dif < 0 && dif >= -1.5 && <>Algo por debajo de lo esperado <strong>({dif})</strong></>}
                {dif < -1.5 && <>Decepción — las fotos prometían bastante más <strong>({dif})</strong></>}
              </div>
            )}

            <div className="fg" style={{ marginTop: 14 }}>
              <label className="fl">Notas de la visita</label>
              <textarea className="ft2" value={finca.campos.notasVisita || ''}
                placeholder="Qué os gustó, qué os chirrió, con quién hablasteis, qué prometieron…"
                onChange={e => onCampo('notasVisita', e.target.value)} />
            </div>
          </div>
        </div>
      ) : (
        <div className="pro-lock-block" onClick={onPaywall}>
          <div className="pro-lock-icon">⭐</div>
          <div className="pro-lock-title">Puntuaciones y comparativa</div>
          <div className="pro-lock-text">
            Puntúa cada apartado del 1 al 10, compara lo esperado con lo que viste en persona
            y obtén la nota media de cada finca.
          </div>
          <div className="pro-lock-cta">Desbloquear por 3,99 € →</div>
        </div>
      )}

      {ubicacion}

      {/* Grupos */}
      {GRUPOS.map(g => (
        <div className="finca-block" key={g.id}>
          <div className="finca-block-head">
            <span className="fb-icon">{g.icon}</span>
            <span className="fb-title">{g.titulo}</span>
            {isPro && <span className="fb-score">{grupoNota(finca, g.campos.map(c => c.k))}</span>}
          </div>
          <div className="finca-block-body">
            {g.campos.map(c => (
              <CampoRow key={c.k}
                campo={c}
                valor={finca.campos[c.k] || ''}
                planBValor={c.planB ? finca.campos[c.planB] || '' : undefined}
                nota={finca.notas[c.k] ?? null}
                isPro={isPro}
                onValor={v => onCampo(c.k, v)}
                onPlanB={c.planB ? (v => onCampo(c.planB!, v)) : undefined}
                onNota={n => onNota(c.k, n)}
              />
            ))}

            {g.id === 'finca' && (
              <>
                <ExtraList
                  titulo="Exclusividades de servicio"
                  hint="Servicios que la finca te obliga a contratar con ellos. Añade nombre, coste y si es precio fijo o por persona."
                  items={finca.exclusividades}
                  ph="Foto y vídeo"
                  isPro={isPro}
                  onAdd={() => onAddExtra('exclusividades')}
                  onUpd={(xid, p) => onUpdExtra('exclusividades', xid, p)}
                  onDel={xid => onDelExtra('exclusividades', xid)}
                />
                <div className="finca-subblock">
                  <div className="finca-subtitle">Contrato y pagos</div>
                  {CONTRATO.map(c => (
                    <CampoRow key={c.k}
                      campo={c}
                      valor={finca.campos[c.k] || ''}
                      nota={finca.notas[c.k] ?? null}
                      isPro={isPro}
                      onValor={v => onCampo(c.k, v)}
                      onNota={n => onNota(c.k, n)}
                    />
                  ))}
                </div>
              </>
            )}

            {g.id === 'menu' && (
              <ExtraList
                titulo="Estaciones y corners adicionales"
                hint="Los que no van incluidos y quieres añadir. Suman al total."
                items={finca.cornersExtra}
                ph="Corner de sushi"
                isPro={isPro}
                onAdd={() => onAddExtra('cornersExtra')}
                onUpd={(xid, p) => onUpdExtra('cornersExtra', xid, p)}
                onDel={xid => onDelExtra('cornersExtra', xid)}
              />
            )}

            {g.id === 'sonido' && (
              <ExtraList
                titulo="Extras de sonido"
                hint="Iluminación, pantallas, humo, micros adicionales…"
                items={finca.sonidoExtras}
                ph="Iluminación de pista"
                isPro={isPro}
                onAdd={() => onAddExtra('sonidoExtras')}
                onUpd={(xid, p) => onUpdExtra('sonidoExtras', xid, p)}
                onDel={xid => onDelExtra('sonidoExtras', xid)}
              />
            )}
          </div>
        </div>
      ))}
    </>
  )
}

/* ═══ VISITA (agenda) ═══ */

function VisitaBlock({ finca, isPro, onVisita, onNotaEsperada }: {
  finca: Finca
  isPro: boolean
  onVisita: (p: Partial<FincaVisita>) => void
  onNotaEsperada: (n: number) => void
}) {
  const v = { ...VISITA_VACIA, ...(finca.visita || {}) }
  const lista = !!(v.fecha && v.hora)
  return (
    <div className="finca-block">
      <div className="finca-block-head">
        <span className="fb-icon">📅</span>
        <span className="fb-title">Visita</span>
      </div>
      <div className="finca-block-body">
        <div className="fv-grid">
          <div className="fg"><label className="fl">Día</label>
            <input className="fi2" type="date" value={v.fecha} onChange={e => onVisita({ fecha: e.target.value })} /></div>
          <div className="fg"><label className="fl">Hora</label>
            <input className="fi2" type="time" value={v.hora} onChange={e => onVisita({ hora: e.target.value })} /></div>
          <div className="fg"><label className="fl">Persona de contacto</label>
            <input className="fi2" type="text" value={v.contacto} placeholder="Marta, coordinadora"
              onChange={e => onVisita({ contacto: e.target.value })} /></div>
          <div className="fg"><label className="fl">Teléfono</label>
            <input className="fi2" type="tel" value={v.telefono} placeholder="600 00 00 00"
              onChange={e => onVisita({ telefono: e.target.value })} /></div>
        </div>
        <div className="fg">
          <label className="fl">Qué queréis preguntar o ver</label>
          <textarea className="ft2" value={v.notas}
            placeholder="Hora de cierre, plan B si llueve, exclusividades, si se puede ver montada…"
            onChange={e => onVisita({ notas: e.target.value })} />
        </div>

        {lista ? (
          <div className="fv-cal">
            <a className="fv-btn" href={enlaceGoogleCalendar(finca, v)} target="_blank" rel="noopener noreferrer">
              Añadir a Google Calendar
            </a>
            <button type="button" className="fv-btn ghost" onClick={() => descargarIcs(finca, v)}>
              Añadir a otro calendario
            </button>
          </div>
        ) : (
          <p className="fv-hint">Elige día y hora para añadir la visita a tu calendario.</p>
        )}

        {isPro && (
          <div className="fv-expect">
            <div className="expect-label">Primera impresión</div>
            <div className="expect-hint">Según fotos, web y dosier. Después de la visita podrás compararla con lo que visteis.</div>
            <Score value={finca.notaEsperada} onChange={onNotaEsperada} />
          </div>
        )}
      </div>
    </div>
  )
}

function esPendiente(f: Finca): boolean {
  return f.estado === 'pendiente'
}

function claveVisita(f: Finca): string {
  const v = f.visita
  return v?.fecha ? `${v.fecha}T${v.hora || '00:00'}` : '9999'
}

function textoVisita(v?: FincaVisita): { texto: string; pasada: boolean } {
  if (!v?.fecha) return { texto: 'Sin fecha de visita', pasada: false }
  const d = new Date(`${v.fecha}T${v.hora || '12:00'}:00`)
  if (isNaN(d.getTime())) return { texto: 'Sin fecha de visita', pasada: false }
  const dia = d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
  const pasada = d.getTime() < Date.now()
  const base = `${dia}${v.hora ? ` a las ${v.hora}` : ''}`
  return { texto: pasada ? `${base}. ¿Ya la visitasteis?` : base, pasada }
}

function distanciaTexto(f: Finca): string {
  const km = (f.campos.distancia || '').trim()
  const min = (f.campos.tiempo || '').trim()
  return [km && `${km} km`, min && `${min} min`].filter(Boolean).join(' · ')
}

function mapaFinca(f: Finca, ruta: boolean): string {
  const destino = encodeURIComponent((f.campos.direccion || f.nombre || '').trim())
  return ruta
    ? `https://www.google.com/maps/dir/?api=1&destination=${destino}`
    : `https://www.google.com/maps/search/?api=1&query=${destino}`
}

// Fecha para calendarios (hora local, sin zona): 20271012T110000
function fechaCalendario(fecha: string, hora: string, sumarMin = 0): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d, hh, mm + sumarMin))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${t.getUTCFullYear()}${p(t.getUTCMonth() + 1)}${p(t.getUTCDate())}T${p(t.getUTCHours())}${p(t.getUTCMinutes())}00`
}

function detallesVisita(v: FincaVisita): string {
  return [
    v.contacto && `Contacto: ${v.contacto}`,
    v.telefono && `Teléfono: ${v.telefono}`,
    v.notas && `\n${v.notas}`,
    '\nOrganizado con Enlace · enlaceboda.es',
  ].filter(Boolean).join('\n')
}

function enlaceGoogleCalendar(f: Finca, v: FincaVisita): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Visita a ${f.nombre || 'la finca'}`,
    dates: `${fechaCalendario(v.fecha, v.hora)}/${fechaCalendario(v.fecha, v.hora, 90)}`,
    ctz: 'Europe/Madrid',
    details: detallesVisita(v),
    location: f.campos.direccion || f.nombre || '',
  })
  return `https://calendar.google.com/calendar/render?${q.toString()}`
}

function descargarIcs(f: Finca, v: FincaVisita) {
  const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, m => '\\' + m).replace(/\n/g, '\\n')
  const ahora = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z'
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Enlace//Visitas//ES', 'BEGIN:VEVENT',
    `UID:${f.id}@enlaceboda.es`, `DTSTAMP:${ahora}`,
    `DTSTART:${fechaCalendario(v.fecha, v.hora)}`, `DTEND:${fechaCalendario(v.fecha, v.hora, 90)}`,
    `SUMMARY:${esc(`Visita a ${f.nombre || 'la finca'}`)}`,
    `LOCATION:${esc(f.campos.direccion || f.nombre || '')}`,
    `DESCRIPTION:${esc(detallesVisita(v))}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `visita-${(f.nombre || 'finca').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-')}.ics`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/* ═══ FILA DE CAMPO ═══ */

function CampoRow({ campo, valor, planBValor, nota, isPro, onValor, onPlanB, onNota }: {
  campo: Campo
  valor: string
  planBValor?: string
  nota: number | null
  isPro: boolean
  onValor: (v: string) => void
  onPlanB?: (v: string) => void
  onNota: (n: number) => void
}) {
  const [showPlanB, setShowPlanB] = useState(!!planBValor)

  return (
    <div className="campo-row">
      <div className="campo-input">
        <div className="campo-label-row">
          <label className="fl">
            {campo.label}
            {campo.coste && <span className="campo-coste-tag">suma al total</span>}
          </label>
          {campo.planB && onPlanB && (
            <button className="campo-planb-btn" onClick={() => setShowPlanB(v => !v)}>
              {showPlanB ? '– Plan B' : '+ Plan B'}
            </button>
          )}
        </div>
        <input className="fi2"
          type={campo.tipo === 'numero' ? 'number' : 'text'}
          value={valor} placeholder={campo.ph}
          onChange={e => onValor(e.target.value)} />
        {showPlanB && onPlanB !== undefined && (
          <div style={{ marginTop: 7 }}>
            <label className="fl" style={{ color: 'var(--gold)' }}>Plan B si llueve / alternativa</label>
            <input className="fi2 planb-input" type="text" value={planBValor || ''}
              placeholder="Salón interior con capacidad para todos"
              onChange={e => onPlanB(e.target.value)} />
          </div>
        )}
      </div>
      {isPro && (
        <div className="campo-score">
          <div className="campo-score-label">Nota</div>
          <Score value={nota} onChange={onNota} compact withIgnore />
        </div>
      )}
    </div>
  )
}

/* ═══ LISTA DE EXTRAS ═══ */

function ExtraList({ titulo, hint, items, ph, isPro, onAdd, onUpd, onDel }: {
  titulo: string
  hint: string
  items: FincaExtra[]
  ph: string
  isPro: boolean
  onAdd: () => void
  onUpd: (xid: string, p: Partial<FincaExtra>) => void
  onDel: (xid: string) => void
}) {
  const invitados = 0
  const suma = items.reduce((s, x) => {
    const v = parseFloat(x.coste) || 0
    return s + v
  }, 0)

  return (
    <div className="finca-subblock">
      <div className="finca-subhead">
        <div>
          <div className="finca-subtitle">{titulo}</div>
          <div className="finca-subhint">{hint}</div>
        </div>
        <button className="btn-ghost" onClick={onAdd}>+ Añadir</button>
      </div>

      {items.length === 0 ? (
        <div className="extra-empty">Sin elementos añadidos</div>
      ) : (
        <div className="extra-list">
          {items.map(x => (
            <div key={x.id} className="extra-row-full">
              <div className="extra-main">
                <input className="extra-name" value={x.nombre} placeholder={ph}
                  onChange={e => onUpd(x.id, { nombre: e.target.value })} />
                <div className="extra-price-group">
                  <input className="extra-cost" type="number" value={x.coste} placeholder="0"
                    onChange={e => onUpd(x.id, { coste: e.target.value })} />
                  <select className="extra-tipo"
                    value={x.tipoPrecio || 'total'}
                    onChange={e => onUpd(x.id, { tipoPrecio: e.target.value as 'total' | 'porPersona' })}>
                    <option value="total">€ total</option>
                    <option value="porPersona">€/persona</option>
                  </select>
                  <button className="extra-del" onClick={() => onDel(x.id)}>×</button>
                </div>
              </div>
              {isPro && (
                <div className="extra-score-row">
                  <span className="campo-score-label" style={{ marginRight: 7 }}>Nota</span>
                  <Score
                    value={x.nota}
                    onChange={n => onUpd(x.id, { nota: x.nota === n && n !== 0 ? null : n })}
                    compact
                    withIgnore
                  />
                </div>
              )}
            </div>
          ))}
          {suma > 0 && (
            <div className="extra-sum">
              Suma: <strong>{suma.toLocaleString('es-ES')} €</strong>
              <span className="extra-sum-hint"> (sin contar los €/persona)</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══ SELECTOR DE PUNTUACIÓN ═══ */

function Score({ value, onChange, compact, withIgnore }: {
  value: number | null
  onChange: (n: number) => void
  compact?: boolean
  withIgnore?: boolean
}) {
  return (
    <div className={`score ${compact ? 'compact' : ''}`}>
      {withIgnore && (
        <button
          className={`score-ignore ${value === 0 ? 'on' : ''}`}
          onClick={() => onChange(0)}
          title="Me da igual / no contabilizar">
          —
        </button>
      )}
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button key={n}
          className={`score-dot ${value !== null && value > 0 && n <= value ? `on ${scoreClass(value)}` : ''}`}
          onClick={() => onChange(n)}
          title={`${n} de 10`}>
          <span className="score-num">{n}</span>
        </button>
      ))}
      {value !== null && value > 0 && (
        <span className={`score-val ${scoreClass(value)}`}>{value}</span>
      )}
      {value === 0 && (
        <span className="score-val-ignore">igual</span>
      )}
    </div>
  )
}

/* ═══ SUBCOMPONENTE UTILIDAD ═══ */

function SumItem({ label, val, valClass, sub }: {
  label: string; val: string; valClass?: string; sub: string
}) {
  return (
    <div className="fsum-item">
      <div className="fsum-label">{label}</div>
      <div className={`fsum-val ${valClass || ''}`}>{val}</div>
      <div className="fsum-sub">{sub}</div>
    </div>
  )
}

/* ═══ CÁLCULOS ═══ */

function calcTotal(f: Finca, invitados: number): number {
  let total = 0

  for (const g of GRUPOS) {
    for (const c of g.campos) {
      if (!c.coste) continue
      const v = parseFloat(f.campos[c.k] || '0') || 0
      if (!v) continue
      if (c.coste === 'porInvitado') {
        total += v * invitados
      } else if (c.xCampo) {
        const n = parseFloat(f.campos[c.xCampo] || '0') || 0
        total += v * n
      } else {
        total += v
      }
    }
  }

  const extras = [...f.exclusividades, ...f.cornersExtra, ...f.sonidoExtras]
  for (const x of extras) {
    const v = parseFloat(x.coste) || 0
    if (x.tipoPrecio === 'porPersona') total += v * invitados
    else total += v
  }

  return total
}

function notaMedia(f: Finca): number | null {
  const vals: number[] = Object.values(f.notas).filter(n => n > 0)
  if (f.notaReal !== null && f.notaReal > 0) vals.push(f.notaReal)

  const extras = [...f.exclusividades, ...f.cornersExtra, ...f.sonidoExtras]
  for (const x of extras) if (x.nota !== null && x.nota > 0) vals.push(x.nota)

  if (!vals.length) return null
  return +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function grupoNota(f: Finca, claves: string[]): string {
  const vals = claves.map(k => f.notas[k]).filter(n => n !== undefined && n > 0) as number[]
  if (!vals.length) return ''
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function scoreClass(n: number | null): string {
  if (n === null || n === 0) return ''
  if (n >= 8) return 'good'
  if (n >= 5) return 'mid'
  return 'bad'
}
