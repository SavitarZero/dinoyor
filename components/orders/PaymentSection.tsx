'use client'
import { useState } from 'react'
import { notifyPaymentSent } from '@/lib/actions/orders'

export interface EscrowWallet {
  network: 'ERC20' | 'TRC20'
  label: string      // e.g. "ERC20 (Ethereum)" / "TRC20 (Tron)"
  address: string
}

interface Props {
  orderId: string
  amount: number
  wallets: EscrowWallet[]   // ERC20 first = default
  isTestnet: boolean
  alreadyNotified: boolean
}

export function PaymentSection({ orderId, amount, wallets, isTestnet, alreadyNotified }: Props) {
  const [selected, setSelected] = useState(0)
  const [copied, setCopied]     = useState(false)
  const [notified, setNotified] = useState(alreadyNotified)
  const [loading, setLoading]   = useState(false)

  const wallet = wallets[selected]

  async function handleCopy() {
    if (!wallet?.address) return
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNotify() {
    setLoading(true)
    await notifyPaymentSent(orderId)
    setLoading(false)
    setNotified(true)
  }

  return (
    <div className="rounded-xl border border-yellow-700/50 bg-yellow-900/10 p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-yellow-400 font-semibold text-sm">Payment Pending</p>
        </div>
        {isTestnet && (
          <span className="px-2 py-0.5 rounded-full bg-orange-900/40 border border-orange-700/50 text-orange-400 text-xs font-bold tracking-wide">
            TESTNET
          </span>
        )}
      </div>

      {/* Steps */}
      <ol className="space-y-2.5 text-sm text-gray-400">
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-yellow-900/60 border border-yellow-700/60 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
          <span>Choose a network below, then send exactly <span className="text-white font-bold">{amount} USDT</span> to that address</span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-yellow-900/60 border border-yellow-700/60 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
          <span>Click <span className="text-white font-medium">"I've sent payment"</span> to notify admin</span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-yellow-900/60 border border-yellow-700/60 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
          <span>Admin confirms → seller delivers the item</span>
        </li>
      </ol>

      {/* Network tabs */}
      <div className="rounded-xl bg-background border border-border overflow-hidden">
        {/* Tab selector */}
        <div className="flex border-b border-border">
          {wallets.map((w, i) => (
            <button
              key={w.network}
              onClick={() => { setSelected(i); setCopied(false) }}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                i === selected
                  ? 'bg-surface text-white border-b-2 border-accent'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {w.label}
              {i === 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold">
                  Recommended
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Address */}
        <div className="p-4 space-y-3">
          {wallet?.address ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className="text-white text-sm font-mono break-all leading-relaxed">{wallet.address}</p>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-900/30 border border-green-700/50 text-green-400'
                      : 'bg-surface border border-border text-gray-400 hover:text-white hover:border-accent'
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-red-400/80 text-xs">
                ⚠ Send USDT on <strong>{wallet.network}</strong> only. Wrong network = lost funds, cannot recover.
              </p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Wallet address not configured yet — contact support.</p>
          )}
        </div>
      </div>

      {/* Notify button */}
      {notified ? (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-900/20 border border-green-700/40">
          <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-400 text-sm font-medium">Admin notified — waiting for confirmation</p>
        </div>
      ) : (
        <button
          onClick={handleNotify}
          disabled={loading || !wallet?.address}
          className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Notifying…' : "I've sent payment — Notify Admin"}
        </button>
      )}
    </div>
  )
}
