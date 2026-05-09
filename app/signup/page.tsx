'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, SignInButton } from '@clerk/nextjs'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function SignupPage() {
  const { user, isLoaded } = useUser()
  const { address, isConnected } = useAccount()
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.fullName) setDisplayName(user.fullName)
  }, [user])

  useEffect(() => {
    if (!username || username.length < 3) { setUsernameStatus('idle'); return }
    setUsernameStatus('checking')
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/check-username?username=${username}`)
      const data = await res.json()
      setUsernameStatus(data.available ? 'available' : 'taken')
    }, 500)
    return () => clearTimeout(timer)
  }, [username])

  const canSubmit = isConnected && address && username.length >= 3 && usernameStatus === 'available' && !submitting

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !user) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, walletAddress: address, displayName, bio }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create profile')
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSubmitting(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="text-2xl font-bold text-slate-900">PayTag</a>
          <h1 className="mt-4 text-2xl font-semibold text-slate-900">Create your PayTag</h1>
          <p className="mt-2 text-sm text-slate-500">Takes about 60 seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">

          {/* Step 1 — Sign in */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${user ? 'bg-emerald-500' : 'bg-indigo-600'}`}>1</span>
              <span className="text-sm font-semibold text-slate-700">Sign in</span>
            </div>
            {!user ? (
              <SignInButton mode="modal">
                <button className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors">
                  Continue with Google
                </button>
              </SignInButton>
            ) : (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle size={16} />
                Signed in as {user.primaryEmailAddress?.emailAddress}
              </div>
            )}
          </div>

          {/* Step 2 — Connect wallet */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${isConnected ? 'bg-emerald-500' : 'bg-indigo-600'}`}>2</span>
              <span className="text-sm font-semibold text-slate-700">Connect your wallet</span>
            </div>
            {isConnected && address ? (
              <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                <CheckCircle size={16} />
                {address.slice(0, 6)}...{address.slice(-4)} connected
              </div>
            ) : (
              <div className="[&>div]:w-full [&>div>button]:w-full [&>div>button]:justify-center">
                <ConnectButton label="Connect Wallet" />
              </div>
            )}
            <p className="text-xs text-slate-400">Payments settle to this wallet. Use MetaMask or any EVM wallet.</p>
          </div>

          {/* Step 3 — Profile (only shown when signed in) */}
          {user && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">3</span>
                <span className="text-sm font-semibold text-slate-700">Set up your profile</span>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Username</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">paytag.app/</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="yourname"
                    maxLength={30}
                    className="w-full pl-24 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && <Loader2 size={14} className="animate-spin text-slate-400" />}
                    {usernameStatus === 'available' && <CheckCircle size={14} className="text-emerald-500" />}
                    {usernameStatus === 'taken' && <AlertCircle size={14} className="text-red-500" />}
                  </div>
                </div>
                {usernameStatus === 'taken' && <p className="text-xs text-red-500">This username is taken</p>}
                {usernameStatus === 'available' && <p className="text-xs text-emerald-600">✓ Available</p>}
              </div>

              {/* Display name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={60}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Bio <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="What do you create or sell?"
                  maxLength={160}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Creating your PayTag...</>
                ) : (
                  'Create my PayTag →'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
