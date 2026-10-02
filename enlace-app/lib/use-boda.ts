'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createClient } from './supabase-client'
import { BodaData, emptyBoda } from './types'
import { subirFotosPendientes } from './fotos'

// Donde se guarda la boda de quien todavía no tiene cuenta
export const CLAVE_INVITADO = 'enlace:boda-invitado'

export function bodaVacia(d: BodaData): boolean {
  const r = d.resumen || {}
  return !(
    d.guests?.length || d.mesas?.length || d.eventos?.length || d.proveedores?.length || d.fincas?.length ||
    d.invitacion ||
    Object.values(r).some(v => typeof v === 'string' && v.trim()) ||
    d.checklist?.some(c => c.done) ||
    Object.values(d.rItems || {}).some(l => l?.some(i => i.text?.trim()))
  )
}

function leerInvitado(): BodaData | null {
  if (typeof window === 'undefined') return null
  try {
    const s = window.localStorage.getItem(CLAVE_INVITADO)
    return s ? { ...emptyBoda, ...JSON.parse(s) } : null
  } catch {
    return null
  }
}

export function useBoda(userId: string | null) {
  const supabase = useMemo(() => createClient(), [])
  const [data, setData] = useState<BodaData>(emptyBoda)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bodaId, setBodaId] = useState<string | null>(null)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saltarGuardado = useRef(true)

  // Cargar
  useEffect(() => {
    let cancelado = false
    setLoading(true)
    saltarGuardado.current = true

    async function cargar() {
      // Sin cuenta: la boda vive en este navegador
      if (!userId) {
        const local = leerInvitado()
        if (!cancelado) {
          setBodaId(null)
          setData(local || emptyBoda)
          setLoading(false)
        }
        return
      }

      let { data: boda } = await supabase.from('bodas').select('id, datos').eq('user_id', userId).maybeSingle()
      if (!boda) {
        const { data: nueva } = await supabase
          .from('bodas').insert({ user_id: userId, datos: emptyBoda }).select('id, datos').single()
        boda = nueva
      }
      if (cancelado) return
      if (!boda) { setLoading(false); return }

      let datos: BodaData = { ...emptyBoda, ...(boda.datos || {}) }

      // Si empezó a organizar la boda sin cuenta, se pasa a su cuenta
      const local = leerInvitado()
      if (local && !bodaVacia(local)) {
        const usar = bodaVacia(datos) || window.confirm(
          'Tienes una boda empezada sin cuenta en este navegador. ¿Quieres guardarla en tu cuenta? Sustituirá lo que tienes guardado ahora.'
        )
        if (usar) {
          datos = await subirFotosPendientes(supabase, userId, local)
          await supabase.from('bodas')
            .update({ datos, updated_at: new Date().toISOString() }).eq('id', boda.id)
        }
        try { window.localStorage.removeItem(CLAVE_INVITADO) } catch { /* sin acceso */ }
      }
      if (cancelado) return

      setBodaId(boda.id)
      setData(datos)
      setLoading(false)
    }

    cargar()
    return () => { cancelado = true }
  }, [userId, supabase])

  // Guardar con retardo
  useEffect(() => {
    if (loading) return
    if (saltarGuardado.current) { saltarGuardado.current = false; return }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)

    saveTimer.current = setTimeout(async () => {
      if (!userId) {
        try {
          window.localStorage.setItem(CLAVE_INVITADO, JSON.stringify(data))
        } catch (e) {
          console.warn('[boda] el navegador no tiene espacio para guardar', e)
        }
      } else if (bodaId) {
        await supabase.from('bodas')
          .update({ datos: data, updated_at: new Date().toISOString() }).eq('id', bodaId)
      }
      setSaving(false)
    }, userId ? 900 : 400)

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [data, bodaId, loading, userId, supabase])

  const update = useCallback((patch: Partial<BodaData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  const nextId = useCallback((key: 'gid' | 'mid' | 'eid' | 'pvid' | 'ckid' | 'riid') => {
    let val = 0
    setData(prev => { val = prev[key]; return { ...prev, [key]: prev[key] + 1 } })
    return val
  }, [])

  return { data, setData, update, nextId, loading, saving, bodaId }
}
