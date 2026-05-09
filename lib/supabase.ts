import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side only — bypasses RLS for webhook writes
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export type User = {
  id: string
  clerk_id: string
  username: string
  wallet_address: string
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  settlement_chain_id: string | null
  settlement_token_address: string | null
  created_at: string
}

export type Unlockable = {
  id: string
  creator_id: string
  title: string
  description: string | null
  price_usd: number
  secret_content: string
  secret_type: 'link' | 'message'
  created_at: string
}

export type Payment = {
  id: string
  creator_id: string
  unlockable_id: string | null
  kirapay_link_id: string | null
  amount_usd: number | null
  token_in_symbol: string | null
  source_chain_id: number | null
  settlement_amount: number | null
  tx_hash: string | null
  status: string
  sender_address: string | null
  created_at: string
}