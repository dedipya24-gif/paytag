import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Real KIRAPAY webhook payload — no customOrderId, match via recipient wallet
type WebhookPayload = {
  event: string
  data: {
    _id: string
    status: string
    hash?: string
    price?: number
    settlementAmount?: number
    sender?: string
    recipient?: string
    createdAt?: string
  }
}

export async function POST(req: NextRequest) {
  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, data } = payload

  if (event !== 'transaction.succeeded') {
    return Response.json({ received: true })
  }

  if (!data.recipient) {
    return Response.json({ received: true })
  }

  // 1. Find creator by wallet address (case-insensitive — MetaMask vs KIRAPAY may differ in casing)
  const { data: creator } = await supabaseAdmin
    .from('users')
    .select('id')
    .ilike('wallet_address', data.recipient)
    .maybeSingle()

  if (!creator) {
    return Response.json({ received: true })
  }

  // 2. Find the most recent pending payment for this creator
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id')
    .eq('creator_id', creator.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment) {
    return Response.json({ received: true })
  }

  // 3. Mark it succeeded with the settlement details from KIRAPAY
  await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      tx_hash: data.hash || null,
      settlement_amount: data.settlementAmount || null,
      sender_address: data.sender || null,
      kirapay_link_id: data._id,
    })
    .eq('id', payment.id)

  return Response.json({ received: true })
}
