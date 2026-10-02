import type { SupabaseClient } from '@supabase/supabase-js'
import type { BodaData } from './types'

const BUCKET = 'invitaciones'

// Reduce las fotos del móvil antes de guardarlas
export async function reducirFoto(file: Blob, max = 1800, calidad = 0.84): Promise<Blob> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((ok, ko) => {
      const i = new Image()
      i.onload = () => ok(i)
      i.onerror = ko
      i.src = url
    })
    const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight))
    const c = document.createElement('canvas')
    c.width = Math.round(img.naturalWidth * k)
    c.height = Math.round(img.naturalHeight * k)
    c.getContext('2d')?.drawImage(img, 0, 0, c.width, c.height)
    return await new Promise<Blob>(ok => c.toBlob(b => ok(b || file), 'image/jpeg', calidad))
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function blobADataUrl(b: Blob): Promise<string> {
  return new Promise((ok, ko) => {
    const r = new FileReader()
    r.onload = () => ok(String(r.result))
    r.onerror = ko
    r.readAsDataURL(b)
  })
}

export async function subirFoto(sb: SupabaseClient, userId: string, hueco: string, blob: Blob): Promise<string> {
  const path = `${userId}/${hueco}-${Date.now()}.jpg`
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}

// Borra del almacenamiento una foto que ya no se usa
export async function borrarFoto(sb: SupabaseClient, url?: string): Promise<void> {
  if (!url) return
  const m = url.match(/\/storage\/v1\/object\/public\/invitaciones\/(.+)$/)
  if (!m) return
  try { await sb.storage.from(BUCKET).remove([decodeURIComponent(m[1])]) } catch { /* no pasa nada */ }
}

// Al crear la cuenta, las fotos guardadas en el navegador se suben al almacenamiento
export async function subirFotosPendientes(sb: SupabaseClient, userId: string, datos: BodaData): Promise<BodaData> {
  const inv = datos.invitacion
  if (!inv) return datos
  const subir = async (url: string | undefined, hueco: string) => {
    if (!url || !url.startsWith('data:')) return url
    try {
      const blob = await (await fetch(url)).blob()
      return await subirFoto(sb, userId, hueco, blob)
    } catch {
      return url
    }
  }
  return {
    ...datos,
    invitacion: {
      ...inv,
      fotoPortada: await subir(inv.fotoPortada, 'portada'),
      ceremonia: inv.ceremonia ? { ...inv.ceremonia, foto: await subir(inv.ceremonia.foto, 'ceremonia') } : inv.ceremonia,
      celebracion: inv.celebracion ? { ...inv.celebracion, foto: await subir(inv.celebracion.foto, 'celebracion') } : inv.celebracion,
    },
  }
}
