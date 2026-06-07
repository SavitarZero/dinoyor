'use client'
import { useState } from 'react'
import { updateWalletAddress } from '@/lib/actions/wallet'

const NETWORKS = [
  { value: 'TRC20', label: 'USDT TRC20 (Tron)' },
  { value: 'ERC20', label: 'USDT ERC20 (Ethereum)' },
  { value: 'BEP20', label: 'USDT BEP20 (BNB Chain)' },
]

interface Props {
  currentAddress: string | null
  currentNetwork: string | null
}

export function WalletAddressForm({ currentAddress, currentNetwork }: Props) {
  const [address, setAddress] = useState(currentAddress ?? '')
  const [network, setNetwork] = useState(currentNetwork ?? 'TRC20')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    const result = await updateWalletAddress(address, network)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="rounded-xl bg-red-900/20 border border-red-700/50 px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {saved && (
        <div className="rounded-xl bg-green-900/20 border border-green-700/50 px-4 py-3">
          <p className="text-green-400 text-sm">Wallet address saved.</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Network</label>
        <select
          value={network}
          onChange={e => setNetwork(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:border-accent transition-colors"
        >
          {NETWORKS.map(n => (
            <option key={n.value} value={n.value}>{n.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5">Wallet address</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="e.g. TXyz... / 0x..."
          required
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-gray-600 text-xs mt-1.5">
          This is where your payout will be sent. Double-check the address and network — incorrect addresses cannot be recovered.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? 'Saving…' : 'Save wallet address'}
      </button>
    </form>
  )
}
