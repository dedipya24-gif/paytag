'use client'

import { useState, useEffect, useRef } from 'react'
import { Lock, Loader2, CheckCircle, ExternalLink } from 'lucide-react'
import type { Unlockable } from '@/lib/supabase'

type Secret = {
  title: string
  content: string
  type: 'link' | 'message'
}

type State =
  | { phase: 'idle' }
  | { phase: 'creating' }
  | { phase: 'waiting'; orderId: string; checkoutUrl: string }
  | { phase: 'succeeded'; secret: Secret | null; settlementAmount: number | null; tokenSymbol: string | null }
  | { phase: 'error'; message: string }

export default function UnlockWidget({
  unlockable,
  username,
}: {
  unlockable: Unlockable
  username: string
}) {
  const [state, setState] = useState<State>({ phase: 'idle' })
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start polling once we have an orderId
  useEffect(() => {
    if (state.phase !== 'waiting') return

    const { orderId } = state

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment-status?orderId=${orderId}`)
        const data = await res.json()
        if (data.status === 'succeeded') {
          clearInterval(pollRef.current!)
          setState({
            phase: 'succeeded',
            secret: data.secret,
            settlementAmount: data.settlement_amount,
            tokenSymbol: data.token_in_symbol,
          })
        }
      } catch {
        // network blip — keep polling
      }
    }

    poll() // immediate first check
    pollRef.current = setInterval(poll, 3000)
    return () => clearInterval(pollRef.current!)
  }, [state])

  async function handleUnlock() {
    setState({ phase: 'creating' })
    try {
      const res = await fetch('/api/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, unlockableId: unlockable.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create payment')

      // Open checkout in a new tab — current tab keeps polling
      window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer')
      setState({ phase: 'waiting', orderId: data.orderId, checkoutUrl: data.checkoutUrl })
    } catch (err: unknown) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }

  // ── Succeeded state ───────────────────────────────────────────────────────
  if (state.phase === 'succeeded') {
    return (
      <div className="space-y-5">
        <div className="border border-[#333] rounded-xl p-5 bg-[#0a0a0a]">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={18} className="text-[#ededed]" />
            <span className="text-sm font-semibold text-[#ededed]">Unlocked!</span>
            {state.settlementAmount && (
              <span className="text-xs text-[#555]">
                · ${state.settlementAmount.toFixed(2)} {state.tokenSymbol || 'received'}
              </span>
            )}
          </div>

          {state.secret ? (
            <div className="mt-3 p-4 bg-[#111] border border-[#222] rounded-xl">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">
                {state.secret.title}
              </p>
              {state.secret.type === 'link' ? (
                <a
                  href={state.secret.content}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#ededed] hover:text-[#a1a1a1] break-all transition-colors"
                >
                  Open content <ExternalLink size={14} className="shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-[#ededed] leading-relaxed whitespace-pre-wrap break-words font-mono">
                  {state.secret.content}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-[#888]">Payment confirmed. Content loading...</p>
          )}

          <p className="mt-4 text-xs text-[#555]">Save this — it won&apos;t be shown again.</p>
        </div>
      </div>
    )
  }

  // ── Waiting / polling state ───────────────────────────────────────────────
  if (state.phase === 'waiting') {
    return (
      <div className="space-y-5">
        <div className="border border-[#333] rounded-xl p-5 bg-[#0a0a0a] text-center">
          <Loader2 size={24} className="animate-spin text-[#ededed] mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#ededed]">Waiting for payment...</p>
          <p className="text-xs text-[#888] mt-1 leading-relaxed">
            Complete the payment in the tab that just opened.<br />
            This page will unlock automatically once confirmed.
          </p>
          <a
            href={state.checkoutUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-[#555] hover:text-[#888] transition-colors"
          >
            Reopen checkout <ExternalLink size={12} />
          </a>
        </div>
        <button
          onClick={() => { clearInterval(pollRef.current!); setState({ phase: 'idle' }) }}
          className="w-full py-2.5 border border-[#333] text-[#555] text-sm font-medium rounded-full hover:border-[#555] hover:text-[#888] transition-colors"
        >
          Cancel
        </button>
      </div>
    )
  }

  // ── Idle / error state ────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
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

        <div className="mt-4 h-10 bg-[#222] rounded-lg blur-sm opacity-60" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#888]">Price</span>
          <span className="text-2xl font-bold text-[#ededed]">${unlockable.price_usd}</span>
        </div>

        {state.phase === 'error' && (
          <p className="text-xs text-red-400 text-center">{state.message}</p>
        )}

        <button
          onClick={handleUnlock}
          disabled={state.phase === 'creating'}
          className="w-full py-3.5 bg-[#ededed] hover:bg-[#d4d4d4] disabled:opacity-40 disabled:cursor-not-allowed text-[#0a0a0a] font-bold rounded-full transition-colors text-base flex items-center justify-center gap-2"
        >
          {state.phase === 'creating' ? (
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
