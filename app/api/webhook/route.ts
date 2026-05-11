import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

// Per KIRAPAY docs, the transaction.succeeded webhook payload is:
// {
//   "event": "transaction.succeeded",
//   "data": {
//     "_id": "...",
//     "status": "Success",
//     "hash": "0x...",
//     "price": 22.4,
//     "settlementAmount": 22.4,
//     "sender": "0x...",
//     "recipient": "0x...",     // ← creator's wallet (our reconciliation key)
//     "createdAt": "..."
//   }
// }
// Note: customOrderId is NOT in the webhook payload, so we reconcile via the
// recipient wallet + most-recent pending payment for that creator.

type WebhookPayload = {
  event?: string
  data?: {
    _id?: string
    status?: string
    hash?: string
    settlementAmount?: number | string
    sender?: string
    recipient?: string
    createdAt?: string
  }
}

export async function POST(req: NextRequest) {
  let payload: WebhookPayload

  try {
    const raw = await req.text()
    payload = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event
  const data = payload.data ?? {}

  console.log('[WEBHOOK] event=', event, 'tx=', data._id, 'recipient=', data.recipient)

  if (event !== 'transaction.succeeded') {
    return Response.json({ received: true })
  }

  if (!data.recipient) {
    console.error('[WEBHOOK] No recipient in payload — cannot reconcile')
    return Response.json({ received: true })
  }

  // Find creator by recipient wallet (case-insensitive — MetaMask checksums)
  const { data: creator } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .ilike('wallet_address', data.recipient)
    .maybeSingle()

  if (!creator) {
    console.log('[WEBHOOK] No creator for wallet:', data.recipient)
    return Response.json({ received: true })
  }

  // Find most-recent pending payment for this creator
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('creator_id', creator.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!payment) {
    console.log('[WEBHOOK] No pending payment for creator:', creator.username)
    return Response.json({ received: true })
  }

  // Idempotency — safe to replay duplicate webhooks
  if (payment.status === 'succeeded') {
    return Response.json({ received: true, idempotent: true })
  }

  const settlementAmount =
    data.settlementAmount != null ? parseFloat(String(data.settlementAmount)) : null

  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      tx_hash: data.hash ?? null,
      settlement_amount: settlementAmount,
      sender_address: data.sender ?? null,
      kirapay_link_id: data._id ?? null,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('[WEBHOOK] Failed to update payment:', updateError.message)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] SUCCESS — payment', payment.id, 'marked succeeded')
  return Response.json({ received: true })
}
