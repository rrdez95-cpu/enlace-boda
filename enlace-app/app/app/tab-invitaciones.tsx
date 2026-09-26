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

const DEMO_CONFIG: InvitacionConfig = {
  activa: false,
  codigo: 'laura-y-alejandro-2027',
  tema: 'marfil',
  mensaje: 'Con mucha alegría os invitamos a celebrar nuestra boda.\nConfirmad vuestra asistencia antes del 1 de junio.',
  fechaLimiteRsvp: '',
}

function generateCodigo(novios: string, fecha: string): string {
  const year = fecha ? new Date(fecha).getFullYear() : new Date().getFullYear()
  const slug = novios
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  return `${slug}-${year}`
}

export default function TabInvitaciones({ data, setData, showToast, userId, bodaId, isPremium, onPaywall }: Props) {
  const supabase = createClient()

  // Si no es premium, mostramos la demo bloqueada
  const inv = isPremium ? data.invitacion : DEMO_CONFIG
  const locked = !isPremium

  const [rsvps, setRsvps] = useState<RsvpResponse[]>([])
  const [loadingRsvp, setLoadingRsvp] = useState(false)
  const [uploadingFoto, setUploadingFoto] = useState<'portada' | 'foto2' | null>(null)
  const fileRef1 = useRef<HTMLInputElement | null>(null)
  const fileRef2 = useRef<HTMLInputElement | null>(null)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enlaceboda.es'
  const urlInvitacion = inv?.codigo ? `${siteUrl}/i/${inv.codigo}` : null

  useEffect(() => {
    if (isPremium && inv?.activa && bodaId) fetchRsvps()
  }, [inv?.activa, bodaId, isPremium])

  async function fetchRsvps() {
    setLoadingRsvp(true)
    const { data: rows } = await supabase
      .from('rsvp_responses')
      .select('*')
      .eq('boda_id', bodaId)
      .order('created_at', { ascending: false })
    setRsvps(rows || [])
    setLoadingRsvp(false)
  }

  function updInv(patch: Partial<InvitacionConfig>) {
    if (locked) return
    setData(d => ({ ...d, invitacion: { ...d.invitacion!, ...patch } }))
  }

  function activar() {
    if (locked) { onPaywall(); return }
    const novios = data.resumen?.novios || 'mi-boda'
    const fecha = data.resumen?.fecha || ''
    const codigo = generateCodigo(novios, fecha)
    const config: InvitacionConfig = {
      activa: true,
      codigo,
      tema: 'marfil',
      mensaje: 'Con mucha alegría os invitamos a celebrar nuestra boda.\nConfirmad vuestra asistencia antes del 1 de junio.',
      fechaLimiteRsvp: '',
    }
    setData(d => ({ ...d, invitacion: config }))
    showToast('Invitación activada')
  }

  async function uploadFoto(slot: 'portada' | 'foto2', file: File) {
    if (locked) return
    setUploadingFoto(slot)
    try {
      const ext = file.name.split('.').pop()
      const path = `${userId}/${slot}-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('invitaciones')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('invitaciones').getPublicUrl(path)
      if (slot === 'portada') updInv({ fotoPortada: urlData.publicUrl })
      else updInv({ foto2: urlData.publicUrl })
      showToast('Foto subida')
    } catch {
      showToast('Error al subir la foto')
    }
    setUploadingFoto(null)
  }

  async function importarRsvp(rsvp: RsvpResponse) {
    if (!rsvp.asiste || locked) return
    const newGuest = {
      id: Date.now(),
      nombre: rsvp.nombre,
      apellido: rsvp.apellido || '',
      relacion: 'Invitado',
      mesaId: null,
      paid: 'pendiente' as const,
      importe: '',
      intolerancia: rsvp.intolerancia || '',
    }
    setData(d => ({ ...d, guests: [...d.guests, newGuest] }))
    await supabase.from('rsvp_responses').update({ importado: true }).eq('id', rsvp.id)
    setRsvps(rs => rs.map(r => r.id === rsvp.id ? { ...r, importado: true } : r))
    showToast(`${rsvp.nombre} añadido a la lista`)
  }

  const asisten = rsvps.filter(r => r.asiste).length
  const noAsisten = rsvps.filter(r => !r.asiste).length

  // Si no tiene invitación creada Y es premium → pantalla de activación
  if (isPremium && !data.invitacion) {
    return (
      <div className="inv-empty">
        <div className="inv-empty-icon">💌</div>
        <h2 className="inv-empty-title">Invitaciones digitales</h2>
        <p className="inv-empty-text">
          Crea una página personalizada para invitar a tus invitados y recibir
          sus confirmaciones automáticamente en la lista de mesas.
        </p>
        <div className="inv-features">
          <div className="inv-feat"><span>🎨</span> 5 estilos visuales distintos</div>
          <div className="inv-feat"><span>📸</span> Sube tus fotos</div>
          <div className="inv-feat"><span>✅</span> Confirmaciones automáticas</div>
          <div className="inv-feat"><span>🚌</span> Gestión de autobuses</div>
          <div className="inv-feat"><span>🔗</span> URL con vuestros nombres</div>
        </div>
        <button className="inv-activate-btn" onClick={activar}>
          Crear mi invitación
        </button>
        {!data.resumen?.novios && (
          <p className="inv-warn">
            💡 Añade los nombres en Resumen general para generar la URL personalizada
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="inv-wrapper">

      {/* OVERLAY DE BLOQUEO — solo si no es premium */}
      {locked && (
        <div className="inv-lock-overlay" onClick={onPaywall}>
          <div className="inv-lock-card">
            <div className="inv-lock-icon">💌</div>
            <div className="inv-lock-title">Invitaciones digitales</div>
            <p className="inv-lock-text">
              Crea tu página de invitación personalizada con 5 estilos visuales,
              fotos propias y confirmaciones de asistencia automáticas.
            </p>
            <div className="inv-lock-features">
              <span>🎨 5 estilos visuales</span>
              <span>📸 Fotos propias</span>
              <span>✅ RSVP automático</span>
              <span>🚌 Gestión de buses</span>
            </div>
            <button className="inv-lock-btn">Desbloquear por 9,99 € →</button>
            <p className="inv-lock-sub">Pago único · Sin renovaciones</p>
          </div>
        </div>
      )}

      {/* CONTENIDO — visible pero bloqueado si locked */}
      <div className={`inv-layout ${locked ? 'inv-blurred' : ''}`}>

        {/* PANEL IZQUIERDO */}
        <div className="inv-side">

          <div className="inv-url-card">
            <div className="inv-url-head">
              <div className={`inv-status-dot ${inv?.activa ? 'on' : 'off'}`} />
              <span className="inv-status-label">{inv?.activa ? 'Activa' : 'Pausada'}</span>
              <button className="inv-toggle-btn"
                onClick={() => locked ? onPaywall() : updInv({ activa: !inv?.activa })}>
                {inv?.activa ? 'Pausar' : 'Activar'}
              </button>
            </div>
            {urlInvitacion && (
              <>
                <div className="inv-url-text">{urlInvitacion}</div>
                <div className="inv-url-actions">
                  <button className="inv-url-btn" onClick={() => {
                    if (locked) { onPaywall(); return }
                    navigator.clipboard.writeText(urlInvitacion)
                    showToast('URL copiada')
                  }}>Copiar enlace</button>
                  <a className="inv-url-btn"
                    href={locked ? '#' : urlInvitacion}
                    target={locked ? '_self' : '_blank'}
                    rel="noopener noreferrer"
                    onClick={e => { if (locked) { e.preventDefault(); onPaywall() } }}>
                    Ver invitación →
                  </a>
                </div>
              </>
            )}
          </div>

          {!locked && rsvps.length > 0 && (
            <div className="inv-counter">
              <div className="inv-counter-item green">
                <span className="inv-counter-num">{asisten}</span>
                <span className="inv-counter-label">confirman</span>
              </div>
              <div className="inv-counter-sep" />
              <div className="inv-counter-item red">
                <span className="inv-counter-num">{noAsisten}</span>
                <span className="inv-counter-label">no pueden</span>
              </div>
              <div className="inv-counter-sep" />
              <div className="inv-counter-item gold">
                <span className="inv-counter-num">{rsvps.length}</span>
                <span className="inv-counter-label">total</span>
              </div>
            </div>
          )}

          <div className="inv-block">
            <div className="inv-block-title">Estilo de la invitación</div>
            <div className="inv-temas">
              {TEMAS.map(t => (
                <div key={t.id}
                  className={`inv-tema ${inv?.tema === t.id ? 'active' : ''}`}
                  onClick={() => locked ? onPaywall() : updInv({ tema: t.id })}>
                  <div className="inv-tema-dot" style={{ background: t.color }} />
                  <div>
                    <div className="inv-tema-label">{t.label}</div>
                    <div className="inv-tema-desc">{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* PANEL DERECHO */}
        <div className="inv-main">

          <div className="inv-block">
            <div className="inv-block-title">Mensaje de bienvenida</div>
            <textarea className="inv-textarea"
              value={inv?.mensaje || ''}
              placeholder="Con mucha alegría os invitamos..."
              readOnly={locked}
              onChange={e => updInv({ mensaje: e.target.value })} />
          </div>

          <div className="inv-block">
            <div className="inv-block-title">Fecha límite de confirmación</div>
            <input className="inv-input" type="date"
              value={inv?.fechaLimiteRsvp || ''}
              readOnly={locked}
              onChange={e => updInv({ fechaLimiteRsvp: e.target.value })} />
          </div>

          <div className="inv-block">
            <div className="inv-block-title">Fotos</div>
            <div className="inv-fotos">
              <FotoSlot
                label="Foto de portada"
                hint="Aparece en la cabecera. Recomendado: horizontal, mínimo 1200px"
                url={inv?.fotoPortada}
                loading={uploadingFoto === 'portada'}
                locked={locked}
                onFile={f => uploadFoto('portada', f)}
                onClear={() => updInv({ fotoPortada: undefined })}
                onLock={onPaywall}
                fileRef={fileRef1}
              />
              <FotoSlot
                label="Segunda foto (opcional)"
                hint="Aparece entre el cronograma y el formulario"
                url={inv?.foto2}
                loading={uploadingFoto === 'foto2'}
                locked={locked}
                onFile={f => uploadFoto('foto2', f)}
                onClear={() => updInv({ foto2: undefined })}
                onLock={onPaywall}
                fileRef={fileRef2}
              />
            </div>
          </div>

          <div className="inv-block">
            <div className="inv-block-head">
              <div className="inv-block-title">Confirmaciones recibidas</div>
              {!locked && <button className="btn-ghost" onClick={fetchRsvps}>↻ Actualizar</button>}
            </div>

            {locked ? (
              <div className="inv-no-rsvp">
                Las confirmaciones de tus invitados aparecerán aquí automáticamente.
              </div>
            ) : loadingRsvp ? (
              <div className="inv-loading">Cargando respuestas…</div>
            ) : rsvps.length === 0 ? (
              <div className="inv-no-rsvp">
                Aún no hay confirmaciones. Comparte el enlace con tus invitados.
              </div>
            ) : (
              <div className="rsvp-list">
                {rsvps.map(r => (
                  <div key={r.id} className={`rsvp-row ${r.asiste ? 'asiste' : 'no-asiste'}`}>
                    <div className={`rsvp-dot ${r.asiste ? 'green' : 'red'}`} />
                    <div className="rsvp-info">
                      <div className="rsvp-nombre">
                        {r.nombre} {r.apellido}
                        {r.nombre_acomp && <span className="rsvp-acomp"> + {r.nombre_acomp}</span>}
                      </div>
                      <div className="rsvp-meta">
                        {r.asiste ? 'Confirma asistencia' : 'No puede asistir'}
                        {r.intolerancia && ` · ${r.intolerancia}`}
                        {r.necesita_bus && ` · 🚌 ${r.ruta_bus || 'Bus'}`}
                      </div>
                    </div>
                    {r.asiste && !r.importado && (
                      <button className="rsvp-import-btn" onClick={() => importarRsvp(r)}>
                        + Añadir a mesas
                      </button>
                    )}
                    {r.importado && (
                      <span className="rsvp-imported">✓ Añadido</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

function FotoSlot({ label, hint, url, loading, locked, onFile, onClear, onLock, fileRef }: {
  label: string
  hint: string
  url?: string
  loading: boolean
  locked: boolean
  onFile: (f: File) => void
  onClear: () => void
  onLock: () => void
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
          {loading ? (
            <span>Subiendo…</span>
          ) : (
            <>
              <span className="foto-upload-icon">{locked ? '🔒' : '📸'}</span>
              <span>{locked ? 'Desbloquear para subir fotos' : 'Subir foto'}</span>
            </>
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