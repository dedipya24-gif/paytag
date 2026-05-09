import { supabase } from '@/lib/supabase'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username || username.length < 3) {
    return Response.json({ available: false })
  }
  const { data } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return Response.json({ available: !data })
}