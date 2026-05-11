import { supabaseAdmin } from '@/lib/supabase'
import { getTransactions } from '@/lib/kirapay'
import { auth } from '@clerk/nextjs/server'

type KiraTx = {
  status: string
  settlementAmount?: string | number
  tokenIn?: { symbol: string }
  paymentLinkId?: string
  sender?: string
  summary?: { sender?: string }
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (!user) return Response.json({ error: 'Profile not found' }, { status: 404 })

  const [paymentsResult, unlockableResult] = await Promise.all([
    supabaseAdmin
      .from('payments')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('unlockables')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const payments = paymentsResult.data || []

  // For every pending payment, ask KiraPay directly — don't trust the webhook
  const pending = payments.filter(p => p.status === 'pending')
  if (pending.length > 0) {
    await Promise.all(
      pending.map(async (payment) => {
        try {
          const txData = await getTransactions(1, 1, payment.id)
          const txs: KiraTx[] = Array.isArray(txData) ? txData : (txData?.transactions ?? [])
          const match = txs.find(tx => tx.status === 'Success')
          if (!match) return

          const settlementAmount =
            match.settlementAmount != null ? parseFloat(String(match.settlementAmount)) : null
          const senderAddress = match.sender ?? match.summary?.sender ?? null

          await supabaseAdmin
            .from('payments')
            .update({
              status: 'succeeded',
              settlement_amount: settlementAmount,
              token_in_symbol: match.tokenIn?.symbol ?? null,
              kirapay_link_id: match.paymentLinkId ?? null,
              sender_address: senderAddress,
            })
            .eq('id', payment.id)

          // Mutate in-place so the response reflects the real status
          payment.status = 'succeeded'
          payment.settlement_amount = settlementAmount
          payment.token_in_symbol = match.tokenIn?.symbol ?? null
          payment.sender_address = senderAddress
        } catch {
          // KiraPay check failed — keep the Supabase status as-is
        }
      })
    )
  }

  return Response.json({
    user,
    payments,
    unlockable: unlockableResult.data || null,
  })
}
