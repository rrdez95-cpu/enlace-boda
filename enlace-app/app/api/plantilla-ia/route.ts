import { NextResponse } from 'next/server'
import { createClient as clienteServicio } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase-server'
import { ESQUEMA_IA, SISTEMA_IA, limpiarTemaIA } from '@/lib/plantilla-ia'

/* Crea una plantilla de invitación a partir de lo que escriben los novios.
   Necesita en Vercel: ANTHROPIC_API_KEY (y opcionalmente ANTHROPIC_MODEL).
   Lleva la cuenta de usos en la tabla plantillas_ia para limitar el gasto. */

export const maxDuration = 60

const LIMITE_DIA = { premium: 20, resto: 3 }
const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5'

export async function POST(request: Request) {
  // Solo con cuenta
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Crea tu cuenta gratis para diseñar tu plantilla.' }, { status: 401 })
  }

  let prompt = ''
  try {
    const body = await request.json()
    prompt = typeof body?.prompt === 'string' ? body.prompt.replace(/\s+/g, ' ').trim().slice(0, 300) : ''
  } catch { /* cuerpo vacío */ }
  if (prompt.length < 3) {
    return NextResponse.json({ error: 'Cuéntanos un poco cómo la imagináis.' }, { status: 400 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'El diseño con IA no está disponible ahora mismo.' }, { status: 503 })
  }

  const admin = clienteServicio(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )

  // Límite diario
  const [{ data: perfil }, usos] = await Promise.all([
    admin.from('profiles').select('is_premium').eq('id', user.id).single(),
    admin.from('plantillas_ia').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).gte('created_at', new Date(Date.now() - 864e5).toISOString()),
  ])
  if (usos.error) {
    console.error('plantillas_ia', usos.error)
    return NextResponse.json({ error: 'El diseño con IA no está disponible ahora mismo.' }, { status: 503 })
  }
  const limite = perfil?.is_premium ? LIMITE_DIA.premium : LIMITE_DIA.resto
  const usadas = usos.count || 0
  if (usadas >= limite) {
    return NextResponse.json({
      error: perfil?.is_premium
        ? 'Has creado muchas plantillas hoy. Mañana podrás crear más.'
        : `Puedes crear ${limite} plantillas al día. Con el plan premium tienes ${LIMITE_DIA.premium}.`,
      restantes: 0,
    }, { status: 429 })
  }

  // Pedir el diseño
  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: MODELO,
        max_tokens: 1500,
        system: SISTEMA_IA,
        tools: [{
          name: 'crear_plantilla',
          description: 'Devuelve el diseño de la plantilla de invitación',
          input_schema: ESQUEMA_IA,
        }],
        tool_choice: { type: 'tool', name: 'crear_plantilla' },
        messages: [{ role: 'user', content: `Los novios piden: «${prompt}»` }],
      }),
      signal: AbortSignal.timeout(50000),
    })
  } catch (e) {
    console.error('anthropic', e)
    return NextResponse.json({ error: 'Ha tardado demasiado. Inténtalo otra vez.' }, { status: 504 })
  }
  if (!res.ok) {
    console.error('anthropic', res.status, await res.text().catch(() => ''))
    return NextResponse.json({ error: 'No se ha podido crear la plantilla. Inténtalo otra vez.' }, { status: 502 })
  }

  const json = await res.json() as { content?: { type: string; input?: Record<string, unknown> }[] }
  const entrada = json.content?.find(c => c.type === 'tool_use')?.input
  if (!entrada) {
    return NextResponse.json({ error: 'No se ha podido crear la plantilla. Inténtalo otra vez.' }, { status: 502 })
  }

  const tema = limpiarTemaIA(entrada, prompt)
  await admin.from('plantillas_ia').insert({ user_id: user.id, prompt })

  return NextResponse.json({ tema, restantes: Math.max(0, limite - usadas - 1) })
}
