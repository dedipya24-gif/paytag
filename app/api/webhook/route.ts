import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  // ── Parse ──────────────────────────────────────────────────────────────────
  let raw: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let payload: any

  try {
    raw = await req.text()
  } catch {
    console.error('[WEBHOOK] ERROR: could not read body')
    return Response.json({ error: 'Could not read body' }, { status: 400 })
  }

  // Print the full raw body prominently so it's easy to find in Vercel logs
  console.log('=== KIRAPAY WEBHOOK RAW BODY START ===')
  console.log(raw)
  console.log('=== KIRAPAY WEBHOOK RAW BODY END ===')

  try {
    payload = JSON.parse(raw)
  } catch {
    console.error('[WEBHOOK] ERROR: body is not valid JSON:', raw)
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Log the full parsed payload with all top-level keys so we can spot schema differences
  console.log('[WEBHOOK] Parsed payload keys:', Object.keys(payload))
  console.log('[WEBHOOK] Full payload:', JSON.stringify(payload, null, 2))

  // ── Normalise field names across KIRAPAY schema versions ───────────────────
  // Docs show two variants:
  //   Schema A (Webhooks page):  { event, data: { _id, recipient, sender, hash, price, settlementAmount } }
  //   Schema B (Overview page):  { event, data: { transactionId, receiver, sender, amount, currency, settlementAmount, customOrderId } }
  const event: string | undefined =
    payload.event ?? payload.type ?? payload.eventType ?? payload.data?.event

  const data = payload.data ?? payload

  // Wallet the creator receives funds into — "recipient" (Schema A) or "receiver" (Schema B)
  const recipientWallet: string | undefined = data.recipient ?? data.receiver

  // Transaction ID — "_id" (Schema A) or "transactionId" (Schema B)
  const txId: string | undefined = data._id ?? data.transactionId

  console.log('[WEBHOOK] Resolved event:', event)
  console.log('[WEBHOOK] Resolved recipient wallet:', recipientWallet)
  console.log('[WEBHOOK] Resolved tx id:', txId)

  // ── Filter ─────────────────────────────────────────────────────────────────
  if (!event || event !== 'transaction.succeeded') {
    console.log('[WEBHOOK] Ignored — event is not transaction.succeeded, got:', event)
    return Response.json({ received: true })
  }

  if (!recipientWallet) {
    console.log('[WEBHOOK] ERROR: No recipient/receiver in payload — cannot match payment')
    return Response.json({ received: true })
  }

  // ── Look up creator ────────────────────────────────────────────────────────
  console.log('[WEBHOOK] Looking up creator with wallet:', recipientWallet)

  const { data: creator, error: creatorError } = await supabaseAdmin
    .from('users')
    .select('id, username')
    .ilike('wallet_address', recipientWallet)
    .maybeSingle()

  if (creatorError) {
    console.error('[WEBHOOK] ERROR: Supabase error looking up creator:', creatorError.message)
    return Response.json({ received: true })
  }

  if (!creator) {
    console.log('[WEBHOOK] ERROR: No creator found with wallet:', recipientWallet)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] Found creator:', creator.username, '| id:', creator.id)

  // ── Look up most-recent pending payment for this creator ───────────────────
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from('payments')
    .select('id, amount_usd, status')
    .eq('creator_id', creator.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (paymentError) {
    console.error('[WEBHOOK] ERROR: Supabase error looking up payment:', paymentError.message)
    return Response.json({ received: true })
  }

  if (!payment) {
    console.log('[WEBHOOK] ERROR: No pending payment found for creator:', creator.username)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] Found pending payment:', payment.id, '| amount:', payment.amount_usd)

  // ── Mark succeeded ─────────────────────────────────────────────────────────
  const { error: updateError } = await supabaseAdmin
    .from('payments')
    .update({
      status: 'succeeded',
      tx_hash: data.hash ?? null,
      settlement_amount: data.settlementAmount ?? null,
      sender_address: data.sender ?? null,
      kirapay_link_id: txId ?? null,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('[WEBHOOK] ERROR: Failed to update payment:', updateError.message)
    return Response.json({ received: true })
  }

  console.log('[WEBHOOK] SUCCESS: Payment', payment.id, 'marked as succeeded')
  return Response.json({ received: true })
}
