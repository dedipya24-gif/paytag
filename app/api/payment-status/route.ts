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

  // Already succeeded — return the secret immediately
  if (payment.status === 'succeeded') {
    return resolveSecret(payment)
  }

  // Still pending — check KIRAPAY directly as webhook fallback
  if (payment.kirapay_link_id) {
    try {
      const txData = await getTransactions(1, 50)
      const match = (txData.transactions as Array<{ paymentLinkId: string; status: string; settlementAmount: string; tokenIn?: { symbol: string } }>)
        .find((tx) => tx.paymentLinkId === payment.kirapay_link_id && tx.status === 'Success')

      if (match) {
        // KIRAPAY confirmed success — update DB and return secret
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'succeeded',
            settlement_amount: parseFloat(match.settlementAmount),
            token_in_symbol: match.tokenIn?.symbol ?? null,
          })
          .eq('id', payment.id)

        return resolveSecret({ ...payment, status: 'succeeded', settlement_amount: parseFloat(match.settlementAmount) })
      }
    } catch (err) {
      console.error('[PAYMENT-STATUS] KIRAPAY fallback check failed:', err)
    }
  }

  return Response.json({ status: payment.status })
}

async function resolveSecret(payment: { id: string; status: string; unlockable_id: string; settlement_amount: number | null; token_in_symbol: string | null }) {
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
      ? {
          title: unlockable.title,
          content: unlockable.secret_content,
          type: unlockable.secret_type,
        }
      : null,
  })
}
