'use client'
import { useState } from 'react'
import { updateWalletAddress } from '@/lib/actions/wallet'
import { CustomSelect } from '@/components/ui/CustomSelect'

const NETWORKS = [
  { value: 'TRC20', label: 'USDT TRC20 (Tron)' },
  { value: 'ERC20', label: 'USDT ERC20 (Ethereum)' },
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
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {saved && <p className="text-green-400 text-sm">Wallet address saved.</p>}

      <div>
        <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">Network</label>
        <CustomSelect
          value={network}
          onChange={setNetwork}
          options={NETWORKS}
          placeholder="Select network…"
        />
      </div>

      <div>
        <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">Wallet address</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="e.g. TXyz... / 0x..."
          required
          className="w-full px-3 py-2 rounded bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        <p className="text-gray-600 text-xs mt-1">Double-check the address and network — incorrect addresses cannot be recovered.</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="px-4 py-1.5 rounded bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Save address'}
      </button>
    </form>
  )
}
