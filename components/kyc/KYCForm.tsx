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
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-green-400 text-sm font-semibold">Identity verified</p>
              <p className="text-gray-500 text-xs">You can list items for sale on Dinoyor.</p>
            </div>
          </div>
          <div className="divide-y divide-border">
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
      </div>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-yellow-400 text-sm font-semibold">Under review</p>
              <p className="text-gray-500 text-xs">Usually takes 1–2 business days.</p>
            </div>
          </div>
          <div className="divide-y divide-border">
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

  return (
    <div className="space-y-4">
      {currentStatus === 'rejected' && (
        <div className="rounded-2xl border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-red-400 text-sm font-semibold">Previous submission rejected</p>
              <p className="text-gray-500 text-xs">Please resubmit with a clear photo of your ID.</p>
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-accent text-sm">{message}</p>}

      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-white text-sm font-semibold">Submit verification</p>
        </div>
        <div className="px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">Phone number</label>
              <input
                name="phone"
                type="tel"
                required
                placeholder="+66 81 234 5678"
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
              />
              <p className="text-gray-600 text-xs mt-1">Include country code</p>
            </div>

            <div>
              <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">ID document</label>
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
                className={`w-full rounded-lg border border-dashed py-6 text-center transition-colors ${fileName ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-accent/50'}`}
              >
                {fileName ? (
                  <p className="text-accent text-sm truncate px-4">{fileName}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Click to upload</p>
                    <p className="text-gray-600 text-xs mt-0.5">JPG, PNG or PDF · max 5 MB</p>
                  </>
                )}
              </button>
              {fileName && (
                <button type="button" onClick={() => { setFileName(''); if (fileRef.current) fileRef.current.value = '' }} className="mt-1 text-xs text-gray-600 hover:text-red-400">
                  Remove
                </button>
              )}
            </div>

            <p className="text-gray-600 text-xs">Your document is encrypted and only accessible to our verification team.</p>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Submitting…' : 'Submit for verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
