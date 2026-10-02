import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Formato no válido' }, { status: 400 })
  }

  const codigo = texto(body.codigo, 120)
  const nombreCompleto = texto(body.nombre, 120)
  const asiste = body.asiste

  if (!codigo || !nombreCompleto || typeof asiste !== 'boolean') {
    return NextResponse.json({ error: 'Faltan el nombre o la respuesta' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  const { data: boda } = await supabase
    .from('bodas')
    .select('id, user_id, invitacion:datos->invitacion')
    .filter('datos->invitacion->>codigo', 'eq', codigo)
    .limit(1)
    .maybeSingle()

  const invitacion = (boda as { invitacion?: { activa?: boolean } } | null)?.invitacion
  if (!boda || !invitacion?.activa) {
    return NextResponse.json({ error: 'Esta invitación no está disponible' }, { status: 404 })
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('is_premium')
    .eq('id', boda.user_id)
    .single()

  if (!perfil?.is_premium) {
    return NextResponse.json({ error: 'Esta invitación no está disponible' }, { status: 404 })
  }

  const [nombre, ...apellidos] = nombreCompleto.split(/\s+/)
  const acompanante = asiste ? texto(body.nombre_acomp, 120) : ''
  const ruta = asiste ? texto(body.ruta_bus, 120) : ''

  const { error } = await supabase.from('rsvp_responses').insert({
    boda_id: boda.id,
    nombre,
    apellido: apellidos.join(' ') || null,
    asiste,
    num_acomp: acompanante ? 1 : 0,
    nombre_acomp: acompanante || null,
    intolerancia: asiste ? texto(body.intolerancia, 200) || null : null,
    necesita_bus: !!ruta,
    ruta_bus: ruta || null,
    mensaje: texto(body.mensaje, 600) || null,
    importado: false,
  })

  if (error) {
    console.error('[rsvp]', error.message)
    return NextResponse.json({ error: 'No se ha podido guardar la respuesta' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
