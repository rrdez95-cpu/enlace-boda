'use client'

import { useState, useEffect, useRef } from 'react'
import { BodaData, InvitacionConfig, InvitacionTema, RsvpResponse } from '@/lib/types'
import { createClient } from '@/lib/supabase-client'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
  userId: string
  bodaId: string
  isPremium: boolean
  onPaywall: () => void
}

const TEMAS: { id: InvitacionTema; label: string; color: string; desc: string }[] = [
  { id: 'marfil',  label: 'Marfil',  color: '#A0713A', desc: 'Clásico y elegante' },
  { id: 'jardin',  label: 'Jardín',  color: '#5B7A52', desc: 'Natural y botánico' },
  { id: 'marino',  label: 'Marino',  color: '#1B2A4A', desc: 'Formal y arquitectónico' },
  { id: 'rosa',    label: 'Rosa',    color: '#B87060', desc: 'Moderno y editorial' },
  { id: 'grafito', label: 'Grafito', color: '#222222', desc: 'Urbano y minimalista' },
]

const TEMA_VARS: Record<InvitacionTema, Record<string, string>> = {
  marfil:  { '--bg': '#F7F3ED', '--bg2': '#EEE8DF', '--ink': '#1A1714', '--ink2': '#5C5249', '--accent': '#A0713A', '--accent2': '#C49256', '--btn': '#1A1714', '--btnfg': '#F7F3ED' },
  jardin:  { '--bg': '#F0EBE2', '--bg2': '#E3DDD4', '--ink': '#263020', '--ink2': '#4E5E46', '--accent': '#5B7A52', '--accent2': '#8FAB85', '--btn': '#263020', '--btnfg': '#F0EBE2' },
  marino:  { '--bg': '#F3EFE7', '--bg2': '#E8E2D8', '--ink': '#1B2A4A', '--ink2': '#3A4E6C', '--accent': '#C4A05A', '--accent2': '#D8B878', '--btn': '#1B2A4A', '--btnfg': '#F3EFE7' },
  rosa:    { '--bg': '#FAF6F3', '--bg2': '#F2EAE5', '--ink': '#2E1F1C', '--ink2': '#7A5A54', '--accent': '#B87060', '--accent2': '#D49A8C', '--btn': '#2E1F1C', '--btnfg': '#FAF6F3' },
  grafito: { '--bg': '#FFFFFF', '--bg2': '#F4F4F4', '--ink': '#111111', '--ink2': '#555555', '--accent': '#111111', '--accent2': '#777777', '--btn': '#111111', '--btnfg': '#FFFFFF' },
}

function generateCodigo(novios: string, fecha: string): string {
  const year = fecha ? new Date(fecha).getFullYear() : new Date().getFullYear()
  const slug = novios.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '-')
  return `${slug}-${year}`
}

