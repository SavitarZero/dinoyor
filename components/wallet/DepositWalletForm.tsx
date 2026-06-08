'use client'
import { useState } from 'react'
import { saveDepositWallet } from '@/lib/actions/deposits'
import { CustomSelect } from '@/components/ui/CustomSelect'

const NETWORKS = [
  { value: 'TRC20', label: 'USDT TRC20 (Tron)' },
  { value: 'ERC20', label: 'USDT ERC20 (Ethereum)' },
]

interface Props {
  currentAddress: string | null
  currentNetwork: string | null
}

export function DepositWalletForm({ currentAddress, currentNetwork }: Props) {
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
    const result = await saveDepositWallet(address, network as 'TRC20' | 'ERC20')
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSaved(true)
  }

  const placeholder = network === 'ERC20' ? 'e.g. 0x...' : 'e.g. TXyz...'

  return (
    <div className="space-y-3">
      {currentAddress && (
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded bg-accent/10 text-accent text-xs font-bold px-2 py-0.5">
            {currentNetwork ?? 'TRC20'}
          </span>
          <span className="text-white text-sm font-mono truncate">{currentAddress}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {saved && <p className="text-green-400 text-sm">Deposit wallet saved.</p>}

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
          <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">Sender wallet address</label>
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder={placeholder}
            required
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-gray-600 text-xs mt-1">Only deposits sent from this address will be accepted.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save deposit wallet'}
        </button>
      </form>
    </div>
  )
}
