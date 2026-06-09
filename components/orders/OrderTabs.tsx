'use client'
import { useRouter } from 'next/navigation'

const ROLE_TABS = [
  { id: 'all', label: 'All' },
  { id: 'buying', label: 'Buying' },
  { id: 'selling', label: 'Selling' },
]

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'In Progress' },
  { id: 'completed', label: 'Completed' },
  { id: 'disputed', label: 'Refunded' },
  { id: 'cancelled', label: 'Cancelled' },
]

export function OrderTabs({ activeRole, activeStatus }: { activeRole: string; activeStatus: string }) {
  const router = useRouter()

  function buildUrl(role: string, status: string) {
    const params = new URLSearchParams()
    if (role !== 'all') params.set('role', role)
    if (status !== 'all') params.set('tab', status)
    const qs = params.toString()
    return `/orders${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="space-y-3 mb-6">
      <div className="flex border-b border-border overflow-x-auto scrollbar-none">
        {ROLE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(buildUrl(tab.id, activeStatus))}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
              activeRole === tab.id
                ? 'border-accent text-white'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 bg-surface border border-border rounded p-1 w-fit overflow-x-auto scrollbar-none">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => router.push(buildUrl(activeRole, tab.id))}
            className={`px-4 py-1.5 rounded text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === tab.id
                ? 'bg-accent text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
