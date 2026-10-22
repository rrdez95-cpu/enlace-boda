'use client'

import './tab-invitaciones.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { BodaData, Guest, InvitacionConfig, InvitacionLugar, RsvpResponse, SeccionInvitacion, TemaIA } from '@/lib/types'
import { createClient } from '@/lib/supabase-client'
import {
  TEMAS, SECCIONES, VARIANTES, FONT_MINIATURAS, buildInvitacion, momentosInvitacion, normalizeConfig, parseNames, slugCodigo,
  type ParteConVariantes,
} from '@/lib/invitacion'
import InvitacionView, { type EdicionInvitacion } from '../_components/invitacion/invitacion-view'
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

  /* ─── partes, diseños y momentos ─── */
  const nombreParte = (x: SeccionInvitacion) => SECCIONES.find(y => y.id === x)?.label || ''
  function verSeccion(x: SeccionInvitacion, on: boolean) {
    const ocultas = on ? cfg.ocultas.filter(y => y !== x) : Array.from(new Set([...cfg.ocultas, x]))
    upd({ ocultas, mostrarPrograma: !ocultas.includes('programa') })
  }
  function cambiarVariante(parte: ParteConVariantes, id: string) {
    upd({ variantes: { ...cfg.variantes, [parte]: id } })
  }
  function verMomento(id: string, on: boolean) {
    upd({ programaVisibles: { ...cfg.programaVisibles, [id]: on } })
  }
  function tituloMomento(id: string, titulo: string) {
    upd({ programaTitulos: { ...cfg.programaTitulos, [id]: titulo } })
  }
  const momentos = useMemo(() => momentosInvitacion(data, cfg), [data, cfg])

  const edicion: EdicionInvitacion = {
    quitarSeccion: x => {
      verSeccion(x, false)
      showToast(`«${nombreParte(x)}» quitado. Puedes volver a ponerlo en «Partes de la invitación»`)
    },
    cambiarVariante,
    quitarMomento: id => {
      verMomento(id, false)
      showToast('Momento quitado de la invitación. Sigue en tu Cronograma')
    },
  }

  /* ─── plantilla creada con IA ─── */
  const [iaAbierta, setIaAbierta] = useState(cfg.tema === 'ia')
  const [iaPrompt, setIaPrompt] = useState(cfg.temaIA?.prompt || '')
  const [iaCreando, setIaCreando] = useState(false)
  const [iaError, setIaError] = useState('')
  const [iaRestantes, setIaRestantes] = useState<number | null>(null)

  function elegirTema(id: InvitacionConfig['tema']) {
    if (id === 'ia') {
      setIaAbierta(true)
      if (cfg.temaIA) upd({ tema: 'ia' })
      return
    }
    setIaAbierta(false)
    upd({ tema: id })
  }

  async function crearConIA() {
    if (isGuest || !userId) { onRegistro(); return }
    const prompt = iaPrompt.trim()
    if (prompt.length < 3) { setIaError('Cuéntanos un poco cómo la imagináis.'); return }
    setIaError('')
    setIaCreando(true)
    try {
      const res = await fetch('/api/plantilla-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })
      const json = await res.json().catch(() => ({})) as { tema?: TemaIA; error?: string; restantes?: number }
      if (typeof json.restantes === 'number') setIaRestantes(json.restantes)
      if (!res.ok || !json.tema) { setIaError(json.error || 'No se ha podido crear. Inténtalo otra vez.'); return }
      upd({ tema: 'ia', temaIA: json.tema })
      setPanel('ver')
      showToast(`Plantilla «${json.tema.nombre}» lista`)
    } catch {
      setIaError('Revisa tu conexión e inténtalo otra vez.')
    } finally {
      setIaCreando(false)
    }
  }
  function usarTextosIA() {
    const t = cfg.temaIA
    if (!t) return
    upd({ ...(t.saludo ? { saludo: t.saludo } : {}), ...(t.mensaje ? { mensaje: t.mensaje } : {}) })
    showToast('Textos cambiados. Puedes retocarlos en «Vuestras palabras»')
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
  const nBuses = vista.buses.length
  const temaIA = cfg.temaIA

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
          <link rel="stylesheet" href={FONT_MINIATURAS} />
          <div className="ivt-temas">
            {TEMAS.map(t => {
              const esIA = t.id === 'ia'
              const on = esIA ? cfg.tema === 'ia' || iaAbierta : cfg.tema === t.id && !iaAbierta
              const fondo = esIA && temaIA ? temaIA.paper : t.fondo
              const tinta = esIA && temaIA ? temaIA.title : t.tinta
              const fuente = esIA && temaIA ? `'${temaIA.fNames}',cursive` : t.fuente
              return (
                <button key={t.id} type="button" className={`ivt-tema ${on ? 'on' : ''} ${esIA ? 'ia' : ''}`}
                  onClick={() => elegirTema(t.id)} aria-pressed={on}>
                  <span className="ivt-mini" style={{ background: fondo, color: tinta, fontFamily: fuente }}>
                    {esIA && !temaIA ? <span className="ivt-mini-ia">✦</span> : <>{(n1 || 'A').charAt(0)}<small>&amp;</small>{(n2 || 'B').charAt(0)}</>}
                    <i style={{ background: esIA && temaIA ? temaIA.accent : t.ring || t.color }} />
                  </span>
                  <b>{esIA && temaIA ? temaIA.nombre : t.label}</b>
                  <small>{esIA && temaIA ? 'Vuestra plantilla' : t.desc}</small>
                </button>
              )
            })}
          </div>

          {iaAbierta && (
            <div className="ivt-ia">
              <label className="ivt-f">
                <span>{temaIA ? 'Pide otra o cambia la descripción' : '¿Cómo la imagináis?'}</span>
                <textarea className="ivt-in" rows={3} maxLength={300} value={iaPrompt}
                  placeholder="Por ejemplo: una boda mágica en un castillo, con velas flotantes y tonos granate y dorado"
                  onChange={e => setIaPrompt(e.target.value)} />
              </label>
              <div className="ivt-ia-ideas">
                {['Mágica, con castillo y velas', 'Toscana con limones', 'Años 20 art déco', 'Otoño en el bosque', 'Atardecer en Cádiz', 'Navidad nevada'].map(x => (
                  <button key={x} type="button" className="ivt-chip" onClick={() => setIaPrompt(x)}>{x}</button>
                ))}
              </div>
              <button type="button" className="ivt-btn primary" onClick={crearConIA} disabled={iaCreando}>
                {iaCreando ? 'Diseñando vuestra plantilla…' : isGuest ? 'Crear cuenta para diseñarla' : temaIA ? 'Diseñar otra' : 'Diseñar plantilla'}
              </button>
              {iaCreando && <p className="ivt-note">Tarda unos segundos. Elegimos colores, letras, portada y adornos a partir de lo que habéis escrito.</p>}
              {iaError && <p className="ivt-err" role="alert">{iaError}</p>}
              {iaRestantes !== null && !iaError && <p className="ivt-note">Te quedan {iaRestantes} hoy.</p>}
              {temaIA && cfg.tema !== 'ia' && (
                <button type="button" className="ivt-link" onClick={() => upd({ tema: 'ia' })}>Volver a «{temaIA.nombre}»</button>
              )}
              {temaIA && (temaIA.saludo || temaIA.mensaje) && (
                <div className="ivt-ia-txt">
                  <p className="ivt-note">También os propone unos textos con el mismo tono:</p>
                  {temaIA.saludo && <p className="ivt-ia-q"><b>{temaIA.saludo}</b></p>}
                  {temaIA.mensaje && <p className="ivt-ia-q">{temaIA.mensaje}</p>}
                  <button type="button" className="ivt-link" onClick={usarTextosIA}>Usar estos textos</button>
                </div>
              )}
            </div>
          )}
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

        <Grupo titulo="Cómo será el día">
          <Variantes parte="programa" actual={cfg.variantes.programa} onChange={cambiarVariante} />
          {momentos.length === 0 ? (
            <p className="ivt-note">Añade momentos en el Cronograma para que aparezcan aquí.</p>
          ) : (
            <>
              <p className="ivt-note">
                Sale lo que interesa a los invitados. Lo demás de tu Cronograma (coche, peluquería…) queda solo para vosotros.
                Puedes cambiar el nombre que verán.
              </p>
              <ul className="ivt-momentos">
                {momentos.map(m => (
                  <li key={m.id} className={m.visible ? '' : 'off'}>
                    <input type="checkbox" checked={m.visible} onChange={e => verMomento(m.id, e.target.checked)}
                      aria-label={`Mostrar ${m.nombre}`} />
                    <span className="ivt-m-hora">{m.hora || '–'}</span>
                    <input className="ivt-in ivt-m-tit" value={cfg.programaTitulos[m.id] ?? ''} placeholder={m.nombre}
                      onChange={e => tituloMomento(m.id, e.target.value)} disabled={!m.visible} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="ivt-note">
            {nBuses > 0
              ? `Los autobuses tienen su propia parte y tus invitados podrán pedir plaza al confirmar.`
              : 'Si añades autobuses en el Cronograma, tus invitados podrán pedir plaza al confirmar.'}
          </p>
        </Grupo>

        <Grupo titulo="Partes de la invitación">
          <p className="ivt-note">Quita lo que no quieras enseñar. También puedes hacerlo con la × de la vista previa.</p>
          <div className="ivt-partes">
            {SECCIONES.map(x => (
              <label key={x.id} className="ivt-check">
                <input type="checkbox" checked={!cfg.ocultas.includes(x.id)} onChange={e => verSeccion(x.id, e.target.checked)} />
                {x.label}
              </label>
            ))}
          </div>
          <div className="ivt-sub">Cuenta atrás</div>
          <Variantes parte="cuenta" actual={cfg.variantes.cuenta} onChange={cambiarVariante} />
          <div className="ivt-sub">Dónde y cuándo</div>
          <Variantes parte="lugares" actual={cfg.variantes.lugares} onChange={cambiarVariante} />
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
          <span>Vista previa <small className="ivt-prev-tip">· usa ‹ › para cambiar el diseño y × para quitar</small></span>
          <div className="ivt-seg" role="group" aria-label="Tamaño de la vista previa">
            <button aria-pressed={dispositivo === 'movil'} onClick={() => setDispositivo('movil')}>Móvil</button>
            <button aria-pressed={dispositivo === 'ordenador'} onClick={() => setDispositivo('ordenador')}>Ordenador</button>
          </div>
        </div>
        <div className="ivt-prev-area">
          <div ref={vistaRef} className={`ivt-device ${dispositivo}`}>
            <InvitacionView data={vista} mode="preview" edit={edicion} />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══ PIEZAS DEL EDITOR ═══ */

function Variantes({ parte, actual, onChange }: {
  parte: ParteConVariantes; actual?: string; onChange: (p: ParteConVariantes, id: string) => void
}) {
  return (
    <div className="ivt-seg ivt-var" role="group" aria-label="Diseño">
      {VARIANTES[parte].map(v => (
        <button key={v.id} type="button" aria-pressed={actual === v.id} onClick={() => onChange(parte, v.id)}>{v.label}</button>
      ))}
    </div>
  )
}

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
