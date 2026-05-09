'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import Link from 'next/link'

export default function DemoWidget() {
  const [clicked, setClicked] = useState(false)

  if (clicked) {
    return (
      <div className="w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm text-slate-600 space-y-2 px-4">
        <p className="font-semibold">This is a demo page.</p>
        <p className="text-xs text-slate-400">
          <Link href="/signup" className="text-indigo-600 hover:underline font-medium">Create your account</Link>
          {' '}to set up a real payment page.
        </p>
      </div>
    )
  }

  return (
    <button
      onClick={() => setClicked(true)}
      className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors text-base flex items-center justify-center gap-2"
    >
      <Lock size={16} /> Unlock for $15
    </button>
  )
}
