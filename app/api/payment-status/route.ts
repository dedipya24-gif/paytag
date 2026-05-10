import { supabaseAdmin } from '@/lib/supabase'
import { getTransactions } from '@/lib/kirapay'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')

  if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status, unlockable_id, settlement_amount, token_in_symbol, kirapay_link_id, creator_id, created_at')
    .eq('id', orderId)
    .maybeSingle()

  if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })

  if (payment.status === 'succeeded') return resolveSecret(payment)

  // Webhook fallback: poll KIRAPAY directly
  try {
    // Get creator's wallet address to match against KIRAPAY recipient
    const { data: creator } = await supabaseAdmin
      .from('users')
      .select('wallet_address')
      .eq('id', payment.creator_id)
      .maybeSingle()

    if (creator?.wallet_address) {
      const txData = await getTransactions(1, 50)
      const paymentCreatedAt = new Date(payment.created_at).getTime()

      type KiraTransaction = {
        paymentLinkId: string
        status: string
        settlementAmount: string
        recipient: string
        updatedAt: string
        tokenIn?: { symbol: string }
      }

      const match = (txData.transactions as KiraTransaction[]).find((tx) => {
        if (tx.status !== 'Success') return false
        // Match by recipient wallet (case-insensitive)
        const walletMatch = tx.recipient.toLowerCase() === creator.wallet_address.toLowerCase()
        // Match by time: transaction must be after (or within 30s before) payment was created
        const txTime = new Date(tx.updatedAt).getTime()
        const timeMatch = txTime >= paymentCreatedAt - 30_000
        return walletMatch && timeMatch
      })

      if (match) {
        await supabaseAdmin
          .from('payments')
          .update({
            status: 'succeeded',
            settlement_amount: parseFloat(match.settlementAmount),
            token_in_symbol: match.tokenIn?.symbol ?? null,
            kirapay_link_id: match.paymentLinkId,
          })
          .eq('id', payment.id)

        return resolveSecret({
          ...payment,
          status: 'succeeded',
          settlement_amount: parseFloat(match.settlementAmount),
          token_in_symbol: match.tokenIn?.symbol ?? null,
        })
      }
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
