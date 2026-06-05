import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AutoReleaseTimer } from '@/components/orders/AutoReleaseTimer'
import { ProofUpload } from '@/components/orders/ProofUpload'
import { buyerConfirmReceived, openDispute } from '@/lib/actions/orders'
import Image from 'next/image'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, listings(title, images), buyer:profiles!buyer_id(username), seller:profiles!seller_id(username)')
    .eq('id', id)
    .single()
  if (!order) notFound()

  const isBuyer = user.id === order.buyer_id
  const isSeller = user.id === order.seller_id
  if (!isBuyer && !isSeller) notFound()

  const { data: proofs } = await supabase
    .from('order_proofs')
    .select('screenshot_urls')
    .eq('order_id', id)

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">
        Order <span className="text-gray-500 text-base font-mono">#{id.slice(0, 8)}</span>
      </h1>

      <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
        <div className="space-y-2">
          <p className="text-gray-400">
            Item: <span className="text-white">{(order as any).listings?.title}</span>
          </p>
          <p className="text-gray-400">
            Amount: <span className="text-accent font-semibold">{order.amount} {order.currency}</span>
          </p>
          <p className="text-gray-400">
            Status:{' '}
            <span className="text-white capitalize">{order.status.replace(/_/g, ' ')}</span>
          </p>
          <p className="text-gray-400">
            {isBuyer ? 'Seller' : 'Buyer'}:{' '}
            <span className="text-white">
              {isBuyer
                ? (order as any).seller?.username ?? 'Anonymous'
                : (order as any).buyer?.username ?? 'Anonymous'}
            </span>
          </p>
        </div>

        {order.status === 'awaiting_payment' && isBuyer && (
          <div className="rounded-lg bg-yellow-900/20 border border-yellow-700 p-4">
            <p className="text-yellow-400 font-medium text-sm">Payment Instructions</p>
            <p className="text-gray-400 text-sm mt-1">
              Send exactly <strong className="text-white">{order.amount} {order.currency}</strong> to the
              platform escrow wallet. After payment is confirmed, the order will proceed.
            </p>
            <p className="text-gray-500 text-xs mt-2">Contact support to get the escrow wallet address.</p>
          </div>
        )}

        {order.auto_release_at && order.status === 'delivered' && (
          <AutoReleaseTimer autoReleaseAt={order.auto_release_at} />
        )}

        {proofs && proofs.length > 0 && (
          <div>
            <p className="text-gray-400 text-sm mb-2">Delivery proof:</p>
            <div className="grid grid-cols-2 gap-2">
              {proofs.flatMap(p => p.screenshot_urls).map((url: string, j: number) => (
                <div key={j} className="relative h-32 rounded-lg overflow-hidden bg-background">
                  <Image src={url} alt="delivery proof" fill className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {isSeller && order.status === 'paid_escrow' && (
          <ProofUpload orderId={id} />
        )}

        {isBuyer && order.status === 'delivered' && (
          <div className="space-y-3">
            <form action={async () => {
              'use server'
              await buyerConfirmReceived(id)
            }}>
              <button className="w-full px-4 py-2 rounded-lg bg-accent text-black font-semibold">
                Confirm Received
              </button>
            </form>
            <details className="group">
              <summary className="cursor-pointer text-red-400 text-sm hover:text-red-300">
                Open a dispute
              </summary>
              <form
                action={async (fd: FormData) => {
                  'use server'
                  await openDispute(id, fd.get('reason') as string)
                }}
                className="mt-3 space-y-2"
              >
                <textarea
                  name="reason"
                  required
                  rows={3}
                  placeholder="Describe the issue..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm resize-none"
                />
                <button className="px-4 py-2 rounded-lg border border-red-700 text-red-400 text-sm font-semibold hover:bg-red-900/20">
                  Submit Dispute
                </button>
              </form>
            </details>
          </div>
        )}

        {order.status === 'disputed' && (
          <div className="rounded-lg bg-red-900/20 border border-red-700 p-3">
            <p className="text-red-400 text-sm">This order is under dispute. Admin is reviewing.</p>
          </div>
        )}

        {order.status === 'completed' && (
          <div className="rounded-lg bg-green-900/20 border border-green-700 p-3">
            <p className="text-green-400 text-sm">Order completed successfully.</p>
          </div>
        )}
      </div>
    </div>
  )
}
