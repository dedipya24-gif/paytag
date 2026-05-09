'use client'

import { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Copy, Check, ExternalLink, Loader2, Lock, Pencil, DollarSign, ChevronDown } from 'lucide-react'
import type { User, Payment, Unlockable } from '@/lib/supabase'
import { SUPPORTED_CHAINS, DEFAULT_CHAIN, type Chain } from '@/lib/chains'

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  const [creator, setCreator] = useState<User | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [unlockable, setUnlockable] = useState<Unlockable | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Form state
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [secret, setSecret] = useState('')
  const [secretType, setSecretType] = useState<'link' | 'message'>('link')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Chain selector state
  const [settlementChain, setSettlementChain] = useState<Chain>(DEFAULT_CHAIN)
  const [chainOpen, setChainOpen] = useState(false)
  const [chainSearch, setChainSearch] = useState('')
  const chainDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/signup'); return }

    async function load() {
      const res = await fetch('/api/me')
      if (!res.ok) { router.push('/signup'); return }
      const data = await res.json()
      setCreator(data.user)
      setPayments(data.payments)
      setUnlockable(data.unlockable)
      // Initialize settlement chain from saved preference
      const storedChainId = data.user?.settlement_chain_id || DEFAULT_CHAIN.chainId
      const storedChain = SUPPORTED_CHAINS.find(c => c.chainId === storedChainId) || DEFAULT_CHAIN
      setSettlementChain(storedChain)
      if (data.unlockable) {
        setTitle(data.unlockable.title)
        setDescription(data.unlockable.description || '')
        setPrice(String(data.unlockable.price_usd))
        setSecretType(data.unlockable.secret_type)
      } else {
        setEditing(true)
      }
      setLoading(false)
    }
    load()
  }, [isLoaded, user, router])

  // Close chain dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (chainDropdownRef.current && !chainDropdownRef.current.contains(e.target as Node)) {
        setChainOpen(false)
        setChainSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function copyLink() {
    if (!creator) return
    navigator.clipboard.writeText(`${window.location.origin}/${creator.username}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function saveUnlockable(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !price || !secret) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/create-unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          priceUsd: parseFloat(price),
          secretContent: secret,
          secretType,
          settlementChainId: settlementChain.chainId,
          settlementTokenAddress: settlementChain.usdcAddress,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setUnlockable(data.unlockable)
      setEditing(false)
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  if (!creator) return null

  const paytagUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/${creator.username}`
  const totalReceived = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + (p.settlement_amount || 0), 0)
  const successCount = payments.filter(p => p.status === 'succeeded').length
  const filteredChains = SUPPORTED_CHAINS.filter(c =>
    c.name.toLowerCase().includes(chainSearch.toLowerCase())
  )

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500 mt-0.5">@{creator.username}</p>
          </div>
          {unlockable && (
            <a href={paytagUrl} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
              Preview <ExternalLink size={14} />
            </a>
          )}
        </div>

        {/* STEP 1 — Gated content */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${unlockable ? 'bg-emerald-500' : 'bg-indigo-600'}`}>1</span>
              <Lock size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-900">
                {unlockable ? 'Your gated content' : 'Add your gated content'}
              </h2>
            </div>
            {unlockable && !editing && (
              <button onClick={() => { setEditing(true); setSecret('') }}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-indigo-600 font-medium">
                <Pencil size={12} /> Edit
              </button>
            )}
          </div>

          <div className="p-5">
            {!editing && unlockable ? (
              /* Content summary */
              <div className="space-y-2">
                <p className="font-semibold text-slate-900">{unlockable.title}</p>
                {unlockable.description && <p className="text-sm text-slate-500">{unlockable.description}</p>}
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm font-bold text-emerald-600">${unlockable.price_usd} USD</span>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs text-slate-400">{unlockable.secret_type === 'link' ? '🔗 Link' : '💬 Message'} (hidden)</span>
                </div>
                {/* Settlement info */}
                <div className="flex items-center gap-2.5 mt-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                  <img
                    src={settlementChain.logoUrl}
                    alt={settlementChain.name}
                    className="w-5 h-5 rounded-full shrink-0"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    You receive <strong className="text-slate-800">USDC on {settlementChain.name}</strong> to{' '}
                    <code className="bg-slate-200 px-1 rounded text-slate-700">{creator.wallet_address.slice(0, 6)}...{creator.wallet_address.slice(-4)}</code>.
                    {' '}Fans pay from any chain — KIRAPAY converts automatically.
                  </p>
                </div>
              </div>
            ) : (
              /* Add / Edit form */
              <form onSubmit={saveUnlockable} className="space-y-4">
                {!unlockable && (
                  <p className="text-sm text-slate-500">
                    Add the content you want to sell. Fans pay in crypto → the secret unlocks instantly.
                  </p>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Title</label>
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. My Figma UI Kit" maxLength={80} required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Description <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)}
                    placeholder="Short description of what they'll get" maxLength={120}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">$</span>
                    <input type="number" min="0.5" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
                      placeholder="10" required
                      className="w-full pl-7 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  </div>
                </div>

                {/* Settlement chain selector */}
                <div className="space-y-1.5" ref={chainDropdownRef}>
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    Receive as <span className="text-indigo-600 font-semibold">USDC</span> on
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => { setChainOpen(v => !v); setChainSearch('') }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 border border-slate-200 rounded-xl bg-white hover:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                    >
                      <img
                        src={settlementChain.logoUrl}
                        alt={settlementChain.name}
                        className="w-5 h-5 rounded-full shrink-0"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                      <span className="flex-1 text-left font-medium text-slate-800">{settlementChain.name}</span>
                      <span className="text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono font-medium">USDC</span>
                      <ChevronDown size={14} className={`text-slate-400 transition-transform duration-150 ${chainOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {chainOpen && (
                      <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                        <div className="px-2 pt-2 pb-1.5 border-b border-slate-100">
                          <input
                            type="text"
                            value={chainSearch}
                            onChange={e => setChainSearch(e.target.value)}
                            placeholder="Search chain..."
                            autoFocus
                            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-slate-50"
                          />
                        </div>
                        <ul className="max-h-52 overflow-y-auto py-1">
                          {filteredChains.length === 0 ? (
                            <li className="px-3 py-3 text-sm text-slate-400 text-center">No chains found</li>
                          ) : filteredChains.map(c => (
                            <li key={c.chainId}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSettlementChain(c)
                                  setChainOpen(false)
                                  setChainSearch('')
                                }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-slate-50 transition-colors ${settlementChain.chainId === c.chainId ? 'bg-indigo-50' : ''}`}
                              >
                                <img
                                  src={c.logoUrl}
                                  alt={c.name}
                                  className="w-5 h-5 rounded-full shrink-0"
                                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                                <span className="flex-1 text-left font-medium text-slate-800">{c.name}</span>
                                <span className="text-xs text-slate-400 font-mono">USDC</span>
                                {settlementChain.chainId === c.chainId && (
                                  <Check size={13} className="text-indigo-600 shrink-0" />
                                )}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Fans pay from any chain with any token — KIRAPAY converts to USDC for you.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">Secret type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['link', 'message'] as const).map(t => (
                      <button key={t} type="button" onClick={() => setSecretType(t)}
                        className={`py-2 rounded-xl text-sm font-medium border transition-all ${secretType === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`}>
                        {t === 'link' ? '🔗 Link / URL' : '💬 Text / Password'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                    {secretType === 'link' ? 'Secret URL (revealed after payment)' : 'Secret message (revealed after payment)'}
                  </label>
                  {secretType === 'link' ? (
                    <input type="url" value={secret} onChange={e => setSecret(e.target.value)}
                      placeholder="https://..." required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  ) : (
                    <textarea value={secret} onChange={e => setSecret(e.target.value)}
                      placeholder="Discord invite, password, instructions..." rows={3} required
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
                  )}
                  <p className="text-xs text-slate-400">Only revealed to the buyer after KIRAPAY confirms payment.</p>
                </div>

                {saveError && <p className="text-xs text-red-500">{saveError}</p>}

                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={saving}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2">
                    {saving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save & publish'}
                  </button>
                  {unlockable && (
                    <button type="button" onClick={() => { setEditing(false); setSaveError('') }}
                      className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:border-slate-300 transition-colors">
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* STEP 2 — Share your link (only shown after content is added) */}
        {unlockable && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">2</span>
              <p className="text-sm font-semibold text-slate-900">Share your PayTag link</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 truncate">
                {paytagUrl}
              </div>
              <button onClick={copyLink}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors">
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Drop this in your Twitter bio, Instagram, or send it directly to clients.</p>
          </div>
        )}

        {/* Stats (only shown after content is added) */}
        {unlockable && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign size={16} className="text-emerald-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total received</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{totalReceived > 0 ? `$${totalReceived.toFixed(2)}` : '—'}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <img
                  src={settlementChain.logoUrl}
                  alt={settlementChain.name}
                  className="w-3.5 h-3.5 rounded-full"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <p className="text-xs text-slate-400">USDC · {settlementChain.name}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={16} className="text-indigo-500" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Unlocks</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{successCount}</p>
              <p className="text-xs text-slate-400 mt-0.5">completed</p>
            </div>
          </div>
        )}

        {/* Recent unlocks */}
        {unlockable && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-900">Recent unlocks</h2>
            </div>
            {payments.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-slate-400 text-sm">No unlocks yet.</p>
                <p className="text-slate-400 text-xs mt-1">Share your link above to start!</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {payments.slice(0, 10).map(p => (
                  <li key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                        {p.token_in_symbol?.[0] || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {p.token_in_symbol ? `Paid with ${p.token_in_symbol}` : 'Payment'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.sender_address ? `${p.sender_address.slice(0, 6)}...${p.sender_address.slice(-4)}` : 'Anonymous'}
                          {' · '}{new Date(p.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-emerald-600">
                        +${(p.settlement_amount || p.amount_usd || 0).toFixed(2)}
                      </p>
                      <span className={`text-xs font-medium ${p.status === 'succeeded' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {p.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </main>
  )
}
