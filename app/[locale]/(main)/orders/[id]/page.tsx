import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { AutoReleaseTimer } from '@/components/orders/AutoReleaseTimer'
import { ProofUpload } from '@/components/orders/ProofUpload'
import { ChatWindow } from '@/components/orders/ChatWindow'
import { PaymentSection } from '@/components/orders/PaymentSection'
import { buyerConfirmReceived, openDispute } from '@/lib/actions/orders'
import type { Message } from '@/lib/types'

const IS_TESTNET = process.env.NEXT_PUBLIC_IS_TESTNET === 'true'

const STEPS = [
  { key: 'awaiting_payment', label: 'Payment' },
  { key: 'paid_escrow',      label: 'In Escrow' },
  { key: 'delivered',        label: 'Delivered' },
  { key: 'completed',        label: 'Complete' },
]

function getStepIndex(status: string) {
  const map: Record<string, number> = {
    awaiting_payment: 0,
    paid_escrow: 1,
    delivered: 2,
    completed: 3,
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
  const { data: { user } } = await supabase.auth.getUser()
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

  const [{ data: proofs }, { data: conversation }, { data: escrowSettings }] = await Promise.all([
    supabase.from('order_proofs').select('screenshot_urls').eq('order_id', id),
    supabase.from('conversations').select('id').eq('order_id', id).single(),
    supabase.from('platform_settings').select('key, value').in('key', ['escrow_wallet_address', 'escrow_wallet_network']),
  ])

  const addrKey    = IS_TESTNET ? 'escrow_wallet_address_testnet' : 'escrow_wallet_address'
  const networkKey = IS_TESTNET ? 'escrow_wallet_network_testnet' : 'escrow_wallet_network'
  const escrowAddress = escrowSettings?.find(s => s.key === addrKey)?.value ?? ''
  const escrowNetwork = escrowSettings?.find(s => s.key === networkKey)?.value ?? 'TRC20'

  let initialMessages: Message[] = []
  if (conversation) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, body, created_at, sender_id')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
    initialMessages = (msgs ?? []) as Message[]
  }

  const stepIndex   = getStepIndex(order.status)
  const isDisputed  = order.status === 'disputed'
  const isCancelled = order.status === 'cancelled'
  const counterparty = isBuyer ? (order as any).seller : (order as any).buyer
  const counterRole  = isBuyer ? 'Seller' : 'Buyer'
  const itemImage    = (order as any).listings?.images?.[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

      {/* Back + title */}
      <div className="flex items-center gap-3">
        <Link href="/orders" className="p-2 rounded-xl border border-border text-gray-500 hover:text-white hover:border-accent transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-lg font-bold text-white">Order Detail</h1>
          <p className="text-gray-600 text-xs font-mono">#{id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="ml-auto">
          {isBuyer
            ? <span className="px-2.5 py-1 rounded-full bg-blue-900/30 border border-blue-700/40 text-blue-400 text-xs font-medium">Buying</span>
            : <span className="px-2.5 py-1 rounded-full bg-accent/10 border border-accent/30 text-accent text-xs font-medium">Selling</span>
          }
        </div>
      </div>

      {/* Progress stepper */}
      {!isDisputed && !isCancelled && (
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center">
            {STEPS.map((step, i) => {
              const done    = i < stepIndex
              const current = i === stepIndex
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                      done    ? 'bg-accent border-accent text-black' :
                      current ? 'bg-accent/10 border-accent text-accent' :
                                'bg-background border-border text-gray-600'
                    }`}>
                      {done ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : i + 1}
                    </div>
                    <span className={`text-xs font-medium text-center ${current ? 'text-accent' : done ? 'text-gray-400' : 'text-gray-600'}`}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 rounded-full transition-colors ${done ? 'bg-accent' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Disputed / Cancelled banner */}
      {isDisputed && (
        <div className="rounded-xl border border-red-700/50 bg-red-900/10 p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <div>
            <p className="text-red-400 font-semibold text-sm">Dispute Open</p>
            <p className="text-gray-400 text-xs mt-0.5">Admin is reviewing this order. We'll contact you soon.</p>
          </div>
        </div>
      )}
      {isCancelled && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-gray-500 text-sm">This order has been cancelled.</p>
        </div>
      )}

      {/* Item card */}
      <div className="rounded-xl border border-border bg-surface p-4 flex gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-background shrink-0">
          {itemImage ? (
            <img src={itemImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-700">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold truncate">{(order as any).listings?.title}</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-accent font-bold text-lg">{order.amount}</p>
          <p className="text-gray-500 text-xs">USD</p>
        </div>
      </div>

      {/* Counterparty */}
      <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-background overflow-hidden shrink-0">
          {counterparty?.avatar_url ? (
            <img src={counterparty.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-600 text-sm font-bold">
              {(counterparty?.username || '?')[0].toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <p className="text-white text-sm font-medium">{counterparty?.username ?? 'Anonymous'}</p>
          <p className="text-gray-500 text-xs">{counterRole}</p>
        </div>
      </div>

      {/* Payment instructions (buyer, awaiting) */}
      {order.status === 'awaiting_payment' && isBuyer && (
        <PaymentSection
          orderId={id}
          amount={order.amount}
          escrowAddress={escrowAddress}
          escrowNetwork={escrowNetwork}
          isTestnet={IS_TESTNET}
          alreadyNotified={!!(order as any).payment_notified_at}
        />
      )}

      {/* Payment pending (seller view) */}
      {order.status === 'awaiting_payment' && isSeller && (
        <div className="rounded-xl border border-border bg-surface p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-white text-sm font-medium">Waiting for buyer payment</p>
            <p className="text-gray-500 text-xs mt-0.5">You will be notified once payment is confirmed.</p>
          </div>
          {(order as any).payment_notified_at && (
            <span className="ml-auto shrink-0 px-2 py-1 rounded-full bg-yellow-900/30 border border-yellow-700/40 text-yellow-400 text-xs font-medium">
              Buyer notified
            </span>
          )}
        </div>
      )}

      {/* Auto-release timer */}
      {order.auto_release_at && order.status === 'delivered' && (
        <AutoReleaseTimer autoReleaseAt={order.auto_release_at} />
      )}

      {/* Delivery proof (seller can upload) */}
      {isSeller && order.status === 'paid_escrow' && (
        <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
          <p className="text-white font-semibold text-sm">Upload Delivery Proof</p>
          <p className="text-gray-500 text-xs">Screenshot showing you've delivered the item to the buyer.</p>
          <ProofUpload orderId={id} />
        </div>
      )}

      {/* View proofs */}
      {proofs && proofs.length > 0 && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <p className="text-gray-400 text-sm font-medium">Delivery Proof</p>
          <div className="grid grid-cols-2 gap-2">
            {proofs.flatMap(p => p.screenshot_urls).map((url: string, j: number) => (
              <div key={j} className="relative aspect-video rounded-lg overflow-hidden bg-background">
                <Image src={url} alt="proof" fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Buyer actions (delivered) */}
      {isBuyer && order.status === 'delivered' && (
        <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 space-y-4">
          <div>
            <p className="text-white font-semibold">Did you receive the item?</p>
            <p className="text-gray-400 text-xs mt-1">Confirming will release payment to the seller.</p>
          </div>
          <form action={async () => {
            'use server'
            await buyerConfirmReceived(id)
          }}>
            <button className="w-full py-3 rounded-xl bg-accent text-black font-bold hover:opacity-90 transition-opacity">
              Yes, Confirm Received
            </button>
          </form>
          <details className="group">
            <summary className="cursor-pointer text-red-400 text-sm hover:text-red-300 list-none flex items-center gap-1">
              <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                placeholder="Describe the issue in detail..."
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-white text-sm resize-none focus:outline-none focus:border-red-500 placeholder-gray-600"
              />
              <button className="px-4 py-2 rounded-xl border border-red-700/50 text-red-400 text-sm font-semibold hover:bg-red-900/20 transition-colors">
                Submit Dispute
              </button>
            </form>
          </details>
        </div>
      )}

      {/* Completed */}
      {order.status === 'completed' && (
        <div className="rounded-xl border border-green-700/40 bg-green-900/10 p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-green-400 font-medium text-sm">Order completed successfully</p>
        </div>
      )}

      {/* Chat */}
      {conversation && (
        <ChatWindow
          conversationId={conversation.id}
          initialMessages={initialMessages}
          currentUserId={user.id}
        />
      )}
    </div>
  )
}
