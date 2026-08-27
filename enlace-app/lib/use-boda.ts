'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from './supabase-client'
import { BodaData, emptyBoda } from './types'

export function useBoda(userId: string) {
  const supabase = createClient()
  const [data, setData] = useState<BodaData>(emptyBoda)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bodaId, setBodaId] = useState<string | null>(null)
  const saveTimer = useRef<NodeJS.Timeout | null>(null)
  const firstLoad = useRef(true)

  // Cargar datos al montar
  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data: boda, error } = await supabase
        .from('bodas')
        .select('id, datos')
        .eq('user_id', userId)
        .single()

      if (cancelled) return

      if (error || !boda) {
        // Crear boda si no existe
        const { data: nueva } = await supabase
          .from('bodas')
          .insert({ user_id: userId, datos: emptyBoda })
          .select('id, datos')
          .single()
        if (nueva && !cancelled) {
          setBodaId(nueva.id)
          setData({ ...emptyBoda, ...(nueva.datos || {}) })
        }
      } else {
        setBodaId(boda.id)
        setData({ ...emptyBoda, ...(boda.datos || {}) })
      }
      if (!cancelled) setLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [userId])

  // Guardar con debounce
  useEffect(() => {
    if (loading || !bodaId) return
    if (firstLoad.current) { firstLoad.current = false; return }

    if (saveTimer.current) clearTimeout(saveTimer.current)
    setSaving(true)

    saveTimer.current = setTimeout(async () => {
      await supabase
        .from('bodas')
        .update({ datos: data, updated_at: new Date().toISOString() })
        .eq('id', bodaId)
      setSaving(false)
    }, 900)

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [data, bodaId, loading])

  // Actualizar una parte del estado
  const update = useCallback((patch: Partial<BodaData>) => {
    setData(prev => ({ ...prev, ...patch }))
  }, [])

  // Generar ID incremental
  const nextId = useCallback((key: 'gid' | 'mid' | 'eid' | 'pvid' | 'ckid' | 'riid') => {
    let val = 0
    setData(prev => { val = prev[key]; return { ...prev, [key]: prev[key] + 1 } })
    return val
  }, [])

  return { data, setData, update, nextId, loading, saving }
}