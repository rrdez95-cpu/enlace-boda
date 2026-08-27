'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { BodaData, Mesa } from '@/lib/types'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
}

export default function TabPlano({ data, setData, showToast }: Props) {
  const vpRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.45)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const panning = useRef(false)
  const panStart = useRef({ x: 0, y: 0 })
  const dragMesa = useRef<{ id: number; offX: number; offY: number } | null>(null)

  const resetZoom = useCallback(() => {
    const vp = vpRef.current
    if (!vp) return
    const z = Math.min(vp.clientWidth / 2400, vp.clientHeight / 1600) * 0.9
    setZoom(z)
    setPan({
      x: (vp.clientWidth - 2400 * z) / 2,
      y: (vp.clientHeight - 1600 * z) / 2,
    })
  }, [])

  useEffect(() => {
    const t = setTimeout(resetZoom, 100)
    return () => clearTimeout(t)
  }, [resetZoom])

  function updateMesa(id: number, patch: Partial<Mesa>) {
    setData(d => ({ ...d, mesas: d.mesas.map(m => m.id === id ? { ...m, ...patch } : m) }))
  }

  function autoLayout() {
    const cols = Math.ceil(Math.sqrt(data.mesas.length)) || 1
    setData(d => ({
      ...d,
      mesas: d.mesas.map((m, i) => ({
        ...m,
        x: 220 + (i % cols) * 240,
        y: 150 + Math.floor(i / cols) * 220,
      })),
    }))
    showToast('Distribución automática aplicada')
  }

  function toggleShape() {
    const next = data.mesas[0]?.shape === 'round' ? 'rect' : 'round'
    setData(d => ({ ...d, mesas: d.mesas.map(m => ({ ...m, shape: next })) }))
    showToast(`Forma: ${next === 'round' ? 'Redonda' : 'Rectangular'}`)
  }

  // Pan y drag de mesas
  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (dragMesa.current) {
        const vp = vpRef.current
        if (!vp) return
        const r = vp.getBoundingClientRect()
        const { id, offX, offY } = dragMesa.current
        updateMesa(id, {
          x: (e.clientX - r.left - pan.x) / zoom - offX,
          y: (e.clientY - r.top - pan.y) / zoom - offY,
        })
        return
      }
      if (panning.current) {
        setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y })
      }
    }
    function onUp() {
      dragMesa.current = null
      panning.current = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [pan, zoom])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const d = e.deltaY > 0 ? 0.9 : 1.1
    const vp = vpRef.current
    if (!vp) return
    const r = vp.getBoundingClientRect()
    const mx = e.clientX - r.left, my = e.clientY - r.top
    setPan(p => ({ x: mx - (mx - p.x) * d, y: my - (my - p.y) * d }))
    setZoom(z => Math.max(0.1, Math.min(3, z * d)))
  }

  return (
    <div className="plano-wrap">
      <div className="plano-toolbar">
        <span className="plano-toolbar-title">Plano del salón</span>
        <div className="toolbar-sep" />
        <button className="tool-btn" onClick={autoLayout}>⟳ Distribución automática</button>
        <button className="tool-btn" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>+ Acercar</button>
        <button className="tool-btn" onClick={() => setZoom(z => Math.max(z / 1.2, 0.1))}>− Alejar</button>
        <button className="tool-btn" onClick={resetZoom}>⊡ Encuadrar</button>
        <div className="toolbar-sep" />
        <button className="tool-btn" onClick={toggleShape}>⬤ Cambiar forma</button>
      </div>

      <div className="plano-viewport" ref={vpRef}
        onWheel={onWheel}
        onMouseDown={e => {
          if (dragMesa.current) return
          panning.current = true
          panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y }
        }}>
        <div className="plano-canvas"
          style={{ transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})` }}>
          <div className="room-outline">
            <div className="room-label">SALÓN DE CELEBRACIONES</div>
            <div className="dim-h"><div className="dim-h-label">ANCHO DEL SALÓN</div></div>
            <div className="dim-v"><div className="dim-v-label">LARGO DEL SALÓN</div></div>
          </div>

          {data.mesas.map((m, idx) => {
            const guests = data.guests.filter(g => g.mesaId === m.id)

            if (m.shape === 'round') {
              const tableR = 54, seatR = 7, orbitR = 68
              const totalW = 2 * (orbitR + seatR + 2)
              const cx = totalW / 2, cy = totalW / 2
              return (
                <div key={m.id} className="canvas-mesa"
                  style={{ left: m.x, top: m.y, width: totalW, height: totalW }}>
                  {Array.from({ length: m.cap }).map((_, i) => {
                    const a = (i / m.cap) * 2 * Math.PI - Math.PI / 2
                    return (
                      <div key={i}
                        className={`cm-seat ${i < guests.length ? 'occupied' : ''}`}
                        style={{
                          left: cx + orbitR * Math.cos(a) - seatR,
                          top: cy + orbitR * Math.sin(a) - seatR,
                          width: seatR * 2, height: seatR * 2,
                        }} />
                    )
                  })}
                  <div className="cm-body round"
                    style={{ width: tableR * 2, height: tableR * 2, left: cx - tableR, top: cy - tableR }}
                    onMouseDown={e => {
                      e.stopPropagation()
                      const el = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
                      dragMesa.current = {
                        id: m.id,
                        offX: (e.clientX - el.left) / zoom,
                        offY: (e.clientY - el.top) / zoom,
                      }
                    }}>
                    <div className="cm-number">Mesa {idx + 1}</div>
                    <div className="cm-name">{m.nombre}</div>
                    <div className="cm-count">{guests.length}/{m.cap}</div>
                  </div>
                </div>
              )
            }

            return (
              <div key={m.id} className="canvas-mesa"
                style={{ left: m.x, top: m.y, width: 140, height: 88 }}>
                <div className="cm-body rect"
                  style={{ width: 140, height: 88, left: 0, top: 0 }}
                  onMouseDown={e => {
                    e.stopPropagation()
                    const el = (e.currentTarget.parentElement as HTMLElement).getBoundingClientRect()
                    dragMesa.current = {
                      id: m.id,
                      offX: (e.clientX - el.left) / zoom,
                      offY: (e.clientY - el.top) / zoom,
                    }
                  }}>
                  <div className="cm-number">Mesa {idx + 1}</div>
                  <div className="cm-name">{m.nombre}</div>
                  <div className="cm-count">{guests.length}/{m.cap}</div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="plano-controls">
          <div className="plano-ctrl-group">
            <button className="pc-btn" onClick={() => setZoom(z => Math.min(z * 1.2, 3))}>+</button>
            <button className="pc-btn" onClick={() => setZoom(z => Math.max(z / 1.2, 0.1))}>−</button>
          </div>
          <div className="plano-ctrl-group">
            <button className="pc-btn" onClick={resetZoom}>⊡</button>
          </div>
        </div>

        <div className="plano-legend">
          <div className="legend-title">LEYENDA</div>
          <div className="legend-item"><div className="legend-swatch round" />Mesa redonda</div>
          <div className="legend-item"><div className="legend-swatch" />Mesa rectangular</div>
          <div className="legend-item" style={{ marginTop: 7, borderTop: '1px solid var(--border)', paddingTop: 7 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--charcoal3)', flexShrink: 0 }} />
            Asiento ocupado
          </div>
          <div className="legend-item">
            <div style={{ width: 8, height: 8, borderRadius: '50%', border: '1.5px solid var(--charcoal3)', background: 'var(--ivory2)', flexShrink: 0 }} />
            Asiento libre
          </div>
        </div>

        <div className="plano-compass">N</div>
      </div>
    </div>
  )
}