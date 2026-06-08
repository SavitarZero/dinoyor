'use client'
import { useEffect, useState } from 'react'

export function AutoReleaseTimer({ autoReleaseAt }: { autoReleaseAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(autoReleaseAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Auto-releasing...')
        return
      }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      setRemaining(`${d}d ${h}h ${m}m until auto-release`)
    }
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [autoReleaseAt])

  return (
    <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <p className="text-yellow-400 text-sm">{remaining}</p>
    </div>
  )
}
