import { supabaseAdmin } from '@/lib/supabase'
import { getTransactions } from '@/lib/kirapay'
import { NextRequest } from 'next/server'

// The unlock page polls this endpoint every 2s while waiting for payment.
//
// Primary path: webhook fires → payments.status flips to 'succeeded' → we return the secret.
// Safety net:   if KIRAPAY's webhook never fires (we've observed this), check KIRAPAY's
//               transactions API directly. The docs only put `recipient` + timestamp on
//               the transaction record, so that's how we match.

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')
  if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status, unlockable_id, settlement_amount, token_in_symbol, creator_id, created_at')
    .eq('id', orderId)
    .maybeSingle()

  if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })

  if (payment.status === 'succeeded') return resolveSecret(payment)

  // Safety net — query KIRAPAY directly for a Success transaction matching this creator
  try {
    const { data: creator } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('id', payment.creator_id)
      .maybeSingle()

    if (creator?.wallet_address) {
      const txData = await getTransactions(1, 50)
      const txList: Array<{
        status: string
        recipient: string
        settlementAmount?: string | number
        updatedAt?: string
        tokenIn?: { symbol: string }
        _id?: string
      }> = txData?.transactions ?? []

      const paymentCreatedAt = new Date(payment.created_at).getTime()

      const match = txList.find((tx) => {
        if (tx.status !== 'Success') return false
        if (tx.recipient.toLowerCase() !== creator.wallet_address.toLowerCase()) return false
        const txTime = tx.updatedAt ? new Date(tx.updatedAt).getTime() : 0
        // Must be at or after the payment was created (small 30s grace for clock skew)
        return txTime >= paymentCreatedAt - 30_000
      })

      if (match) {
        const settlementAmount =
          match.settlementAmount != null ? parseFloat(String(match.settlementAmount)) : null

        await supabaseAdmin
          .from('payments')
          .update({
            status: 'succeeded',
            settlement_amount: settlementAmount,
            token_in_symbol: match.tokenIn?.symbol ?? null,
            kirapay_link_id: match._id ?? null,
          })
          .eq('id', payment.id)

        return resolveSecret({
          ...payment,
          status: 'succeeded',
          settlement_amount: settlementAmount,
          token_in_symbol: match.tokenIn?.symbol ?? null,
        })
      }
    }
  } catch (err) {
    console.error('[PAYMENT-STATUS] KIRAPAY safety-net check failed:', err)
  }

  return Response.json({ status: payment.status })
}

async function resolveSecret(payment: {
  id: string
  status: string
  unlockable_id: string
  settlement_amount: number | null
  token_in_symbol: string | null
}) {
  const { data: unlockable } = await supabaseAdmin
    .from('unlockables')
    .select('title, secret_content, secret_type')
    .eq('id', payment.unlockable_id)
    .maybeSingle()

  return Response.json({
    status: 'succeeded',
    settlement_amount: payment.settlement_amount,
    token_in_symbol: payment.token_in_symbol,
    secret: unlockable
      ? { title: unlockable.title, content: unlockable.secret_content, type: unlockable.secret_type }
      : null,
  })
}
