import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, walletAddress, displayName, bio } = await req.json()

  if (!username || !walletAddress) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check username not already taken
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (existing) {
    return Response.json({ error: 'Username already taken' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_id: userId,
      username: username.toLowerCase(),
      wallet_address: walletAddress,
      display_name: displayName || username,
      bio: bio || null,
    })
    .select()
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ user: data }, { status: 201 })
}