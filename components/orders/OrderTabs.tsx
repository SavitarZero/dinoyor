'use client'
import { useRouter } from 'next/navigation'

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'completed', label: 'Completed' },
  { id: 'disputed', label: 'Disputed' },
]

export function OrderTabs({ active }: { active: string }) {
  const router = useRouter()
  return (
    <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-none">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.id === 'all' ? '/orders' : `/orders?tab=${tab.id}`)}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
            active === tab.id
              ? 'border-accent text-white'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
