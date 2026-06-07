'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export function NavbarSearch() {
  const [query, setQuery]   = useState('')
  const [focused, setFocused] = useState(false)
  const router  = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault()
        inputRef.current?.focus()
      }
      if (e.key === 'Escape') inputRef.current?.blur()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/market?q=${encodeURIComponent(query.trim())}`)
      inputRef.current?.blur()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* MUI Outlined Input style */}
      <div
        className={`flex items-center h-10 rounded border transition-colors duration-150 bg-background ${
          focused ? 'border-accent' : 'border-border hover:border-gray-500'
        }`}
      >
        <Search
          size={16}
          className={`ml-3 shrink-0 transition-colors ${focused ? 'text-accent' : 'text-gray-600'}`}
        />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search games, items..."
          className="flex-1 h-full px-2.5 bg-transparent text-sm text-white placeholder-gray-600 focus:outline-none"
        />

        {/* Shortcut hint */}
        {!focused && !query && (
          <kbd className="mr-3 px-1.5 py-0.5 rounded border border-border text-gray-700 text-[10px] font-mono hidden sm:block select-none">
            /
          </kbd>
        )}

        {/* Clear */}
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus() }}
            className="mr-1.5 p-1 rounded text-gray-500 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </form>
  )
}
