'use client'

import { useState } from 'react'
import { BodaData, Evento, Bus } from '@/lib/types'

const CAT_EMOJIS: Record<string, string> = {
  ceremonia: '⛪', coctel: '🥂', banquete: '🍽️',
  musica: '🎶', foto: '📷', autobus: '🚌', otro: '✦',
}

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  isPro: boolean
  freeLimit: number
  onPaywall: () => void
  showToast: (m: string) => void
}

export default function TabCrono({ data, setData, isPro, freeLimit, onPaywall, showToast }: Props) {
  const [modal, setModal] = useState(false)
  const [evNombre, setEvNombre] = useState('')
  const [evHora, setEvHora] = useState('12:00')
  const [evDur, setEvDur] = useState('')
  const [evCat, setEvCat] = useState('ceremonia')
  const [evDesc, setEvDesc] = useState('')

  function createEvento() {
    if (!evNombre.trim()) { showToast('Escribe el nombre del momento'); return }
    if (!isPro && data.eventos.length >= freeLimit) {
      onPaywall()
      showToast(`Límite de ${freeLimit} momentos en el plan gratuito`)
      return
    }
    setData(d => ({
      ...d,
      eventos: [...d.eventos, {
        id: d.eid, nombre: evNombre.trim(), hora: evHora,
        duracion: evDur.trim(), cat: evCat, desc: evDesc.trim(),
        emoji: CAT_EMOJIS[evCat],
      }].sort((a, b) => a.hora.localeCompare(b.hora)),
      eid: d.eid + 1,
    }))
    setModal(false); setEvNombre(''); setEvDur(''); setEvDesc('')
    showToast('Momento añadido')
  }

  function deleteEvento(id: number) {
    setData(d => {
      const buses = { ...d.eventosBuses }
      delete buses[String(id)]
      return { ...d, eventos: d.eventos.filter(e => e.id !== id), eventosBuses: buses }
    })
  }

  const remaining = freeLimit - data.eventos.length

  return (
    <div className="screen">
      <main className="crono-main">
        <div className="crono-header">
          <div>
            <div className="crono-title">Orden del día</div>
            <div className="crono-date-sub">
              {data.resumen?.fecha
                ? new Date(data.resumen.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
                : 'Fecha de la boda'}
            </div>
          </div>
          <button className="btn-add-evento" onClick={() => setModal(true)}>
            + Añadir momento
          </button>
        </div>

        {!isPro && remaining <= 2 && remaining > 0 && (
          <div className="limit-banner" onClick={onPaywall} style={{ marginBottom: 20 }}>
            <span className="lb-icon">⚠</span>
            <span className="lb-text">Te quedan <strong>{remaining}</strong> momentos</span>
            <span className="lb-cta">Desbloquear</span>
          </div>
        )}
        {!isPro && remaining <= 0 && (
          <div className="limit-banner" onClick={onPaywall} style={{ marginBottom: 20 }}>
            <span className="lb-icon">🔒</span>
            <span className="lb-text">Límite de {freeLimit} momentos en el plan gratuito</span>
            <span className="lb-cta">3,99 €</span>
          </div>
        )}

        <div className="timeline">
          {data.eventos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontStyle: 'italic' }}>
              Añade los momentos de tu boda
            </div>
          ) : data.eventos.map(ev => (
            <div key={ev.id} className="evento-item">
              <div className="evento-time">{ev.hora}</div>
              <div className={`evento-dot dot-${ev.cat}`} />
              <div className="evento-card">
                <div className="evento-emoji">{ev.emoji}</div>
                <div className="evento-info">
                  <div className="evento-nombre">{ev.nombre}</div>
                  {ev.desc && <div className="evento-desc">{ev.desc}</div>}
                  <div className="evento-meta">
                    <span className={`evento-chip cat-${ev.cat}`}>
                      {ev.cat.charAt(0).toUpperCase() + ev.cat.slice(1)}
                    </span>
                    {ev.duracion && (
                      <span className="evento-chip" style={{ background: 'rgba(0,0,0,.05)', color: 'var(--muted)' }}>
                        {ev.duracion}
                      </span>
                    )}
                  </div>
                </div>
                <div className="evento-actions">
                  <button className="evt-btn" onClick={() => deleteEvento(ev.id)}>×</button>
                </div>
              </div>

              {ev.cat === 'autobus' && (
                <BusPanel
                  eventoId={ev.id}
                  data={data}
                  setData={setData}
                  showToast={showToast}
                />
              )}
            </div>
          ))}
        </div>
      </main>

      <aside className="crono-sidebar">
        <div className="crono-sidebar-title">Resumen del día</div>
        {data.eventos.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--muted)', fontStyle: 'italic', paddingTop: 8 }}>
            Sin eventos aún
          </div>
        ) : data.eventos.map(ev => (
          <div key={ev.id} className="crono-summary-item">
            <div className="cs-emoji">{ev.emoji}</div>
            <div className="cs-info">
              <div className="cs-name">{ev.nombre}</div>
              <div className="cs-time">{ev.hora}{ev.duracion && ` · ${ev.duracion}`}</div>
            </div>
          </div>
        ))}
      </aside>

      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Añadir momento</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label className="modal-label">Nombre del momento</label>
                <input className="modal-input" placeholder="Ceremonia civil"
                  value={evNombre} onChange={e => setEvNombre(e.target.value)} />
              </div>
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label">Hora</label>
                  <input className="modal-input" type="time"
                    value={evHora} onChange={e => setEvHora(e.target.value)} />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Duración</label>
                  <input className="modal-input" placeholder="45 min"
                    value={evDur} onChange={e => setEvDur(e.target.value)} />
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Categoría</label>
                <select className="modal-select" value={evCat} onChange={e => setEvCat(e.target.value)}>
                  <option value="ceremonia">⛪ Ceremonia</option>
                  <option value="coctel">🥂 Cóctel</option>
                  <option value="banquete">🍽️ Banquete</option>
                  <option value="musica">🎶 Música / Baile</option>
                  <option value="foto">📷 Foto / Vídeo</option>
                  <option value="autobus">🚌 Autobús</option>
                  <option value="otro">✦ Otro</option>
                </select>
              </div>
              <div className="modal-field">
                <label className="modal-label">Notas</label>
                <input className="modal-input" placeholder="Detalles, encargados..."
                  value={evDesc} onChange={e => setEvDesc(e.target.value)} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={createEvento}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ═══ PANEL DE AUTOBUSES ═══ */
