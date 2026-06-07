'use client'
import { useState } from 'react'
import { notifyPaymentSent } from '@/lib/actions/orders'

export interface EscrowWallet {
  network: 'ERC20' | 'TRC20'
  label: string
  address: string
}

interface Props {
  orderId: string
  amount: number
  wallets: EscrowWallet[]
  isTestnet: boolean
  alreadyNotified: boolean
  submittedTxHash?: string | null
  submittedNetwork?: string | null
}

function explorerUrl(txHash: string, network: string, testnet: boolean): string {
  if (network === 'ERC20') {
    return testnet
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`
  }
  return testnet
    ? `https://nile.tronscan.org/#/transaction/${txHash}`
    : `https://tronscan.org/#/transaction/${txHash}`
}

export function PaymentSection({
  orderId, amount, wallets, isTestnet, alreadyNotified, submittedTxHash, submittedNetwork,
}: Props) {
  const [selected, setSelected]   = useState(0)
  const [copied, setCopied]       = useState(false)
  const [txHash, setTxHash]       = useState(submittedTxHash ?? '')
  const [notified, setNotified]   = useState(alreadyNotified)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  const wallet = wallets[selected]

  async function handleCopy() {
    if (!wallet?.address) return
    await navigator.clipboard.writeText(wallet.address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleNotify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!txHash.trim()) { setError('Please enter the transaction hash'); return }
    setLoading(true)
    const result = await notifyPaymentSent(orderId, txHash.trim(), wallet.network)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setNotified(true)
  }

  if (notified && (submittedTxHash || txHash)) {
    const hash    = submittedTxHash ?? txHash
    const network = submittedNetwork ?? wallet?.network ?? 'ERC20'
    return (
      <div className="rounded-xl border border-green-700/40 bg-green-900/10 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-400 font-semibold text-sm">Payment submitted — waiting for admin confirmation</p>
        </div>
        <div className="rounded-xl bg-background border border-border p-3 space-y-1">
          <p className="text-gray-500 text-xs">{network} transaction</p>
          <p className="text-white text-xs font-mono break-all">{hash}</p>
        </div>
        <a
          href={explorerUrl(hash, network, isTestnet)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-accent text-xs hover:underline"
        >
          View on blockchain explorer
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    )
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
          <span>Choose a network, send exactly <span className="text-white font-bold">{amount} USDT</span> to the address below</span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-yellow-900/60 border border-yellow-700/60 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
          <span>Paste the <span className="text-white font-medium">transaction hash (TX ID)</span> from your wallet</span>
        </li>
        <li className="flex gap-3">
          <span className="w-5 h-5 rounded-full bg-yellow-900/60 border border-yellow-700/60 text-yellow-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
          <span>Admin verifies on blockchain → confirms → seller delivers</span>
        </li>
      </ol>

      {/* Network tabs + address */}
      <div className="rounded-xl bg-background border border-border overflow-hidden">
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
        <div className="p-4 space-y-2">
          {wallet?.address ? (
            <>
              <div className="flex items-start gap-3">
                <p className="text-white text-sm font-mono break-all flex-1 leading-relaxed">{wallet.address}</p>
                <button
                  onClick={handleCopy}
                  className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied
                      ? 'bg-green-900/30 border border-green-700/50 text-green-400'
                      : 'bg-surface border border-border text-gray-400 hover:text-white hover:border-accent'
                  }`}
                >
                  {copied ? (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Copied</>
                  ) : (
                    <><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy</>
                  )}
                </button>
              </div>
              <p className="text-red-400/70 text-xs">⚠ USDT on {wallet.network} only — wrong network = lost funds</p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Not configured — contact support.</p>
          )}
        </div>
      </div>

      {/* TX hash form */}
      <form onSubmit={handleNotify} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            Transaction hash (TX ID)
          </label>
          <input
            type="text"
            value={txHash}
            onChange={e => setTxHash(e.target.value)}
            placeholder={wallet?.network === 'TRC20' ? 'e.g. a1b2c3d4...' : 'e.g. 0xa1b2c3...'}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1.5">
            Find the TX ID in your wallet app or exchange after sending
          </p>
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading || !wallet?.address}
          className="w-full py-3 rounded-xl bg-yellow-500 text-black font-bold text-sm hover:bg-yellow-400 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Submitting…' : "I've sent payment — Submit TX"}
        </button>
      </form>
    </div>
  )
}
