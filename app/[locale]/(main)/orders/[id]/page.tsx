import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AutoReleaseTimer } from '@/components/orders/AutoReleaseTimer'
import { ProofUpload } from '@/components/orders/ProofUpload'
import { ChatWindow } from '@/components/orders/ChatWindow'
import { buyerConfirmReceived, openDispute } from '@/lib/actions/orders'
import type { Message } from '@/lib/types'

const STEPS = [
  { key: 'paid_escrow', label: 'Paid' },
  { key: 'delivered',   label: 'Delivery' },
  { key: 'confirmed',   label: 'Confirm' },
  { key: 'completed',   label: 'Complete' },
]

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    paid_escrow: 0,
    delivered:   1,
    confirmed:   2,
    completed:   3,
  }
  return map[status] ?? -1
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user
  if (!user) redirect('/login')

  const { data: order } = await supabase
    .from('orders')
    .select('*, listings(title, images, description), buyer:profiles!buyer_id(username, avatar_url), seller:profiles!seller_id(username, avatar_url)')
    .eq('id', id)
    .single()
  if (!order) notFound()

  const isBuyer  = user.id === order.buyer_id
  const isSeller = user.id === order.seller_id
  if (!isBuyer && !isSeller) notFound()

  const [{ data: proofs }, { data: conversation }] = await Promise.all([
    supabase.from('order_proofs').select('screenshot_urls').eq('order_id', id),
    supabase.from('conversations').select('id, messages(id, body, created_at, sender_id)').eq('order_id', id).order('created_at', { referencedTable: 'messages', ascending: true }).single(),
  ])

  const initialMessages: Message[] = (conversation?.messages ?? []) as Message[]

  const stepIndex   = getStepIndex(order.status)
  const isDisputed  = order.status === 'disputed'
  const isCancelled = order.status === 'cancelled'
  const counterparty = isBuyer ? (order as any).seller : (order as any).buyer
  const counterRole  = isBuyer ? 'Seller' : 'Buyer'
  const itemImage    = (order as any).listings?.images?.[0]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-xs">
          <Link href="/orders" className="text-gray-500 hover:text-accent transition-colors">Orders</Link>
          <span className="text-gray-700">/</span>
          <span className="text-gray-400 font-mono">#{id.slice(0, 8).toUpperCase()}</span>
        </div>
        {isBuyer
          ? <span className="px-2 py-0.5 rounded bg-blue-900/30 border border-blue-700/40 text-blue-400 text-xs font-medium">Buying</span>
          : <span className="px-2 py-0.5 rounded bg-accent/10 border border-accent/30 text-accent text-xs font-medium">Selling</span>
        }
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-5">

        {/* Left — Order info */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Progress stepper */}
          {!isDisputed && !isCancelled && (
            <div className="rounded-xl border border-border bg-surface px-4 py-4">
              <div className="flex items-center">
                {STEPS.map((step, i) => {
                  const done    = i < stepIndex
                  const current = i === stepIndex
                  return (
                    <div key={step.key} className="flex items-center flex-1">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                          done    ? 'bg-accent border-accent text-black' :
                          current ? 'bg-accent/10 border-accent text-accent' :
                                    'bg-background border-border text-gray-600'
                        }`}>
                          {done ? (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : i + 1}
                        </div>
                        <span className={`text-[10px] font-medium text-center ${current ? 'text-accent' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                          {step.label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1.5 mb-4 rounded-full ${done ? 'bg-accent' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Disputed / Cancelled */}
          {isDisputed && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div>
                <p className="text-red-400 text-sm font-semibold">Dispute Open</p>
                <p className="text-gray-500 text-xs">Admin is reviewing this order.</p>
              </div>
            </div>
          )}
          {isCancelled && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3">
              <p className="text-gray-500 text-sm">This order has been cancelled.</p>
            </div>
          )}

          {/* Item card */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Item</p>
              <p className="text-gray-600 text-xs">
                {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="px-4 py-4 flex gap-4">
              <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-background shrink-0">
                {itemImage ? (
                  <Image src={itemImage} alt="" fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{(order as any).listings?.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1.5">
                    <div className="relative w-5 h-5 rounded-full bg-background overflow-hidden shrink-0">
                      {counterparty?.avatar_url ? (
                        <Image src={counterparty.avatar_url} alt="" fill unoptimized className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 text-[10px] font-bold">
                          {(counterparty?.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="text-gray-500 text-xs">{counterparty?.username ?? 'Anonymous'}</span>
                    <span className="text-gray-700 text-xs">· {counterRole}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-accent-gold text-sm font-bold">{order.amount} coin</p>
              </div>
            </div>
          </div>

          {/* Paid from balance — seller notice */}
          {order.status === 'paid_escrow' && isSeller && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Payment received</p>
                <p className="text-gray-500 text-xs">{order.amount} coin deducted from buyer's Coin Wallet. Please deliver the item.</p>
              </div>
            </div>
          )}

          {/* Paid from balance — buyer notice */}
          {order.status === 'paid_escrow' && isBuyer && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-semibold">Waiting for delivery</p>
                <p className="text-gray-500 text-xs">{order.amount} coin deducted from your Coin Wallet. Seller will deliver soon.</p>
              </div>
            </div>
          )}

          {/* Auto-release timer */}
          {order.auto_release_at && order.status === 'delivered' && (
            <AutoReleaseTimer autoReleaseAt={order.auto_release_at} />
          )}

          {/* Delivery proof upload (seller) */}
          {isSeller && order.status === 'paid_escrow' && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-white text-sm font-semibold">Upload Delivery Proof</p>
                <p className="text-gray-500 text-xs">Screenshot showing you've delivered the item.</p>
              </div>
              <div className="px-4 py-4">
                <ProofUpload orderId={id} />
              </div>
            </div>
          )}

          {/* View proofs */}
          {proofs && proofs.length > 0 && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Delivery Proof</p>
              </div>
              <div className="px-4 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {proofs.flatMap(p => p.screenshot_urls).map((url: string, j: number) => (
                  <div key={j} className="relative aspect-video rounded-lg overflow-hidden bg-background">
                    <Image src={url} alt="proof" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyer confirm / dispute */}
          {isBuyer && order.status === 'delivered' && (
            <div className="rounded-xl border border-border bg-surface overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-white text-sm font-semibold">Confirm Receipt</p>
                <p className="text-gray-500 text-xs">Confirming will release payment to the seller.</p>
              </div>
              <div className="px-4 py-4 space-y-3">
                <form action={async () => {
                  'use server'
                  await buyerConfirmReceived(id)
                }}>
                  <button className="px-4 py-1.5 rounded-lg bg-success text-black text-xs font-bold hover:bg-success-hover transition-colors">
                    Confirm Received
                  </button>
                </form>
                <details className="group">
                  <summary className="cursor-pointer text-red-400 text-xs hover:text-red-300 list-none flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    Something wrong? Open a dispute
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
                      className="w-full px-3 py-2 rounded-lg bg-background border border-border text-white text-sm placeholder-gray-600 resize-none focus:outline-none focus:border-red-500 transition-colors"
                    />
                    <button className="px-4 py-1.5 rounded-lg border border-red-700/50 text-red-400 text-xs font-bold hover:bg-red-900/20 transition-colors">
                      Submit Dispute
                    </button>
                  </form>
                </details>
              </div>
            </div>
          )}

          {/* Completed */}
          {order.status === 'completed' && (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-400 text-sm font-semibold">Order completed</p>
            </div>
          )}

        </div>

        {/* Right — Chat */}
        {conversation && (
          <div className="lg:w-95 shrink-0">
            <div className="lg:sticky lg:top-24">
              <ChatWindow
                conversationId={conversation.id}
                initialMessages={initialMessages}
                currentUserId={user.id}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