function BusPanel({ eventoId, data, setData, showToast }: {
  eventoId: number
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
}) {
  const key = String(eventoId)
  const buses = data.eventosBuses[key] || []
  const [dragGid, setDragGid] = useState<number | null>(null)
  const [dragSrc, setDragSrc] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)

  const assigned = new Set(buses.flatMap(b => b.passengerIds))
  const unassigned = data.guests.filter(g => !assigned.has(g.id))

  function setBuses(fn: (bs: Bus[]) => Bus[]) {
    setData(d => ({
      ...d,
      eventosBuses: { ...d.eventosBuses, [key]: fn(d.eventosBuses[key] || []) },
    }))
  }

  function addBus() {
    setBuses(bs => [...bs, {
      id: 'b' + Date.now(), nombre: `Autobús ${bs.length + 1}`, cap: 50,
      horaIda: '11:00', horaVuelta: '01:00', punto: '', empresa: '',
      passengerIds: [], activeDir: 'ida',
    }])
  }

  function updateBus(bid: string, patch: Partial<Bus>) {
    setBuses(bs => bs.map(b => b.id === bid ? { ...b, ...patch } : b))
  }

  function deleteBus(bid: string) {
    setBuses(bs => bs.filter(b => b.id !== bid))
  }

  function dropOnBus(bid: string) {
    if (dragGid === null) return
    const target = buses.find(b => b.id === bid)
    if (!target) return
    if (target.passengerIds.length >= target.cap) {
      showToast('Autobús completo'); setDragGid(null); setDragOver(null); return
    }
    setBuses(bs => bs.map(b => {
      if (b.id === dragSrc) return { ...b, passengerIds: b.passengerIds.filter(i => i !== dragGid) }
      if (b.id === bid) return { ...b, passengerIds: [...b.passengerIds, dragGid] }
      return b
    }))
    setDragGid(null); setDragSrc(null); setDragOver(null)
  }

  function dropOnPool() {
    if (dragGid === null || !dragSrc) return
    setBuses(bs => bs.map(b =>
      b.id === dragSrc ? { ...b, passengerIds: b.passengerIds.filter(i => i !== dragGid) } : b
    ))
    setDragGid(null); setDragSrc(null)
  }

  return (
    <div className="bus-panel">
      <div className="bus-panel-header">
        <div className="bus-panel-title">🚌 Gestión de autobuses</div>
        <button className="btn-new-bus" onClick={addBus}>+ Nuevo autobús</button>
      </div>
      <div className="bus-layout">
        <div className="bus-pool">
          <div className="bus-pool-title">Sin asignar · {unassigned.length}</div>
          <div className="bus-pool-list"
            onDragOver={e => e.preventDefault()}
            onDrop={dropOnPool}>
            {unassigned.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '12px 8px', color: 'var(--muted2)', fontSize: 11 }}>
                Todos asignados ✓
              </div>
            ) : unassigned.map(g => (
              <div key={g.id} className={`bus-pool-guest ${dragGid === g.id && !dragSrc ? 'dragging' : ''}`}
                draggable
                onDragStart={() => { setDragGid(g.id); setDragSrc(null) }}
                onDragEnd={() => { setDragGid(null); setDragSrc(null) }}>
                <span style={{ color: 'var(--muted2)', fontSize: 10 }}>⠿</span>
                <span className="bus-pg-name">{g.nombre} {g.apellido}</span>
                <span className="bus-pg-rel">{g.relacion}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bus-area">
          {buses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--muted)', fontStyle: 'italic', fontSize: 13 }}>
              Añade un autobús para empezar
            </div>
          ) : buses.map(b => {
            const pax = data.guests.filter(g => b.passengerIds.includes(g.id))
            const pct = Math.min(pax.length / b.cap, 1) * 100
            const fc = pax.length > b.cap ? 'over' : pax.length === b.cap ? 'full' : ''
            const dir = b.activeDir
            const horaVal = dir === 'ida' ? b.horaIda : b.horaVuelta
            const horaField = dir === 'ida' ? 'horaIda' : 'horaVuelta'

            return (
              <div key={b.id} className="bus-card">
                <div className="bus-card-header">
                  <span className="bus-card-icon">🚌</span>
                  <input className="bus-card-name" value={b.nombre}
                    onChange={e => updateBus(b.id, { nombre: e.target.value })} />
                  <div className="bus-card-cap">
                    <label>plazas</label>
                    <input className="bus-cap-input" type="number" min={1} max={70} value={b.cap}
                      onChange={e => updateBus(b.id, { cap: parseInt(e.target.value) || 50 })} />
                  </div>
                  <button className="bus-card-del" onClick={() => deleteBus(b.id)}>×</button>
                </div>

                <div className="bus-dir-tabs">
                  <button className={`bus-dir-tab ${dir === 'ida' ? 'active' : ''}`}
                    onClick={() => updateBus(b.id, { activeDir: 'ida' })}>
                    🟢 Ida · {b.horaIda}
                  </button>
                  <button className={`bus-dir-tab ${dir === 'vuelta' ? 'active' : ''}`}
                    onClick={() => updateBus(b.id, { activeDir: 'vuelta' })}>
                    🔴 Vuelta · {b.horaVuelta}
                  </button>
                </div>

                <div className="bus-info">
                  <div className="bus-info-field">
                    <div className="bus-info-lbl">{dir === 'ida' ? 'Hora salida' : 'Hora vuelta'}</div>
                    <input className="bus-info-inp" type="time" value={horaVal}
                      onChange={e => updateBus(b.id, { [horaField]: e.target.value } as Partial<Bus>)} />
                  </div>
                  <div className="bus-info-field" style={{ flex: 2 }}>
                    <div className="bus-info-lbl">Punto recogida</div>
                    <input className="bus-info-inp" value={b.punto} placeholder="Plaza España"
                      onChange={e => updateBus(b.id, { punto: e.target.value })} />
                  </div>
                  <div className="bus-info-field" style={{ flex: 2 }}>
                    <div className="bus-info-lbl">Empresa</div>
                    <input className="bus-info-inp" value={b.empresa} placeholder="Nombre + tlf"
                      onChange={e => updateBus(b.id, { empresa: e.target.value })} />
                  </div>
                </div>

                <div className="bus-status-bar">
                  <div className={`bus-status-fill ${fc}`} style={{ width: `${pct}%` }} />
                </div>

                <div className={`bus-passengers ${dragOver === b.id ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(b.id) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => dropOnBus(b.id)}>
                  {pax.length === 0 ? (
                    <div className="empty-bus">Arrastra invitados aquí</div>
                  ) : pax.map(g => (
                    <div key={g.id} className={`bus-passenger ${dragGid === g.id && dragSrc === b.id ? 'dragging' : ''}`}
                      draggable
                      onDragStart={() => { setDragGid(g.id); setDragSrc(b.id) }}
                      onDragEnd={() => { setDragGid(null); setDragSrc(null) }}>
                      <span style={{ color: 'var(--muted2)', fontSize: 10 }}>⠿</span>
                      <span className="bp-name">{g.nombre} {g.apellido}</span>
                      <span className="bp-rel">{g.relacion}</span>
                      <button className="bp-del"
                        onClick={() => updateBus(b.id, { passengerIds: b.passengerIds.filter(i => i !== g.id) })}>
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bus-footer">
                  <div className="bus-count"><strong>{pax.length}</strong> / {b.cap} pasajeros</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}