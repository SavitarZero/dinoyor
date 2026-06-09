'use client'
import { useState } from 'react'
import { saveDepositWallet, deleteDepositWallet } from '@/lib/actions/deposits'
import { CustomSelect } from '@/components/ui/CustomSelect'

const NETWORKS = [
  { value: 'TRC20', label: 'USDT TRC20 (Tron)' },
  { value: 'ERC20', label: 'USDT ERC20 (Ethereum)' },
]

interface Props {
  currentAddress: string | null
  currentNetwork: string | null
}

export function DepositWalletForm({ currentAddress, currentNetwork }: Readonly<Props>) {
  const [editing, setEditing]   = useState(!currentAddress)
  const [address, setAddress]   = useState(currentAddress ?? '')
  const [network, setNetwork]   = useState(currentNetwork ?? 'TRC20')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [saved, setSaved]       = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const placeholder = network === 'ERC20' ? 'e.g. 0x...' : 'e.g. TXyz...'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    const result = await saveDepositWallet(address, network as 'TRC20' | 'ERC20')
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSaved(true)
    setEditing(false)
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await deleteDepositWallet()
    setLoading(false)
    if (result?.error) { setError(result.error); setConfirmDel(false); return }
    setAddress('')
    setNetwork('TRC20')
    setEditing(true)
    setConfirmDel(false)
    setSaved(false)
  }

  // View mode — wallet already saved
  if (!editing && address) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="shrink-0 rounded bg-accent/10 text-accent text-xs font-bold px-2 py-0.5">
            {network}
          </span>
          <span className="text-white text-sm font-mono truncate flex-1">{address}</span>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {confirmDel ? (
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-xs flex-1">Remove this wallet?</p>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Removing…' : 'Yes, remove'}
            </button>
            <button
              onClick={() => setConfirmDel(false)}
              className="px-3 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-medium hover:text-white"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(true); setSaved(false) }}
              className="px-3 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-medium hover:text-white hover:border-accent transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              className="px-3 py-1.5 rounded-lg border border-red-700/40 text-red-400 text-xs font-medium hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  // Edit / add mode
  return (
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

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
        {currentAddress && (
          <button
            type="button"
            onClick={() => { setAddress(currentAddress); setNetwork(currentNetwork ?? 'TRC20'); setEditing(false); setError('') }}
            className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-medium hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
