import Link from 'next/link'
import { ArrowRight, Lock, Globe, Zap } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#222] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-[#ededed]">PayTag</span>
          <Link
            href="/signup"
            className="text-sm font-medium text-[#a1a1a1] hover:text-[#ededed] transition-colors"
          >
            Start selling →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <p className="text-xs font-semibold text-[#555] uppercase tracking-widest mb-6">
          Gated content · Any chain · Instant unlock
        </p>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#ededed] max-w-2xl leading-tight">
          Sell digital content for crypto.
        </h1>

        <p className="mt-6 text-lg text-[#a1a1a1] max-w-xl leading-relaxed">
          Share one link. Set a price. Fans pay with ETH, BNB, MATIC — from any chain.
          Content unlocks the moment payment confirms. No Stripe. No PayPal.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-[#ededed] hover:bg-[#d4d4d4] text-[#0a0a0a] font-semibold px-8 py-3.5 rounded-full transition-colors text-base"
          >
            Get your PayTag
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 border border-[#333] hover:border-[#555] text-[#a1a1a1] hover:text-[#ededed] font-medium px-8 py-3.5 rounded-full transition-colors text-base"
          >
            See a demo →
          </Link>
        </div>

        <p className="mt-4 text-xs text-[#555]">Free to use · Powered by KIRAPAY</p>
      </section>

      {/* How it works */}
      <section className="border-t border-[#222] px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-xl font-semibold text-[#ededed] mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                <Lock size={16} className="text-[#888]" />
              </div>
              <h3 className="font-semibold text-[#ededed]">1. Gate your content</h3>
              <p className="text-sm text-[#888] leading-relaxed">
                Add a title, set a price in USD, paste the secret link or message. Done in 30 seconds.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                <Globe size={16} className="text-[#888]" />
              </div>
              <h3 className="font-semibold text-[#ededed]">2. Fan pays from any chain</h3>
              <p className="text-sm text-[#888] leading-relaxed">
                ETH, BNB, MATIC, USDC — from Ethereum, Polygon, BSC, Base. KIRAPAY routes it all to your wallet.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-xl flex items-center justify-center">
                <Zap size={16} className="text-[#888]" />
              </div>
              <h3 className="font-semibold text-[#ededed]">3. Content unlocks instantly</h3>
              <p className="text-sm text-[#888] leading-relaxed">
                The moment payment confirms, the fan sees the secret link or message. You receive USDC on your chosen chain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#222] px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-[#555]">
          <span>© 2025 PayTag</span>
          <span>Powered by KIRAPAY</span>
        </div>
      </footer>
    </main>
  )
}
