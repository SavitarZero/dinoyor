import { createClient } from '@/lib/supabase/server'
import { addCategory, deleteCategory, toggleCategory, updateCategoryOrder } from '@/lib/actions/categories'

export default async function AdminCategoriesPage() {
  const supabase = await createClient()
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, active, sort_order, created_at')
    .order('sort_order', { ascending: true })

  const rows = categories ?? []

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Categories</h1>
        <p className="text-gray-500 text-sm mt-0.5">Used to tag listings for filtering.</p>
      </div>

      {/* Add form */}
      <form action={addCategory} className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          placeholder="Category name…"
          className="flex-1 px-3 py-2 rounded bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded bg-accent text-black text-sm font-bold hover:opacity-90 transition-opacity shrink-0"
        >
          + Add
        </button>
      </form>

      {/* Table */}
      {rows.length === 0 ? (
        <p className="text-gray-600 text-sm">No categories yet.</p>
      ) : (
        <div className="rounded border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2">
                <th className="text-left px-4 py-2.5 text-gray-500 text-xs font-medium uppercase tracking-wide">Name</th>
                <th className="text-center px-4 py-2.5 text-gray-500 text-xs font-medium uppercase tracking-wide w-20">Order</th>
                <th className="text-center px-4 py-2.5 text-gray-500 text-xs font-medium uppercase tracking-wide w-20">Active</th>
                <th className="w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {rows.map(cat => (
                <tr key={cat.id} className="group">
                  <td className="px-4 py-3 text-white">{cat.name}</td>

                  {/* Sort order */}
                  <td className="px-4 py-3 text-center">
                    <form action={async (fd: FormData) => {
                      'use server'
                      const val = parseInt(fd.get('order') as string)
                      if (!isNaN(val)) await updateCategoryOrder(cat.id, val)
                    }}>
                      <input
                        name="order"
                        type="number"
                        defaultValue={cat.sort_order}
                        onBlur={undefined}
                        className="w-14 text-center px-1 py-1 rounded bg-background border border-border text-white text-xs focus:outline-none focus:border-accent"
                      />
                      <button type="submit" className="hidden" />
                    </form>
                  </td>

                  {/* Toggle active */}
                  <td className="px-4 py-3 text-center">
                    <form action={async () => {
                      'use server'
                      await toggleCategory(cat.id, !cat.active)
                    }}>
                      <button
                        type="submit"
                        className={`w-10 h-5 rounded-full relative transition-colors ${cat.active ? 'bg-accent' : 'bg-gray-700'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${cat.active ? 'right-0.5' : 'left-0.5'}`} />
                      </button>
                    </form>
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3 text-center">
                    <form action={async () => {
                      'use server'
                      await deleteCategory(cat.id)
                    }}>
                      <button
                        type="submit"
                        className="px-2 py-1 rounded border border-red-700/40 text-red-400 text-xs hover:bg-red-900/20 transition-colors"
                      >
                        Remove
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
