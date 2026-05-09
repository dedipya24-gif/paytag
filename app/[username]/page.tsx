import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UnlockWidget from './UnlockWidget'
import { Lock } from 'lucide-react'

type Props = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Props) {
  const { username } = await params
  const { data: creator } = await supabase
    .from('users')
    .select('display_name, bio')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (!creator) return { title: 'PayTag' }
  return {
    title: `${creator.display_name} (@${username}) — PayTag`,
    description: creator.bio || `Unlock exclusive content from ${creator.display_name}.`,
  }
}

export default async function UserPage({ params }: Props) {
  const { username } = await params

  const { data: creator } = await supabase
    .from('users')
    .select('id, username, display_name, bio, avatar_url')
    .eq('username', username.toLowerCase())
    .maybeSingle()

  if (!creator) notFound()

  const { data: unlockable } = await supabase
    .from('unlockables')
    .select('*')
    .eq('creator_id', creator.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const initials = (creator.display_name || creator.username)
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Creator profile */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt={creator.display_name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-indigo-600">{initials}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{creator.display_name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">@{creator.username}</p>
          {creator.bio && (
            <p className="mt-3 text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">{creator.bio}</p>
          )}
        </div>

        {/* Content card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          {unlockable ? (
            <UnlockWidget unlockable={unlockable} username={creator.username} />
          ) : (
            <div className="text-center py-6">
              <div className="mx-auto mb-3 w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                <Lock size={20} className="text-slate-400" />
              </div>
              <p className="text-slate-500 text-sm">No content available yet.</p>
            </div>
          )}
        </div>

        <p className="text-center mt-6 text-xs text-slate-400">
          <a href="/" className="hover:text-indigo-600 transition-colors">Create your own PayTag →</a>
        </p>
      </div>
    </main>
  )
}
