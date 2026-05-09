import { supabaseAdmin } from '@/lib/supabase'
import { createPaymentLink } from '@/lib/kirapay'
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const { username, unlockableId } = await req.json()

  if (!username || !unlockableId) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Get creator by username
  const { data: creator } = await supabaseAdmin
    .from('users')
    .select('id, wallet_address, username, settlement_chain_id, settlement_token_address')
    .eq('username', (username as string).toLowerCase())
    .maybeSingle()

  if (!creator) return Response.json({ error: 'Creator not found' }, { status: 404 })

  // Get the unlockable to confirm it belongs to this creator and get price
  const { data: unlockable } = await supabaseAdmin
    .from('unlockables')
    .select('id, price_usd, title')
    .eq('id', unlockableId)
    .eq('creator_id', creator.id)
    .maybeSingle()

  if (!unlockable) return Response.json({ error: 'Content not found' }, { status: 404 })

  // Create a pending payment record
  const { data: payment, error: insertError } = await supabaseAdmin
    .from('payments')
    .insert({
      creator_id: creator.id,
      unlockable_id: unlockable.id,
      amount_usd: unlockable.price_usd,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !payment) {
    return Response.json({ error: 'Failed to create payment record' }, { status: 500 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const tokenOut =
      creator.settlement_chain_id && creator.settlement_token_address
        ? { chainId: creator.settlement_chain_id, address: creator.settlement_token_address }
        : undefined

    const { url } = await createPaymentLink({
      receiverWallet: creator.wallet_address,
      amountUsd: unlockable.price_usd,
      itemTitle: unlockable.title,
      orderId: payment.id,
      redirectUrl: `${appUrl}/unlock/${payment.id}`,
      tokenOut,
    })

    return Response.json({ checkoutUrl: url })
  } catch (err: unknown) {
    await supabaseAdmin.from('payments').delete().eq('id', payment.id)
    const msg = err instanceof Error ? err.message : 'KIRAPAY error'
    return Response.json({ error: msg }, { status: 502 })
  }
}
