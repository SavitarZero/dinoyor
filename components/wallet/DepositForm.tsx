'use client'
import { useState } from 'react'
import Link from 'next/link'
import { submitDeposit } from '@/lib/actions/deposits'

interface Props {
  escrowAddresses: { erc20: string; trc20: string }
  senderWallet: string | null
  senderNetwork: 'TRC20' | 'ERC20' | null
  minDeposit: number
}

export function DepositForm({ escrowAddresses, senderWallet, senderNetwork, minDeposit }: Readonly<Props>) {
  const [network, setNetwork] = useState<'TRC20' | 'ERC20'>(senderNetwork ?? 'TRC20')
  const [txHash, setTxHash]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ ok: true; amount: number } | { ok: false; error: string } | null>(null)
  const [copied, setCopied]   = useState(false)

  const address = network === 'TRC20' ? escrowAddresses.trc20 : escrowAddresses.erc20

  async function handleCopy() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setResult(null)
    if (!txHash.trim()) {
      setResult({ ok: false, error: 'Transaction hash is required' })
      return
    }
    setLoading(true)
    const res = await submitDeposit(txHash.trim(), network)
    setLoading(false)
    if (res?.error) {
      setResult({ ok: false, error: res.error })
    } else if (res?.success) {
      setResult({ ok: true, amount: res.amount ?? 0 })
      setTxHash('')
    }
  }

  if (!senderWallet) {
    return (
      <div className="rounded-xl border border-yellow-700/40 bg-yellow-900/10 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-yellow-400 font-semibold text-sm">Set up your deposit wallet first</p>
            <p className="text-gray-400 text-xs mt-1">Register the wallet address you'll send from before making a deposit.</p>
          </div>
        </div>
        <Link href="/profile#deposit-wallet" className="inline-flex items-center gap-1.5 text-accent text-sm font-medium hover:underline">
          Go to Profile → Wallet Settings →
        </Link>
      </div>
    )
  }

  if (result?.ok) {
    return (
      <div className="rounded-xl border border-green-700/40 bg-green-900/10 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-400 font-semibold text-sm">
            Verified — {result.amount.toFixed(2)} USDT credited to your balance
          </p>
        </div>
        <p className="text-gray-400 text-xs">Your balance has been updated automatically.</p>
        <button onClick={() => setResult(null)} className="text-accent text-xs hover:underline">Submit another deposit</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Step 1: Send crypto */}
      <div className="space-y-3">
        <p className="text-white text-sm font-semibold">Step 1 — Send USDT to the platform wallet</p>

        {/* Network selector — locked to registered network if set */}
        {senderNetwork ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border">
            <span className="text-xs text-gray-500">Network</span>
            <span className="text-white text-xs font-semibold">{senderNetwork}</span>
            {senderNetwork === 'TRC20' && (
              <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold">Recommended</span>
            )}
            <span className="ml-auto text-gray-600 text-xs">Matches your registered wallet</span>
          </div>
        ) : (
          <div className="flex rounded-xl overflow-hidden border border-border">
            {(['TRC20', 'ERC20'] as const).map(n => (
              <button
                key={n}
                type="button"
                onClick={() => { setNetwork(n); setCopied(false) }}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  network === n ? 'bg-surface text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300 bg-background'
                }`}
              >
                {n}
                {n === 'TRC20' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold">Recommended</span>}
              </button>
            ))}
          </div>
        )}

        {/* Your registered sender wallet */}
        <div className="rounded-xl bg-background border border-border p-3 space-y-0.5">
          <p className="text-gray-500 text-xs uppercase tracking-wide">Send FROM this wallet</p>
          <p className="text-white text-sm font-mono break-all">{senderWallet}</p>
          <p className="text-gray-600 text-xs">Must match exactly — transactions from other addresses will be rejected</p>
        </div>

        {/* Destination (platform escrow) address */}
        <div className="rounded-xl bg-background border border-border p-4 space-y-2">
          {address ? (
            <>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Send TO ({network})</p>
              <div className="flex items-start gap-3">
                <p className="text-white text-sm font-mono break-all flex-1">{address}</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    copied
                      ? 'bg-green-900/30 border-green-700/50 text-green-400'
                      : 'bg-surface border-border text-gray-400 hover:text-white hover:border-accent'
                  }`}
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <p className="text-red-400/70 text-xs">⚠ Send on {network} only — wrong network = lost funds</p>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Not configured — contact support.</p>
          )}
        </div>
      </div>

      {/* Step 2: Submit TX hash */}
      <div className="space-y-3">
        <p className="text-white text-sm font-semibold">Step 2 — Paste your transaction hash</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="tx-hash" className="block text-xs text-gray-400 mb-1.5">Transaction hash (TX ID)</label>
            <input
              id="tx-hash"
              type="text"
              value={txHash}
              onChange={e => setTxHash(e.target.value)}
              placeholder={network === 'TRC20' ? 'e.g. a1b2c3d4e5...' : 'e.g. 0xa1b2c3...'}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1.5">
              Find the TX ID in your wallet app or exchange after sending
            </p>
          </div>

          {result && !result.ok && (
            <p className="text-red-400 text-xs">{result.error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !address}
            className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? 'Verifying on blockchain…' : `Verify & Credit — min ${minDeposit} USDT`}
          </button>
        </form>
      </div>

    </div>
  )
}
