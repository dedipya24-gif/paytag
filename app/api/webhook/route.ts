import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

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
    const raw = await req.text()
    console.log('[WEBHOOK] Raw body received:', raw)
    payload = JSON.parse(raw)
  } catch {
    console.log('[WEBHOOK] ERROR: Failed to parse JSON body')
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, data } = payload
  console.log('[WEBHOOK] Event:', event)
  console.log('[WEBHOOK] Data:', JSON.stringify(data, null, 2))

  if (event !== 'transaction.succeeded') {
    console.log('[WEBHOOK] Ignored — not transaction.succeeded, got:', event)
    return Response.json({ received: true })
  }

  if (!data.recipient) {
    console.log('[WEBHOOK] ERROR: No recipient in payload — cannot match payment')
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] Looking up creator with wallet:', data.recipient)

  // 1. Find creator by wallet address (case-insensitive)
  const { data: creator, error: creatorError } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .ilike('wallet_address', data.recipient)
    .maybeSingle()

  if (creatorError) {
    console.log('[WEBHOOK] ERROR: Supabase error looking up creator:', creatorError.message)
    return Response.json({ received: true })
  }

  if (!creator) {
    console.log('[WEBHOOK] ERROR: No creator found with wallet:', data.recipient)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] Found creator:', creator.username, '| id:', creator.id)

  // 2. Find most recent pending payment for this creator
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('id, amount_usd, status')
    .eq('creator_id', creator.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (paymentError) {
    console.log('[WEBHOOK] ERROR: Supabase error looking up payment:', paymentError.message)
    return Response.json({ received: true })
  }

  if (!payment) {
    console.log('[WEBHOOK] ERROR: No pending payment found for creator:', creator.username)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] Found pending payment:', payment.id, '| amount:', payment.amount_usd)

  // 3. Mark it succeeded
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      tx_hash: data.hash || null,
      settlement_amount: data.settlementAmount || null,
      sender_address: data.sender || null,
      kirapay_link_id: data._id,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.log('[WEBHOOK] ERROR: Failed to update payment:', updateError.message)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] SUCCESS: Payment', payment.id, 'marked as succeeded')
  return Response.json({ received: true })
}
