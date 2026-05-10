'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import Link from 'next/link'

export default function DemoWidget() {
  const [clicked, setClicked] = useState(false)

  if (clicked) {
    return (
      <div className="w-full py-3 bg-[#111] border border-[#222] rounded-xl text-center text-sm text-[#a1a1a1] space-y-2 px-4">
        <p className="font-semibold text-[#ededed]">This is a demo page.</p>
        <p className="text-xs text-[#888]">
          <Link href="/signup" className="text-[#ededed] hover:underline font-medium">Create your account</Link>
          {' '}to set up a real payment page.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={() => setClicked(true)}
      className="w-full py-3.5 bg-[#ededed] hover:bg-[#d4d4d4] text-[#0a0a0a] font-bold rounded-full transition-colors text-base flex items-center justify-center gap-2"
    >
      <Lock size={16} /> Unlock for $15
    </button>
  )
}
