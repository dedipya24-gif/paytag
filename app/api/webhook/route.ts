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
    tokenIn?: { symbol?: string; chainId?: number }
    customOrderId?: string
  }
}

export async function POST(req: NextRequest) {
  let payload: WebhookPayload
  try {
    payload = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { event, data } = payload

  if (event !== 'transaction.succeeded') {
    return Response.json({ received: true })
  }

  if (data.customOrderId) {
    // Update the existing pending payment record
    await supabaseAdmin
      .from('payments')
      .update({
        status: 'succeeded',
        tx_hash: data.hash || null,
        settlement_amount: data.settlementAmount || null,
        token_in_symbol: data.tokenIn?.symbol || null,
        source_chain_id: data.tokenIn?.chainId || null,
        sender_address: data.sender || null,
        kirapay_link_id: data._id,
      })
      .eq('id', data.customOrderId)
  }

  return Response.json({ received: true })
}
