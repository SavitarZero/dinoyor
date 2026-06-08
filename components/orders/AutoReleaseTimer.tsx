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
    <div className="rounded bg-yellow-900/20 border border-yellow-700 px-3 py-2">
      <p className="text-yellow-400 text-sm">{remaining}</p>
    </div>
  )
}
