import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { codigo, nombre, apellido, asiste, nombre_acomp, intolerancia, necesita_bus, ruta_bus } = body

    if (!codigo || !nombre || asiste === undefined) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Buscar la boda por código de invitación
    const { data: boda, error: bodaError } = await supabase
      .from('bodas')
      .select('id')
      .filter('datos->invitacion->>codigo', 'eq', codigo)
      .filter('datos->invitacion->>activa', 'eq', 'true')
      .single()

    if (bodaError || !boda) {
      return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 })
    }

    const records = []

    // Registro principal
    records.push({
      boda_id: boda.id,
      nombre: nombre.trim(),
      apellido: apellido?.trim() || null,
      asiste,
      num_acomp: nombre_acomp ? 1 : 0,
      intolerancia: intolerancia?.trim() || null,
      necesita_bus: necesita_bus || false,
      ruta_bus: ruta_bus || null,
      importado: false,
    })

    // Acompañante si existe
    if (asiste && nombre_acomp?.trim()) {
      records.push({
        boda_id: boda.id,
        nombre: nombre_acomp.trim(),
        apellido: null,
        asiste: true,
        num_acomp: 0,
        intolerancia: intolerancia?.trim() || null,
        necesita_bus: necesita_bus || false,
        ruta_bus: ruta_bus || null,
        importado: false,
      })
    }

    const { error: insertError } = await supabase
      .from('rsvp_responses')
      .insert(records)

    if (insertError) {
      console.error('[rsvp] Insert error:', insertError)
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rsvp] Error:', err)
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}