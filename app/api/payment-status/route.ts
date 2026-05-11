import { supabaseAdmin } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get('orderId')

  if (!orderId) return Response.json({ error: 'Missing orderId' }, { status: 400 })

  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status, unlockable_id, settlement_amount, token_in_symbol')
    .eq('id', orderId)
    .maybeSingle()

  if (!payment) return Response.json({ error: 'Payment not found' }, { status: 404 })

  if (payment.status !== 'succeeded') {
    return Response.json({ status: payment.status })
  }

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
