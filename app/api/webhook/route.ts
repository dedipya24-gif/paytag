import { supabaseAdmin } from '@/lib/supabase'
import { getTransactionById } from '@/lib/kirapay'
import { NextRequest } from 'next/server'

type WebhookPayload = {
  event?: string
  type?: string
  data?: {
    _id?: string
    transactionId?: string
    customOrderId?: string
    hash?: string
    sender?: string
    recipient?: string
    receiver?: string
    settlementAmount?: number | string
    tokenIn?: { symbol?: string }
  }
}

export async function POST(req: NextRequest) {
  let raw: string
  let payload: WebhookPayload

  try {
    raw = await req.text()
  } catch {
    return Response.json({ error: 'Could not read body' }, { status: 400 })
  }

  console.log('=== KIRAPAY WEBHOOK RAW BODY START ===')
  console.log(raw)
  console.log('=== KIRAPAY WEBHOOK RAW BODY END ===')

  try {
    payload = JSON.parse(raw)
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.event ?? payload.type
  const data = payload.data ?? {}
  const txId = data._id ?? data.transactionId

  console.log('[WEBHOOK] event=', event, 'txId=', txId)

  if (event !== 'transaction.succeeded') {
    console.log('[WEBHOOK] Ignored — event is not transaction.succeeded')
    return Response.json({ received: true })
  }

  if (!txId) {
    console.error('[WEBHOOK] No transaction id in payload — cannot reconcile')
    return Response.json({ received: true })
  }

  // Resolve customOrderId — prefer the webhook body, fall back to fetching the tx
  let customOrderId = data.customOrderId
  let fullTx: Record<string, unknown> = data as Record<string, unknown>

  if (!customOrderId) {
    try {
      const tx = await getTransactionById(txId)
      fullTx = tx as Record<string, unknown>
      customOrderId = (tx?.customOrderId ?? tx?.customOrderID) as string | undefined
      console.log('[WEBHOOK] Resolved customOrderId from tx fetch:', customOrderId)
    } catch (err) {
      console.error('[WEBHOOK] Failed to fetch tx for customOrderId:', err)
    }
  }

  if (!customOrderId) {
    console.error('[WEBHOOK] No customOrderId — cannot reconcile')
    return Response.json({ received: true })
  }

  // Look up our pending payment by id = customOrderId
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('id', customOrderId)
    .maybeSingle()

  if (paymentError) {
    console.error('[WEBHOOK] Supabase error looking up payment:', paymentError.message)
    return Response.json({ received: true })
  }

  if (!payment) {
    console.log('[WEBHOOK] No matching payment for customOrderId — ignoring:', customOrderId)
    return Response.json({ received: true })
  }

  // Idempotency: if already succeeded, skip silently — safe to replay
  if (payment.status === 'succeeded') {
    console.log('[WEBHOOK] Payment already succeeded — skipping:', payment.id)
    return Response.json({ received: true, idempotent: true })
  }

  // Update payment to succeeded
  const settlementAmount =
    fullTx.settlementAmount != null ? parseFloat(String(fullTx.settlementAmount)) : null
  const tokenInSymbol =
    (fullTx.tokenIn as { symbol?: string } | undefined)?.symbol ?? null
  const txHash =
    (fullTx.inputTransactionHash as string | undefined) ??
    (fullTx.hash as string | undefined) ??
    null
  const sender = (fullTx.sender as string | undefined) ?? null

  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      tx_hash: txHash,
      settlement_amount: settlementAmount,
      sender_address: sender,
      kirapay_link_id: txId,
      token_in_symbol: tokenInSymbol,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('[WEBHOOK] Failed to update payment:', updateError.message)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] SUCCESS: Payment', payment.id, 'marked as succeeded')
  return Response.json({ received: true })
}
