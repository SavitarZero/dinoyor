'use client'
import { useState } from 'react'
import { submitKYC } from '@/lib/actions/kyc'
import type { KYCStatus } from '@/lib/types'

export function KYCForm({ currentStatus }: { currentStatus: KYCStatus }) {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (currentStatus === 'approved') {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-green-400 font-semibold">KYC Verified</p>
        <p className="text-gray-400 text-sm mt-1">Your identity has been verified. You can now sell items.</p>
      </div>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <div className="rounded-xl border border-border bg-surface p-6">
        <p className="text-yellow-400 font-semibold">KYC Under Review</p>
        <p className="text-gray-400 text-sm mt-1">We will review your submission within 1-2 business days.</p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await submitKYC(formData)
    setLoading(false)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage(result.success)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-bold text-white">Verify Your Identity</h2>
      <p className="text-gray-400 text-sm">Required to list items for sale.</p>

      {currentStatus === 'rejected' && (
        <div className="rounded-lg bg-red-900/20 border border-red-700 p-3">
          <p className="text-red-400 text-sm">Previous submission was rejected. Please resubmit.</p>
        </div>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-accent text-sm">{message}</p>}

      <div>
        <label className="block text-gray-400 text-sm mb-1">Phone Number</label>
        <input
          name="phone"
          type="tel"
          required
          placeholder="+66812345678"
          className="w-full px-4 py-2 rounded-lg bg-background border border-border text-white focus:outline-none focus:border-accent"
        />
      </div>
      <div>
        <label className="block text-gray-400 text-sm mb-1">National ID Photo</label>
        <input
          name="id_card"
          type="file"
          accept="image/*,.pdf"
          required
          className="w-full text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-surface file:text-white file:cursor-pointer"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg bg-accent text-black font-semibold disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit KYC'}
      </button>
    </form>
  )
}
