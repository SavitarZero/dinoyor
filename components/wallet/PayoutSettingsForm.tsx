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
        <div className="relative">
          <input
            type="number"
            min="1"
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
            className="w-full px-3 py-2.5 pr-9 rounded-xl bg-background border border-border text-white text-sm focus:outline-none focus:border-accent transition-colors"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col">
            <button type="button" onClick={() => setValue(String(Math.max(1, (parseFloat(value) || 0) + 1)))} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button type="button" onClick={() => setValue(String(Math.max(1, (parseFloat(value) || 0) - 1)))} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2.5 rounded-xl bg-accent text-black text-sm font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {saving ? 'Saving…' : 'Save'}
      </button>
      {message && (
        <p className={`text-xs ${message === 'Saved' ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
      )}
    </form>
  )
}