export default function TabInvitaciones({ data, setData, showToast, userId, bodaId, isPremium, onPaywall }: Props) {
  const supabase = createClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enlaceboda.es'

  // Config local (todos pueden tocar, premium guarda y publica)
  const [tema, setTema] = useState<InvitacionTema>(data.invitacion?.tema || 'marfil')
  const [mensaje, setMensaje] = useState(data.invitacion?.mensaje || 'Con mucha alegría os invitamos a celebrar nuestra boda.\nConfirmad vuestra asistencia antes del 1 de junio.')
  const [fechaLimite, setFechaLimite] = useState(data.invitacion?.fechaLimiteRsvp || '')
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([])
  const [loadingRsvp, setLoadingRsvp] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState<'portada' | 'foto2' | null>(null)
  const fileRef1 = useRef<HTMLInputElement | null>(null)
  const fileRef2 = useRef<HTMLInputElement | null>(null)

  const inv = data.invitacion
  const activa = inv?.activa || false
  const urlInvitacion = inv?.codigo ? `${siteUrl}/i/${inv.codigo}` : null

  // Sincronizar tema/mensaje al config real si es premium
  useEffect(() => {
    if (isPremium && data.invitacion) {
      setTema(data.invitacion.tema)
      setMensaje(data.invitacion.mensaje)
      setFechaLimite(data.invitacion.fechaLimiteRsvp || '')
    }
  }, [])

  useEffect(() => {
    if (isPremium && activa && bodaId) fetchRsvps()
  }, [activa, bodaId, isPremium])

  async function fetchRsvps() {
    setLoadingRsvp(true)
    const { data: rows } = await supabase
      .from('rsvp_responses').select('*').eq('boda_id', bodaId)
      .order('created_at', { ascending: false })
    setRsvps(rows || [])
    setLoadingRsvp(false)
  }

  function updInv(patch: Partial<InvitacionConfig>) {
    setData(d => ({ ...d, invitacion: { ...d.invitacion!, ...patch } }))
  }

  function aplicarYPublicar() {
    if (!isPremium) { onPaywall(); return }
    const novios = data.resumen?.novios || 'mi-boda'
    const fecha = data.resumen?.fecha || ''
    const codigo = inv?.codigo || generateCodigo(novios, fecha)
    const config: InvitacionConfig = {
      activa: true, codigo, tema, mensaje, fechaLimiteRsvp: fechaLimite,
      fotoPortada: inv?.fotoPortada, foto2: inv?.foto2,
    }
    setData(d => ({ ...d, invitacion: config }))
    showToast('¡Invitación publicada!')
  }

  function pausar() {
    if (!isPremium) return
    updInv({ activa: false })
    showToast('Invitación pausada')
  }

  async function uploadFoto(slot: 'portada' | 'foto2', file: File) {
    if (!isPremium) { onPaywall(); return }
    setUploadingFoto(slot)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${slot}-${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('invitaciones').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('invitaciones').getPublicUrl(path)
      updInv(slot === 'portada' ? { fotoPortada: urlData.publicUrl } : { foto2: urlData.publicUrl })
      showToast('Foto subida')
    } catch { showToast('Error al subir la foto') }
    setUploadingFoto(null)
  }

  async function importarRsvp(rsvp: RsvpResponse) {
    if (!rsvp.asiste) return
    setData(d => ({ ...d, guests: [...d.guests, {
      id: Date.now(), nombre: rsvp.nombre, apellido: rsvp.apellido || '',
      relacion: 'Invitado', mesaId: null, paid: 'pendiente' as const,
      importe: '', intolerancia: rsvp.intolerancia || '',
    }]}))
    await supabase.from('rsvp_responses').update({ importado: true }).eq('id', rsvp.id)
    setRsvps(rs => rs.map(r => r.id === rsvp.id ? { ...r, importado: true } : r))
    showToast(`${rsvp.nombre} añadido a la lista`)
  }

  const novios = data.resumen?.novios || 'Laura & Alejandro'
  const fecha = data.resumen?.fecha
  const fechaStr = fecha
    ? new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : '13 de Septiembre de 2027'
  const finca = data.resumen?.finca || 'Finca La Heredad'
  const vars = TEMA_VARS[tema]

  return (
    <div className="inv-layout">

      {/* ═══ PANEL IZQUIERDO: CONFIGURACIÓN ═══ */}
      <div className="inv-side">

        {/* Estado (solo si está publicada) */}
        {isPremium && activa && urlInvitacion && (
          <div className="inv-url-card">
            <div className="inv-url-head">
              <div className="inv-status-dot on" />
              <span className="inv-status-label">Publicada y activa</span>
              <button className="inv-toggle-btn" onClick={pausar}>Pausar</button>
            </div>
            <div className="inv-url-text">{urlInvitacion}</div>
            <div className="inv-url-actions">
              <button className="inv-url-btn" onClick={() => {
                navigator.clipboard.writeText(urlInvitacion)
                showToast('URL copiada')
              }}>Copiar enlace</button>
              <a className="inv-url-btn" href={urlInvitacion} target="_blank" rel="noopener noreferrer">
                Ver →
              </a>
            </div>
          </div>
        )}

        {/* Contador RSVP */}
        {isPremium && rsvps.length > 0 && (
          <div className="inv-counter">
            <div className="inv-counter-item green">
              <span className="inv-counter-num">{rsvps.filter(r => r.asiste).length}</span>
              <span className="inv-counter-label">confirman</span>
            </div>
            <div className="inv-counter-sep" />
            <div className="inv-counter-item red">
              <span className="inv-counter-num">{rsvps.filter(r => !r.asiste).length}</span>
              <span className="inv-counter-label">no pueden</span>
            </div>
            <div className="inv-counter-sep" />
            <div className="inv-counter-item gold">
              <span className="inv-counter-num">{rsvps.length}</span>
              <span className="inv-counter-label">total</span>
            </div>
          </div>
        )}

        {/* Selector de tema */}
        <div className="inv-block">
          <div className="inv-block-title">Estilo de la invitación</div>
          <div className="inv-temas">
            {TEMAS.map(t => (
              <div key={t.id}
                className={`inv-tema ${tema === t.id ? 'active' : ''}`}
                onClick={() => setTema(t.id)}>
                <div className="inv-tema-dot" style={{ background: t.color }} />
                <div>
                  <div className="inv-tema-label">{t.label}</div>
                  <div className="inv-tema-desc">{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensaje */}
        <div className="inv-block">
          <div className="inv-block-title">Mensaje de bienvenida</div>
          <textarea className="inv-textarea" value={mensaje}
            placeholder="Con mucha alegría os invitamos..."
            onChange={e => setMensaje(e.target.value)} />
        </div>

        {/* Fecha límite RSVP */}
        <div className="inv-block">
          <div className="inv-block-title">Fecha límite de confirmación</div>
          <input className="inv-input" type="date" value={fechaLimite}
            onChange={e => setFechaLimite(e.target.value)} />
        </div>

        {/* Fotos — solo premium puede subir */}
        <div className="inv-block">
          <div className="inv-block-title">
            Fotos
            {!isPremium && <span className="inv-block-lock"> · 🔒 requiere premium</span>}
          </div>
          <div className="inv-fotos">
            <FotoSlot label="Foto de portada" hint="Recomendado: horizontal, mínimo 1200px"
              url={inv?.fotoPortada} loading={uploadingFoto === 'portada'}
              locked={!isPremium}
              onFile={f => uploadFoto('portada', f)}
              onClear={() => updInv({ fotoPortada: undefined })}
              onLock={onPaywall} fileRef={fileRef1} />
            <FotoSlot label="Segunda foto (opcional)" hint="Aparece antes del formulario RSVP"
              url={inv?.foto2} loading={uploadingFoto === 'foto2'}
              locked={!isPremium}
              onFile={f => uploadFoto('foto2', f)}
              onClear={() => updInv({ foto2: undefined })}
              onLock={onPaywall} fileRef={fileRef2} />
          </div>
        </div>

        {/* BOTÓN PUBLICAR */}
        <div className="inv-publish-area">
          {!isPremium ? (
            <button className="inv-publish-btn locked" onClick={onPaywall}>
              🔒 Publicar invitación · 9,99 €
            </button>
          ) : activa ? (
            <div className="inv-published-info">
              <span>✓ Tu invitación está publicada</span>
              <button className="inv-publish-btn" onClick={aplicarYPublicar}>
                Guardar cambios
              </button>
            </div>
          ) : (
            <button className="inv-publish-btn" onClick={aplicarYPublicar}>
              Publicar invitación →
            </button>
          )}
          {!isPremium && (
            <p className="inv-publish-hint">
              Pago único de 9,99 €. Sin suscripción.
            </p>
          )}
        </div>

        {/* Confirmaciones recibidas */}
        {isPremium && (
          <div className="inv-block">
            <div className="inv-block-head">
              <div className="inv-block-title">Confirmaciones recibidas</div>
              <button className="btn-ghost" onClick={fetchRsvps}>↻</button>
            </div>
            {loadingRsvp ? (
              <div className="inv-loading">Cargando…</div>
            ) : rsvps.length === 0 ? (
              <div className="inv-no-rsvp">Aún no hay confirmaciones.</div>
            ) : (
              <div className="rsvp-list">
                {rsvps.map(r => (
                  <div key={r.id} className="rsvp-row">
                    <div className={`rsvp-dot ${r.asiste ? 'green' : 'red'}`} />
                    <div className="rsvp-info">
                      <div className="rsvp-nombre">{r.nombre} {r.apellido}
                        {r.nombre_acomp && <span className="rsvp-acomp"> + {r.nombre_acomp}</span>}
                      </div>
                      <div className="rsvp-meta">
                        {r.asiste ? 'Confirma' : 'No puede'}
                        {r.intolerancia && ` · ${r.intolerancia}`}
                        {r.necesita_bus && ' · 🚌'}
                      </div>
                    </div>
                    {r.asiste && !r.importado && (
                      <button className="rsvp-import-btn" onClick={() => importarRsvp(r)}>+ Mesas</button>
                    )}
                    {r.importado && <span className="rsvp-imported">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ PANEL DERECHO: PREVIEW EN VIVO ═══ */}
      <div className="inv-preview-panel">
        <div className="inv-preview-label">
          Vista previa en tiempo real
          <span className="inv-preview-tema">{TEMAS.find(t => t.id === tema)?.label}</span>
        </div>

        <div className="inv-preview-scroll">
          <div className="inv-preview-page" style={vars as React.CSSProperties}>

            {/* Hero preview */}
            <div className="prev-hero">
              <div className="prev-hero-bg" />
              <div className="prev-pre">Con mucha alegría os invitamos a celebrar nuestra boda</div>
              <div className="prev-names">{novios.split(' y ')[0]}</div>
              <div className="prev-amp">&</div>
              <div className="prev-names">{novios.split(' y ')[1] || novios.split(' & ')[1] || ''}</div>
              <div className="prev-orn" />
              <div className="prev-date">{fechaStr}</div>
              <div className="prev-finca">{finca}</div>
            </div>

            {/* Mensaje preview */}
            <div className="prev-section">
              <div className="prev-eyebrow">Nuestra boda</div>
              <div className="prev-mensaje">{mensaje}</div>
            </div>

            {/* Cronograma preview */}
            {data.eventos && data.eventos.length > 0 && (
              <div className="prev-section prev-bg2">
                <div className="prev-eyebrow">El gran día</div>
                <div className="prev-timeline">
                  {data.eventos.slice(0, 4).map((e, i) => (
                    <div key={i} className="prev-t-item">
                      <span className="prev-t-time">{e.hora}</span>
                      <div className="prev-t-dot" />
                      <span className="prev-t-name">{e.nombre}</span>
                    </div>
                  ))}
                  {data.eventos.length > 4 && (
                    <div className="prev-t-more">+{data.eventos.length - 4} momentos más</div>
                  )}
                </div>
              </div>
            )}

            {/* RSVP preview */}
            <div className="prev-section">
              <div className="prev-eyebrow">Confirmación</div>
              <div className="prev-rsvp-title">¿Contamos contigo?</div>
              {fechaLimite && (
                <div className="prev-rsvp-hint">
                  Confirma antes del {new Date(fechaLimite).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                </div>
              )}
              <div className="prev-rsvp-btns">
                <div className="prev-rsvp-btn">Allí estaré</div>
                <div className="prev-rsvp-btn">No podré ir</div>
              </div>
            </div>

            <div className="prev-footer">
              <div className="prev-footer-names">{novios}</div>
              <div className="prev-footer-marca">Creado con Enlace</div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function FotoSlot({ label, hint, url, loading, locked, onFile, onClear, onLock, fileRef }: {
  label: string; hint: string; url?: string; loading: boolean; locked: boolean
  onFile: (f: File) => void; onClear: () => void; onLock: () => void
  fileRef: React.RefObject<HTMLInputElement | null>
}) {
  return (
    <div className="foto-slot">
      <div className="foto-slot-label">{label}</div>
      <div className="foto-slot-hint">{hint}</div>
      {url ? (
        <div className="foto-preview">
          <img src={url} alt="Foto" className="foto-img" />
          {!locked && <button className="foto-clear" onClick={onClear}>× Quitar</button>}
        </div>
      ) : (
        <div className="foto-upload" onClick={() => locked ? onLock() : fileRef.current?.click()}>
          {loading ? <span>Subiendo…</span> : (
            <><span className="foto-upload-icon">{locked ? '🔒' : '📸'}</span>
            <span>{locked ? 'Requiere premium' : 'Subir foto'}</span></>
          )}
          {!locked && (
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          )}
        </div>
      )}
    </div>
  )
}