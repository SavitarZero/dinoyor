'use client'
import { useState, useRef } from 'react'
import { submitKYC } from '@/lib/actions/kyc'
import type { KYCStatus } from '@/lib/types/index'

export function KYCForm({ currentStatus }: { currentStatus: KYCStatus }) {
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  if (currentStatus === 'approved') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-green-700/40 bg-green-900/10 p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-green-900/40 border border-green-700/50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-green-400 font-bold">Identity Verified</p>
            <p className="text-gray-400 text-sm mt-1">You're verified and can list items for sale on Dinoyor.</p>
          </div>
        </div>
      </div>
    )
  }

  if (currentStatus === 'pending') {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-yellow-700/40 bg-yellow-900/10 p-6 flex gap-4 items-start">
          <div className="w-10 h-10 rounded-full bg-yellow-900/40 border border-yellow-700/50 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-yellow-400 font-bold">Under Review</p>
            <p className="text-gray-400 text-sm mt-1">We're reviewing your submission. This usually takes 1–2 business days.</p>
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
          <p className="text-gray-400 text-sm font-medium">What happens next?</p>
          {['Our team reviews your ID document', 'We verify your phone number', 'You receive confirmation via email'].map((step, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm text-gray-500">
              <span className="w-5 h-5 rounded-full bg-background border border-border text-xs flex items-center justify-center shrink-0 text-gray-600">{i + 1}</span>
              {step}
            </div>
          ))}
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

  const inputCls = 'w-full px-4 py-3 rounded-xl bg-background border border-border text-white placeholder-gray-600 text-sm focus:outline-none focus:border-accent transition-colors'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Verify Your Identity</h1>
        <p className="text-gray-500 text-sm mt-1">Required to sell items. Your data is encrypted and secure.</p>
      </div>

      {currentStatus === 'rejected' && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/10 p-4 flex gap-3 items-start">
          <svg className="w-4 h-4 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-red-400 font-medium text-sm">Previous Submission Rejected</p>
            <p className="text-gray-400 text-xs mt-0.5">Please resubmit with a clear photo of your ID.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-700/40 bg-red-900/10 p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
          <p className="text-accent text-sm">{message}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Phone Number</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">📱</span>
            <input
              name="phone"
              type="tel"
              required
              placeholder="+66 81 234 5678"
              className={inputCls + ' pl-10'}
            />
          </div>
          <p className="text-gray-600 text-xs mt-1">Include country code (e.g. +66 for Thailand)</p>
        </div>

        {/* ID document */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">National ID / Passport Photo</label>
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
            className={`w-full rounded-xl border-2 border-dashed p-6 text-center transition-colors group ${fileName ? 'border-accent/50 bg-accent/5' : 'border-border hover:border-accent'}`}
          >
            {fileName ? (
              <div className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-accent text-sm font-medium truncate max-w-xs">{fileName}</p>
              </div>
            ) : (
              <>
                <svg className="w-7 h-7 text-gray-600 group-hover:text-accent transition-colors mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                </svg>
                <p className="text-gray-400 text-sm group-hover:text-white transition-colors">Click to upload ID document</p>
                <p className="text-gray-600 text-xs mt-1">JPG, PNG, or PDF · Max 5 MB</p>
              </>
            )}
          </button>
          {fileName && (
            <button type="button" onClick={() => { setFileName(''); if (fileRef.current) fileRef.current.value = '' }} className="mt-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors">
              Remove file
            </button>
          )}
        </div>

        {/* Privacy note */}
        <div className="rounded-xl bg-surface border border-border p-3 flex gap-2">
          <svg className="w-4 h-4 text-gray-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <p className="text-gray-500 text-xs">Your ID document is encrypted and only accessible to our verification team. We never share personal data.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-accent text-black font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Submitting...
            </>
          ) : 'Submit for Verification'}
        </button>
      </form>
    </div>
  )
}
