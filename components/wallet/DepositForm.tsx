'use client'
import { useState } from 'react'
import { submitDeposit, saveDepositWallet, deleteDepositWallet } from '@/lib/actions/deposits'

interface Props {
  escrowAddresses: { erc20: string; trc20: string }
  senderWallets: { trc20: string | null; erc20: string | null }
  minDeposit: number
}

export function DepositForm({ escrowAddresses, senderWallets, minDeposit }: Readonly<Props>) {
  const [network, setNetwork] = useState<'TRC20' | 'ERC20'>('TRC20')
  const [txHash, setTxHash]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult]   = useState<{ ok: true; amount: number } | { ok: false; error: string } | null>(null)
  const [copied, setCopied]   = useState(false)

  // Local wallet state — updated optimistically after save/delete
  const [localWallets, setLocalWallets] = useState({ trc20: senderWallets.trc20, erc20: senderWallets.erc20 })
  const [editing, setEditing]           = useState(false)
  const [editValue, setEditValue]       = useState('')
  const [confirmDel, setConfirmDel]     = useState(false)
  const [walletLoading, setWalletLoading] = useState(false)
  const [walletError, setWalletError]     = useState('')

  const address      = network === 'TRC20' ? escrowAddresses.trc20 : escrowAddresses.erc20
  const senderWallet = network === 'TRC20' ? localWallets.trc20    : localWallets.erc20
  const walletKey    = network === 'TRC20' ? 'trc20' : 'erc20'

  function switchNetwork(n: 'TRC20' | 'ERC20') {
    setNetwork(n)
    setCopied(false)
    setEditing(false)
    setConfirmDel(false)
    setWalletError('')
  }

  async function handleCopy() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSaveWallet(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setWalletError('')
    setWalletLoading(true)
    const res = await saveDepositWallet(editValue.trim(), network)
    setWalletLoading(false)
    if (res?.error) { setWalletError(res.error); return }
    setLocalWallets(prev => ({ ...prev, [walletKey]: editValue.trim() }))
    setEditing(false)
  }

  async function handleDeleteWallet() {
    setWalletLoading(true)
    setWalletError('')
    const res = await deleteDepositWallet(network)
    setWalletLoading(false)
    if (res?.error) { setWalletError(res.error); setConfirmDel(false); return }
    setLocalWallets(prev => ({ ...prev, [walletKey]: null }))
    setConfirmDel(false)
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

  if (result?.ok) {
    return (
      <div className="rounded border border-green-700/40 bg-green-900/10 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-green-400 font-semibold text-sm">
            Verified — {result.amount.toFixed(2)} USDT added to your Coin Wallet
          </p>
        </div>
        <p className="text-gray-400 text-xs">Your Coin Wallet has been updated automatically.</p>
        <button onClick={() => setResult(null)} className="text-accent text-xs hover:underline">Submit another deposit</button>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Step 1: Send crypto */}
      <div className="space-y-3">
        <p className="text-white text-sm font-semibold">Step 1 — Send USDT to the platform wallet</p>

        {/* Network selector */}
        <div className="flex rounded overflow-hidden border border-border">
          {(['TRC20', 'ERC20'] as const).map(n => (
            <button
              key={n}
              type="button"
              onClick={() => switchNetwork(n)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                network === n ? 'bg-surface text-white border-b-2 border-accent' : 'text-gray-500 hover:text-gray-300 bg-background'
              }`}
            >
              {n}
              {n === 'TRC20' && <span className="ml-1.5 px-1.5 py-0.5 rounded bg-accent/20 text-accent text-[10px] font-bold">Recommended</span>}
            </button>
          ))}
        </div>

        {/* Sender wallet — inline add / edit / delete */}
        <div className="rounded bg-background border border-border p-3">
          {editing ? (
            <form onSubmit={handleSaveWallet} className="space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Send FROM ({network})</p>
              {walletError && <p className="text-red-400 text-xs">{walletError}</p>}
              <input
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={network === 'ERC20' ? 'e.g. 0x...' : 'e.g. TXyz...'}
                required
                autoFocus
                className="w-full px-3 py-2 rounded bg-surface border border-border text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={walletLoading} className="px-3 py-1 rounded bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50">
                  {walletLoading ? 'Saving…' : 'Save'}
                </button>
                {senderWallet && (
                  <button type="button" onClick={() => { setEditing(false); setWalletError('') }} className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white transition-colors">
                    Cancel
                  </button>
                )}
              </div>
            </form>
          ) : senderWallet ? (
            <div className="space-y-0.5">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Send FROM this wallet</p>
              <p className="text-white text-sm font-mono break-all">{senderWallet}</p>
              <p className="text-gray-600 text-xs">Must match exactly — transactions from other addresses will be rejected</p>
              {walletError && <p className="text-red-400 text-xs mt-1">{walletError}</p>}
              {confirmDel ? (
                <div className="flex items-center gap-2 pt-2">
                  <p className="text-gray-400 text-xs flex-1">Remove this wallet?</p>
                  <button onClick={handleDeleteWallet} disabled={walletLoading} className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50">
                    {walletLoading ? 'Removing…' : 'Yes'}
                  </button>
                  <button onClick={() => setConfirmDel(false)} className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setEditValue(senderWallet); setEditing(true) }}
                    className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white hover:border-gray-500 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDel(true)}
                    className="px-3 py-1 rounded border border-red-700/40 text-red-400 text-xs hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-gray-500 text-xs uppercase tracking-wide">Send FROM wallet ({network})</p>
              <p className="text-gray-600 text-xs">No {network} sender wallet registered.</p>
              <button
                type="button"
                onClick={() => { setEditValue(''); setEditing(true) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border text-gray-400 text-xs hover:text-white hover:border-gray-500 transition-colors"
              >
                + Add {network} wallet
              </button>
            </div>
          )}
        </div>

        {/* Destination (platform escrow) address */}
        <div className="rounded bg-background border border-border p-4 space-y-2">
          {address ? (
            <>
              <p className="text-gray-500 text-xs uppercase tracking-wide">Send TO ({network})</p>
              <div className="flex items-start gap-3">
                <p className="text-white text-sm font-mono break-all flex-1">{address}</p>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                    copied
                      ? 'bg-green-900/30 border-green-700/50 text-green-400'
                      : 'bg-surface border-border text-gray-400 hover:text-white hover:border-gray-500'
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
              className="w-full px-4 py-3 rounded bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors"
            />
            <p className="text-gray-600 text-xs mt-1.5">Find the TX ID in your wallet app or exchange after sending</p>
          </div>

          {result && !result.ok && (
            <p className="text-red-400 text-xs">{result.error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !address || !senderWallet}
            className="w-full py-3 rounded bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
          >
            {loading ? 'Verifying on blockchain…' : `Verify & Credit — min ${minDeposit} USDT`}
          </button>
        </form>
      </div>

    </div>
  )
}
