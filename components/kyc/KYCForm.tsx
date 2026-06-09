'use client'
import { useState, useRef } from 'react'
import { submitKYC } from '@/lib/actions/kyc'
import type { KYCStatus } from '@/lib/types/index'

export function KYCForm({ currentStatus, submittedAt, reviewedAt, hasEmail = true }: {
  currentStatus: KYCStatus
  submittedAt?: string | null
  reviewedAt?: string | null
  hasEmail?: boolean
}) {
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (currentStatus === 'approved') {
    return (
      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-green-400 text-sm font-semibold">Application approved</p>
            <p className="text-gray-500 text-xs">You are now a verified seller on DCORE.</p>
          </div>
        </div>
        <div className="divide-y divide-border">
          {submittedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Submitted</p>
              <p className="text-white text-sm">{new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
          {reviewedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Approved on</p>
              <p className="text-white text-sm">{new Date(reviewedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
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
          {submittedAt && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Submitted</p>
              <p className="text-white text-sm">{new Date(submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-gray-500 text-xs">Photo</p>
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

  return (
    <div className="space-y-4">
      {currentStatus === 'rejected' && (
        <div className="rounded border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-center gap-3">
          <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <div>
            <p className="text-red-400 text-sm font-semibold">Previous submission rejected</p>
            <p className="text-gray-500 text-xs">Please resubmit with a clear photo.</p>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-accent text-sm">{message}</p>}

      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-white text-sm font-semibold">Submit application</p>
        </div>
        <div className="px-4 py-4">
          <form onSubmit={handleSubmit} className="space-y-5">

            {!hasEmail && (
              <div>
                <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">Email address</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full px-3 py-2 rounded bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-focus-border transition-colors"
                />
                <p className="text-gray-600 text-xs mt-1">Used for order notifications and account recovery.</p>
              </div>
            )}

            <div>
              <label className="block text-gray-500 text-xs font-medium uppercase tracking-wide mb-1.5">Photo with ID card</label>
              <div className="mb-3 rounded bg-surface-2 border border-border px-3 py-3 space-y-1.5">
                <p className="text-gray-300 text-xs font-medium">How to take the photo:</p>
                <ol className="list-decimal list-inside text-gray-500 text-xs space-y-1">
                  <li>Hold your national ID card next to your face.</li>
                  <li>Write on a piece of paper: <span className="text-gray-300 font-medium">"Used for registering as a seller of DCORE"</span></li>
                  <li>Hold the paper in the same photo so both your face, ID, and note are clearly visible.</li>
                </ol>
              </div>
              <input
                ref={fileRef}
                name="id_card"
                type="file"
                accept="image/*"
                required
                onChange={e => setFileName(e.target.files?.[0]?.name ?? '')}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`w-full rounded border border-dashed py-6 text-center transition-colors ${fileName ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-gray-500'}`}
              >
                {fileName ? (
                  <p className="text-accent text-sm truncate px-4">{fileName}</p>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">Click to upload photo</p>
                    <p className="text-gray-600 text-xs mt-0.5">JPG or PNG · max 10 MB</p>
                  </>
                )}
              </button>
              {fileName && (
                <button
                  type="button"
                  onClick={() => { setFileName(''); if (fileRef.current) fileRef.current.value = '' }}
                  className="mt-1 text-xs text-gray-600 hover:text-red-400"
                >
                  Remove
                </button>
              )}
            </div>

            <p className="text-gray-600 text-xs">Your photo is encrypted and only accessible to our verification team.</p>

            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded bg-accent text-black text-xs font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Submitting…' : 'Apply to become a seller'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
