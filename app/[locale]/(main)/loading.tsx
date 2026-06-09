export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-4 animate-pulse">
      <div className="h-6 w-40 rounded bg-white/8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="h-32 rounded-xl bg-white/5 border border-border" />
        <div className="h-32 rounded-xl bg-white/5 border border-border" />
        <div className="h-32 rounded-xl bg-white/5 border border-border" />
      </div>
      <div className="h-48 rounded-xl bg-white/5 border border-border" />
      <div className="h-64 rounded-xl bg-white/5 border border-border" />
    </div>
  )
}
