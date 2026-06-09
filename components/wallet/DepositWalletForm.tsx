'use client'
import { useState } from 'react'
import { saveDepositWallet, deleteDepositWallet } from '@/lib/actions/deposits'

interface Props {
  trc20Address: string | null
  erc20Address: string | null
}

type Network = 'TRC20' | 'ERC20'

function NetworkWallet({ network, address }: Readonly<{ network: Network; address: string | null }>) {
  const [editing, setEditing]       = useState(!address)
  const [value, setValue]           = useState(address ?? '')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [saved, setSaved]           = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const placeholder = network === 'ERC20' ? 'e.g. 0x...' : 'e.g. TXyz...'

  async function handleSave(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSaved(false)
    setLoading(true)
    const result = await saveDepositWallet(value, network)
    setLoading(false)
    if (result?.error) { setError(result.error); return }
    setSaved(true)
    setEditing(false)
  }

  async function handleDelete() {
    setLoading(true)
    setError('')
    const result = await deleteDepositWallet(network)
    setLoading(false)
    if (result?.error) { setError(result.error); setConfirmDel(false); return }
    setValue('')
    setEditing(true)
    setConfirmDel(false)
    setSaved(false)
  }

  return (
    <div className="rounded-lg border border-border bg-background p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-surface border border-border text-gray-400">{network}</span>
        {address && !editing && (
          <span className="text-[10px] text-green-400 font-medium">Registered</span>
        )}
      </div>

      {!editing && value ? (
        <div className="space-y-2">
          <p className="text-white text-xs font-mono break-all">{value}</p>
          {error && <p className="text-red-400 text-xs">{error}</p>}
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
              <button onClick={() => { setEditing(true); setSaved(false) }} className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white hover:border-accent transition-colors">
                Edit
              </button>
              <button onClick={() => setConfirmDel(true)} className="px-3 py-1 rounded border border-red-700/40 text-red-400 text-xs hover:bg-red-900/20 transition-colors">
                Delete
              </button>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-2">
          {error && <p className="text-red-400 text-xs">{error}</p>}
          {saved && <p className="text-green-400 text-xs">Saved.</p>}
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={placeholder}
            required
            className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-white text-xs font-mono placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
          <div className="flex gap-2">
            <button type="submit" disabled={loading} className="px-3 py-1 rounded bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50">
              {loading ? 'Saving…' : 'Save'}
            </button>
            {address && (
              <button type="button" onClick={() => { setValue(address); setEditing(false); setError('') }} className="px-3 py-1 rounded border border-border text-gray-400 text-xs hover:text-white transition-colors">
                Cancel
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  )
}

export function DepositWalletForm({ trc20Address, erc20Address }: Readonly<Props>) {
  return (
    <div className="space-y-2">
      <NetworkWallet network="TRC20" address={trc20Address} />
      <NetworkWallet network="ERC20" address={erc20Address} />
    </div>
  )
}
