import { Lock } from 'lucide-react'
import DemoWidget from './DemoWidget'

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Creator profile */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
            <span className="text-2xl font-bold text-[#888]">MC</span>
          </div>
          <h1 className="text-2xl font-bold text-[#ededed]">Maya Chen</h1>
          <p className="text-sm text-[#888] mt-0.5">@maya · Demo account</p>
          <p className="mt-3 text-sm text-[#a1a1a1] leading-relaxed max-w-xs mx-auto">
            UI/UX designer. I make Figma kits and design resources for product teams.
          </p>
        </div>

        {/* Demo lock card */}
        <div className="bg-[#111] rounded-2xl border border-[#222] p-6">
          <div className="space-y-5">
            <div className="border border-[#333] rounded-xl p-5 bg-[#0a0a0a] relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <div className="w-8 h-8 bg-[#1a1a1a] border border-[#333] rounded-full flex items-center justify-center">
                  <Lock size={14} className="text-[#888]" />
                </div>
              </div>
              <div className="pr-10">
                <p className="text-xs font-semibold text-[#888] uppercase tracking-wide mb-1">Digital Content</p>
                <h2 className="text-lg font-bold text-[#ededed] leading-snug">Figma UI Kit — 50 premium components</h2>
                <p className="mt-1.5 text-sm text-[#a1a1a1] leading-relaxed">Dark mode + light mode, auto-layout ready. Used by 200+ teams.</p>
              </div>
              <div className="mt-4 h-10 bg-[#222] rounded-lg blur-sm opacity-60" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#888]">Price</span>
                <span className="text-2xl font-bold text-[#ededed]">$15</span>
              </div>
              <DemoWidget />
              <p className="text-xs text-[#555] text-center">
                Pay with ETH, BNB, MATIC, USDC — any chain. Powered by KIRAPAY.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-[#555]">
          <a href="/signup" className="hover:text-[#ededed] transition-colors">Create your own PayTag →</a>
        </p>
      </div>
    </main>
  )
}
