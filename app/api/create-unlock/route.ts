import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, description, priceUsd, secretContent, secretType, settlementChainId, settlementTokenAddress } = await req.json()

  if (!title || !priceUsd || !secretContent) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data: creator } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_id', userId)
    .maybeSingle()

  if (!creator) return Response.json({ error: 'Profile not found' }, { status: 404 })

  // Save settlement chain preference on user
  if (settlementChainId && settlementTokenAddress) {
    await supabaseAdmin
      .from('users')
      .update({ settlement_chain_id: settlementChainId, settlement_token_address: settlementTokenAddress })
      .eq('id', creator.id)
  }

  // Delete existing unlockable (one per creator for now)
  await supabaseAdmin.from('unlockables').delete().eq('creator_id', creator.id)

  const { data, error } = await supabaseAdmin
    .from('unlockables')
    .insert({
      creator_id: creator.id,
      title,
      description: description || null,
      price_usd: priceUsd,
      secret_content: secretContent,
      secret_type: secretType || 'link',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ unlockable: data }, { status: 201 })
}
