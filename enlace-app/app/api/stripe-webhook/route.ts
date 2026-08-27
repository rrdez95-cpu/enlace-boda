import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Config incompleta' }, { status: 500 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Sin firma' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('[webhook] Firma inválida:', err)
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email
    const clientRef = session.client_reference_id

    if (!email && !clientRef) {
      console.warn('[webhook] Sin email ni referencia')
      return NextResponse.json({ received: true })
    }

    // Cliente admin de Supabase (salta RLS)
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    })

    // Buscar por user id (client_reference_id) o por email
    let query = supabase.from('profiles').update({
      is_pro: true,
      stripe_customer_id: typeof session.customer === 'string' ? session.customer : null,
      updated_at: new Date().toISOString(),
    })

    if (clientRef) {
      query = query.eq('id', clientRef)
    } else {
      query = query.eq('email', email!)
    }

    const { error } = await query
    if (error) {
      console.error('[webhook] Error actualizando perfil:', error)
      return NextResponse.json({ error: 'Error BD' }, { status: 500 })
    }

    console.log('[webhook] PRO activado para', clientRef || email)
  }

  return NextResponse.json({ received: true })
}