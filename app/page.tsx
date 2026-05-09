import Link from 'next/link'
import { ArrowRight, Lock, Zap, Globe } from 'lucide-react'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight text-slate-900">PayTag</span>
          <Link
            href="/signup"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            Start selling →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 tracking-wide uppercase">
          <Lock size={12} />
          Gated content · Any chain · Instant unlock
        </div>

        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-slate-900 max-w-2xl leading-tight">
          Sell anything digital,{' '}
          <span className="text-indigo-600">paid in any crypto</span>
        </h1>

        <p className="mt-6 text-lg text-slate-500 max-w-xl leading-relaxed">
          Share one link. Fans pay with ETH, BNB, MATIC — from any chain.
          Content unlocks the moment payment confirms. No Stripe. No PayPal. No borders.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Create your page
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center gap-2 border border-slate-200 hover:border-slate-300 text-slate-700 font-medium px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            See a demo →
          </Link>
        </div>

        <p className="mt-4 text-xs text-slate-400">Free to use · Powered by KIRAPAY</p>
      </section>

      {/* How it works */}
      <section className="border-t border-slate-100 px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-slate-900 mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <Lock size={20} className="text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900">1. Gate your content</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Add a title, set a price in USD, paste the secret link or message. Done in 30 seconds.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                <Globe size={20} className="text-emerald-600" />
              </div>
              <h3 className="font-semibold text-slate-900">2. Fan pays from any chain</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                ETH, BNB, MATIC, USDC — from Ethereum, Polygon, BSC, Base. KIRAPAY routes it all to your wallet.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                <Zap size={20} className="text-violet-600" />
              </div>
              <h3 className="font-semibold text-slate-900">3. Content unlocks instantly</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                The moment payment confirms, the fan sees the secret link or message. You receive USDC on Base.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>© 2025 PayTag</span>
          <span>Powered by KIRAPAY</span>
        </div>
      </footer>
    </main>
  )
}
