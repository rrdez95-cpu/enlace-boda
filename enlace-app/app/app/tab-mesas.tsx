'use client'

import { useState } from 'react'
import { BodaData, Guest, Mesa } from '@/lib/types'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  isPro: boolean
  freeLimit: number
  onPaywall: () => void
  showToast: (m: string) => void
}

export default function TabMesas({ data, setData, isPro, freeLimit, onPaywall, showToast }: Props) {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [relacion, setRelacion] = useState('')
  const [openDetail, setOpenDetail] = useState<number | null>(null)
  const [dragId, setDragId] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)
  const [modal, setModal] = useState(false)
  const [mNombre, setMNombre] = useState('')
  const [mCap, setMCap] = useState(10)
  const [mShape, setMShape] = useState<'round' | 'rect'>('round')

  const pool = data.guests.filter(g => g.mesaId === null)

  function addGuest() {
    if (!nombre.trim()) { showToast('Escribe el nombre del invitado'); return }
    if (!isPro && data.guests.length >= freeLimit) {
      onPaywall()
      showToast(`Límite de ${freeLimit} invitados en el plan gratuito`)
      return
    }
    setData(d => ({
      ...d,
      guests: [...d.guests, {
        id: d.gid, nombre: nombre.trim(), apellido: apellido.trim(),
        relacion: relacion.trim(), mesaId: null, paid: 'pendiente',
        importe: '', intolerancia: '',
      }],
      gid: d.gid + 1,
    }))
    setNombre(''); setApellido(''); setRelacion('')
    showToast('Invitado añadido')
  }

  function updateGuest(id: number, patch: Partial<Guest>) {
    setData(d => ({
      ...d,
      guests: d.guests.map(g => g.id === id ? { ...g, ...patch } : g),
    }))
  }

  function deleteGuest(id: number) {
    setData(d => ({ ...d, guests: d.guests.filter(g => g.id !== id) }))
    showToast('Invitado eliminado')
  }

  function createMesa() {
    const n = mNombre.trim() || `Mesa ${data.mesas.length + 1}`
    setData(d => ({
      ...d,
      mesas: [...d.mesas, {
        id: d.mid, nombre: n, cap: mCap, shape: mShape,
        x: 200 + (d.mesas.length % 4) * 240,
        y: 150 + Math.floor(d.mesas.length / 4) * 220,
      }],
      mid: d.mid + 1,
    }))
    setModal(false); setMNombre(''); setMCap(10)
    showToast(`${n} creada`)
  }

  function deleteMesa(id: number) {
    setData(d => ({
      ...d,
      mesas: d.mesas.filter(m => m.id !== id),
      guests: d.guests.map(g => g.mesaId === id ? { ...g, mesaId: null } : g),
    }))
  }

  function updateMesa(id: number, patch: Partial<Mesa>) {
    setData(d => ({ ...d, mesas: d.mesas.map(m => m.id === id ? { ...m, ...patch } : m) }))
  }

  function dropOnMesa(mesaId: number) {
    if (dragId === null) return
    const mesa = data.mesas.find(m => m.id === mesaId)
    if (!mesa) return
    const count = data.guests.filter(g => g.mesaId === mesaId).length
    if (count >= mesa.cap) { showToast('Mesa completa'); setDragId(null); setDragOver(null); return }
    updateGuest(dragId, { mesaId })
    setDragId(null); setDragOver(null)
  }

  function dropOnPool() {
    if (dragId === null) return
    updateGuest(dragId, { mesaId: null })
    setDragId(null)
  }

  const remaining = freeLimit - data.guests.length

  return (
    <div className="screen">
      {/* SIDEBAR */}
      <aside className="mesas-sidebar">
        <div className="sidebar-head">
          <div className="sidebar-title">Añadir invitado</div>
          <div className="add-guest-form">
            <input className="fi" placeholder="Nombre" value={nombre}
              onChange={e => setNombre(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGuest()} />
            <input className="fi" placeholder="Apellido" value={apellido}
              onChange={e => setApellido(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGuest()} />
            <input className="fi" placeholder="Relación (primo, amigo...)" value={relacion}
              onChange={e => setRelacion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addGuest()} />
            <button className="btn-add-guest" onClick={addGuest}>+ Añadir a la lista</button>
          </div>
        </div>

        <div className="guest-pool-label">
          <span>Sin asignar</span>
          <span style={{ color: 'var(--gold2)', fontWeight: 700 }}>{pool.length}</span>
        </div>

        <div className="guest-pool"
          onDragOver={e => e.preventDefault()}
          onDrop={dropOnPool}>
          {!isPro && remaining <= 10 && remaining > 0 && (
            <div className="limit-banner" onClick={onPaywall}>
              <span className="lb-icon">⚠</span>
              <span className="lb-text">Te quedan <strong>{remaining}</strong> invitados</span>
              <span className="lb-cta">Desbloquear</span>
            </div>
          )}
          {!isPro && remaining <= 0 && (
            <div className="limit-banner" onClick={onPaywall}>
              <span className="lb-icon">🔒</span>
              <span className="lb-text">Límite de {freeLimit} invitados</span>
              <span className="lb-cta">Desbloquear</span>
            </div>
          )}
          {pool.length === 0 ? (
            <div className="empty-pool">
              {data.guests.length === 0
                ? <>Añade invitados<br />y arrástralos a las mesas</>
                : <>Todos los invitados<br />están asignados ✓</>}
            </div>
          ) : pool.map(g => (
            <div key={g.id} className={`pool-guest ${dragId === g.id ? 'dragging' : ''}`}
              draggable
              onDragStart={() => setDragId(g.id)}
              onDragEnd={() => setDragId(null)}>
              <span className="drag-handle">⠿</span>
              <span className="pg-name">{g.nombre} {g.apellido}</span>
              <span className="pg-rel">{g.relacion}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* MAIN */}
      <main className="mesas-main">
        <div className="mesas-topbar">
          <div className="mesas-topbar-title">Distribución de mesas</div>
          <button className="btn-new-mesa" onClick={() => setModal(true)}>+ Nueva mesa</button>
        </div>

        <div className="mesas-grid">
          {data.mesas.length === 0 ? (
            <div style={{
              gridColumn: '1/-1', textAlign: 'center', padding: 48,
              color: 'var(--muted)', fontStyle: 'italic',
            }}>
              Crea tu primera mesa para empezar
            </div>
          ) : data.mesas.map((m, idx) => {
            const guests = data.guests.filter(g => g.mesaId === m.id)
            const pct = Math.min(guests.length / m.cap, 1) * 100
            const fc = guests.length > m.cap ? 'over' : guests.length === m.cap ? 'full' : ''
            const paid = guests.filter(g => g.paid === 'si').length
            const unpaid = guests.filter(g => g.paid === 'no').length

            return (
              <div key={m.id} className="mesa-card">
                <div className="mesa-header">
                  <div className="mesa-num">{idx + 1}</div>
                  <input className="mesa-name-input" value={m.nombre}
                    onChange={e => updateMesa(m.id, { nombre: e.target.value })} />
                  <div className="mesa-capacity">
                    <label>cap.</label>
                    <input className="mesa-cap-input" type="number" min={2} max={40} value={m.cap}
                      onChange={e => updateMesa(m.id, { cap: parseInt(e.target.value) || 10 })} />
                  </div>
                  <button className="mesa-delete" onClick={() => deleteMesa(m.id)}>×</button>
                </div>

                <div className="mesa-status-bar">
                  <div className={`mesa-status-fill ${fc}`} style={{ width: `${pct}%` }} />
                </div>

                <div className={`mesa-guests ${dragOver === m.id ? 'drag-over' : ''}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(m.id) }}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => dropOnMesa(m.id)}>
                  {guests.length === 0 ? (
                    <div className="empty-mesa">Arrastra invitados aquí</div>
                  ) : guests.map(g => (
                    <div key={g.id}>
                      <div className={`guest-row ${dragId === g.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={() => setDragId(g.id)}
                        onDragEnd={() => setDragId(null)}>
                        <span className="gr-handle">⠿</span>
                        <span className="gr-name">{g.nombre} {g.apellido}</span>
                        <span className="gr-rel">{g.relacion}</span>
                        <span className={`gr-paid ${g.paid === 'si' ? 'yes' : g.paid === 'no' ? 'no' : 'pending'}`} />
                        <button
                          className={`gr-expand ${openDetail === g.id ? 'open' : ''}`}
                          onClick={() => setOpenDetail(openDetail === g.id ? null : g.id)}>
                          ▾
                        </button>
                      </div>

                      {openDetail === g.id && (
                        <div className="guest-detail">
                          <div className="detail-grid">
                            <div className="detail-field">
                              <label className="detail-label">¿Ha pagado?</label>
                              <select className="detail-select" value={g.paid}
                                onChange={e => updateGuest(g.id, { paid: e.target.value as Guest['paid'] })}>
                                <option value="pendiente">Pendiente</option>
                                <option value="si">Sí</option>
                                <option value="no">No</option>
                              </select>
                            </div>
                            <div className="detail-field">
                              <label className="detail-label">Importe sobre</label>
                              <input className="detail-input" type="number" value={g.importe}
                                onChange={e => updateGuest(g.id, { importe: e.target.value })} />
                            </div>
                            <div className="detail-field full">
                              <label className="detail-label">Intolerancia / Alergia</label>
                              <input className="detail-input" value={g.intolerancia}
                                placeholder="Gluten, lactosa, marisco..."
                                onChange={e => updateGuest(g.id, { intolerancia: e.target.value })} />
                            </div>
                          </div>
                          <button className="detail-delete" onClick={() => deleteGuest(g.id)}>
                            Eliminar invitado
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mesa-footer">
                  <div className="mesa-count"><strong>{guests.length}</strong> / {m.cap} personas</div>
                  <div className="mesa-paid-summary">
                    {paid > 0 && <span className="ps-paid">{paid} pagado</span>}
                    {unpaid > 0 && <span className="ps-unpaid">{unpaid} pendiente</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      {/* MODAL NUEVA MESA */}
      {modal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setModal(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Nueva mesa</div>
              <button className="modal-close" onClick={() => setModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-row">
                <div className="modal-field">
                  <label className="modal-label">Nombre</label>
                  <input className="modal-input" placeholder="Mesa de honor"
                    value={mNombre} onChange={e => setMNombre(e.target.value)} />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Capacidad</label>
                  <input className="modal-input" type="number" min={2} max={40}
                    value={mCap} onChange={e => setMCap(parseInt(e.target.value) || 10)} />
                </div>
              </div>
              <div className="modal-field">
                <label className="modal-label">Forma</label>
                <select className="modal-select" value={mShape}
                  onChange={e => setMShape(e.target.value as 'round' | 'rect')}>
                  <option value="round">Redonda</option>
                  <option value="rect">Rectangular</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setModal(false)}>Cancelar</button>
              <button className="btn-save" onClick={createMesa}>Crear mesa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}