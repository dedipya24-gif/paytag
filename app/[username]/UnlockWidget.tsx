'use client'

import { useState } from 'react'
import { Lock, Loader2 } from 'lucide-react'
import type { Unlockable } from '@/lib/supabase'

export default function UnlockWidget({
  unlockable,
  username,
}: {
  unlockable: Unlockable
  username: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUnlock() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, unlockableId: unlockable.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create payment')
      window.location.href = data.checkoutUrl
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Locked content card */}
      <div className="border border-[#333] rounded-xl p-5 bg-[#0a0a0a] relative overflow-hidden">
        <div className="absolute top-4 right-4">
          <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center">
            <Lock size={14} className="text-[#888]" />
          </div>
        </div>

        <div className="pr-10">
          <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1">
            {unlockable.secret_type === 'link' ? 'Digital Content' : 'Secret Message'}
          </p>
          <h2 className="text-lg font-bold text-[#ededed] leading-snug">{unlockable.title}</h2>
          {unlockable.description && (
            <p className="mt-1.5 text-sm text-[#a1a1a1] leading-relaxed">{unlockable.description}</p>
          )}
        </div>

        {/* Blurred content preview */}
        <div className="mt-4 h-10 bg-[#222] rounded-lg blur-sm opacity-60" />
      </div>

      {/* Price + unlock button */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#888]">Price</span>
          <span className="text-2xl font-bold text-[#ededed]">${unlockable.price_usd}</span>
        </div>

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}

        <button
          onClick={handleUnlock}
          disabled={loading}
          className="w-full py-3.5 bg-[#ededed] hover:bg-[#d4d4d4] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-full transition-colors text-base flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 size={18} className="animate-spin" /> Preparing checkout...</>
          ) : (
            <><Lock size={16} /> Unlock for ${unlockable.price_usd}</>
          )}
        </button>

        <p className="text-xs text-[#555] text-center">
          Pay with ETH, BNB, MATIC, USDC — any chain. Powered by KIRAPAY.
        </p>
      </div>
    </div>
  )
}
