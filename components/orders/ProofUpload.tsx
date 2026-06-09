'use client'
import { useState, useRef } from 'react'
import { confirmDelivery } from '@/lib/actions/orders'

const MAX_FILES = 5

export function ProofUpload({ orderId }: { orderId: string }) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    const incoming = Array.from(fileList)
    const available = MAX_FILES - previews.length
    const toAdd = incoming.slice(0, available)
    setPreviews(prev => [...prev, ...toAdd.map(f => ({ file: f, url: URL.createObjectURL(f) }))])
    if (inputRef.current) inputRef.current.value = ''
  }

  function removeFile(index: number) {
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!previews.length) return
    setLoading(true)
    setError('')
    const result = await confirmDelivery(orderId, previews.map(p => p.file))
    setLoading(false)
    if (result?.error) setError(result.error)
    else setMessage('Delivery confirmed. Waiting for buyer confirmation.')
  }

  if (message) {
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
        <p className="text-green-400 text-sm">{message}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-gray-500 text-xs">Upload up to {MAX_FILES} screenshots as proof of delivery.</p>

      {/* Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {previews.map((p, i) => (
            <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-background border border-border group">
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ))}
          {previews.length < MAX_FILES && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="aspect-square rounded-lg border border-dashed border-border hover:border-gray-500 flex items-center justify-center transition-colors"
            >
              <span className="text-gray-500 text-lg">+</span>
            </button>
          )}
        </div>
      )}

      {/* File input */}
      {previews.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-border hover:border-gray-500 py-6 text-center transition-colors"
        >
          <p className="text-gray-400 text-sm">Click to upload screenshots</p>
          <p className="text-gray-600 text-xs mt-0.5">JPG or PNG · max {MAX_FILES} images</p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={e => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || previews.length === 0}
        className="px-4 py-1.5 rounded-lg bg-success text-black text-xs font-bold hover:bg-success-hover disabled:opacity-50 transition-colors"
      >
        {loading ? 'Uploading...' : 'Confirm Delivery'}
      </button>
    </form>
  )
}
