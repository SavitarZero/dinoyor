'use client'
import { useState } from 'react'
import { confirmDelivery } from '@/lib/actions/orders'

export function ProofUpload({ orderId }: { orderId: string }) {
  const [files, setFiles] = useState<FileList | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!files?.length) return
    setLoading(true)
    setError('')
    const result = await confirmDelivery(orderId, Array.from(files))
    setLoading(false)
    if (result?.error) setError(result.error)
    else setMessage('Delivery confirmed. Waiting for buyer confirmation.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 rounded border border-border bg-background">
      <p className="text-white font-medium">Mark as Delivered</p>
      <p className="text-gray-500 text-xs">Upload at least one screenshot as proof of delivery.</p>
      <input
        type="file"
        accept="image/*"
        multiple
        required
        onChange={e => setFiles(e.target.files)}
        className="w-full text-gray-400 text-sm file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-surface file:text-white file:cursor-pointer"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {message && <p className="text-accent text-sm">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded bg-accent text-black font-semibold disabled:opacity-50"
      >
        {loading ? 'Uploading...' : 'Confirm Delivery'}
      </button>
    </form>
  )
}
