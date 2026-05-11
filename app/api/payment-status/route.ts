import { supabaseAdmin } from '@/lib/supabase'
import { getTransactions } from '@/lib/kirapay'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')

  if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status, unlockable_id, settlement_amount, token_in_symbol, kirapay_link_id')
    .eq('id', orderId)
    .maybeSingle()

  if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })

  if (payment.status === 'succeeded') return resolveSecret(payment)

  // Webhook fallback: search KIRAPAY by customOrderId (= payment.id)
  try {
    type KiraTransaction = {
      paymentLinkId?: string
      status: string
      settlementAmount?: string | number
      tokenIn?: { symbol: string }
    }

    const txData = await getTransactions(1, 5, payment.id)
    // Handle both { transactions: [...] } and array-at-root response shapes
    const transactions: KiraTransaction[] = Array.isArray(txData)
      ? txData
      : (txData?.transactions ?? [])

    const match = transactions.find((tx) => tx.status === 'Success')

    if (match) {
      const settlementAmount = match.settlementAmount != null
        ? parseFloat(String(match.settlementAmount))
        : null

      await supabaseAdmin
        .from('payments')
        .update({
          status: 'succeeded',
          settlement_amount: settlementAmount,
          token_in_symbol: match.tokenIn?.symbol ?? null,
          kirapay_link_id: match.paymentLinkId ?? null,
        })
        .eq('id', payment.id)

      return resolveSecret({
        ...payment,
        status: 'succeeded',
        settlement_amount: settlementAmount,
        token_in_symbol: match.tokenIn?.symbol ?? null,
      })
    }
  } catch (err) {
    console.error('[PAYMENT-STATUS] KIRAPAY fallback check failed:', err)
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
