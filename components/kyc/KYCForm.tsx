'use client'
import { useState, useRef } from 'react'
import { submitKYC } from '@/lib/actions/kyc'
import type { KYCStatus } from '@/lib/types/index'

export function KYCForm({ currentStatus, phone, submittedAt, reviewedAt }: {
  currentStatus: KYCStatus
  phone?: string | null
  submittedAt?: string | null
  reviewedAt?: string | null
}) {
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (currentStatus === 'approved') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-green-800/50 bg-green-950/20 p-5">
          <p className="text-green-400 text-sm font-medium">Identity verified</p>
          <p className="text-gray-500 text-xs mt-1">You're verified and can list items for sale on Dinoyor.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {phone && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Phone</p>
              <p className="text-white text-sm">{phone}</p>
            </div>
          )}
          {submittedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Submitted</p>
              <p className="text-white text-sm">{new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
          {reviewedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Verified on</p>
              <p className="text-white text-sm">{new Date(reviewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-yellow-800/50 bg-yellow-950/20 p-5">
          <p className="text-yellow-400 text-sm font-medium">Under review</p>
          <p className="text-gray-500 text-xs mt-1">We're reviewing your submission. Usually takes 1–2 business days.</p>
        </div>
        <div className="rounded-xl border border-border bg-surface divide-y divide-border">
          {phone && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Phone</p>
              <p className="text-white text-sm">{phone}</p>
            </div>
          )}
          {submittedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Submitted</p>
              <p className="text-white text-sm">{new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-gray-500 text-xs">Document</p>
            <p className="text-gray-400 text-sm">Uploaded</p>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await submitKYC(new FormData(e.currentTarget))
    setLoading(false)
    if (result?.error) setError(result.error)
    if (result?.success) setMessage(result.success)
  }

  const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <div className="space-y-5">
      {currentStatus === 'rejected' && (
        <div className="rounded-xl border border-red-800/50 bg-red-950/20 p-4">
          <p className="text-red-400 text-sm font-medium">Previous submission rejected</p>
          <p className="text-gray-500 text-xs mt-0.5">Please resubmit with a clear photo of your ID.</p>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-accent text-sm">{message}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone number</label>
          <input
            name="phone"
            type="tel"
            required
            placeholder="+66 81 234 5678"
            className={inputCls}
          />
          <p className="text-gray-600 text-xs mt-1">Include country code</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">ID document photo</label>
          <input
            ref={fileRef}
            name="id_card"
            type="file"
            accept="image/*,.pdf"
            required
            onChange={e => setFileName(e.target.files?.[0]?.name ?? '')}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`w-full rounded-xl border-2 border-dashed py-8 text-center transition-colors ${fileName ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-accent'}`}
          >
            {fileName ? (
              <p className="text-accent text-sm truncate px-4">{fileName}</p>
            ) : (
              <>
                <p className="text-sm text-gray-400">Click to upload ID document</p>
                <p className="text-xs text-gray-600 mt-0.5">JPG, PNG or PDF · max 5 MB</p>
              </>
            )}
          </button>
          {fileName && (
            <button type="button" onClick={() => { setFileName(''); if (fileRef.current) fileRef.current.value = '' }} className="mt-1 text-xs text-gray-600 hover:text-red-400 transition-colors">
              Remove
            </button>
          )}
        </div>

        <p className="text-gray-600 text-xs">Your document is encrypted and only accessible to our verification team.</p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          {loading ? 'Submitting…' : 'Submit for verification'}
        </button>
      </form>
    </div>
  )
}
