'use client'
import { useState } from 'react'
import { updatePayoutSettings } from '@/lib/actions/payouts'

export function PayoutSettingsForm({ currentMin }: { currentMin: number }) {
  const [value, setValue] = useState(currentMin.toString())
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    const result = await updatePayoutSettings(Number(value))
    if (result.error) setMessage(result.error)
    else setMessage('Saved')
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
      <div className="flex-1 w-full sm:w-auto">
        <label className="text-gray-500 text-xs block mb-1">Minimum payout amount (USDT)</label>
        <input
          type="number"
          min="1"
          step="0.01"
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg bg-background border border-border text-white text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2.5 rounded-lg bg-accent text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {message && (
        <p className={`text-xs ${message === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}
    </form>
  )
}
