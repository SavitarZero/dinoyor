import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <p className="text-6xl font-black text-white/5 select-none">404</p>
        <div>
          <h1 className="text-base font-bold text-white">Page not found</h1>
          <p className="text-gray-500 text-xs mt-1">The page you're looking for doesn't exist or has been moved.</p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/" className="px-4 py-1.5 rounded-lg bg-accent text-black text-xs font-bold hover:opacity-90 transition-opacity">
            Go Home
          </Link>
          <Link href="/market" className="px-4 py-1.5 rounded-lg border border-border text-gray-400 text-xs font-bold hover:text-white hover:border-gray-500 transition-colors">
            Browse Market
          </Link>
        </div>
      </div>
    </div>
  )
}
