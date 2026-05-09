import { supabaseAdmin } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

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

  return Response.json({
    user,
    payments: paymentsResult.data || [],
    unlockable: unlockableResult.data || null,
  })
}
