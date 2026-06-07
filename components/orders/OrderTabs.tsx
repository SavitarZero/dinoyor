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
    <div className="flex gap-1 p-1 rounded-xl bg-surface border border-border mb-6">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => router.push(tab.id === 'all' ? '/orders' : `/orders?tab=${tab.id}`)}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            active === tab.id
              ? 'bg-accent text-black'
              : 'text-gray-500 hover:text-white'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
