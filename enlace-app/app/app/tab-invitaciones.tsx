'use client'

import './tab-invitaciones.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BodaData, Guest, InvitacionConfig, InvitacionLugar, RsvpResponse } from '@/lib/types'
import { createClient } from '@/lib/supabase-client'
import { TEMAS, buildInvitacion, normalizeConfig, parseNames, slugCodigo } from '@/lib/invitacion'
import InvitacionView from '../_components/invitacion/invitacion-view'
import { reducirFoto, blobADataUrl, subirFoto, borrarFoto } from '@/lib/fotos'

type Props = {
  data: BodaData
  setData: React.Dispatch<React.SetStateAction<BodaData>>
  showToast: (m: string) => void
  userId: string | null
  bodaId: string
  isPremium: boolean
  isGuest: boolean
  onRegistro: () => void
  onPaywall: () => void
}

type Hueco = 'portada' | 'ceremonia' | 'celebracion'

export default function TabInvitaciones({ data, setData, showToast, userId, bodaId, isPremium, isGuest, onRegistro, onPaywall }: Props) {
  const supabase = useMemo(() => createClient(), [])
  const cfg = useMemo(() => normalizeConfig(data.invitacion, data), [data])
  const [subiendo, setSubiendo] = useState<Hueco | null>(null)
  const [panel, setPanel] = useState<'editar' | 'ver'>('editar')
  const [dispositivo, setDispositivo] = useState<'movil' | 'ordenador'>('movil')
  const [rsvps, setRsvps] = useState<RsvpResponse[]>([])
  const [cargandoRsvp, setCargandoRsvp] = useState(false)
  const vistaRef = useRef<HTMLDivElement>(null)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://enlaceboda.es'
  const url = cfg.codigo ? `${siteUrl}/i/${cfg.codigo}` : ''
  const publicada = isPremium && cfg.activa && !!cfg.codigo
  const [n1, n2] = parseNames(data.resumen?.novios)

  /* ─── guardar cambios ─── */
  function upd(patch: Partial<InvitacionConfig>) {
    setData(d => ({ ...d, invitacion: { ...normalizeConfig(d.invitacion, d), ...patch } }))
  }
  function updLugar(k: 'ceremonia' | 'celebracion', patch: Partial<InvitacionLugar>) {
    setData(d => {
      const c = normalizeConfig(d.invitacion, d)
      return { ...d, invitacion: { ...c, [k]: { ...c[k], ...patch } } }
    })
  }
  function updContacto(i: number, campo: 'nombre' | 'telefono', valor: string) {
    const contactos = [...cfg.contactos]
    while (contactos.length <= i) contactos.push({ nombre: '', telefono: '' })
    contactos[i] = { ...contactos[i], [campo]: valor }
    upd({ contactos })
  }

  /* ─── vista previa ─── */
  const vista = useMemo(() => buildInvitacion(data, cfg), [data, cfg])

  useEffect(() => { vistaRef.current?.scrollTo({ top: 0 }) }, [cfg.tema])

  /* ─── fotos ───
     Sin cuenta: se guardan en este navegador.
     Con cuenta (cualquier plan): se suben a su carpeta y no se pierden. */
  async function elegirFoto(hueco: Hueco, file?: File) {
    if (!file) return
    const anterior = hueco === 'portada' ? cfg.fotoPortada : cfg[hueco].foto
    const guardar = (url: string) => hueco === 'portada' ? upd({ fotoPortada: url }) : updLugar(hueco, { foto: url })

    if (isGuest || !userId) {
      const blob = await reducirFoto(file, 1400, 0.78)
      guardar(await blobADataUrl(blob))
      showToast('Foto guardada en este navegador. Crea tu cuenta para no perderla')
      return
    }

    setSubiendo(hueco)
    try {
      const blob = await reducirFoto(file)
      guardar(await subirFoto(supabase, userId, hueco, blob))
      borrarFoto(supabase, anterior)
      showToast('Foto guardada')
    } catch {
      showToast('No se ha podido subir la foto. Inténtalo de nuevo')
    } finally {
      setSubiendo(null)
    }
  }
  function quitarFoto(hueco: Hueco) {
    const anterior = hueco === 'portada' ? cfg.fotoPortada : cfg[hueco].foto
    if (hueco === 'portada') upd({ fotoPortada: undefined })
    else updLugar(hueco, { foto: undefined })
    if (userId) borrarFoto(supabase, anterior)
  }
  const fotoActual = (h: Hueco) => (h === 'portada' ? cfg.fotoPortada : cfg[h].foto)

  /* ─── publicar ─── */
  function publicar() {
    if (isGuest) { onRegistro(); return }
    if (!isPremium) { onPaywall(); return }
    if (!data.resumen?.novios || !data.resumen?.fecha) {
      showToast('Antes de publicar, añade vuestros nombres y la fecha en Resumen general')
      return
    }
    upd({ activa: true, codigo: cfg.codigo || slugCodigo(data.resumen.novios, data.resumen.fecha) })
    showToast('Invitación publicada')
  }
  function pausar() {
    upd({ activa: false })
    showToast('Invitación pausada')
  }
  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(url)
      showToast('Enlace copiado')
    } catch {
      showToast(url)
    }
  }

  /* ─── confirmaciones ─── */
  const cargarRsvps = useCallback(async () => {
    if (!bodaId) return
    setCargandoRsvp(true)
    const { data: filas } = await supabase
      .from('rsvp_responses').select('*').eq('boda_id', bodaId)
      .order('created_at', { ascending: false })
    setRsvps((filas as RsvpResponse[]) || [])
    setCargandoRsvp(false)
  }, [bodaId, supabase])

  useEffect(() => { if (isPremium) cargarRsvps() }, [isPremium, cargarRsvps])

  async function pasarAMesas(r: RsvpResponse) {
    if (!r.asiste) return
    const completo = [r.nombre, r.apellido].filter(Boolean).join(' ')
    setData(d => {
      const nuevos: Guest[] = [{
        id: d.gid, nombre: r.nombre, apellido: r.apellido || '', relacion: 'Invitación',
        mesaId: null, paid: 'pendiente', importe: '', intolerancia: r.intolerancia || '',
      }]
      if (r.nombre_acomp) nuevos.push({
        id: d.gid + 1, nombre: r.nombre_acomp, apellido: '', relacion: `Acompañante de ${completo}`,
        mesaId: null, paid: 'pendiente', importe: '', intolerancia: '',
      })
      return { ...d, guests: [...d.guests, ...nuevos], gid: d.gid + nuevos.length }
    })
    await supabase.from('rsvp_responses').update({ importado: true }).eq('id', r.id)
    setRsvps(rs => rs.map(x => (x.id === r.id ? { ...x, importado: true } : x)))
    showToast(r.nombre_acomp ? `${r.nombre} y su acompañante están en Mesas` : `${r.nombre} está en Mesas`)
  }

  const vienen = rsvps.filter(r => r.asiste).reduce((s, r) => s + 1 + (r.nombre_acomp ? 1 : 0), 0)
  const noVienen = rsvps.filter(r => !r.asiste).length
  const nMomentos = (data.eventos || []).length
  const nBuses = vista.buses.length

  return (
    <div className={`screen ivt ivt-${panel}`}>

      {/* Cambiar entre editar y ver en el móvil */}
      <div className="ivt-mtabs" role="tablist">
        <button role="tab" aria-selected={panel === 'editar'} onClick={() => setPanel('editar')}>Editar</button>
        <button role="tab" aria-selected={panel === 'ver'} onClick={() => setPanel('ver')}>Vista previa</button>
      </div>

      {/* ═══ EDITOR ═══ */}
      <div className="ivt-edit">

        <div className={`ivt-status ${publicada ? 'on' : ''}`}>
          {publicada ? (
            <>
              <div className="ivt-status-h"><span className="ivt-dot-on" />Publicada</div>
              <a className="ivt-url" href={url} target="_blank" rel="noopener noreferrer">{url.replace(/^https?:\/\//, '')}</a>
              <div className="ivt-status-actions">
                <button className="ivt-btn" onClick={copiarEnlace}>Copiar enlace</button>
                <a className="ivt-btn ghost" href={url} target="_blank" rel="noopener noreferrer">Abrir</a>
                <button className="ivt-btn ghost" onClick={pausar}>Pausar</button>
              </div>
              <p className="ivt-note">Los cambios que hagas aquí se ven en la invitación al momento.</p>
            </>
          ) : (
            <>
              <div className="ivt-status-h">{isPremium ? 'Sin publicar' : 'Prueba tu invitación'}</div>
              <p className="ivt-note">
                {isGuest
                  ? 'Cambia el estilo, los textos y las fotos, y mira el resultado. Todo se guarda en este navegador; crea tu cuenta gratis para no perderlo.'
                  : isPremium
                    ? 'Cuando la publiques tendrá un enlace propio para enviar a tus invitados.'
                    : 'Cambia el estilo, los textos y las fotos, y mira el resultado. Todo queda guardado en tu cuenta. Para enviarla a tus invitados y recibir sus respuestas necesitas el plan premium.'}
              </p>
              <button className="ivt-btn primary" onClick={publicar}>
                {isGuest ? 'Crear cuenta para publicar' : isPremium ? 'Publicar invitación' : 'Publicar invitación · 9,99 €'}
              </button>
            </>
          )}
        </div>

        <Grupo titulo="Estilo">
          <div className="ivt-temas">
            {TEMAS.map(t => (
              <button key={t.id} type="button" className={`ivt-tema ${cfg.tema === t.id ? 'on' : ''}`}
                onClick={() => upd({ tema: t.id })} aria-pressed={cfg.tema === t.id}>
                <span className="ivt-swatch" style={{ background: t.color, boxShadow: t.ring ? `inset 0 0 0 2px ${t.ring}` : undefined }} />
                <span><b>{t.label}</b><small>{t.desc}</small></span>
              </button>
            ))}
          </div>
        </Grupo>

        <Grupo titulo="Portada">
          <p className="ivt-note">
            {n1 ? <>Nombres: <b>{n2 ? `${n1} y ${n2}` : n1}</b>. </> : <>Faltan vuestros nombres. </>}
            {vista.fechaLarga ? <>Fecha: <b>{vista.fechaLarga}</b>.</> : <>Falta la fecha.</>}
            {' '}Se cambian en Resumen general.
          </p>
          <Foto titulo="Foto de portada" url={fotoActual('portada')} subiendo={subiendo === 'portada'}
            onFile={f => elegirFoto('portada', f)} onQuitar={() => quitarFoto('portada')} />
        </Grupo>

        <Grupo titulo="Vuestras palabras">
          <Campo label="Saludo" value={cfg.saludo} onChange={v => upd({ saludo: v })} />
          <Campo label="Texto" value={cfg.mensaje} onChange={v => upd({ mensaje: v })} area
            ayuda="Deja una línea en blanco para separar párrafos." />
        </Grupo>

        <LugarEditor titulo="Ceremonia" l={cfg.ceremonia} onChange={p => updLugar('ceremonia', p)}
          foto={fotoActual('ceremonia')} subiendo={subiendo === 'ceremonia'}
          onFile={f => elegirFoto('ceremonia', f)} onQuitar={() => quitarFoto('ceremonia')} />

        <LugarEditor titulo="Celebración" l={cfg.celebracion} onChange={p => updLugar('celebracion', p)}
          foto={fotoActual('celebracion')} subiendo={subiendo === 'celebracion'}
          onFile={f => elegirFoto('celebracion', f)} onQuitar={() => quitarFoto('celebracion')} />

        <Grupo titulo="Programa y autobuses">
          <label className="ivt-check">
            <input type="checkbox" checked={cfg.mostrarPrograma} onChange={e => upd({ mostrarPrograma: e.target.checked })} />
            Mostrar el programa del día
          </label>
          <p className="ivt-note">
            {nMomentos > 0
              ? `Se usan los ${nMomentos} momentos de tu Cronograma.`
              : 'Añade momentos en el Cronograma para que aparezcan aquí.'}
            {' '}
            {nBuses > 0
              ? `También se muestran ${nBuses === 1 ? 'el autobús' : `los ${nBuses} autobuses`} del Cronograma y tus invitados podrán pedir plaza.`
              : 'Si añades autobuses en el Cronograma, tus invitados podrán pedir plaza al confirmar.'}
          </p>
        </Grupo>

        <Grupo titulo="Regalo">
          <Campo label="Texto" value={cfg.regalosTexto} onChange={v => upd({ regalosTexto: v })} area />
          <Campo label="Número de cuenta (IBAN)" value={cfg.iban} onChange={v => upd({ iban: v.toUpperCase() })}
            placeholder="ES00 0000 0000 0000 0000 0000" ayuda="Si lo dejas vacío, esta sección no aparece." />
        </Grupo>

        <Grupo titulo="Contacto">
          {[0, 1].map(i => (
            <div className="ivt-row" key={i}>
              <Campo label="Nombre" value={cfg.contactos[i]?.nombre || ''} onChange={v => updContacto(i, 'nombre', v)} />
              <Campo label="Teléfono" value={cfg.contactos[i]?.telefono || ''} onChange={v => updContacto(i, 'telefono', v)}
                placeholder="600 00 00 00" type="tel" />
            </div>
          ))}
          <p className="ivt-note">Solo se muestran los contactos con teléfono.</p>
        </Grupo>

        <Grupo titulo="Confirmación">
          <Campo label="Fecha límite para confirmar" type="date" value={cfg.fechaLimiteRsvp || ''}
            onChange={v => upd({ fechaLimiteRsvp: v || undefined })} />
        </Grupo>

        {isPremium && (
          <Grupo titulo="Respuestas recibidas" accion={<button className="ivt-link" onClick={cargarRsvps}>Actualizar</button>}>
            {rsvps.length > 0 && (
              <div className="ivt-counts">
                <span><b>{vienen}</b> vienen</span>
                <span><b>{noVienen}</b> no pueden</span>
                <span><b>{rsvps.length}</b> respuestas</span>
              </div>
            )}
            {cargandoRsvp ? (
              <p className="ivt-note">Cargando respuestas…</p>
            ) : rsvps.length === 0 ? (
              <p className="ivt-note">Aún no ha respondido nadie. Cuando alguien confirme, aparecerá aquí y podrás pasarlo a Mesas.</p>
            ) : (
              <ul className="ivt-rsvps">
                {rsvps.map(r => (
                  <li key={r.id}>
                    <span className={`ivt-rdot ${r.asiste ? 'si' : 'no'}`} />
                    <div className="ivt-rinfo">
                      <b>{[r.nombre, r.apellido].filter(Boolean).join(' ')}{r.nombre_acomp ? ` y ${r.nombre_acomp}` : ''}</b>
                      <small>
                        {r.asiste ? 'Viene' : 'No puede venir'}
                        {r.intolerancia ? `. ${r.intolerancia}` : ''}
                        {r.ruta_bus ? `. Autobús: ${r.ruta_bus}` : ''}
                      </small>
                      {r.mensaje && <em>«{r.mensaje}»</em>}
                    </div>
                    {r.asiste && !r.importado && <button className="ivt-btn small" onClick={() => pasarAMesas(r)}>Pasar a Mesas</button>}
                    {r.importado && <span className="ivt-done">En Mesas</span>}
                  </li>
                ))}
              </ul>
            )}
          </Grupo>
        )}
      </div>

      {/* ═══ VISTA PREVIA ═══ */}
      <div className="ivt-prev">
        <div className="ivt-prev-bar">
          <span>Vista previa</span>
          <div className="ivt-seg" role="group" aria-label="Tamaño de la vista previa">
            <button aria-pressed={dispositivo === 'movil'} onClick={() => setDispositivo('movil')}>Móvil</button>
            <button aria-pressed={dispositivo === 'ordenador'} onClick={() => setDispositivo('ordenador')}>Ordenador</button>
          </div>
        </div>
        <div className="ivt-prev-area">
          <div ref={vistaRef} className={`ivt-device ${dispositivo}`}>
            <InvitacionView data={vista} mode="preview" />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ PIEZAS DEL EDITOR ═══ */

function Grupo({ titulo, accion, children }: { titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="ivt-group">
      <div className="ivt-group-h"><h3>{titulo}</h3>{accion}</div>
      <div className="ivt-group-b">{children}</div>
    </section>
  )
}

function Campo({ label, value, onChange, area, placeholder, ayuda, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  area?: boolean; placeholder?: string; ayuda?: string; type?: string
}) {
  return (
    <label className="ivt-f">
      <span>{label}</span>
      {area
        ? <textarea className="ivt-in" rows={3} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />
        : <input className="ivt-in" type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} />}
      {ayuda && <small>{ayuda}</small>}
    </label>
  )
}

function Foto({ titulo, url, subiendo, onFile, onQuitar }: {
  titulo: string; url?: string; subiendo: boolean; onFile: (f?: File) => void; onQuitar: () => void
}) {
  return (
    <div className="ivt-foto">
      {url ? <img src={url} alt="" className="ivt-thumb" /> : <span className="ivt-thumb empty">Ilustración</span>}
      <div className="ivt-foto-txt">
        <b>{titulo}</b>
        <div className="ivt-foto-actions">
          <label className="ivt-link">
            {subiendo ? 'Subiendo…' : url ? 'Cambiar' : 'Subir foto'}
            <input type="file" accept="image/*" hidden disabled={subiendo}
              onChange={e => { onFile(e.target.files?.[0]); e.target.value = '' }} />
          </label>
          {url && <button className="ivt-link muted" onClick={onQuitar}>Quitar</button>}
        </div>
      </div>
    </div>
  )
}

function LugarEditor({ titulo, l, onChange, foto, subiendo, onFile, onQuitar }: {
  titulo: string; l: InvitacionLugar; onChange: (p: Partial<InvitacionLugar>) => void
  foto?: string; subiendo: boolean; onFile: (f?: File) => void; onQuitar: () => void
}) {
  return (
    <Grupo titulo={titulo}>
      <div className="ivt-row">
        <Campo label="Lugar" value={l.lugar} onChange={v => onChange({ lugar: v })} />
        <Campo label="Hora" type="time" value={l.hora} onChange={v => onChange({ hora: v })} />
      </div>
      <Campo label="Dirección" value={l.direccion} onChange={v => onChange({ direccion: v })} area
        placeholder={'Calle, número\nCódigo postal y ciudad'} />
      <Campo label="Enlace de Google Maps (opcional)" value={l.mapa} onChange={v => onChange({ mapa: v })}
        placeholder="https://maps.app.goo.gl/…" ayuda="Si lo dejas vacío, se busca la dirección automáticamente." />
      <Foto titulo={`Foto de la ${titulo.toLowerCase()}`} url={foto} subiendo={subiendo} onFile={onFile} onQuitar={onQuitar} />
    </Grupo>
  )
}
