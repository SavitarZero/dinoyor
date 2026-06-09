'use client'
import { useEffect, useState } from 'react'

export function AutoReleaseTimer({ autoReleaseAt }: { autoReleaseAt: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(autoReleaseAt).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('Buyer did not confirm. Funds will be released to seller shortly.')
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      if (h > 0) {
        setRemaining(`Buyer has ${h}h ${m}m to confirm. Funds auto-release to seller after deadline.`)
      } else {
        setRemaining(`Buyer has ${m}m to confirm. Funds auto-release to seller after deadline.`)
      }
    }
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [autoReleaseAt])

  const deadlineStr = new Date(autoReleaseAt).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
  })

  return (
    <div className="rounded border border-border bg-surface px-4 py-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-yellow-400 text-sm">{remaining}</p>
        <p className="text-gray-500 text-xs">Deadline: {deadlineStr} (ICT)</p>
      </div>
    </div>
  )
}
