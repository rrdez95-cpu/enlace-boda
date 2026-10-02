import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import InvitacionView from '../../_components/invitacion/invitacion-view'
import { buildInvitacion, FONDO_TEMA } from '@/lib/invitacion'
import type { BodaData } from '@/lib/types'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ codigo: string }> }

// Solo se devuelve lo que se pinta en la invitación: nunca la lista de invitados ni el resto de datos
const cargar = cache(async (codigo: string) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: boda } = await supabase
    .from('bodas')
    .select('id, user_id, datos')
    .filter('datos->invitacion->>codigo', 'eq', codigo)
    .limit(1)
    .maybeSingle()

  const datos = boda?.datos as BodaData | undefined
  if (!boda || !datos?.invitacion?.activa) return null

  const { data: perfil } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', boda.user_id)
    .single()

  if (!perfil?.is_premium) return null
  return buildInvitacion(datos)
})

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { codigo } = await params
  const inv = await cargar(codigo)
  if (!inv) return { title: 'Invitación no disponible', robots: { index: false } }
  const nombres = inv.nombre2 ? `${inv.nombre1} & ${inv.nombre2}` : inv.nombre1
  const descripcion = inv.fechaLarga
    ? `Os esperamos el ${inv.fechaLarga.toLowerCase()}. Confirmad vuestra asistencia aquí.`
    : 'Confirmad vuestra asistencia aquí.'
  return {
    title: `${nombres} · Nos casamos`,
    description: descripcion,
    robots: { index: false, follow: false },
    openGraph: { title: `${nombres} · Nos casamos`, description: descripcion, type: 'website' },
  }
}

export default async function InvitacionPage({ params }: Params) {
  const { codigo } = await params
  const inv = await cargar(codigo)
  if (!inv) notFound()

  return (
    <>
      <style>{`html,body{height:auto!important;min-height:100%;overflow:auto!important;display:block!important;background:${FONDO_TEMA[inv.tema]}!important}`}</style>
      <InvitacionView data={inv} mode="live" codigo={codigo} />
    </>
  )
}
