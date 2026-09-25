'use client'

import { useState } from 'react'
import { BodaData, Finca, FincaExtra } from '@/lib/types'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
}

/* ═══ CONFIGURACIÓN DE CAMPOS ═══ */

type Campo = {
  k: string
  label: string
  ph?: string
  /** El valor es un coste que entra en el total */
  coste?: 'total' | 'porInvitado'
  /** Multiplicador: clave de otro campo con el nº de unidades */
  xCampo?: string
  tipo?: 'texto' | 'numero' | 'si-no'
}

const GRUPOS: { id: string; icon: string; titulo: string; campos: Campo[] }[] = [
  {
    id: 'finca', icon: '🌿', titulo: 'Finca',
    campos: [
      { k: 'alquiler', label: 'Alquiler de la finca (€)', ph: '0 si va incluido', coste: 'total', tipo: 'numero' },
      { k: 'minPersonas', label: 'Mínimo de personas', ph: '100', tipo: 'numero' },
      { k: 'horarios', label: 'Horario de la finca', ph: '12:00 a 01:00' },
      { k: 'ampliacionHoras', label: 'Ampliación de horario', ph: '2 h hasta las 03:00' },
      { k: 'ampliacionCoste', label: 'Coste de la ampliación (€)', ph: '600', coste: 'total', tipo: 'numero' },
      { k: 'habitacionNovios', label: 'Habitación para los novios', ph: 'Suite incluida / 200 € aparte' },
      { k: 'coordinacion', label: 'Coordinación incluida', ph: 'Sí, coordinadora el día B' },
      { k: 'parking', label: 'Parking', ph: '80 plazas, iluminado' },
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
      { k: 'asientosCeremonia', label: 'Nº de asientos incluidos', ph: '120', tipo: 'numero' },
      { k: 'numSillaExtra', label: 'Nº de sillas extra necesarias', ph: '30', tipo: 'numero' },
      { k: 'costeSillaExtra', label: 'Coste por silla extra (€)', ph: '4', coste: 'total', xCampo: 'numSillaExtra', tipo: 'numero' },
      { k: 'tasasCeremonia', label: 'Tasas de ceremonia (€)', ph: '150', coste: 'total', tipo: 'numero' },
      { k: 'floresCeremonia', label: 'Flores y decoración incluidas', ph: 'Arco floral incluido' },
    ],
  },
]

const CONTRATO: Campo[] = [
  { k: 'formaReserva', label: 'Forma de reserva', ph: 'Señal de 2.000 € no reembolsable' },
  { k: 'formaPago', label: 'Calendario de pagos', ph: '50% a 6 meses, resto 15 días antes' },
]

/* ═══ COMPONENTE ═══ */

