'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, CheckCircle, ExternalLink, Lock } from 'lucide-react'

type Secret = {
  title: string
  content: string
  type: 'link' | 'message'
}

type PollResult =
  | { status: 'pending' }
  | { status: 'succeeded'; secret: Secret | null; settlement_amount: number | null; token_in_symbol: string | null }

export default function UnlockPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const [result, setResult] = useState<PollResult>({ status: 'pending' })
  const [attempts, setAttempts] = useState(0)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    if (!orderId) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/payment-status?orderId=${orderId}`)
        const data = await res.json()

        if (data.status === 'succeeded') {
          setResult(data)
          return true
        }
      } catch {
        // ignore network errors, keep polling
      }
      return false
    }

    let count = 0
    const interval = setInterval(async () => {
      count++
      setAttempts(count)
      const done = await poll()
      if (done) {
        clearInterval(interval)
      } else if (count >= 30) {
        clearInterval(interval)
        setTimedOut(true)
      }
    }, 2000)

    poll()

    return () => clearInterval(interval)
  }, [orderId])

  if (result.status === 'succeeded' && result.secret) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="bg-[#111] rounded-2xl border border-[#222] p-8 text-center">
            <div className="mx-auto mb-5 w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center">
              <CheckCircle size={28} className="text-[#ededed]" />
            </div>

            <h1 className="text-2xl font-bold text-[#ededed]">Unlocked!</h1>
            <p className="mt-2 text-sm text-[#888]">
              Payment confirmed
              {result.settlement_amount ? ` · $${result.settlement_amount.toFixed(2)} USDC received` : ''}
            </p>

            <div className="mt-6 p-4 bg-[#0a0a0a] border border-[#333] rounded-xl text-left">
              <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-2">
                {result.secret.title}
              </p>

              {result.secret.type === 'link' ? (
                <a
                  href={result.secret.content}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#ededed] hover:text-[#a1a1a1] break-all transition-colors"
                >
                  Open content <ExternalLink size={14} className="shrink-0" />
                </a>
              ) : (
                <p className="text-sm text-[#ededed] leading-relaxed whitespace-pre-wrap break-words font-mono">
                  {result.secret.content}
                </p>
              )}
            </div>

            <p className="mt-6 text-xs text-[#555]">
              Save this — it won&apos;t be shown again.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (timedOut) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center">
            <Lock size={24} className="text-[#888]" />
          </div>
          <h1 className="text-xl font-bold text-[#ededed]">Still confirming...</h1>
          <p className="mt-2 text-sm text-[#888] leading-relaxed">
            Your payment is taking longer than expected. Keep this page open — it will unlock automatically.
          </p>
          <button
            onClick={() => { setTimedOut(false); setAttempts(0) }}
            className="mt-6 px-6 py-2.5 bg-[#ededed] hover:bg-[#d4d4d4] text-[#0a0a0a] text-sm font-semibold rounded-full transition-colors"
          >
            Keep waiting
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-5 w-16 h-16 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center">
          <Loader2 size={28} className="animate-spin text-[#ededed]" />
        </div>
        <h1 className="text-xl font-bold text-[#ededed]">Confirming your payment...</h1>
        <p className="mt-2 text-sm text-[#888]">
          This usually takes under 30 seconds. Don&apos;t close this tab.
        </p>
        <div className="mt-4 flex justify-center gap-1.5">
          {Array.from({ length: Math.min(attempts, 10) }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#333]" />
          ))}
        </div>
        <p className="mt-4 text-xs text-[#555]">Powered by KIRAPAY</p>
      </div>
    </main>
  )
}
