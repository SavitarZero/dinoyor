'use client'
import { useState } from 'react'
import { saveDepositWallet } from '@/lib/actions/deposits'

const NETWORKS: { value: 'TRC20' | 'ERC20'; label: string; placeholder: string }[] = [
  { value: 'TRC20', label: 'USDT TRC20 (Tron)', placeholder: 'e.g. TXyz...' },
  { value: 'ERC20', label: 'USDT ERC20 (Ethereum)', placeholder: 'e.g. 0x...' },
]

interface Props {
  currentAddress: string | null
  currentNetwork: string | null
}

export function DepositWalletForm({ currentAddress, currentNetwork }: Props) {
  const [address, setAddress] = useState(currentAddress ?? '')
  const [network, setNetwork] = useState<'TRC20' | 'ERC20'>(
    (currentNetwork as 'TRC20' | 'ERC20') ?? 'TRC20'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    const result = await saveDepositWallet(address, network)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSaved(true)
  }

  const selectedNetwork = NETWORKS.find(n => n.value === network) ?? NETWORKS[0]

  return (
    <div className="space-y-4">
      {currentAddress && (
        <div className="rounded-xl bg-surface border border-border px-4 py-3">
          <p className="text-xs font-medium text-gray-500 mb-1.5">Current deposit wallet</p>
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 rounded-md bg-accent/10 text-accent text-xs font-bold px-2 py-0.5">
              {currentNetwork ?? 'TRC20'}
            </span>
            <span className="text-white text-sm font-mono truncate">{currentAddress}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && (
          <div className="rounded-xl bg-red-900/20 border border-red-700/50 px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}
        {saved && (
          <div className="rounded-xl bg-green-900/20 border border-green-700/50 px-4 py-3">
            <p className="text-green-400 text-sm">Deposit wallet saved.</p>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Network</label>
          <select
            value={network}
            onChange={e => setNetwork(e.target.value as 'TRC20' | 'ERC20')}
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:border-accent transition-colors"
          >
            {NETWORKS.map(n => (
              <option key={n.value} value={n.value}>{n.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Sender wallet address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={selectedNetwork.placeholder}
            required
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1.5">
            This is the address you will send funds FROM. Only deposits sent from this address will be accepted.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Saving…' : 'Save deposit wallet'}
        </button>
      </form>
    </div>
  )
}
