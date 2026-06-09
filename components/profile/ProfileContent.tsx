'use client'
import Image from 'next/image'
import { useState } from 'react'
import Link from 'next/link'
import { WalletAddressForm } from '@/components/wallet/WalletAddressForm'
import { DepositWalletForm } from '@/components/wallet/DepositWalletForm'
import { KYCForm } from '@/components/kyc/KYCForm'
import { EmailForm } from '@/components/profile/EmailForm'
import type { KYCStatus, ProfileOrder } from '@/lib/types'

type Tab = 'personal' | 'security' | 'wallet' | 'purchases' | 'sales' | 'kyc'

interface ProfileData {
  displayName: string
  displayAvatar: string | null
  email: string | null
  memberSince: string | null
  isSeller: boolean
  kycStatus: string | null
  walletAddress: string | null
  walletNetwork: string | null
  depositWallet: string | null
  depositWalletNetwork: string | null
  amoBalance: number
  completedSales: number
  totalEarnings: number
  activeListings: number
  totalBalance: number
  buyerOrders: ProfileOrder[]
  sellerOrders: ProfileOrder[]
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  hasRealEmail: boolean
  currentEmail: string | null
  pendingEmail: string | null
  isOAuthOnly: boolean
}

const MENU_ITEMS: { key: Tab; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal Info', icon: 'M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z' },
  { key: 'security', label: 'Security', icon: 'M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z' },
  { key: 'wallet', label: 'Wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { key: 'purchases', label: 'Purchases', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
  { key: 'sales', label: 'Sales', icon: 'M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016A3.001 3.001 0 0021 9.349m-18 0a2.999 2.999 0 00.97-1.599L4.72 4.5h14.56l.75 3.25a3 3 0 00.97 1.599' },
  { key: 'kyc', label: 'Become a Seller', icon: 'M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z' },
]

function orderStatusColor(status: string) {
  if (status === 'completed') return 'text-green-400'
  if (status === 'cancelled') return 'text-gray-500'
  if (status === 'disputed')  return 'text-red-400'
  return 'text-gray-400'
}

function kycStatusLabel(status: string | null) {
  if (status === 'approved') return <span className="text-green-400 text-xs font-medium">Approved</span>
  if (status === 'pending') return <span className="text-yellow-400 text-xs font-medium">Pending review</span>
  return <span className="text-gray-500 text-xs">Not submitted</span>
}

function PersonalSection({ data }: Readonly<{ data: ProfileData }>) {
  return (
    <div className="space-y-4">
      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Profile</p>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-gray-500 text-xs">Username</p>
            <p className="text-white text-sm">{data.displayName}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-gray-500 text-xs">Email</p>
            <p className="text-white text-sm">{data.currentEmail ?? <span className="text-gray-600">Not set</span>}</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-gray-500 text-xs">Role</p>
            <p className="text-white text-sm">{data.isSeller ? 'Seller' : 'Buyer'}</p>
          </div>
          {data.memberSince && (
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-gray-500 text-xs">Joined</p>
              <p className="text-white text-sm">{data.memberSince}</p>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-gray-500 text-xs">Seller status</p>
            {kycStatusLabel(data.kycStatus)}
          </div>
        </div>
      </div>
    </div>
  )
}

function SecuritySection({ isOAuthOnly, hasRealEmail, currentEmail, pendingEmail }: Readonly<{
  isOAuthOnly: boolean
  hasRealEmail: boolean
  currentEmail: string | null
  pendingEmail: string | null
}>) {
  return (
    <div className="space-y-4">

      {/* Email */}
      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Recovery Email</p>
          {hasRealEmail && <span className="text-green-400 text-xs font-medium">Verified</span>}
          {pendingEmail && !hasRealEmail && <span className="text-yellow-400 text-xs font-medium">Pending</span>}
        </div>
        <div className="px-4 py-4 space-y-4">
          {isOAuthOnly ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-white text-sm">{currentEmail}</p>
                <p className="text-gray-500 text-xs">Managed by your login provider</p>
              </div>
            </div>
          ) : hasRealEmail ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-white text-sm">{currentEmail}</p>
            </div>
          ) : pendingEmail ? (
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-white text-sm">{pendingEmail}</p>
                <p className="text-yellow-400 text-xs">Check your inbox and click the verification link</p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-yellow-700/40 bg-yellow-900/10 px-3 py-2.5 flex items-start gap-2">
              <svg className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <p className="text-yellow-300 text-xs leading-relaxed">
                No email set — if you forget your password your account will be permanently inaccessible.
              </p>
            </div>
          )}

          {!isOAuthOnly && (
            <EmailForm currentEmail={hasRealEmail ? currentEmail : null} />
          )}
        </div>
      </div>

      {/* Password */}
      {isOAuthOnly ? (
        <div className="rounded border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Password</p>
          </div>
          <div className="px-4 py-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-surface-2 border border-border flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Signed in with Google</p>
              <p className="text-gray-600 text-xs">Password login is not available for Google accounts.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded border border-border bg-surface overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Password</p>
          </div>
          <div className="px-4 py-4">
            {hasRealEmail ? (
              <>
                <p className="text-gray-400 text-sm">To change your password, use the password reset flow.</p>
                <Link href="/forgot-password" className="inline-block mt-2 text-accent text-xs hover:underline">
                  Reset password →
                </Link>
              </>
            ) : (
              <p className="text-gray-600 text-sm">Set a recovery email above to enable password reset.</p>
            )}
          </div>
        </div>
      )}

      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Two-factor authentication</p>
        </div>
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
              <svg className="w-4 h-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div>
              <p className="text-white text-sm">Not enabled</p>
              <p className="text-gray-500 text-xs">2FA will be available soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WalletSection({ data }: Readonly<{ data: ProfileData }>) {
  return (
    <div className="space-y-4">
      {/* Balance */}
      <div className="rounded border border-border bg-surface overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Balance</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-2xl font-bold text-accent">{data.amoBalance.toFixed(2)} <span className="text-base font-medium text-gray-500">coin</span></p>
          {data.isSeller && (
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
              <div>
                <p className="text-gray-500 text-xs">Sales</p>
                <p className="text-white text-sm font-bold mt-0.5">{data.completedSales}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Earnings</p>
                <p className="text-white text-sm font-bold mt-0.5">{data.totalEarnings.toFixed(0)} coin</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Pending</p>
                <p className="text-white text-sm font-bold mt-0.5">{data.totalBalance.toFixed(2)} coin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Deposit wallet */}
      <div className="rounded border border-border bg-surface">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-white text-sm font-semibold">Deposit Sender Address</p>
          <p className="text-gray-500 text-xs">The wallet address you send coin from.</p>
        </div>
        <div className="px-4 py-4">
          <DepositWalletForm
            currentAddress={data.depositWallet}
            currentNetwork={data.depositWalletNetwork}
          />
        </div>
      </div>

      {/* Withdraw wallet */}
      <div className="rounded border border-border bg-surface">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-white text-sm font-semibold">Withdraw Wallet (Payout)</p>
          <p className="text-gray-500 text-xs">Coin from your sales will be sent here.</p>
        </div>
        <div className="px-4 py-4">
          <WalletAddressForm
            currentAddress={data.walletAddress}
            currentNetwork={data.walletNetwork}
          />
        </div>
      </div>
    </div>
  )
}

const PER_PAGE = 5

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'awaiting_payment', label: 'Awaiting Payment' },
  { value: 'paid_escrow', label: 'Awaiting Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'completed', label: 'Completed' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'cancelled', label: 'Cancelled' },
]

function OrderList({ orders, emptyText, emptyLink, emptyLinkText }: Readonly<{ orders: ProfileOrder[]; emptyText: string; emptyLink: string; emptyLinkText: string }>) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)

  const filtered = orders.filter(o => {
    const matchSearch = !search || (o.listings?.title ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || o.status === statusFilter
    return matchSearch && matchStatus
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  // Reset page when filter changes
  const handleSearch = (v: string) => { setSearch(v); setPage(1) }
  const handleStatus = (v: string) => { setStatusFilter(v); setPage(1) }

  if (!orders.length) {
    return (
      <div className="rounded border border-border bg-surface p-8 text-center">
        <p className="text-gray-500 text-sm">{emptyText}</p>
        <Link href={emptyLink} className="mt-2 inline-block text-accent text-sm hover:underline">{emptyLinkText}</Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search by item name..."
            className="w-full px-3 py-2 rounded bg-background border border-border text-white text-sm placeholder-gray-600 focus:outline-none focus:border-accent transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => handleStatus(e.target.value)}
          className="px-3 py-2.5 rounded bg-background border border-border text-white text-sm appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%236b7280%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-size-[16px] bg-position-[right_0.75rem_center] bg-no-repeat pr-8 focus:outline-none focus:border-accent transition-colors"
        >
          {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Results */}
      {paginated.length === 0 ? (
        <div className="rounded border border-border bg-surface p-6 text-center">
          <p className="text-gray-500 text-sm">No results found.</p>
        </div>
      ) : (
        <div className="rounded border border-border bg-surface divide-y divide-border overflow-hidden">
          {paginated.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="relative w-10 h-10 rounded overflow-hidden bg-background shrink-0">
                {o.listings?.images?.[0]
                  ? <Image src={o.listings.images[0]} alt="" fill className="object-cover" />
                  : <div className="w-full h-full bg-background" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm truncate">{o.listings?.title ?? 'Untitled'}</p>
                <p className="text-gray-600 text-xs">
                  {new Date(o.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-white text-sm font-medium">{Number(o.amount).toFixed(2)} coin</p>
                <p className={`text-xs capitalize ${orderStatusColor(o.status)}`}>
                  {o.status.replaceAll('_', ' ')}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600 text-xs">
          {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          {totalPages > 0 && <span> · Page {page} of {totalPages}</span>}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-2 py-1 rounded border border-border text-xs text-gray-400 hover:text-white hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            ←
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium transition-colors ${
                p === page ? 'bg-accent text-black' : 'border border-border text-gray-400 hover:text-white hover:border-accent/50'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-2 py-1 rounded border border-border text-xs text-gray-400 hover:text-white hover:border-accent/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            →
          </button>
        </div>
      </div>
    </div>
  )
}

function PurchasesSection({ orders }: Readonly<{ orders: ProfileOrder[] }>) {
  return <OrderList orders={orders} emptyText="No purchases yet." emptyLink="/market" emptyLinkText="Browse market →" />
}

function SalesSection({ orders }: Readonly<{ orders: ProfileOrder[] }>) {
  return <OrderList orders={orders} emptyText="No sales yet." emptyLink="/listings/new" emptyLinkText="Create a listing →" />
}

function KYCSection({ data }: Readonly<{ data: ProfileData }>) {
  return (
    <KYCForm
      currentStatus={(data.kycStatus ?? 'none') as KYCStatus}
      submittedAt={data.kycSubmittedAt}
      reviewedAt={data.kycReviewedAt}
      hasEmail={data.hasRealEmail}
    />
  )
}

export function ProfileContent({ data }: Readonly<{ data: ProfileData }>) {
  const [activeTab, setActiveTab] = useState<Tab>('personal')

  return (
    <div className="flex flex-col lg:flex-row gap-6">

      {/* Sidebar */}
      <aside className="lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-0 space-y-4">

          <div className="flex items-center gap-3 p-4 rounded border border-border bg-surface">
            {data.displayAvatar
              ? <Image src={data.displayAvatar} alt="" width={44} height={44} unoptimized className="rounded-full object-cover shrink-0" />
              : (
                <div className="w-11 h-11 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm font-black shrink-0">
                  {data.displayName[0].toUpperCase()}
                </div>
              )
            }
            <div className="min-w-0">
              <p className="text-white text-sm font-bold truncate">{data.displayName}</p>
              {data.memberSince && <p className="text-gray-600 text-xs">Joined {data.memberSince}</p>}
            </div>
          </div>

          <nav className="rounded border border-border bg-surface overflow-hidden">
            {MENU_ITEMS.map(({ key, label, icon }) => {
              const showAlert = key === 'security' && !data.isOAuthOnly && !data.hasRealEmail
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors border-l-2 text-left ${
                    activeTab === key
                      ? 'text-white bg-white/3 border-accent'
                      : 'text-gray-400 hover:text-white hover:bg-white/2 border-transparent'
                  }`}
                >
                  <svg className={`w-4 h-4 ${activeTab === key ? 'text-accent' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  <span className="flex-1">{label}</span>
                  {showAlert && <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
                </button>
              )
            })}
          </nav>

        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {activeTab === 'personal' && <PersonalSection data={data} />}
        {activeTab === 'security' && <SecuritySection isOAuthOnly={data.isOAuthOnly} hasRealEmail={data.hasRealEmail} currentEmail={data.currentEmail} pendingEmail={data.pendingEmail} />}
        {activeTab === 'wallet' && <WalletSection data={data} />}
        {activeTab === 'purchases' && <PurchasesSection orders={data.buyerOrders} />}
        {activeTab === 'sales' && <SalesSection orders={data.sellerOrders} />}
        {activeTab === 'kyc' && <KYCSection data={data} />}
      </main>
    </div>
  )
}
