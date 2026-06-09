'use client'
import { useState } from 'react'
import { updateWalletAddress, deleteWalletAddress } from '@/lib/actions/wallet'
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
  const [editing, setEditing]       = useState(!currentAddress)
  const [address, setAddress]       = useState(currentAddress ?? '')
  const [network, setNetwork]       = useState(currentNetwork ?? 'TRC20')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [saved, setSaved]           = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    const result = await updateWalletAddress(address, network)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSaved(true)
    setEditing(false)
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await deleteWalletAddress()
    setLoading(false)
    if (result?.error) { setError(result.error); setConfirmDel(false); return }
    setAddress('')
    setNetwork('TRC20')
    setEditing(true)
    setConfirmDel(false)
    setSaved(false)
  }

  if (!editing && address) {
    return (
      <div className="space-y-2">
        <div className="rounded-lg bg-background border border-border px-3 py-2.5">
          <p className="text-gray-500 text-xs">{network}</p>
          <p className="text-white text-sm font-mono break-all">{address}</p>
        </div>
        {error && <p className="text-red-400 text-xs">{error}</p>}
        {saved && <p className="text-green-400 text-xs">Saved.</p>}
        {confirmDel ? (
          <div className="flex items-center gap-2">
            <p className="text-gray-400 text-xs flex-1">Remove this wallet?</p>
            <button onClick={handleDelete} disabled={loading} className="px-3 py-1 rounded bg-red-600 text-white text-xs font-bold hover:opacity-90 disabled:opacity-50">
              {loading ? 'Removing…' : 'Yes'}
            </button>
            <button onClick={() => setConfirmDel(false)} className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => { setEditing(true); setSaved(false) }}
              className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white hover:border-gray-500 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => setConfirmDel(true)}
              className="px-3 py-1 rounded border border-red-700/40 text-red-400 text-xs hover:bg-red-900/20 transition-colors"
            >
              Delete
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      {error && <p className="text-red-400 text-xs">{error}</p>}
      {saved && <p className="text-green-400 text-xs">Saved.</p>}

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
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors"
        />
        <p className="text-gray-600 text-xs mt-1">Double-check the address and network — incorrect addresses cannot be recovered.</p>
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
            className="px-3 py-1.5 rounded-lg border border-border text-gray-400 text-xs hover:text-white transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