export default function TabFincas({ data, setData, showToast }: Props) {
  const fincas = data.fincas || []
  const [selId, setSelId] = useState<string | null>(fincas[0]?.id ?? null)
  const invitados = parseInt(data.resumen?.totalInv || '0') || 0

  const sel = fincas.find(f => f.id === selId) || null

  function addFinca() {
    const id = 'f' + Date.now()
    const nueva: Finca = {
      id,
      nombre: `Finca ${fincas.length + 1}`,
      notaEsperada: null,
      notaReal: null,
      campos: {},
      notas: {},
      exclusividades: [],
      cornersExtra: [],
      sonidoExtras: [],
    }
    setData(d => ({ ...d, fincas: [...(d.fincas || []), nueva] }))
    setSelId(id)
    showToast('Finca añadida')
  }

  function updFinca(id: string, patch: Partial<Finca>) {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f => f.id === id ? { ...f, ...patch } : f),
    }))
  }

  function delFinca(id: string) {
    setData(d => ({ ...d, fincas: (d.fincas || []).filter(f => f.id !== id) }))
    setSelId(prev => prev === id ? (fincas.find(f => f.id !== id)?.id ?? null) : prev)
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
        if (notas[k] === n) delete notas[k]   // volver a pulsar quita la nota
        else notas[k] = n
        return { ...f, notas }
      }),
    }))
  }

  function addExtra(id: string, lista: 'exclusividades' | 'cornersExtra' | 'sonidoExtras') {
    setData(d => ({
      ...d,
      fincas: (d.fincas || []).map(f => f.id === id
        ? { ...f, [lista]: [...f[lista], { id: 'x' + Date.now(), nombre: '', coste: '' }] }
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

      {/* ═══ LISTA LATERAL ═══ */}
      <aside className="fincas-side">
        <div className="fincas-side-head">
          <div className="fincas-side-title">Fincas</div>
          <button className="btn-new-finca" onClick={addFinca}>+ Añadir</button>
        </div>

        {invitados === 0 && (
          <div className="fincas-warn">
            Pon el nº de invitados en <strong>Resumen general</strong> para calcular
            el coste por persona.
          </div>
        )}

        <div className="fincas-list">
          {fincas.length === 0 ? (
            <div className="fincas-empty">
              Añade la primera finca<br />para empezar a comparar
            </div>
          ) : fincas.map(f => {
            const total = calcTotal(f, invitados)
            const porInv = invitados > 0 ? total / invitados : 0
            const media = notaMedia(f)
            return (
              <div key={f.id}
                className={`finca-item ${selId === f.id ? 'active' : ''}`}
                onClick={() => setSelId(f.id)}>
                <div className="finca-item-name">{f.nombre || 'Sin nombre'}</div>
                <div className="finca-item-row">
                  <span className="finca-item-price">
                    {porInv > 0 ? `${Math.round(porInv).toLocaleString('es-ES')} €` : '— €'}
                    <span className="finca-item-unit">/inv</span>
                  </span>
                  <span className={`finca-item-score ${scoreClass(media)}`}>
                    {media !== null ? media.toFixed(1) : '—'}
                  </span>
                </div>
                <div className="finca-item-total">
                  Total {total > 0 ? `${Math.round(total).toLocaleString('es-ES')} €` : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </aside>

      {/* ═══ DETALLE ═══ */}
      <div className="fincas-main">
        {!sel ? (
          <div className="fincas-none">
            <div className="fincas-none-icon">🌿</div>
            <div className="fincas-none-title">Compara tus fincas sin Excel</div>
            <p className="fincas-none-text">
              Añade cada finca que visites, rellena lo que te cuenten y puntúa
              cada apartado del 1 al 10. Enlace calcula el coste real por invitado
              y te dice cuál sale mejor por precio y cuál por puntuación.
            </p>
            <button className="btn-new-finca big" onClick={addFinca}>
              + Añadir primera finca
            </button>
          </div>
        ) : (
          <FincaDetalle
            finca={sel}
            invitados={invitados}
            onNombre={v => updFinca(sel.id, { nombre: v })}
            onDel={() => delFinca(sel.id)}
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

/* ═══ DETALLE DE UNA FINCA ═══ */

function FincaDetalle({
  finca, invitados, onNombre, onDel, onCampo, onNota, onNotaGlobal,
  onAddExtra, onUpdExtra, onDelExtra,
}: {
  finca: Finca
  invitados: number
  onNombre: (v: string) => void
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
  const dif = esp !== null && real !== null ? real - esp : null

  return (
    <>
      {/* Cabecera */}
      <div className="finca-head">
        <input className="finca-name-input" value={finca.nombre}
          placeholder="Nombre de la finca"
          onChange={e => onNombre(e.target.value)} />
        <button className="finca-del" onClick={onDel}>Eliminar</button>
      </div>

      {/* Resumen */}
      <div className="finca-summary">
        <div className="fsum-item">
          <div className="fsum-label">Coste por invitado</div>
          <div className="fsum-val">
            {porInv > 0 ? `${Math.round(porInv).toLocaleString('es-ES')} €` : '— €'}
          </div>
          <div className="fsum-sub">
            {invitados > 0 ? `Para ${invitados} invitados` : 'Falta el nº de invitados'}
          </div>
        </div>
        <div className="fsum-sep" />
        <div className="fsum-item">
          <div className="fsum-label">Coste total</div>
          <div className="fsum-val">
            {total > 0 ? `${Math.round(total).toLocaleString('es-ES')} €` : '— €'}
          </div>
          <div className="fsum-sub">Suma de todos los conceptos</div>
        </div>
        <div className="fsum-sep" />
        <div className="fsum-item">
          <div className="fsum-label">Puntuación media</div>
          <div className={`fsum-val ${scoreClass(media)}`}>
            {media !== null ? media.toFixed(1) : '—'}
          </div>
          <div className="fsum-sub">
            {Object.keys(finca.notas).length} apartado{Object.keys(finca.notas).length === 1 ? '' : 's'} puntuado{Object.keys(finca.notas).length === 1 ? '' : 's'}
          </div>
        </div>
      </div>

      {/* Esperado vs real */}
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
              {dif > 1.5 && <>Sorpresa muy positiva. Supera con creces lo que esperabais <strong>(+{dif})</strong></>}
              {dif > 0 && dif <= 1.5 && <>Mejor en persona que en fotos <strong>(+{dif})</strong></>}
              {dif === 0 && <>Justo lo que esperabais. Las fotos eran fieles</>}
              {dif < 0 && dif >= -1.5 && <>Algo por debajo de lo esperado <strong>({dif})</strong></>}
              {dif < -1.5 && <>Decepción. Las fotos prometían bastante más <strong>({dif})</strong></>}
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

      {/* Grupos de campos */}
      {GRUPOS.map(g => (
        <div className="finca-block" key={g.id}>
          <div className="finca-block-head">
            <span className="fb-icon">{g.icon}</span>
            <span className="fb-title">{g.titulo}</span>
            <span className="fb-score">{grupoNota(finca, g.campos.map(c => c.k))}</span>
          </div>
          <div className="finca-block-body">
            {g.campos.map(c => (
              <CampoRow key={c.k}
                campo={c}
                valor={finca.campos[c.k] || ''}
                nota={finca.notas[c.k] ?? null}
                onValor={v => onCampo(c.k, v)}
                onNota={n => onNota(c.k, n)}
              />
            ))}

            {/* Exclusividades — solo en grupo finca */}
            {g.id === 'finca' && (
              <ExtraList
                titulo="Exclusividades"
                hint="Servicios que la finca te obliga a contratar con ellos. Cada uno suma al total."
                items={finca.exclusividades}
                ph="Foto y vídeo"
                onAdd={() => onAddExtra('exclusividades')}
                onUpd={(xid, p) => onUpdExtra('exclusividades', xid, p)}
                onDel={xid => onDelExtra('exclusividades', xid)}
              />
            )}

            {/* Contrato — solo en grupo finca */}
            {g.id === 'finca' && (
              <div className="finca-subblock">
                <div className="finca-subtitle">Contrato y pagos</div>
                {CONTRATO.map(c => (
                  <CampoRow key={c.k}
                    campo={c}
                    valor={finca.campos[c.k] || ''}
                    nota={finca.notas[c.k] ?? null}
                    onValor={v => onCampo(c.k, v)}
                    onNota={n => onNota(c.k, n)}
                  />
                ))}
              </div>
            )}

            {/* Corners extra — solo en menú */}
            {g.id === 'menu' && (
              <ExtraList
                titulo="Estaciones y corners adicionales"
                hint="Los que no van incluidos y quieres añadir. Suman al total."
                items={finca.cornersExtra}
                ph="Corner de sushi"
                onAdd={() => onAddExtra('cornersExtra')}
                onUpd={(xid, p) => onUpdExtra('cornersExtra', xid, p)}
                onDel={xid => onDelExtra('cornersExtra', xid)}
              />
            )}

            {/* Extras de sonido */}
            {g.id === 'sonido' && (
              <ExtraList
                titulo="Extras de sonido"
                hint="Iluminación, humo, pantallas, micros adicionales…"
                items={finca.sonidoExtras}
                ph="Iluminación de pista"
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

/* ═══ FILA DE CAMPO ═══ */

function CampoRow({ campo, valor, nota, onValor, onNota }: {
  campo: Campo
  valor: string
  nota: number | null
  onValor: (v: string) => void
  onNota: (n: number) => void
}) {
  return (
    <div className="campo-row">
      <div className="campo-input">
        <label className="fl">
          {campo.label}
          {campo.coste && <span className="campo-coste-tag">suma al total</span>}
        </label>
        <input className="fi2"
          type={campo.tipo === 'numero' ? 'number' : 'text'}
          value={valor} placeholder={campo.ph}
          onChange={e => onValor(e.target.value)} />
      </div>
      <div className="campo-score">
        <div className="campo-score-label">Nota</div>
        <Score value={nota} onChange={onNota} compact />
      </div>
    </div>
  )
}

/* ═══ LISTA DE EXTRAS ═══ */

function ExtraList({ titulo, hint, items, ph, onAdd, onUpd, onDel }: {
  titulo: string
  hint: string
  items: FincaExtra[]
  ph: string
  onAdd: () => void
  onUpd: (xid: string, p: Partial<FincaExtra>) => void
  onDel: (xid: string) => void
}) {
  const suma = items.reduce((s, x) => s + (parseFloat(x.coste) || 0), 0)
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
            <div key={x.id} className="extra-row">
              <input className="extra-name" value={x.nombre} placeholder={ph}
                onChange={e => onUpd(x.id, { nombre: e.target.value })} />
              <input className="extra-cost" type="number" value={x.coste} placeholder="0"
                onChange={e => onUpd(x.id, { coste: e.target.value })} />
              <span className="extra-eur">€</span>
              <button className="extra-del" onClick={() => onDel(x.id)}>×</button>
            </div>
          ))}
          {suma > 0 && (
            <div className="extra-sum">
              Suma: <strong>{suma.toLocaleString('es-ES')} €</strong>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══ SELECTOR DE PUNTUACIÓN ═══ */

function Score({ value, onChange, compact }: {
  value: number | null
  onChange: (n: number) => void
  compact?: boolean
}) {
  return (
    <div className={`score ${compact ? 'compact' : ''}`}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
        <button key={n}
          className={`score-dot ${value !== null && n <= value ? `on ${scoreClass(value)}` : ''}`}
          onClick={() => onChange(n)}
          title={`${n} de 10`}>
          <span className="score-num">{n}</span>
        </button>
      ))}
      {value !== null && (
        <span className={`score-val ${scoreClass(value)}`}>{value}</span>
      )}
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
  for (const x of extras) total += parseFloat(x.coste) || 0

  return total
}

function notaMedia(f: Finca): number | null {
  const vals = Object.values(f.notas)
  if (f.notaReal !== null) vals.push(f.notaReal)
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

function grupoNota(f: Finca, claves: string[]): string {
  const vals = claves.map(k => f.notas[k]).filter(n => n !== undefined) as number[]
  if (!vals.length) return ''
  const m = vals.reduce((a, b) => a + b, 0) / vals.length
  return m.toFixed(1)
}

function scoreClass(n: number | null): string {
  if (n === null) return ''
  if (n >= 8) return 'good'
  if (n >= 5) return 'mid'
  return 'bad'
}